import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { isUserRole } = useAuth();
  const [dash, setDash] = useState(null);
  const [units, setUnits] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, u] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/unit-summary'),
        ]);
        if (!cancelled) {
          setDash(d.data);
          setUnits(u.data);
        }
      } catch (e) {
        if (!cancelled) {
          setErr((e.response && e.response.data && e.response.data.message) || 'Failed to load');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <div className="alert alert-danger">{err}</div>;
  }
  if (!dash) {
    return <div className="text-muted">Loading dashboard…</div>;
  }

  return (
    <div>
      <h2 className="h4 mb-4">Dashboard</h2>
      <div className="row g-3">
        {!isUserRole && (
          <div className="col-md-3">
            <div className="card card-stat p-3">
              <div className="text-muted small">Total units</div>
              <div className="fs-3 fw-semibold">{dash.totalUnits}</div>
            </div>
          </div>
        )}
        <div className="col-md-3">
          <div className="card card-stat p-3">
            <div className="text-muted small">Total members</div>
            <div className="fs-3 fw-semibold">{dash.totalMembers}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stat p-3">
            <div className="text-muted small">Present today</div>
            <div className="fs-3 fw-semibold text-success">{dash.presentToday}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stat p-3">
            <div className="text-muted small">Absent today</div>
            <div className="fs-3 fw-semibold text-warning">{dash.absentToday}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stat p-3">
            <div className="text-muted small">Late today</div>
            <div className="fs-3 fw-semibold text-danger">{dash.lateToday}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stat p-3">
            <div className="text-muted small">Morning check-ins</div>
            <div className="fs-4 fw-semibold">{dash.morningCheckInCount}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stat p-3">
            <div className="text-muted small">Afternoon check-ins</div>
            <div className="fs-4 fw-semibold">{dash.afternoonCheckInCount}</div>
          </div>
        </div>
        <div className="col-12">
          <div className="text-muted small">Date: {dash.date}</div>
        </div>
      </div>

      {!isUserRole && units.length > 0 && (
        <div className="mt-4">
          <h3 className="h6 mb-2">Attendance rate by unit (today)</h3>
          <div className="table-responsive bg-white rounded shadow-sm">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Members</th>
                  <th>Present</th>
                  <th>Rate %</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.unitId}>
                    <td>{u.unitName}</td>
                    <td>{u.memberCount}</td>
                    <td>{u.presentToday}</td>
                    <td>{u.attendanceRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
