import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Cpu } from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingState, EmptyState, Badge } from '../components/ui.jsx';

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await api.get('/recommendations'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const maxScore = data ? Math.max(1, ...data.subjects.map((s) => s.urgencyScore)) : 1;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>AI study recommendations</h1>
          <p>A prioritized read on what needs your attention, built from your exams, assignments, and recent study time.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      {error && <div className="error-text mb-16">{error}</div>}
      {!data && !error && <LoadingState label="Analyzing your study data…" />}

      {data && (
        <>
          <div className="mode-banner">
            {data.mode === 'claude' ? (
              <Badge variant="gold"><Cpu size={11} style={{ marginRight: 2 }} /> Claude-powered</Badge>
            ) : (
              <Badge variant="muted"><Sparkles size={11} style={{ marginRight: 2 }} /> Rule-based engine</Badge>
            )}
            <span className="text-faint" style={{ fontSize: 12 }}>
              {data.mode === 'claude'
                ? 'Generated using your Anthropic API key.'
                : 'Add ANTHROPIC_API_KEY to server/.env for natural-language plans from Claude.'}
            </span>
          </div>

          <div className="summary-card">{data.summary}</div>

          {data.subjects.length === 0 ? (
            <EmptyState>Add a subject to see per-subject recommendations.</EmptyState>
          ) : (
            <div className="card">
              <div className="section-title">Urgency by subject</div>
              {data.subjects.map((s) => (
                <div key={s.subject_id} className="bar-row">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.subject}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max(4, (s.urgencyScore / maxScore) * 100)}%`, background: s.color }}
                    />
                  </div>
                  <span className="avg">{s.urgencyScore}</span>
                </div>
              ))}

              <div className="grid grid-3" style={{ marginTop: 18 }}>
                {data.subjects.map((s) => (
                  <div key={s.subject_id} className="card" style={{ padding: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: s.color }}>{s.subject}</div>
                    <div className="text-soft" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
                      {s.nearestExam
                        ? <div>Exam: {s.nearestExam.title} in {s.nearestExam.daysAway}d</div>
                        : <div>No upcoming exam</div>}
                      <div>{s.pendingAssignments} pending assignment{s.pendingAssignments === 1 ? '' : 's'}</div>
                      <div>{s.studyMinutesLast7Days} min studied this week</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
