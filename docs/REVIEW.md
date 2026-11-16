# İnceleme: Adım 4 — tam sayfa sonsuz ızgara ve araç adası

## Amaç
- Defter sayfasının içinde yalnız ızgara kalsın: ızgara sayfayı kenardan kenara doldursun ve her yöne sınırsız olsun.
- Kaydırma ve yakınlaştırma: masaüstünde teker ve sürükleme, mobilde iki parmak.
- Hücre id'leri dünya koordinatı olarak kalsın (`x-y`, `x-y-a`, `x-y-top` …); negatif koordinatlar da geçerli.
- Kullanıcı kararı (adım başında soruldu): logo ve araçlar "masaüstü ama dynamic island şeklinde". Defterin üstünde, masada
  ortalanmış koyu hap biçiminde bir çubuk oldu.

## Değişiklikler
**Şablon modeli (`lib/templates/`)**
- `types.ts`: `Template` artık `width/height/cells` taşımıyor; `cellsInSquare(x, y)` taşıyor, yani tekrar eden desen.
- `builders.ts`: builder'lar tek kareyi üretiyor (`squareCells(x, y)` …). id biçimi değişmedi.
- `grid.ts` (yeni):
  - `cellsInRange(template, range)`: aralıktaki hücreler; sağ ve alt kenar dahil değil.
  - `containsPoint`: dışbükey çokgende nokta testi; kenar dahil.
  - `cellAt(template, point)`: yalnız noktanın karesine bakar.
- `neighbors.ts`: `findNeighborCell` eklendi. Sınırsız ızgarada ok tuşu komşusunu hücrenin 3×3 kare çevresinde arar. Eski `findNeighbor` aynen duruyor.
- `index.ts`: `TEMPLATES` artık `cellsInSquare` veriyor; `cellAt`, `cellsInRange` ve `SquareRange` dışa aktarılıyor.

**Kamera (`lib/camera.ts`, `lib/viewStore.ts`, yeni)**
- Kamera = ekranın ortasındaki dünya noktası + yakınlaştırma. %100'de bir kare 40 px; aralık %100–%400, adım ×1.5.
- Saf fonksiyonlar: `toWorld`, `toScreen`, `zoomCamera(from → to)`, `panCamera`, `visibleRange`, `toViewBox`, `clampZoom`.
- `visibleRange` aralığı 4 karenin katlarına yuvarlar. Böylece kaydırırken hücre listesi her karede değil, ara sıra yeniden üretilir.
- `useViewStore` (Zustand): `camera`, `setCamera`, `zoomTo`. Tuval ve adadaki yakınlaştırma düğmeleri aynı kamerayı kullanır.

