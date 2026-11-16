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

// Şablon: tuvalin genişliği/yüksekliği (birim) ve hücrelerin listesi.
export type Template = {
  readonly id: TemplateId;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly cells: readonly Cell[];
};
