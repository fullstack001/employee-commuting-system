import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const SESSIONS = [
  { value: 'morning_check_in', label: 'Morning check-in' },
  { value: 'morning_check_out', label: 'Morning check-out' },
  { value: 'afternoon_check_in', label: 'Afternoon check-in' },
  { value: 'afternoon_check_out', label: 'Afternoon check-out' },
];

export default function ManualAttendancePage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    memberId: '',
    date: new Date().toISOString().slice(0, 10),
    session: 'morning_check_in',
    time: new Date().toISOString().slice(0, 16),
    notes: '',
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, s] = await Promise.all([api.get('/members'), api.get('/settings')]);
        setMembers(m.data);
        setSettings(s.data);
      } catch {
        // ignore
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const { data } = await api.post('/attendance/manual', {
        memberId: form.memberId,
        date: form.date,
        session: form.session,
        time: new Date(form.time).toISOString(),
        notes: form.notes,
      });
      setMsg({ type: 'success', text: 'Saved', data });
    } catch (err) {
      setMsg({
        type: 'danger',
        text: (err.response && err.response.data && err.response.data.message) || 'Failed',
      });
    }
  };

  const adminBlocked =
    user && user.role === 'admin' && settings && !settings.allowAdminManualAttendance;

  return (
    <div>
      <h2 className="h4 mb-3">Manual attendance</h2>
      {adminBlocked && (
        <div className="alert alert-warning">
          Super Admin can enable manual attendance for Admins in Settings.
        </div>
      )}
      <form className="card card-body shadow-sm" style={{ maxWidth: 520 }} onSubmit={submit}>
        <div className="mb-2">
          <label className="form-label">Member</label>
          <select
            className="form-select"
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            required
          >
            <option value="">—</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.memberId} — {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Session</label>
          <select
            className="form-select"
            value={form.session}
            onChange={(e) => setForm({ ...form, session: e.target.value })}
          >
            {SESSIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Time (local)</label>
          <input
            type="datetime-local"
            className="form-control"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {msg && (
          <div className={`alert alert-${msg.type} mt-3 mb-0`}>
            {msg.text}
            {msg.data && <pre className="small mb-0 mt-2">{JSON.stringify(msg.data, null, 2)}</pre>}
          </div>
        )}
      </form>
    </div>
  );
}
