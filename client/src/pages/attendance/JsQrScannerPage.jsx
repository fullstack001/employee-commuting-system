import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import api from '../../api/client';

const SESSIONS = [
  { value: 'morning_check_in', label: 'Morning check-in' },
  { value: 'morning_check_out', label: 'Morning check-out' },
  { value: 'afternoon_check_in', label: 'Afternoon check-in' },
  { value: 'afternoon_check_out', label: 'Afternoon check-out' },
];

export default function JsQrScannerPage() {
  const [session, setSession] = useState('morning_check_in');
  const [msg, setMsg] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanning();
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
      return true;
    } catch (e) {
      const m =
        (e.response && e.response.data && e.response.data.message) || e.message || 'Error';
      setMsg({ type: 'danger', text: m });
      return false;
    }
  };

  const scan = async () => {
    if (!scanning) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const canvasContext = canvas.getContext('2d');
    canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      await onScan(code.data);
      console.log(code.data);
      animationRef.current = requestAnimationFrame(scan);
    } else {
      animationRef.current = requestAnimationFrame(scan);
    }
  };

  const startScanning = async () => {
    setMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setScanning(true);
      scan();
    } catch (error) {
      setMsg({ type: 'danger', text: 'Error accessing camera: ' + error.message });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div>
      <h2 className="h4 mb-3">QR Scanner (jsQR)</h2>
      <p className="text-muted small">
        Choose session, then start camera. Point at a member QR code.
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
              Start camera
            </button>
          ) : (
            <button type="button" className="btn btn-outline-secondary" onClick={stopScanning}>
              Stop camera
            </button>
          )}
        </div>
      </div>
      <div className="mt-3" style={{ maxWidth: 400 }}>
        <video
          ref={videoRef}
          style={{ width: '100%', display: scanning ? 'block' : 'none' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          style={{ width: '100%', display: 'none' }}
          width={640}
          height={480}
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