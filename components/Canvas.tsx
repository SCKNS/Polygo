import type { CSSProperties } from "react";

// Bu örnek yalnızca ilk ekranın kompozisyonudur; hücreler değiştirilemez.
const filledCells = [
  [2, 1], [3, 1], [4, 1], [5, 1],
  [2, 2], [3, 2], [5, 2], [6, 2],
  [2, 3], [3, 3], [5, 3], [6, 3],
  [2, 4], [3, 4], [4, 4], [5, 4],
  [2, 5], [3, 5], [2, 6], [3, 6], [2, 7], [3, 7],
];

export function Canvas() {
  return (
    <div className="canvas-area">
      <svg className="drawing-canvas" viewBox="0 0 360 360" role="img" aria-label="Dokuz çarpı dokuz kareli tuvalde geometrik P harfi. Statik arayüz önizlemesi.">
        <defs>
          <pattern id="pencil-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 0V7" stroke="var(--accent)" strokeWidth="1.5" />
          </pattern>
        </defs>
        {Array.from({ length: 8 }, (_, index) => (
          <path key={index} className="canvas-grid-line" pathLength="1" d={`M${(index + 1) * 40} 0V360M0 ${(index + 1) * 40}H360`} fill="none" />
        ))}
        {filledCells.map(([column, row], index) => (
          <rect key={`${column}-${row}`} className="canvas-cell filled-cell" x={column * 40} y={row * 40} width="40" height="40"
            style={{ "--cell-index": index } as CSSProperties} />
        ))}
        <rect className="canvas-frame" x=".75" y=".75" width="358.5" height="358.5" rx="3" fill="none" pathLength="1" />
        {Array.from({ length: 81 }, (_, index) => (
          <rect className="hover-cell" key={index} x={(index % 9) * 40 + 1} y={Math.floor(index / 9) * 40 + 1}
            width="38" height="38" fill="url(#pencil-hatch)" />
        ))}
      </svg>
      <div className="canvas-note" aria-hidden="true">
        <svg className="canvas-note-arrow" viewBox="0 0 54 43" fill="none">
          <path d="M48 36C24 41 15 27 17 8m-7 8 7-9 7 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>bir hücreye dokun</span>
      </div>
      <p className="canvas-caption">küçük kareler, sonsuz ihtimal.</p>
    </div>
  );
}
