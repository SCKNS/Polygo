import {
  basketCells,
  brickCells,
  herringboneCells,
  parquetCells,
  pythagoreanCells,
  stairCells,
} from "./builders/brick";
import {
  archCells,
  circleCells,
  cloverCells,
  fanCells,
  flowerCells,
  leafCells,
  overlapCells,
  ringCells,
  scalesCells,
  truchetCells,
  waveCells,
  wavyCells,
} from "./builders/curve";
import {
  cubeCells,
  fineHexCells,
  fineTriangleCells,
  hexagonCells,
  hexRingCells,
  kiteCells,
  mixedCubeCells,
  rhombiCells,
  squareTriangleCells,
  triakisCells,
  triangleCells,
  trihexCells,
} from "./builders/hex";
import {
  crossCells,
  diagonalCells,
  diamondCells,
  eightSliceCells,
  frameCells,
  octagonCells,
  pinwheelCells,
  pixelCells,
  squareCells,
  star4Cells,
  star8Cells,
  zigzagCells,
} from "./builders/square";
import type {
  Cell,
  Template,
  TemplateGroup,
  TemplateId,
  TileSize,
} from "./types";

export type {
  Cell,
  Point,
  Template,
  TemplateGroup,
  TemplateId,
  TileSize,
} from "./types";
export {
  cellAt,
  cellCenter,
  cellsInTiles,
  cellsInView,
  type TileRange,
  type WorldRange,
} from "./grid";

// Karo boyutları. Çoğu şablon kare karoyu kullanır; üçgen ve altıgen desenleri dikdörtgen karoya sığar.
const UNIT: TileSize = { width: 1, height: 1 };
const TRIANGLE_TILE: TileSize = { width: 1, height: Math.sqrt(3) };
const BIG_HEX_TILE: TileSize = { width: 2, height: 2 * Math.sqrt(3) };

// Şablon panelindeki başlıkların sırası.
export const TEMPLATE_GROUPS: readonly TemplateGroup[] = [
  "Kare",
  "Yay",
  "Taş örgü",
  "Üçgen ve altıgen",
];

