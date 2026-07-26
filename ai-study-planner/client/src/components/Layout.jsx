import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, CalendarClock, ListChecks,
  Timer, GraduationCap, Sparkles, BarChart3
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/timetable', label: 'Timetable', icon: CalendarClock },
  { to: '/assignments', label: 'Assignments', icon: ListChecks },
  { to: '/timer', label: 'Study Timer', icon: Timer },
  { to: '/exams', label: 'Exam Countdown', icon: GraduationCap },
  { to: '/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/performance', label: 'Performance', icon: BarChart3 }
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SP</div>
          <div className="brand-text">
            Study Planner
            <span>AI powered</span>
          </div>
        </div>

        <nav className="nav-group">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">Local &amp; private — your data stays on this machine.</div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
