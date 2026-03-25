import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/client';

const SESSIONS = [
  { value: 'morning_check_in', label: 'Morning check-in' },
  { value: 'morning_check_out', label: 'Morning check-out' },
  { value: 'afternoon_check_in', label: 'Afternoon check-in' },
  { value: 'afternoon_check_out', label: 'Afternoon check-out' },
];

export default function ScannerPage() {
  const [session, setSession] = useState('morning_check_in');
  const [msg, setMsg] = useState(null);
  const [scanning, setScanning] = useState(false);
  const html5Ref = useRef(null);

  useEffect(() => {
    return () => {
      if (html5Ref.current) {
        html5Ref.current.stop().catch(() => {});
        html5Ref.current = null;
      }
    };
  }, []);

  const onScan = async (decodedText) => {
    setMsg(null);
    try {
      const { data } = await api.post('/attendance/scan', {
        qrCodeText: decodedText,
        session,
      });
      setMsg({ type: 'success', text: data.message || 'Recorded', detail: data.data });
    } catch (e) {
      const m =
        (e.response && e.response.data && e.response.data.message) || e.message || 'Error';
      setMsg({ type: 'danger', text: m });
    }
  };

  const start = async () => {
    setMsg(null);
    const regionId = 'qr-reader';
    const el = document.getElementById(regionId);
    if (!el) return;
    if (html5Ref.current) {
      await html5Ref.current.stop().catch(() => {});
      html5Ref.current = null;
    }
    const h = new Html5Qrcode(regionId);
    html5Ref.current = h;
    setScanning(true);
    await h.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => {
        onScan(text);
      },
      () => {}
    );
  };

  const stop = async () => {
    if (html5Ref.current) {
      await html5Ref.current.stop().catch(() => {});
      html5Ref.current = null;
    }
    setScanning(false);
  };

  return (
    <div>
      <h2 className="h4 mb-3">Attendance scanner</h2>
      <p className="text-muted small">
        Choose session, then start camera. Point at a member QR code. USB cameras are supported.
      </p>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Session</label>
          <select
            className="form-select"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            disabled={scanning}
          >
            {SESSIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-8 d-flex align-items-end" style={{ gap: '0.5rem' }}>
          {!scanning ? (
            <button type="button" className="btn btn-primary" onClick={start}>
              Start camera
            </button>
          ) : (
            <button type="button" className="btn btn-outline-secondary" onClick={stop}>
              Stop camera
            </button>
          )}
        </div>
      </div>
      <div id="qr-reader" className="mt-3 bg-white rounded" style={{ maxWidth: 400 }} />
      {msg && (
        <div className={`alert alert-${msg.type} mt-3`}>
          {msg.text}
          {msg.detail && (
            <pre className="small mb-0 mt-2">{JSON.stringify(msg.detail, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
