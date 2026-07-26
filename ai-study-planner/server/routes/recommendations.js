const express = require('express');
const router = express.Router();
const { getSubjectInsights } = require('../utils/insights');

// GET /api/recommendations
router.get('/', async (req, res) => {
  try {
    const insights = getSubjectInsights();
    const templatedSummary = buildTemplatedSummary(insights);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({
        mode: 'rules',
        generatedAt: new Date().toISOString(),
        subjects: insights,
        summary: templatedSummary
      });
    }

    try {
      const claudeSummary = await getClaudeSummary(insights);
      res.json({
        mode: 'claude',
        generatedAt: new Date().toISOString(),
        subjects: insights,
        summary: claudeSummary
      });
    } catch (err) {
      console.error('Claude recommendation call failed, falling back to rules engine:', err.message);
      res.json({
        mode: 'rules',
        generatedAt: new Date().toISOString(),
        subjects: insights,
        summary: templatedSummary
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build recommendations' });
  }
});

// A readable, deterministic summary built from the same insight data that
// would be sent to an LLM. This is what powers the app out of the box.
function buildTemplatedSummary(insights) {
  if (insights.length === 0) {
    return 'Add a subject to get personalized study recommendations.';
  }

  const active = insights.filter((s) => s.urgencyScore > 3).slice(0, 3);
  const focusList = active.length > 0 ? active : insights.slice(0, 1);

  const lines = focusList.map((s, i) => {
    const bits = [];
    if (s.nearestExam) {
      bits.push(`exam in ${s.nearestExam.daysAway} day${s.nearestExam.daysAway === 1 ? '' : 's'}`);
    }
    if (s.pendingAssignments > 0) {
      bits.push(`${s.pendingAssignments} pending assignment${s.pendingAssignments === 1 ? '' : 's'}`);
    }
    bits.push(`${s.studyMinutesLast7Days} min studied this week`);
    return `${i + 1}. ${s.subject} — ${bits.join(', ')}.`;
  });

  return ['Here is where to focus next:', ...lines].join('\n');
}

// Optional upgrade: if the user drops their own Anthropic API key into
// server/.env, turn the same structured insights into a short natural
// language plan using Claude.
async function getClaudeSummary(insights) {
  const prompt = `You are a supportive study coach. Based on this JSON describing a student's subjects (days until their next exam, pending assignments, and minutes studied in the last 7 days), write a short, specific, encouraging study plan for the next few days (3-4 sentences, no markdown headers, no bullet lists).

Data:
${JSON.stringify(insights, null, 2)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  return textBlock ? textBlock.text.trim() : templatedFallbackNotice();
}

function templatedFallbackNotice() {
  return 'Claude did not return a summary this time — showing rule-based recommendations instead.';
}

module.exports = router;
