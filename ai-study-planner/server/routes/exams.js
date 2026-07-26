const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/exams — sorted soonest first
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT e.*, s.name AS subject_name, s.color AS subject_color
      FROM exams e
      JOIN subjects s ON s.id = e.subject_id
      ORDER BY e.exam_date ASC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load exams' });
  }
});

// POST /api/exams
router.post('/', (req, res) => {
  const { subject_id, title, exam_date, notes } = req.body;
  if (!subject_id || !title || !title.trim() || !exam_date) {
    return res.status(400).json({ error: 'subject_id, title, and exam_date are required' });
  }
  try {
    const info = db.prepare(`
      INSERT INTO exams (subject_id, title, exam_date, notes)
      VALUES (?, ?, ?, ?)
    `).run(subject_id, title.trim(), exam_date, (notes || '').trim() || null);

    const row = db.prepare(`
      SELECT e.*, s.name AS subject_name, s.color AS subject_color
      FROM exams e JOIN subjects s ON s.id = e.subject_id
      WHERE e.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// PUT /api/exams/:id
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Exam not found' });

    const { subject_id, title, exam_date, notes } = req.body;

    db.prepare(`
      UPDATE exams SET subject_id = ?, title = ?, exam_date = ?, notes = ? WHERE id = ?
    `).run(
      subject_id || existing.subject_id,
      title ? title.trim() : existing.title,
      exam_date || existing.exam_date,
      notes !== undefined ? (notes.trim() || null) : existing.notes,
      req.params.id
    );

    const row = db.prepare(`
      SELECT e.*, s.name AS subject_name, s.color AS subject_color
      FROM exams e JOIN subjects s ON s.id = e.subject_id
      WHERE e.id = ?
    `).get(req.params.id);

    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// DELETE /api/exams/:id
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Exam not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

module.exports = router;
