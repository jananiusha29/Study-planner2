import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import {
  LoadingState, EmptyState, SubjectPill, Badge,
  priorityVariant, statusVariant, statusLabel, formatDate
} from '../components/ui.jsx';

const EMPTY_FORM = { subject_id: '', title: '', description: '', due_date: '', priority: 'medium' };

export default function Assignments() {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { loadAssignments(); }, [statusFilter, subjectFilter]);

  async function loadSubjects() {
    const data = await api.get('/subjects');
    setSubjects(data);
    if (data.length > 0) setForm((f) => ({ ...f, subject_id: f.subject_id || data[0].id }));
  }

  async function loadAssignments() {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (subjectFilter) params.set('subject_id', subjectFilter);
    const qs = params.toString();
    try {
      setAssignments(await api.get(`/assignments${qs ? `?${qs}` : ''}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!form.subject_id || !form.title.trim() || !form.due_date) {
      setError('Subject, title, and due date are required.');
      return;
    }
    try {
      await api.post('/assignments', form);
      setForm((f) => ({ ...EMPTY_FORM, subject_id: f.subject_id }));
      loadAssignments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cycleStatus(a) {
    const next = a.status === 'pending' ? 'in_progress' : a.status === 'in_progress' ? 'done' : 'pending';
    try {
      await api.put(`/assignments/${a.id}`, { status: next });
      loadAssignments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.del(`/assignments/${id}`);
      loadAssignments();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Assignment tracker</h1>
          <p>Everything due, sorted by deadline. Click a status badge to move it along.</p>
        </div>
      </header>

      {subjects.length === 0 ? (
        <EmptyState>Add a subject first, then come back here to track its assignments.</EmptyState>
      ) : (
        <>
          <div className="card mb-16">
            <form onSubmit={handleAdd}>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="a-subject">Subject</label>
                  <select id="a-subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="a-due">Due date</label>
                  <input id="a-due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="a-title">Title</label>
                <input id="a-title" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Problem Set 4" maxLength={140} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="a-priority">Priority</label>
                  <select id="a-priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="a-desc">Notes (optional)</label>
                  <input id="a-desc" type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} />
                </div>
              </div>
              {error && <div className="error-text">{error}</div>}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Add assignment</button>
              </div>
            </form>
          </div>

          <div className="header-actions mb-16">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {assignments === null && <LoadingState />}
          {assignments && assignments.length === 0 && <EmptyState>Nothing here — add an assignment above.</EmptyState>}

          {assignments && assignments.length > 0 && (
            <div className="list">
              {assignments.map((a) => (
                <div key={a.id} className="row-card">
                  <div className="row-main">
                    <div className="row-title">{a.title}</div>
                    <div className="row-meta">
                      <SubjectPill name={a.subject_name} color={a.subject_color} />
                      <span>Due {formatDate(a.due_date)}</span>
                      <Badge variant={priorityVariant(a.priority)}>{a.priority}</Badge>
                      {a.description && <span>{a.description}</span>}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-sm" style={{ background: 'transparent', border: 'none', padding: 0 }} onClick={() => cycleStatus(a)}>
                      <Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge>
                    </button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(a.id)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
