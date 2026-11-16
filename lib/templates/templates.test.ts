import { describe, expect, it } from "vitest";
import { cellCenter, cellsInTiles, getTemplate, TEMPLATES, type Cell, type Point, type TemplateId } from "./index";
import { containsPoint } from "./grid";

// Kayan nokta hataları için tolerans. Testler örneklemesizdir: her köşe ve kenar hesaplanır.
const EPSILON = 1e-9;

// i. köşeden bir sonrakine giden kenar.
function edgeAt(points: readonly Point[], i: number): [Point, Point] {
  return [points[i], points[(i + 1) % points.length]];
}

// Çokgen alanı (shoelace formülü). İşaret, köşelerin dönüş yönünü verir.
function signedArea(points: readonly Point[]): number {
  let sum = 0;
  points.forEach((_, i) => {
    const [[x1, y1], [x2, y2]] = edgeAt(points, i);
    sum += x1 * y2 - x2 * y1;
  });
  return sum / 2;
}

// p noktası, a-b doğrusunun hangi yanında? (+ / - / ~0 aynı doğru üzerinde)
function orientation([ax, ay]: Point, [bx, by]: Point, [px, py]: Point): number {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

// p noktası a-b doğru parçasının üzerinde mi (uçlar dahil, toleranslı)?
function onSegment(p: Point, a: Point, b: Point): boolean {
  return (
    Math.abs(orientation(a, b, p)) <= EPSILON &&
    p[0] >= Math.min(a[0], b[0]) - EPSILON &&
    p[0] <= Math.max(a[0], b[0]) + EPSILON &&
    p[1] >= Math.min(a[1], b[1]) - EPSILON &&
    p[1] <= Math.max(a[1], b[1]) + EPSILON
  );
}

// İki doğru parçası birbirini tam ortadan kesiyor mu (değme ve üst üste binme sayılmaz)?
function segmentsCross([a1, a2]: [Point, Point], [b1, b2]: [Point, Point]): boolean {
  const d1 = orientation(b1, b2, a1);
  const d2 = orientation(b1, b2, a2);
  const d3 = orientation(a1, a2, b1);
  const d4 = orientation(a1, a2, b2);
  return (
    ((d1 > EPSILON && d2 < -EPSILON) || (d1 < -EPSILON && d2 > EPSILON)) &&
    ((d3 > EPSILON && d4 < -EPSILON) || (d3 < -EPSILON && d4 > EPSILON))
  );
}

// İki doğru parçası kesişiyor ya da birbirine değiyor mu?
function segmentsTouch(a: [Point, Point], b: [Point, Point]): boolean {
  return segmentsCross(a, b) || onSegment(a[0], ...b) || onSegment(a[1], ...b) || onSegment(b[0], ...a) || onSegment(b[1], ...a);
}

// Basit çokgen mi? Komşu olmayan hiçbir kenar çifti kesişmemeli ya da değmemeli.
function isSimple(points: readonly Point[]): boolean {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // ilk ve son kenar komşudur
      if (segmentsTouch(edgeAt(points, i), edgeAt(points, j))) return false;
    }
  }
  return true;
}

// Nokta çokgenin kenarında mı?
function onBoundary(points: readonly Point[], p: Point): boolean {
  return points.some((_, i) => onSegment(p, ...edgeAt(points, i)));
}

// Nokta çokgenin içinde ve kenarından uzakta mı?
function strictlyInside(points: readonly Point[], p: Point): boolean {
  return containsPoint(points, p) && !onBoundary(points, p);
}

// a'nın b'nin içine düşüp düşmediği sınanacak noktaları: köşeler, kenar ortaları ve ağırlık merkezi.
function probePoints(points: readonly Point[]): Point[] {
  const midpoints = points.map((_, i) => {
    const [[x1, y1], [x2, y2]] = edgeAt(points, i);
    return [(x1 + x2) / 2, (y1 + y2) / 2] as Point;
  });
  return [...points, ...midpoints, cellCenter({ points })];
}

// İki basit çokgenin (içbükey de olabilir) İÇLERİ kesişiyor mu?
// Kenarlar birbirini kesiyorsa ya da birinin köşesi / kenar ortası / merkezi diğerinin tam içindeyse kesişir.
// Kenar paylaşan ya da yalnız değen çokgenler kesişmiş sayılmaz. Bu şablonlardaki hücreler için yeterli bir sınamadır
// (her hücrede merkez de denendiği için birbirinin aynısı olan iki hücre de yakalanır).
function interiorsOverlap(a: readonly Point[], b: readonly Point[]): boolean {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (segmentsCross(edgeAt(a, i), edgeAt(b, j))) return true;
    }
  }
  return probePoints(a).some((p) => strictlyInside(b, p)) || probePoints(b).some((p) => strictlyInside(a, p));
}

