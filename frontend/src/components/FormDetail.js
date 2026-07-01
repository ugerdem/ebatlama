import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getForm,
  updateForm,
  updateFormStatus,
  STATUS_LABEL,
  deleteForm
} from '../utils/api';
import { PVC_OPTIONS, STATUS_OPTIONS, formatDateTime } from '../utils/helpers';
import { useAuth } from './AuthContext';
import FormPrint from './FormPrint';
import Toast from './Toast';
import { exportFormToExcel } from '../utils/excel';

export default function FormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('preview'); // preview | history | edit
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // editable copy

  useEffect(() => {
    setLoading(true);
    getForm(id)
      .then((r) => {
        setForm(r.data);
        setEditing(structuredCopy(r.data));
      })
      .catch(() => setToast({ type: 'error', message: 'Form yüklenemedi' }))
      .finally(() => setLoading(false));
  }, [id]);

  function structuredCopy(f) {
    return {
      ...f,
      rows: (f.rows || []).map((r) => ({ ...r })),
      pvcSecim: [...(f.pvcSecim || [])]
    };
  }

  async function saveEdit() {
    try {
      const payload = {
        firma: editing.firma,
        telefon: editing.telefon,
        yetkili: editing.yetkili,
        adres: editing.adres,
        pvcSecim: editing.pvcSecim,
        rows: editing.rows,
        notlar: editing.notlar
      };
      const { data } = await updateForm(id, payload);
      setForm(data.form);
      setEditing(structuredCopy(data.form));
      setToast({ type: 'success', message: 'Form güncellendi' });
      setTab('preview');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Güncelleme hatası' });
    }
  }

  async function changeStatus(durum) {
    const label = STATUS_LABEL[durum];
    if (!window.confirm(`Durumu "${label}" olarak değiştirmek istediğinize emin misiniz?`)) return;
    try {
      const { data } = await updateFormStatus(id, durum, '');
      setForm(data.form);
      setToast({ type: 'success', message: `Durum güncellendi: ${label}` });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Durum güncellenemedi' });
    }
  }

  async function remove() {
    if (!window.confirm('Bu formu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await deleteForm(id);
      navigate('/');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Silinemedi' });
    }
  }

  function updateEdit(field, value) {
    setEditing((e) => ({ ...e, [field]: value }));
  }

  function updateEditRow(idx, field, value) {
    setEditing((e) => {
      const rows = [...e.rows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...e, rows };
    });
  }

  function toggleEditPvc(opt) {
    setEditing((e) => {
      const has = e.pvcSecim.includes(opt);
      return {
        ...e,
        pvcSecim: has ? e.pvcSecim.filter((o) => o !== opt) : [...e.pvcSecim, opt]
      };
    });
  }

  function printAsPDF() {
    window.print();
  }

  if (loading) return <div className="card">Yükleniyor…</div>;
  if (!form) return <div className="card">Form bulunamadı</div>;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="card no-print">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Form No</div>
            <h2 style={{ margin: '2px 0 6px', color: '#0f766e' }}>{form.formNo}</h2>
            <div style={{ fontSize: 14, color: '#334155' }}>
              <strong>{form.firma}</strong> — {form.yetkili} ({form.telefon})
            </div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${form.durum}`}>
                {STATUS_LABEL[form.durum] || form.durum}
              </span>
              <span style={{ marginLeft: 10, color: '#64748b', fontSize: 13 }}>
                Oluşturuldu: {formatDateTime(form.createdAt)}
              </span>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn" onClick={printAsPDF}>
              🖨 Yazdır / PDF
            </button>
            <button className="btn secondary" onClick={() => exportFormToExcel(form)}>
              📊 Excel İndir
            </button>
            <Link to="/" className="btn ghost">
              ← Geri
            </Link>
          </div>
        </div>

        {isAdmin && form.durum !== 'tamamlandi' && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#f8fafc',
              borderRadius: 8
            }}
          >
            <strong style={{ fontSize: 13 }}>Durum Güncelle (Admin):</strong>
            <div className="btn-row" style={{ marginTop: 8 }}>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  className={`btn ${form.durum === s.value ? '' : 'secondary'}`}
                  onClick={() => changeStatus(s.value)}
                  disabled={form.durum === s.value}
                >
                  {s.label}
                </button>
              ))}
              <button className="btn danger" onClick={remove} style={{ marginLeft: 'auto' }}>
                Formu Sil
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0' }}>
          {[
            { k: 'preview', l: 'Önizleme / Yazdır' },
            { k: 'history', l: 'Durum Geçmişi' },
            ...(form.durum !== 'tamamlandi'
              ? [{ k: 'edit', l: 'Düzenle' }]
              : [])
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                padding: '10px 16px',
                background: tab === t.k ? '#0f766e' : 'transparent',
                color: tab === t.k ? 'white' : '#475569',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                fontWeight: 600
              }}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {tab === 'preview' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <FormPrint form={form} />
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <h3 className="section-title">Durum Geçmişi</h3>
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            {(form.durumGecmisi || []).map((d, i) => (
              <li key={i}>
                <strong>{STATUS_LABEL[d.durum] || d.durum}</strong> —{' '}
                {formatDateTime(d.tarih)}
                {d.aciklama ? ` — ${d.aciklama}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'edit' && editing && (
        <div className="card">
          <h3 className="section-title">Formu Düzenle</h3>
          <div className="form-grid">
            <div className="field">
              <label>Firma</label>
              <input
                value={editing.firma}
                onChange={(e) => updateEdit('firma', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Telefon</label>
              <input
                value={editing.telefon}
                onChange={(e) => updateEdit('telefon', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Yetkili</label>
              <input
                value={editing.yetkili}
                onChange={(e) => updateEdit('yetkili', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Adres</label>
              <input
                value={editing.adres || ''}
                onChange={(e) => updateEdit('adres', e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>PVC Tipi</label>
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
                    background: editing.pvcSecim.includes(opt) ? '#dcfce7' : 'white'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editing.pvcSecim.includes(opt)}
                    onChange={() => toggleEditPvc(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>Notlar</label>
            <textarea
              rows={2}
              value={editing.notlar || ''}
              onChange={(e) => updateEdit('notlar', e.target.value)}
            />
          </div>

          <h4 style={{ marginTop: 20 }}>Ebat Tablosu</h4>
          <div className="table-wrap">
            <table className="form-grid-table">
              <thead>
                <tr>
                  <th>NO</th>
                  <th>MALZEME</th>
                  <th>PVC</th>
                  <th>BOY (mm)</th>
                  <th>EN (mm)</th>
                  <th>ADET</th>
                  <th>Üst</th>
                  <th>Sol</th>
                  <th>Sağ</th>
                  <th>Alt</th>
                </tr>
              </thead>
              <tbody>
                {editing.rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="row-num">{idx + 1}</td>
                    <td>
                      <input
                        value={row.malzeme || ''}
                        onChange={(e) => updateEditRow(idx, 'malzeme', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={row.pvc || ''}
                        onChange={(e) => updateEditRow(idx, 'pvc', e.target.value)}
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
                        value={row.boy1 || ''}
                        onChange={(e) => updateEditRow(idx, 'boy1', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={row.en1 || ''}
                        onChange={(e) => updateEditRow(idx, 'en1', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.adet || 0}
                        onChange={(e) =>
                          updateEditRow(idx, 'adet', Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.pvcBoy1 === true}
                        onChange={(e) => updateEditRow(idx, 'pvcBoy1', e.target.checked)}
                        aria-label="Üst kenar PVC"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.pvcEn1 === true}
                        onChange={(e) => updateEditRow(idx, 'pvcEn1', e.target.checked)}
                        aria-label="Sol kenar PVC"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.pvcEn2 === true}
                        onChange={(e) => updateEditRow(idx, 'pvcEn2', e.target.checked)}
                        aria-label="Sağ kenar PVC"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.pvcBoy2 === true}
                        onChange={(e) => updateEditRow(idx, 'pvcBoy2', e.target.checked)}
                        aria-label="Alt kenar PVC"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={saveEdit}>
              💾 Kaydet
            </button>
            <button className="btn secondary" onClick={() => setTab('preview')}>
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}