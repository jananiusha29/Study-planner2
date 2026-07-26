const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/timetable
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT b.*, s.name AS subject_name, s.color AS subject_color
      FROM timetable_blocks b
      JOIN subjects s ON s.id = b.subject_id
      ORDER BY b.day_of_week ASC, b.start_time ASC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load timetable' });
  }
});

// POST /api/timetable — add a single manual block
router.post('/', (req, res) => {
  const { subject_id, day_of_week, start_time, end_time } = req.body;

  if (subject_id === undefined || day_of_week === undefined || !start_time || !end_time) {
    return res.status(400).json({ error: 'subject_id, day_of_week, start_time, end_time are required' });
  }
  if (toMinutes(end_time) <= toMinutes(start_time)) {
    return res.status(400).json({ error: 'end_time must be after start_time' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO timetable_blocks (subject_id, day_of_week, start_time, end_time, auto_generated)
      VALUES (?, ?, ?, ?, 0)
    `).run(subject_id, day_of_week, start_time, end_time);

    const row = db.prepare(`
      SELECT b.*, s.name AS subject_name, s.color AS subject_color
      FROM timetable_blocks b JOIN subjects s ON s.id = b.subject_id
      WHERE b.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add block' });
  }
});

// DELETE /api/timetable/:id
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM timetable_blocks WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Block not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete block' });
  }
});

// POST /api/timetable/generate — replace auto-generated blocks with a fresh,
// urgency-weighted schedule built around exams and pending assignments.
router.post('/generate', (req, res) => {
  try {
    const {
      days = [0, 1, 2, 3, 4, 5, 6],
      dailyStart = '17:00',
      dailyEnd = '21:00',
      sessionMinutes = 45,
      breakMinutes = 15
    } = req.body;

    const startMin = toMinutes(dailyStart);
    const endMin = toMinutes(dailyEnd);
    if (endMin - startMin < sessionMinutes) {
      return res.status(400).json({ error: 'Daily window is too short for one session' });
    }

    const subjects = db.prepare('SELECT * FROM subjects').all();
    if (subjects.length === 0) {
      return res.status(400).json({ error: 'Add at least one subject first' });
    }

    const weights = computeUrgencyWeights(subjects);

    // Existing manual blocks — auto-generated slots won't overlap these.
    const manualBlocks = db.prepare('SELECT * FROM timetable_blocks WHERE auto_generated = 0').all();

    // Carve out candidate slots across the selected days.
    const slots = [];
    for (const day of days) {
      let cursor = startMin;
      while (cursor + sessionMinutes <= endMin) {
        const slotStart = cursor;
        const slotEnd = cursor + sessionMinutes;
        const overlaps = manualBlocks.some((b) =>
          b.day_of_week === day &&
          slotStart < toMinutes(b.end_time) &&
          slotEnd > toMinutes(b.start_time)
        );
        if (!overlaps) {
          slots.push({ day_of_week: day, start_time: fromMinutes(slotStart), end_time: fromMinutes(slotEnd) });
        }
        cursor = slotEnd + breakMinutes;
      }
    }

    // Highest-averages (D'Hondt-style) apportionment: for each slot, assign
    // it to whichever subject currently has the largest weight-per-assigned-slot.
    const assignedCount = {};
    subjects.forEach((s) => { assignedCount[s.id] = 0; });

    const plan = slots.map((slot) => {
      let bestSubject = subjects[0];
      let bestScore = -Infinity;
      for (const s of subjects) {
        const score = weights[s.id] / (assignedCount[s.id] + 1);
        if (score > bestScore) {
          bestScore = score;
          bestSubject = s;
        }
      }
      assignedCount[bestSubject.id] += 1;
      return { ...slot, subject_id: bestSubject.id };
    });

    const clearAndInsert = db.transaction((rows) => {
      db.prepare('DELETE FROM timetable_blocks WHERE auto_generated = 1').run();
      const insert = db.prepare(`
        INSERT INTO timetable_blocks (subject_id, day_of_week, start_time, end_time, auto_generated)
        VALUES (?, ?, ?, ?, 1)
      `);
      for (const row of rows) {
        insert.run(row.subject_id, row.day_of_week, row.start_time, row.end_time);
      }
    });
    clearAndInsert(plan);

    const result = db.prepare(`
      SELECT b.*, s.name AS subject_name, s.color AS subject_color
      FROM timetable_blocks b
      JOIN subjects s ON s.id = b.subject_id
      ORDER BY b.day_of_week ASC, b.start_time ASC
    `).all();

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
});

// Weight each subject by how urgently it needs study time: closer exams and
// more (or more pressing) pending assignments push the weight up.
function computeUrgencyWeights(subjects) {
  const weights = {};

  for (const subject of subjects) {
    const nearestExam = db.prepare(`
      SELECT MIN(julianday(exam_date) - julianday('now')) AS daysAway
      FROM exams WHERE subject_id = ? AND exam_date >= date('now')
    `).get(subject.id);

    const pending = db.prepare(`
      SELECT COUNT(*) AS count, MIN(julianday(due_date) - julianday('now')) AS nearestDue
      FROM assignments WHERE subject_id = ? AND status != 'done'
    `).get(subject.id);

    const examDaysAway = nearestExam.daysAway;
    const examScore = examDaysAway !== null ? Math.max(0, 30 - examDaysAway) : 0;

    const dueDaysAway = pending.nearestDue;
    const dueScore = dueDaysAway !== null ? Math.max(0, 14 - dueDaysAway) : 0;
    const assignmentScore = pending.count * 5 + dueScore;

    // Every subject keeps a floor weight so it still gets some time on the timetable.
    weights[subject.id] = 3 + examScore * 2 + assignmentScore;
  }

  return weights;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = router;
