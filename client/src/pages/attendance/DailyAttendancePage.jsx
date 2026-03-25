import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function DailyAttendancePage() {
  const { isAdmin } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      api.get('/units').then((r) => setUnits(r.data));
    }
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { date };
        if (unitId) params.unitId = unitId;
        const { data } = await api.get('/attendance/daily', { params });
        if (!cancelled) setItems(data.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, unitId]);

  return (
    <div>
      <h2 className="h4 mb-3">Daily attendance</h2>
      <div className="row g-2 mb-3">
        <div className="col-auto">
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {isAdmin && (
          <div className="col-auto">
            <select className="form-select" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              <option value="">All units</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Time</th>
                <th>Member</th>
                <th>Unit</th>
                <th>Session</th>
                <th>Status</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  <td>{r.time ? new Date(r.time).toLocaleString() : ''}</td>
                  <td>{r.member && r.member.name}</td>
                  <td>{r.unit && r.unit.name}</td>
                  <td>{r.session}</td>
                  <td>{r.status}</td>
                  <td>{r.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
