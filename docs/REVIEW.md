# İnceleme: Adım 2 — şablon veri yapısı + tuvalde ızgara (4. tur)

## Amaç
Şablonları veri olarak tanımlamak (hücre şekli + konumu), ilk 3 şablonu eklemek ve tuvali bu veriden SVG ile çizmek.
Boyama, şablon seçimi ve indirme bu adımda yok. 3. tur, 2. tur denetiminde açık kalan O1, O4, K1, K2, O5 maddelerini ele aldı.
4. tur (bu tur): O1 tam kapanmamıştı — dışbükeylik testi öz-kesişen çokgeni (ör. yıldız) kabul edebiliyordu ve "kesin" iddiası toleranslı hesapla uyuşmuyordu. İkisi düzeltildi. O4 bilerek açık (Adım 3 engeli).

## Değişiklikler (adımın tamamı)
- `lib/templates/types.ts`: `Point`, `Cell`, `Template`, `TemplateId`. Dışa açılan tipler `readonly`. Hücre sözleşmesi: dışbükey çokgen.
- `lib/templates/builders.ts`: `squareCells`, `diagonalCells`, `crossCells` (ortak gezinme `eachSquare`); hepsi `readonly Cell[]` döndürür.
- `lib/templates/index.ts`: `TEMPLATES` (Kare 8×8, Çapraz 8×8, Dörtlü 6×6), `DEFAULT_TEMPLATE`, `getTemplate(id: TemplateId)`, `toPointsAttribute`.
  Yorum: yeni şablon eklemenin 3 adımı.
- `lib/templates/templates.test.ts`: toleranslı, örneklemesiz geometri testleri (aşağıda). 4. turda: `isSimple` (komşu olmayan kenar çiftleri kesişmez/değmez) eklendi; `isConvexPolygon` = basit + tutarlı dönüş. Yardımcılar için negatif testler: yıldız (dönüş testini kandırır, basitlik reddeder), kelebek, içbükey ok ucu, tekrarlanan köşe.
- `components/Canvas.tsx`: şablondan SVG çizimi; viewBox kenar payı (`FRAME_PADDING`) ve geçerlilik sınırı yorumu.
- `components/Notebook.tsx`: `<Canvas template={DEFAULT_TEMPLATE} />`.
- `app/globals.css`: tuval stilleri; çizgi .55 / 1px, çerçeve .7, `fade-in`; not/imleç/hover kaldırıldı.
- `package.json`: `vitest` 5.1.0 (devDependency) ve `"test": "vitest run"`.
- `docs/screenshots/step2-desktop.png`, `docs/screenshots/step2-mobile-375.png` (2. turdan; bu turda görünüm değişmedi).

## 2. tur bulgularına yanıt
| # | Bulgu | Karar | Ne yapıldı |
|---|---|---|---|
| O1 | Boşluk/örtüşme testi örneklemeli; `isInside` dışbükeylik varsayıyor ama sözleşmede yok | Doğru, düzeltildi | Örnekleme testi kaldırıldı. Sözleşme `types.ts`'e yazıldı: hücre dışbükeydir. Testler: (a) her hücre **basit ve dışbükey** (4. tur: öz-kesişme kontrolü eklendi) ve sınır içinde, (b) her hücre çifti için **ayırıcı eksen teoremi** ile içlerin kesişmediği (değme serbest), (c) alan toplamı = tuval alanı. (a)+(b) ile hücreler tuval içinde ayrık; (c) ile kalan alan sıfır → boşluk yok. Bu, örneklemeye dayanmayan, EPSILON toleranslı bir kontroldür (tam aritmetik değil). |
| O4 | Ertelenmiş, kapanmamış | Doğru | Kapandı demiyorum. PROGRESS.md'de **"AÇIK — Adım 3 engeli"** olarak işaretlendi, kabul ölçütü yazıldı (375px'te ~44×44 CSS px etkin alan, komşu hücre boyanmaz, dokunmayla denenir). Yöntem Adım 3 başında kullanıcıyla seçilecek. |
| K1 | "Tek girdi" iddiası yanlış | Doğru, düzeltildi | `index.ts` yorumu 3 adımı yazıyor: `TemplateId` + `TEMPLATES` girdisi + `EXPECTED_CELL_COUNTS`. Sayılar `Record<TemplateId, number>`: kimlik eklenip sayı unutulursa `tsc` hata verir. Kimliği tek kaynaktan türetmek (`as const` + `typeof`) acemi için daha zor okunduğundan seçilmedi. |
| K2 | Builder'lar değiştirilebilir dizi döndürüyor; readonly yalnız tip düzeyi | Doğru, düzeltildi | Builder'lar `readonly Cell[]` döndürüyor. `types.ts` yorumu: koruma yalnız TypeScript düzeyinde, `Object.freeze` yok (gerek görülmedi). |
| O5 | Kenar payı her boyutta yetmez | Doğru | İddia daraltıldı. Yorumda hesap: 1.1px çerçevenin yarısı için birim başına ≥11px gerekir → 8 birimde tuval ≥ ~90px, 6 birimde ≥ ~68px. Mevcut düzende tuval ≥ ~280px. Küçük önizlemeler (Adım 4) ayrıca ele alınacak. |

