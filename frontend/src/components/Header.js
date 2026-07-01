import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-header no-print">
        <div className="brand">
          <div className="brand-mark">MT</div>
          <div>
            <div>MEŞE TASARIM</div>
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
              Ebatlama & Form Yönetim Sistemi
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <div className="user-chip">
              <span className="dot" />
              {user.name} ({user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'})
            </div>
          )}
          {user ? (
            <button
              className="btn ghost"
              style={{ color: 'white' }}
              onClick={() => {
                logout();
              }}
            >
              Çıkış
            </button>
          ) : (
            <>
              <Link to="/forms/new" className="btn">
                Yeni Form
              </Link>
              <Link to="/query" className="btn secondary">
                Form Sorgula
              </Link>
              <Link to="/login" className="btn ghost" style={{ color: 'white' }}>
                Giriş
              </Link>
            </>
          )}
        </div>
      </header>

      {user && (
        <nav className="app-nav no-print">
          <NavLink to="/" end>
            Formlarım
          </NavLink>
          <NavLink to="/forms/new">Yeni Form</NavLink>
          <NavLink to="/query">Form Sorgula</NavLink>
        </nav>
      )}
    </>
  );
}