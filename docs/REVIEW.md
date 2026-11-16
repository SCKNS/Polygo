# İnceleme: Adım 3 — boyama (2. tur)

## 2. tur: denetçi bulgularına yanıt
| Bulgu | Karar | Ne yapıldı |
|---|---|---|
| Hızlı sürüklemede hücre atlanabilir; kod garanti vermiyor | Doğru, düzeltildi | `Canvas.tsx`: `cellIdsAlong(önceki, şimdiki)` iki işaretçi konumu arasındaki çizgiyi 3px adımla tarar (`SAMPLE_STEP_PX`), geçilen her hücre boyanır. Sınır: çizginin bir hücrenin köşesini 3px'ten kısa sıyırması yakalanmayabilir (yorumda yazıyor). Tarayıcıda: tek `mouseMoved` olayıyla 7 kare (Dörtlü'de 6) geçildi, boş kalan sütun yok. |
| `pointercancel` farklı bir açık bırakıyor | Doğru, düzeltildi | Önceden `pointercancel` = `pointerup` idi: kesilen yarım fırça kaydediliyordu. Şimdi `handlePointerCancel` fırçayı `cancelStroke` ile geri alır, geçmişe yazmaz. Ayrıca `lostpointercapture` aynı işi yapar (yakalama kaybolursa işaretçi listede takılı kalıp sonraki dokunuşu "ikinci parmak" sanmasın). Dikkat: dokunmada yakalama önce poligona verilir; SVG'ye alınınca poligonun `lostpointercapture`'ı SVG'ye kabarcıklanır. Bu yüzden yalnız `event.target === event.currentTarget` iken işlenir. Tarayıcıda: `touchStart → touchMove → touchCancel` sonrası boyalı 0, geri al kapalı; ardından normal dokunuş tek hücreyi boyadı. |
| Mobil panel kaydırma çatışması | Doğru (yorumum aşağıda), düzeltildi | Bulgu ayrıntı vermiyordu; koddaki karşılığını şöyle yorumladım: mobil panel `overflow-y: auto` ile kayar, ama 45px aşağı çekmek paneli kapatıyordu, yani kaydırılmış içeriği yukarı kaydırmak paneli kapatıyordu. `Panel.tsx`: aşağı çekip kapatma yalnız `scrollTop <= 0` iken başlar. Tarayıcıda (375×480, panel 60px kaydırılabilir): en altta aşağı çekme → panel açık kaldı; en üstte aşağı çekme → kapandı. Denetçi başka bir çatışmayı kastettiyse belirtsin. |
| Global kısayol bağlamı eksik | Doğru, düzeltildi | `ToolBar.tsx`: odak `input, textarea, select, [contenteditable]` içindeyse Ctrl+Z/Y'ye karışılmaz. |
| Ekran okuyucu erişilebilirliği yetersiz | Doğru, ertelendi | Denetçinin önerdiği gibi borç olarak kayda alındı (PROGRESS.md). Yeni "sonsuz ızgara" adımı tuval modelini değiştireceği için şimdi yapılmadı. |
| 108 dokunuş çıktısı tekrar üretilemiyor | Doğru, düzeltildi | Betik repoya alındı: `scripts/verify-paint.mjs` (ek paket yok; kullanım dosya başında; HATA varsa çıkış kodu 1). |
| "Her hücre" ifadesi 12 hücrelik testten geniş | Kısmen doğru, ifade daraltıldı | Ölçüm (≥44px daire) **tüm** hücreler üzerinde yapılıyor (en küçük iç teğet daire). Komşuya taşmama dokunma testi ise görünür 12 hücrede. İddia 4 buna göre yeniden yazıldı. |

Ek olarak 2. turda betikteki klavye kontrolü sıkılaştırıldı: önce sol üst hücreye tıklanıp odak oraya alınıyor; sağ ok + Enter
artık gerçekten başka bir hücreyi boyuyor (Kare `1-0`, Dörtlü `0-0-right`, Çapraz `0-0-b`). 1. turdaki kontrol odak köşedeyken yapılmıştı.

