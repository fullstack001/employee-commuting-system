import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { assetUrl } from '../../api/client';

export default function MemberDetail() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [qrBlob, setQrBlob] = useState(null);
  const [err, setErr] = useState('');
  const qrUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/members/${id}`);
        if (cancelled) return;
        setMember(data);
        const qr = await api.get(`/members/${id}/qrcode`, { responseType: 'blob' });
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(qr.data);
        setQrBlob(objectUrl);
        qrUrlRef.current = objectUrl;
      } catch (e) {
        if (!cancelled) {
          setErr((e.response && e.response.data && e.response.data.message) || 'Failed to load');
        }
      }
    })();
    return () => {
      cancelled = true;
      if (qrUrlRef.current) {
        URL.revokeObjectURL(qrUrlRef.current);
        qrUrlRef.current = null;
      }
    };
  }, [id]);

  if (err) return <div className="alert alert-danger">{err}</div>;
  if (!member) return <div className="text-muted">Loading…</div>;

  return (
    <div>
      <Link to="/members" className="small">
        ← Members
      </Link>
      <h2 className="h4 mt-2">{member.name}</h2>
      <div className="row g-4 mt-1">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <p>
                <strong>Member ID:</strong> {member.memberId}
              </p>
              <p>
                <strong>QR text:</strong> {member.qrCodeText}
              </p>
              <p>
                <strong>Unit:</strong> {member.unit && member.unit.name}
              </p>
              <p>
                <strong>Position:</strong> {member.position && member.position.name}
              </p>
              {member.profileImage && (
                <p>
                  <img src={assetUrl(member.profileImage)} alt="Profile" style={{ maxHeight: 120 }} />
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6 text-center">
          <div className="card shadow-sm p-3">
            <div className="small text-muted mb-2">Attendance QR</div>
            {qrBlob && <img src={qrBlob} alt="QR" className="img-fluid" style={{ maxWidth: 280 }} />}
            {qrBlob && (
              <div className="mt-2">
                <a className="btn btn-sm btn-outline-secondary" href={qrBlob} download={`${member.memberId}-qr.png`}>
                  Download PNG
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
