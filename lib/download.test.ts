import { describe, expect, it } from "vitest";
import { createExportArtwork, paintedCells } from "./download";
import { getTemplate } from "./templates";

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
    expect(artwork!.height).toBe(1029);
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

  it("boş çizimde dosya üretmez", () => {
    expect(createExportArtwork(getTemplate("square"), {}, null)).toBeNull();
  });
});
