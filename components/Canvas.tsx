import { toPointsAttribute, type Template } from "@/lib/templates";

type CanvasProps = {
  template: Template;
};

// Dış çerçeve ve kenar çizgileri tuvalin sınırında ortalanarak çizilir; yarısı dışarı taşmasın diye
// viewBox her yönden bu kadar (birim) genişletilir. overflow: visible'a güvenilmez.
// Sınır: çizgi kalınlığı ekran pikseliyle (non-scaling-stroke), pay ise birimle ölçülür. 1.1px çerçevenin yarısı
// (0.55px) için birim başına ≥11px gerekir: 8 birimlik şablonda tuval ≥ ~90px, 6 birimlikte ≥ ~68px olmalı.
// Mevcut düzende tuval en az ~280px; küçük önizlemelerde (Adım 4) bu ayrıca ele alınmalı.
const FRAME_PADDING = 0.05;

export function Canvas({ template }: CanvasProps) {
  const { width, height, cells } = template;
  const viewBox = `${-FRAME_PADDING} ${-FRAME_PADDING} ${width + 2 * FRAME_PADDING} ${height + 2 * FRAME_PADDING}`;

  return (
    <div className="canvas-area">
      <svg className="drawing-canvas" viewBox={viewBox}
        role="img" aria-label={`${template.name} şablonu: ${cells.length} boş hücre.`}>
        {/* Boş hücreler şeffaf. Boyama (tıklama/dokunma) Adım 3'te eklenecek. */}
        <g className="canvas-cells">
          {cells.map((cell) => (
            <polygon key={cell.id} className="canvas-cell" points={toPointsAttribute(cell.points)} />
          ))}
        </g>
        {/* Çizgiler ayrı katmanda: ortak kenarlar iki kez çizilse de grup saydamlığı tek seferde uygulanır. */}
        <g className="canvas-lines" aria-hidden="true">
          {cells.map((cell) => (
            <polygon key={cell.id} points={toPointsAttribute(cell.points)} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <rect className="canvas-frame" width={width} height={height} vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="canvas-caption">küçük kareler, sonsuz ihtimal.</p>
    </div>
  );
}
