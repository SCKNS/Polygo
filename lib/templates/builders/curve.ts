import { mirrorX, mirrorY, shape, type Segment } from "../shape";
import type { Cell, Point } from "../types";
import { arc, coinFlip, isOdd } from "./common";

// Kare karolu, yaylı şablonlar (karo 1×1; Pul ve Kemer'de satırlar kayar).

// Bir hücrenin adı ve sınır parçaları; aynalanacak builder'lar parçaları önce böyle toplar.
type Part = [string, Segment[]];

function placeParts(prefix: string, parts: Part[], mirror: boolean, x: number): Cell[] {
  return parts.map(([name, segments]) => shape(`${prefix}-${name}`, mirror ? mirrorX(segments, x) : segments));
}

// Kareye teğet daire + dört içbükey köşe parçası.
export function circleCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const cx = x + 0.5;
  const cy = y + 0.5;
  return [
    shape(`${prefix}-circle`, [arc(cx, cy, 0.5, 0, 360)]),
    shape(`${prefix}-se`, [[x + 1, y + 1], arc(cx, cy, 0.5, 90, 0)]),
    shape(`${prefix}-sw`, [[x, y + 1], arc(cx, cy, 0.5, 180, 90)]),
    shape(`${prefix}-nw`, [[x, y], arc(cx, cy, 0.5, 270, 180)]),
    shape(`${prefix}-ne`, [[x + 1, y], arc(cx, cy, 0.5, 360, 270)]),
  ];
}

// Daire dört dilime bölünür; köşe parçaları da çaprazla ikiye ayrılır. Dört karenin dilimleri yonca/çiçek çizer.
export function cloverCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const center: Point = [x + 0.5, y + 0.5];
  const [cx, cy] = center;
  // Her çeyrek için: dilimin başladığı açı ve o çeyreğe bakan karenin köşesi.
  const quarters: { name: string; from: number; corner: Point }[] = [
    { name: "se", from: 0, corner: [x + 1, y + 1] },
    { name: "sw", from: 90, corner: [x, y + 1] },
    { name: "nw", from: 180, corner: [x, y] },
    { name: "ne", from: 270, corner: [x + 1, y] },
  ];
  return quarters.flatMap(({ name, from, corner }) => [
    shape(`${prefix}-${name}-slice`, [center, arc(cx, cy, 0.5, from, from + 90)]),
    shape(`${prefix}-${name}-a`, [corner, arc(cx, cy, 0.5, from + 45, from)]),
    shape(`${prefix}-${name}-b`, [corner, arc(cx, cy, 0.5, from + 90, from + 45)]),
  ]);
}

// Karşı köşelerden çizilen iki büyük yay (yarıçap 1): ortada yaprak, iki yanda içbükey parça.
function leafParts(x: number, y: number): Part[] {
  return [
    ["nw", [[x, y], arc(x + 1, y + 1, 1, 270, 180)]],
    ["leaf", [arc(x, y, 1, 0, 90), arc(x + 1, y + 1, 1, 180, 270)]],
    ["se", [[x + 1, y + 1], arc(x, y, 1, 90, 0)]],
  ];
}

// Her karede aynı yöne yatan bir yaprak.
export function leafCells(x: number, y: number): readonly Cell[] {
  return placeParts(`${x}-${y}`, leafParts(x, y), false, x);
}

// Yaprak, ama komşu karelerde yönü değişir: dört yaprak bir köşede buluşup dört taç yapraklı çiçek açar.
export function flowerCells(x: number, y: number): readonly Cell[] {
  return placeParts(`${x}-${y}`, leafParts(x, y), isOdd(x + y), x);
}

// İki karşı köşede çeyrek daire (yarıçap 0.5), aralarında kıvrık bir şerit.
function quarterArcParts(x: number, y: number): Part[] {
  return [
    ["nw", [[x, y], arc(x, y, 0.5, 0, 90)]],
    ["band", [[x + 1, y], arc(x + 1, y + 1, 0.5, 270, 180), [x, y + 1], arc(x, y, 0.5, 90, 0)]],
    ["se", [[x + 1, y + 1], arc(x + 1, y + 1, 0.5, 180, 270)]],
  ];
}

// Komşu karelerde desen aynalanır, böylece her iki köşe noktasından birinde tam daire, diğerinde dalgalı şeritlerin
// kavşağı oluşur.
export function waveCells(x: number, y: number): readonly Cell[] {
  return placeParts(`${x}-${y}`, quarterArcParts(x, y), isOdd(x + y), x);
}

// Dalga'nın parçaları, ama her karenin yönü yazı-turayla seçilir: birbirine bağlanan kıvrımlı yollar (Truchet deseni).
// Yazı-tura karonun koordinatından hesaplandığı için desen her açılışta aynıdır.
export function truchetCells(x: number, y: number): readonly Cell[] {
  return placeParts(`${x}-${y}`, quarterArcParts(x, y), coinFlip(x, y), x);
}

