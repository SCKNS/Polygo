import type { Point, SquareRange } from "./templates";

// Kamera: ekranın ortasındaki dünya noktası (x, y; birim = bir kare kenarı) ve yakınlaştırma.
// Yakınlaştırma 1 iken bir kare UNIT_PX piksel görünür.
export type Camera = { readonly x: number; readonly y: number; readonly zoom: number };
// Tuvalin ekrandaki boyutu (piksel).
export type Size = { readonly width: number; readonly height: number };
// Tuvalin sol üst köşesine göre piksel konumu.
export type ScreenPoint = { readonly x: number; readonly y: number };

export const UNIT_PX = 40;
// 40px'lik kare masaüstünde rahat; Dörtlü üçgenlerinde parmak hedefi (≥44px) için ~%265 gerekir.
// En küçük değer 1: daha uzakta 4K ekranda on binlerce hücre üretilir (çizgi yolu çok büyür).
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 1.5;
// Görünür aralık bu kadar karenin katlarına yuvarlanır: kaydırırken hücre listesi her karede değil, ara sıra yeniden üretilir.
const RANGE_CHUNK = 4;

export const START_CAMERA: Camera = { x: 0, y: 0, zoom: MIN_ZOOM };

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom * 100) / 100));
}

function pixelsPerUnit(camera: Camera): number {
  return UNIT_PX * camera.zoom;
}

export function toWorld(camera: Camera, size: Size, point: ScreenPoint): Point {
  const scale = pixelsPerUnit(camera);
  return [camera.x + (point.x - size.width / 2) / scale, camera.y + (point.y - size.height / 2) / scale];
}

export function toScreen(camera: Camera, size: Size, [x, y]: Point): ScreenPoint {
  const scale = pixelsPerUnit(camera);
  return { x: (x - camera.x) * scale + size.width / 2, y: (y - camera.y) * scale + size.height / 2 };
}

// Yakınlaştırmayı değiştirir; ekranda `from` noktasının altındaki dünya noktası `to` noktasına gelir.
// from = to: o nokta yerinde kalır (fare tekeri). from ≠ to: iki parmak aynı anda hem yakınlaştırır hem kaydırır.
export function zoomCamera(camera: Camera, size: Size, nextZoom: number, from: ScreenPoint, to: ScreenPoint): Camera {
  const [worldX, worldY] = toWorld(camera, size, from);
  const zoom = clampZoom(nextZoom);
  const scale = UNIT_PX * zoom;
  return { zoom, x: worldX - (to.x - size.width / 2) / scale, y: worldY - (to.y - size.height / 2) / scale };
}

// Görüşü ekran pikseli kadar kaydırır (dx > 0: sağa bakar, içerik sola kayar).
export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  const scale = pixelsPerUnit(camera);
  return { ...camera, x: camera.x + dx / scale, y: camera.y + dy / scale };
}

// Ekranda görünen (kısmen de olsa) kareleri kapsayan aralık, RANGE_CHUNK katlarına genişletilmiş.
export function visibleRange(camera: Camera, size: Size): SquareRange {
  const [left, top] = toWorld(camera, size, { x: 0, y: 0 });
  const [right, bottom] = toWorld(camera, size, { x: size.width, y: size.height });
  return {
    left: Math.floor(left / RANGE_CHUNK) * RANGE_CHUNK,
    top: Math.floor(top / RANGE_CHUNK) * RANGE_CHUNK,
    right: Math.ceil(right / RANGE_CHUNK) * RANGE_CHUNK,
    bottom: Math.ceil(bottom / RANGE_CHUNK) * RANGE_CHUNK,
  };
}

// SVG viewBox: görünen dünya dikdörtgeni "sol üst genişlik yükseklik".
export function toViewBox(camera: Camera, size: Size): string {
  const scale = pixelsPerUnit(camera);
  const [left, top] = toWorld(camera, size, { x: 0, y: 0 });
  return `${left} ${top} ${size.width / scale} ${size.height / scale}`;
}
