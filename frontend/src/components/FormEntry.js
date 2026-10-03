import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createForm } from '../utils/api';
import { validateForm, compactRows } from '../utils/helpers';
import Toast from './Toast';
import EbatTable from './EbatTable';
import { useAuth } from './AuthContext';
import { usePvcOptions } from './PvcOptionsContext';
import { useMalzemeOptions } from './MalzemeOptionsContext';

const EMPTY_ROW_DRAFT = {
  malzeme: '',
  pvc: '',
  boy1: '',
  en1: '',
  adet: '1',
  pvcBoy1: false,
  pvcBoy2: false,
  pvcEn1: false,
  pvcEn2: false
};

export default function FormEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pvcOptions: PVC_OPTIONS } = usePvcOptions();
  const { malzemeOptions: MALZEME_OPTIONS } = useMalzemeOptions();

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
  const [rowDraft, setRowDraft] = useState(EMPTY_ROW_DRAFT);
  const [modalRows, setModalRows] = useState([]);
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
    setRowDraft(EMPTY_ROW_DRAFT);
    setModalRows([]);
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
    setModalRows([]);
  }

  function updateRowDraft(field, value) {
    setRowDraft((draft) => ({ ...draft, [field]: value }));
  }

  function validateRowDraft(draft) {
    const errs = [];
    if (!draft.malzeme.trim()) errs.push('Malzeme cinsi zorunlu');
    if (!draft.pvc) errs.push('PVC tipi seçmelisiniz');
    if (!draft.boy1.trim()) errs.push('Boy (mm) bilgisi zorunlu');
    else if (Number(draft.boy1) <= 0) errs.push('Boy (mm) 0’dan büyük olmalı');
    if (!draft.en1.trim()) errs.push('En (mm) bilgisi zorunlu');
    else if (Number(draft.en1) <= 0) errs.push('En (mm) 0’dan büyük olmalı');
    if (!String(draft.adet).trim() || Number(draft.adet) <= 0) errs.push('Adet 0’dan büyük olmalı');
    return errs;
  }

  function validateSavedRows(rows) {
    const errs = [];
    (rows || []).forEach((row, index) => {
      if (!row.malzeme?.trim()) errs.push(`${index + 1}. satırda malzeme cinsi eksik`);
      if (!row.pvc) errs.push(`${index + 1}. satırda PVC tipi eksik`);
      if (!row.boy1?.trim()) errs.push(`${index + 1}. satırda boy (mm) eksik`);
      else if (Number(row.boy1) <= 0) errs.push(`${index + 1}. satırda boy (mm) 0'dan büyük olmalı`);
      if (!row.en1?.trim()) errs.push(`${index + 1}. satırda en (mm) eksik`);
      else if (Number(row.en1) <= 0) errs.push(`${index + 1}. satırda en (mm) 0'dan büyük olmalı`);
      if (!Number(row.adet) || Number(row.adet) <= 0) {
        errs.push(`${index + 1}. satırda adet 0'dan büyük olmalı`);
      }
    });
    return errs;
  }

  function saveRow() {
    const lockedBaseRow = editingIndex === null && modalRows.length > 0 ? modalRows[0] : null;
    const draftToValidate = lockedBaseRow
      ? { ...rowDraft, malzeme: lockedBaseRow.malzeme }
      : rowDraft;

    const errs = validateRowDraft(draftToValidate);
    setRowErrors(errs);
    if (errs.length) return;

    const normalized = {
      malzeme: draftToValidate.malzeme.trim(),
      pvc: draftToValidate.pvc,
      boy1: draftToValidate.boy1.trim(),
      en1: draftToValidate.en1.trim(),
      adet: Number(draftToValidate.adet),
      pvcBoy1: draftToValidate.pvcBoy1 === true,
      pvcBoy2: draftToValidate.pvcBoy2 === true,
      pvcEn1: draftToValidate.pvcEn1 === true,
      pvcEn2: draftToValidate.pvcEn2 === true
    };

    if (editingIndex === null) {
      setModalRows((rows) => [...rows, normalized]);
      setRowErrors([]);
      setRowDraft({
        ...EMPTY_ROW_DRAFT,
        malzeme: normalized.malzeme,
        pvc: normalized.pvc
      });
      return;
    }

    setForm((f) => {
      const rows = [...f.rows];
      rows[editingIndex] = normalized;
      return { ...f, rows };
    });

    closeRowModal();
  }

  function transferModalRowsToMainTable() {
    if (editingIndex !== null) {
      closeRowModal();
      return;
    }

    if (modalRows.length === 0) {
      setRowErrors(['Önce en az bir satırı popup tablosuna ekleyin']);
      return;
    }

    setForm((f) => ({
      ...f,
      rows: [...f.rows, ...modalRows]
    }));

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

  const popupPreviewRows = editingIndex === null ? modalRows : [rowDraft];
  const isPopupMaterialLocked = editingIndex === null && modalRows.length > 0;
  const isPopupPvcLocked = editingIndex === null && modalRows.length > 0;
  const rowsByMalzeme = Array.from(
    (form.rows || []).reduce((map, row, idx) => {
      const key = (row?.malzeme || '').trim() || 'Malzeme belirtilmedi';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...row, __sourceIndex: idx });
      return map;
    }, new Map())
  );

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
          {rowsByMalzeme.length === 0 ? (
            <div className="alert info" style={{ marginTop: 12 }}>
              Satır ekleme aksiyonu sonrasında siparişiniz burada görünecektir.
            </div>
          ) : (
            <div className="grouped-ebat-sections">
              {rowsByMalzeme.map(([malzeme, groupedRows]) => {
                const pvcText = Array.from(
                  new Set(groupedRows.map((r) => (r.pvc || '').trim()).filter(Boolean))
                ).join(' • ') || '—';

                return (
                  <details key={malzeme} className="grouped-ebat-section" open>
                    <summary className="grouped-ebat-summary">
                      <span><strong>Malzeme:</strong> {malzeme}</span>
                      <span><strong>PVC:</strong> {pvcText}</span>
                      <span><strong>Satır:</strong> {groupedRows.length}</span>
                    </summary>

                    <EbatTable
                      rows={groupedRows}
                      totalRows={null}
                      split={false}
                      onRowClick={(idx) => openEditRowModal(groupedRows[idx].__sourceIndex)}
                      renderActions={(idx) => (
                        <button
                          type="button"
                          className="btn danger btn-xs"
                          onClick={() => deleteRow(groupedRows[idx].__sourceIndex)}
                          title="Satırı sil"
                        >
                          Sil
                        </button>
                      )}
                    />
                  </details>
                );
              })}
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

              {/* 1-2. Önce malzeme ve PVC */}
              <div className="modal-section compact-top-section">
                <div className="section-caption">1. Malzeme ve PVC</div>
                <div className="row-form-grid row-form-grid-compact">
                  <div className="field">
                    <label>Malzeme Cinsi *</label>
                    <select
                      value={rowDraft.malzeme}
                      onChange={(e) => updateRowDraft('malzeme', e.target.value)}
                      disabled={isPopupMaterialLocked}
                    >
                      <option value="">Seçiniz</option>
                      {MALZEME_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>PVC Tipi *</label>
                    <select
                      value={rowDraft.pvc}
                      onChange={(e) => updateRowDraft('pvc', e.target.value)}
                      disabled={isPopupPvcLocked}
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
              </div>

              {/* 3. Diğer bilgiler */}
              <div className="modal-section">
                <div className="row-form-grid row-form-grid-compact">
                  <div className="field">
                    <label>Boy (mm) *</label>
                    <input
                      value={rowDraft.boy1}
                      onChange={(e) => updateRowDraft('boy1', onlyDigits(e.target.value))}
                      placeholder="mm"
                    />
                  </div>
                  <div className="field">
                    <label>En (mm) *</label>
                    <input
                      value={rowDraft.en1}
                      onChange={(e) => updateRowDraft('en1', onlyDigits(e.target.value))}
                      placeholder="mm"
                    />
                  </div>
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
              </div>

              {/* 4. PVC Kenarları — dikdörtgen tahta, 4 kenar bağımsız */}
              <div className="modal-section">
                <div className="section-caption">3. PVC Kenarları</div>
                <p className="row-dimension-hint" style={{ margin: '0 0 8px' }}>
                  PVC uygulanacak ölçü kenarlarını seçin.
                </p>
                <div className="edge-grid">
                  <label className="dim-checkbox-row">
                    <input
                      type="checkbox"
                      checked={rowDraft.pvcBoy1}
                      onChange={(e) => updateRowDraft('pvcBoy1', e.target.checked)}
                    />
                    <span>Boy 1</span>
                  </label>
                  <label className="dim-checkbox-row">
                    <input
                      type="checkbox"
                      checked={rowDraft.pvcEn1}
                      onChange={(e) => updateRowDraft('pvcEn1', e.target.checked)}
                    />
                    <span>En 1</span>
                  </label>
                  <label className="dim-checkbox-row">
                    <input
                      type="checkbox"
                      checked={rowDraft.pvcBoy2}
                      onChange={(e) => updateRowDraft('pvcBoy2', e.target.checked)}
                    />
                    <span>Boy 2</span>
                  </label>
                  <label className="dim-checkbox-row">
                    <input
                      type="checkbox"
                      checked={rowDraft.pvcEn2}
                      onChange={(e) => updateRowDraft('pvcEn2', e.target.checked)}
                    />
                    <span>En 2</span>
                  </label>
                </div>
              </div>

              {editingIndex === null && (
                <div className="modal-inline-actions">
                  <button type="button" className="btn" onClick={saveRow}>
                    Ekle
                  </button>
                </div>
              )}

              {/* 5. Popup altında tablo önizleme alanı */}
              <div className="modal-section">
                <div className="section-caption">4. Eklenecek Satır Önizleme</div>
                <div className="modal-ebat-preview">
                  <EbatTable rows={popupPreviewRows} totalRows={null} split={false} />
                </div>
              </div>

              <div className="row-modal-actions">
                <button type="button" className="btn secondary" onClick={closeRowModal}>
                  İptal
                </button>
                {editingIndex === null ? (
                  <button type="button" className="btn" onClick={transferModalRowsToMainTable}>
                    Satırları Ana Tabloya Aktar
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={saveRow}>
                    Güncelle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}