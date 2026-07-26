import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingState, EmptyState, SubjectPill, formatDate } from '../components/ui.jsx';

const EMPTY_FORM = { subject_id: '', title: '', exam_date: '', notes: '' };

function daysUntil(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

function urgencyAccent(days) {
  if (days <= 3) return { color: 'var(--coral)', shadow: 'rgba(255,111,89,0.3)' };
  if (days <= 10) return { color: 'var(--gold)', shadow: 'rgba(242,184,75,0.3)' };
  return { color: 'var(--mint)', shadow: 'rgba(126,217,168,0.3)' };
}

export default function Exams() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => { init(); }, []);

  async function init() {
    const data = await api.get('/subjects');
    setSubjects(data);
    if (data.length > 0) setForm((f) => ({ ...f, subject_id: data[0].id }));
    loadExams();
  }

  async function loadExams() {
    try {
      setExams(await api.get('/exams'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!form.subject_id || !form.title.trim() || !form.exam_date) {
      setError('Subject, title, and date are required.');
      return;
    }
    try {
      await api.post('/exams', form);
      setForm((f) => ({ ...EMPTY_FORM, subject_id: f.subject_id }));
      loadExams();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.del(`/exams/${id}`);
      loadExams();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Exam countdown</h1>
          <p>Every exam on the calendar, soonest first.</p>
        </div>
      </header>

      {subjects.length === 0 ? (
        <EmptyState>Add a subject first, then log its exam dates here.</EmptyState>
      ) : (
        <>
          <div className="card mb-16">
            <form onSubmit={handleAdd}>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="e-subject">Subject</label>
                  <select id="e-subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="e-date">Exam date</label>
                  <input id="e-date" type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="e-title">Title</label>
                <input id="e-title" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Midterm 2" maxLength={140} />
              </div>
              <div className="field">
                <label htmlFor="e-notes">Notes (optional)</label>
                <input id="e-notes" type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={300} />
              </div>
              {error && <div className="error-text">{error}</div>}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Add exam</button>
              </div>
            </form>
          </div>

          {exams === null && <LoadingState />}
          {exams && exams.length === 0 && <EmptyState>No exams logged yet — add one above.</EmptyState>}

          {exams && exams.length > 0 && (
            <div className="grid grid-3">
              {exams.map((ex) => {
                const days = daysUntil(ex.exam_date);
                const accent = urgencyAccent(days);
                return (
                  <div key={ex.id} className="card" style={{ position: 'relative' }}>
                    <button
                      className="btn btn-danger btn-icon btn-sm"
                      style={{ position: 'absolute', top: 14, right: 14 }}
                      onClick={() => handleDelete(ex.id)}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div
                      className="readout"
                      style={{ fontSize: 34, color: accent.color, textShadow: `0 0 22px ${accent.shadow}` }}
                    >
                      {days < 0 ? 'Past' : days === 0 ? 'Today' : `${days}d`}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 6 }}>{ex.title}</div>
                    <div className="row-meta" style={{ marginTop: 8 }}>
                      <SubjectPill name={ex.subject_name} color={ex.subject_color} />
                      <span>{formatDate(ex.exam_date)}</span>
                    </div>
                    {ex.notes && <p className="text-soft" style={{ fontSize: 13, marginTop: 10, marginBottom: 0 }}>{ex.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
