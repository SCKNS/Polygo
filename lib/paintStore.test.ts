import { beforeEach, describe, expect, it } from "vitest";
import {
  normalizeColor,
  PRESET_COLORS,
  pushRecent,
  RECENT_LIMIT,
  sanitizePersistedState,
  usePaintStore,
} from "./paintStore";

const initialState = usePaintStore.getState();
const store = () => usePaintStore.getState();

// Tek dokunuş: fırçayı başlat ve bitir.
function tap(cellId: string) {
  store().startStroke(cellId);
  store().endStroke();
}

beforeEach(() => {
  usePaintStore.setState(initialState, true);
});

describe("boyama deposu", () => {
  it("dokunulan hücreyi seçili renge boyar", () => {
    store().setColor("#d9482b");
    tap("0-0");
    expect(store().fills).toEqual({ "0-0": "#d9482b" });
  });

  it("bir sürükleme tek geri alma adımıdır", () => {
    store().startStroke("0-0");
    store().paintCell("1-0");
    store().paintCell("2-0");
    store().endStroke();
    expect(Object.keys(store().fills)).toHaveLength(3);
    expect(store().past).toHaveLength(1);
    store().undo();
    expect(store().fills).toEqual({});
  });

  it("aynı renkle boyalı hücreye dokunmak siler; sürüklemede silgi devam eder", () => {
    store().startStroke("0-0");
    store().paintCell("1-0");
    store().endStroke();
    store().startStroke("0-0");
    store().paintCell("1-0");
    store().endStroke();
    expect(store().fills).toEqual({});
  });

  it("farklı renkle boyalı hücreye dokunmak rengini değiştirir", () => {
    tap("0-0");
    store().setColor("#2e7d6b");
    tap("0-0");
    expect(store().fills).toEqual({ "0-0": "#2e7d6b" });
  });

  it("iptal edilen fırça (iki parmak) boyamayı geri koyar ve geçmişe yazılmaz", () => {
    tap("0-0");
    store().startStroke("1-0");
    store().cancelStroke();
    expect(store().fills).toEqual({ "0-0": PRESET_COLORS[0] });
    expect(store().past).toHaveLength(1);
    expect(store().stroke).toBeNull();
  });

  it("hiçbir şey değiştirmeyen fırça geçmişe yazılmaz", () => {
    // Hücre dışında başlayıp hiçbir hücreye değmeyen hareketin karşılığı.
    usePaintStore.setState({ stroke: { before: store().fills, erase: false } });
    store().endStroke();
    expect(store().past).toEqual([]);
    expect(store().stroke).toBeNull();
  });

  it("geri al ve yinele sırayı korur; yeni boyama yineleme geçmişini siler", () => {
    tap("0-0");
    tap("1-0");
    store().undo();
    expect(store().fills).toEqual({ "0-0": PRESET_COLORS[0] });
    store().redo();
    expect(Object.keys(store().fills)).toEqual(["0-0", "1-0"]);
    store().undo();
    tap("2-0");
    expect(store().future).toEqual([]);
  });

  it("boşken geri al / yinele / temizle bir şey yapmaz", () => {
    store().undo();
    store().redo();
    store().clear();
    expect(store().past).toEqual([]);
    expect(store().future).toEqual([]);
  });

  it("temizle tüm hücreleri boşaltır ve geri alınabilir", () => {
    tap("0-0");
    tap("1-0");
    store().clear();
    expect(store().fills).toEqual({});
    store().undo();
    expect(Object.keys(store().fills)).toHaveLength(2);
  });

  it("boyamada kullanılan renk son kullanılanların başına gelir; silme eklemez", () => {
    store().setColor("#d9482b");
    tap("0-0");
    store().setColor("#2e7d6b");
    tap("1-0");
    tap("1-0"); // silme
    expect(store().recentColors).toEqual(["#2e7d6b", "#d9482b"]);
  });

  it("geçersiz renk yok sayılır", () => {
    store().setColor("kırmızı");
    expect(store().color).toBe(PRESET_COLORS[0]);
  });
});

