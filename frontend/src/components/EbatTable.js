import React from 'react';

// Hem önizleme, hem yazdırma, hem veri giriş ekranında kullanılan ebat tablosu.
// Bu sürümde "Malzeme Cinsi" ve "PVC" üst başlık/bilgi satırı kaldırıldı.
const DEFAULT_TOTAL_ROWS = 44;

function makeRows(sourceRows, totalRows) {
  const source = sourceRows || [];
  const targetLength = Number.isInteger(totalRows) && totalRows > 0
    ? totalRows
    : Math.max(source.length, 1);

  return Array.from({ length: targetLength }, (_, idx) => {
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
  // opsiyonel: her dolu satıra tıklayınca çağrılır
  onRowClick,
  // opsiyonel: her satırın solunda küçük işlem hücresi (Sil butonu vs.)
  renderActions,
  // varsayılan eski davranış: 44 satır dolgu
  totalRows = DEFAULT_TOTAL_ROWS,
  // popup gibi alanlarda tek tablo görünümü için
  split = true
}) {
  const data = makeRows(rows, totalRows);
  const half = Math.ceil(data.length / 2);
  const left = data.slice(0, half);
  const right = data.slice(half);

  const renderSlice = (slice, startNo) => (
    <table className="print-table ebat-table">
      <colgroup>
        <col style={{ width: '5%' }} />   {/* No */}
        <col style={{ width: '12%' }} />  {/* Boy (Malzeme) */}
        <col style={{ width: '12%' }} />  {/* En (Malzeme) */}
        <col style={{ width: '8%' }} />   {/* Adet (Malzeme) */}
        <col style={{ width: '12%' }} />  {/* Boy 1 (PVC) */}
        <col style={{ width: '12%' }} />  {/* Boy 2 (PVC) */}
        <col style={{ width: '12%' }} />  {/* En 1 (PVC) */}
        <col style={{ width: '12%' }} />  {/* En 2 (PVC) */}
        {renderActions ? <col style={{ width: '8%' }} /> : null}
      </colgroup>
      <thead>
        <tr>
          <th>No</th>
          <th>Boy (mm)</th>
          <th>En (mm)</th>
          <th>Adet</th>
          <th>Boy 1 (X)</th>
          <th>Boy 2 (X)</th>
          <th>En 1 (X)</th>
          <th>En 2 (X)</th>
          {renderActions ? <th>İŞLEM</th> : null}
        </tr>
      </thead>
      <tbody>
        {slice.map((r, idx) => {
          const realIdx = startNo + idx - 1;
          const isEmpty =
            !r.malzeme &&
            !r.pvc &&
            !r.boy1 &&
            !r.en1 &&
            !r.boy2 &&
            !r.en2 &&
            !r.adet;
          const clickable = !!onRowClick && !isEmpty;

          if (isEmpty) {
            return (
              <tr key={idx} className="row-empty">
                <td className="row-num">{startNo + idx}</td>
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                {renderActions ? <td /> : null}
              </tr>
            );
          }

          return (
            <tr
              key={idx}
              className={clickable ? 'row-clickable' : ''}
              onClick={clickable ? () => onRowClick(realIdx) : undefined}
            >
              <td className="row-num">{startNo + idx}</td>
              <td><DimCell value={r.boy1} flag={false} /></td>
              <td><DimCell value={r.en1} flag={false} /></td>
              <td>{r.adet}</td>
              <td>{r.pvcBoy1 ? (r.pvc || <span className="edge-x">X</span>) : ''}</td>
              <td>{r.pvcBoy2 ? (r.pvc || <span className="edge-x">X</span>) : ''}</td>
              <td>{r.pvcEn1 ? (r.pvc || <span className="edge-x">X</span>) : ''}</td>
              <td>{r.pvcEn2 ? (r.pvc || <span className="edge-x">X</span>) : ''}</td>
              {renderActions ? <td onClick={(e) => e.stopPropagation()}>{renderActions(realIdx, r)}</td> : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="ebat-table-wrap">
      {renderSlice(split ? left : data, 1)}
      {split ? renderSlice(right, half + 1) : null}
    </div>
  );
}
