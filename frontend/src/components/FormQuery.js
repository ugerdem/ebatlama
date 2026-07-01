import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { queryForm, STATUS_LABEL } from '../utils/api';
import { formatDateTime } from '../utils/helpers';

export default function FormQuery() {
  const [formNo, setFormNo] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const autoSearchDone = useRef(false);

  async function runQuery(value) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await queryForm(trimmed.toUpperCase());
      setResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Bu numaraya sahip bir form bulunamadı. Form No\'yu kontrol edin.');
      } else if (err.response?.status === 403) {
        setError('Bu formu sorgulama yetkiniz yok.');
      } else {
        setError(err.response?.data?.error || 'Sorgu başarısız');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = (searchParams.get('formNo') || '').trim();
    if (!initial || autoSearchDone.current) return;
    autoSearchDone.current = true;
    setFormNo(initial.toUpperCase());
    runQuery(initial);
  }, [searchParams]);

  async function submit(e) {
    e.preventDefault();
    await runQuery(formNo);
  }

  return (
    <div className="card">
      <h2 className="section-title">Form Sorgula</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
        Formu giriş yaparken aldığınız Form No (örn: <code>MT-20260701-0001</code>) ile
        durumunu sorgulayın.
      </p>

      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={formNo}
          onChange={(e) => setFormNo(e.target.value.toUpperCase())}
          placeholder="MT-20260701-0001"
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 15
          }}
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sorgulanıyor…' : 'Sorgula'}
        </button>
      </form>

      {error && <div className="alert error">{error}</div>}

      {result && (
        <div
          style={{
            marginTop: 8,
            padding: 16,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#0f766e', fontSize: 16 }}>{result.formNo}</strong>
            <span className={`badge ${result.durum}`}>
              {STATUS_LABEL[result.durum] || result.durum}
            </span>
          </div>
          <hr style={{ borderColor: '#e2e8f0' }} />
          <div style={{ lineHeight: 1.8 }}>
            <div>
              <strong>Firma:</strong> {result.firma}
            </div>
            <div>
              <strong>Yetkili:</strong> {result.yetkili}
            </div>
            <div>
              <strong>Telefon:</strong> {result.telefon}
            </div>
            <div>
              <strong>Giriş Tarihi:</strong> {formatDateTime(result.createdAt)}
            </div>
          </div>

          <h4 style={{ marginTop: 16, marginBottom: 8 }}>Durum Geçmişi</h4>
          <ul style={{ paddingLeft: 18, lineHeight: 1.7, fontSize: 13 }}>
            {(result.durumGecmisi || []).map((d, i) => (
              <li key={i}>
                <strong>{STATUS_LABEL[d.durum] || d.durum}</strong> — {formatDateTime(d.tarih)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}