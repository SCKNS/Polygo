import { create } from "zustand";
import { DEFAULT_TEMPLATE, type TemplateId } from "./templates";

// Hücre id'si -> renk (#rrggbb). Listede olmayan hücre boştur (şeffaf).
export type Fills = Readonly<Record<string, string>>;

// Geri alma geçmişindeki bir an: hangi şablonda neyin boyalı olduğu. Şablon değiştirmek de geri alınabilsin diye
// şablon kimliği boyamayla birlikte saklanır.
export type Drawing = { readonly templateId: TemplateId; readonly fills: Fills };

// Hazır renkler. Dışa aktarımda (Adım 6) da kullanılacağı için CSS değişkeni değil, düz hex.
export const PRESET_COLORS = ["#1f2230", "#d9482b", "#f2b134", "#2e7d6b", "#3a5ba0", "#8c5e9e", "#9a9384", "#ffffff"];
export const RECENT_LIMIT = 6;
// Geri alma geçmişi sınırsız büyümesin diye.
const HISTORY_LIMIT = 100;

type PaintState = {
  templateId: TemplateId;
  fills: Fills;
  color: string;
  recentColors: string[];
  past: Drawing[];
  future: Drawing[];
  // Süren fırça hareketi: başladığı andaki boyama ve hareketin boyama mı silme mi olduğu.
  stroke: { before: Fills; erase: boolean } | null;
  setColor: (color: string) => void;
  setTemplate: (templateId: TemplateId) => void;
  startStroke: (cellId: string) => void;
  paintCell: (cellId: string) => void;
  endStroke: () => void;
  cancelStroke: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

// Renk girdisini tek biçime getirir (#ABC, #aabbcc -> #aabbcc). Geçersizse null.
export function normalizeColor(value: string): string | null {
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) return "#" + [...hex.slice(1)].map((c) => c + c).join("");
  return null;
}

// Rengi listenin başına alır, tekrarı siler, sınırı aşanı atar.
export function pushRecent(recent: readonly string[], color: string): string[] {
  return [color, ...recent.filter((item) => item !== color)].slice(0, RECENT_LIMIT);
}

function withCell(fills: Fills, cellId: string, color: string | null): Fills {
  if (color === null) {
    if (!(cellId in fills)) return fills;
    const next = { ...fills };
    delete next[cellId];
    return next;
  }
  return fills[cellId] === color ? fills : { ...fills, [cellId]: color };
}

function withHistory(past: Drawing[], drawing: Drawing): Drawing[] {
  return [...past, drawing].slice(-HISTORY_LIMIT);
}

export const usePaintStore = create<PaintState>()((set, get) => ({
  templateId: DEFAULT_TEMPLATE.id,
  fills: {},
  color: PRESET_COLORS[0],
  recentColors: [],
  past: [],
  future: [],
  stroke: null,

  setColor: (value) => {
    const color = normalizeColor(value);
    if (color) set({ color });
  },

  // Hücre id'leri şablona özgüdür; başka şablonda anlamı yoktur. Bu yüzden şablon değişince tuval boşalır.
  // Boş değilse bu bir geri alma adımıdır: geri al, önceki şablonu boyamasıyla birlikte geri getirir. Bu yüzden onay sorulmaz.
  setTemplate: (templateId) => {
    const { stroke, fills, past, templateId: current } = get();
    if (stroke || templateId === current) return;
    if (Object.keys(fills).length === 0) {
      set({ templateId });
      return;
    }
    set({ templateId, fills: {}, past: withHistory(past, { templateId: current, fills }), future: [] });
  },

  // Dokunulan ilk hücre zaten bu renkteyse hareket silgi olur: aynı renge tekrar dokunmak boşaltır.
  startStroke: (cellId) => {
    const { fills, color } = get();
    set({ stroke: { before: fills, erase: fills[cellId] === color } });
    get().paintCell(cellId);
  },

  paintCell: (cellId) => {
    const { stroke, fills, color } = get();
    if (!stroke) return;
    set({ fills: withCell(fills, cellId, stroke.erase ? null : color) });
  },

  // Bir sürükleme tek bir geri alma adımıdır. Hiçbir şey değişmediyse geçmişe yazılmaz.
  endStroke: () => {
    const { stroke, fills, past, recentColors, color, templateId } = get();
    if (!stroke) return;
    if (fills === stroke.before) {
      set({ stroke: null });
      return;
    }
    set({
      stroke: null,
      past: withHistory(past, { templateId, fills: stroke.before }),
      future: [],
      recentColors: stroke.erase ? recentColors : pushRecent(recentColors, color),
    });
  },

  // İki parmakla yakınlaştırma başlarsa ilk parmağın boyadığı geri alınır; geçmişe iz bırakmaz.
  cancelStroke: () => {
    const { stroke } = get();
    if (stroke) set({ fills: stroke.before, stroke: null });
  },

  undo: () => {
    const { past, fills, future, stroke, templateId } = get();
    if (stroke || past.length === 0) return;
    const previous = past[past.length - 1];
    set({ ...previous, past: past.slice(0, -1), future: [{ templateId, fills }, ...future] });
  },

  redo: () => {
    const { past, fills, future, stroke, templateId } = get();
    if (stroke || future.length === 0) return;
    set({ ...future[0], past: withHistory(past, { templateId, fills }), future: future.slice(1) });
  },

  // Temizlemek de geri alınabilir; bu yüzden onay sorulmaz.
  clear: () => {
    const { fills, past, stroke, templateId } = get();
    if (stroke || Object.keys(fills).length === 0) return;
    set({ fills: {}, past: withHistory(past, { templateId, fills }), future: [] });
  },
}));
