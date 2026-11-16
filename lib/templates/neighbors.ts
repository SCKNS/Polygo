import { cellCenter, cellsInTiles, tileOf } from "./grid";
import type { Cell, Point, Template } from "./types";

// Dört ok yönü ve dört çapraz. Çaprazlar gerekli: Sekizgen'in köşe üçgenleri gibi bazı hücreler her komşusunun
// tam çaprazındadır; yalnız dört yönle hiçbir kural onlara ulaştıramaz.
export type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "upLeft"
  | "upRight"
  | "downLeft"
  | "downRight";

const DIAGONAL = Math.SQRT1_2; // birim uzunlukta çapraz vektörün bileşeni

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  upLeft: [-DIAGONAL, -DIAGONAL],
  upRight: [DIAGONAL, -DIAGONAL],
  downLeft: [-DIAGONAL, DIAGONAL],
  downRight: [DIAGONAL, DIAGONAL],
};

// Köşeyi metin anahtarına çevirir; komşu hücrelerin kıl payı farklı hesaplanan ortak köşeleri aynı anahtarı alır.
function pointKey([x, y]: Point): string {
  return `${Math.round(x * 1e6)},${Math.round(y * 1e6)}`;
}

// İki hücre bir kenar paylaşıyor mu? En az iki ortak köşe yeterli (yalnız köşeden değenler sayılmaz).
function sharesEdge(fromKeys: ReadonlySet<string>, cell: Cell): boolean {
  let shared = 0;
  for (const point of cell.points) {
    if (fromKeys.has(pointKey(point)) && ++shared >= 2) return true;
  }
  return false;
}

// Ok tuşu için komşu hücre: o yönde olan hücrelerden en yakını. Yana sapma iki kat cezalandırılır,
// böylece düz çizgide kalan hücre tercih edilir. Kenar paylaşan hücreler önce gelir: yalnız merkezlere bakınca
// Elmas gibi şablonlarda bazı hücrelere hiç gidilemiyordu. O yönde kenar komşusu yoksa en yakın hücre seçilir;
// o yönde hiç hücre yoksa null (sonlu listenin kenarındayız).
export function findNeighbor(
  cells: readonly Cell[],
  fromId: string,
  direction: Direction,
): string | null {
  const from = cells.find((cell) => cell.id === fromId);
  if (!from) return null;
  const fromKeys = new Set(from.points.map(pointKey));
  const [fx, fy] = cellCenter(from);
  const [dx, dy] = DIRECTION_VECTORS[direction];

  let bestId: string | null = null;
  let bestScore = Infinity;
  let bestEdgeId: string | null = null;
  let bestEdgeScore = Infinity;
  for (const cell of cells) {
    if (cell.id === fromId) continue;
    const [cx, cy] = cellCenter(cell);
    const along = (cx - fx) * dx + (cy - fy) * dy;
    if (along < 1e-9) continue;
    const across = Math.abs((cx - fx) * dy - (cy - fy) * dx);
    const score = along + 2 * across;
    if (score < bestScore) {
      bestScore = score;
      bestId = cell.id;
    }
    if (score < bestEdgeScore && sharesEdge(fromKeys, cell)) {
      bestEdgeScore = score;
      bestEdgeId = cell.id;
    }
  }
  return bestEdgeId ?? bestId;
}

// Sınırsız ızgarada ok tuşu komşusu: hücrenin merkezinin karosu ve çevresindeki 8 karo aranır.
// Hücreler karolarından en fazla bir karo taştığından en yakın komşular bu 3×3 alandadır.
export function findNeighborCell(
  template: Template,
  cell: Cell,
  direction: Direction,
): Cell | null {
  const { col, row } = tileOf(template, cellCenter(cell));
  const candidates = cellsInTiles(template, {
    left: col - 1,
    top: row - 1,
    right: col + 2,
    bottom: row + 2,
  });
  const nextId = findNeighbor(candidates, cell.id, direction);
  return candidates.find((candidate) => candidate.id === nextId) ?? null;
}
