import type { Cell } from "./types";

// Her builder (x, y) karesinin hücrelerini verir. Kare sol üst köşesi (x, y) olan 1×1 birimdir;
// x ve y negatif de olabilir. id'ler dünya koordinatıdır, bu yüzden kare nerede çizilirse çizilsin aynı kalır.

// Her kare tek hücre.
export function squareCells(x: number, y: number): readonly Cell[] {
  return [{ id: `${x}-${y}`, points: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]] }];
}

// Her kare, sol alttan sağ üste çizilen çaprazla iki üçgene bölünür.
export function diagonalCells(x: number, y: number): readonly Cell[] {
  return [
    { id: `${x}-${y}-a`, points: [[x, y], [x + 1, y], [x, y + 1]] },
    { id: `${x}-${y}-b`, points: [[x + 1, y], [x + 1, y + 1], [x, y + 1]] },
  ];
}

// Her kare, iki çaprazla merkezde birleşen dört üçgene bölünür.
export function crossCells(x: number, y: number): readonly Cell[] {
  const center: [number, number] = [x + 0.5, y + 0.5];
  return [
    { id: `${x}-${y}-top`, points: [[x, y], [x + 1, y], center] },
    { id: `${x}-${y}-right`, points: [[x + 1, y], [x + 1, y + 1], center] },
    { id: `${x}-${y}-bottom`, points: [[x + 1, y + 1], [x, y + 1], center] },
    { id: `${x}-${y}-left`, points: [[x, y + 1], [x, y], center] },
  ];
}
