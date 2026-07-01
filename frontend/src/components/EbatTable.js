import React from 'react';

// Hem önizleme, hem yazdırma, hem veri giriş ekranında kullanılan
// ebat tablosu. El yazısı formattakiyle birebir aynı:
//
//   ┌────┬──────────── Malzeme Cinsi ────────────┬────── PVC ──────┐
//   │ No │ En (mm) │ Boy (mm) │ Adet │ Boy (X) │ En (X) │
//   ├────┼─────────┼──────────┼──────┼─────────┼────────┤
//   │  1 │   22    │    22    │  1   │   X     │   X    │
//
// Her dolu satır iki görsel <tr> kullanır: üst satırda Malzeme Cinsi
// (3 kolon) + PVC (2 kolon) hücreleri, alt satırda 6 ölçü değeri.
// Boş satırlar tek satır, sadece No + boş hücreler.
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
  // opsiyonel: her dolu satıra tıklayınca çağrılır
  onRowClick,
  // opsiyonel: her satırın solunda küçük işlem hücresi (Sil butonu vs.)
  renderActions
}) {
  const data = makeRows(rows);
  const left = data.slice(0, HALF);
  const right = data.slice(HALF);

  const renderSlice = (slice, startNo) => (
    <table className="print-table ebat-table">
      <colgroup>
        <col style={{ width: '6%' }} />   {/* No */}
        <col style={{ width: '15%' }} />  {/* En 1 */}
        <col style={{ width: '15%' }} />  {/* Boy 1 */}
        <col style={{ width: '10%' }} />  {/* Adet */}
        <col style={{ width: '15%' }} />  {/* Boy 2 */}
        <col style={{ width: '15%' }} />  {/* En 2 */}
        {renderActions ? <col style={{ width: '8%' }} /> : null}
      </colgroup>
      <thead>
        <tr>
          <th rowSpan="2">No</th>
          <th colSpan="3">Malzeme Cinsi</th>
          <th colSpan="2">PVC</th>
          {renderActions ? <th rowSpan="2">İŞLEM</th> : null}
        </tr>
        <tr>
          <th>En (mm)</th>
          <th>Boy (mm)</th>
          <th>Adet</th>
          <th>Boy (X)</th>
          <th>En (X)</th>
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
                {renderActions ? <td /> : null}
              </tr>
            );
          }

          return (
            <React.Fragment key={idx}>
              {/* Üst satır: Malzeme Cinsi (3 kolon) + PVC (2 kolon) */}
              <tr
                className={clickable ? 'row-clickable row-meta' : 'row-meta'}
                onClick={clickable ? () => onRowClick(realIdx) : undefined}
              >
                <td className="row-num" rowSpan="2">
                  {startNo + idx}
                </td>
                <td colSpan="3" className="cell-malzeme">
                  {r.malzeme}
                </td>
                <td colSpan="2" className="cell-pvc">
                  {r.pvc}
                </td>
                {renderActions ? (
                  <td rowSpan="2" onClick={(e) => e.stopPropagation()}>
                    {renderActions(realIdx, r)}
                  </td>
                ) : null}
              </tr>
              {/* Alt satır: 5 ölçü hücresi (No yukarıda rowspan ile birleşik) */}
              <tr
                className={clickable ? 'row-clickable' : ''}
                onClick={clickable ? () => onRowClick(realIdx) : undefined}
              >
                <td><DimCell value={r.en1} flag={r.pvcEn1} /></td>
                <td><DimCell value={r.boy1} flag={r.pvcBoy1} /></td>
                <td>{r.adet}</td>
                <td><DimCell value={r.boy2 || r.boy1} flag={r.pvcBoy2} /></td>
                <td><DimCell value={r.en2 || r.en1} flag={r.pvcEn2} /></td>
              </tr>
            </React.Fragment>
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
