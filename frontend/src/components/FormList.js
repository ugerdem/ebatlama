import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listForms, STATUS_LABEL } from '../utils/api';
import { formatDateTime } from '../utils/helpers';
import { useAuth } from './AuthContext';

export default function FormList() {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    listForms()
      .then((r) => setForms(r.data))
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = forms.filter((f) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (f.formNo || '').toLowerCase().includes(q) ||
      (f.firma || '').toLowerCase().includes(q) ||
      (f.yetkili || '').toLowerCase().includes(q) ||
      (f.telefon || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12
        }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          {user?.role === 'admin' ? 'Tüm Formlar' : 'Formlarım'}
          <span style={{ color: '#64748b', fontSize: 13, marginLeft: 8, fontWeight: 400 }}>
            ({forms.length} adet)
          </span>
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Form No / Firma / Yetkili…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 14,
              minWidth: 220
            }}
          />
          <Link to="/forms/new" className="btn">
            + Yeni Form
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Yükleniyor…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Henüz form yok</h3>
          <p>Yeni bir form oluşturmak için sağ üstteki butona tıklayın.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Form No</th>
                <th>Firma</th>
                <th>Telefon</th>
                <th>Yetkili</th>
                <th>Giriş Tarihi</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f._id}>
                  <td>
                    <strong style={{ color: '#0f766e' }}>{f.formNo}</strong>
                  </td>
                  <td>{f.firma}</td>
                  <td>{f.telefon}</td>
                  <td>{f.yetkili}</td>
                  <td>{formatDateTime(f.createdAt)}</td>
                  <td>
                    <span className={`badge ${f.durum}`}>
                      {STATUS_LABEL[f.durum] || f.durum}
                    </span>
                  </td>
                  <td>
                    <Link to={`/forms/${f._id}`} className="btn ghost">
                      Detay →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}