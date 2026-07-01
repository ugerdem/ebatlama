import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createForm } from '../utils/api';
import { PVC_OPTIONS, validateForm, compactRows } from '../utils/helpers';
import Toast from './Toast';
import { useAuth } from './AuthContext';

export default function FormEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    firma: '',
    telefon: '',
    yetkili: '',
    adres: '',
    rows: [],
    notlar: ''
  });

  const [showRowModal, setShowRowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [rowDraft, setRowDraft] = useState({
    malzeme: '',
    pvc: '',
    boy1: '',
    en1: '',
    adet: '',
    useBoy2: false,
    useEn2: false,
    boy2: '',
    en2: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openNewRowModal() {
    setEditingIndex(null);
    setRowErrors([]);
    setRowDraft({
      malzeme: '',
      pvc: '',
      boy1: '',
      en1: '',
      adet: '',
      useBoy2: false,
      useEn2: false,
      boy2: '',
      en2: ''
    });
    setShowRowModal(true);
  }

  function openEditRowModal(idx) {
    const row = form.rows[idx];
    setEditingIndex(idx);
    setRowErrors([]);
    setRowDraft({
      malzeme: row.malzeme || '',
      pvc: row.pvc || '',
      boy1: row.boy1 || '',
      en1: row.en1 || '',
      adet: row.adet || '',
      useBoy2: Boolean(row.useBoy2 || row.boy2),
      useEn2: Boolean(row.useEn2 || row.en2),
      boy2: row.boy2 || '',
      en2: row.en2 || ''
    });
    setShowRowModal(true);
  }

  function closeRowModal() {
    setShowRowModal(false);
    setEditingIndex(null);
    setRowErrors([]);
  }

  function updateRowDraft(field, value) {
    setRowDraft((draft) => ({ ...draft, [field]: value }));
  }

  function validateRowDraft(draft) {
    const errs = [];
    if (!draft.malzeme.trim()) errs.push('Malzeme cinsi zorunlu');
    if (!draft.pvc) errs.push('PVC tipi seçmelisiniz');
    if (!draft.boy1.trim()) errs.push('1. boy mm bilgisi zorunlu');
    if (!draft.en1.trim()) errs.push('1. en mm bilgisi zorunlu');
    if (!String(draft.adet).trim() || Number(draft.adet) <= 0) errs.push('Adet 0’dan büyük olmalı');
    if (draft.useBoy2 && !draft.boy2.trim()) errs.push('2. boy mm bilgisi zorunlu');
    if (draft.useEn2 && !draft.en2.trim()) errs.push('2. en mm bilgisi zorunlu');
    return errs;
  }

  function saveRow() {
    const errs = validateRowDraft(rowDraft);
    setRowErrors(errs);
    if (errs.length) return;

    const normalized = {
      malzeme: rowDraft.malzeme.trim(),
      pvc: rowDraft.pvc,
      boy1: rowDraft.boy1.trim(),
      en1: rowDraft.en1.trim(),
      adet: Number(rowDraft.adet),
      useBoy2: Boolean(rowDraft.useBoy2),
      useEn2: Boolean(rowDraft.useEn2),
      boy2: rowDraft.useBoy2 ? rowDraft.boy2.trim() : '',
      en2: rowDraft.useEn2 ? rowDraft.en2.trim() : ''
    };

    setForm((f) => {
      const rows = [...f.rows];
      if (editingIndex === null) {
        rows.push(normalized);
      } else {
        rows[editingIndex] = normalized;
      }
      return { ...f, rows };
    });

    closeRowModal();
  }

  function deleteRow(idx) {
    const row = form.rows[idx];
    if (!window.confirm(`"${row.malzeme}" satırını silmek istediğinize emin misiniz?`)) return;
    setForm((f) => ({
      ...f,
      rows: f.rows.filter((_, i) => i !== idx)
    }));
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validateForm(form);
    setErrors(errs);
    if (errs.length) {
      setToast({ type: 'error', message: 'Lütfen zorunlu alanları doldurun' });
      return;
    }
    const rows = compactRows(form.rows);
    if (rows.length === 0) {
      setToast({ type: 'error', message: 'En az bir tablo kaydı girmelisiniz' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firma: form.firma.trim(),
        telefon: form.telefon.trim(),
        yetkili: form.yetkili.trim(),
        adres: form.adres.trim(),
        rows,
        notlar: form.notlar
      };
      const { data } = await createForm(payload);
      setToast({
        type: 'success',
        message: `Form oluşturuldu. Form No: ${data.formNo}`
      });
      setTimeout(() => {
        if (user) {
          navigate(`/forms/${data.id}`);
        } else {
          navigate(`/query?formNo=${encodeURIComponent(data.formNo)}`);
        }
      }, 800);
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
              <textarea
                className="single-line-textarea"
                rows={1}
                value={form.adres}
                onChange={(e) => update('adres', e.target.value)}
                placeholder="Firma adresi (opsiyonel)"
              />
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
              Ebat Kayıtları
            </h2>
            <button
              type="button"
              className="btn secondary"
              onClick={openNewRowModal}
            >
              + Satır Ekle
            </button>
          </div>
          <div className="alert info" style={{ marginTop: 12 }}>
            Dolu kayıt sayısı: <strong>{compactRows(form.rows).length}</strong>
          </div>

          {form.rows.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 12 }}>
              <h3>Henüz kayıt yok</h3>
              <p>Her satır için popup açıp malzeme, PVC ve mm bilgilerini girin.</p>
            </div>
          ) : (
            <div className="row-summary-list">
              {form.rows.map((row, idx) => (
                <div className="row-summary-card" key={`${row.malzeme}-${idx}`}>
                  <div className="row-summary-top">
                    <div>
                      <div className="row-summary-title">{idx + 1}. kayıt</div>
                      <div className="row-summary-main">{row.malzeme}</div>
                    </div>
                    <span className="badge isleme_alindi">{row.pvc || 'PVC yok'}</span>
                  </div>
                  <div className="row-summary-meta">
                    <span><strong>1. Boy:</strong> {row.boy1} mm</span>
                    <span><strong>1. En:</strong> {row.en1} mm</span>
                    <span><strong>Adet:</strong> {row.adet}</span>
                    <span><strong>2. Boy:</strong> {row.useBoy2 ? `${row.boy2} mm` : 'Yok'}</span>
                    <span><strong>2. En:</strong> {row.useEn2 ? `${row.en2} mm` : 'Yok'}</span>
                  </div>
                  <div className="row-summary-actions">
                    <button type="button" className="btn secondary" onClick={() => openEditRowModal(idx)}>
                      Düzenle
                    </button>
                    <button type="button" className="btn danger" onClick={() => deleteRow(idx)}>
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="btn-row" style={{ marginTop: 20 }}>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Formu Kaydet'}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(user ? '/' : '/login')}
          >
            İptal
          </button>
        </div>
      </form>

      {showRowModal && (
        <div className="modal-backdrop" onClick={closeRowModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>
                {editingIndex === null ? 'Yeni Satır Ekle' : 'Satırı Düzenle'}
              </h3>
              <button className="modal-close" onClick={closeRowModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
                Tüm ölçüler milimetre cinsinden girilir. PVC seçin, ardından 1. boy / 1. en ve
                gerekiyorsa 2. boy / 2. en için kutuları işaretleyin.
              </p>
              {rowErrors.length > 0 && (
                <div className="alert error">
                  {rowErrors.map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}

              <div className="row-form-grid">
                <div className="field">
                  <label>Malzeme Cinsi *</label>
                  <input
                    value={rowDraft.malzeme}
                    onChange={(e) => updateRowDraft('malzeme', e.target.value)}
                    placeholder="Örn: MDFLAM, SAUTALAM, Masif Panel"
                  />
                </div>

                <div className="field">
                  <label>PVC Tipi *</label>
                  <select
                    value={rowDraft.pvc}
                    onChange={(e) => updateRowDraft('pvc', e.target.value)}
                  >
                    <option value="">Seçiniz</option>
                    {PVC_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>1. Boy (mm) *</label>
                  <input
                    value={rowDraft.boy1}
                    onChange={(e) => updateRowDraft('boy1', e.target.value)}
                    placeholder="mm"
                    inputMode="numeric"
                  />
                </div>

                <div className="field">
                  <label>1. En (mm) *</label>
                  <input
                    value={rowDraft.en1}
                    onChange={(e) => updateRowDraft('en1', e.target.value)}
                    placeholder="mm"
                    inputMode="numeric"
                  />
                </div>

                <div className="field">
                  <label>ADET *</label>
                  <input
                    type="number"
                    min="1"
                    value={rowDraft.adet}
                    onChange={(e) => updateRowDraft('adet', e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="row-check-grid">
                <label className="row-check-card">
                  <input
                    type="checkbox"
                    checked={rowDraft.useBoy2}
                    onChange={(e) =>
                      updateRowDraft('useBoy2', e.target.checked)
                    }
                  />
                  <span>
                    <strong>2. Boy girişi</strong>
                    <small>Ek boy ölçüsü girmek için işaretleyin</small>
                  </span>
                </label>

                <label className="row-check-card">
                  <input
                    type="checkbox"
                    checked={rowDraft.useEn2}
                    onChange={(e) =>
                      updateRowDraft('useEn2', e.target.checked)
                    }
                  />
                  <span>
                    <strong>2. En girişi</strong>
                    <small>Ek en ölçüsü girmek için işaretleyin</small>
                  </span>
                </label>
              </div>

              <div className="row-form-grid" style={{ marginTop: 14 }}>
                {rowDraft.useBoy2 && (
                  <div className="field">
                    <label>2. Boy (mm)</label>
                    <input
                      value={rowDraft.boy2}
                      onChange={(e) => updateRowDraft('boy2', e.target.value)}
                      placeholder="mm"
                      inputMode="numeric"
                    />
                  </div>
                )}
                {rowDraft.useEn2 && (
                  <div className="field">
                    <label>2. En (mm)</label>
                    <input
                      value={rowDraft.en2}
                      onChange={(e) => updateRowDraft('en2', e.target.value)}
                      placeholder="mm"
                      inputMode="numeric"
                    />
                  </div>
                )}
              </div>

              <div className="row-modal-actions">
                <button type="button" className="btn secondary" onClick={closeRowModal}>
                  İptal
                </button>
                <button type="button" className="btn" onClick={saveRow}>
                  {editingIndex === null ? 'Satırı Ekle' : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}