### 2. tur komut çıktıları
`npm test`: `Test Files 3 passed (3)`, `Tests 38 passed (38)`.
`npm run lint`: uyarı/hata yok (betikteki bir `no-unused-expressions` uyarısı düzeltildi).
`npm run build`: başarılı, `○ /` statik.
`node scripts/verify-paint.mjs` (üç şablon, Notebook geçici değiştirilip geri alındı) — her biri:
```
OK   hızlı sürükleme (tek olay) aradaki kareleri atlamaz — boş kalan sütunlar: []
OK   klavye: 0-0 odaklıyken sağ ok + Enter başka bir hücreyi boyar
OK   dokunma iptali fırçayı geri alır, geçmişe yazmaz — boyalı: 0, geri al kapalı: true
OK   iptalden sonraki dokunuş normal boyar (işaretçi takılı kalmadı)
OK   kaydırılmış panelde aşağı çekmek paneli kapatmaz — kaydırılabilir: 60px, açık: true
OK   panel en üstteyken aşağı çekmek kapatır — açık: false
SONUÇ: tüm kontroller geçti        (çıkış kodu 0, üç şablonda da)
```
1. turdaki diğer tüm kontroller de üç şablonda yine OK.
Yapılmayan: düzeltmeden ÖNCEKİ kodda yeni kontrollerin başarısız olduğu ayrıca gösterilmedi.

### 2. tur şüpheleri
- Kısa ekranda (ör. 375×480) alt ayraçlar sayfanın altında, görünür alanın dışında kalıyor; betik paneli bu yüzden doğrudan `click()` ile açıyor. Bu, Adım 1'den gelen düzen sorunu; yeni ızgara adımında düzen zaten değişecek.
- `touchCancel` CDP ile üretildi; gerçek cihazda iptalin ne zaman geldiği (ör. bildirim, sistem hareketi) denenmedi.

### Kullanıcı kararı (bu inceleme sırasında)
Kullanıcı çizim alanının **defter sayfasının tamamı** olmasını istedi (sonsuz ızgara, sayfa içinde yalnız ızgara). Bu ayrı adım olarak
plana Adım 4 diye eklendi; bu incelemenin kapsamında değil. Adım 3'teki sabit boyutlu tuval o adımda değişecek.

---
# 1. tur

## Amaç
Hücreye tıklayarak/sürükleyerek boyama, serbest renk seçici, hazır ve son kullanılan renkler, geri al / yinele, temizle (Zustand).
Ek olarak Adım 2'den açık kalan **O4 (mobil dokunma hedefi)** kapatılacaktı. Yöntemi kullanıcı seçti: **yakınlaştırma**.
Kabul ölçütü (PROGRESS.md): 375px genişlikte her şablonda hedef hücre ~44×44 CSS px etkin alanla seçilebilmeli (gerekirse yakınlaştırarak),
bir dokunuş komşu hücreyi boyamamalı; dokunma emülasyonunda ya da telefonda denenmeli.

## Değişiklikler
- `package.json` / `package-lock.json`: `zustand` 5.1.0 (dependency). Neden: proje teknoloji listesindeki durum kütüphanesi; boyama, renk ve geçmiş birden çok bileşende (tuval, araç çubuğu, renk paneli) paylaşılıyor.
- `lib/paintStore.ts` (yeni): Zustand deposu.
  - `fills`: hücre id → `#rrggbb`. Listede olmayan hücre boş (şeffaf).
  - Fırça: `startStroke(id)` başlangıç durumunu saklar; ilk hücre zaten seçili renkteyse hareket **silgi** olur. `paintCell(id)`, `endStroke()` (tek geri alma adımı; değişiklik yoksa geçmişe yazılmaz), `cancelStroke()` (iki parmak gelince ilk parmağın boyadığını geri koyar, iz bırakmaz).
  - `undo`, `redo`, `clear` (temizle de geri alınabilir, onay sorulmaz). Geçmiş tam anlık görüntü, en çok 100.
  - `setColor` geçersiz rengi yok sayar (`normalizeColor`: `#abc`/`#AABBCC` → `#aabbcc`). Son kullanılanlar (en çok 6) yalnız boyamada güncellenir, silmede değil.
  - Hazır renkler düz hex (Adım 5 dışa aktarımında CSS değişkeni çözülemeyeceği için).
