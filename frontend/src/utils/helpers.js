// 44 boş satır şablonu
export function makeEmptyRows() {
  return Array.from({ length: 44 }, () => ({
    malzeme: '',
    pvc: '',
    boy1: '',
    en1: '',
    adet: 0,
    boy2: '',
    en2: ''
  }));
}

export const PVC_OPTIONS = ['0.40mm PVC', '0.80mm PVC', '2mm PVC'];

export const STATUS_OPTIONS = [
  { value: 'ilk_girildi', label: 'İlk Girildi' },
  { value: 'isleme_alindi', label: 'İşleme Alındı' },
  { value: 'tamamlandi', label: 'Tamamlandı' }
];

// Basit doğrulama
export function validateForm(form) {
  const errors = [];
  if (!form.firma || !form.firma.trim()) errors.push('Firma adı zorunlu');
  if (!form.telefon || !form.telefon.trim()) errors.push('Telefon zorunlu');
  if (!form.yetkili || !form.yetkili.trim()) errors.push('Yetkili zorunlu');
  return errors;
}

// Formdaki satırları sadece dolu olanlara indirger
export function compactRows(rows) {
  return (rows || []).filter(
    (r) =>
      r.malzeme ||
      r.pvc ||
      r.boy1 ||
      r.en1 ||
      (r.adet && r.adet > 0) ||
      r.boy2 ||
      r.en2
  );
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}