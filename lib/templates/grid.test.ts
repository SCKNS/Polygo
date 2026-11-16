import { describe, expect, it } from "vitest";
import { cellAt, cellsInRange, getTemplate, TEMPLATES } from "./index";
import { containsPoint } from "./grid";
import { cellCenter } from "./neighbors";

describe("containsPoint", () => {
  const triangle = [[0, 0], [2, 0], [0, 2]] as const;

  it("içteki ve kenardaki noktayı kabul eder", () => {
    expect(containsPoint(triangle, [0.5, 0.5])).toBe(true);
    expect(containsPoint(triangle, [1, 1])).toBe(true); // eğik kenarın üzerinde
    expect(containsPoint(triangle, [0, 0])).toBe(true); // köşe
  });

  it("dıştaki noktayı reddeder", () => {
    expect(containsPoint(triangle, [1.5, 1.5])).toBe(false);
    expect(containsPoint(triangle, [-0.1, 0.5])).toBe(false);
  });
});

describe("cellsInRange", () => {
  it("aralığın sağ ve alt kenarı dahil değil", () => {
    const ids = cellsInRange(getTemplate("square"), { left: -1, top: 0, right: 1, bottom: 1 }).map((cell) => cell.id);
    expect(ids).toEqual(["-1-0", "0-0"]);
  });

  it("boş aralık boş liste verir", () => {
    expect(cellsInRange(getTemplate("square"), { left: 0, top: 0, right: 0, bottom: 0 })).toEqual([]);
  });
});

describe("cellAt", () => {
  // Her hücrenin merkezi o hücreye düşmeli: dokunulan yer doğru hücreyi boyar. Negatif koordinatlar dahil.
  for (const template of TEMPLATES) {
    it(`${template.name}: her hücrenin merkezi o hücreyi bulur`, () => {
      const cells = cellsInRange(template, { left: -2, top: -2, right: 2, bottom: 2 });
      for (const cell of cells) {
        expect(cellAt(template, cellCenter(cell))?.id).toBe(cell.id);
      }
    });
  }

  it("Dörtlü: karenin üst kenarına yakın nokta üst üçgendir", () => {
    expect(cellAt(getTemplate("cross"), [-3.5, 7.1])?.id).toBe("-4-7-top");
  });

  it("kare kenarındaki nokta sağdaki/alttaki kareye düşer", () => {
    expect(cellAt(getTemplate("square"), [1, 1])?.id).toBe("1-1");
  });
});
