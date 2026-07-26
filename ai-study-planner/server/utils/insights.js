const db = require('../db');

// Builds a ranked list of subjects with the signals that matter for study
// planning: nearest exam, pending assignments, and recent study time.
function getSubjectInsights() {
  const subjects = db.prepare('SELECT * FROM subjects').all();

  const insights = subjects.map((subject) => {
    const nearestExam = db.prepare(`
      SELECT title, exam_date, julianday(exam_date) - julianday('now') AS daysAway
      FROM exams
      WHERE subject_id = ? AND exam_date >= date('now')
      ORDER BY exam_date ASC LIMIT 1
    `).get(subject.id);

    const pending = db.prepare(`
      SELECT COUNT(*) AS count, MIN(julianday(due_date) - julianday('now')) AS nearestDue
      FROM assignments WHERE subject_id = ? AND status != 'done'
    `).get(subject.id);

    const studySeconds7d = db.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) AS totalSeconds
      FROM study_sessions
      WHERE subject_id = ? AND session_type = 'focus' AND completed_at >= datetime('now', '-7 days')
    `).get(subject.id).totalSeconds;

    const studyMinutes7d = Math.round(studySeconds7d / 60);
    const examDaysAway = nearestExam ? Math.max(0, Math.round(nearestExam.daysAway)) : null;
    const examScore = examDaysAway !== null ? Math.max(0, 30 - examDaysAway) : 0;
    const dueDaysAway = pending.nearestDue !== null ? Math.max(0, Math.round(pending.nearestDue)) : null;
    const dueScore = dueDaysAway !== null ? Math.max(0, 14 - dueDaysAway) : 0;
    const assignmentScore = pending.count * 5 + dueScore;
    const lowStudyBoost = studyMinutes7d < 60 ? 8 : studyMinutes7d < 120 ? 4 : 0;

    const urgencyScore = Math.round((examScore * 2 + assignmentScore + lowStudyBoost) * 10) / 10;

    return {
      subject_id: subject.id,
      subject: subject.name,
      color: subject.color,
      nearestExam: nearestExam
        ? { title: nearestExam.title, date: nearestExam.exam_date, daysAway: examDaysAway }
        : null,
      pendingAssignments: pending.count,
      nearestAssignmentDueDays: dueDaysAway,
      studyMinutesLast7Days: studyMinutes7d,
      urgencyScore
    };
  });

  return insights.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

module.exports = { getSubjectInsights };
