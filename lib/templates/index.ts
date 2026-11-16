import { crossCells, diagonalCells, squareCells } from "./builders";
import type { Point, Template, TemplateId } from "./types";

export type { Cell, Point, Template, TemplateId } from "./types";

// Yeni şablon eklemek:
// 1. types.ts'teki TemplateId'ye yeni kimliği ekle.
// 2. Bu listeye bir girdi ekle (mevcut builder'lardan biriyle ya da builders.ts'e yazılan yeni bir builder'la).
// 3. templates.test.ts'teki EXPECTED_CELL_COUNTS'a beklenen hücre sayısını ekle.
export const TEMPLATES: readonly Template[] = [
  { id: "square", name: "Kare", width: 8, height: 8, cells: squareCells(8, 8) },
  { id: "diagonal", name: "Çapraz", width: 8, height: 8, cells: diagonalCells(8, 8) },
  { id: "cross", name: "Dörtlü", width: 6, height: 6, cells: crossCells(6, 6) },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];

// Yalnızca güvenilir (koddaki) kimliklerle çağrılır; bulunamazsa sessizce geçmez, hata verir.
// Kayıttan gelen bilinmeyen kimlikler için varsayılana düşen kontrol Adım 6'da (kayıt) eklenecek.
export function getTemplate(id: TemplateId): Template {
  const template = TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error(`Şablon bulunamadı: ${id}`);
  return template;
}

// SVG polygon'un beklediği "x,y x,y ..." biçimi.
export function toPointsAttribute(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}