- `lib/templates/neighbors.ts` (yeni): `cellCenter`, `findNeighbor(cells, id, yön)` — ok tuşları için o yöndeki en yakın hücre (yana sapma 2× cezalı).
- `components/Canvas.tsx`: istemci bileşeni oldu.
  - Hücrelere `data-cell-id`; renk `style.fill` ile (CSS'teki `fill: transparent` sunum özniteliğini ezdiği için öznitelik değil stil).
  - İşaretçi olayları SVG'de: `elementFromPoint` ile parmağın altındaki hücre bulunur (sürüklemede `pointer capture` olsa da doğru hücre).
  - Yakınlaştırma: `.canvas-viewport` (overflow: auto) içinde SVG genişliği `zoom × 100%`. `applyZoom(yeni, from, to)` genişliği doğrudan DOM'a yazar ve kaydırmayı aynı anda düzeltir (`from` altındaki nokta `to`ya gelir). Düğmeler ×1.5 adım, %100–%400.
  - İki parmak: ikinci parmak inince `cancelStroke` + pinch modu; mesafe oranı yakınlaştırır, orta nokta kaydırır. Tüm parmaklar kalkana kadar boyama yok.
  - Klavye: tuval `tabIndex=0`, `role="application"`; oklar `findNeighbor` ile gezinir, Enter/Boşluk boyar (aynı renk siler), +/− yakınlaştırır. Odaklı hücre yalnız `:focus-visible` iken turuncu çerçeveyle görünür. `aria-live` bölgesi seçili hücreyi okur.
- `components/ZoomControls.tsx` (yeni): −, yüzde (bas: %100'e dön), + düğmeleri; sınırda `disabled`.
- `components/ToolBar.tsx`: geri al / yinele / temizle depoya bağlandı (gerçek `disabled`), Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y kısayolları; sonda seçili rengi gösteren düğme Renkler panelini açar.
- `components/Notebook.tsx`: `openColors` geri çağrısı ToolBar'a verildi.
- `components/Panel.tsx`:
  - Renkler: 8 hazır renk gerçek `button` (`aria-label` renk adı, `aria-pressed`), son kullanılanlar (boşken "boyadıkça burada birikir."), tarayıcının `<input type="color">` seçicisi + hex gösterimi.
  - Odak döngüsü artık `input`'u da içeriyor ve **gizli yapraklardaki** düğmeleri dışarıda bırakıyor (önceden `hidden` paneldeki öğeler de sayılıyordu; Adım 2'de etkin düğme olmadığı için görünmüyordu).
  - Panel kapanınca odak onu açan öğeye döner (ayraç ya da renk düğmesi).
- `app/globals.css`: viewport, `touch-action: none`, odak çerçevesi, yakınlaştırma düğmeleri, renk düğmeleri (34px), renk girişi stilleri, devre dışı araç rengi.
- Testler: `lib/paintStore.test.ts` (13), `lib/templates/neighbors.test.ts` (5: Kare'de yönler, kenar = null, her şablonda tüm hücrelere oklarla ulaşılabilirlik).
- Ekran görüntüleri: `docs/screenshots/step3-*.png` (4 dosya, her biri <220 KB).

## Komutlar ve gerçek çıktılar
`npm test` (PowerShell, `C:\Users\sec\Desktop\polygo`):
```
 Test Files  3 passed (3)
      Tests  38 passed (38)
```
(Adım 2'nin 20 testi + 13 depo + 5 komşu.)

`npm run lint`:
```
> polygo@0.1.0 lint
> eslint .
```
(uyarı/hata yok)

`npm run build`:
```
✓ Compiled successfully
  Finished TypeScript ...
✓ Generating static pages using 4 workers (3/3)
Route (app)
┌ ○ /
└ ○ /_not-found
```

`npm install zustand@5 --save-exact` sonunda npm audit uyarısı verdi ("To address all issues, run: npm audit fix"); incelenmedi, `audit fix` çalıştırılmadı.

## Tarayıcı doğrulaması
Yöntem: üretim sunucusu (`npm run start -p 3123`) + başsız Chrome 157, Chrome DevTools Protocol ile gerçek fare ve **dokunma** olayları
(`Input.dispatchMouseEvent`, `Input.dispatchTouchEvent`, mobilde `setTouchEmulationEnabled` + `mobile: true`, 375×812, DPR 2).
Betik repoda değil (geçici klasörde). Tuval şu an yalnız Kare'yi gösterdiği için Dörtlü ve Çapraz testinde `Notebook.tsx` geçici olarak
`getTemplate("cross")` / `getTemplate("diagonal")` yapıldı, derlendi, test edildi ve **geri alındı** (diff'te Notebook'ta yalnız `openColors` var).

Üç şablonda da sonuç aynı (hepsi OK):
```
OK   masaüstü tık tek hücre boyar
OK   masaüstü sürükleme hücreleri boyar
OK   geri al sürüklemeyi tek adımda geri alır
OK   yinele geri getirir
OK   seçilen renkle boyar — rgb(217, 72, 43)
OK   aynı renge tekrar tık siler
OK   temizle boşaltır
OK   Ctrl+Z temizlemeyi geri alır
OK   klavye: sağ ok + Enter → Kare ["7-7"], Dörtlü ["5-5-right"], Çapraz ["7-7-b"]
     DİKKAT: odak son tıklanan sağ alt hücredeydi. Kare ve Çapraz'da sağda hücre yok (kenar), Enter aynı hücreyi boyadı;
     yani tarayıcıda okla hücre değiştirme yalnız Dörtlü'de (5-5-left → 5-5-right) gerçekten gözlendi.
     Okların tüm hücrelere ulaştığı birim testte (neighbors.test.ts) denetleniyor.
OK   tek parmak sürükleme boyar
OK   iki parmak yakınlaştırır ve boyamaz — 100% → 400%, boyalı: 0
```
O4 ölçümü (375px; "etkin alan" = hücreye sığan en büyük daire: üçgende iç teğet daire, karede kenar/2):
```
Kare    100%: 39.4px  → + (1) 150%: 59.1px
Dörtlü  100%: 21.7px  → + (1) 150%: 32.5px → + (2) 225%: 48.7px
Çapraz  100%: 23.1px  → + (1) 150%: 34.6px → + (2) 225%: 51.9px
OK   dokunuş yalnız hedef hücreyi boyar (komşu boyanmaz) — 108 isabet / 108 dokunuş, 12 hücre, merkez ±15px
```
(Her şablonda görünür 12 hücre × 9 nokta: iç teğet daire merkezi ve 15px'e kadar 8 yöne kaydırılmış noktalar. Her dokunuştan sonra yalnız hedef hücre boyalı mı bakıldı.)

Görsel kontrol (ekran görüntülerine bakıldı):
- `docs/screenshots/step3-desktop.png` — 1280×800, Kare, boyanmış L şekli; araç çubuğunda seçili renk (kiremit), altta "− 100% +".
- `docs/screenshots/step3-desktop-colors.png` — Renkler paneli açık: 8 hazır renk (kiremit seçili halkalı), son kullanılanlar, özel renk + `#d9482b`.
- `docs/screenshots/step3-mobile-375-cross-zoom.png` — 375px, Dörtlü %225: üçgenler büyük, sürüklemeyle boyanmış 3 üçgen; tuval kendi penceresinde kayıyor, sayfa düzeni bozulmuyor.
- `docs/screenshots/step3-mobile-375-colors.png` — 375px, alttan açılan renk paneli, renk düğmeleri iki satır.

## İddialar
1. Tıkla ve sürükle boyama, seçili renkle; aynı renkte hücreye dokunmak siler.
2. Bir sürükleme tek geri alma adımı; geri al / yinele / temizle çalışır, temizle geri alınabilir; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
3. Serbest renk seçici (`input type=color`), 8 hazır renk, en çok 6 son kullanılan renk.
4. O4 kabul ölçütü dokunma emülasyonunda sağlandı: 375px'te her şablonda en çok 2 "+" dokunuşuyla **tüm hücrelerde** ≥44px çaplı daire sığıyor (geometrik ölçüm, tüm hücreler);
   dokunma isabeti **görünür 12 hücrede** 9'ar noktayla denendi, komşu hücre boyanmadı.
5. İki parmak hareketi yakınlaştırır/kaydırır, boyama bırakmaz ve geçmişe yazmaz (depo testi + tarayıcı).
6. Tuval klavyeyle kullanılabilir: odak, oklarla tüm hücrelere ulaşım (test), Enter/Boşluk boyama, +/−.
7. build, lint, test (38/38) temiz.

## Şüpheler / bilinen eksikler
- **Gerçek telefonda denenmedi.** Dokunma, Chrome emülasyonunda. iOS Safari'de iki parmak hareketinin sayfa yakınlaştırmasına kaçıp kaçmadığı (`touch-action: none` desteklenir ama denenmedi) bilinmiyor.
- İki parmakla yakınlaştırırken ilk parmak bir an hücreyi boyar, ikinci parmak gelince geri alınır: kısa bir yanıp sönme görülebilir.
- Yakınlaşınca tek parmak her zaman boyar; tek parmakla kaydırma yok. Telefonda kaydırma yalnız iki parmakla (ya da %100'e dönüp tekrar yakınlaşarak). Masaüstünde fare tekeri / kaydırma çubuğu.
- Masaüstünde kaydırma çubukları yakınlaşınca görünür ve tuvalin genişliğinden birkaç piksel yer.
- Masaüstünde panel açıkken arka plan katmanı tuvali kaplar: ilk tıklama paneli kapatır, boyamaz (Adım 1'den gelen davranış).
- Ayrı silgi yok; "aynı renge dokun = sil" kuralı keşfedilmeyebilir (panel notunda ve tuvalin `aria-label`'ında yazıyor).
- `aria-live` hücre id'sini okur ("5-5-right"): insan dostu değil.
- `role="application"` ekran okuyucunun gezinme kısayollarını kapatır; bilinçli seçim ama tartışılabilir.
- Global Ctrl+Z kısayolu her yerde çalışır (ör. odak renk girişindeyken de).
- Boyama tek şablon için; şablon değişince `fills` ve `focusedId` ne olacak kararı Adım 4'e kaldı.
- Geçmiş her adımda tüm `fills` nesnesinin kopyasını tutar (en çok 100); 144 hücrelik şablonlarda sorun değil, çok büyük şablonlarda düşünülmeli.
- Masaüstünde tuval tıklamasının fareyle hover durumu (imleç `crosshair`) yalnız stil; hover vurgusu yok.
- npm audit uyarısı incelenmedi.

## Karar notları
- Yakınlaştırma CSS `transform` yerine SVG genişliği + yerel kaydırma ile: masaüstünde kaydırma çubuğu/teker bedava gelir, `elementFromPoint` doğru çalışır, çizgiler `non-scaling-stroke` ile ince kalır.
- `applyZoom` genişliği React'i beklemeden DOM'a yazar, çünkü kaydırma düzeltmesi yeni boyutu hemen okumalı. React aynı değeri yazdığı için çakışma yok.
- Hücre bulma `elementFromPoint` ile: geometri hesabı yok, şablon ne olursa olsun tarayıcının isabet testi kullanılır.
- Geri alma için anlık görüntü (komut kaydı değil): en basit ve okunaklı.

## Nasıl kontrol ederim
1. `npm install`, `npm run dev`, `http://localhost:3000`.
2. Masaüstü: hücreye tıkla, sürükle; aynı hücreye tekrar tıkla (siler). Sağdaki "Renkler" ayracı ya da sağ üstteki renk dairesi → renk seç / özel renk. Geri al / yinele / temizle ve Ctrl+Z.
3. Tab ile tuvale gel: oklar, Enter, +/−.
4. Telefon ya da DevTools cihaz modu (375px, dokunma): "+" ile yakınlaştır, tek parmakla boya, iki parmakla yakınlaştır/kaydır; yüzde düğmesi %100'e döndürür.
5. Diğer şablonları denemek için geçici olarak `components/Notebook.tsx`'te `DEFAULT_TEMPLATE` yerine `getTemplate("cross")` (şablon seçimi Adım 4'te).
6. `npm test`, `npm run lint`, `npm run build`.
