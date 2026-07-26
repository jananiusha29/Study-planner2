import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Check } from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingState, EmptyState } from '../components/ui.jsx';

const DEFAULT_COLOR = '#F2B84B';

export default function Subjects() {
  const [subjects, setSubjects] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_COLOR);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setSubjects(await api.get('/subjects'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return;
    try {
      await api.post('/subjects', { name, color });
      setName('');
      setColor(DEFAULT_COLOR);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(subject) {
    setEditingId(subject.id);
    setEditName(subject.name);
    setEditColor(subject.color);
  }

  async function saveEdit(id) {
    try {
      await api.put(`/subjects/${id}`, { name: editName, color: editColor });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this subject? Its timetable blocks, assignments, sessions, and exams will be removed too.')) return;
    try {
      await api.del(`/subjects/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Subjects</h1>
          <p>Every course you're tracking, with a color used across the timetable, charts, and insights.</p>
        </div>
      </header>

      <div className="card mb-16">
        <form onSubmit={handleAdd} className="form-row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="subject-name">Subject name</label>
            <input
              id="subject-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Chemistry"
              maxLength={80}
            />
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'end' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="subject-color">Color</label>
              <input
                id="subject-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 56, padding: 3, height: 40 }}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Add subject
            </button>
          </div>
        </form>
        {error && <div className="error-text">{error}</div>}
      </div>

      {subjects === null && <LoadingState />}
      {subjects && subjects.length === 0 && <EmptyState>No subjects yet — add your first one above.</EmptyState>}

      {subjects && subjects.length > 0 && (
        <div className="list">
          {subjects.map((s) => (
            <div key={s.id} className="row-card">
              {editingId === s.id ? (
                <>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    style={{ width: 44, height: 36, padding: 2 }}
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ flex: 1, minWidth: 160 }}
                  />
                  <div className="row-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(s.id)}>
                      <Check size={14} /> Save
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="subject-dot" style={{ background: s.color, width: 14, height: 14 }} />
                  <div className="row-main">
                    <div className="row-title">{s.name}</div>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEdit(s)} aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(s.id)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