// Karo başına beklenen hücre sayıları sabit: bir değişiklik id'leri/kayıtları bozarsa test kırılır.
// Record<TemplateId, ...>: yeni şablon kimliği eklenip burası unutulursa TypeScript hata verir.
const EXPECTED_CELLS_PER_TILE: Record<TemplateId, number> = {
  square: 1,
  pixel: 4,
  diagonal: 2,
  zigzag: 2,
  cross: 4,
  eightSlice: 8,
  diamond: 5,
  octagon: 5,
  pinwheel: 4,
  frame: 5,
  star4: 5,
  star8: 9,
  circle: 5,
  clover: 12,
  leaf: 3,
  flower: 3,
  wave: 3,
  truchet: 3,
  ring: 3,
  fan: 4,
  overlap: 3,
  scales: 2,
  arch: 2,
  wavy: 2,
  brick: 2,
  stair: 4,
  basket: 2,
  parquet: 5,
  herringbone: 8,
  pythagorean: 10,
  triangle: 4,
  fineTriangle: 16,
  triakis: 12,
  hexagon: 2,
  kite: 12,
  hexRing: 14,
  cube: 6,
  mixedCube: 6,
  fineHex: 24,
  trihex: 6,
  rhombi: 12,
  squareTriangle: 6,
};

// Izgara sınırsız; geometri, negatif koordinatları da içeren sonlu bir bölgede denetlenir.
const REGION = { left: -3, top: -3, right: 3, bottom: 3 };
// Örtüşme, bu iki karonun hücreleri ile bölgedeki bütün hücreler arasında sınanır. Hücreler en fazla bir karo
// taştığından, bu karoların hücrelerine değebilecek her hücre bölgenin içindedir.
const CHECKED_TILES: [number, number][] = [[0, 0], [-1, -1]];