// Bir köşeden çizilen iç içe iki çeyrek daire (yarıçap 0.5 ve 1). Köşe, 2×2 karelik bloğun ortasına bakar;
// dört karenin parçaları birleşince iç içe halkalar oluşur.
export function ringCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const parts: Part[] = [
    ["inner", [[x, y], arc(x, y, 0.5, 0, 90)]],
    ["ring", [arc(x, y, 1, 0, 90), arc(x, y, 0.5, 90, 0)]],
    ["outer", [[x + 1, y + 1], arc(x, y, 1, 90, 0)]],
  ];
  // Halkanın merkezi tek sütunlarda karonun solunda, çift sütunlarda sağında olmalı (satırlar için de aynı).
  return parts.map(([name, segments]) => {
    let placed = isOdd(x) ? segments : mirrorX(segments, x);
    placed = isOdd(y) ? placed : mirrorY(placed, y);
    return shape(`${prefix}-${name}`, placed);
  });
}

// Sol alt köşeden açılan üç şeritli yelpaze (yarıçap 1/3, 2/3, 1) + sağ üstte kalan içbükey parça.
// Her karede aynı yöne bakar; yan yana gelince deniz kabuğu sırası gibi görünür.
export function fanCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const [cx, cy] = [x, y + 1];
  const [r1, r2, r3] = [1 / 3, 2 / 3, 1];
  return [
    shape(`${prefix}-inner`, [[cx, cy], arc(cx, cy, r1, 270, 360)]),
    shape(`${prefix}-middle`, [arc(cx, cy, r2, 270, 360), arc(cx, cy, r1, 360, 270)]),
    shape(`${prefix}-outer`, [arc(cx, cy, r3, 270, 360), arc(cx, cy, r2, 360, 270)]),
    shape(`${prefix}-corner`, [[x + 1, y], arc(cx, cy, r3, 360, 270)]),
  ];
}

// Köşe noktalarına oturan, birbirini kesen daireler (yarıçap √2/2; çapraz komşular yalnız değer).
// İki dairenin kesiştiği yer bir mercek, yalnız bir dairenin örttüğü yer içbükey dört köşeli bir yıldızdır.
// Karoda: (x, y) köşesindeki yıldız, sağına ve altına uzanan iki mercek.
export function overlapCells(x: number, y: number): readonly Cell[] {
  const prefix = `${x}-${y}`;
  const r = Math.SQRT1_2;
  return [
    // Yıldızın her kenarı, komşu köşedeki dairenin yayıdır.
    shape(`${prefix}-star`, [
      arc(x + 1, y, r, 225, 135),
      arc(x, y + 1, r, 315, 225),
      arc(x - 1, y, r, 45, -45),
      arc(x, y - 1, r, 135, 45),
    ]),
    shape(`${prefix}-h`, [arc(x, y, r, -45, 45), arc(x + 1, y, r, 135, 225)]),
    shape(`${prefix}-v`, [arc(x, y, r, 45, 135), arc(x, y + 1, r, 225, 315)]),
  ];
}

// Balık pulu: altı yarım daire, üstü bir üst sıradaki iki pulun alt yaylarıdır. Merkez (cx, cy), yarıçap 0.5.
function scale(id: string, cx: number, cy: number): Cell {
  return shape(id, [
    arc(cx, cy, 0.5, 180, 0),
    arc(cx + 0.5, cy - 0.5, 0.5, 90, 180),
    arc(cx - 0.5, cy - 0.5, 0.5, 0, 90),
  ]);
}

// Karoda iki pul sırası (her biri yarım birim yüksek); alttaki sıra yarım pul sağa kayar.
export function scalesCells(x: number, y: number): readonly Cell[] {
  return [scale(`${x}-${y}-a`, x + 0.5, y + 0.5), scale(`${x}-${y}-b`, x + 1, y + 1)];
}

// Kemer: karenin alt kenarına oturan yarım daire ve üstündeki ters U. Tek satırlar yarım kare kayar (tuğla dizilişi).
export function archCells(x: number, y: number): readonly Cell[] {
  const left = x + (isOdd(y) ? 0.5 : 0);
  const cx = left + 0.5;
  return [
    // Kubbe iki çeyrek yay: tek yay olsa yolda yalnız iki uç nokta kalırdı.
    shape(`${x}-${y}-dome`, [arc(cx, y + 1, 0.5, 180, 270), arc(cx, y + 1, 0.5, 270, 360)]),
    shape(`${x}-${y}-arch`, [[left, y], [left + 1, y], [left + 1, y + 1], arc(cx, y + 1, 0.5, 360, 180)]),
  ];
}

// y yüksekliğinde soldan sağa giden dalga: önce yukarı, sonra aşağı kabaran iki yarım daire (yarıçap 0.25).
function waveLine(x: number, y: number): Segment[] {
  return [arc(x + 0.25, y, 0.25, 180, 360), arc(x + 0.75, y, 0.25, 180, 0)];
}

// Aynı dalganın sağdan sola giden hali (alt kenar için).
function waveLineBack(x: number, y: number): Segment[] {
  return [arc(x + 0.75, y, 0.25, 0, 180), arc(x + 0.25, y, 0.25, 360, 180)];
}

// Üst üste dalgalı şeritler: karoda iki şerit, her biri yarım birim kalınlığında.
export function wavyCells(x: number, y: number): readonly Cell[] {
  return [
    shape(`${x}-${y}-a`, [...waveLine(x, y), ...waveLineBack(x, y + 0.5)]),
    shape(`${x}-${y}-b`, [...waveLine(x, y + 0.5), ...waveLineBack(x, y + 1)]),
  ];
}
