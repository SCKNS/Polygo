import { shape } from "../shape";
import type { Cell, Point } from "../types";
import {
  hexagonCenters,
  hexagonPoints,
  midpoint,
  TRIANGLE_HEIGHT,
} from "./common";

// Üçgen ve altıgen şablonları. Karolar dikdörtgendir (çoğu 1 × √3), hücreler karodan en fazla bir karo taşar.

// Eşkenar üçgen ızgarasının bir bloğu: kenarı side olan dört üçgen, iki sıra halinde (blok side × side√3).
// Her sırada bir yukarı ve bir aşağı bakan üçgen; aşağı bakanlar bloğun sağına yarım kenar taşar.
function triangleBlock(
  x: number,
  y: number,
  side: number,
): [string, Point[]][] {
  const h = TRIANGLE_HEIGHT * side;
  const half = side / 2;
  return [
    [
      "a",
      [
        [x, y + h],
        [x + half, y],
        [x + side, y + h],
      ],
    ],
    [
      "b",
      [
        [x + half, y],
        [x + side + half, y],
        [x + side, y + h],
      ],
    ],
    [
      "c",
      [
        [x, y + h],
        [x + side, y + h],
        [x + half, y + 2 * h],
      ],
    ],
    [
      "d",
      [
        [x + half, y + 2 * h],
        [x + side, y + h],
        [x + side + half, y + 2 * h],
      ],
    ],
  ];
}

// Eşkenar üçgenler: karoda iki sıra, her sırada bir yukarı ve bir aşağı bakan üçgen.
export function triangleCells(col: number, row: number): readonly Cell[] {
  return triangleBlock(col, row * 2 * TRIANGLE_HEIGHT, 1).map(
    ([name, points]) => shape(`${col}-${row}-${name}`, points),
  );
}

// Kenarı yarım birim olan sık üçgen ızgarası: karoda 2×2 blok, toplam on altı üçgen.
export function fineTriangleCells(col: number, row: number): readonly Cell[] {
  const blocks: [number, number][] = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  return blocks.flatMap(([i, j]) =>
    triangleBlock(
      col + i * 0.5,
      row * 2 * TRIANGLE_HEIGHT + j * TRIANGLE_HEIGHT,
      0.5,
    ).map(([name, points]) => shape(`${col}-${row}-${i}${j}${name}`, points)),
  );
}

// Her eşkenar üçgen, köşelerinden merkezine çizilen çizgilerle üç geniş açılı üçgene bölünür.
export function triakisCells(col: number, row: number): readonly Cell[] {
  return triangleBlock(col, row * 2 * TRIANGLE_HEIGHT, 1).flatMap(
    ([name, [p0, p1, p2]]) => {
      const center: Point = [
        (p0[0] + p1[0] + p2[0]) / 3,
        (p0[1] + p1[1] + p2[1]) / 3,
      ];
      return [
        shape(`${col}-${row}-${name}0`, [p0, p1, center]),
        shape(`${col}-${row}-${name}1`, [p1, p2, center]),
        shape(`${col}-${row}-${name}2`, [p2, p0, center]),
      ];
    },
  );
}

// Bal peteği: karoda iki altıgen.
export function hexagonCells(col: number, row: number): readonly Cell[] {
  const [a, b] = hexagonCenters(col, row);
  return [
    shape(`${col}-${row}-a`, hexagonPoints(...a)),
    shape(`${col}-${row}-b`, hexagonPoints(...b)),
  ];
}

// Her altıgen, merkezden kenar ortalarına çizilen çizgilerle altı uçurtmaya bölünür.
export function kiteCells(col: number, row: number): readonly Cell[] {
  return hexagonCenters(col, row).flatMap((center, i) => {
    const v = hexagonPoints(...center);
    return v.map((corner, k) => {
      const before = midpoint(v[(k + 5) % 6], corner);
      const after = midpoint(corner, v[(k + 1) % 6]);
      return shape(`${col}-${row}-${i === 0 ? "a" : "b"}${k}`, [
        center,
        before,
        corner,
        after,
      ]);
    });
  });
}