## Komutlar ve gerçek çıktılar
`npm test` (PowerShell, `C:\Users\sec\Desktop\polygo`):
```
 Test Files  1 passed (1)
      Tests  20 passed (20)
```
(3 şablon × 5 test + 4 yardımcı testi + `getTemplate` = 20.)

4. tur bozma denemesi: Kare hücre köşe sırası `[[x,y],[x+1,y+1],[x+1,y],[x,y+1]]` (kelebek) yapıldı, sonra geri alındı:
```
FAIL  ... > Kare şablonu > her hücre en az 3 köşeli, basit, dışbükey ve tuval sınırları içinde
FAIL  ... > Kare şablonu > hiçbir iki hücrenin içi kesişmiyor (örtüşme yok)
FAIL  ... > Kare şablonu > hücre alanlarının toplamı tuval alanına eşit (boşluk yok)
Tests  3 failed | 17 passed (20)
--- geri alındı
Tests  20 passed (20)
```
Aşağıdaki A/B/C denemeleri 3. turdandır (o zamanki 16 testlik sürümle).

Testin hataları yakaladığını görmek için `builders.ts`'e üç geçici bozma (her biri sonra geri alındı; `builders.ts` diff'inde yalnız `readonly` dönüş tipleri var):
```
=== A: dengeli ince örtüşme+boşluk (Dörtlü: top ve bottom üçgenlerinin tepesi y+0.52)
FAIL  ... > Dörtlü şablonu > hiçbir iki hücrenin içi kesişmiyor (örtüşme yok)
Tests  1 failed | 15 passed (16)
=== B: boşluk (Kare hücre genişliği 0.99)
FAIL  ... > Kare şablonu > hücre alanlarının toplamı tuval alanına eşit (boşluk yok)
Tests  1 failed | 15 passed (16)
=== C: dışbükey olmayan hücre (Çapraz a üçgenine içe dönük köşe)
FAIL  ... > Çapraz şablonu > her hücre en az 3 köşeli, kesin dışbükey ve tuval sınırları içinde   (3. turdaki test adı)
FAIL  ... > Çapraz şablonu > hücre alanlarının toplamı tuval alanına eşit (boşluk yok)
Tests  2 failed | 14 passed (16)
--- geri alındı
      Tests  16 passed (16)
```
A durumunda alan toplamı değişmez (top'un kazandığını bottom kaybeder); yalnızca örtüşme testi yakalar.

`npm run lint`: `eslint .` — uyarı/hata yok. `npx tsc --noEmit`: çıkış kodu 0 (test dosyası `tsconfig` kapsamında).

`npm run build`:
```
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

## Ekran görüntüleri
- Masaüstü 1280×900: `docs/screenshots/step2-desktop.png`
- Mobil 375×812 (2x, iframe yöntemi): `docs/screenshots/step2-mobile-375.png`

Bu turda görünümü etkileyen değişiklik yok (yalnız yorum, tip ve test); görüntüler 2. turdan. Hover/tık ve gerçek telefon **doğrulanmadı**.

## İddialar
1. Yeni şablon eklemek 3 yerde değişiklik ister (`TemplateId`, `TEMPLATES`, `EXPECTED_CELL_COUNTS`); sayıyı unutmak derleme hatası verir.
2. Üç şablonun hücreleri dışbükeydir, tuval içinde kalır, içleri kesişmez ve alan toplamı tuval alanına eşittir → boşluk ve örtüşme yoktur (toleranslı, örneklemesiz kontrol, EPSILON = 1e-9; öz-kesişen hücre reddedilir).
3. Tuvalde etkileşim izlenimi veren öğe yok (not, imleç, hover kaldırıldı).
4. Hücre çizgileri düz renk hesabıyla 3.54:1 kontrastlıdır.
5. Çerçeve, tuval ≥ ~90px (8 birim) / ≥ ~68px (6 birim) olduğu sürece viewBox içinde kalır; mevcut düzende tuval ≥ ~280px.
6. Ortak kenarlar koyulaşmaz (saydamlık grupta); çizgi kalınlığı ölçekten bağımsızdır.
7. `prefers-reduced-motion` açıkken animasyon kapanır; çizgiler .55, çerçeve .7 opaklıkta.
8. Şablon verisi TypeScript düzeyinde değiştirilemez (builder dönüşleri dahil); çalışma zamanı dondurma yok.

## Şüpheler
- O4 açık: mobilde küçük üçgenlere isabet çözülmedi; Adım 3 başlamadan yöntem seçilmeli.
- Geometri testi dışbükey hücreler içindir. İleride içbükey (ör. L biçimli) hücre gerekirse sözleşme ve örtüşme testi değişmeli (o hücre dışbükey parçalara bölünebilir).
- EPSILON = 1e-9: koordinatlar 0.5'in katı olduğu sürece hesaplar tamdır; çok küçük kesirli koordinatlarda 1e-9'dan ince örtüşme teorik olarak kaçabilir.
- Örtüşme testi tüm hücre çiftlerini dener (Dörtlü'de ~10 bin çift); şu an ~100 ms. Çok büyük şablonlarda (binlerce hücre) yavaşlayabilir.
- Kontrast 3.54:1 düz renk hesabıdır; 1px çizgide kenar yumuşatma gerçek pikseli biraz açabilir, piksel ölçümü yapılmadı.
- Vitest Windows'ta küçük harfli `c:\` yolundan çalıştırılınca "reading 'config'" hatası veriyor; büyük `C:\` ile geçiyor. CI/Vercel etkilenmez.
- `npm audit`: 7 orta seviye (geliştirme araçları, minimatch); `npm audit --omit=dev` 0 (denetçinin bulgusu).
- Hücreler henüz klavyeyle odaklanamıyor; Adım 3 konusu.

## Karar notları
- Örneklemesiz örtüşme kontrolü için kütüphane eklenmedi: ayırıcı eksen teoremi dışbükey çokgenlerde ~15 satır ve okunur.
- `TemplateId` elle yazılmış union olarak kaldı; tek kaynaktan türetme yerine 3 adım belgelendi ve unutulan sayı tsc ile yakalanıyor.
- Kenar payı sabit bırakıldı, geçerlilik sınırı yorumda hesaplandı; minimum genişlik zorlaması eklenmedi (mevcut düzende gereksiz).

## Nasıl kontrol ederim
1. PowerShell'de `C:\Users\sec\Desktop\polygo` (büyük C) içinde: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. Testin hassasiyeti için `lib/templates/builders.ts`'te `crossCells` içindeki top ve bottom üçgenlerinin `center`'ını `[x + 0.5, y + 0.52]` yapın → yalnız örtüşme testi düşmeli. Geri alın.
3. `npm run dev` → http://localhost:3000: 8×8 ızgara, belirgin çizgiler, kesintisiz çerçeve, not/hover yok.
4. DevTools ~375px: yatay kaydırma yok.
