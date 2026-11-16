// Köşe noktası: [x, y]. Birim, Kare şablonundaki bir karenin kenarıdır (%100 yakınlaştırmada 40px).
export type Point = readonly [number, number];

// Boyanabilen tek parça. id, boyama kaydında hücreyi bulmak için kalıcıdır.
// Sözleşme (templates.test.ts denetler):
// - Hücre BASİT bir çokgendir: kenarları kendini kesmez. İçbükey olabilir (daire çevresindeki parçalar gibi).
// - Hücrenin ağırlık merkezi kendi içindedir (dokunma ve klavye odağı bu noktayı kullanır).
// points: isabet testi ve geometri testleri için çokgen; yaylar kısa doğru parçalarıyla yaklaşık verilir.
// d: ekranda çizilen SVG yolu; yaylar gerçek yay komutudur (A), bu yüzden kısa ve pürüzsüzdür (4 ondalık).
// preciseD: aynı yol 10 ondalıkla; indirilen dosyada kullanılır, böylece çizilen yol bounds ile örtüşür.
// bounds: hücrenin GERÇEK sınır kutusu (yayların tepe noktaları dahil); points yaklaşık olduğundan indirme bunu kullanır.
// Hepsi shape.ts'teki shape() ile aynı parçalardan üretilir. Alanlar readonly: yalnız TypeScript düzeyinde koruma.
export type Cell = {
  readonly id: string;
  readonly points: readonly Point[];
  readonly d: string;
  readonly preciseD: string;
  readonly bounds: Bounds;
};

export type Bounds = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

// Uygulamanın tanıdığı şablon kimlikleri. Yazım hatası derlemede yakalanır.
// Yeni şablon eklerken kimliği buraya da eklemek gerekir (index.ts'teki açıklamaya bakın).
export type TemplateId =
  // Kare, düz kenarlı
  | "square"
  | "pixel"
  | "diagonal"
  | "zigzag"
  | "cross"
  | "eightSlice"
  | "diamond"
  | "octagon"
  | "pinwheel"
  | "frame"
  | "star4"
  | "star8"
  // Yaylı
  | "circle"
  | "clover"
  | "leaf"
  | "flower"
  | "wave"
  | "truchet"
  | "ring"
  | "fan"
  | "overlap"
  | "scales"
  | "arch"
  | "wavy"
  // Taş örgü
  | "brick"
  | "stair"
  | "basket"
  | "parquet"
  | "herringbone"
  | "pythagorean"
  // Üçgen ve altıgen
  | "triangle"
  | "fineTriangle"
  | "triakis"
  | "hexagon"
  | "kite"
  | "hexRing"
  | "cube"
  | "mixedCube"
  | "fineHex"
  | "trihex"
  | "rhombi"
  | "squareTriangle";

// Şablon panelindeki başlıklar. Sıra, paneldeki sıradır (index.ts'teki TEMPLATE_GROUPS).
export type TemplateGroup = "Kare" | "Yay" | "Taş örgü" | "Üçgen ve altıgen";

// Desenin tekrar eden dikdörtgen parçası (karo), dünya biriminde.
export type TileSize = {
  readonly width: number;
  readonly height: number;
};

// Şablon: her yöne sınırsız tekrar eden bir desen. Dünya, tile boyutunda karolara bölünür;
// cellsInTile(col, row) sol üst köşesi (col * width, row * height) olan karoya ait hücreleri verir.
// Bir hücre karosundan en fazla bir karo taşabilir (altıgen, üçgen gibi desenler dikdörtgene sığmaz).
// Bütün karoların hücreleri düzlemi boşluksuz ve örtüşmesiz doldurur.
export type Template = {
  readonly id: TemplateId;
  readonly name: string;
  readonly group: TemplateGroup;
  readonly tile: TileSize;
  readonly cellsInTile: (col: number, row: number) => readonly Cell[];
};