// Büyük altıgenin (genişlik 2) içinde yarım boy bir altıgen ve çevresinde altı yamuk.
export function hexRingCells(col: number, row: number): readonly Cell[] {
  return hexagonCenters(col, row, 2).flatMap((center, i) => {
    const prefix = `${col}-${row}-${i === 0 ? "a" : "b"}`;
    const outer = hexagonPoints(...center, 2);
    const inner = hexagonPoints(...center, 1);
    return [
      shape(`${prefix}-center`, inner),
      ...outer.map((corner, k) => {
        const next = (k + 1) % 6;
        return shape(`${prefix}${k}`, [
          corner,
          outer[next],
          inner[next],
          inner[k],
        ]);
      }),
    ];
  });
}

// Altıgeni merkezden üç eşkenar dörtgene böler: üç yüzü görünen küp yanılsaması. flipped ise ters küp (Y yerine ters Y).
function cubeFaces(prefix: string, center: Point, flipped: boolean): Cell[] {
  const [v0, v1, v2, v3, v4, v5] = hexagonPoints(...center);
  if (flipped) {
    return [
      shape(`${prefix}-right`, [center, v0, v1, v2]),
      shape(`${prefix}-bottom`, [center, v2, v3, v4]),
      shape(`${prefix}-left`, [center, v4, v5, v0]),
    ];
  }
  return [
    shape(`${prefix}-top`, [center, v5, v0, v1]),
    shape(`${prefix}-right`, [center, v1, v2, v3]),
    shape(`${prefix}-left`, [center, v3, v4, v5]),
  ];
}

// Her altıgen üç eşkenar dörtgene bölünür: küp yığını.
export function cubeCells(col: number, row: number): readonly Cell[] {
  const [a, b] = hexagonCenters(col, row);
  return [
    ...cubeFaces(`${col}-${row}-a`, a, false),
    ...cubeFaces(`${col}-${row}-b`, b, false),
  ];
}

// Küp, ama alt sıradaki altıgenler ters bölünür: düz ve ters küpler sırayla dizilir.
export function mixedCubeCells(col: number, row: number): readonly Cell[] {
  const [a, b] = hexagonCenters(col, row);
  return [
    ...cubeFaces(`${col}-${row}-a`, a, false),
    ...cubeFaces(`${col}-${row}-b`, b, true),
  ];
}

// Altıgen (genişlik 2) merkezden köşelere ve kenar ortalarına bölünür: on iki ince dik üçgen.
export function fineHexCells(col: number, row: number): readonly Cell[] {
  return hexagonCenters(col, row, 2).flatMap((center, i) => {
    const v = hexagonPoints(...center, 2);
    return v.flatMap((corner, k) => {
      const next = v[(k + 1) % 6];
      const middle = midpoint(corner, next);
      const prefix = `${col}-${row}-${i === 0 ? "a" : "b"}${k}`;
      return [
        shape(`${prefix}-l`, [center, corner, middle]),
        shape(`${prefix}-r`, [center, middle, next]),
      ];
    });
  });
}

// Altıgen ve üçgen: köşelerinden birbirine değen altıgenler, aralarında eşkenar üçgenler.
// Karoda iki altıgen; her biri sağ altında bir yukarı, altında bir aşağı bakan üçgen getirir.
export function trihexCells(col: number, row: number): readonly Cell[] {
  const k = Math.sqrt(3) / 4; // kenarı 0.5 olan altıgenin yarı yüksekliği
  const x = col;
  const y = row * 4 * k;
  const centers: Point[] = [
    [x + 0.5, y + k],
    [x + 1, y + 3 * k],
  ];
  return centers.flatMap(([cx, cy], i) => {
    const prefix = `${col}-${row}-${i === 0 ? "a" : "b"}`;
    return [
      shape(`${prefix}-hex`, [
        [cx + 0.5, cy],
        [cx + 0.25, cy + k],
        [cx - 0.25, cy + k],
        [cx - 0.5, cy],
        [cx - 0.25, cy - k],
        [cx + 0.25, cy - k],
      ]),
      shape(`${prefix}-up`, [
        [cx + 0.5, cy],
        [cx + 0.75, cy + k],
        [cx + 0.25, cy + k],
      ]),
      shape(`${prefix}-down`, [
        [cx - 0.25, cy + k],
        [cx + 0.25, cy + k],
        [cx, cy + 2 * k],
      ]),
    ];
  });
}

