import { useEffect, useState } from 'react';
import { Plus, X, Wand2 } from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingState, EmptyState } from '../components/ui.jsx';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EMPTY_BLOCK = { subject_id: '', day_of_week: 0, start_time: '17:00', end_time: '18:00' };
const EMPTY_GEN = {
  days: [0, 1, 2, 3, 4, 5, 6],
  dailyStart: '17:00',
  dailyEnd: '21:00',
  sessionMinutes: 45,
  breakMinutes: 15
};

export default function Timetable() {
  const [subjects, setSubjects] = useState([]);
  const [blocks, setBlocks] = useState(null);
  const [form, setForm] = useState(EMPTY_BLOCK);
  const [gen, setGen] = useState(EMPTY_GEN);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const data = await api.get('/subjects');
    setSubjects(data);
    if (data.length > 0) setForm((f) => ({ ...f, subject_id: data[0].id }));
    loadBlocks();
  }

  async function loadBlocks() {
    try {
      setBlocks(await api.get('/timetable'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!form.subject_id) return;
    try {
      await api.post('/timetable', form);
      loadBlocks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.del(`/timetable/${id}`);
      loadBlocks();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleGenDay(day) {
    setGen((g) => ({
      ...g,
      days: g.days.includes(day) ? g.days.filter((d) => d !== day) : [...g.days, day].sort()
    }));
  }

  async function handleGenerate() {
    setError('');
    setGenerating(true);
    try {
      await api.post('/timetable/generate', gen);
      await loadBlocks();
      setShowGenerator(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const blocksByDay = Array.from({ length: 7 }, (_, day) =>
    (blocks || []).filter((b) => b.day_of_week === day)
  );

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Timetable generator</h1>
          <p>Add study blocks by hand, or let it auto-build a week weighted toward your nearest exams and pending work.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowGenerator((v) => !v)}>
            <Wand2 size={16} /> Auto-generate
          </button>
        </div>
      </header>

      {subjects.length === 0 ? (
        <EmptyState>Add a subject first to start building your timetable.</EmptyState>
      ) : (
        <>
          {showGenerator && (
            <div className="card mb-16">
              <div className="section-title">Auto-generate settings</div>
              <div className="field">
                <label>Days to include</label>
                <div className="form-actions" style={{ flexWrap: 'wrap' }}>
                  {DAY_NAMES.map((name, idx) => (
                    <button
                      key={name}
                      type="button"
                      className={`btn btn-sm ${gen.days.includes(idx) ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => toggleGenDay(idx)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="g-start">Daily window start</label>
                  <input id="g-start" type="text" value={gen.dailyStart} onChange={(e) => setGen({ ...gen, dailyStart: e.target.value })} placeholder="17:00" />
                </div>
                <div className="field">
                  <label htmlFor="g-end">Daily window end</label>
                  <input id="g-end" type="text" value={gen.dailyEnd} onChange={(e) => setGen({ ...gen, dailyEnd: e.target.value })} placeholder="21:00" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="g-session">Session length (min)</label>
                  <input id="g-session" type="number" min={15} max={180} value={gen.sessionMinutes}
                    onChange={(e) => setGen({ ...gen, sessionMinutes: Number(e.target.value) || 45 })} />
                </div>
                <div className="field">
                  <label htmlFor="g-break">Break length (min)</label>
                  <input id="g-break" type="number" min={0} max={60} value={gen.breakMinutes}
                    onChange={(e) => setGen({ ...gen, breakMinutes: Number(e.target.value) || 15 })} />
                </div>
              </div>
              <p className="text-faint" style={{ fontSize: 12.5 }}>
                This weighs subjects by how close their exams are and how many assignments are pending, then fills
                your window proportionally. It replaces any previously auto-generated blocks — manual blocks are left alone.
              </p>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || gen.days.length === 0}>
                  {generating ? 'Generating…' : 'Generate'}
                </button>
                <button className="btn btn-ghost" onClick={() => setShowGenerator(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="card mb-16">
            <div className="section-title">Add a block manually</div>
            <form onSubmit={handleAdd} className="form-row" style={{ alignItems: 'end', flexWrap: 'wrap' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="b-subject">Subject</label>
                <select id="b-subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="b-day">Day</label>
                <select id="b-day" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}>
                  {DAY_NAMES.map((name, idx) => <option key={name} value={idx}>{name}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="b-start">Start</label>
                <input id="b-start" type="text" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} placeholder="17:00" style={{ width: 90 }} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="b-end">End</label>
                <input id="b-end" type="text" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} placeholder="18:00" style={{ width: 90 }} />
              </div>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Add</button>
            </form>
            {error && <div className="error-text">{error}</div>}
          </div>

          {blocks === null && <LoadingState />}

          {blocks && (
            <div className="timetable-grid">
              {DAY_NAMES.map((name, day) => (
                <div key={name} className="day-column">
                  <div className="day-heading">{name}</div>
                  {blocksByDay[day].length === 0 && <div className="text-faint" style={{ fontSize: 12, textAlign: 'center' }}>—</div>}
                  {blocksByDay[day].map((b) => (
                    <div key={b.id} className="block-chip" style={{ background: `${b.subject_color}22`, borderColor: `${b.subject_color}55` }}>
                      <button className="chip-del" onClick={() => handleDelete(b.id)} aria-label="Remove block"><X size={12} /></button>
                      <div className="chip-time">{b.start_time}–{b.end_time}</div>
                      <div className="chip-subject" style={{ color: b.subject_color }}>{b.subject_name}</div>
                      {!!b.auto_generated && <div className="chip-auto">auto</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
