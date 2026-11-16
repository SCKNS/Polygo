import type { Fills } from "./paintStore";
import type { Cell, Template } from "./templates";

export type ExportBackground = string | null;

export type ExportArtwork = {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
  readonly filename: string;
};

function cellOrigin(id: string): { col: number; row: number } | null {
  const match = /^(-?\d+)-(-?\d+)(?:-|$)/.exec(id);
  return match ? { col: Number(match[1]), row: Number(match[2]) } : null;
}

// Tuval yalnız görünen hücreleri üretir. İndirme ise kaydırılmış olsa bile bütün boyamayı bulmak için
// hücre kimliğindeki karo koordinatından ilgili karoyu yeniden üretir.
export function paintedCells(template: Template, fills: Fills): Cell[] {
  const wanted = new Set(Object.keys(fills));
  const tiles = new Map<string, { col: number; row: number }>();

  for (const id of wanted) {
    const origin = cellOrigin(id);
    if (origin) tiles.set(`${origin.col},${origin.row}`, origin);
  }

  const cells: Cell[] = [];
  for (const { col, row } of tiles.values()) {
    for (const cell of template.cellsInTile(col, row)) {
      if (wanted.has(cell.id)) cells.push(cell);
    }
  }
  return cells;
}

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
}

function safeFilename(value: string): string {
  const plain = value
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return plain.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "desen";
}

function number(value: number): string {
  return String(Math.round(value * 1e12) / 1e12);
}

// SVG'nin kendi piksel boyutu (uzun kenar). PNG kalitesi ayarından bağımsızdır; dikiş çizgisi bu boyutta 1 pikseldir.
export const SVG_EXPORT_SIZE = 1024;

// Dikiş çizgisinin sivri köşe sınırı (stroke-miterlimit). Dik köşeler (oran √2 ≈ 1,41) sivri kalsın diye 1,5.
export const MITER_LIMIT = 1.5;

export function createExportArtwork(
  template: Template,
  fills: Fills,
  background: ExportBackground,
  longestEdge = 4096,
): ExportArtwork | null {
  const cells = paintedCells(template, fills);
  if (cells.length === 0) return null;

  // 1) Boyalı hücrelerin gerçek sınırları (dünya birimi, 1 = bir kare). points değil bounds: points yayları
  // doğrularla yaklaşık verir ve yayın en dış noktasını kaçırabilir (Kesişen daire'de ~0,00076 birim).
  const minX = Math.min(...cells.map((cell) => cell.bounds.minX));
  const minY = Math.min(...cells.map((cell) => cell.bounds.minY));
  const maxX = Math.max(...cells.map((cell) => cell.bounds.maxX));
  const maxY = Math.max(...cells.map((cell) => cell.bounds.maxY));

  // 2) Dikiş çizgisi: farklı renkli komşular arasındaki saç teli şeffaf çizgileri kapatır. Çıktıda ~1 piksel
  // tutulur; dünya biriminde sabit olsaydı küçük logolarda onlarca piksele çıkıp köşeleri yuvarlardı.
  const seamWidth = Math.max(maxX - minX, maxY - minY) / longestEdge;

  // 3) Çizginin dışa taşan kısmı için her yönde pay. Yarım çizgi yetmez: sivri (miter) köşenin ucu köşe
  // noktasından en fazla MITER_LIMIT × çizgi / 2 uzağa gider (SVG belirtimi). 45° döndürülmüş bir dik köşe
  // eksen yönünde ~0,71 çizgi taşar; yarım çizgi payda kırpılıyordu (Elmas merkezi, Altıgen, Uçurtma...).
  const bleed = (MITER_LIMIT * seamWidth) / 2;
  const padded = {
    x: minX - bleed,
    y: minY - bleed,
    width: maxX - minX + 2 * bleed,
    height: maxY - minY + 2 * bleed,
  };

  // 4) Piksel boyutu. Kısa kenar YUKARI yuvarlanır: viewBox yalnız genişler, paylı alan hiç kırpılmaz.
  // (Kayan nokta artığı uzun kenarı 1 piksel büyütmesin diye küçük bir tolerans çıkarılır.)
  const scale = longestEdge / Math.max(padded.width, padded.height);
  const width = Math.max(1, Math.ceil(padded.width * scale - 1e-6));
  const height = Math.max(1, Math.ceil(padded.height * scale - 1e-6));

  // 5) viewBox piksel oranına tam eşit olur ve paylı alanı ortalar. Oran farklı olsaydı SVG küçülür,
  // uzun logolarda kenarlarda birkaç piksellik şeffaf şerit kalırdı (arka plan renkliyken de).
  const viewWidth = width / scale;
  const viewHeight = height / scale;
  const viewX = padded.x - (viewWidth - padded.width) / 2;
  const viewY = padded.y - (viewHeight - padded.height) / 2;

  // Aynı renkteki komşular tek SVG yolu olarak rasterleşir; aralarındaki ortak kenar bir kez kompozitlenir.
  const pathsByColor = new Map<string, string[]>();
  for (const cell of cells) {
    const color = fills[cell.id];
    if (!color) continue;
    const paths = pathsByColor.get(color) ?? [];
    paths.push(cell.preciseD); // ekran yolu (d) 4 ondalığa yuvarlı; gerçek sınırın dışına düşebilir
    pathsByColor.set(color, paths);
  }

  const backgroundRect = background
    ? `<rect x="${number(viewX)}" y="${number(viewY)}" width="${number(viewWidth)}" height="${number(viewHeight)}" fill="${escapeXml(background)}"/>`
    : "";
  // Köşe birleşimi: yaklaşık 83,6°'den geniş köşeler sivri (miter), daha dar köşeler kesik (bevel); sınır
  // 1 / sin(açı / 2) = MITER_LIMIT. Dolgu çizginin üstüne boyandığı için dar uç da dolgunun kendi sivri
  // ucuyla kalır; çizgi köşeden en fazla 0,75 piksel taşar ve viewBox payı bunu kapsar.
  const paths = [...pathsByColor.entries()]
    .map(([color, data]) => {
      const safeColor = escapeXml(color);
      return `<path d="${data.join("")}" fill="${safeColor}" stroke="${safeColor}" stroke-width="${number(seamWidth)}" stroke-linejoin="miter" stroke-miterlimit="${MITER_LIMIT}" paint-order="stroke fill"/>`;
    })
    .join("");
  const title = `${template.name} deseni`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${number(viewX)} ${number(viewY)} ${number(viewWidth)} ${number(viewHeight)}" preserveAspectRatio="xMidYMid meet"><title>${escapeXml(title)}</title>${backgroundRect}${paths}</svg>`;

  return {
    svg,
    width,
    height,
    filename: `polygo-${safeFilename(template.name)}`,
  };
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(artwork: ExportArtwork): void {
  saveBlob(
    new Blob([artwork.svg], { type: "image/svg+xml;charset=utf-8" }),
    `${artwork.filename}.svg`,
  );
}

export async function downloadPng(artwork: ExportArtwork): Promise<void> {
  const source = URL.createObjectURL(
    new Blob([artwork.svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = artwork.width;
    canvas.height = artwork.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PNG tuvali oluşturulamadı.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, artwork.width, artwork.height);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("PNG dosyası oluşturulamadı.")),
        "image/png",
      ),
    );
    saveBlob(
      blob,
      `${artwork.filename}-${artwork.width}x${artwork.height}.png`,
    );
  } finally {
    URL.revokeObjectURL(source);
  }
}
