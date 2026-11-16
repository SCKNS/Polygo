# Son sürüm doğrulaması — Adım 8

16 Kasım 2026 tarihinde yerel kaynak üzerinde aşağıdaki kontroller tamamlandı:

- `npm test`: 6 dosya, 476 test geçti.
- `npm run lint`: uyarı ve hata yok.
- `npm run build`: Next.js 16.4.6 production derlemesi ve TypeScript temiz; `/` statik üretildi.
- `scripts/verify-release.mjs`, gerçek Chrome 157 üzerinde geçti: hücre boyama `localStorage`'a yazıldı, tam sayfa yenilemesinden
  sonra geri geldi; tuvalin erişilebilir adı, konum/renk canlı açıklaması ve çizim özeti doğrulandı; gerçek şeffaf SVG ile
  1024×1024 PNG dosyaları indirildi ve dosya içerikleri/imzaları okundu.
- Production dağıtımı `dpl_6WrJ6hs1eLdq5KWrm1HcadqSSnTX` Vercel'de `READY` oldu ve `https://polygo-app.vercel.app`
  alias'ına bağlandı. Deployment Protection arkasından yetkili istekle uygulama HTML'si ve metadata doğrulandı.
- Kayıt yalnız şablon, boyama, seçili renk ve son renkleri saklar. Geri-al/yinele geçmişi ve yarım fırça hareketi saklanmaz.
  Bozuk/eski kayıtlar `sanitizePersistedState` ile doğrulanır ve güvenli varsayılanlara düşer.

## Kalan manuel riskler

- Fiziksel iPhone/Android ile Safari ve Firefox üzerinde son bir kullanıcı kabul turu otomatik Chrome testinin yerini tutmaz.
- Çok yoğun yaylı şablonların gerçek 4K ekrandaki performansı cihazın GPU/CPU gücüne bağlıdır.
- `role="application"` karmaşık tuvalin klavye olaylarını ekran okuyucuya bırakmak için bilerek kullanılır; NVDA/VoiceOver ile
  manuel kullanım testi yayın sonrası izleme maddesidir.

---

# Tarihsel inceleme: Adım 5 — Şablon paleti (42 şablon, gruplu panelden seçim)

## Amaç

Kullanıcı isteği: "Şablonlar artık seçilebilsin; şu an görünen şablonlar yetersiz. Attığım videodaki gibi farklı geometrik
şekillerin birleşiminden oluşan şablonlar lazım." Referans video (`video/`, repoya girmez) kareleri incelendi: koyu bir
uygulama; ızgara daireler + çaprazlar gibi iç içe şekillerden oluşuyor, sağda çok sayıda desen önizlemesi var, hücreler
tek tek boyanıp yonca, damla, "M" gibi logolar çıkıyor. Arayüz kopyalanmadı; desenlerin fikri (daire, yay, altıgen, üçgen
birleşimleri) bizim defter kimliğimizle uygulandı.

Adım ilk hazırlandığında 15 şablon vardı. İnceleme öncesinde kullanıcı: "Bu şablonlar yetmez, yeni ürettiklerin çok güzel olmuş,
bunun 2-3 katı şablon olsun." Bu yüzden aynı adımda şablon sayısı **42**'ye çıktı (27 yeni) ve panel dört gruba ayrıldı.

Önceki model bu desenleri taşıyamıyordu: hücre DIŞBÜKEY çokgen olmak ve 1×1 karesinden taşmamak zorundaydı. Daire
çevresindeki parçalar içbükey, altıgen/üçgen desenleri ise kare ızgaraya sığmıyor. Bu yüzden adımın büyük kısmı modelin
genişletilmesi.

## Şablon listesi (42)

| Grup                  | Şablonlar (yeni olanlar **kalın**)                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kare (12)             | Kare, **Piksel**, Çapraz, **Zikzak**, Dörtlü, **Sekiz dilim**, Elmas, Sekizgen, **Fırıldak**, **Çerçeve**, **Yıldız**, **Sekiz köşe**                              |
| Yay (12)              | Daire, Yonca, Yaprak, **Çiçek**, Dalga, **Kıvrım**, Halka, **Yelpaze**, **Kesişen daire**, **Pul**, **Kemer**, **Dalgalı şerit**                                   |
| Taş örgü (6)          | **Tuğla**, **Merdiven**, **Hasır**, **Parke**, **Balıksırtı**, **İki kare**                                                                                        |
| Üçgen ve altıgen (12) | Üçgen, **Sık üçgen**, **Üç dilim**, Altıgen, **Uçurtma**, **Petek halka**, Küp, **Karışık küp**, **İnce üçgen**, Altıgen + üçgen, **Altıgen + kare**, Kare + üçgen |

