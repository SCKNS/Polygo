"use client";

import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "@/lib/camera";
import { useViewStore } from "@/lib/viewStore";

// Yakınlaştırma ekranın ortası çevresinde yapılır; görüşün yeri değişmez.
export function ZoomControls() {
  const zoom = useViewStore((state) => state.camera.zoom);
  const zoomTo = useViewStore((state) => state.zoomTo);
  const percent = Math.round(zoom * 100);
  return (
    <div className="zoom-controls" role="group" aria-label="Yakınlaştırma">
      <button type="button" className="zoom-button" onClick={() => zoomTo(zoom / ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}
        aria-label="Uzaklaştır">
        <span aria-hidden="true">−</span>
      </button>
      <button type="button" className="zoom-level" onClick={() => zoomTo(MIN_ZOOM)} disabled={zoom === MIN_ZOOM}
        aria-label={`Yakınlaştırma yüzde ${percent}. Başa döndürmek için bas.`}>
        {percent}%
      </button>
      <button type="button" className="zoom-button" onClick={() => zoomTo(zoom * ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}
        aria-label="Yakınlaştır">
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
