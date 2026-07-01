import React from 'react';
import { STATUS_LABEL } from '../utils/api';
import { formatDate } from '../utils/helpers';
import EbatTable from './EbatTable';

// Hem ekranda önizleme hem yazdırma için kullanılan A4 çıktısı.
// pdf export: tarayıcı print → PDF kaydet (A4 boyutunda).
export default function FormPrint({ form, compact = true }) {
  if (!form) return null;

  const printDate = formatDate(form.formTarihi || form.createdAt);
  const pvcList = (form.pvcSecim || []).join(' • ') || '—';

  return (
    <div className="print-page">
      <div className="print-header">
        <div className="print-logo">MT</div>
        <div className="print-brand-block">
          <div className="print-title">MEŞE TASARIM</div>
          <div className="print-subtitle print-subtitle-strong">
            VE AHŞAP ÜRÜNLERİ SAN. TİC. LTD. ŞTİ.
          </div>
          <div className="print-mainline">FASON İŞLEME MERKEZİ</div>
          <div className="print-subtitle print-subtitle-accent">
            KALİTELİ VE HIZLI CNC FASON KESİM &amp; BANTLAMA MERKEZİ
          </div>
        </div>
        <div className="print-contact">
          📞 0553 055 29 58<br />
          📞 0531 769 58 29<br />
          📍 Battalgazi Mh. Şanlıoğlu Sk. Katipoğlu Camii No:1/A<br />
          &nbsp;&nbsp;Sultanbeyli / İstanbul<br />
          ✉ mese.tasarim@hotmail.com<br />
          🌐 www.meseahsapcnc.com
        </div>
      </div>

      <div className="print-info">
        <div className="cell cell-grow">
          <span className="label">Tarih:</span>
          <span className="value">{printDate}</span>
        </div>
        <div className="cell cell-mid">
          <span className="label">Form No:</span>
          <span className="value">{form.formNo}</span>
        </div>
        <div className="cell cell-mid">
          <span className="label">Durum:</span>
          <span className="value">{STATUS_LABEL[form.durum] || form.durum}</span>
        </div>
      </div>

      <div className="print-info">
        <div className="cell" style={{ flex: 1 }}>
          <span className="label">FİRMA</span>
          <span className="value" style={{ flex: 1 }}>
            {form.firma}
          </span>
        </div>
        <div className="cell" style={{ flex: 1 }}>
          <span className="label">TELEFON NO</span>
          <span className="value" style={{ flex: 1 }}>
            {form.telefon}
          </span>
        </div>
        <div className="cell">
          <span className="label">YETKİLİ</span>
          <span className="value">{form.yetkili}</span>
        </div>
      </div>

      {form.adres && (
        <div className="print-info">
          <div className="cell" style={{ flex: 1 }}>
            <span className="label">ADRES:</span>
            <span className="value" style={{ flex: 1 }}>
              {form.adres}
            </span>
          </div>
        </div>
      )}

      <div className="print-info">
        <div className="cell" style={{ flex: 1 }}>
          <span className="label">PVC SEÇİMİ</span>
          <span className="value" style={{ flex: 1 }}>
            {pvcList}
          </span>
        </div>
      </div>

      <EbatTable rows={form.rows} />

      {form.notlar && (
        <div style={{ marginTop: 12, fontSize: 11 }}>
          <strong>Notlar:</strong> {form.notlar}
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#475569'
        }}
      >
        <div>
          <div style={{ borderTop: '1px solid #475569', width: 180, marginTop: 30 }} />
          Teslim Eden İmza
        </div>
        <div>
          <div style={{ borderTop: '1px solid #475569', width: 180, marginTop: 30 }} />
          Teslim Alan İmza
        </div>
      </div>
    </div>
  );
}