// Yeni şablon eklemek:
// 1. types.ts'teki TemplateId'ye yeni kimliği ekle.
// 2. Bu listeye bir girdi ekle (builders/ altındaki mevcut bir builder'la ya da oraya yazılan yeni bir builder'la).
// 3. templates.test.ts'teki EXPECTED_CELLS_PER_TILE'a karo başına hücre sayısını ekle.
// Bir grubun içindeki sıra, şablon panelindeki sıradır.
export const TEMPLATES: readonly Template[] = [
  {
    id: "square",
    name: "Kare",
    group: "Kare",
    tile: UNIT,
    cellsInTile: squareCells,
  },
  {
    id: "pixel",
    name: "Piksel",
    group: "Kare",
    tile: UNIT,
    cellsInTile: pixelCells,
  },
  {
    id: "diagonal",
    name: "Çapraz",
    group: "Kare",
    tile: UNIT,
    cellsInTile: diagonalCells,
  },
  {
    id: "zigzag",
    name: "Zikzak",
    group: "Kare",
    tile: UNIT,
    cellsInTile: zigzagCells,
  },
  {
    id: "cross",
    name: "Dörtlü",
    group: "Kare",
    tile: UNIT,
    cellsInTile: crossCells,
  },
  {
    id: "eightSlice",
    name: "Sekiz dilim",
    group: "Kare",
    tile: UNIT,
    cellsInTile: eightSliceCells,
  },
  {
    id: "diamond",
    name: "Elmas",
    group: "Kare",
    tile: UNIT,
    cellsInTile: diamondCells,
  },
  {
    id: "octagon",
    name: "Sekizgen",
    group: "Kare",
    tile: UNIT,
    cellsInTile: octagonCells,
  },
  {
    id: "pinwheel",
    name: "Fırıldak",
    group: "Kare",
    tile: UNIT,
    cellsInTile: pinwheelCells,
  },
  {
    id: "frame",
    name: "Çerçeve",
    group: "Kare",
    tile: UNIT,
    cellsInTile: frameCells,
  },
  {
    id: "star4",
    name: "Yıldız",
    group: "Kare",
    tile: UNIT,
    cellsInTile: star4Cells,
  },
  {
    id: "star8",
    name: "Sekiz köşe",
    group: "Kare",
    tile: UNIT,
    cellsInTile: star8Cells,
  },

  {
    id: "circle",
    name: "Daire",
    group: "Yay",
    tile: UNIT,
    cellsInTile: circleCells,
  },
  {
    id: "clover",
    name: "Yonca",
    group: "Yay",
    tile: UNIT,
    cellsInTile: cloverCells,
  },
  {
    id: "leaf",
    name: "Yaprak",
    group: "Yay",
    tile: UNIT,
    cellsInTile: leafCells,
  },
  {
    id: "flower",
    name: "Çiçek",
    group: "Yay",
    tile: UNIT,
    cellsInTile: flowerCells,
  },
  {
    id: "wave",
    name: "Dalga",
    group: "Yay",
    tile: UNIT,
    cellsInTile: waveCells,
  },
  {
    id: "truchet",
    name: "Kıvrım",
    group: "Yay",
    tile: UNIT,
    cellsInTile: truchetCells,
  },
  {
    id: "ring",
    name: "Halka",
    group: "Yay",
    tile: UNIT,
    cellsInTile: ringCells,
  },
  {
    id: "fan",
    name: "Yelpaze",
    group: "Yay",
    tile: UNIT,
    cellsInTile: fanCells,
  },
  {
    id: "overlap",
    name: "Kesişen daire",
    group: "Yay",
    tile: UNIT,
    cellsInTile: overlapCells,
  },
  {
    id: "scales",
    name: "Pul",
    group: "Yay",
    tile: UNIT,
    cellsInTile: scalesCells,
  },
  {
    id: "arch",
    name: "Kemer",
    group: "Yay",
    tile: UNIT,
    cellsInTile: archCells,
  },
  {
    id: "wavy",
    name: "Dalgalı şerit",
    group: "Yay",
    tile: UNIT,
    cellsInTile: wavyCells,
  },

  {
    id: "brick",
    name: "Tuğla",
    group: "Taş örgü",
    tile: UNIT,
    cellsInTile: brickCells,
  },
  {
    id: "stair",
    name: "Merdiven",
    group: "Taş örgü",
    tile: { width: 1, height: 2 },
    cellsInTile: stairCells,
  },
  {
    id: "basket",
    name: "Hasır",
    group: "Taş örgü",
    tile: UNIT,
    cellsInTile: basketCells,
  },
  {
    id: "parquet",
    name: "Parke",
    group: "Taş örgü",
    tile: { width: 1.5, height: 1.5 },
    cellsInTile: parquetCells,
  },
  {
    id: "herringbone",
    name: "Balıksırtı",
    group: "Taş örgü",
    tile: { width: 2, height: 2 },
    cellsInTile: herringboneCells,
  },
  {
    id: "pythagorean",
    name: "İki kare",
    group: "Taş örgü",
    tile: { width: 2.5, height: 2.5 },
    cellsInTile: pythagoreanCells,
  },

  {
    id: "triangle",
    name: "Üçgen",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: triangleCells,
  },
  {
    id: "fineTriangle",
    name: "Sık üçgen",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: fineTriangleCells,
  },
  {
    id: "triakis",
    name: "Üç dilim",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: triakisCells,
  },
  {
    id: "hexagon",
    name: "Altıgen",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: hexagonCells,
  },
  {
    id: "kite",
    name: "Uçurtma",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: kiteCells,
  },
  {
    id: "hexRing",
    name: "Petek halka",
    group: "Üçgen ve altıgen",
    tile: BIG_HEX_TILE,
    cellsInTile: hexRingCells,
  },
  {
    id: "cube",
    name: "Küp",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: cubeCells,
  },
  {
    id: "mixedCube",
    name: "Karışık küp",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: mixedCubeCells,
  },
  {
    id: "fineHex",
    name: "İnce üçgen",
    group: "Üçgen ve altıgen",
    tile: BIG_HEX_TILE,
    cellsInTile: fineHexCells,
  },
  {
    id: "trihex",
    name: "Altıgen + üçgen",
    group: "Üçgen ve altıgen",
    tile: TRIANGLE_TILE,
    cellsInTile: trihexCells,
  },
  {
    id: "rhombi",
    name: "Altıgen + kare",
    group: "Üçgen ve altıgen",
    tile: BIG_HEX_TILE,
    cellsInTile: rhombiCells,
  },
  {
    id: "squareTriangle",
    name: "Kare + üçgen",
    group: "Üçgen ve altıgen",
    tile: { width: 1, height: 2 + Math.sqrt(3) },
    cellsInTile: squareTriangleCells,
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];

export function isTemplateId(value: unknown): value is TemplateId {
  return (
    typeof value === "string" &&
    TEMPLATES.some((template) => template.id === value)
  );
}

// Yalnızca güvenilir (koddaki) kimliklerle çağrılır; bulunamazsa sessizce geçmez, hata verir.
export function getTemplate(id: TemplateId): Template {
  const template = TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error(`Şablon bulunamadı: ${id}`);
  return template;
}

// Hücre kenarlarının hepsi tek bir SVG yolu: binlerce ayrı öğe yerine tek öğe.
// Ortak kenarlar iki kez çizilse de koyulaşmaz.
export function outlinePath(cells: readonly Cell[]): string {
  return cells.map((cell) => cell.d).join("");
}
