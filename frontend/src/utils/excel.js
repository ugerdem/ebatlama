import * as XLSX from 'xlsx';
import { STATUS_LABEL } from './api';
import { formatDate, formatDateTime } from './helpers';

// Excel export: formdaki 44 satırı + üst bilgiyi içeren workbook oluşturur
export function exportFormToExcel(form) {
  if (!form) return;

  const rows = form.rows || [];
  const headerInfo = [
    ['MEŞE TASARIM VE AHŞAP ÜRÜNLERİ SAN. TİC. LTD. ŞTİ.'],
    ['FASON İŞLEME MERKEZİ — EBATLAMA FORMU'],
    [],
    ['Form No', form.formNo],
    ['Tarih', formatDate(form.formTarihi || form.createdAt)],
    ['Durum', STATUS_LABEL[form.durum] || form.durum],
    ['Firma', form.firma],
    ['Telefon', form.telefon],
    ['Yetkili', form.yetkili],
    ['Adres', form.adres || ''],
    ['PVC Seçimi', (form.pvcSecim || []).join(' / ')],
    ['Notlar', form.notlar || ''],
    []
  ];

  const tableHeader = ['NO', 'MALZEMENİN CİNSİ', 'PVC', 'BOY', 'EN', 'ADET', 'BOY', 'EN'];
  const tableRows = rows.map((r, i) => [
    i + 1,
    r.malzeme || '',
    r.pvc || '',
    r.boy1 || '',
    r.en1 || '',
    r.adet || 0,
    r.boy2 || '',
    r.en2 || ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headerInfo, tableHeader, ...tableRows]);

  // Kolon genişlikleri
  ws['!cols'] = [
    { wch: 5 }, // NO
    { wch: 22 }, // MALZEME
    { wch: 12 }, // PVC
    { wch: 10 }, // BOY
    { wch: 10 }, // EN
    { wch: 8 }, // ADET
    { wch: 10 }, // BOY
    { wch: 10 } // EN
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form');

  const filename = `${form.formNo || 'form'}_${form.firma || ''}.xlsx`
    .replace(/\s+/g, '_')
    .replace(/[^\w.-]/g, '_');
  XLSX.writeFile(wb, filename);
}

// Liste halinde birden çok formu Excel'e aktarır
export function exportFormsListToExcel(forms) {
  const header = [
    'Form No',
    'Firma',
    'Telefon',
    'Yetkili',
    'Giriş Tarihi',
    'Durum'
  ];
  const rows = forms.map((f) => [
    f.formNo,
    f.firma,
    f.telefon,
    f.yetkili,
    formatDateTime(f.createdAt),
    STATUS_LABEL[f.durum] || f.durum
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Formlar');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ebatlama_formlar_${date}.xlsx`);
}