Kısa tanımlar: Zikzak = yönü komşu karede değişen çapraz; Fırıldak = merkezden kenar ortasının yanına giden dört kanat;
Yıldız = kenar ortalarına değen 4 köşeli yıldız + köşe uçurtmaları; Sekiz köşe = köşelere ve kenar ortalarına değen 8 köşeli yıldız;
Çiçek = yönü değişen Yaprak (4 yaprak bir köşede buluşur); Kıvrım = Truchet (Dalga parçaları, yön koordinattan "yazı-tura");
Yelpaze = köşeden açılan üç şerit; Kesişen daire = köşe noktalarındaki √2/2 yarıçaplı daireler (mercekler + içbükey yıldızlar);
Pul = balık pulu; Kemer = yarım daire + ters U, tek satırlar kayık; Balıksırtı / İki kare (Pisagor) / Parke (fırıldak parke) taş dizilimleri;
Üç dilim = merkezinden üçe bölünmüş eşkenar üçgen; Uçurtma = altıgen merkezden kenar ortalarına altı uçurtma; Petek halka = iç içe altıgen;
Karışık küp = alt sıradaki altıgenler ters bölünmüş Küp; İnce üçgen = altıgen 12 dik üçgene bölünmüş; Altıgen + kare = 3.4.6.4 döşemesi.

## Değişiklikler

### Şablon modeli (`lib/templates/`)

- `types.ts`
  - `Cell` artık `{ id, points, d }`. Sözleşme: basit çokgen (içbükey olabilir), ağırlık merkezi kendi içinde.
    `points` isabet testi/geometri testi için, `d` çizim için (yaylar gerçek SVG `A` komutu).
  - `Template` artık `tile: { width, height }` + `cellsInTile(col, row)` (eski `cellsInSquare(x, y)`) + `group` (panel başlığı).
    Hücre karosundan en fazla bir karo taşabilir.
  - `TemplateId` 42 kimlik; `TemplateGroup` = "Kare" | "Yay" | "Taş örgü" | "Üçgen ve altıgen".
