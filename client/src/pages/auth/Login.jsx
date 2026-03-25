import React, { useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { user, loading, login } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Redirect to="/" />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      history.push('/');
    } catch (err) {
      const m =
        (err.response && err.response.data && err.response.data.message) || 'Login failed';
      setError(m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 400 }}>
        <div className="card-body p-4">
          <h1 className="h4 mb-4 text-center">Employee Commuting</h1>
          <form onSubmit={submit}>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="small text-muted mt-3 mb-0 text-center">
            Default: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
