import type { Cell, Point } from "./types";

// Hücre sınırının bir parçası: ya bir köşe noktası (oraya düz çizgi) ya da bir yay.
// Yay, merkezi ve yarıçapı verilen dairenin from açısından to açısına giden parçasıdır.
// Açılar derecedir ve ekran yönündedir: 0° sağ, 90° aşağı (SVG'de y aşağı doğru artar).
export type Arc = { readonly center: Point; readonly r: number; readonly from: number; readonly to: number };
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
  const segments = Math.max(1, Math.round((Math.abs(to - from) / ARC_STEP_DEG) * Math.max(1, r * 2)));
  return Array.from({ length: segments + 1 }, (_, i) => pointOnArc(arc, from + ((to - from) * i) / segments));
}

function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

// Ekran için 4 ondalık yeter (%400'de bir birim 160px: 0.0001 birim = 0.016px); SVG metni de kısalır.
function round(value: number): number {
  return Math.round(value * 1e4) / 1e4;
}

function xy([x, y]: Point): string {
  return `${round(x)} ${round(y)}`;
}

// SVG yay komutu. Açı artıyorsa ekranda saat yönündedir (sweep 1). 180°'den büyük yaylar iki parçaya bölünür
// (tam daire tek komutla çizilemez).
function arcCommands(arc: Arc): string {
  const sweep = arc.to > arc.from ? 1 : 0;
  if (Math.abs(arc.to - arc.from) > 180) {
    const middle = (arc.from + arc.to) / 2;
    return arcCommands({ ...arc, to: middle }) + arcCommands({ ...arc, from: middle });
  }
  return `A${round(arc.r)} ${round(arc.r)} 0 0 ${sweep} ${xy(pointOnArc(arc, arc.to))}`;
}

// Parçalardan isabet testi çokgeni: yaylar kısa doğru parçalarına bölünür, art arda tekrar eden köşe atılır.
function toPoints(segments: readonly Segment[]): Point[] {
  const points: Point[] = [];
  for (const segment of segments) {
    for (const point of isArc(segment) ? arcPoints(segment) : [segment]) {
      if (points.length === 0 || !samePoint(points[points.length - 1], point)) points.push(point);
    }
  }
  // Son nokta ilkinin tekrarıysa (tam daire gibi) atılır; çokgen zaten kapalıdır.
  if (points.length > 1 && samePoint(points[0], points[points.length - 1])) points.pop();
  return points;
}

// Parçalardan çizim yolu: düz kenarlar L, yaylar gerçek A komutu.
function toPath(segments: readonly Segment[]): string {
  let d = "";
  let last: Point | null = null;
  for (const segment of segments) {
    const start = isArc(segment) ? pointOnArc(segment, segment.from) : segment;
    if (last === null) d = `M${xy(start)}`;
    else if (!samePoint(last, start)) d += `L${xy(start)}`;
    if (isArc(segment)) d += arcCommands(segment);
    last = isArc(segment) ? pointOnArc(segment, segment.to) : segment;
  }
  return d + "Z";
}

// Parçalardan hücre üretir: d (çizim için gerçek yaylı SVG yolu) ve points (isabet testi ve geometri testleri için çokgen)
// aynı parçalardan çıktığı için birbirini tutar. points ilk kullanıldığında hesaplanır: ekranı dolduran binlerce hücrenin
// yalnız çizgisi gerekir, köşe listesi yalnız dokunulan karonun hücrelerinde gerekir.
export function shape(id: string, segments: readonly Segment[]): Cell {
  let points: Point[] | null = null;
  return {
    id,
    d: toPath(segments),
    get points() {
      points ??= toPoints(segments);
      return points;
    },
  };
}

// Karonun dikey orta çizgisine göre ayna görüntüsü (sol <-> sağ); ox karonun sol kenarı, karo 1 birim genişlikte.
// Yayın açıları da aynalanır: θ -> 180° - θ.
export function mirrorX(segments: readonly Segment[], ox: number): Segment[] {
  return segments.map((segment) => {
    if (!isArc(segment)) return [2 * ox + 1 - segment[0], segment[1]];
    const [cx, cy] = segment.center;
    return { ...segment, center: [2 * ox + 1 - cx, cy], from: 180 - segment.from, to: 180 - segment.to };
  });
}

// Karonun yatay orta çizgisine göre ayna görüntüsü (üst <-> alt); oy karonun üst kenarı. Açılar: θ -> -θ.
export function mirrorY(segments: readonly Segment[], oy: number): Segment[] {
  return segments.map((segment) => {
    if (!isArc(segment)) return [segment[0], 2 * oy + 1 - segment[1]];
    const [cx, cy] = segment.center;
    return { ...segment, center: [cx, 2 * oy + 1 - cy], from: -segment.from, to: -segment.to };
  });
}
