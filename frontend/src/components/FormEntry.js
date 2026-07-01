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
    pvcBoy1: false,
    pvcBoy2: false,
    pvcEn1: false,
    pvcEn2: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // mm / adet gibi sayısal alanlara sadece rakam girişi için filtre
  function onlyDigits(v) {
    return String(v == null ? '' : v).replace(/[^\d]/g, '');
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
      pvcBoy1: false,
      pvcBoy2: false,
      pvcEn1: false,
      pvcEn2: false
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
      pvcBoy1: row.pvcBoy1 === true,
      pvcBoy2: row.pvcBoy2 === true,
      pvcEn1: row.pvcEn1 === true,
      pvcEn2: row.pvcEn2 === true
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
    if (!draft.boy1.trim()) errs.push('Boy (mm) bilgisi zorunlu');
    if (!draft.en1.trim()) errs.push('En (mm) bilgisi zorunlu');
    if (!String(draft.adet).trim() || Number(draft.adet) <= 0) errs.push('Adet 0’dan büyük olmalı');
    return errs;
  }

  function validateSavedRows(rows) {
    const errs = [];
    (rows || []).forEach((row, index) => {
      if (!row.malzeme?.trim()) errs.push(`${index + 1}. satırda malzeme cinsi eksik`);
      if (!row.pvc) errs.push(`${index + 1}. satırda PVC tipi eksik`);
      if (!row.boy1?.trim()) errs.push(`${index + 1}. satırda boy (mm) eksik`);
      if (!row.en1?.trim()) errs.push(`${index + 1}. satırda en (mm) eksik`);
      if (!Number(row.adet) || Number(row.adet) <= 0) {
        errs.push(`${index + 1}. satırda adet 0'dan büyük olmalı`);
      }
    });
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
      pvcBoy1: rowDraft.pvcBoy1 === true,
      pvcBoy2: rowDraft.pvcBoy2 === true,
      pvcEn1: rowDraft.pvcEn1 === true,
      pvcEn2: rowDraft.pvcEn2 === true
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

    const rowValidationErrors = validateSavedRows(rows);
    if (rowValidationErrors.length) {
      setToast({
        type: 'error',
        message: 'Satırlarda eksik bilgi var. Lütfen tüm kayıtları tam doldurun.'
      });
      setErrors(rowValidationErrors);
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
                    <span className="badge isleme_alindi row-summary-badge">{row.pvc || 'PVC yok'}</span>
                  </div>
                  <div className="row-summary-meta">
                    <span><strong>Boy:</strong> {row.boy1} mm</span>
                    <span><strong>En:</strong> {row.en1} mm</span>
                    <span><strong>Adet:</strong> {row.adet}</span>
                    <span className="row-summary-edges">
                      <strong>PVC Kenarları:</strong>{' '}
                      {[
                        row.pvcBoy1 && 'Üst',
                        row.pvcEn1 && 'Sol',
                        row.pvcEn2 && 'Sağ',
                        row.pvcBoy2 && 'Alt'
                      ]
                        .filter(Boolean)
                        .join(' • ') || 'Yok'}
                    </span>
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
              <p className="modal-intro">
                Tüm ölçüler milimetre cinsinden ve sadece rakam olarak girilir.
              </p>

              {rowErrors.length > 0 && (
                <div className="alert error">
                  {rowErrors.map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}

              {/* 1. Malzeme Cinsi */}
              <div className="modal-section">
                <div className="section-caption">1. Malzeme</div>
                <div className="field">
                  <label>Malzeme Cinsi *</label>
                  <input
                    value={rowDraft.malzeme}
                    onChange={(e) => updateRowDraft('malzeme', e.target.value)}
                    placeholder="Örn: MDFLAM, SAUTALAM, Masif Panel"
                  />
                </div>
              </div>

              {/* 2. En / Boy (mm) */}
              <div className="modal-section">
                <div className="section-caption">2. Ölçüler (mm)</div>
                <div className="row-form-grid">
                  <div className="field">
                    <label>En (mm) *</label>
                    <input
                      value={rowDraft.en1}
                      onChange={(e) => updateRowDraft('en1', onlyDigits(e.target.value))}
                      placeholder="mm"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
                  <div className="field">
                    <label>Boy (mm) *</label>
                    <input
                      value={rowDraft.boy1}
                      onChange={(e) => updateRowDraft('boy1', onlyDigits(e.target.value))}
                      placeholder="mm"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
                </div>
              </div>

              {/* 3. PVC Tipi */}
              <div className="modal-section">
                <div className="section-caption">3. PVC</div>
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
              </div>

              {/* 4. PVC Kenarları — dikdörtgen tahta, 4 kenar bağımsız */}
              <div className="modal-section">
                <div className="section-caption">4. PVC Kenarları</div>
                <p className="row-dimension-hint" style={{ margin: '0 0 8px' }}>
                  Tahtanın hangi kenarlarına PVC uygulanacağını seçin (4 kenar bağımsız).
                </p>
                <div className="edge-grid">
                  <div className="edge-cell edge-cell-top">
                    <label className="dim-checkbox-row">
                      <input
                        type="checkbox"
                        checked={rowDraft.pvcBoy1}
                        onChange={(e) => updateRowDraft('pvcBoy1', e.target.checked)}
                      />
                      <span>Üst kenar (Boy 1)</span>
                    </label>
                  </div>
                  <div className="edge-cell edge-cell-left">
                    <label className="dim-checkbox-row">
                      <input
                        type="checkbox"
                        checked={rowDraft.pvcEn1}
                        onChange={(e) => updateRowDraft('pvcEn1', e.target.checked)}
                      />
                      <span>Sol kenar (En 1)</span>
                    </label>
                  </div>
                  <div className="edge-cell edge-cell-board">
                    <div className="edge-board-inner" />
                  </div>
                  <div className="edge-cell edge-cell-right">
                    <label className="dim-checkbox-row">
                      <input
                        type="checkbox"
                        checked={rowDraft.pvcEn2}
                        onChange={(e) => updateRowDraft('pvcEn2', e.target.checked)}
                      />
                      <span>Sağ kenar (En 2)</span>
                    </label>
                  </div>
                  <div className="edge-cell edge-cell-bottom">
                    <label className="dim-checkbox-row">
                      <input
                        type="checkbox"
                        checked={rowDraft.pvcBoy2}
                        onChange={(e) => updateRowDraft('pvcBoy2', e.target.checked)}
                      />
                      <span>Alt kenar (Boy 2)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 5. Adet — her şeyin altında */}
              <div className="modal-section">
                <div className="section-caption">5. Adet</div>
                <div className="field">
                  <label>Adet *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={rowDraft.adet}
                    onChange={(e) => updateRowDraft('adet', onlyDigits(e.target.value))}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                    }}
                    placeholder="1"
                  />
                </div>
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