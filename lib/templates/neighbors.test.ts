import { describe, expect, it } from "vitest";
import { TEMPLATES, cellsInTiles, getTemplate } from "./index";
import { findNeighbor, findNeighborCell, type Direction } from "./neighbors";

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];
const ALL_DIRECTIONS: Direction[] = [...DIRECTIONS, "upLeft", "upRight", "downLeft", "downRight"];

// Sonlu listede ilk hücreden verilen yönlerle gezinerek ulaşılan hücreler.
function reachable(cells: readonly { id: string }[], find: (id: string, direction: Direction) => string | null, directions: Direction[]) {
  const seen = new Set([cells[0].id]);
  const queue = [cells[0].id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const direction of directions) {
      const next = find(id, direction);
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

// Sonlu listede arama (findNeighbor) 8×8'lik bir parçada sınanır: kenarlar ve tam erişim burada anlamlıdır.
const PIECE = { left: 0, top: 0, right: 8, bottom: 8 };
const SMALL_PIECE = { left: 0, top: 0, right: 4, bottom: 4 };

describe("ok tuşlarıyla komşu hücre (sonlu liste)", () => {
  const square = { cells: cellsInTiles(getTemplate("square"), PIECE) };

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

  // Klavyeyle her hücreye ulaşılabilmeli: ilk hücreden ok ve çapraz tuşlarıyla gezinerek tüm hücreler bulunur.
  for (const template of TEMPLATES) {
    it(`${template.name} şablonunda her hücreye ok + çapraz tuşlarıyla ulaşılır`, () => {
      // Karo başına çok hücreli şablonlarda (Yonca, İnce üçgen...) parça küçülür: arama her hücre için bütün listeyi
      // taradığından 8×8 karoluk parça binlerce hücreyle saniyeler sürer.
      const crowded = template.cellsInTile(0, 0).length > 8;
      const cells = cellsInTiles(template, crowded ? SMALL_PIECE : PIECE);
      const seen = reachable(cells, (id, direction) => findNeighbor(cells, id, direction), ALL_DIRECTIONS);
      expect(seen.size).toBe(cells.length);
    });
  }

  // Basit şablonlarda çapraz tuşlar gerekmez: dört ok yeter.
  for (const id of ["square", "diagonal", "cross", "triangle", "hexagon"] as const) {
    it(`${getTemplate(id).name} şablonunda dört ok tuşu yeter`, () => {
      const cells = cellsInTiles(getTemplate(id), PIECE);
      const seen = reachable(cells, (cellId, direction) => findNeighbor(cells, cellId, direction), DIRECTIONS);
      expect(seen.size).toBe(cells.length);
    });
  }
});

describe("ok tuşlarıyla komşu hücre (sınırsız ızgara)", () => {
  const square = getTemplate("square");
  const origin = square.cellsInTile(0, 0)[0];

  it("kenar yok: 0-0'dan sola ve yukarı negatif koordinata geçilir", () => {
    expect(findNeighborCell(square, origin, "left")?.id).toBe("-1-0");
    expect(findNeighborCell(square, origin, "up")?.id).toBe("0--1");
  });

  // Sınırsız ızgarada kenar yoktur: her hücreden dört yönde de bir komşu bulunmalı.
  for (const template of TEMPLATES) {
    it(`${template.name}: her hücrenin dört yönde de komşusu var`, () => {
      for (const cell of template.cellsInTile(-1, -1)) {
        for (const direction of DIRECTIONS) {
          expect(findNeighborCell(template, cell, direction), `${cell.id} ${direction}`).not.toBeNull();
        }
      }
    });
  }
});
