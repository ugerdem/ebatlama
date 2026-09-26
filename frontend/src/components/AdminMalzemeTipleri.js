import React, { useEffect, useState } from 'react';
import {
  getMalzemeTipleri,
  addMalzemeTipi,
  renameMalzemeTipi,
  deleteMalzemeTipi
} from '../utils/api';
import { useMalzemeOptions } from './MalzemeOptionsContext';
import Toast from './Toast';

export default function AdminMalzemeTipleri() {
  const { malzemeOptions, loading, refresh } = useMalzemeOptions();
  const [values, setValues] = useState(malzemeOptions);
  const [newName, setNewName] = useState('');
  const [editingValue, setEditingValue] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!loading) setValues(malzemeOptions);
  }, [malzemeOptions, loading]);

  useEffect(() => {
    getMalzemeTipleri()
      .then((res) => {
        if (Array.isArray(res.data?.values)) setValues(res.data.values);
      })
      .catch(() => {});
  }, []);

  async function run(action, successMessage) {
    setBusy(true);
    try {
      await action();
      const res = await getMalzemeTipleri();
      if (Array.isArray(res.data?.values)) setValues(res.data.values);
      refresh();
      setToast({ type: 'success', message: successMessage });
      return true;
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'İşlem başarısız' });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const ad = newName.trim();
    if (!ad) return;
    const ok = await run(() => addMalzemeTipi(ad), `"${ad}" eklendi`);
    if (ok) setNewName('');
  }

  function startEdit(v) {
    setEditingValue(v);
    setEditDraft(v);
  }

  function cancelEdit() {
    setEditingValue(null);
    setEditDraft('');
  }

  async function handleRename() {
    const yeni = editDraft.trim();
    if (!yeni || !editingValue) return;
    if (yeni === editingValue) {
      cancelEdit();
      return;
    }
    const ok = await run(
      () => renameMalzemeTipi(editingValue, yeni),
      `"${editingValue}" → "${yeni}" olarak güncellendi`
    );
    if (ok) cancelEdit();
  }

  async function handleDelete(v) {
    if (
      !window.confirm(
        `"${v}" silinsin mi?\n\nBu tipi kullanan eski formlar etkilenmez, ancak yeni form girişlerinde artık seçilemez.`
      )
    ) {
      return;
    }
    await run(() => deleteMalzemeTipi(v), `"${v}" silindi`);
  }

  return (
    <div className="card">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <h2 className="section-title">Malzeme Tipleri Yönetimi</h2>
      <p className="settings-hint">
        Bu listede tanımladığınız malzeme tipleri; yeni form girişindeki "Malzeme Cinsi"
        seçim listesinde görünür. Mevcut formlar etkilenmez.
      </p>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Örnek: Kontraplak"
          maxLength={50}
          style={{
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 14,
            minWidth: 240,
            flex: '1 1 240px'
          }}
        />
        <button type="submit" className="btn" disabled={busy || !newName.trim()}>
          + Ekle
        </button>
      </form>

      {loading ? (
        <div className="empty-state">Yükleniyor…</div>
      ) : values.length === 0 ? (
        <div className="empty-state">
          <h3>Liste boş</h3>
          <p>Yukarıdaki alandan yeni bir malzeme tipi ekleyin.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Malzeme Tipi</th>
                <th style={{ width: 160 }}></th>
                <th style={{ width: 200 }}></th>
              </tr>
            </thead>
            <tbody>
              {values.map((v, i) => (
                <tr key={v}>
                  <td className="row-num">{i + 1}</td>
                  <td>
                    {editingValue === v ? (
                      <input
                        value={editDraft}
                        autoFocus
                        maxLength={50}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRename();
                          }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: 8,
                          fontSize: 14,
                          width: '100%'
                        }}
                      />
                    ) : (
                      <strong style={{ color: '#0f766e' }}>{v}</strong>
                    )}
                  </td>
                  <td>{editingValue === v ? <span style={{ color: '#64748b', fontSize: 13 }}>Düzenleniyor…</span> : null}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {editingValue === v ? (
                      <>
                        <button type="button" className="btn btn-xs" onClick={handleRename} disabled={busy || !editDraft.trim()}>
                          Kaydet
                        </button>{' '}
                        <button type="button" className="btn secondary btn-xs" onClick={cancelEdit}>
                          İptal
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn ghost btn-xs" onClick={() => startEdit(v)}>
                          ✏️ Düzenle
                        </button>{' '}
                        <button type="button" className="btn danger btn-xs" onClick={() => handleDelete(v)} disabled={busy}>
                          Sil
                        </button>
                      </>
                    )}
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