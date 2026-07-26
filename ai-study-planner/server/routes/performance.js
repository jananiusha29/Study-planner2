const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/performance/overview?days=14
router.get('/overview', (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 14));

    const dailyRows = db.prepare(`
      SELECT date(completed_at) AS date, SUM(duration_seconds) AS totalSeconds
      FROM study_sessions
      WHERE session_type = 'focus' AND completed_at >= datetime('now', ?)
      GROUP BY date(completed_at)
    `).all(`-${days} days`);

    const trendMap = {};
    dailyRows.forEach((r) => { trendMap[r.date] = Math.round(r.totalSeconds / 60); });

    // Fill in every day in the range (even ones with no sessions) so the
    // line chart has a continuous, evenly-spaced axis.
    const dailyTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({ date: key, minutes: trendMap[key] || 0 });
    }

    const subjectTotals = db.prepare(`
      SELECT s.id, s.name AS subject, s.color,
             COALESCE(SUM(CASE WHEN t.session_type = 'focus' THEN t.duration_seconds ELSE 0 END), 0) AS totalSeconds
      FROM subjects s
      LEFT JOIN study_sessions t
        ON t.subject_id = s.id AND t.completed_at >= datetime('now', ?)
      GROUP BY s.id
      ORDER BY totalSeconds DESC
    `).all(`-${days} days`).map((r) => ({
      subject: r.subject,
      color: r.color,
      minutes: Math.round(r.totalSeconds / 60)
    }));

    const statusRows = db.prepare(`
      SELECT status, COUNT(*) AS count FROM assignments GROUP BY status
    `).all();
    const statusMap = { pending: 0, in_progress: 0, done: 0 };
    statusRows.forEach((r) => { statusMap[r.status] = r.count; });
    const assignmentStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    res.json({ days, dailyTrend, subjectTotals, assignmentStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load performance overview' });
  }
});

module.exports = router;
