import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '../api/client.js';
import { LoadingState, EmptyState, StatCard } from '../components/ui.jsx';

const STATUS_COLORS = { pending: '#6B678F', in_progress: '#F2B84B', done: '#7ED9A8' };
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In progress', done: 'Done' };

const tooltipStyle = {
  background: '#1B1A3D',
  border: '1px solid #322F5E',
  borderRadius: 8,
  fontSize: 12.5,
  color: '#EDEBFA'
};

export default function Performance() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(14);
  const [error, setError] = useState('');

  useEffect(() => { load(days); }, [days]);

  async function load(range) {
    try {
      setData(await api.get(`/performance/overview?days=${range}`));
    } catch (err) {
      setError(err.message);
    }
  }

  const totalMinutes = data ? data.dailyTrend.reduce((sum, d) => sum + d.minutes, 0) : 0;
  const avgPerDay = data && data.days ? Math.round(totalMinutes / data.days) : 0;
  const assignmentDone = data ? (data.assignmentStatus.find((s) => s.status === 'done')?.count || 0) : 0;
  const assignmentTotal = data ? data.assignmentStatus.reduce((sum, s) => sum + s.count, 0) : 0;

  const pieData = data
    ? data.assignmentStatus.filter((s) => s.count > 0).map((s) => ({ name: STATUS_LABELS[s.status], value: s.count, status: s.status }))
    : [];

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Performance</h1>
          <p>Study time trends and assignment progress at a glance.</p>
        </div>
        <div className="header-actions">
          {[7, 14, 30].map((d) => (
            <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </header>

      {error && <div className="error-text mb-16">{error}</div>}
      {!data && !error && <LoadingState />}

      {data && (
        <>
          <div className="grid grid-4 mb-16">
            <StatCard label={`Minutes (${days}d)`} value={totalMinutes} />
            <StatCard label="Avg. min / day" value={avgPerDay} accent="blue" />
            <StatCard label="Assignments done" value={assignmentDone} accent="mint" />
            <StatCard label="Total assignments" value={assignmentTotal} accent="coral" />
          </div>

          <div className="card chart-card mb-16">
            <h3>Daily study time</h3>
            <p className="chart-sub">Focus minutes logged per day over the last {days} days.</p>
            {totalMinutes === 0 ? (
              <EmptyState>No sessions logged in this range yet — run the timer to see a trend here.</EmptyState>
            ) : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={data.dailyTrend}>
                    <CartesianGrid stroke="#322F5E" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#6B678F', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#322F5E' }} tickLine={false} />
                    <YAxis tick={{ fill: '#6B678F', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9C98C4' }} />
                    <Line type="monotone" dataKey="minutes" stroke="#F2B84B" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-2">
            <div className="card chart-card">
              <h3>Time by subject</h3>
              <p className="chart-sub">Total focus minutes in the last {days} days.</p>
              {data.subjectTotals.every((s) => s.minutes === 0) ? (
                <EmptyState>No study time logged yet.</EmptyState>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.subjectTotals} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid stroke="#322F5E" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#6B678F', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="subject" tick={{ fill: '#9C98C4', fontSize: 11.5 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Bar dataKey="minutes" radius={[0, 6, 6, 0]}>
                        {data.subjectTotals.map((s) => <Cell key={s.subject} fill={s.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card chart-card">
              <h3>Assignment status</h3>
              <p className="chart-sub">Where things stand right now.</p>
              {pieData.length === 0 ? (
                <EmptyState>No assignments yet.</EmptyState>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {pieData.map((entry) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#9C98C4' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
