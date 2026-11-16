import type { Bounds, Cell, Point } from "./types";

// Hücre sınırının bir parçası: ya bir köşe noktası (oraya düz çizgi) ya da bir yay.
// Yay, merkezi ve yarıçapı verilen dairenin from açısından to açısına giden parçasıdır.
// Açılar derecedir ve ekran yönündedir: 0° sağ, 90° aşağı (SVG'de y aşağı doğru artar).
export type Arc = {
  readonly center: Point;
  readonly r: number;
  readonly from: number;
  readonly to: number;
};
export type Segment = Point | Arc;

// Yaylar bu açı adımıyla kısa doğru parçalarına bölünür (yarıçap 0.5 için çeyrek daire = 12 parça).
// 45°'nin tam katı olduğundan, aynı yayı paylaşan iki hücre aynı köşe noktalarını üretir.
const ARC_STEP_DEG = 7.5;

function isArc(segment: Segment): segment is Arc {
  return "center" in segment;
}

// Kayan nokta artıkları (cos 90° = 6e-17 gibi) komşu hücrelerin köşelerini ayırmasın diye yuvarlanır.
function snap(value: number): number {
  return Math.round(value * 1e12) / 1e12;
}

function pointOnArc({ center: [cx, cy], r }: Arc, deg: number): Point {
  const radians = (deg * Math.PI) / 180;
  return [snap(cx + r * Math.cos(radians)), snap(cy + r * Math.sin(radians))];
}

// Yayın noktaları; iki uç da dahil. Büyük yaylar daha çok parçaya bölünür.
function arcPoints(arc: Arc): Point[] {
  const { r, from, to } = arc;
  const segments = Math.max(
    1,
    Math.round((Math.abs(to - from) / ARC_STEP_DEG) * Math.max(1, r * 2)),
  );
  return Array.from({ length: segments + 1 }, (_, i) =>
    pointOnArc(arc, from + ((to - from) * i) / segments),
  );
}

function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

// Ekran yolu için 4 ondalık yeter (%400'de bir birim 160px: 0.0001 birim = 0.016px); SVG metni de kısalır.
// İndirme yolu 10 ondalıktır: yuvarlanmış köşe gerçek sınırın (bounds) dışına düşüp kırpılmasın.
const SCREEN_DECIMALS = 4;
const EXPORT_DECIMALS = 10;

