import React, { useState } from 'react';

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const openExport = (kind) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    const path = kind === 'excel' ? '/reports/export/excel' : '/reports/export/pdf';
    const token = localStorage.getItem('token');
    var env = process.env.REACT_APP_API_URL;
    var origin = env ? env.replace(/\/$/, '') : '';
    var url = (origin ? origin : '') + '/api' + path + '?' + params.toString();
    fetch(url, { headers: { Authorization: 'Bearer ' + token } })
      .then(function (r) {
        if (!r.ok) throw new Error('Export failed');
        return r.blob();
      })
      .then(function (blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = kind === 'excel' ? 'attendance.xlsx' : 'attendance.pdf';
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(function () {
        alert('Export failed — check login and server.');
      });
  };

  return (
    <div>
      <h2 className="h4 mb-3">Reports & export</h2>
      <p className="text-muted small">
        Choose a date range, then download Excel or PDF. If no range is sent, the server defaults to the last
        30 days.
      </p>
      <div className="row g-2 mb-3">
        <div className="col-auto">
          <label className="form-label small">From</label>
          <input
            type="date"
            className="form-control"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <label className="form-label small">To</label>
          <input
            type="date"
            className="form-control"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
      <div className="d-flex" style={{ gap: '0.5rem' }}>
        <button type="button" className="btn btn-success" onClick={() => openExport('excel')}>
          Download Excel
        </button>
        <button type="button" className="btn btn-outline-danger" onClick={() => openExport('pdf')}>
          Download PDF
        </button>
      </div>
      <p className="small text-muted mt-3 mb-0">
        Exports require admin or super admin. In development, use the CRA proxy (<code>/api</code>). For a
        custom API host, set <code>REACT_APP_API_URL</code> (e.g. <code>http://localhost:5000</code>).
      </p>
    </div>
  );
}
