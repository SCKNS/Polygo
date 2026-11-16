import type { Cell, Point } from "./types";

export type Direction = "up" | "down" | "left" | "right";

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

// Köşe noktalarının ortalaması. Dışbükey hücrede her zaman hücrenin içindedir.
export function cellCenter(cell: Cell): Point {
  const sumX = cell.points.reduce((sum, [x]) => sum + x, 0);
  const sumY = cell.points.reduce((sum, [, y]) => sum + y, 0);
  return [sumX / cell.points.length, sumY / cell.points.length];
}

// Ok tuşu için komşu hücre: o yönde olan hücrelerden en yakını. Yana sapma iki kat cezalandırılır,
// böylece düz çizgide kalan hücre tercih edilir. O yönde hücre yoksa null (kenardayız).
export function findNeighbor(cells: readonly Cell[], fromId: string, direction: Direction): string | null {
  const from = cells.find((cell) => cell.id === fromId);
  if (!from) return null;
  const [fx, fy] = cellCenter(from);
  const [dx, dy] = DIRECTION_VECTORS[direction];

  let bestId: string | null = null;
  let bestScore = Infinity;
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
  }
  return bestId;
}
