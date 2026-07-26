import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingState, EmptyState, SubjectPill, StatCard } from '../components/ui.jsx';

const RADIUS = 112;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [sessionType, setSessionType] = useState('focus');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [recent, setRecent] = useState(null);
  const [message, setMessage] = useState('');

  const intervalRef = useRef(null);

  useEffect(() => { init(); return () => clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    if (!isRunning) {
      const mins = sessionType === 'focus' ? focusMinutes : breakMinutes;
      setTotalSeconds(mins * 60);
      setRemaining(mins * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionType, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            handleComplete();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  async function init() {
    const data = await api.get('/subjects');
    setSubjects(data);
    if (data.length > 0) setSubjectId(data[0].id);
    refreshStats();
  }

  async function refreshStats() {
    const today = await api.get('/timer/today');
    setTodaySeconds(today.totalSeconds);
    setRecent(await api.get('/timer/sessions'));
  }

  async function handleComplete() {
    setIsRunning(false);
    setMessage(sessionType === 'focus' ? 'Focus session complete — nice work.' : 'Break over — ready for another round?');
    await logSession(totalSeconds);
    const mins = sessionType === 'focus' ? focusMinutes : breakMinutes;
    setRemaining(mins * 60);
  }

  async function logSession(seconds) {
    if (!subjectId || seconds < 10) return;
    try {
      await api.post('/timer/sessions', { subject_id: subjectId, duration_seconds: seconds, session_type: sessionType });
      refreshStats();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function toggleRun() {
    if (!subjectId) {
      setMessage('Pick a subject first.');
      return;
    }
    setMessage('');
    setIsRunning((r) => !r);
  }

  function reset() {
    setIsRunning(false);
    const mins = sessionType === 'focus' ? focusMinutes : breakMinutes;
    setRemaining(mins * 60);
    setMessage('');
  }

  async function saveEarly() {
    const elapsed = totalSeconds - remaining;
    setIsRunning(false);
    await logSession(elapsed);
    setMessage('Session saved.');
    const mins = sessionType === 'focus' ? focusMinutes : breakMinutes;
    setRemaining(mins * 60);
  }

  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  const fractionElapsed = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const dashoffset = CIRCUMFERENCE * fractionElapsed;
  const elapsedSoFar = totalSeconds - remaining;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Study timer</h1>
          <p>Run a focused session, log it automatically, and watch today's total climb.</p>
        </div>
      </header>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          {subjects.length === 0 ? (
            <EmptyState>Add a subject first to start timing your study sessions.</EmptyState>
          ) : (
            <>
              <div className="field">
                <label htmlFor="t-subject">Subject</label>
                <select id="t-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={isRunning}>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-actions mb-16">
                <button
                  className={`btn ${sessionType === 'focus' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => !isRunning && setSessionType('focus')}
                  disabled={isRunning}
                >
                  Focus
                </button>
                <button
                  className={`btn ${sessionType === 'break' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => !isRunning && setSessionType('break')}
                  disabled={isRunning}
                >
                  Break
                </button>
              </div>

              <div className="form-row mb-16">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="focus-min">Focus length (min)</label>
                  <input id="focus-min" type="number" min={5} max={120} value={focusMinutes} disabled={isRunning}
                    onChange={(e) => setFocusMinutes(Math.max(5, Math.min(120, Number(e.target.value) || 25)))} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="break-min">Break length (min)</label>
                  <input id="break-min" type="number" min={1} max={60} value={breakMinutes} disabled={isRunning}
                    onChange={(e) => setBreakMinutes(Math.max(1, Math.min(60, Number(e.target.value) || 5)))} />
                </div>
              </div>

              <div className="timer-wrap">
                <div className="timer-ring-wrap">
                  <svg width="260" height="260" viewBox="0 0 260 260">
                    <circle cx="130" cy="130" r={RADIUS} fill="none" stroke="var(--bg-elevated-2)" strokeWidth="14" />
                    <circle
                      cx="130" cy="130" r={RADIUS} fill="none"
                      stroke={sessionType === 'focus' ? 'var(--gold)' : 'var(--blue)'}
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={dashoffset}
                      transform="rotate(-90 130 130)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="timer-digits">
                    <div className="readout" style={{ color: sessionType === 'focus' ? 'var(--gold)' : 'var(--blue)' }}>{mm}:{ss}</div>
                    <div className="mode-label">{sessionType}</div>
                  </div>
                </div>

                <div className="timer-controls">
                  <button className="btn btn-primary" onClick={toggleRun}>
                    {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
                  </button>
                  <button className="btn btn-ghost" onClick={reset}><RotateCcw size={16} /> Reset</button>
                  {!isRunning && elapsedSoFar >= 10 && (
                    <button className="btn btn-ghost" onClick={saveEarly}><Save size={16} /> Save session</button>
                  )}
                </div>

                {message && <div className="text-soft" style={{ fontSize: 13 }}>{message}</div>}
              </div>
            </>
          )}
        </div>

        <div>
          <div className="grid grid-2 mb-16">
            <StatCard label="Studied today" value={formatMinutes(todaySeconds)} />
            <StatCard label="Session length" value={`${sessionType === 'focus' ? focusMinutes : breakMinutes}m`} accent="blue" />
          </div>

          <div className="card">
            <div className="section-title">Recent sessions</div>
            {recent === null && <LoadingState />}
            {recent && recent.length === 0 && <EmptyState>No sessions logged yet.</EmptyState>}
            {recent && recent.length > 0 && (
              <div className="list">
                {recent.slice(0, 8).map((s) => (
                  <div key={s.id} className="row-card" style={{ padding: '10px 14px' }}>
                    <div className="row-main">
                      <div className="row-meta">
                        <SubjectPill name={s.subject_name} color={s.subject_color} />
                        <span>{s.session_type}</span>
                        <span>{formatMinutes(s.duration_seconds)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
