"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { toPointsAttribute, type Template } from "@/lib/templates";
import { findNeighbor, type Direction } from "@/lib/templates/neighbors";
import { usePaintStore } from "@/lib/paintStore";
import { ZoomControls } from "./ZoomControls";

type CanvasProps = {
  template: Template;
};

type ScreenPoint = { x: number; y: number };

// Dış çerçeve ve kenar çizgileri tuvalin sınırında ortalanarak çizilir; yarısı dışarı taşmasın diye
// viewBox her yönden bu kadar (birim) genişletilir. overflow: visible'a güvenilmez.
// Sınır: çizgi kalınlığı ekran pikseliyle (non-scaling-stroke), pay ise birimle ölçülür. 1.1px çerçevenin yarısı
// (0.55px) için birim başına ≥11px gerekir: 8 birimlik şablonda tuval ≥ ~90px, 6 birimlikte ≥ ~68px olmalı.
// Mevcut düzende tuval en az ~280px; küçük önizlemelerde (Adım 4) bu ayrıca ele alınmalı.
const FRAME_PADDING = 0.05;

// Yakınlaştırma sınırları. 375px telefonda Dörtlü üçgenleri ~22-27px; 2× ve üstünde parmak hedefi ≥44px olur.
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.5;

// Hızlı sürüklemede işaretçi olayları seyrek gelir (iki olay arası 50px+ olabilir). Aradaki hücreler atlanmasın diye
// iki konum arasındaki çizgi bu aralıkla taranır. En küçük hücre ~22px olduğundan 3px, köşeden sıyıranlar dışında her hücreyi yakalar.
const SAMPLE_STEP_PX = 3;

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom * 100) / 100));
}

// Ekrandaki noktanın altındaki hücrenin id'si (yoksa null).
function cellIdAt({ x, y }: ScreenPoint): string | null {
  const element = document.elementFromPoint(x, y);
  return element instanceof SVGElement ? element.getAttribute("data-cell-id") : null;
}

