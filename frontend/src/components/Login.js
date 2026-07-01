import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
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
    <div className="login-shell landing-shell">
      <div className="landing-grid">
        <section className="landing-hero">
          <div className="landing-badge">MEŞE TASARIM</div>
          <h1>Ebatlama formlarını yönetin ya da tek tıkla gönderin.</h1>
          <p className="landing-lead">
            Admin hesabınızla giriş yapıp formları takip edebilir, isterseniz hiç giriş yapmadan
            yeni form oluşturabilirsiniz.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <strong>Admin misiniz?</strong>
              <span>Giriş yapın, form listesi ve durum takibini yönetin.</span>
            </div>
            <div className="feature-item">
              <strong>Form mu göndereceksiniz?</strong>
              <span>Firma ve ebat bilgilerini girip doğrudan form oluşturun.</span>
            </div>
          </div>

          <div className="landing-note">
            Yeni form göndermek için giriş gerekmez. Form numaranız oluşturulduktan sonra durumu
            sorgulayabilirsiniz.
          </div>

          <div className="btn-row" style={{ marginTop: 18 }}>
            <Link to="/forms/new" className="btn">
              Form Gönder
            </Link>
            <Link to="/query" className="btn secondary">
              Form Sorgula
            </Link>
          </div>
        </section>

        <aside className="landing-panel">
          <form className="landing-card" onSubmit={submit}>
            <div className="landing-card-head">
              <div>
                <h2>Admin Girişi</h2>
                <p>Yönetici hesabınızla oturum açın.</p>
              </div>
              <div className="landing-chip">Güvenli</div>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="field" style={{ marginBottom: 12 }}>
              <label>Kullanıcı Adı</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                placeholder="admin"
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
                placeholder="••••••••"
                required
              />
            </div>

            <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>

            <div className="landing-mini-links">
              <span>İlk kurulum:</span> <code>admin / admin123</code>
            </div>
          </form>

          <div className="landing-card landing-side-card">
            <h3>Form göndermek istiyorsanız</h3>
            <p>
              Önce firmanızın ve ebat bilgilerinin yer aldığı formu açın, ardından kayıt edin.
            </p>
            <Link to="/forms/new" className="btn secondary" style={{ width: '100%' }}>
              Form Bilgilerini Gir
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}