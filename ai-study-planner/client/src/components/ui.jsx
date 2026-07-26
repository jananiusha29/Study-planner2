export function StatCard({ label, value, accent }) {
  return (
    <div className={`card stat-card${accent ? ` accent-${accent}` : ''}`}>
      <div className="readout">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

export function SubjectPill({ name, color }) {
  return (
    <span className="subject-pill">
      <span className="subject-dot" style={{ background: color }} />
      {name}
    </span>
  );
}

export function Badge({ variant = 'muted', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}

export function LoadingState({ label = 'Loading…' }) {
  return <div className="empty-state">{label}</div>;
}

export function priorityVariant(priority) {
  if (priority === 'high') return 'coral';
  if (priority === 'medium') return 'gold';
  return 'muted';
}

export function statusVariant(status) {
  if (status === 'done') return 'mint';
  if (status === 'in_progress') return 'gold';
  return 'muted';
}

export function statusLabel(status) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'done') return 'Done';
  return 'Pending';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