// İki konum arasındaki çizginin geçtiği hücreler, sırasıyla (başlangıç noktası hariç, art arda tekrar yok).
function cellIdsAlong(from: ScreenPoint, to: ScreenPoint): string[] {
  const steps = Math.max(1, Math.ceil(distance(from, to) / SAMPLE_STEP_PX));
  const ids: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const id = cellIdAt({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    if (id && ids[ids.length - 1] !== id) ids.push(id);
  }
  return ids;
}

function midpoint(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function Canvas({ template }: CanvasProps) {
  const { width, height, cells } = template;
  const viewBox = `${-FRAME_PADDING} ${-FRAME_PADDING} ${width + 2 * FRAME_PADDING} ${height + 2 * FRAME_PADDING}`;

  const fills = usePaintStore((state) => state.fills);
  const startStroke = usePaintStore((state) => state.startStroke);
  const paintCell = usePaintStore((state) => state.paintCell);
  const endStroke = usePaintStore((state) => state.endStroke);
  const cancelStroke = usePaintStore((state) => state.cancelStroke);

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [focusedId, setFocusedId] = useState(cells[0].id);
  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Ekrana değen parmaklar/fare: pointerId -> son konum.
  const pointers = useRef(new Map<number, ScreenPoint>());
  // İki parmak hareketi sürerken: başlangıç mesafesi ve yakınlaştırması. Tüm parmaklar kalkana dek boyama yapılmaz.
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  // Yakınlaştırmayı değiştirir; `from` noktasının altındaki tuval noktası ekranda `to` noktasına gelir.
  // Genişlik doğrudan DOM'a yazılır ki kaydırma aynı anda, yeni boyuta göre ayarlanabilsin.
  function applyZoom(nextZoom: number, from: ScreenPoint, to: ScreenPoint) {
    const svg = svgRef.current;
    const viewport = viewportRef.current;
    if (!svg || !viewport) return;
    const zoomValue = clampZoom(nextZoom);
    const before = svg.getBoundingClientRect();
    const fractionX = (from.x - before.left) / before.width;
    const fractionY = (from.y - before.top) / before.height;
    svg.style.width = `${zoomValue * 100}%`;
    const after = svg.getBoundingClientRect();
    viewport.scrollLeft += after.left + fractionX * after.width - to.x;
    viewport.scrollTop += after.top + fractionY * after.height - to.y;
    setZoom(zoomValue);
  }

  function zoomAroundCenter(nextZoom: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    applyZoom(nextZoom, center, center);
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault(); // Fareyle sürüklerken metin seçilmesin.
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      // İkinci parmak geldi: bu bir yakınlaştırma; ilk parmağın boyadığı geri alınır.
      cancelStroke();
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: distance(a, b), zoom };
      return;
    }
    if (pointers.current.size > 2 || pinch.current) return;

    const cellId = cellIdAt({ x: event.clientX, y: event.clientY });
    if (cellId) {
      setFocusedId(cellId);
      startStroke(cellId);
    }
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const current = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, current);

    if (pinch.current) {
      if (pointers.current.size !== 2) return;
      const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)![1];
      const scale = distance(current, other) / pinch.current.distance;
      applyZoom(pinch.current.zoom * scale, midpoint(previous, other), midpoint(current, other));
      return;
    }

    for (const cellId of cellIdsAlong(previous, current)) {
      // Hareket tuval dışında başladıysa ilk değilen hücre fırçayı başlatır.
      if (usePaintStore.getState().stroke) paintCell(cellId);
      else startStroke(cellId);
    }
  }

  // Parmak/fare kalktı: fırça tamamlanır ve tek geri alma adımı olur.
  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (!pointers.current.delete(event.pointerId)) return;
    if (pinch.current) {
      if (pointers.current.size === 0) pinch.current = null;
      return;
    }
    endStroke();
  }

  // Tarayıcı hareketi kesti (pointercancel: sistem hareketi, bildirim, dokunma iptali) ya da işaretçi yakalaması
  // kaybedildi: yarım fırça kaydedilmez, geri alınır. İşaretçi listeden silinir ki sonraki dokunuş "ikinci parmak" sanılmasın.
  // pointerup'tan sonra gelen lostpointercapture'da işaretçi zaten silinmiş olduğundan bir şey yapmaz.
  function handlePointerCancel(event: PointerEvent<SVGSVGElement>) {
    if (!pointers.current.delete(event.pointerId)) return;
    if (pinch.current) {
      if (pointers.current.size === 0) pinch.current = null;
      return;
    }
    cancelStroke();
  }

  // Dokunmada tarayıcı yakalamayı önce hücreye (polygon) verir; biz SVG'ye alınca hücrenin "kaybetti" olayı buraya
  // kabarcıklanır. O olay fırçayı iptal etmemeli: yalnız SVG'nin kendi yakalamasını kaybetmesi sayılır.
  function handleLostCapture(event: PointerEvent<SVGSVGElement>) {
    if (event.target === event.currentTarget) handlePointerCancel(event);
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const direction = ARROW_KEYS[event.key];
    if (direction) {
      event.preventDefault();
      const next = findNeighbor(cells, focusedId, direction);
      if (next) setFocusedId(next);
      // Yakınken seçilen hücre görünür alanda kalsın.
      requestAnimationFrame(() => svgRef.current?.querySelector(".cell-focus")?.scrollIntoView({ block: "nearest", inline: "nearest" }));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startStroke(focusedId);
      endStroke();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomAroundCenter(zoom * ZOOM_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomAroundCenter(zoom / ZOOM_STEP);
    }
  }

  const focusedCell = cells.find((cell) => cell.id === focusedId) ?? cells[0];
  const paintedCount = cells.filter((cell) => fills[cell.id]).length;

  return (
    <div className="canvas-area">
      <div className="canvas-viewport" ref={viewportRef} style={{ aspectRatio: `${width} / ${height}` }}>
        <svg ref={svgRef} className="drawing-canvas" viewBox={viewBox} style={{ width: `${zoom * 100}%` }}
          tabIndex={0} role="application" aria-roledescription="çizim tuvali"
          aria-label={`${template.name} şablonu: ${cells.length} hücre, ${paintedCount} boyalı. Ok tuşlarıyla hücre seç, Enter ya da Boşluk ile boya; aynı renge tekrar basmak siler. Artı ve eksi yakınlaştırır.`}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onLostPointerCapture={handleLostCapture}
          onKeyDown={handleKeyDown}>
          {/* Boş hücre şeffaf kalır; boyalı hücrenin rengi depodan gelir. */}
          <g className="canvas-cells">
            {cells.map((cell) => (
              <polygon key={cell.id} className="canvas-cell" data-cell-id={cell.id}
                points={toPointsAttribute(cell.points)} style={fills[cell.id] ? { fill: fills[cell.id] } : undefined} />
            ))}
          </g>
          {/* Çizgiler ayrı katmanda: ortak kenarlar iki kez çizilse de grup saydamlığı tek seferde uygulanır. */}
          <g className="canvas-lines" aria-hidden="true">
            {cells.map((cell) => (
              <polygon key={cell.id} points={toPointsAttribute(cell.points)} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <rect className="canvas-frame" width={width} height={height} vectorEffect="non-scaling-stroke" />
          {/* Klavye odağı: yalnız tuval klavyeyle odaklanınca görünür (CSS). */}
          <polygon className="cell-focus" points={toPointsAttribute(focusedCell.points)} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="canvas-footer">
        <p className="canvas-caption">küçük kareler, sonsuz ihtimal.</p>
        <ZoomControls zoom={zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM}
          onZoomIn={() => zoomAroundCenter(zoom * ZOOM_STEP)}
          onZoomOut={() => zoomAroundCenter(zoom / ZOOM_STEP)}
          onReset={() => zoomAroundCenter(MIN_ZOOM)} />
      </div>
      <p className="sr-only" aria-live="polite">
        {`Seçili hücre ${focusedCell.id}: ${fills[focusedCell.id] ?? "boş"}`}
      </p>
    </div>
  );
}
