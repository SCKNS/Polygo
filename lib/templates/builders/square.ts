import { mirrorX, shape, type Segment } from "../shape";
import type { Cell, Point } from "../types";
import { isOdd, rect } from "./common";

// Kare karolu, düz kenarlı şablonlar (karo 1×1).

// Kenarı 1 olan karedeki düzgün sekizgende köşeden kesilen pay: kenarlar eşit olsun diye 1 / (2 + √2).
const OCTAGON_CUT = 1 / (2 + Math.SQRT2);

// Kare karonun dört köşesinden k kadar kesilmiş üçgenler (Elmas ve Sekizgen'in köşe parçaları).
function cornerTriangles(
  prefix: string,
  x: number,
  y: number,
  k: number,
): Cell[] {
  return [
    shape(`${prefix}-nw`, [
      [x, y],
      [x + k, y],
      [x, y + k],
    ]),
    shape(`${prefix}-ne`, [
      [x + 1, y],
      [x + 1, y + k],
      [x + 1 - k, y],
    ]),
    shape(`${prefix}-se`, [
      [x + 1, y + 1],
      [x + 1 - k, y + 1],
      [x + 1, y + 1 - k],
    ]),
    shape(`${prefix}-sw`, [
      [x, y + 1],
      [x, y + 1 - k],
      [x + k, y + 1],
    ]),
  ];
}

// Karenin kenarındaki sekiz nokta (köşeler ve kenar ortaları), sol üst köşeden saat yönünde.
function squareRim(x: number, y: number): Point[] {
  return [
    [x, y],
    [x + 0.5, y],
    [x + 1, y],
    [x + 1, y + 0.5],
    [x + 1, y + 1],
    [x + 0.5, y + 1],
    [x, y + 1],
    [x, y + 0.5],
  ];
}

// Her kare tek hücre.
export function squareCells(x: number, y: number): readonly Cell[] {
  return [rect(`${x}-${y}`, x, y, 1, 1)];
}

// Her kare dört küçük kareye bölünür (piksel çizimi için ince ızgara).
export function pixelCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  return [
    rect(`${prefix}-nw`, x, y, 0.5, 0.5),
    rect(`${prefix}-ne`, x + 0.5, y, 0.5, 0.5),
    rect(`${prefix}-se`, x + 0.5, y + 0.5, 0.5, 0.5),
    rect(`${prefix}-sw`, x, y + 0.5, 0.5, 0.5),
  ];
}

// Sol alttan sağ üste çizilen çaprazla iki üçgen.
function diagonalParts(x: number, y: number): [string, Segment[]][] {
  return [
    [
      "a",
      [
        [x, y],
        [x + 1, y],
        [x, y + 1],
      ],
    ],
    [
      "b",
      [
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ],
    ],
  ];
}

// Her kare, sol alttan sağ üste çizilen çaprazla iki üçgene bölünür.
export function diagonalCells(x: number, y: number): readonly Cell[] {
  return diagonalParts(x, y).map(([name, segments]) =>
    shape(`${x}-${y}-${name}`, segments),
  );
}

// Çapraz, ama komşu karelerde yönü değişir: çaprazlar birleşip büyük elmaslar çizer.
export function zigzagCells(x: number, y: number): readonly Cell[] {
  const mirror = isOdd(x + y);
  return diagonalParts(x, y).map(([name, segments]) =>
    shape(`${x}-${y}-${name}`, mirror ? mirrorX(segments, x) : segments),
  );
}

// Her kare, iki çaprazla merkezde birleşen dört üçgene bölünür.
export function crossCells(x: number, y: number): readonly Cell[] {
  const center: Point = [x + 0.5, y + 0.5];
  return [
    shape(`${x}-${y}-top`, [[x, y], [x + 1, y], center]),
    shape(`${x}-${y}-right`, [[x + 1, y], [x + 1, y + 1], center]),
    shape(`${x}-${y}-bottom`, [[x + 1, y + 1], [x, y + 1], center]),
    shape(`${x}-${y}-left`, [[x, y + 1], [x, y], center]),
  ];
}

// İki çapraz ve iki orta çizgi: merkezde birleşen sekiz dik üçgen.
export function eightSliceCells(x: number, y: number): readonly Cell[] {
  const center: Point = [x + 0.5, y + 0.5];
  const rim = squareRim(x, y);
  return rim.map((point, i) =>
    shape(`${x}-${y}-${i}`, [point, rim[(i + 1) % rim.length], center]),
  );
}

// Kenar ortalarını birleştiren elmas + dört köşe üçgeni. Komşu karelerin köşeleri birleşince yeni elmaslar çıkar.
export function diamondCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  return [
    shape(`${prefix}-center`, [
      [x + 0.5, y],
      [x + 1, y + 0.5],
      [x + 0.5, y + 1],
      [x, y + 0.5],
    ]),
    ...cornerTriangles(prefix, x, y, 0.5),
  ];
}

