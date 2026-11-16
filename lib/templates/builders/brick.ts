import type { Cell } from "../types";
import { isOdd, rect } from "./common";

// Dikdörtgen taşlardan örülen şablonlar. Taşlar 1 × 0.5 birim (Kare şablonunun yarım karesi).

// Tuğla duvar (karo 1×1): iki sıra, alttaki sıra yarım taş kayar.
export function brickCells(x: number, y: number): readonly Cell[] {
  return [
    rect(`${x}-${y}-a`, x, y, 1, 0.5),
    rect(`${x}-${y}-b`, x + 0.5, y + 0.5, 1, 0.5),
  ];
}

// Merdiven (karo 1×2): dört sıra tuğla, her sıra bir öncekinden çeyrek taş sağa kayar; taşlar çapraz basamaklar çizer.
export function stairCells(col: number, row: number): readonly Cell[] {
  return [0, 1, 2, 3].map((step) =>
    rect(
      `${col}-${row}-${step}`,
      col + step * 0.25,
      row * 2 + step * 0.5,
      1,
      0.5,
    ),
  );
}

// Hasır örgü (karo 1×1): her karede iki taş; komşu karelerde taşlar yatay ve dikey sırayla değişir.
export function basketCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  if (isOdd(x + y))
    return [
      rect(`${prefix}-a`, x, y, 0.5, 1),
      rect(`${prefix}-b`, x + 0.5, y, 0.5, 1),
    ];
  return [
    rect(`${prefix}-a`, x, y, 1, 0.5),
    rect(`${prefix}-b`, x, y + 0.5, 1, 0.5),
  ];
}

// Balıksırtı (karo 2×2): yatay ve dikey taşlar çapraz bir merdiven gibi dizilir. Merdivenin her basamağı yarım birim
// sağa ve aşağı kayar; karoda dört basamak, her basamakta bir yatay ve bir dikey taş vardır.
export function herringboneCells(col: number, row: number): readonly Cell[] {
  const x = col * 2;
  const y = row * 2;
  return [0, 1, 2, 3].flatMap((step) => {
    const t = step * 0.5;
    return [
      rect(`${col}-${row}-h${step}`, x + t, y + t, 1, 0.5),
      rect(`${col}-${row}-v${step}`, x + t, y + t + 0.5, 0.5, 1),
    ];
  });
}

// İki boy kare (Pisagor döşemesi; karo 2.5×2.5): her büyük karenin (1×1) sağ üst köşesine küçük bir kare (0.5×0.5)
// yaslanır. Büyük kareler (1, 0.5) ve (-0.5, 1) adımlarıyla dizilir; bu adımlarla karoya beş büyük kare düşer.
const PYTHAGOREAN_OFFSETS: readonly [number, number][] = [
  [0, 0],
  [1, 0.5],
  [2, 1],
  [0.5, 1.5],
  [1.5, 2],
];

export function pythagoreanCells(col: number, row: number): readonly Cell[] {
  const x = col * 2.5;
  const y = row * 2.5;
  return PYTHAGOREAN_OFFSETS.flatMap(([dx, dy], i) => [
    rect(`${col}-${row}-big${i}`, x + dx, y + dy, 1, 1),
    rect(`${col}-${row}-small${i}`, x + dx + 1, y + dy, 0.5, 0.5),
  ]);
}

// Parke (karo 1.5×1.5): dört dikdörtgen taş (1 × 0.5) ortadaki küçük karenin (0.5 × 0.5) çevresinde fırıldak gibi döner.
export function parquetCells(col: number, row: number): readonly Cell[] {
  const x = col * 1.5;
  const y = row * 1.5;
  const prefix = `${col}-${row}`;
  return [
    rect(`${prefix}-top`, x, y, 1, 0.5),
    rect(`${prefix}-right`, x + 1, y, 0.5, 1),
    rect(`${prefix}-bottom`, x + 0.5, y + 1, 1, 0.5),
    rect(`${prefix}-left`, x, y + 0.5, 0.5, 1),
    rect(`${prefix}-center`, x + 0.5, y + 0.5, 0.5, 0.5),
  ];
}
