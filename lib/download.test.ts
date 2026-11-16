import { describe, expect, it } from "vitest";
import type { Fills } from "./paintStore";
import { createExportArtwork, MITER_LIMIT, paintedCells } from "./download";
import { getTemplate, TEMPLATES, type Template } from "./templates";

type Box = { x: number; y: number; width: number; height: number };

function strokeWidthOf(svg: string): number {
  return Number(/stroke-width="([^"]+)"/.exec(svg)![1]);
}

// İndirilen SVG metnindeki yollar (tarayıcının gerçekten çizeceği şey).
function pathsOf(svg: string): string[] {
  return [...svg.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]);
}

// Tarayıcının çizdiği yolun gerçek sınırı. Hücrenin points/bounds verisini KULLANMAZ: d metnini okur, yay
// merkezini SVG belirtimindeki formülle (F.6.5, rx = ry, döndürme yok) bulur ve yayı 2000 noktayla örnekler.
function drawnBounds(paths: readonly string[]): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const d of paths) {
    const tokens = d.match(/[MLAZ]|-?\d*\.?\d+(?:e-?\d+)?/g)!;
    let x = 0;
    let y = 0;
    for (let i = 0; i < tokens.length;) {
      const command = tokens[i++];
      const next = () => Number(tokens[i++]);
      if (command === "M" || command === "L") {
        x = next();
        y = next();
        add(x, y);
      } else if (command === "A") {
        let r = next();
        next(); // ry (= rx)
        next(); // döndürme (0)
        const large = next();
        const sweep = next();
        const x2 = next();
        const y2 = next();
        const hx = (x - x2) / 2;
        const hy = (y - y2) / 2;
        const half = hx * hx + hy * hy;
        r = Math.max(r, Math.sqrt(half)); // yarıçap yetmiyorsa tarayıcı büyütür
        const sign = large === sweep ? -1 : 1;
        const k = sign * Math.sqrt(Math.max(0, (r * r - half) / half));
        const cx = k * hy + (x + x2) / 2;
        const cy = -k * hx + (y + y2) / 2;
        const start = Math.atan2(y - cy, x - cx);
        let delta = Math.atan2(y2 - cy, x2 - cx) - start;
        if (sweep && delta < 0) delta += 2 * Math.PI;
        if (!sweep && delta > 0) delta -= 2 * Math.PI;
        for (let step = 0; step <= 2000; step++) {
          const angle = start + (delta * step) / 2000;
          add(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        x = x2;
        y = y2;
      }
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Test yardımcısı: SVG metninden viewBox'ı ve (varsa) arka plan dikdörtgenini okur.
function parseArtwork(svg: string): { box: Box; rect: Box | null } {
  const [x, y, width, height] = /viewBox="([^"]+)"/
    .exec(svg)![1]
    .split(" ")
    .map(Number);
  const rect =
    /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/.exec(svg);
  return {
    box: { x, y, width, height },
    rect: rect
      ? {
          x: Number(rect[1]),
          y: Number(rect[2]),
          width: Number(rect[3]),
          height: Number(rect[4]),
        }
      : null,
  };
}

describe("dışa aktarma", () => {
  it("görüşten bağımsız olarak negatif koordinattaki boyalı hücreleri yeniden üretir", () => {
    const template = getTemplate("square");
    const fills = { "-2--3": "#d9482b", "4-5": "#1f2230" };
    expect(paintedCells(template, fills).map((cell) => cell.id)).toEqual([
      "-2--3",
      "4-5",
    ]);
  });

  it("yalnız boyalı alanın çevresine kırpar ve şeffaf SVG üretir", () => {
    const artwork = createExportArtwork(
      getTemplate("square"),
      {
        "0-0": "#d9482b",
        "1-0": "#d9482b",
      },
      null,
      2048,
    );

    expect(artwork).not.toBeNull();
    expect(artwork!.width).toBe(2048);
    expect(artwork!.height).toBe(1025);
    expect(artwork!.svg).not.toContain("<rect");
    expect(artwork!.svg.match(/<path /g)).toHaveLength(1);
    expect(artwork!.svg).toContain('d="M0 0L1 0L1 1L0 1ZM1 0L2 0L2 1L1 1Z"');
  });

  it("seçilen arka planı ekler, renkleri ayrı birleşik yollarda tutar", () => {
    const artwork = createExportArtwork(
      getTemplate("square"),
      {
        "0-0": "#d9482b",
        "1-0": "#1f2230",
      },
      "#ffffff",
      1024,
    )!;

    expect(artwork.svg).toContain('<rect x="');
    expect(artwork.svg).toContain('fill="#ffffff"');
    expect(artwork.svg.match(/<path /g)).toHaveLength(2);
  });

  it("dikiş çizgisi küçük ve büyük logoda çıktıda ~1 piksel, birleşimi miter (sınır 1.5)", () => {
    const filledBlock: Fills = Object.fromEntries(
      Array.from({ length: 12 * 8 }, (_, index) => [
        `${index % 12}-${Math.floor(index / 12)}`,
        index % 2 ? "#1f2230" : "#d9482b",
      ]),
    );
    for (const fills of [{ "0-0": "#d9482b" }, filledBlock]) {
      const artwork = createExportArtwork(
        getTemplate("square"),
        fills,
        null,
        4096,
      )!;
      const { box } = parseArtwork(artwork.svg);
      const strokeWidth = Number(
        /stroke-width="([^"]+)"/.exec(artwork.svg)![1],
      );
      expect((strokeWidth * artwork.width) / box.width).toBeCloseTo(1, 2);
      expect(artwork.svg).toContain('stroke-linejoin="miter"');
      expect(artwork.svg).toContain('stroke-miterlimit="1.5"');
    }
  });

  // Her şablonda bir karonun tüm hücreleri birlikte ve her hücre tek başına (bütün dış köşeleri açıkta, 5 karoda)
  // boyanır; 2×1'den 21×1'e uzun alanlar da denenir.
  it("viewBox oranı piksel oranına eşit ve çizilen yolu (yaylar + azami miter taşması) kırpmadan kapsar", () => {
    const cases: [Template, Fills][] = [];
    for (const template of TEMPLATES) {
      const tile = template.cellsInTile(0, 0);
      cases.push([
        template,
        Object.fromEntries(tile.map((cell) => [cell.id, "#d9482b"])),
      ]);
      // Tek hücreler birkaç karoda: bazı şablonlar komşu karoda aynalanır ya da döner (yay açıları değişir).
      for (const [col, row] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [-1, -2],
      ])
        for (const cell of template.cellsInTile(col, row))
          cases.push([template, { [cell.id]: "#d9482b" }]);
    }
    for (const length of [2, 3, 13, 21]) {
      cases.push([
        getTemplate("square"),
        Object.fromEntries(
          Array.from({ length }, (_, index) => [`${index}-0`, "#d9482b"]),
        ),
      ]);
    }

    for (const [template, fills] of cases) {
      for (const size of [1024, 2048, 4096]) {
        const artwork = createExportArtwork(template, fills, "#ffffff", size)!;
        const { box, rect } = parseArtwork(artwork.svg);
        // Çizilen yolun gerçek sınırı (yay tepe noktaları dahil), points'ten bağımsız.
        const drawn = drawnBounds(pathsOf(artwork.svg));
        // Sivri köşenin ucu köşe noktasından en fazla miterlimit × çizgi / 2 uzaktadır (SVG belirtimi).
        const bleed = (MITER_LIMIT * strokeWidthOf(artwork.svg)) / 2;
        const tolerance = 1e-9;
        const name = `${template.id} ${Object.keys(fills).join(",")} @${size}`;

        expect(Math.max(artwork.width, artwork.height)).toBe(size);
        expect(box.width / box.height).toBeCloseTo(
          artwork.width / artwork.height,
          9,
        );
        expect(drawn.x - bleed, name).toBeGreaterThanOrEqual(box.x - tolerance);
        expect(drawn.y - bleed, name).toBeGreaterThanOrEqual(box.y - tolerance);
        expect(drawn.x + drawn.width + bleed, name).toBeLessThanOrEqual(
          box.x + box.width + tolerance,
        );
        expect(drawn.y + drawn.height + bleed, name).toBeLessThanOrEqual(
          box.y + box.height + tolerance,
        );
        // Arka plan dikdörtgeni viewBox'ın tamamını kaplar.
        expect(rect).toEqual(box);
      }
    }
  });

  it("2×1 logoda kısa kenar aşağı değil yukarı yuvarlanır", () => {
    const artwork = createExportArtwork(
      getTemplate("square"),
      { "0-0": "#d9482b", "1-0": "#d9482b" },
      null,
      2048,
    )!;
    // Paylı yükseklik ~1024,85 piksel; 1024'e yuvarlansaydı üst/alt kenardan ~0,43 piksel kırpılırdı.
    expect(artwork.height).toBe(1025);
  });

  it("Kesişen daire merceklerinin yay tepesi tek başına 4096 px indirmede kırpılmaz", () => {
    const template = getTemplate("overlap");
    for (const id of ["0-0-h", "0-0-v"]) {
      const cell = template.cellsInTile(0, 0).find((item) => item.id === id)!;
      // -45°..45° (ya da 45°..135°) yayının tepe noktası 0° (90°) yönündedir, merkezden √2/2 uzakta.
      const apex = Math.SQRT1_2;
      const pointsReach = Math.max(
        ...cell.points.map(([x, y]) => (id.endsWith("h") ? x : y)),
      );
      const boundsReach = id.endsWith("h")
        ? cell.bounds.maxX
        : cell.bounds.maxY;
      expect(pointsReach).toBeLessThan(apex - 5e-4); // points tepeyi kaçırıyor
      expect(boundsReach).toBeCloseTo(apex, 12); // bounds yakalıyor

      const artwork = createExportArtwork(
        template,
        { [id]: "#d9482b" },
        null,
        4096,
      )!;
      const { box } = parseArtwork(artwork.svg);
      const drawn = drawnBounds(pathsOf(artwork.svg));
      const bleed = (MITER_LIMIT * strokeWidthOf(artwork.svg)) / 2;
      if (id.endsWith("h"))
        expect(drawn.x + drawn.width + bleed).toBeLessThanOrEqual(
          box.x + box.width,
        );
      else
        expect(drawn.y + drawn.height + bleed).toBeLessThanOrEqual(
          box.y + box.height,
        );
    }
  });

  it("Elmas merkezinin eksen yönündeki miter uçları viewBox içinde kalır", () => {
    const template = getTemplate("diamond");
    const artwork = createExportArtwork(
      template,
      { "0-0-center": "#d9482b" },
      null,
      1024,
    )!;
    const { box } = parseArtwork(artwork.svg);
    const strokeWidth = strokeWidthOf(artwork.svg);
    // Dik köşenin miter ucu köşeden çizgi / 2 / sin(45°) ≈ 0,707 çizgi uzaktadır; yarım çizgi pay bunu kırpıyordu.
    const tip = strokeWidth / 2 / Math.sin(Math.PI / 4);
    expect(box.y).toBeLessThanOrEqual(0 - tip);
    expect(box.y + box.height).toBeGreaterThanOrEqual(1 + tip);
    expect(box.x).toBeLessThanOrEqual(0 - tip);
    expect(box.x + box.width).toBeGreaterThanOrEqual(1 + tip);
  });

  it("boş çizimde dosya üretmez", () => {
    expect(createExportArtwork(getTemplate("square"), {}, null)).toBeNull();
  });
});
