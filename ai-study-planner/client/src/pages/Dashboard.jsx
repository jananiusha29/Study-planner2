import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Cpu } from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingState, EmptyState, StatCard, SubjectPill, Badge, formatDate } from '../components/ui.jsx';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function todayIndex() {
  const jsDay = new Date().getDay(); // 0 = Sunday
  return (jsDay + 6) % 7; // convert to 0 = Monday
}

function daysUntil(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

export default function Dashboard() {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [today, assignments, exams, timetable, recommendations] = await Promise.all([
        api.get('/timer/today'),
        api.get('/assignments?status=pending'),
        api.get('/exams'),
        api.get('/timetable'),
        api.get('/recommendations')
      ]);
      setState({ today, assignments, exams, timetable, recommendations });
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="error-text">{error}</div>;
  if (!state) return <LoadingState />;

  const day = todayIndex();
  const todaysBlocks = state.timetable.filter((b) => b.day_of_week === day);
  const upcomingExam = state.exams.find((e) => daysUntil(e.exam_date) >= 0);
  const topSubject = state.recommendations.subjects[0];

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Welcome back</h1>
          <p>Here's where things stand for {DAY_NAMES[day]}.</p>
        </div>
      </header>

      <div className="grid grid-4 mb-16">
        <StatCard label="Studied today" value={formatMinutes(state.today.totalSeconds)} />
        <StatCard label="Pending assignments" value={state.assignments.length} accent="coral" />
        <StatCard
          label={upcomingExam ? upcomingExam.subject_name : 'Next exam'}
          value={upcomingExam ? `${daysUntil(upcomingExam.exam_date)}d` : '—'}
          accent="gold"
        />
        <StatCard label="Subjects tracked" value={new Set(state.timetable.map((b) => b.subject_id)).size || '—'} accent="blue" />
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">Today's schedule</div>
          {todaysBlocks.length === 0 ? (
            <EmptyState>Nothing scheduled today — visit the <Link to="/timetable" style={{ color: 'var(--gold)' }}>timetable</Link> to add or auto-generate a plan.</EmptyState>
          ) : (
            <div className="list">
              {todaysBlocks.map((b) => (
                <div key={b.id} className="row-card" style={{ padding: '10px 14px' }}>
                  <div className="row-main">
                    <div className="row-meta">
                      <span style={{ fontFamily: 'var(--font-mono)', color: b.subject_color }}>{b.start_time}–{b.end_time}</span>
                      <SubjectPill name={b.subject_name} color={b.subject_color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Upcoming assignments</div>
          {state.assignments.length === 0 ? (
            <EmptyState>Nothing pending — you're caught up.</EmptyState>
          ) : (
            <div className="list">
              {state.assignments.slice(0, 5).map((a) => (
                <div key={a.id} className="row-card" style={{ padding: '10px 14px' }}>
                  <div className="row-main">
                    <div className="row-title" style={{ fontSize: 13.5 }}>{a.title}</div>
                    <div className="row-meta">
                      <SubjectPill name={a.subject_name} color={a.subject_color} />
                      <span>Due {formatDate(a.due_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-0" style={{ marginTop: 16 }}>
        <div className="mode-banner">
          {state.recommendations.mode === 'claude' ? (
            <Badge variant="gold"><Cpu size={11} style={{ marginRight: 2 }} /> Claude-powered</Badge>
          ) : (
            <Badge variant="muted"><Sparkles size={11} style={{ marginRight: 2 }} /> Rule-based engine</Badge>
          )}
          {topSubject && <span className="text-faint" style={{ fontSize: 12 }}>Top priority right now: <strong style={{ color: topSubject.color }}>{topSubject.subject}</strong></span>}
        </div>
        <p className="text-soft" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {state.recommendations.summary}
        </p>
        <Link to="/insights" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
          View full insights <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function formatMinutes(totalSeconds) {
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
