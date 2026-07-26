const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/timer/sessions?since=YYYY-MM-DD — defaults to last 14 days
router.get('/sessions', (req, res) => {
  try {
    const since = req.query.since || daysAgoISO(14);
    const rows = db.prepare(`
      SELECT t.*, s.name AS subject_name, s.color AS subject_color
      FROM study_sessions t
      JOIN subjects s ON s.id = t.subject_id
      WHERE date(t.completed_at) >= date(?)
      ORDER BY t.completed_at DESC
    `).all(since);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

// GET /api/timer/today — total focus seconds logged today
router.get('/today', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) AS totalSeconds
      FROM study_sessions
      WHERE session_type = 'focus' AND date(completed_at) = date('now')
    `).get();
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load today total' });
  }
});

// POST /api/timer/sessions
router.post('/sessions', (req, res) => {
  const { subject_id, duration_seconds, session_type } = req.body;

  if (!subject_id || !duration_seconds || duration_seconds <= 0) {
    return res.status(400).json({ error: 'subject_id and a positive duration_seconds are required' });
  }
  const type = session_type === 'break' ? 'break' : 'focus';

  try {
    const info = db.prepare(`
      INSERT INTO study_sessions (subject_id, duration_seconds, session_type)
      VALUES (?, ?, ?)
    `).run(subject_id, Math.round(duration_seconds), type);

    const row = db.prepare(`
      SELECT t.*, s.name AS subject_name, s.color AS subject_color
      FROM study_sessions t JOIN subjects s ON s.id = t.subject_id
      WHERE t.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log session' });
  }
});

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

module.exports = router;