// Düzgün sekizgen + köşelerde küçük üçgenler (dört komşu karenin üçgenleri birleşince küçük bir kare olur).
export function octagonCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const c = OCTAGON_CUT;
  return [
    shape(`${prefix}-center`, [
      [x + c, y],
      [x + 1 - c, y],
      [x + 1, y + c],
      [x + 1, y + 1 - c],
      [x + 1 - c, y + 1],
      [x + c, y + 1],
      [x, y + 1 - c],
      [x, y + c],
    ]),
    ...cornerTriangles(prefix, x, y, c),
  ];
}

// Merkezden kenarlara, kenar ortasının biraz yanına giden dört çizgi: aynı yöne dönen dört kanat.
export function pinwheelCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const center: Point = [x + 0.5, y + 0.5];
  return [
    shape(`${prefix}-a`, [
      center,
      [x + 0.75, y],
      [x + 1, y],
      [x + 1, y + 0.75],
    ]),
    shape(`${prefix}-b`, [
      center,
      [x + 1, y + 0.75],
      [x + 1, y + 1],
      [x + 0.25, y + 1],
    ]),
    shape(`${prefix}-c`, [
      center,
      [x + 0.25, y + 1],
      [x, y + 1],
      [x, y + 0.25],
    ]),
    shape(`${prefix}-d`, [center, [x, y + 0.25], [x, y], [x + 0.75, y]]),
  ];
}

// İç içe iki kare: ortada yarım boy bir kare, çevresinde dört yamuk.
export function frameCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const a = x + 0.25;
  const b = x + 0.75;
  const c = y + 0.25;
  const d = y + 0.75;
  return [
    rect(`${prefix}-center`, a, c, 0.5, 0.5),
    shape(`${prefix}-top`, [
      [x, y],
      [x + 1, y],
      [b, c],
      [a, c],
    ]),
    shape(`${prefix}-right`, [
      [x + 1, y],
      [x + 1, y + 1],
      [b, d],
      [b, c],
    ]),
    shape(`${prefix}-bottom`, [
      [x + 1, y + 1],
      [x, y + 1],
      [a, d],
      [b, d],
    ]),
    shape(`${prefix}-left`, [
      [x, y + 1],
      [x, y],
      [a, c],
      [a, d],
    ]),
  ];
}

// Uçları kenar ortalarına değen dört köşeli yıldız + köşelerde uçurtmalar. Dört karenin uçurtmaları birleşince
// köşe noktasında ikinci bir yıldız oluşur.
export function star4Cells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const t = 0.15; // yıldızın iç köşelerinin merkezden çapraz uzaklığı
  const nw: Point = [x + 0.5 - t, y + 0.5 - t];
  const ne: Point = [x + 0.5 + t, y + 0.5 - t];
  const se: Point = [x + 0.5 + t, y + 0.5 + t];
  const sw: Point = [x + 0.5 - t, y + 0.5 + t];
  const [top, right, bottom, left]: Point[] = [
    [x + 0.5, y],
    [x + 1, y + 0.5],
    [x + 0.5, y + 1],
    [x, y + 0.5],
  ];
  return [
    shape(`${prefix}-star`, [top, ne, right, se, bottom, sw, left, nw]),
    shape(`${prefix}-nw`, [[x, y], top, nw, left]),
    shape(`${prefix}-ne`, [[x + 1, y], right, ne, top]),
    shape(`${prefix}-se`, [[x + 1, y + 1], bottom, se, right]),
    shape(`${prefix}-sw`, [[x, y + 1], left, sw, bottom]),
  ];
}

// Uçları köşelere ve kenar ortalarına değen sekiz köşeli yıldız + kenarlarda sekiz üçgen.
export function star8Cells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const r = 0.25; // iç köşelerin merkeze uzaklığı
  const rim = squareRim(x, y); // yıldızın uçları
  // i. iç köşe, i. ve (i+1). uçların arasındaki açıda: sol üst köşe 225°, sonra 45° adımlarla.
  const inner = rim.map((_, i): Point => {
    const radians = ((247.5 + 45 * i) * Math.PI) / 180;
    return [x + 0.5 + r * Math.cos(radians), y + 0.5 + r * Math.sin(radians)];
  });
  return [
    shape(
      `${prefix}-star`,
      rim.flatMap((tip, i) => [tip, inner[i]]),
    ),
    ...rim.map((tip, i) =>
      shape(`${prefix}-${i}`, [tip, rim[(i + 1) % rim.length], inner[i]]),
    ),
  ];
}
