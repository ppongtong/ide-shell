// A plugin page under the catch-all route. It owns its sub-views:
//   /reports     → list
//   /reports/q1  → one report
import { Link } from '@tanstack/react-router';

const reports = [
  { id: 'q1', name: 'Q1 revenue', body: 'Revenue grew from 120 to 160 between January and March.' },
  { id: 'users', name: 'Active users', body: 'Two users, one admin.' },
];

export default function ReportsPage({ subPath }: { subPath: string }) {
  const report = reports.find((r) => r.id === subPath);
  if (subPath && !report) return <div className="empty">No report “{subPath}”.</div>;

  if (report)
    return (
      <div className="plugin-page">
        <title>{`${report.name} · Reports · IDE`}</title>
        <Link to="/$activityId/$" params={{ activityId: 'reports', _splat: '' }}>← All reports</Link>
        <h1>{report.name}</h1>
        <p>{report.body}</p>
      </div>
    );

  return (
    <div className="plugin-page">
      <h1>Reports</h1>
      <p className="hint">A plugin page under the catch-all route. It owns everything after /reports/.</p>
      <ul className="report-list">
        {reports.map((r) => (
          <li key={r.id}>
            <Link to="/$activityId/$" params={{ activityId: 'reports', _splat: r.id }}>{r.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
