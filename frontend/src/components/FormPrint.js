import React from 'react';
import { STATUS_LABEL } from '../utils/api';
import { formatDate } from '../utils/helpers';

// Hem ekranda önizleme hem yazdırma için kullanılan A4 çıktısı.
// pdf export: tarayıcı print → PDF kaydet (A4 boyutunda).
export default function FormPrint({ form, compact = true }) {
  if (!form) return null;

  const rows = Array.from({ length: 44 }, (_, idx) => {
    const source = (form.rows || [])[idx] || {};
    return {
      malzeme: source.malzeme || '',
      pvc: source.pvc || '',
      boy1: source.boy1 || '',
      en1: source.en1 || '',
      adet: source.adet || '',
      boy2: source.boy2 || '',
      en2: source.en2 || ''
    };
  });
  const left = rows.slice(0, 22);
  const right = rows.slice(22, 44);

  const renderTable = (slice, startNo) => (
    <table className="print-table">
      <thead>
        <tr>
          <th style={{ width: 24 }}>NO</th>
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
        {slice.map((r, idx) => (
          <tr key={idx}>
            <td className="row-num">{startNo + idx}</td>
            <td style={{ textAlign: 'left', paddingLeft: 4 }}>{r.malzeme || ''}</td>
            <td>{r.pvc || ''}</td>
            <td>{r.boy1 || ''}</td>
            <td>{r.en1 || ''}</td>
            <td>{r.adet || ''}</td>
            <td>{r.boy2 || ''}</td>
            <td>{r.en2 || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

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

      <div className="print-tables-wrap">
        {renderTable(left, 1)}
        {renderTable(right, 23)}
      </div>

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