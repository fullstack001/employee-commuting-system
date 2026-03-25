import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import api from '../../api/client';

export default function AnalyticsPage() {
  const [unitSummary, setUnitSummary] = useState([]);
  const [trend, setTrend] = useState([]);
  const [late, setLate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, t, l] = await Promise.all([
          api.get('/analytics/unit-summary'),
          api.get('/analytics/monthly-trend', { params: { months: 6 } }),
          api.get('/analytics/late-summary'),
        ]);
        if (!cancelled) {
          setUnitSummary(u.data);
          setTrend(t.data);
          setLate(l.data);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unitChartData = unitSummary.map((x) => ({
    name: (x.unitName && x.unitName.slice(0, 12)) || '',
    rate: x.attendanceRate,
    present: x.presentToday,
  }));

  return (
    <div>
      <h2 className="h4 mb-4">Analytics</h2>
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm p-3">
            <h3 className="h6 mb-3">Attendance rate by unit (today)</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={unitChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#3d8bfd" name="Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-sm p-3">
            <h3 className="h6 mb-3">Monthly attendance records (6 months)</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="attendanceRecords" stroke="#198754" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="card shadow-sm p-3">
            <h3 className="h6 mb-2">Top late members (period)</h3>
            {late && (
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Late count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(late.topLateMembers || []).map((row, i) => (
                      <tr key={i}>
                        <td>
                          {row.member && row.member.memberId} {row.member && row.member.name}
                        </td>
                        <td>{row.lateCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
