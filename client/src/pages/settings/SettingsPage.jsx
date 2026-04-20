import React, { useEffect, useState } from 'react';
import api from '../../api/client';

export default function SettingsPage() {
  const [form, setForm] = useState({
    morningCheckInDeadline: '09:00',
    afternoonCheckInDeadline: '13:00',
    allowDuplicateScanProtection: true,
    allowAdminManualAttendance: false,
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/settings').then((r) => {
      const d = r.data;
      setForm({
        morningCheckInDeadline: d.morningCheckInDeadline,
        afternoonCheckInDeadline: d.afternoonCheckInDeadline,
        allowDuplicateScanProtection: d.allowDuplicateScanProtection,
        allowAdminManualAttendance: d.allowAdminManualAttendance,
      });
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put('/settings', form);
      setMsg({ type: 'success', text: 'Settings saved' });
    } catch (err) {
      setMsg({
        type: 'danger',
        text: (err.response && err.response.data && err.response.data.message) || 'Failed',
      });
    }
  };

  return (
    <div>
      <h2 className="h4 mb-3">Attendance settings</h2>
      <form className="card card-body shadow-sm" style={{ maxWidth: 480 }} onSubmit={save}>
        <div className="mb-2">
          <label className="form-label">Morning check-in deadline (HH:mm)</label>
          <input
            className="form-control"
            value={form.morningCheckInDeadline}
            onChange={(e) => setForm({ ...form, morningCheckInDeadline: e.target.value })}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Afternoon check-in deadline (HH:mm)</label>
          <input
            className="form-control"
            value={form.afternoonCheckInDeadline}
            onChange={(e) => setForm({ ...form, afternoonCheckInDeadline: e.target.value })}
          />
        </div>
        <div className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            id="dup"
            checked={form.allowDuplicateScanProtection}
            onChange={(e) => setForm({ ...form, allowDuplicateScanProtection: e.target.checked })}
          />
          <label className="form-check-label" htmlFor="dup">
            Block duplicate scans (recommended)
          </label>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="adm"
            checked={form.allowAdminManualAttendance}
            onChange={(e) => setForm({ ...form, allowAdminManualAttendance: e.target.checked })}
          />
          <label className="form-check-label" htmlFor="adm">
            Allow Admins to add manual attendance
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {msg && <div className={`alert alert-${msg.type} mt-3 mb-0`}>{msg.text}</div>}
      </form>
    </div>
  );
}