function round(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function xy([x, y]: Point, decimals: number): string {
  return `${round(x, decimals)} ${round(y, decimals)}`;
}

// SVG yay komutu. Açı artıyorsa ekranda saat yönündedir (sweep 1). 180°'den büyük yaylar iki parçaya bölünür
// (tam daire tek komutla çizilemez).
function arcCommands(arc: Arc, decimals: number): string {
  const sweep = arc.to > arc.from ? 1 : 0;
  if (Math.abs(arc.to - arc.from) > 180) {
    const middle = (arc.from + arc.to) / 2;
    return (
      arcCommands({ ...arc, to: middle }, decimals) +
      arcCommands({ ...arc, from: middle }, decimals)
    );
  }
  const r = round(arc.r, decimals);
  return `A${r} ${r} 0 0 ${sweep} ${xy(pointOnArc(arc, arc.to), decimals)}`;
}

// Parçalardan isabet testi çokgeni: yaylar kısa doğru parçalarına bölünür, art arda tekrar eden köşe atılır.
function toPoints(segments: readonly Segment[]): Point[] {
  const points: Point[] = [];
  for (const segment of segments) {
    for (const point of isArc(segment) ? arcPoints(segment) : [segment]) {
      if (points.length === 0 || !samePoint(points[points.length - 1], point))
        points.push(point);
    }
  }
  // Son nokta ilkinin tekrarıysa (tam daire gibi) atılır; çokgen zaten kapalıdır.
  if (points.length > 1 && samePoint(points[0], points[points.length - 1]))
    points.pop();
  return points;
}

// Parçalardan çizim yolu: düz kenarlar L, yaylar gerçek A komutu.
function toPath(segments: readonly Segment[], decimals: number): string {
  let d = "";
  let last: Point | null = null;
  for (const segment of segments) {
    const start = isArc(segment) ? pointOnArc(segment, segment.from) : segment;
    if (last === null) d = `M${xy(start, decimals)}`;
    else if (!samePoint(last, start)) d += `L${xy(start, decimals)}`;
    if (isArc(segment)) d += arcCommands(segment, decimals);
    last = isArc(segment) ? pointOnArc(segment, segment.to) : segment;
  }
  return d + "Z";
}

// Parçaların gerçek sınır kutusu. Köşeler ve yay uçları yetmez: yay 0°/90°/180°/270° yönünden geçiyorsa en dış noktası
// oradadır (örn. -45°..45° yayının en sağ noktası 0°'dedir). points bu noktaları her zaman içermez, bu hesap içerir.
function toBounds(segments: readonly Segment[]): Bounds {
  const corners: Point[] = [];
  for (const segment of segments) {
    if (!isArc(segment)) {
      corners.push(segment);
      continue;
    }
    const low = Math.min(segment.from, segment.to);
    const high = Math.max(segment.from, segment.to);
    corners.push(pointOnArc(segment, low), pointOnArc(segment, high));
    for (let deg = Math.ceil(low / 90) * 90; deg <= high; deg += 90)
      corners.push(pointOnArc(segment, deg));
  }
  return {
    minX: Math.min(...corners.map(([x]) => x)),
    minY: Math.min(...corners.map(([, y]) => y)),
    maxX: Math.max(...corners.map(([x]) => x)),
    maxY: Math.max(...corners.map(([, y]) => y)),
  };
}

// Parçalardan hücre üretir: d (ekranda çizilen gerçek yaylı SVG yolu), preciseD (aynı yol, indirme için tam hassasiyet),
// points (isabet testi ve geometri testleri için çokgen) ve bounds (indirmede kırpma kutusu) aynı parçalardan çıktığı
// için birbirini tutar. preciseD, points ve bounds ilk kullanıldığında hesaplanır: ekranı dolduran binlerce hücrenin
// yalnız ekran yolu gerekir.
export function shape(id: string, segments: readonly Segment[]): Cell {
  let preciseD: string | null = null;
  let points: Point[] | null = null;
  let bounds: Bounds | null = null;
  return {
    id,
    d: toPath(segments, SCREEN_DECIMALS),
    get preciseD() {
      preciseD ??= toPath(segments, EXPORT_DECIMALS);
      return preciseD;
    },
    get points() {
      points ??= toPoints(segments);
      return points;
    },
    get bounds() {
      bounds ??= toBounds(segments);
      return bounds;
    },
  };
}

// Karonun dikey orta çizgisine göre ayna görüntüsü (sol <-> sağ); ox karonun sol kenarı, karo 1 birim genişlikte.
// Yayın açıları da aynalanır: θ -> 180° - θ.
export function mirrorX(segments: readonly Segment[], ox: number): Segment[] {
  return segments.map((segment) => {
    if (!isArc(segment)) return [2 * ox + 1 - segment[0], segment[1]];
    const [cx, cy] = segment.center;
    return {
      ...segment,
      center: [2 * ox + 1 - cx, cy],
      from: 180 - segment.from,
      to: 180 - segment.to,
    };
  });
}

// Karonun yatay orta çizgisine göre ayna görüntüsü (üst <-> alt); oy karonun üst kenarı. Açılar: θ -> -θ.
export function mirrorY(segments: readonly Segment[], oy: number): Segment[] {
  return segments.map((segment) => {
    if (!isArc(segment)) return [segment[0], 2 * oy + 1 - segment[1]];
    const [cx, cy] = segment.center;
    return {
      ...segment,
      center: [cx, 2 * oy + 1 - cy],
      from: -segment.from,
      to: -segment.to,
    };
  });
}
