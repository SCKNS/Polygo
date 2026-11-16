import type { Cell } from "./types";

// Izgaradaki her kareyi (sütun, satır) sırasıyla gezer.
function eachSquare(columns: number, rows: number, makeCells: (x: number, y: number) => Cell[]): readonly Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      cells.push(...makeCells(x, y));
    }
  }
  return cells;
}

// Her kare tek hücre.
export function squareCells(columns: number, rows: number): readonly Cell[] {
  return eachSquare(columns, rows, (x, y) => [
    { id: `${x}-${y}`, points: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]] },
  ]);
}

// Her kare, sol alttan sağ üste çizilen çaprazla iki üçgene bölünür.
export function diagonalCells(columns: number, rows: number): readonly Cell[] {
  return eachSquare(columns, rows, (x, y) => [
    { id: `${x}-${y}-a`, points: [[x, y], [x + 1, y], [x, y + 1]] },
    { id: `${x}-${y}-b`, points: [[x + 1, y], [x + 1, y + 1], [x, y + 1]] },
  ]);
}

// Her kare, iki çaprazla merkezde birleşen dört üçgene bölünür.
export function crossCells(columns: number, rows: number): readonly Cell[] {
  return eachSquare(columns, rows, (x, y) => {
    const center: [number, number] = [x + 0.5, y + 0.5];
    return [
      { id: `${x}-${y}-top`, points: [[x, y], [x + 1, y], center] },
      { id: `${x}-${y}-right`, points: [[x + 1, y], [x + 1, y + 1], center] },
      { id: `${x}-${y}-bottom`, points: [[x + 1, y + 1], [x, y + 1], center] },
      { id: `${x}-${y}-left`, points: [[x, y + 1], [x, y], center] },
    ];
  });
}
