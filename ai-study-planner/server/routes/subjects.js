const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/subjects
router.get('/', (req, res) => {
  try {
    const subjects = db.prepare('SELECT * FROM subjects ORDER BY name').all();
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load subjects' });
  }
});

// POST /api/subjects
router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const info = db.prepare('INSERT INTO subjects (name, color) VALUES (?, ?)')
      .run(name.trim(), color || '#F2B84B');
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(subject);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A subject with that name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// PUT /api/subjects/:id
router.put('/:id', (req, res) => {
  const { name, color } = req.body;
  try {
    const existing = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Subject not found' });

    db.prepare('UPDATE subjects SET name = ?, color = ? WHERE id = ?').run(
      (name || existing.name).trim(),
      color || existing.color,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Subject not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

module.exports = router;
