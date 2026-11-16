import { describe, expect, it } from "vitest";
import { TEMPLATES, cellsInRange, getTemplate } from "./index";
import { findNeighbor, findNeighborCell, type Direction } from "./neighbors";

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

// Sonlu listede arama (findNeighbor) 8×8'lik bir parçada sınanır: kenarlar ve tam erişim burada anlamlıdır.
const PIECE = { left: 0, top: 0, right: 8, bottom: 8 };

describe("ok tuşlarıyla komşu hücre (sonlu liste)", () => {
  const square = { cells: cellsInRange(getTemplate("square"), PIECE) };

  it("Kare şablonunda bir kare yana / aşağı gider", () => {
    expect(findNeighbor(square.cells, "3-3", "right")).toBe("4-3");
    expect(findNeighbor(square.cells, "3-3", "left")).toBe("2-3");
    expect(findNeighbor(square.cells, "3-3", "up")).toBe("3-2");
    expect(findNeighbor(square.cells, "3-3", "down")).toBe("3-4");
  });

  it("kenarda o yönde hücre yoksa null döner", () => {
    expect(findNeighbor(square.cells, "0-0", "left")).toBeNull();
    expect(findNeighbor(square.cells, "0-0", "up")).toBeNull();
    expect(findNeighbor(square.cells, "7-7", "right")).toBeNull();
  });

  // Klavyeyle her hücreye ulaşılabilmeli: ilk hücreden ok tuşlarıyla gezinerek tüm hücreler bulunur.
  for (const template of TEMPLATES) {
    it(`${template.name} şablonunda her hücreye ok tuşlarıyla ulaşılır`, () => {
      const cells = cellsInRange(template, PIECE);
      const seen = new Set([cells[0].id]);
      const queue = [cells[0].id];
      while (queue.length > 0) {
        const id = queue.shift()!;
        for (const direction of DIRECTIONS) {
          const next = findNeighbor(cells, id, direction);
          if (next && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect(seen.size).toBe(cells.length);
    });
  }
});

describe("ok tuşlarıyla komşu hücre (sınırsız ızgara)", () => {
  const square = getTemplate("square");
  const origin = square.cellsInSquare(0, 0)[0];

  it("kenar yok: 0-0'dan sola ve yukarı negatif koordinata geçilir", () => {
    expect(findNeighborCell(square, origin, "left")?.id).toBe("-1-0");
    expect(findNeighborCell(square, origin, "up")?.id).toBe("0--1");
  });

  // Sınırsız ızgarada kenar yoktur: her hücreden dört yönde de bir komşu bulunmalı.
  for (const template of TEMPLATES) {
    it(`${template.name}: her hücrenin dört yönde de komşusu var`, () => {
      for (const cell of template.cellsInSquare(-1, -1)) {
        for (const direction of DIRECTIONS) {
          expect(findNeighborCell(template, cell, direction), `${cell.id} ${direction}`).not.toBeNull();
        }
      }
    });
  }
});
