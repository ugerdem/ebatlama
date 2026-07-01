import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createForm } from '../utils/api';
import { PVC_OPTIONS, makeEmptyRows, validateForm, compactRows } from '../utils/helpers';
import Toast from './Toast';

export default function FormEntry() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firma: '',
    telefon: '',
    yetkili: '',
    adres: '',
    pvcSecim: [],
    rows: makeEmptyRows(),
    notlar: ''
  });

  const [showTable, setShowTable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState([]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateRow(idx, field, value) {
    setForm((f) => {
      const rows = [...f.rows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...f, rows };
    });
  }

  function togglePvc(opt) {
    setForm((f) => {
      const has = f.pvcSecim.includes(opt);
      return {
        ...f,
        pvcSecim: has ? f.pvcSecim.filter((o) => o !== opt) : [...f.pvcSecim, opt]
      };
    });
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validateForm(form);
    setErrors(errs);
    if (errs.length) {
      setToast({ type: 'error', message: 'Lütfen zorunlu alanları doldurun' });
      return;
    }
    // En az bir dolu satır olsun
    if (compactRows(form.rows).length === 0) {
      setToast({ type: 'error', message: 'En az bir ebat satırı girmelisiniz' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firma: form.firma.trim(),
        telefon: form.telefon.trim(),
        yetkili: form.yetkili.trim(),
        adres: form.adres.trim(),
        pvcSecim: form.pvcSecim,
        rows: form.rows,
        notlar: form.notlar
      };
      const { data } = await createForm(payload);
      setToast({
        type: 'success',
        message: `Form oluşturuldu. Form No: ${data.formNo}`
      });
      setTimeout(() => navigate(`/forms/${data.id}`), 800);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Kayıt hatası' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <form onSubmit={submit}>
        <div className="card">
          <h2 className="section-title">Firma Bilgileri</h2>
          {errors.length > 0 && (
            <div className="alert error">
              {errors.map((e, i) => (
                <div key={i}>• {e}</div>
              ))}
            </div>
          )}
          <div className="form-grid">
            <div className="field">
              <label>Firma Adı *</label>
              <input
                value={form.firma}
                onChange={(e) => update('firma', e.target.value)}
                placeholder="Örnek: ABC Mobilya Ltd. Şti."
                required
              />
            </div>
            <div className="field">
              <label>Telefon *</label>
              <input
                value={form.telefon}
                onChange={(e) => update('telefon', e.target.value)}
                placeholder="0532 123 45 67"
                required
              />
            </div>
            <div className="field">
              <label>Yetkili *</label>
              <input
                value={form.yetkili}
                onChange={(e) => update('yetkili', e.target.value)}
                placeholder="Ad Soyad"
                required
              />
            </div>
            <div className="field">
              <label>Adres</label>
              <input
                value={form.adres}
                onChange={(e) => update('adres', e.target.value)}
                placeholder="Firma adresi (opsiyonel)"
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              PVC Tipi Seçimi
            </label>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              {PVC_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: form.pvcSecim.includes(opt) ? '#dcfce7' : 'white'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.pvcSecim.includes(opt)}
                    onChange={() => togglePvc(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Notlar</label>
            <textarea
              rows={2}
              value={form.notlar}
              onChange={(e) => update('notlar', e.target.value)}
              placeholder="Ek bilgi (opsiyonel)"
            />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Ebat Tablosu (44 satır)
            </h2>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowTable(true)}
            >
              Tabloyu Aç / Düzenle
            </button>
          </div>
          <div className="alert info" style={{ marginTop: 12 }}>
            Doldurulan satır sayısı: <strong>{compactRows(form.rows).length}</strong> / 44
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: 20 }}>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Formu Kaydet'}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate('/')}
          >
            İptal
          </button>
        </div>
      </form>

      {showTable && (
        <div className="modal-backdrop" onClick={() => setShowTable(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Ebat Tablosu — 44 Satır</h3>
              <button className="modal-close" onClick={() => setShowTable(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', fontSize: 13 }}>
                Malzeme cinsi, PVC tipi, boy, en ve adet bilgilerini girin. Boş satırlar
                kayıt sırasında dikkate alınmaz.
              </p>
              <div className="table-wrap">
                <table className="form-grid-table">
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>MALZEMENİN CİNSİ</th>
                      <th>PVC</th>
                      <th>BOY</th>
                      <th>EN</th>
                      <th>ADET</th>
                      <th>BOY</th>
                      <th>EN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="row-num">{idx + 1}</td>
                        <td>
                          <input
                            value={row.malzeme}
                            onChange={(e) => updateRow(idx, 'malzeme', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            value={row.pvc}
                            onChange={(e) => updateRow(idx, 'pvc', e.target.value)}
                          >
                            <option value="">-</option>
                            {PVC_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            value={row.boy1}
                            onChange={(e) => updateRow(idx, 'boy1', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            value={row.en1}
                            onChange={(e) => updateRow(idx, 'en1', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={row.adet || ''}
                            onChange={(e) =>
                              updateRow(idx, 'adet', Number(e.target.value) || 0)
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={row.boy2}
                            onChange={(e) => updateRow(idx, 'boy2', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            value={row.en2}
                            onChange={(e) => updateRow(idx, 'en2', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowTable(false)}
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}