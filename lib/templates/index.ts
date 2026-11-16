import { crossCells, diagonalCells, squareCells } from "./builders";
import type { Point, Template, TemplateId } from "./types";

export type { Cell, Point, Template, TemplateId } from "./types";
export { cellAt, cellsInRange, type SquareRange } from "./grid";

// Yeni şablon eklemek:
// 1. types.ts'teki TemplateId'ye yeni kimliği ekle.
// 2. Bu listeye bir girdi ekle (mevcut builder'lardan biriyle ya da builders.ts'e yazılan yeni bir builder'la).
// 3. templates.test.ts'teki EXPECTED_CELLS_PER_SQUARE'e kare başına hücre sayısını ekle.
export const TEMPLATES: readonly Template[] = [
  { id: "square", name: "Kare", cellsInSquare: squareCells },
  { id: "diagonal", name: "Çapraz", cellsInSquare: diagonalCells },
  { id: "cross", name: "Dörtlü", cellsInSquare: crossCells },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];

// Yalnızca güvenilir (koddaki) kimliklerle çağrılır; bulunamazsa sessizce geçmez, hata verir.
// Kayıttan gelen bilinmeyen kimlikler için varsayılana düşen kontrol kayıt adımında eklenecek.
export function getTemplate(id: TemplateId): Template {
  const template = TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error(`Şablon bulunamadı: ${id}`);
  return template;
}

// SVG polygon'un beklediği "x,y x,y ..." biçimi.
export function toPointsAttribute(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}
