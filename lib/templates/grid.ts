import type { Cell, Point, Template } from "./types";

// Dünya biriminde dikdörtgen alan: left <= x < right, top <= y < bottom.
export type WorldRange = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

// Karo sıra/sütun aralığı: left <= col < right, top <= row < bottom (sağ ve alt dahil değil).
export type TileRange = WorldRange;

// Kenar üzerindeki noktalar için tolerans.
const EDGE_EPSILON = 1e-9;

// Aralıktaki karoların hücreleri, satır satır.
export function cellsInTiles(template: Template, range: TileRange): Cell[] {
  const cells: Cell[] = [];
  for (let row = range.top; row < range.bottom; row++) {
    for (let col = range.left; col < range.right; col++) {
      cells.push(...template.cellsInTile(col, row));
    }
  }
  return cells;
}

// Dünya alanına (kısmen de olsa) giren bütün hücreler. Hücreler karolarından en fazla bir karo taştığı için
// alanın çevresindeki bir sıra karo da eklenir; alanın dışında kalan birkaç hücre fazladan gelebilir.
export function cellsInView(template: Template, view: WorldRange): Cell[] {
  const { width, height } = template.tile;
  return cellsInTiles(template, {
    left: Math.floor(view.left / width) - 1,
    top: Math.floor(view.top / height) - 1,
    right: Math.ceil(view.right / width) + 1,
    bottom: Math.ceil(view.bottom / height) + 1,
  });
}

// p noktası a-b doğru parçasının üzerinde mi (toleranslı)?
function onSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): boolean {
  const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  const length = Math.hypot(bx - ax, by - ay);
  if (Math.abs(cross) > EDGE_EPSILON * Math.max(1, length)) return false;
  const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay);
  return dot >= -EDGE_EPSILON && dot <= length * length + EDGE_EPSILON;
}

// Nokta çokgenin içinde ya da kenarında mı? İçbükey çokgenlerde de çalışır:
// noktadan sağa giden ışının kaç kenarı kestiği sayılır; tek sayıysa nokta içeridedir.
export function containsPoint(points: readonly Point[], point: Point): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (onSegment(point, points[j], points[i])) return true;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// Çokgenin ağırlık merkezi (alan merkezi). Sözleşme gereği hücrenin içindedir; köşelerin ortalamasından farklı olarak
// yaylardaki sık köşeler sonucu kaydırmaz.
export function cellCenter(cell: Pick<Cell, "points">): Point {
  const { points } = cell;
  let area = 0;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    sumX += (x1 + x2) * cross;
    sumY += (y1 + y2) * cross;
  }
  return [sumX / (3 * area), sumY / (3 * area)];
}

// Noktanın düştüğü karo.
export function tileOf(
  template: Template,
  [x, y]: Point,
): { col: number; row: number } {
  return {
    col: Math.floor(x / template.tile.width),
    row: Math.floor(y / template.tile.height),
  };
}

// Dünya koordinatındaki noktanın altındaki hücre. Önce noktanın karosu, sonra taşan hücreler için çevresindeki
// 8 karo aranır; ızgara sınırsız olsa da hızlıdır. İki hücrenin ortak kenarındaki nokta önce bulunana düşer.
export function cellAt(template: Template, point: Point): Cell | null {
  const { col, row } = tileOf(template, point);
  const own = template
    .cellsInTile(col, row)
    .find((cell) => containsPoint(cell.points, point));
  if (own) return own;
  const around = cellsInTiles(template, {
    left: col - 1,
    top: row - 1,
    right: col + 2,
    bottom: row + 2,
  });
  return around.find((cell) => containsPoint(cell.points, point)) ?? null;
}