for (const template of TEMPLATES) {
  describe(`${template.name} şablonu`, () => {
    const { width, height } = template.tile;
    const cells = cellsInTiles(template, REGION);

    it("her karoda beklenen sayıda hücre var", () => {
      expect(template.cellsInTile(0, 0).length).toBe(EXPECTED_CELLS_PER_TILE[template.id]);
    });

    it("hücre id'leri bölgede benzersiz (negatif koordinatlar dahil)", () => {
      const ids = cells.map((cell) => cell.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    // id karo koordinatıyla başlar: boyama kaydı, hücre ekranda nerede çizilirse çizilsin aynı hücreyi bulur.
    it("id'ler karonun koordinatıyla başlar", () => {
      for (const cell of template.cellsInTile(-2, 5)) {
        expect(cell.id === "-2-5" || cell.id.startsWith("-2-5-"), cell.id).toBe(true);
      }
    });

    it("her hücre basit bir çokgen, merkezi kendi içinde ve karosundan en fazla bir karo taşıyor", () => {
      for (let row = REGION.top; row < REGION.bottom; row++) {
        for (let col = REGION.left; col < REGION.right; col++) {
          for (const cell of template.cellsInTile(col, row)) {
            expect(cell.points.length, cell.id).toBeGreaterThanOrEqual(3);
            // Art arda iki köşe aynı olmamalı (sıfır uzunlukta kenar).
            cell.points.forEach((_, i) => {
              const [[x1, y1], [x2, y2]] = edgeAt(cell.points, i);
              expect(Math.hypot(x2 - x1, y2 - y1), cell.id).toBeGreaterThan(EPSILON);
            });
            expect(isSimple(cell.points), cell.id).toBe(true);
            expect(strictlyInside(cell.points, cellCenter(cell)), cell.id).toBe(true);
            for (const [px, py] of cell.points) {
              expect(px, cell.id).toBeGreaterThanOrEqual((col - 1) * width - EPSILON);
              expect(px, cell.id).toBeLessThanOrEqual((col + 2) * width + EPSILON);
              expect(py, cell.id).toBeGreaterThanOrEqual((row - 1) * height - EPSILON);
              expect(py, cell.id).toBeLessThanOrEqual((row + 2) * height + EPSILON);
            }
          }
        }
      }
    });

    it("hiçbir iki hücrenin içi kesişmiyor (örtüşme yok)", () => {
      for (const [col, row] of CHECKED_TILES) {
        for (const cell of template.cellsInTile(col, row)) {
          for (const other of cells) {
            if (other.id === cell.id) continue;
            expect(interiorsOverlap(cell.points, other.points), `${cell.id} / ${other.id}`).toBe(false);
          }
        }
      }
    });

    // Desen karodan karoya tekrar eder: karo başına alan karonun alanına eşitse ve hücreler örtüşmüyorsa boşluk da yoktur.
    it("bir karonun hücre alanları toplamı karonun alanına eşit (boşluk yok)", () => {
      const total = template.cellsInTile(0, 0).reduce((sum, cell) => sum + Math.abs(signedArea(cell.points)), 0);
      expect(total).toBeCloseTo(width * height, 9);
    });
  });
}

// Yardımcıların kendisi de sınanır: yanlış bir yardımcı, bozuk şablonu geçirebilir.
describe("geometri yardımcıları", () => {
  const square = (x: number, y: number, size = 1): Point[] => [[x, y], [x + size, y], [x + size, y + size], [x, y + size]];
  // Beş köşeli yıldız: kenarları kendini keser.
  const star: Point[] = [[2, 0], [3.2, 3.6], [0, 1.4], [4, 1.4], [0.8, 3.6]];
  // Kelebek (papyon): kendini kesen dörtgen.
  const bowtie: Point[] = [[0, 0], [1, 1], [1, 0], [0, 1]];
  // İçbükey L biçimi: sağ üstteki 1×1 boşluğa bir kare tam oturur.
  const lShape: Point[] = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [0, 2]];

  it("kare ve içbükey L basit kabul edilir; yıldız ve kelebek reddedilir", () => {
    expect(isSimple(square(0, 0))).toBe(true);
    expect(isSimple(lShape)).toBe(true);
    expect(isSimple(star)).toBe(false);
    expect(isSimple(bowtie)).toBe(false);
  });

  it("kenar paylaşan ya da değen çokgenler örtüşmüş sayılmaz", () => {
    expect(interiorsOverlap(square(0, 0), square(1, 0))).toBe(false);
    expect(interiorsOverlap(square(0, 0), square(1, 1))).toBe(false); // yalnız köşe
    expect(interiorsOverlap(lShape, square(1, 0))).toBe(false); // L'nin girintisine oturan kare
  });

  it("kayık, iç içe, aynı ve artı biçiminde kesişen çokgenler örtüşmüş sayılır", () => {
    expect(interiorsOverlap(square(0, 0), square(0.5, 0.5))).toBe(true);
    expect(interiorsOverlap(square(0, 0, 3), square(1, 1))).toBe(true); // tamamen içinde
    expect(interiorsOverlap(square(0, 0), square(0, 0))).toBe(true); // birebir aynı
    const wide: Point[] = [[0, 1], [3, 1], [3, 2], [0, 2]];
    const tall: Point[] = [[1, 0], [2, 0], [2, 3], [1, 3]];
    expect(interiorsOverlap(wide, tall)).toBe(true); // hiçbir köşe diğerinin içinde değil
    expect(interiorsOverlap(lShape, square(0.5, 0.5))).toBe(true);
  });

  it("içbükey çokgenin girintisindeki nokta dışarıda sayılır", () => {
    expect(containsPoint(lShape, [1.5, 0.5])).toBe(false);
    expect(containsPoint(lShape, [0.5, 1.5])).toBe(true);
  });
});

describe("getTemplate", () => {
  it("kimliğe göre şablonu döndürür", () => {
    expect(getTemplate("cross").name).toBe("Dörtlü");
  });

  it("şablon kimlikleri benzersiz", () => {
    const ids = TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// Yay parçaları kısa doğrulardan oluşur; komşu hücreler aynı yayı aynı köşelerle paylaşmalı, yoksa arada kıl payı boşluk kalır.
describe("yaylı şablonlar", () => {
  function vertexSet(cells: readonly Cell[]): Set<string> {
    return new Set(cells.flatMap((cell) => cell.points.map(([x, y]) => `${x.toFixed(9)},${y.toFixed(9)}`)));
  }

  // Çizilen yol (d) ile isabet testindeki çokgen (points) aynı parçalardan üretilir; yolun her uç noktası çokgenin köşesidir.
  for (const template of TEMPLATES) {
    it(`${template.name}: çizim yolunun uç noktaları hücrenin köşeleri`, () => {
      for (const cell of cellsInTiles(template, { left: -1, top: -1, right: 1, bottom: 1 })) {
        expect(cell.d.startsWith("M") && cell.d.endsWith("Z"), cell.id).toBe(true);
        const ends = [...cell.d.matchAll(/(?:[ML]|A[\d.]+ [\d.]+ 0 [01] [01] )(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
        expect(ends.length, cell.id).toBeGreaterThanOrEqual(3);
        for (const [x, y] of ends) {
          const found = cell.points.some(([px, py]) => Math.abs(px - x) < 1e-4 && Math.abs(py - y) < 1e-4);
          expect(found, `${cell.id}: ${x},${y}`).toBe(true);
        }
      }
    });
  }

  it("yaylı hücreler gerçek yay komutuyla çizilir, düz hücrelerde yay yok", () => {
    expect(getTemplate("circle").cellsInTile(0, 0)[0].d).toContain("A");
    expect(getTemplate("hexagon").cellsInTile(0, 0)[0].d).not.toContain("A");
  });

  it("Daire: köşe parçalarının yay köşeleri dairenin köşeleriyle aynı", () => {
    const [circle, ...corners] = getTemplate("circle").cellsInTile(0, 0);
    const circleVertices = vertexSet([circle]);
    const cornerVertices = [...vertexSet(corners)].filter((key) => !["0.000000000,0.000000000", "1.000000000,0.000000000", "0.000000000,1.000000000", "1.000000000,1.000000000"].includes(key));
    for (const key of cornerVertices) expect(circleVertices.has(key), key).toBe(true);
  });
});
