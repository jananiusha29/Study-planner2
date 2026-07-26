const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_STATUS = ['pending', 'in_progress', 'done'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

// GET /api/assignments?status=&subject_id=
router.get('/', (req, res) => {
  try {
    const { status, subject_id } = req.query;
    let query = `
      SELECT a.*, s.name AS subject_name, s.color AS subject_color
      FROM assignments a
      JOIN subjects s ON s.id = a.subject_id
      WHERE 1 = 1
    `;
    const params = [];
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (subject_id) {
      query += ' AND a.subject_id = ?';
      params.push(subject_id);
    }
    query += ' ORDER BY a.due_date ASC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

// POST /api/assignments
router.post('/', (req, res) => {
  const { subject_id, title, description, due_date, priority } = req.body;

  if (!subject_id || !title || !title.trim() || !due_date) {
    return res.status(400).json({ error: 'subject_id, title, and due_date are required' });
  }
  const finalPriority = VALID_PRIORITY.includes(priority) ? priority : 'medium';

  try {
    const info = db.prepare(`
      INSERT INTO assignments (subject_id, title, description, due_date, priority)
      VALUES (?, ?, ?, ?, ?)
    `).run(subject_id, title.trim(), (description || '').trim() || null, due_date, finalPriority);

    const row = db.prepare(`
      SELECT a.*, s.name AS subject_name, s.color AS subject_color
      FROM assignments a JOIN subjects s ON s.id = a.subject_id
      WHERE a.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT /api/assignments/:id
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });

    const { subject_id, title, description, due_date, priority, status } = req.body;

    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (priority && !VALID_PRIORITY.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    db.prepare(`
      UPDATE assignments
      SET subject_id = ?, title = ?, description = ?, due_date = ?, priority = ?, status = ?
      WHERE id = ?
    `).run(
      subject_id || existing.subject_id,
      title ? title.trim() : existing.title,
      description !== undefined ? (description.trim() || null) : existing.description,
      due_date || existing.due_date,
      priority || existing.priority,
      status || existing.status,
      req.params.id
    );

    const row = db.prepare(`
      SELECT a.*, s.name AS subject_name, s.color AS subject_color
      FROM assignments a JOIN subjects s ON s.id = a.subject_id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
