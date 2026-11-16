import { describe, expect, it } from "vitest";
import { cellsInRange, getTemplate, TEMPLATES, type Point, type SquareRange, type TemplateId } from "./index";

// Kayan nokta hataları için tolerans. Testler toleranslıdır, örneklemesizdir (her köşe/kenar hesaplanır);
// koordinatlar 0.5'in katları olduğundan hesaplar pratikte tam çıkar.
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

// Her köşede dönüş aynı yönde ve sıfırdan belirgin farklı mı? (Tek başına yetmez: yıldız gibi
// kendini kesen çokgenler de bu koşulu sağlar; bu yüzden isSimple ile birlikte kullanılır.)
function turnsConsistently(points: readonly Point[]): boolean {
  const turns = points.map((_, i) => {
    const [[x1, y1], [x2, y2]] = edgeAt(points, i);
    const [x3, y3] = points[(i + 2) % points.length];
    return (x2 - x1) * (y3 - y2) - (y2 - y1) * (x3 - x2);
  });
  return (
    turns.every((turn) => turn > EPSILON) ||
    turns.every((turn) => turn < -EPSILON)
  );
}

// p noktası, a-b doğrusunun hangi yanında? (+ / - / ~0 aynı doğru üzerinde)
function orientation(
  [ax, ay]: Point,
  [bx, by]: Point,
  [px, py]: Point,
): number {
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

// İki doğru parçası kesişiyor ya da birbirine değiyor mu?
function segmentsIntersect(
  [a1, a2]: [Point, Point],
  [b1, b2]: [Point, Point],
): boolean {
  const d1 = orientation(b1, b2, a1);
  const d2 = orientation(b1, b2, a2);
  const d3 = orientation(a1, a2, b1);
  const d4 = orientation(a1, a2, b2);
  const crosses =
    ((d1 > EPSILON && d2 < -EPSILON) || (d1 < -EPSILON && d2 > EPSILON)) &&
    ((d3 > EPSILON && d4 < -EPSILON) || (d3 < -EPSILON && d4 > EPSILON));
  return (
    crosses ||
    onSegment(a1, b1, b2) ||
    onSegment(a2, b1, b2) ||
    onSegment(b1, a1, a2) ||
    onSegment(b2, a1, a2)
  );
}

// Basit çokgen mi? Komşu olmayan hiçbir kenar çifti kesişmemeli ya da değmemeli.
function isSimple(points: readonly Point[]): boolean {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // ilk ve son kenar komşudur
      if (segmentsIntersect(edgeAt(points, i), edgeAt(points, j))) return false;
    }
  }
  return true;
}

// Dışbükey çokgen: basit ve her köşede aynı yöne dönen (toleranslı, örneklemesiz kontrol).
function isConvexPolygon(points: readonly Point[]): boolean {
  return points.length >= 3 && isSimple(points) && turnsConsistently(points);
}

// Çokgenin köşelerini bir eksene izdüşürür; [en küçük, en büyük] döner.
function project(points: readonly Point[], [ax, ay]: Point): [number, number] {
  const values = points.map(([x, y]) => x * ax + y * ay);
  return [Math.min(...values), Math.max(...values)];
}

// İki dışbükey çokgenin İÇLERİ kesişiyor mu? (Ayırıcı eksen teoremi.)
// Herhangi bir kenarın normali üzerinde izdüşümler örtüşmüyorsa (yalnız değiyorsa da) içler ayrıktır.
function interiorsOverlap(a: readonly Point[], b: readonly Point[]): boolean {
  for (const points of [a, b]) {
    for (let i = 0; i < points.length; i++) {
      const [[x1, y1], [x2, y2]] = edgeAt(points, i);
      const normal: Point = [y1 - y2, x2 - x1];
      const [minA, maxA] = project(a, normal);
      const [minB, maxB] = project(b, normal);
      if (maxA <= minB + EPSILON || maxB <= minA + EPSILON) return false;
    }
  }
  return true;
}

// Kare başına beklenen hücre sayıları sabit: bir değişiklik id'leri/kayıtları bozarsa test kırılır.
// Record<TemplateId, ...>: yeni şablon kimliği eklenip burası unutulursa TypeScript hata verir.
const EXPECTED_CELLS_PER_SQUARE: Record<TemplateId, number> = {
  square: 1,
  diagonal: 2,
  cross: 4,
};

// Izgara sınırsız; geometri, negatif koordinatları da içeren sonlu bir bölgede denetlenir.
// Desen her karede aynı olduğundan bu bölgede doğru olan her yerde doğrudur (id'ler hariç: onlar ayrıca sınanır).
const REGION: SquareRange = { left: -3, top: -2, right: 3, bottom: 2 };
const REGION_AREA = (REGION.right - REGION.left) * (REGION.bottom - REGION.top);

