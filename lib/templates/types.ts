// Köşe noktası: [x, y]. Birim, ızgaradaki bir karenin kenarıdır.
export type Point = readonly [number, number];

// Boyanabilen tek parça. id, boyama kaydında hücreyi bulmak için kalıcıdır.
// Sözleşme: hücre DIŞBÜKEY bir çokgendir (girinti yok). Geometri testleri buna dayanır ve bunu denetler.
// Alanlar readonly: yalnız TypeScript düzeyinde koruma; çalışma zamanında dondurma (Object.freeze) yok.
export type Cell = {
  readonly id: string;
  readonly points: readonly Point[];
};

// Uygulamanın tanıdığı şablon kimlikleri. Yazım hatası derlemede yakalanır.
// Yeni şablon eklerken kimliği buraya da eklemek gerekir (index.ts'teki açıklamaya bakın).
export type TemplateId = "square" | "diagonal" | "cross";

// Şablon: her yöne sınırsız tekrar eden bir desen. Izgaranın her 1×1 karesi aynı biçimde hücrelere bölünür;
// cellsInSquare(x, y) o karenin hücrelerini verir. Hücreler kareden taşmaz, kareyi boşluksuz ve örtüşmesiz doldurur.
export type Template = {
  readonly id: TemplateId;
  readonly name: string;
  readonly cellsInSquare: (x: number, y: number) => readonly Cell[];
};