**Tuval (`components/Canvas.tsx`, baştan yazıldı)**
- SVG sayfayı doldurur; `viewBox` kameradan hesaplanır, boyut `ResizeObserver` ile ölçülür.
- Izgara çizgileri görünen hücrelerin kenarlarından tek bir `<path>` olarak çizilir. Yalnız boyalı hücreler `<polygon data-cell-id>` olarak çizilir.
- Dokunulan hücre artık `document.elementFromPoint` ile değil, `cellAt(toWorld(...))` ile bulunur.
  Hızlı sürüklemede aradaki noktalar 3 px aralıkla taranır (Adım 3'teki gibi).
- Girdiler:
  - Sol tuş / tek parmak: boyar.
  - Orta tuşla sürükleme: kaydırır.
  - Teker: dikey kaydırır; Shift + teker yatay kaydırır.
  - Ctrl/Cmd + teker: imleç çevresinde yakınlaştırır.
  - İki parmak: yakınlaştırır ve kaydırır.
  - Teker dinleyicisi `passive: false` ile elle eklendi; React'in `onWheel`'i sayfa kaymasını engelleyemiyor.
- Klavye:
  - Ok tuşları seçili hücreyi sınırsız ızgarada gezdirir; hücre kenara 48 px'ten fazla yaklaşırsa görüş onu ortalar.
  - Enter ya da Boşluk boyar.
  - +/− yakınlaştırır.
  - Henüz seçim yoksa klavye odağı ekranın ortasındaki hücrededir.
- `pointercancel`, `lostpointercapture` ve iki parmakla gelen fırça iptali Adım 3'teki gibi korundu.

**Düzen**
- `components/Island.tsx` (yeni): logo, ayırıcı, araçlar (geri al, yinele, temizle, renk), ayırıcı, yakınlaştırma.
- `components/ZoomControls.tsx`: prop almıyor, kamerayı depodan okuyor. % düğmesi "başa döndür" oldu, metni güncellendi.
- `components/Notebook.tsx`: başlık, sayfa altı yazıları, tuval altı notu ve dekoratif kağıt ızgarası kaldırıldı.
  Sayfada `page-canvas`, spiral, ayraçlar ve panel kaldı.
- `app/globals.css`:
  - Masa tam ekran bir flex sütunu; `html, body` kaymıyor.
  - Defter kalan yüksekliği dolduruyor.
  - Ada stilleri: koyu mürekkep zemin, krem simgeler, pasif öğeler için `--island-muted`. Açılışta ortadan iki yana açılıyor; `backwards` modunda, yani bitince kırpma kalkıyor.
  - Seçili renk dairesine krem halka eklendi; mürekkep rengi koyu adada da görünüyor.
  - Mobilde adada yalnız logo işareti var, ≤420 px'te % göstergesi gizli.
  - Kullanılmayan kurallar silindi.

**Testler ve betik**
- `templates.test.ts`:
  - Geometri, negatif koordinatları da içeren 6×4'lük bir bölgede denetleniyor: dışbükeylik, örtüşme yok, alan toplamı.
  - Yeni madde: her hücre kendi karesinin içinde.
  - Kare başına hücre sayısı (`EXPECTED_CELLS_PER_SQUARE`) ve id'lerin kare koordinatıyla başladığı da sınanıyor.
- `grid.test.ts` (yeni):
  - `containsPoint` için iç, kenar, köşe ve dış noktalar.
  - `cellsInRange`: aralık sınırı ve boş aralık.
  - `cellAt`: her şablonda her hücrenin merkezi, negatif koordinatlar, kenardaki nokta.
- `camera.test.ts` (yeni): dönüşümlerin tersinirliği; yakınlaştırmada imlecin altındaki noktanın yerinde kalması; from→to kaydırma; görünür aralığın ekranı kapsaması; viewBox.
- `neighbors.test.ts`: sonlu liste testleri 8×8'lik parçada sürüyor. Sınırsız ızgara için eklenenler: 0-0'dan sola `-1-0`, yukarı `0--1`; her şablonda her hücrenin dört yönde de komşusu var.
- `scripts/verify-paint.mjs` yeni modele göre yeniden yazıldı: hücre geometrisini id'den hesaplıyor (aşağıdaki kontrol listesi).

## Komutlar ve gerçek çıktılar
`npm run lint`
```
> polygo@0.1.0 lint
> eslint .
```
(uyarı/hata yok)

`npm test` (`C:\Users\sec\Desktop\polygo` yolundan)
```
 Test Files  5 passed (5)
      Tests  62 passed (62)
```

`npm run build`
```
▲ Next.js 16.4.6 (Turbopack)
✓ Compiled successfully in 809ms
  Finished TypeScript in 1291ms ...
✓ Generating static pages using 4 workers (3/3) in 704ms
Route (app)
┌ ○ /
└ ○ /_not-found
```

Tarayıcı doğrulaması: `node scripts/verify-paint.mjs square docs/screenshots`. Kurulum: üretim sunucusu `-p 3123`, Chrome headless; masaüstü 1280×800 fare, mobil 375×812 dokunma emülasyonu.
```
OK   sayfa kaymaz (tuval ekranı doldurur) — taşma 0px
OK   ada defterin dışında, üstünde — ada alt 68, defter üst 84
OK   ızgara sayfayı kenardan kenara doldurur — defter çocukları: page-canvas | spiral | index-tabs | panel-layer
OK   tık tek hücre boyar — ["0-0"]
OK   sürükleme hücreleri boyar — 5 boyalı
OK   adadaki geri al sürüklemeyi tek adımda geri alır
OK   adadaki yinele geri getirir
OK   hızlı sürükleme aradaki kareleri atlamaz (negatif x dahil) — boş kalan sütunlar: []
OK   teker dikey kaydırır — Δy 200.0
OK   Shift + teker yatay kaydırır — Δx 300.0
OK   Ctrl + teker imleç çevresinde yakınlaştırır — 100% → 182%, hücre kayması 0.00px
OK   % düğmesi %100'e döndürür
OK   orta tuşla sürükleme kaydırır, boyamaz — Δ (150.0, 100.0)
OK   uzakta (sınırsız ızgarada) boyanır — 129-3, görünen boyalı: ["129-3"]
OK   geri dönünce eski boyama yerinde
OK   negatif koordinatlı hücre seçilen renkle boyanır — -3--2: rgb(217, 72, 43)
OK   aynı renge tekrar tık siler
OK   temizle boşaltır
OK   Ctrl+Z temizlemeyi geri alır
OK   klavye: 30 kez sol ok + Enter, ekran dışına çıkan hücreyi boyar ve görüş onu izler — ["-30-0"]
OK   adadaki + yakınlaştırır — 150%
OK   mobil: ada ekrana sığar, yatay taşma yok — ada 26–350px, genişlik 324px
OK   mobil: adadaki düğmeler ≥44px — 6 düğme, en küçük 44px
OK   dokunma iptali fırçayı geri alır, geçmişe yazmaz — boyalı: 0, geri al kapalı: true
OK   iptalden sonraki dokunuş normal boyar
375px, 100%: en küçük iç teğet daire çapı 40.0px
  + (1) → 150%: en küçük iç teğet daire çapı 60.0px
OK   yakınlaştırınca her hücrede ≥44px çaplı daire sığar — 1 dokunuş, 150%
OK   dokunuş yalnız hedef hücreyi boyar (komşu boyanmaz) — 27 isabet / 27 dokunuş, 3 hücre
OK   tek parmak sürükleme boyar — ["-1--1","-1--2","-2--1"]
OK   iki parmak yakınlaştırır ve boyamaz — 100% → 400%
OK   iki parmakla birlikte sürükleme kaydırır, boyamaz — Δy 120.0
OK   mobil: Renkler ayracı paneli açar
OK   kaydırılmış panelde aşağı çekmek paneli kapatmaz — kaydırılabilir: 60px, açık: true
OK   panel en üstteyken aşağı çekmek kapatır
SONUÇ: tüm kontroller geçti
```
Dörtlü şablonu: `Notebook.tsx` geçici olarak `getTemplate("cross")` yapıldı, derlendi ve `node scripts/verify-paint.mjs cross docs/screenshots` çalıştırıldı. Sonra dosya geri alındı ve yeniden derlendi; diff'te varsayılan şablon `DEFAULT_TEMPLATE`. Sonuç: tüm kontroller geçti. Farklı satırlar:
```
OK   Ctrl + teker imleç çevresinde yakınlaştırır — 100% → 182%, hücre kayması 0.23px
OK   klavye: 30 kez sol ok + Enter, ekran dışına çıkan hücreyi boyar ve görüş onu izler — ["-17-0-left"]
375px, 100%: en küçük iç teğet daire çapı 16.6px
  + (1) → 150%: en küçük iç teğet daire çapı 24.9px
  + (2) → 225%: en küçük iç teğet daire çapı 37.3px
  + (3) → 338%: en küçük iç teğet daire çapı 56.0px
OK   yakınlaştırınca her hücrede ≥44px çaplı daire sığar — 3 dokunuş, 338%
OK   dokunuş yalnız hedef hücreyi boyar (komşu boyanmaz) — 108 isabet / 108 dokunuş, 12 hücre
SONUÇ: tüm kontroller geçti
```
Dürüstlük notu: Dörtlü'nün ilk koşusunda isabet kontrolü HATA verdi (81/108). Iskalayan 27 dokunuşun hepsi `-2--1` karesindeydi ve hiçbiri bir şey boyamadı. Nedeni: %338'de kare 135 px olduğu için bu kare 375 px ekranın soluna taşıyordu, yani dokunuşlar ekran dışına gidiyordu. Betik düzeltildi: hedefler ortadaki kare ile altı/üstü arasından seçiliyor ve ekran dışındakiler eleniyor. Uygulama kodu değişmedi.

## Ekran görüntüleri
- Masaüstü 1280×800:
  - `docs/screenshots/step4-square-desktop-empty.png`
  - `docs/screenshots/step4-square-desktop-painted.png`
  - `docs/screenshots/step4-square-desktop-far.png` (129. sütunda boyama)
  - `docs/screenshots/step4-cross-desktop-painted.png`
- Mobil 375×812:
  - `docs/screenshots/step4-square-mobile-empty.png`
  - `docs/screenshots/step4-square-mobile-zoomed-painted.png`
  - `docs/screenshots/step4-square-mobile-colors.png`
  - `docs/screenshots/step4-cross-mobile-*.png`
- Görüntülere tek tek bakıldı:
  - Ada masada, defterin üstünde ortada; mobilde spiral tellerinden ayrı.
  - Izgara sayfayı kenardan kenara dolduruyor.
  - Boyalı üçgenler doğru yerde.
  - Mobil renk panelinde mürekkep rengi adada krem halkayla görünüyor.
- Masaüstü görüntülerinde Renkler ayracındaki kırmızı çerçeve odak halkası: Escape ile panel kapanınca odak ayraca dönüyor. Beklenen davranış.

## İddialar
1. Defter sayfasının içinde yalnız ızgara var; logo, araçlar ve yakınlaştırma sayfanın dışında, masadaki adada.
2. Izgara her yöne sınırsız. 129. sütunda ve negatif koordinatlarda boyama çalışıyor, id'ler dünya koordinatı.
3. Ekranda yalnız görünen alanın hücreleri üretiliyor. DOM'da tek bir çizgi yolu ve yalnız boyalı hücreler var.
4. Kaydırma ve yakınlaştırma çalışıyor:
   - Teker, Shift + teker, Ctrl + teker (imleç sabit kalıyor), orta tuşla sürükleme.
   - Mobilde iki parmakla yakınlaştırma ve kaydırma; bunlar boyamıyor.
5. Adım 3 davranışları korundu:
   - Tek fırça = tek geri alma adımı; aynı renge dokunmak siler.
   - Hızlı sürüklemede kare atlanmıyor.
   - pointercancel yarım fırçayı geri alıyor.
   - Mobil panelin kaydırma ve kapatma davranışı aynı.
6. Klavye: ok tuşlarıyla ızgaranın sınırı olmadan gezilebiliyor, görüş seçili hücreyi izliyor.
7. Mobilde ada 375 px'e sığıyor ve görünen bütün düğmeleri ≥44 px.
8. Build, lint ve test temiz.

## Şüpheler / riskler
- **En küçük yakınlaştırma %100.** Bir kare 40 px olduğundan 1280 px ekranda yaklaşık 28×17 kare görünüyor. Bundan büyük bir logo tek bakışta görülemez. Daha çok uzaklaşmak, 4K ekranda Dörtlü'de on binlerce hücre ve çok büyük bir çizgi yolu demek. Bunun çözümü (ör. uzakta çizgileri `<pattern>` ile çizmek) sonraya bırakıldı.
- **Mobilde Dörtlü için 3 dokunuş gerekiyor** (%338). Adım 3'te 2'ydi: o zaman 8×8 tuval ekranı dolduruyordu, şimdi kare sabit 40 px. Gerçek telefonda denenmedi.
- **Chrome'da tıklama yutuluyor.** İki parmakla kaydırmadan ~100 ms içinde gelen dokunuşun `click` olayını Chrome yutuyor (emülasyonda ölçüldü). Ayraç ve düğmeler bu kısa sürede tepki vermeyebilir. Boyama `pointerdown` kullandığı için etkilenmiyor. Doğrulama betiğine 1 sn bekleme eklendi.
- **Dörtlü'de Ctrl + teker sonrası 0.23 px kayma.** Kare şablonunda 0.00 px. Hesap testte tam (`camera.test.ts`); farkın tarayıcının piksel yuvarlamasından geldiğini düşünüyorum, kanıtlamadım.
- **Fare girdileri:** Orta tuşu olmayan fareyle sürükleyerek kaydırma yok; teker ve dokunmatik yüzey var. Boşluk + sürükleme eklenmedi, çünkü Boşluk tuvalde "boya" tuşu.
- **Klavyeyle kaydırma:** Yalnız seçili hücreyi hareket ettirerek yapılabiliyor.
- **Odaktaki hücre:** Kullanıcı hiç hücre seçmediyse klavye odağı ekranın ortasındaki hücre. Kaydırınca bu hücre de değişiyor; ekran okuyucu her kaydırmada yeni hücreyi okuyabilir (`aria-live`).
- **Gerçek cihaz:** Safari/iOS'ta iki parmak hareketi ve `touch-action: none` gerçek cihazda denenmedi. Sayfa yakınlaşması (pinch-zoom) tuval dışında, örneğin adada hâlâ mümkün.
- **İlk çizim:** `ResizeObserver` boyutu ölçene kadar ilk karede tuval boş çiziliyor (bir kare süresi).
- **Uzaktaki boyamalar:** Ekran dışındaki boyalı hücreler DOM'da yok. Tuvalin `aria-label`'ındaki boyalı sayısı depodan geldiği için doğru. Doğrulama betiğindeki `__fills()` ise yalnız görünenleri sayıyor; betikteki kontroller buna göre yazıldı.
- **id biçimi:** Negatif koordinatlı id'ler (`-1--2`) çirkin ama tek anlamlı. Kayıt adımında (Adım 7) bu biçim saklanacak.
- **Kaldırılan yazılar:** Sayfa altı yazıları ("küçük şekiller, kendine ait bir iz.", "01 / çizim defteri") ve tuval altı notu kaldırıldı. Kullanıcı bunları "sayfanın içinden kalkar" kararıyla kaldırdı; adaya taşınmadı.
- **Ada rengi:** Koyu mürekkep (#1f2230). Vurgu rengi değil, ama sayfada en baskın koyu öğe bu oldu.
- **Yerel ortam sorunu (kodla ilgili değil):** Doğrulama sırasında 3123 portunda daha önce başlatılmış bir `next start` çalışıyordu. Yeni build onun altındaki `.next`'i değiştirdi ve sayfa stilsiz geldi. Süreç durdurulup yeniden başlatıldı; PROGRESS.md'ye not düşüldü.

## Karar notları
- **Hücre seçimi:** Dokunulan hücre DOM yerine geometriyle bulunuyor. Sınırsız ızgarada binlerce görünmez çokgen çizmek yerine yalnız boyalılar çiziliyor. `cellAt` saf bir fonksiyon, bu yüzden test edilebiliyor.
- **Kamera:** Ekran ortası + yakınlaştırma tutuluyor. Düğmeyle yakınlaştırmada merkez sabit kaldığı için ada, tuvalin boyutunu bilmeden yakınlaştırabiliyor.
- **Şablon tanımı:** Hâlâ tek tanım (`TEMPLATES` girdisi). Yeni şablon için kare başına hücre üreten bir builder yeterli.
- **Ek paket:** Eklenmedi.

## Nasıl kontrol ederim
1. `npm run dev`, sonra http://localhost:3000 adresini açın.
2. Masaüstünde:
   - Tıklayın ve sürükleyin: boyar.
   - Teker: kaydırır. Shift + teker: yatay kaydırır.
   - Ctrl + teker (ya da dokunmatik yüzeyde sıkıştırma): imleç çevresinde yakınlaştırır.
   - Orta tuşla sürükleme: kaydırır.
   - Adadaki düğmeler: geri al, yinele, temizle, renk, −, %, +.
3. Klavye: tuvale Tab ile gelin. Ok tuşları hücre seçer, Enter boyar; uzun süre sola basınca görüş hücreyi izler.
4. Mobil: DevTools'ta 375 px dokunma emülasyonu açın.
   - Tek parmak boyar, iki parmak yakınlaştırır ve kaydırır.
   - Ada tek satır kalmalı; ayraçlar altta.
5. Otomatik doğrulama: `scripts/verify-paint.mjs` dosyasının başındaki adımları izleyin.
