import { create } from "zustand";
import { clampZoom, START_CAMERA, type Camera } from "./camera";

// Tuvalin kamerası. Tuval (kaydırma, iki parmak, teker) ve adadaki yakınlaştırma düğmeleri aynı kamerayı kullanır.
type ViewState = {
  camera: Camera;
  setCamera: (camera: Camera) => void;
  // Ekranın ortası yerinde kalarak yakınlaştırır (düğmeler ve klavye).
  zoomTo: (zoom: number) => void;
};

export const useViewStore = create<ViewState>()((set, get) => ({
  camera: START_CAMERA,
  setCamera: (camera) => set({ camera }),
  zoomTo: (zoom) => set({ camera: { ...get().camera, zoom: clampZoom(zoom) } }),
}));
