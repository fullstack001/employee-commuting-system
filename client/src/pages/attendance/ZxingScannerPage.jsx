import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import api from '../../api/client';

const SESSIONS = [
  { value: 'morning_check_in', label: 'Morning check-in' },
  { value: 'morning_check_out', label: 'Morning check-out' },
  { value: 'afternoon_check_in', label: 'Afternoon check-in' },
  { value: 'afternoon_check_out', label: 'Afternoon check-out' },
];

function playSuccessSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

export default function ZxingScannerPage() {
  const [session, setSession] = useState('morning_check_in');
  const [msg, setMsg] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const lastScannedRef = useRef(null);
  const lastScanTimerRef = useRef(null);

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    return () => {
      stopScanning();
    };
  }, []);

  const onScan = async (decodedText) => {
    // Prevent duplicate scans within 3 seconds
    if (lastScannedRef.current === decodedText) {
      return;
    }
    lastScannedRef.current = decodedText;
    if (lastScanTimerRef.current) {
      clearTimeout(lastScanTimerRef.current);
    }
    lastScanTimerRef.current = setTimeout(() => {
      lastScannedRef.current = null;
    }, 3000);

    setMsg(null);
    try {
      const { data } = await api.post('/attendance/scan', {
        qrCodeText: decodedText,
        session,
      });
      setMsg({ type: 'success', text: data.message || 'Recorded', detail: data.data });
      playSuccessSound();
    } catch (e) {
      playSuccessSound();
      const m =
        (e.response && e.response.data && e.response.data.message) || e.message || 'Error';
      setMsg({ type: 'danger', text: m });
    }
  };

  const startScanning = async () => {
    setMsg(null);
    try {
      setScanning(true);
      const result = await codeReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log('ZXing QR code detected:', result.getText());
            onScan(result.getText());
          }
          if (err && !(err instanceof Error)) {
            console.error('ZXing error:', err);
          }
        }
      );
      console.log('ZXing started:', result);
    } catch (err) {
      console.error('ZXing start error:', err);
      setMsg({ type: 'danger', text: 'Failed to start camera' });
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (codeReaderRef.current) {
        await codeReaderRef.current.reset();
      }
    } catch (err) {
      console.error('ZXing stop error:', err);
    }
    setScanning(false);
  };

  return (
    <div>
      <h2 className="h4 mb-3">ZXing Attendance Scanner</h2>
      <p className="text-muted small">
        Choose session, then start camera. Point at a member QR code. Uses ZXing library for scanning.
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
            <button type="button" className="btn btn-primary" onClick={startScanning}>
              Start Camera
            </button>
          ) : (
            <button type="button" className="btn btn-outline-secondary" onClick={stopScanning}>
              Stop Camera
            </button>
          )}
        </div>
      </div>
      <div className="mt-3">
        <video
          ref={videoRef}
          style={{
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          playsInline
          muted
        />
      </div>
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