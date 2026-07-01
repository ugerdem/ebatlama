import React from 'react';

// Hem önizleme, hem yazdırma, hem veri giriş ekranında kullanılan
// 44 satırlık ebat tablosu. Satır başına 8 hücre: NO, MALZEME, PVC,
// BOY (kenar 1), EN (kenar 1), ADET, BOY (kenar 2), EN (kenar 2).
// Kenar PVC işaretliyse hücrenin yanında yeşil X rozeti gösterilir.
const TOTAL_ROWS = 44;
const HALF = TOTAL_ROWS / 2;

function makeRows(sourceRows) {
  return Array.from({ length: TOTAL_ROWS }, (_, idx) => {
    const r = (sourceRows || [])[idx] || {};
    return {
      malzeme: r.malzeme || '',
      pvc: r.pvc || '',
      boy1: r.boy1 || '',
      en1: r.en1 || '',
      adet: r.adet || '',
      boy2: r.boy2 || '',
      en2: r.en2 || '',
      pvcBoy1: r.pvcBoy1 === true,
      pvcBoy2: r.pvcBoy2 === true,
      pvcEn1: r.pvcEn1 === true,
      pvcEn2: r.pvcEn2 === true
    };
  });
}

// Ölçü hücresinin yanına küçük X işareti (kenar PVC işaretliyse)
const DimCell = ({ value, flag }) => (
  <span>
    {value || ''}
    {flag ? <span className="edge-x"> X</span> : null}
  </span>
);

export default function EbatTable({
  rows,
  // opsiyonel: her satıra tıklanınca çağrılır (örn. düzenlemek için)
  onRowClick,
  // opsiyonel: her satırın sonuna küçük aksiyon hücresi ekler
  renderActions
}) {
  const data = makeRows(rows);
  const left = data.slice(0, HALF);
  const right = data.slice(HALF);

  const renderSlice = (slice, startNo) => (
    <table className="print-table ebat-table">
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
          {renderActions ? <th style={{ width: 90 }}>İŞLEM</th> : null}
        </tr>
      </thead>
      <tbody>
        {slice.map((r, idx) => {
          const realIdx = startNo + idx - 1;
          const isEmpty = !r.malzeme && !r.pvc && !r.boy1 && !r.en1 && !r.boy2 && !r.en2 && !r.adet;
          const clickable = !!onRowClick && !isEmpty;
          return (
            <tr
              key={idx}
              className={
                (isEmpty ? 'row-empty ' : '') +
                (clickable ? 'row-clickable' : '')
              }
              onClick={clickable ? () => onRowClick(realIdx) : undefined}
            >
              <td className="row-num">{startNo + idx}</td>
              <td style={{ textAlign: 'left', paddingLeft: 4 }}>{r.malzeme}</td>
              <td>{r.pvc}</td>
              <td><DimCell value={r.boy1} flag={r.pvcBoy1} /></td>
              <td><DimCell value={r.en1} flag={r.pvcEn1} /></td>
              <td>{r.adet}</td>
              <td><DimCell value={r.boy2 || r.boy1} flag={r.pvcBoy2} /></td>
              <td><DimCell value={r.en2 || r.en1} flag={r.pvcEn2} /></td>
              {renderActions ? (
                <td onClick={(e) => e.stopPropagation()}>{renderActions(realIdx, r)}</td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="ebat-table-wrap">
      {renderSlice(left, 1)}
      {renderSlice(right, HALF + 1)}
    </div>
  );
}
