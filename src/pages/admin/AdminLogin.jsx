import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setToken } from '../../lib/api.js';
import companyLogo from '../../../images/Global Track Cargo logo.jfif';
import './admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login(password);
      setToken(token);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card-wrap">
        <div className="login-header">
          <img className="login-brand-logo" src={companyLogo} alt="Global Track Cargo" />
          <div className="eyebrow login-eyebrow">
            <span className="dot" /> Operator Access
          </div>
          <h1 className="login-title">Global Track Cargo Admin</h1>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="text-input"
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || !password}>
            {loading ? 'Checking…' : 'Enter console'}
          </button>
        </form>
      </div>
    </div>
  );
}