- `shape.ts` (yeni): `shape(id, parçalar)` — parça bir köşe noktası ya da yay `{ center, r, from, to }`.
  Aynı parçalardan hem `d` hem `points` üretilir. `points` tembeldir (getter, ilk erişimde hesaplanır): ekrandaki binlerce
  hücrenin yalnız çizgisi gerekir. Yaylar `points`'te 7.5°'lik parçalara bölünür (45°'nin katı → ortak yaylar aynı köşeleri üretir),
  180°'den büyük yaylar `d`'de ikiye bölünür. `mirrorX` / `mirrorY` yayları da (açıları) aynalar.
- `builders.ts` silindi; yerine `builders/` klasörü (tek dosya 42 builder ile ~600 satır olacaktı):
  - `common.ts`: `arc`, `isOdd`, `coinFlip` (karo koordinatından sabit yazı-tura, `Math.imul` ile tamsayı karıştırma),
    `midpoint`, `rect`, `hexagonPoints(cx, cy, w)` ve `hexagonCenters(col, row, w)` (artık altıgen genişliği parametreli).
  - `square.ts` (12), `curve.ts` (12), `brick.ts` (6), `hex.ts` (12). Eski 15 builder'ın geometrisi ve **id'leri değişmedi**
    (yalnız dosyası değişti; Dalga/Yaprak/Küp ortak parçaları Kıvrım/Çiçek/Karışık küp ile paylaşmak için küçük yardımcılara ayrıldı).
  - Üçgen ızgarası `triangleBlock(x, y, kenar)` ile üretilir; Üçgen, Sık üçgen ve Üç dilim bunu kullanır.
- `grid.ts`
  - `cellsInTiles` (karo aralığı), `cellsInView` (dünya alanı + 1 karo pay; taşan hücreler için).
  - `containsPoint` içbükey çokgende de çalışır (ışın sayma + kenar toleransı).
  - `cellCenter` köşe ortalaması yerine alan ağırlık merkezi (yaylardaki sık köşeler sonucu kaydırmasın); `neighbors.ts`'ten taşındı.
  - `cellAt`: noktanın karosu, bulamazsa çevresindeki 8 karo.
- `neighbors.ts`: 4 çapraz yön eklendi. Komşu seçiminde kenar paylaşan hücre önce gelir (yoksa eski kural).
- `index.ts`: 42 şablonlu `TEMPLATES` (grup grup), `TEMPLATE_GROUPS`, karo sabitleri (`UNIT`, `TRIANGLE_TILE`, `BIG_HEX_TILE`),
  `outlinePath` (hücrelerin `d`'lerini birleştirir). `toPointsAttribute` kaldırıldı.
- `lib/camera.ts`: yalnız tip adı `SquareRange` → `WorldRange`.

### Durum

- `lib/paintStore.ts`: `templateId` (varsayılan Kare) ve `setTemplate`. Geçmiş artık `Drawing = { templateId, fills }` saklar.
  Şablon değişince tuval boşalır (id'ler şablona özgü); boyalıysa bu bir geri alma adımıdır, boşsa geçmişe yazılmaz.
  Fırça sürerken ya da aynı şablon seçilince bir şey yapmaz.

### Arayüz

- `components/TemplatePicker.tsx` (yeni): her grup bir `section` + el yazısı `h3` başlık + `role="group"` (aria-label "<grup> şablonları");
  içinde 3 sütunlu `button`'lar (`aria-pressed`, `data-template` = kimlik). Önizlemeler şablon verisinden üretilir (3×3 birim, modül yüklenince bir kez).
  Altta not: "şablon değişince tuval boşalır; geri al ile önceki çizime dönersin."
- `components/Panel.tsx`: yer tutucu `MiniGrid`/`Templates` silindi, `TemplatePicker` kullanılıyor.
- `components/Notebook.tsx`: tuval `getTemplate(templateId)` çizer.
- `components/Canvas.tsx`: `cellsInView` + `outlinePath`; boyalı hücre ve odak çerçevesi `<polygon>` yerine `<path d>`.
  Klavye seçimi şablonuyla birlikte tutulur (şablon değişince eski seçim geçersiz). Home/PageUp/End/PageDown çapraz gider; `aria-label` güncellendi.
- `app/globals.css`: şablon düğmesi stilleri (seçili: vurgu kenar + vurgu renkli önizleme), grup başlığı (Caveat 21px), gruplar arası 18px;
  masaüstü panel uzun içerikte kayar (ince kaydırma çubuğu); mobilde grup 300px'e sınırlı ve ortalı; panelin en büyük yüksekliği `100svh - 132px`.

### İnceleme öncesi düzeltme: sayfa kendi kendine büyüyordu

Kullanıcı ekranında ada ve spiral kaybolmuş, ızgara bütün pencereyi kaplıyordu. Neden: dokunmatik yüzeyde sıkıştırma (Chrome bunu
Ctrl + teker olarak yollar) yalnız tuvalde yakalanıyordu; ada, ayraçlar ya da masa kenarı üstünde yapılınca tarayıcı **bütün sayfayı**
büyütüp kaydırıyordu (görsel yakınlaştırma). Sayfa bozulmamıştı, yalnız büyütülmüştü.

- `components/Canvas.tsx`: tuvalin tekerlek efektine `window` düzeyinde pasif olmayan bir dinleyici eklendi; Ctrl/Cmd + teker her yerde
  `preventDefault` alır. Tuvalin kendi yakınlaştırması değişmedi.
- `app/globals.css`: `.desk`'e `touch-action: pan-x pan-y` (dokunmatik ekranda iki parmakla sayfa büyütmeyi kapatır; panelin kaydırması çalışır).
- Doğrulama (CDP `Input.synthesizePinchGesture`, 1280×610, `localhost:3000`): düzeltmeden önce ayraç üstünde pinch sonrası
  `visualViewport.scale` = 1.6 (kullanıcının gördüğü görüntü). Sonra: ayraç, ada, masa kenarı → 1; tuval → sayfa 1, uygulama %100 → %162.
  Mobil (375×740, dokunma, ayraç çubuğunda pinch) → 1. Ekran görüntüleri: `step5-pinchfix-desktop.png`, `step5-pinchfix-mobile.png`.
- Not: düzeltme öncesi ölçüm `127.0.0.1` üzerinden yapıldı; Next dev bu adresten JS'i engellediği için sayfa hydrate olmamıştı. Yani o ölçüm
  "hiçbir dinleyici yokken" davranışı gösterir; ada/ayraç için düzeltme öncesi durum da buydu (oralarda dinleyici yoktu).

### İnceleme öncesi düzeltme: Boşluk + sürükleme kaydırması bir süre sonra bozuluyordu

Kullanıcı: "space basılı tutup kaydırma en başta çalışıyor, sonradan bozuluyor". Neden: Boşluk, odak bir düğmedeyse düğmenin sayılıyordu.
Fareyle tıklanan düğme (ada +/−, şablon) odağı tutar; panel kapanınca da odak bilerek ayraca döner (Panel.tsx). Tuvale tıklamak odağı almaz
(`pointerdown`'da `preventDefault`). Sonuç: ilk düğme tıklamasından sonra Boşluk kaydırmıyor, üstelik ayraca basıp paneli yeniden açıyordu.

- `components/Canvas.tsx`: pencereye `pointerdown` (yakalama evresi) dinleyicisi; son etkileşim fare/dokunma mı tutulur, Boşluk dışındaki her tuş
  bunu sıfırlar. Boşluk geldiğinde odak bir **düğmede** ve son etkileşim fareyse düğme `blur()` edilir ve Boşluk el aracı olur. Klavyeyle
  (Tab) gelinen düğmede ve yazı alanlarında Boşluk eskisi gibi onlarındır.
- Doğrulama (headless Chrome, CDP gerçek tuş/fare olayları, `localhost:3000`, 1280×800; betik repoda değil, scratchpad'de): düzeltmeden **önce**
  1 OK, sonra şablon seçip panel kapatınca / + düğmesinden sonra / panel dışına tıklayınca kaydırma 0px ve panel yeniden açıldı (HATA).
  **Sonra** 9/9 OK: üç durumda da −120px kaydırma, boyama yok, panel açılmadı; Tab ile gelinen ayraçta Boşluk paneli açıyor;
  tuval odaklıyken tek Boşluk boyuyor, Boşluk+sürükle boyamadan kaydırıyor. `verify-paint.mjs square` yeniden çalıştırıldı: tümü geçti.

### Testler ve betikler

- `templates.test.ts` yeniden yazıldı (aşağıda); `EXPECTED_CELLS_PER_TILE` 42 girdi. `grid.test.ts`, `paintStore.test.ts` güncellendi/genişletildi.
- `neighbors.test.ts`: "her hücreye ok + çapraz tuşla ulaşılır" testi, karo başına 8'den çok hücreli şablonlarda 8×8 yerine **4×4** karoluk
  parçada çalışır (`SMALL_PIECE`). Neden: arama her adımda bütün listeyi tarar; İnce üçgen'de 8×8 karo = 1536 hücre, test 9.5 s sürüp
  5 s zaman aşımına takıldı (Yonca da 5.4 s ile takıldı). Sınırsız ızgara testi (her hücrenin dört yönde komşusu var) değişmedi.
- `scripts/verify-templates.mjs`: düğmeleri `data-template` ile bulur (gruplarda `nth-child` yanlış düğmeyi seçerdi); 42 düğme ve 4 grup başlığı
  kontrolü; panel üç kaydırma konumunda çekilir; galeri 14 şablon. `scripts/verify-paint.mjs`: yalnız baş yorum.
- `docs/screenshots/step5-*.png`; `docs/PROGRESS.md` güncellendi. `video/` `.git/info/exclude`'da (6 MB; repoya girmez).

## Komutlar ve gerçek çıktılar

`npm run lint`:

```
> polygo@0.1.0 lint
> eslint .
```

(uyarı/hata yok)

`npm test` (büyük harfli `C:\` yolundan; bkz. PROGRESS Windows notu):

```
 Test Files  5 passed (5)
      Tests  470 passed (470)
   Duration  15.28s
```

(İlk denemede 3 test kırıldı, düzeltildi: Kemer kubbesinin `d`'sinde tek yay olduğundan yalnız 2 uç nokta vardı (test ≥3 ister) → kubbe
iki çeyrek yaya bölündü; Yonca ve İnce üçgen erişim testleri zaman aşımı → yukarıdaki `SMALL_PIECE`.)

`npm run build` (son çalıştırma):

```
✓ Compiled successfully in 734ms
  Running TypeScript ...
✓ Generating static pages using 4 workers (3/3)
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

`npx prettier --check "lib/templates/**/*.ts" components/TemplatePicker.tsx`: **uyarı veriyor** (14 dosya), bu adımda dokunulmayan
`shape.ts` ve `neighbors.ts` dahil. Proje şu an Prettier biçimine uymuyor (uzun satırlar); diff'i şişirmemek için toplu biçimlendirme yapılmadı.

Tarayıcı (`npm run start -- -p 3123`, headless Chrome), `node scripts/verify-templates.mjs docs/screenshots` — çıkış kodu 0:

```
OK   masaüstü: panelde 42 şablon düğmesi (Kare, Piksel, Çapraz, Zikzak, Dörtlü, Sekiz dilim, Elmas, Sekizgen, Fırıldak, Çerçeve, Yıldız, Sekiz köşe, Daire, Yonca, Yaprak, Çiçek, Dalga, Kıvrım, Halka, Yelpaze, Kesişen daire, Pul, Kemer, Dalgalı şerit, Tuğla, Merdiven, Hasır, Parke, Balıksırtı, İki kare, Üçgen, Sık üçgen, Üç dilim, Altıgen, Uçurtma, Petek halka, Küp, Karışık küp, İnce üçgen, Altıgen + üçgen, Altıgen + kare, Kare + üçgen)
OK   masaüstü: dört grup başlığı (Kare|Yay|Taş örgü|Üçgen ve altıgen)
OK   masaüstü: başlangıçta yalnız Kare seçili
OK   masaüstü: her önizlemede çizgi var
OK   masaüstü: "<her şablon>" seçildi            ← 42 satır, düğme aria-pressed + tuval aria-label'ı o şablon
OK   masaüstü: Daire'de tuvalin ortasına dokunmak bir hücre boyar
OK   masaüstü: şablon değişince tuval boşalır
OK   masaüstü: geri al Daire'yi boyamasıyla geri getirir
OK   mobil: ... (aynı 7 kontrol + 42 seçim, dokunma emülasyonuyla, 375×812)
OK   klavye: ok ve Page Down ile Sekizgen'de köşe üçgenine gidilir (0-0-nw → 0-0-center → 0-0-se → 1-0-sw)
OK   galeri: clover / trihex / overlap / scales / truchet / star8 / herringbone / pythagorean / parquet / stair / rhombi / fineHex / hexRing / arch boyandı (her biri 6 hücre)
Hepsi geçti.
```

Gerileme: `node scripts/verify-paint.mjs square` — çıkış kodu 0, son satır `SONUÇ: tüm kontroller geçti`
(boyama, sürükleme, kaydırma, yakınlaştırma, klavye, mobil dokunma/iki parmak, panel kaydırma).

Performans (Vitest içinde geçici ölçüm dosyası, çalıştırıldıktan sonra silindi; 1280×800 %100'e karşılık gelen 36×24 birimlik alan,
`cellsInView` + `outlinePath`, ısınmadan sonra 5 tekrar ortalaması):

| şablon                                                | hücre       | çizgi yolu | süre       |
| ----------------------------------------------------- | ----------- | ---------- | ---------- |
| Kare                                                  | 988         | 22 KB      | 1.0 ms     |
| Yonca (mevcut, en ağır)                               | 11 856      | 483 KB     | 16.8 ms    |
| Sekiz köşe                                            | 8 892       | 377 KB     | 11.7 ms    |
| Uçurtma                                               | 7 296       | 346 KB     | 12.6 ms    |
| Sık üçgen                                             | 9 728       | 357 KB     | 10.0 ms    |
| Üç dilim                                              | 7 296       | 246 KB     | 6.8 ms     |
| Kesişen daire                                         | 2 964       | 257 KB     | 4.8 ms     |
| Pul / İnce üçgen / Petek halka / Altıgen + kare       | 1 976–4 320 | 111–140 KB | 3.4–3.6 ms |
| Yeni şablonların hiçbiri mevcut Yonca'dan ağır değil. |

## Ekran görüntüleri

- Masaüstü panel (1280×800): `docs/screenshots/step5-panel-desktop.png` (Kare grubu), `step5-panel-desktop-2.png` (Yay + Taş örgü),
  `step5-panel-desktop-3.png` (Üçgen ve altıgen + alt not)
- Mobil panel (375×812, 2x): `step5-panel-mobile.png`, `step5-panel-mobile-2.png`, `step5-panel-mobile-3.png`
- Boyalı tuval (masaüstü, %100): `step5-clover.png`, `step5-trihex.png`, `step5-overlap.png`, `step5-scales.png`, `step5-truchet.png`,
  `step5-star8.png`, `step5-herringbone.png`, `step5-pythagorean.png`, `step5-parquet.png`, `step5-stair.png`, `step5-rhombi.png`,
  `step5-fineHex.png`, `step5-hexRing.png`, `step5-arch.png` (ilk hazırlıktan kalan `step5-leaf.png`, `step5-cube.png` hâlâ geçerli)

Gördüklerim: panelde dört el yazısı başlık, her grupta 3 sütunlu önizlemeler; seçili olan vurgu renginde kenarlı ve ✓'li. Masaüstünde panel
ince çubukla kayıyor; mobilde gruplar ortalı, son sıra ayraçların arkasında kalıyor ve kaydırınca görünüyor. "Kesişen daire" ve
"Altıgen + üçgen/kare" adları iki satıra kırılıyor; o satırdaki kartlar biraz uzuyor. Boyalı hücreler doğru biçimde: Kesişen daire'de
mercekler ve içbükey yıldız, Pul'da pullar, Altıgen + kare'de altıgen, kare ve üçgen, Balıksırtı'nda yatay/dikey taşlar.
"Altıgen + kare" ve "Petek halka" önizlemeleri küçük boyda dağınık görünüyordu; önizleme yolu büyütülüp çizdirildi: 3×3 alanın içinde
eksik çizgi yok, büyük altıgenler kenardan kesildiği için öyle görünüyor.

## İddialar

1. 42 şablon var, panelde dört grup halinde; hepsi fare ve dokunuşla seçilebiliyor; tuval seçilen şablonu çiziyor (tarayıcı betiği, 84 seçim kontrolü).
2. Her şablon düzlemi boşluksuz ve örtüşmesiz dolduruyor: karo başına alan = karo alanı ve 6×6 karoluk bölgede iki karonun hücreleri
   bütün hücrelerle örtüşme testinden geçiyor (`templates.test.ts`, 42 şablon).
3. Her hücre basit çokgen, merkezi kendi içinde, karosundan en fazla bir karo taşıyor; `d`'nin her uç noktası `points`'te; id'ler karo koordinatıyla başlıyor
   ve bölgede benzersiz.
4. Her hücrenin merkezine dokunmak o hücreyi buluyor (`grid.test.ts`, 42 şablon, negatif koordinatlar dahil).
5. Klavyeyle her hücreye ulaşılıyor (ok + çapraz tuşlar; 8×8, çok hücreli şablonlarda 4×4 karoluk parçada BFS); sınırsız ızgarada her hücrenin dört yönde komşusu var.
6. Şablon değiştirmek boyalı tuvali boşaltır ve geri al ile önceki şablon boyamasıyla geri gelir (birim test + tarayıcı, masaüstü ve mobil).
7. Eski 15 şablonun hücre id'leri değişmedi (builder'lar dosya değiştirdi, geometri aynı; eski testler aynen geçiyor).
8. Eski davranış bozulmadı (`verify-paint.mjs` geçti).
9. Yeni paket yok; `package.json` değişmedi.
10. Tuval dışında sıkıştırma/Ctrl + teker sayfayı büyütmüyor (CDP ölçümü yukarıda; düzeltmeden sonra lint/test/build yeniden çalıştırıldı, çıktılar aynı).
11. Boşluk + sürükleme, bir düğmeye fareyle tıkladıktan sonra da kaydırıyor; klavyeyle odaklanan düğmede Boşluk düğmeye basıyor (CDP ölçümü yukarıda;
    düzeltmeden sonra build temiz, lint temiz, `npm test` 470/470).

## Şüpheler / bilinen eksikler

- **%100'de küçük parçalar:** Sekiz köşe üçgenleri, Sık üçgen, Yonca köşe parçaları, Sekizgen köşe üçgenleri %100'de ~10px; mobilde
  yakınlaştırmadan doğru dokunmak zor. "≥44px daire" ölçümü yalnız Kare/Dörtlü için yapılmıştı; yeni şablonlar için ölçülmedi.
- **Kıvrım'ın "rastgele"liği:** `coinFlip` basit bir tamsayı karıştırması; görsel olarak rastgele duruyor ama istatistiksel olarak denenmedi.
  İleride değiştirilirse Kıvrım'daki boyalı çizimlerin görünümü değişir (id'ler aynı kalır, hücre biçimi değişir) — kayıt (Adım 7) sonrasında dokunulmamalı.
- **Erişim testi küçültüldü:** çok hücreli şablonlarda (Yonca, Sekiz köşe, Sık üçgen, Üç dilim, Uçurtma, Petek halka, İnce üçgen, Altıgen + kare, İki kare)
  klavye erişimi 4×4 karoluk parçada sınanıyor. Desen karodan karoya tekrarlandığı için yeterli sayıyorum, ama daha az kapsayıcı.
- **4K ekranda yaylı şablonlar ağır:** Yonca'da çizgi yolu ~3 MB ve her 4 birim kaydırmada ~116 ms (ilk hazırlıkta ölçüldü). Yeni şablonlar
  Yonca'dan hafif ama Sekiz köşe/Sık üçgen/Uçurtma ona yakın. Gerçek 4K ekranda denenmedi.
- **Panel uzunluğu:** 42 şablonla panel masaüstünde ~3, mobilde ~6 ekran boyu kayıyor. Gruplar taramayı kolaylaştırıyor ama arama/sekme yok.
- **İki satıra kırılan adlar:** "Kesişen daire", "Altıgen + üçgen", "Altıgen + kare" kartlarını biraz uzatıyor; aynı satırdaki kartlar da uzuyor (grid), göze batmıyor.
- **Prettier uyumsuzluğu:** yukarıda; projede önceden de vardı.
- **Örtüşme testi tam bir poligon kesişimi değil:** kenar kesişmesi + köşe/kenar ortası/merkez içeride mi kontrolü. Alan eşitliği testi ikinci güvence.
- **İsabet testi yaklaşık:** dokunma `points`'e (7.5°'lik parçalı yay) göre, çizim gerçek yaya göre (en çok ~0.002 birim fark). Kesişen daire'de
  yarıçap √2/2 olduğu için yaylar 17 parçaya bölünüyor (45°'nin katı değil), ama aynı yayı paylaşan iki hücre aynı açı aralığını kullandığından aynı köşeleri üretiyor.
- **Çapraz tuşlar keşfedilmesi zor:** Home/PageUp/End/PageDown yalnız `aria-label`'da anlatılıyor.
- **Seçince panel açık kalıyor:** mobilde kullanıcı paneli kapatmalı. Bilerek (peş peşe karşılaştırma için).
- **Ekran okuyucu:** odaktaki hücre hâlâ id'siyle okunuyor; Adım 3'ten kalan borç, Adım 8'de.
- **Ctrl + teker ile tarayıcı yakınlaştırması artık sayfada çalışmaz** (sıkıştırma düzeltmesi). Klavyeyle Ctrl +/− ve tarayıcı menüsü çalışır.
  Çizim uygulamalarında yaygın, ama az gören kullanıcı için bir kayıp; bilerek.
- **Safari (iOS/macOS) sıkıştırması:** `touch-action` ve `wheel` Safari'de her zaman yetmez (`gesturestart` olayı); denenmedi.
- **Mobil pinch testinde bir hücre boyandı:** sentetik iki parmaktan biri ayraç çubuğunun üstündeki tuvale düştü; tuval tek parmağı boyama sayar.
  Düzeltmeyle ilgisi yok (önceki davranış), gerçek telefonda denenmedi.
- **Boşluk düzeltmesinin kenar durumu:** fareyle bir düğmeye tıklayıp hemen Boşluk'a basan kullanıcı artık o düğmeyi Boşluk'la tetikleyemez
  (el aracı olur); Enter çalışır. Tab ya da başka bir tuşa basınca Boşluk yine düğmenindir. Bilerek.
- Boşluk düzeltmesi gerçek PC'de (fiziksel klavye/fare) denenmedi; yalnız headless Chrome'da CDP olaylarıyla.
- Gerçek telefonda ve Safari/Firefox'ta denenmedi; doğrulama yalnız headless Chrome.

## Karar notları

- **Şablon değişince tuval boşalır, geri alınabilir:** id'ler şablona özgü; onay penceresi yerine geri alma adımı.
- **Karo modeli:** altıgen/üçgen için "hücre karesinden taşmaz" kuralı gevşetildi (en fazla bir karo taşar).
- **Gerçek yaylar:** önce yaylar kısa çizgilerle çizildi; yol 1280×800'de 1.2 MB çıktı. `shape()` ile gerçek yaya geçildi, `points` tembelleşti.
- **Çapraz tuşlar:** dört yönle Sekizgen/Elmas/Daire köşe parçalarına ulaşılamıyordu; sayısal tuş takımı düzeni seçildi.
- **Gruplar:** 42 düz liste taranması zor; dört grup, defterin el yazısı başlıklarıyla. Ayrı sekme/arama eklenmedi (sade kalsın).
- **Büyük karolar:** Petek halka, İnce üçgen ve Altıgen + kare genişliği 2 olan altıgenle kuruldu; genişlik 1'de halka 10px, Altıgen + kare'nin karesi 15px kalıyordu.
- **Elenen fikir:** altıgene teğet daire + 6 köşe parçası. Köşe parçaları alanı 0.013 birim² (Daire'dekilerin dörtte biri), boyanamayacak kadar ince; eklenmedi.
- **Fırıldak:** kenar ortalarından değil, ortanın çeyrek birim yanından geçen çizgiler; ortadan geçseydi desen Dörtlü/Elmas'ın aynısı olurdu.
- Şablon adları Türkçe ve kısa; kimlikler İngilizce (`zigzag`, `truchet`, `herringbone`, `rhombi`...).

## Nasıl kontrol ederim

1. `npm install` (gerekirse), `npm run dev`, tarayıcıda `http://localhost:3000`.
2. Sağdaki **Şablonlar** ayracını aç: dört başlık (Kare, Yay, Taş örgü, Üçgen ve altıgen), 42 önizleme. Birine tıkla: kenarı turuncu olur, tuval o deseni çizer.
3. Yeni şablonlardan birkaçını dene: Kesişen daire, Pul, Kıvrım, Sekiz köşe, Balıksırtı, Altıgen + kare. Hücreleri boya; komşuları taşmamalı.
4. Daire'yi seç, paneli kapat, birkaç hücre boya. Paneli açıp Altıgen'i seç: tuval boşalır. Adadaki **geri al** (ya da Ctrl+Z):
   Daire boyamasıyla geri gelir; panelde Daire seçili görünür.
5. Klavye: tuvale Tab ile gel, Sekizgen'de ok tuşları ve Page Down / Home / End / Page Up ile gez, Enter ile boya.
   5b. Boşluk ile kaydırma: adadaki + düğmesine ya da bir şablona tıkla, paneli kapat; sonra Boşluk'u basılı tutup tuvali sürükle:
   ızgara kaymalı, panel açılmamalı. Tab ile bir ayraca gelip Boşluk'a basınca ise panel açılmalı.
6. Mobil: geliştirici araçlarında 375px genişlik + dokunma; alttaki **Şablonlar** ayracı, panel kayar ve adanın altında kalmaz.
7. Testler: `npm test` (Windows'ta `C:\...` büyük harfli yoldan), `npm run lint`, `npm run build`.
8. Tarayıcı betikleri: `npm run build && npm run start -- -p 3123`, ayrı terminalde
   `chrome --headless=new --remote-debugging-port=9233 --user-data-dir=<geçici> about:blank`, sonra
   `node scripts/verify-templates.mjs docs/screenshots` ve `node scripts/verify-paint.mjs square`.
