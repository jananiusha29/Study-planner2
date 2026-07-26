require('dotenv').config();
const express = require('express');
const cors = require('cors');

const subjectRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetable');
const assignmentRoutes = require('./routes/assignments');
const timerRoutes = require('./routes/timer');
const examRoutes = require('./routes/exams');
const recommendationRoutes = require('./routes/recommendations');
const performanceRoutes = require('./routes/performance');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/performance', performanceRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Study Planner API running at http://localhost:${PORT}`);
});
