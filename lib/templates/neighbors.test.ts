import { describe, expect, it } from "vitest";
import { TEMPLATES, getTemplate } from "./index";
import { findNeighbor, type Direction } from "./neighbors";

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

describe("ok tuşlarıyla komşu hücre", () => {
  const square = getTemplate("square");

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
      const seen = new Set([template.cells[0].id]);
      const queue = [template.cells[0].id];
      while (queue.length > 0) {
        const id = queue.shift()!;
        for (const direction of DIRECTIONS) {
          const next = findNeighbor(template.cells, id, direction);
          if (next && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect(seen.size).toBe(template.cells.length);
    });
  }
});
