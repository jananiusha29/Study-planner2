import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Subjects from './pages/Subjects.jsx';
import Timetable from './pages/Timetable.jsx';
import Assignments from './pages/Assignments.jsx';
import Timer from './pages/Timer.jsx';
import Exams from './pages/Exams.jsx';
import Recommendations from './pages/Recommendations.jsx';
import Performance from './pages/Performance.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/insights" element={<Recommendations />} />
        <Route path="/performance" element={<Performance />} />
      </Route>
    </Routes>
  );
}
