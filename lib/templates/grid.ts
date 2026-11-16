import type { Cell, Point, Template } from "./types";

// Izgarada kareler aralığı: left <= x < right, top <= y < bottom (sağ ve alt dahil değil).
export type SquareRange = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

// Aralıktaki tüm karelerin hücreleri, satır satır.
export function cellsInRange(template: Template, range: SquareRange): Cell[] {
  const cells: Cell[] = [];
  for (let y = range.top; y < range.bottom; y++) {
    for (let x = range.left; x < range.right; x++) {
      cells.push(...template.cellsInSquare(x, y));
    }
  }
  return cells;
}

// Nokta dışbükey çokgenin içinde ya da kenarında mı? Her kenarda nokta aynı yanda olmalı.
export function containsPoint(points: readonly Point[], [px, py]: Point): boolean {
  let side = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    if (Math.abs(cross) < 1e-12) continue; // kenarın üzerinde
    const sign = Math.sign(cross);
    if (side === 0) side = sign;
    else if (sign !== side) return false;
  }
  return true;
}

// Dünya koordinatındaki noktanın altındaki hücre. Yalnız noktanın karesi aranır, bu yüzden ızgara sınırsız olsa da hızlıdır.
// İki hücrenin ortak kenarındaki nokta listede önce gelen hücreye düşer.
export function cellAt(template: Template, point: Point): Cell | null {
  const cells = template.cellsInSquare(Math.floor(point[0]), Math.floor(point[1]));
  return cells.find((cell) => containsPoint(cell.points, point)) ?? null;
}
