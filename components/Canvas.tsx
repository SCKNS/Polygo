"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cellAt, cellsInRange, toPointsAttribute, type Cell, type Template } from "@/lib/templates";
import { cellCenter, findNeighborCell, type Direction } from "@/lib/templates/neighbors";
import { usePaintStore } from "@/lib/paintStore";
import { useViewStore } from "@/lib/viewStore";
import {
  panCamera, toScreen, toViewBox, toWorld, visibleRange, zoomCamera, ZOOM_STEP,
  type ScreenPoint, type Size,
} from "@/lib/camera";

type CanvasProps = {
  template: Template;
};

// Hızlı sürüklemede işaretçi olayları seyrek gelir (iki olay arası 50px+ olabilir). Aradaki hücreler atlanmasın diye
// iki konum arasındaki çizgi bu aralıkla taranır. En küçük hücre ~20px olduğundan 3px, köşeden sıyıranlar dışında her hücreyi yakalar.
const SAMPLE_STEP_PX = 3;
// Klavyeyle seçilen hücre kenara bu kadar pikselden fazla yaklaşırsa görüş onu ortalar.
const FOCUS_MARGIN_PX = 48;
// Teker satır cinsinden kaydırırsa (Firefox) satır başına piksel.
const LINE_HEIGHT_PX = 16;

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function midpoint(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Bütün hücre kenarları tek bir yol: binlerce ayrı öğe yerine tek öğe, ortak kenarlar iki kez çizilse de koyulaşmaz.
function linesPath(cells: readonly Cell[]): string {
  return cells.map((cell) => "M" + cell.points.map(([x, y]) => `${x} ${y}`).join("L") + "Z").join("");
}

// Boşluk tuşunun kendi işi olan öğeler (düğme, yazı alanı...): orada Boşluk kaydırma aracı olmaz.
function isControl(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button, input, textarea, select, [contenteditable]") !== null;
}

export function Canvas({ template }: CanvasProps) {
  const fills = usePaintStore((state) => state.fills);
  const startStroke = usePaintStore((state) => state.startStroke);
  const paintCell = usePaintStore((state) => state.paintCell);
  const endStroke = usePaintStore((state) => state.endStroke);
  const cancelStroke = usePaintStore((state) => state.cancelStroke);
  const camera = useViewStore((state) => state.camera);
  const setCamera = useViewStore((state) => state.setCamera);

  const svgRef = useRef<SVGSVGElement>(null);
  // Ölçülene dek (sunucuda ve ilk çizimde) boyut bilinmez; o sırada hücre çizilmez.
  const [size, setSize] = useState<Size | null>(null);
  const [focusedCell, setFocusedCell] = useState<Cell | null>(null);
  // Ekrana değen parmaklar/fare: pointerId -> son konum (tuvale göre).
  const pointers = useRef(new Map<number, ScreenPoint>());
  // İki parmak hareketi sürerken: başlangıç mesafesi ve yakınlaştırması. Tüm parmaklar kalkana dek boyama yapılmaz.
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  // Orta tuşla ya da Boşluk + sol tuşla sürükleyerek kaydırma sürüyor mu?
  const panning = useRef(false);
  // Boşluk basılı mı (çizim programlarındaki "el aracı") ve bu basışta kaydırma yapıldı mı?
  const spaceHeld = useRef(false);
  const spaceUsedForPan = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(svg);

    // Teker kaydırır, Ctrl/Cmd + teker (dokunmatik yüzeyde iki parmak sıkıştırma) imleç çevresinde yakınlaştırır.
    // React'in onWheel'i pasif olduğundan sayfanın kaymasını engelleyemez; dinleyici elle eklenir.
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = svg!.getBoundingClientRect();
      const box = { width: rect.width, height: rect.height };
      const { camera: current, setCamera: update } = useViewStore.getState();
      const unit = event.deltaMode === 1 ? LINE_HEIGHT_PX : 1;
      if (event.ctrlKey || event.metaKey) {
        const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        update(zoomCamera(current, box, current.zoom * Math.exp(-event.deltaY * unit * 0.01), point, point));
      } else if (event.shiftKey && event.deltaX === 0) {
        update(panCamera(current, event.deltaY * unit, 0)); // Shift + teker: yatay
      } else {
        update(panCamera(current, event.deltaX * unit, event.deltaY * unit));
      }
    }
    svg.addEventListener("wheel", handleWheel, { passive: false });

    // Boşluk basılıyken fareyle sürüklemek kaydırır. Odak bir düğme ya da yazı alanındaysa Boşluk onlarındır.
    function handleSpaceDown(event: globalThis.KeyboardEvent) {
      if (event.key !== " " || isControl(event.target)) return;
      event.preventDefault(); // sayfa kaymasın
      if (spaceHeld.current) return; // basılı tutunca gelen tekrarlar
      spaceHeld.current = true;
      spaceUsedForPan.current = false;
      svg!.dataset.space = "true"; // imleç: el (CSS)
    }
    function releaseSpace() {
      spaceHeld.current = false;
      delete svg!.dataset.space;
    }
    function handleSpaceUp(event: globalThis.KeyboardEvent) {
      if (event.key === " ") releaseSpace();
    }
    window.addEventListener("keydown", handleSpaceDown);
    window.addEventListener("keyup", handleSpaceUp);
    window.addEventListener("blur", releaseSpace); // pencere değişince tuş bırakılmış sayılır

    return () => {
      observer.disconnect();
      svg.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleSpaceDown);
      window.removeEventListener("keyup", handleSpaceUp);
      window.removeEventListener("blur", releaseSpace);
    };
  }, []);

  // Görünen kareler RANGE_CHUNK katlarına yuvarlandığından, kaydırırken liste yalnız aralık değişince yeniden üretilir.
  const { left, top, right, bottom } = size ? visibleRange(camera, size) : { left: 0, top: 0, right: 0, bottom: 0 };
  const cells = useMemo(
    () => cellsInRange(template, { left, top, right, bottom }),
    [template, left, top, right, bottom],
  );
  const lines = useMemo(() => linesPath(cells), [cells]);
  const paintedCells = useMemo(() => cells.filter((cell) => fills[cell.id]), [cells, fills]);

  // Kullanıcı henüz hücre seçmediyse klavye odağı ekranın ortasındaki hücrededir.
  const focused = focusedCell ?? cellAt(template, [camera.x, camera.y]);
  const paintedCount = Object.keys(fills).length;

  function localPoint(event: PointerEvent<SVGSVGElement>): ScreenPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function cellUnder(point: ScreenPoint): Cell | null {
    if (!size) return null;
    return cellAt(template, toWorld(useViewStore.getState().camera, size, point));
  }

  // İki konum arasındaki çizginin geçtiği hücrelerin id'leri, sırasıyla (başlangıç noktası hariç, art arda tekrar yok).
  function cellIdsAlong(from: ScreenPoint, to: ScreenPoint): string[] {
    const steps = Math.max(1, Math.ceil(distance(from, to) / SAMPLE_STEP_PX));
    const ids: string[] = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const id = cellUnder({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })?.id;
      if (id && ids[ids.length - 1] !== id) ids.push(id);
    }
    return ids;
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const isMouse = event.pointerType === "mouse";
    if (isMouse && event.button !== 0 && event.button !== 1) return;
    event.preventDefault(); // Fareyle sürüklerken metin seçilmesin, orta tuş otomatik kaydırmayı açmasın.
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);

    if (isMouse && (event.button === 1 || spaceHeld.current)) {
      panning.current = true;
      spaceUsedForPan.current = spaceHeld.current;
      event.currentTarget.dataset.panning = "true"; // imleç: tutup sürükleme (CSS)
      return;
    }
    if (pointers.current.size === 2) {
      // İkinci parmak geldi: bu bir yakınlaştırma/kaydırma; ilk parmağın boyadığı geri alınır.
      cancelStroke();
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: distance(a, b), zoom: useViewStore.getState().camera.zoom };
      return;
    }
    if (pointers.current.size > 2 || pinch.current) return;

    const cell = cellUnder(point);
    if (cell) {
      setFocusedCell(cell);
      startStroke(cell.id);
    }
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous || !size) return;
    const current = localPoint(event);
    pointers.current.set(event.pointerId, current);
    const view = useViewStore.getState().camera;

    if (panning.current) {
      setCamera(panCamera(view, previous.x - current.x, previous.y - current.y));
      return;
    }
    if (pinch.current) {
      if (pointers.current.size !== 2) return;
      const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)![1];
      const scale = distance(current, other) / pinch.current.distance;
      setCamera(zoomCamera(view, size, pinch.current.zoom * scale, midpoint(previous, other), midpoint(current, other)));
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
    if (panning.current) {
      panning.current = false;
      delete event.currentTarget.dataset.panning;
      return;
    }
    if (pinch.current) {
      if (pointers.current.size === 0) pinch.current = null;
      return;
    }
    endStroke();
  }

  // Tarayıcı hareketi kesti (pointercancel: sistem hareketi, bildirim, dokunma iptali) ya da işaretçi yakalaması
  // kaybedildi: yarım fırça kaydedilmez, geri alınır. İşaretçi listeden silinir ki sonraki dokunuş "ikinci parmak" sanılmasın.
  function handlePointerCancel(event: PointerEvent<SVGSVGElement>) {
    if (!pointers.current.delete(event.pointerId)) return;
    if (panning.current) {
      panning.current = false;
      delete event.currentTarget.dataset.panning;
      return;
    }
    if (pinch.current) {
      if (pointers.current.size === 0) pinch.current = null;
      return;
    }
    cancelStroke();
  }

  // Dokunmada tarayıcı yakalamayı önce alttaki öğeye verebilir; o öğenin "kaybetti" olayı buraya kabarcıklanır.
  // Yalnız SVG'nin kendi yakalamasını kaybetmesi fırçayı iptal eder.
  function handleLostCapture(event: PointerEvent<SVGSVGElement>) {
    if (event.target === event.currentTarget) handlePointerCancel(event);
  }

  // Seçilen hücre ekran kenarına çok yaklaştıysa (ya da dışına çıktıysa) görüş onu ortalar.
  function keepInView(cell: Cell) {
    if (!size) return;
    const view = useViewStore.getState().camera;
    const center = cellCenter(cell);
    const { x, y } = toScreen(view, size, center);
    const inside = x > FOCUS_MARGIN_PX && x < size.width - FOCUS_MARGIN_PX && y > FOCUS_MARGIN_PX && y < size.height - FOCUS_MARGIN_PX;
    if (!inside) setCamera({ ...view, x: center[0], y: center[1] });
  }

  function paintFocused() {
    if (!focused) return;
    setFocusedCell(focused);
    startStroke(focused.id);
    endStroke();
  }

  // Boşluk bırakılınca boyar; basılıyken fareyle kaydırma yapıldıysa boyamaz (el aracı olarak kullanıldı).
  // React olayı pencere dinleyicisinden önce çalışır, yani spaceUsedForPan henüz sıfırlanmamıştır.
  function handleKeyUp(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === " " && !spaceUsedForPan.current) paintFocused();
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const direction = ARROW_KEYS[event.key];
    const { zoomTo } = useViewStore.getState();
    if (direction) {
      event.preventDefault();
      if (!focused) return;
      const next = findNeighborCell(template, focused, direction);
      if (next) {
        setFocusedCell(next);
        keepInView(next);
      }
    } else if (event.key === "Enter" && focused) {
      event.preventDefault();
      paintFocused();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomTo(camera.zoom * ZOOM_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomTo(camera.zoom / ZOOM_STEP);
    }
  }

  return (
    <div className="canvas-area">
      <svg ref={svgRef} className="drawing-canvas" viewBox={size ? toViewBox(camera, size) : undefined}
        preserveAspectRatio="none"
        tabIndex={0} role="application" aria-roledescription="çizim tuvali"
        aria-label={`${template.name} şablonu, sınırsız ızgara: ${paintedCount} boyalı hücre. Ok tuşlarıyla hücre seç, Enter ya da Boşluk ile boya; aynı renge tekrar basmak siler. Artı ve eksi yakınlaştırır. Boşluğu basılı tutup fareyle sürüklemek kaydırır.`}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onLostPointerCapture={handleLostCapture}
        onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
        {/* Yalnız boyalı hücreler çizilir; boş hücre şeffaftır ve hangi hücreye dokunulduğu geometriyle bulunur. */}
        <g className="canvas-cells">
          {paintedCells.map((cell) => (
            <polygon key={cell.id} data-cell-id={cell.id} points={toPointsAttribute(cell.points)} style={{ fill: fills[cell.id] }} />
          ))}
        </g>
        <path className="canvas-lines" d={lines} vectorEffect="non-scaling-stroke" aria-hidden="true" />
        {/* Klavye odağı: yalnız tuval klavyeyle odaklanınca görünür (CSS). */}
        {focused && (
          <polygon className="cell-focus" points={toPointsAttribute(focused.points)} vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <p className="sr-only" aria-live="polite">
        {focused ? `Seçili hücre ${focused.id}: ${fills[focused.id] ?? "boş"}` : ""}
      </p>
    </div>
  );
}
