import type { Fills } from "./paintStore";
import type { Cell, Template } from "./templates";

export type ExportBackground = string | null;

export type ExportArtwork = {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
  readonly filename: string;
};

// Komşu hücrelerin ayrı ayrı rasterleştirilmesinden doğan saç teli inceliğindeki şeffaf çizgileri kapatır.
// Dünya biriminde çok küçüktür (%100 yakınlaştırmada 0,4 px) ve viewBox bu taşmayı da kapsar.
export const EXPORT_SEAM_OVERLAP = 0.01;

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
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]!);
}

function safeFilename(value: string): string {
  const plain = value.replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return plain.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "desen";
}

function number(value: number): string {
  return String(Math.round(value * 1e12) / 1e12);
}

export function createExportArtwork(
  template: Template,
  fills: Fills,
  background: ExportBackground,
  longestEdge = 4096,
): ExportArtwork | null {
  const cells = paintedCells(template, fills);
  if (cells.length === 0) return null;

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const cell of cells) {
    for (const [x, y] of cell.points) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  const bleed = EXPORT_SEAM_OVERLAP / 2;
  left -= bleed;
  top -= bleed;
  right += bleed;
  bottom += bleed;
  const worldWidth = right - left;
  const worldHeight = bottom - top;
  const scale = longestEdge / Math.max(worldWidth, worldHeight);
  const width = Math.max(1, Math.round(worldWidth * scale));
  const height = Math.max(1, Math.round(worldHeight * scale));

  // Aynı renkteki komşular tek SVG yolu olarak rasterleşir; aralarındaki ortak kenar bir kez kompozitlenir.
  const pathsByColor = new Map<string, string[]>();
  for (const cell of cells) {
    const color = fills[cell.id];
    if (!color) continue;
    const paths = pathsByColor.get(color) ?? [];
    paths.push(cell.d);
    pathsByColor.set(color, paths);
  }

  const backgroundRect = background
    ? `<rect x="${number(left)}" y="${number(top)}" width="${number(worldWidth)}" height="${number(worldHeight)}" fill="${escapeXml(background)}"/>`
    : "";
  const paths = [...pathsByColor.entries()].map(([color, data]) => {
    const safeColor = escapeXml(color);
    return `<path d="${data.join("")}" fill="${safeColor}" stroke="${safeColor}" stroke-width="${EXPORT_SEAM_OVERLAP}" stroke-linejoin="round" paint-order="stroke fill"/>`;
  }).join("");
  const title = `${template.name} deseni`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${number(left)} ${number(top)} ${number(worldWidth)} ${number(worldHeight)}" preserveAspectRatio="xMidYMid meet"><title>${escapeXml(title)}</title>${backgroundRect}${paths}</svg>`;

  return { svg, width, height, filename: `polygo-${safeFilename(template.name)}` };
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
  saveBlob(new Blob([artwork.svg], { type: "image/svg+xml;charset=utf-8" }), `${artwork.filename}.svg`);
}

export async function downloadPng(artwork: ExportArtwork): Promise<void> {
  const source = URL.createObjectURL(new Blob([artwork.svg], { type: "image/svg+xml;charset=utf-8" }));
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

    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("PNG dosyası oluşturulamadı.")),
      "image/png",
    ));
    saveBlob(blob, `${artwork.filename}-${artwork.width}x${artwork.height}.png`);
  } finally {
    URL.revokeObjectURL(source);
  }
}