// Altıgen, kare ve üçgen (3.4.6.4 döşemesi; karo 2 × 2√3). Altıgen merkezleri 2 birim aralıklı bir üçgen ızgarasıdır;
// iki komşu altıgenin arasında bir kare, üç komşu altıgenin arasında bir üçgen kalır. Altıgen kenarı = kare kenarı = e.
const RHOMBI_SPACING = 2;
const RHOMBI_EDGE = RHOMBI_SPACING / (1 + Math.sqrt(3)); // 2 · (altıgen yarı genişliği) + e = aralık

// Merkezi c olan altıgenin deg açısındaki köşesi (sivri tepeli: köşeler -90°, -30°, 30°, 90°, 150°, 210°).
function hexCorner([cx, cy]: Point, deg: number): Point {
  const radians = (deg * Math.PI) / 180;
  return [
    cx + RHOMBI_EDGE * Math.cos(radians),
    cy + RHOMBI_EDGE * Math.sin(radians),
  ];
}

export function rhombiCells(col: number, row: number): readonly Cell[] {
  const d = RHOMBI_SPACING;
  const rowStep = (d * Math.sqrt(3)) / 2; // alt sıradaki altıgenin dikey uzaklığı
  const first: Point = [col * d + d / 2, row * 2 * rowStep + rowStep / 2];
  const centers: Point[] = [first, [first[0] + d / 2, first[1] + rowStep]];
  return centers.flatMap((c, i) => {
    const prefix = `${col}-${row}-${i === 0 ? "a" : "b"}`;
    const right: Point = [c[0] + d, c[1]]; // sağdaki altıgen
    const downRight: Point = [c[0] + d / 2, c[1] + rowStep]; // sağ alttaki altıgen
    const downLeft: Point = [c[0] - d / 2, c[1] + rowStep]; // sol alttaki altıgen
    return [
      shape(
        `${prefix}-hex`,
        [-90, -30, 30, 90, 150, 210].map((deg) => hexCorner(c, deg)),
      ),
      shape(`${prefix}-sq-r`, [
        hexCorner(c, -30),
        hexCorner(right, 210),
        hexCorner(right, 150),
        hexCorner(c, 30),
      ]),
      shape(`${prefix}-sq-dr`, [
        hexCorner(c, 30),
        hexCorner(downRight, 270),
        hexCorner(downRight, 210),
        hexCorner(c, 90),
      ]),
      shape(`${prefix}-sq-dl`, [
        hexCorner(c, 90),
        hexCorner(downLeft, 330),
        hexCorner(downLeft, 270),
        hexCorner(c, 150),
      ]),
      shape(`${prefix}-tri-r`, [
        hexCorner(c, 30),
        hexCorner(right, 150),
        hexCorner(downRight, 270),
      ]),
      shape(`${prefix}-tri-d`, [
        hexCorner(c, 90),
        hexCorner(downRight, 210),
        hexCorner(downLeft, 330),
      ]),
    ];
  });
}

// Kare ve üçgen: kare sıraları ile üçgen sıraları sırayla dizilir; her kare sırası yarım kare kayar.
export function squareTriangleCells(col: number, row: number): readonly Cell[] {
  const h = TRIANGLE_HEIGHT;
  const x = col;
  const y = row * (2 + 2 * h);
  const y2 = y + 1 + h; // ikinci kare sırasının üstü
  const prefix = `${col}-${row}`;
  return [
    shape(`${prefix}-sq-a`, [
      [x, y],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
    ]),
    shape(`${prefix}-tri-a`, [
      [x, y + 1],
      [x + 1, y + 1],
      [x + 0.5, y2],
    ]),
    shape(`${prefix}-tri-b`, [
      [x + 1, y + 1],
      [x + 1.5, y2],
      [x + 0.5, y2],
    ]),
    shape(`${prefix}-sq-b`, [
      [x + 0.5, y2],
      [x + 1.5, y2],
      [x + 1.5, y2 + 1],
      [x + 0.5, y2 + 1],
    ]),
    shape(`${prefix}-tri-c`, [
      [x + 0.5, y2 + 1],
      [x + 1.5, y2 + 1],
      [x + 1, y2 + 1 + h],
    ]),
    shape(`${prefix}-tri-d`, [
      [x + 0.5, y2 + 1],
      [x + 1, y2 + 1 + h],
      [x, y2 + 1 + h],
    ]),
  ];
}