for (const template of TEMPLATES) {
  describe(`${template.name} şablonu`, () => {
    const cells = cellsInRange(template, REGION);

    it("her karede beklenen sayıda hücre var", () => {
      expect(template.cellsInSquare(0, 0).length).toBe(EXPECTED_CELLS_PER_SQUARE[template.id]);
      expect(cells.length).toBe(EXPECTED_CELLS_PER_SQUARE[template.id] * REGION_AREA);
    });

    it("hücre id'leri bölgede benzersiz (negatif koordinatlar dahil)", () => {
      const ids = cells.map((cell) => cell.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    // id dünya koordinatıyla başlar: boyama kaydı, hücre ekranda nerede çizilirse çizilsin aynı hücreyi bulur.
    it("id'ler karenin koordinatıyla başlar", () => {
      for (const cell of template.cellsInSquare(-2, 5)) {
        expect(cell.id === "-2-5" || cell.id.startsWith("-2-5-"), cell.id).toBe(true);
      }
    });

    it("her hücre en az 3 köşeli, basit, dışbükey ve kendi karesinin içinde", () => {
      for (let y = REGION.top; y < REGION.bottom; y++) {
        for (let x = REGION.left; x < REGION.right; x++) {
          for (const cell of template.cellsInSquare(x, y)) {
            expect(cell.points.length, cell.id).toBeGreaterThanOrEqual(3);
            expect(isConvexPolygon(cell.points), cell.id).toBe(true);
            for (const [px, py] of cell.points) {
              expect(px, cell.id).toBeGreaterThanOrEqual(x);
              expect(px, cell.id).toBeLessThanOrEqual(x + 1);
              expect(py, cell.id).toBeGreaterThanOrEqual(y);
              expect(py, cell.id).toBeLessThanOrEqual(y + 1);
            }
          }
        }
      }
    });

    it("hiçbir iki hücrenin içi kesişmiyor (örtüşme yok)", () => {
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          expect(
            interiorsOverlap(cells[i].points, cells[j].points),
            `${cells[i].id} / ${cells[j].id}`,
          ).toBe(false);
        }
      }
    });

    // Hücreler karelerinin içinde ve örtüşmesizse, alanlar toplamının bölge alanına eşitliği boşluk olmadığını kanıtlar.
    it("hücre alanlarının toplamı bölge alanına eşit (boşluk yok)", () => {
      const total = cells.reduce((sum, cell) => sum + Math.abs(signedArea(cell.points)), 0);
      expect(total).toBeCloseTo(REGION_AREA, 9);
    });
  });
}

// Yardımcıların kendisi de sınanır: yanlış bir yardımcı, bozuk şablonu geçirebilir.
describe("geometri yardımcıları", () => {
  const square: Point[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  // Beş köşeli yıldız: her köşede aynı yöne döner ama kenarları kendini keser.
  const star: Point[] = [
    [2, 0],
    [3.2, 3.6],
    [0, 1.4],
    [4, 1.4],
    [0.8, 3.6],
  ];
  // Kelebek (papyon): kendini kesen dörtgen.
  const bowtie: Point[] = [
    [0, 0],
    [1, 1],
    [1, 0],
    [0, 1],
  ];
  // İçbükey ok ucu.
  const concave: Point[] = [
    [0, 0],
    [2, 1],
    [0, 2],
    [1, 1],
  ];

  it("kare dışbükey ve basit kabul edilir", () => {
    expect(isConvexPolygon(square)).toBe(true);
  });

  it("yıldız: dönüş testi tek başına kandırılır, basitlik kontrolü reddeder", () => {
    expect(turnsConsistently(star)).toBe(true);
    expect(isSimple(star)).toBe(false);
    expect(isConvexPolygon(star)).toBe(false);
  });

  it("kendini kesen ve içbükey çokgenler reddedilir", () => {
    expect(isConvexPolygon(bowtie)).toBe(false);
    expect(isConvexPolygon(concave)).toBe(false);
  });

  it("dejenere çokgen (tekrarlanan köşe) reddedilir", () => {
    expect(
      isConvexPolygon([
        [0, 0],
        [1, 0],
        [1, 0],
        [0, 1],
      ]),
    ).toBe(false);
  });
});

describe("getTemplate", () => {
  it("kimliğe göre şablonu döndürür", () => {
    expect(getTemplate("cross").name).toBe("Dörtlü");
  });
});