describe("şablon seçimi", () => {
  it("başlangıçta varsayılan şablon seçili", () => {
    expect(store().templateId).toBe("square");
  });

  it("boş tuvalde şablon değiştirmek geçmişe yazılmaz", () => {
    store().setTemplate("hexagon");
    expect(store().templateId).toBe("hexagon");
    expect(store().past).toEqual([]);
  });

  it("boyalı tuvalde şablon değiştirmek tuvali boşaltır; geri al şablonu boyamasıyla geri getirir", () => {
    tap("0-0");
    store().setTemplate("circle");
    expect(store().templateId).toBe("circle");
    expect(store().fills).toEqual({});
    store().undo();
    expect(store().templateId).toBe("square");
    expect(store().fills).toEqual({ "0-0": PRESET_COLORS[0] });
    store().redo();
    expect(store().templateId).toBe("circle");
    expect(store().fills).toEqual({});
  });

  it("geri alma, boyamanın yapıldığı şablona döner", () => {
    store().setTemplate("hexagon");
    tap("0-0-a");
    store().setTemplate("leaf");
    tap("0-0-leaf");
    store().undo(); // yaprak boyaması gider
    store().undo(); // altıgen geri gelir
    expect(store().templateId).toBe("hexagon");
    expect(store().fills).toEqual({ "0-0-a": PRESET_COLORS[0] });
  });

  it("aynı şablonu seçmek ya da fırça sürerken değiştirmek bir şey yapmaz", () => {
    tap("0-0");
    store().setTemplate("square");
    expect(store().past).toHaveLength(1);
    store().startStroke("1-0");
    store().setTemplate("cube");
    expect(store().templateId).toBe("square");
    store().endStroke();
  });
});

describe("renk yardımcıları", () => {
  it("normalizeColor kısa ve büyük harfli hex'i tek biçime getirir", () => {
    expect(normalizeColor("#ABC")).toBe("#aabbcc");
    expect(normalizeColor(" #D9482B ")).toBe("#d9482b");
    expect(normalizeColor("#12345")).toBeNull();
    expect(normalizeColor("red")).toBeNull();
  });

  it("pushRecent tekrarı siler ve sınırı korur", () => {
    const many = [
      "#000001",
      "#000002",
      "#000003",
      "#000004",
      "#000005",
      "#000006",
    ];
    expect(pushRecent(many, "#000003")).toEqual([
      "#000003",
      "#000001",
      "#000002",
      "#000004",
      "#000005",
      "#000006",
    ]);
    expect(pushRecent(many, "#000007")).toHaveLength(RECENT_LIMIT);
    expect(pushRecent(many, "#000007")[0]).toBe("#000007");
  });
});

describe("kalıcı kayıt", () => {
  it("geçerli çizim, şablon ve renk tercihlerini geri yükler", () => {
    expect(
      sanitizePersistedState({
        templateId: "circle",
        fills: { "0-0-center": "#D9482B", "-2--3": "#1F2230" },
        color: "#2E7D6B",
        recentColors: ["#D9482B", "#d9482b", "#fff"],
      }),
    ).toEqual({
      templateId: "circle",
      fills: { "0-0-center": "#d9482b", "-2--3": "#1f2230" },
      color: "#2e7d6b",
      recentColors: ["#d9482b", "#ffffff"],
    });
  });

  it("bozuk veya eski kayıtları güvenli varsayılanlara düşürür", () => {
    expect(
      sanitizePersistedState({
        templateId: "silinmis-sablon",
        fills: { "0-0": "red", "<script>": "#ffffff", "1-2-a": "#abc" },
        color: "bozuk",
        recentColors: [null, "red"],
      }),
    ).toEqual({
      templateId: "square",
      fills: { "1-2-a": "#aabbcc" },
      color: PRESET_COLORS[0],
      recentColors: [],
    });
  });
});
