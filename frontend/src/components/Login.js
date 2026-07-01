import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { login } from '../utils/api';
import { useAuth } from './AuthContext';

export default function Login() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await login(username.trim(), password);
      loginUser(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <h1>MEŞE TASARIM</h1>
        <p className="subtitle">Ebatlama & Form Yönetim Sistemi</p>

        {error && <div className="alert error">{error}</div>}

        <div className="field" style={{ marginBottom: 12 }}>
          <label>Kullanıcı Adı</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            required
          />
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
          İlk kurulum: <code>admin / admin123</code>
        </p>
      </form>
    </div>
  );
}