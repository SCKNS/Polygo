import { describe, expect, it } from "vitest";
import {
  clampZoom, MAX_ZOOM, MIN_ZOOM, panCamera, toScreen, toViewBox, toWorld, UNIT_PX, visibleRange, zoomCamera,
  type Camera,
} from "./camera";

const SIZE = { width: 800, height: 600 };
const CAMERA: Camera = { x: 2, y: -3, zoom: 1.5 };

describe("kamera", () => {
  it("ekranın ortası kameranın baktığı dünya noktasıdır", () => {
    expect(toWorld(CAMERA, SIZE, { x: 400, y: 300 })).toEqual([2, -3]);
  });

  it("toScreen, toWorld'ün tersidir", () => {
    const point = { x: 123, y: 456 };
    const back = toScreen(CAMERA, SIZE, toWorld(CAMERA, SIZE, point));
    expect(back.x).toBeCloseTo(point.x, 9);
    expect(back.y).toBeCloseTo(point.y, 9);
  });

  it("yakınlaştırma sınırlar içinde kalır", () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
    expect(clampZoom(2.123)).toBe(2.12);
  });

  it("from = to iken imlecin altındaki dünya noktası yerinde kalır", () => {
    const point = { x: 650, y: 120 };
    const before = toWorld(CAMERA, SIZE, point);
    const next = zoomCamera(CAMERA, SIZE, 3, point, point);
    expect(next.zoom).toBe(3);
    const after = toWorld(next, SIZE, point);
    expect(after[0]).toBeCloseTo(before[0], 9);
    expect(after[1]).toBeCloseTo(before[1], 9);
  });

  it("from'un altındaki nokta to'ya taşınır (iki parmakla kaydırma)", () => {
    const from = { x: 100, y: 100 };
    const to = { x: 160, y: 90 };
    const next = zoomCamera(CAMERA, SIZE, CAMERA.zoom, from, to);
    const moved = toWorld(next, SIZE, to);
    const original = toWorld(CAMERA, SIZE, from);
    expect(moved[0]).toBeCloseTo(original[0], 9);
    expect(moved[1]).toBeCloseTo(original[1], 9);
  });

  it("kaydırma ekran pikselini dünya birimine çevirir", () => {
    const next = panCamera(CAMERA, UNIT_PX * CAMERA.zoom, -UNIT_PX * CAMERA.zoom * 2);
    expect(next).toEqual({ x: 3, y: -5, zoom: 1.5 });
  });

  it("görünür aralık ekranın tamamını kapsar ve 4'ün katlarına yuvarlanır", () => {
    const range = visibleRange(CAMERA, SIZE);
    const [left, top] = toWorld(CAMERA, SIZE, { x: 0, y: 0 });
    const [right, bottom] = toWorld(CAMERA, SIZE, { x: SIZE.width, y: SIZE.height });
    expect(range.left).toBeLessThanOrEqual(left);
    expect(range.top).toBeLessThanOrEqual(top);
    expect(range.right).toBeGreaterThanOrEqual(right);
    expect(range.bottom).toBeGreaterThanOrEqual(bottom);
    for (const edge of Object.values(range)) expect(Math.abs(edge % 4)).toBe(0);
  });

  it("viewBox görünen dünya dikdörtgenidir", () => {
    const scale = UNIT_PX * CAMERA.zoom;
    expect(toViewBox(CAMERA, SIZE)).toBe(`${2 - 400 / scale} ${-3 - 300 / scale} ${800 / scale} ${600 / scale}`);
  });
});
