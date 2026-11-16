import { shape, type Arc } from "../shape";
import type { Cell, Point } from "../types";

// Builder'ların ortak yardımcıları. Her builder (col, row) karosunun hücrelerini verir; karonun sol üst köşesi
// (col * genişlik, row * yükseklik), col ve row negatif de olabilir. id'ler karo koordinatıyla başlar, bu yüzden karo
// nerede çizilirse çizilsin aynı kalır. Açılar derecedir ve ekran yönündedir: 0° sağ, 90° aşağı (SVG'de y aşağı doğru artar).

// Eşkenar üçgen yüksekliği (kenar 1).
export const TRIANGLE_HEIGHT = Math.sqrt(3) / 2;

// Yay kısaltması: merkez (cx, cy), yarıçap r, from° -> to°.
export function arc(cx: number, cy: number, r: number, from: number, to: number): Arc {
  return { center: [cx, cy], r, from, to };
}

// Negatif sayılarda da doğru çalışan tek/çift kontrolü (JavaScript'te -3 % 2 === -1).
export function isOdd(value: number): boolean {
  return ((value % 2) + 2) % 2 === 1;
}

// Karoya göre her zaman aynı çıkan "yazı-tura": rastgele görünür ama sayfa yenilense de değişmez.
// (Basit bir tamsayı karıştırma; Math.imul 32 bit çarpma yapar, negatif sayılarda da çalışır.)
export function coinFlip(x: number, y: number): boolean {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) & 1) === 1;
}

// İki noktanın orta noktası.
export function midpoint([ax, ay]: Point, [bx, by]: Point): Point {
  return [(ax + bx) / 2, (ay + by) / 2];
}

// Sol üst köşesi (x, y) olan w × h dikdörtgen hücre.
export function rect(id: string, x: number, y: number, w: number, h: number): Cell {
  return shape(id, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
}

// Merkezi (cx, cy), genişliği w olan sivri tepeli altıgenin köşeleri: tepeden başlayıp saat yönünde.
export function hexagonPoints(cx: number, cy: number, w = 1): Point[] {
  const s = w / Math.sqrt(3); // altıgenin kenarı
  return [
    [cx, cy - s], [cx + w / 2, cy - s / 2], [cx + w / 2, cy + s / 2],
    [cx, cy + s], [cx - w / 2, cy + s / 2], [cx - w / 2, cy - s / 2],
  ];
}

// Bal peteği karosundaki iki altıgenin merkezi (altıgen genişliği w; karo w × w√3):
// karonun üst ortası ve yarım altıgen sağa kaymış alt sırası.
export function hexagonCenters(col: number, row: number, w = 1): [Point, Point] {
  const s = w / Math.sqrt(3);
  const x = col * w;
  const y = row * 3 * s;
  return [[x + w / 2, y + s], [x + w, y + 2.5 * s]];
}
