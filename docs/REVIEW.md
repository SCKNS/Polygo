# İnceleme: Adım 4 düzeltmesi — Boşluk + sürükle ile kaydırma, kahverengi cam ada

## Amaç
Adım 4 (sonsuz ızgara) commit'inden sonra kullanıcı iki şey istedi:
1. Masaüstünde fareyle sağa/sola kaydırma: "normal uygulamalardaki gibi klavyede bir şeye basıp mouse ile kaydırma".
   Çizim programlarındaki yaygın kalıp seçildi: **Boşluk basılı + sol tuşla sürükle** (el aracı).
2. Ada (dynamic island) siyah olmasın; defter tonlarında kahverengi, "liquid glass" görünümünde olsun.

Kullanıcının üçüncü notu ("şablonlar seçilemiyor") bu düzeltmeye **dahil edilmedi**: şablon seçimi planda Adım 5,
oturum kuralı tek adım. Panel hâlâ yer tutucu; Adım 5'te yapılacak.

## Değişiklikler
- `components/Canvas.tsx`
  - Pencereye `keydown`/`keyup`/`blur` dinleyicileri: Boşluk basılıyken `spaceHeld` true, SVG'ye `data-space` (imleç: el).
    Odak düğme / input / textarea / select / contenteditable içindeyse Boşluk dokunulmaz (`isControl`), o öğenin işi kalır.
    Diğer durumlarda `preventDefault` (sayfa kaymasın); tuş tekrarı yok sayılır; pencere odağı kaybedince bırakılmış sayılır.
  - `handlePointerDown`: orta tuşa ek olarak, Boşluk basılıyken sol tuş da kaydırma başlatır (mevcut `panning` yolu kullanılır).
  - Klavyeyle boyama: Enter `keydown`'da boyar (değişmedi). Boşluk artık `keyup`'ta boyar ve basılıyken fareyle kaydırma
    yapıldıysa boyamaz (`spaceUsedForPan`). Ortak kısım `paintFocused()` fonksiyonuna alındı.
  - `aria-label`'a "Boşluğu basılı tutup fareyle sürüklemek kaydırır" eklendi.
- `app/globals.css`
  - `.island`: düz `var(--ink)` yerine iki katmanlı gradyan (üstte ince ışık + kahverengi yarı saydam gövde),
    `backdrop-filter: blur(14px) saturate(160%)`, ince açık kenar, iç üst ışık / iç alt gölge, kahve tonlu gölge.
    Yeni değişkenler: `--island-glass`, `--island-glass-deep`. `--island-muted` 0.32 → 0.4 (kahve zeminde pasif öğeler okunsun).
  - `.drawing-canvas[data-space] { cursor: grab; }` (sürüklerken mevcut `grabbing`).
- `docs/PROGRESS.md`: durum, kamera notu, ada notu, şablon seçimi notu.
- `docs/screenshots/step4fix-desktop.png`, `docs/screenshots/step4fix-mobile.png` (yeni).

## Komutlar ve gerçek çıktılar
`npm run lint`:
```
> polygo@0.1.0 lint
> eslint .
```
(hata/uyarı yok)

`npm test` (C:\ yolundan):
```
 Test Files  5 passed (5)
      Tests  62 passed (62)
```

`npm run build`:
```
✓ Generating static pages using 4 workers (3/3) in 733ms
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

Tarayıcı (üretim sunucusu :3123, headless Chrome, CDP ile gerçek klavye + fare olayları; betik depoya eklenmedi):
```
cursor while space: grab
space+drag viewBox -14.65 -8.525 29.3 17.05 -> -9.65 -6.025 29.3 17.05 OK moved
space+drag painted 0 -> 0 OK
plain drag painted 0 -> 3 OK OK cam same
island: linear-gradient(rgba(255, 240, 220, 0.16) 0%, rgba(255, 240, 220, 0) 46%), linea | blur(14px) saturate(1.6)
```
Yani: Boşluk + 200×100 px sürükleme kamerayı 5×2.5 kare kaydırdı (%100'de 40px/kare) ve hiçbir hücre boyanmadı;
Boşluk bırakılınca da boyama olmadı. Boşluksuz sürükleme 3 hücre boyadı, kamera yerinde kaldı.

## Ekran görüntüleri
- Masaüstü 1280px: `docs/screenshots/step4fix-desktop.png` — ada kahverengi cam, krem metin/ikonlar okunuyor.
- Mobil 375px: `docs/screenshots/step4fix-mobile.png` — ada aynı görünümde, spiral ve alt ayraçlar değişmedi.

## İddialar
1. Boşluk basılıyken sol tuşla sürüklemek tuvali kaydırır, boyamaz (tarayıcıda ölçüldü).
2. Boşluk basılıyken imleç el (grab) olur (computed style ölçüldü).
3. Normal sürükleme eskisi gibi boyar (ölçüldü).
4. Ada artık siyah değil; kahverengi yarı saydam cam (computed style + ekran görüntüsü).
5. Lint, test, build temiz.

## Şüpheler
- **Boşlukla klavye boyaması davranışı değişti:** önceden `keydown`'da boyuyordu, şimdi `keyup`'ta. Tuşu basılı tutmak artık
  tekrar tekrar boyamaz/silmez (önceden tekrar olayları aç-kapa yapabiliyordu; bu daha iyi ama farklı). Doğrudan ölçülmedi.
- `handleKeyUp` (React) ile pencere `keyup` dinleyicisinin sırasına güveniliyor: React kök kapsayıcıda dinlediği için
  pencere dinleyicisinden önce çalışır. Bu React'in bilinen davranışı ama örtük bir bağımlılık; yorumda belirtildi.
- Boşluk basılıyken fare tuvalin dışından gelirse ya da tuşa ada düğmesi odaklıyken basılırsa kaydırma olmaz (bilinçli: düğme Boşluğu kullanır).
  Kullanıcı ada düğmesine tıklayıp sonra Boşluk+sürükle denerse çalışmadığını düşünebilir. Tıklanan düğmeden odak kalkmıyor.
- `backdrop-filter`'ın etkisi az görünür: ada masanın düz renginin üstünde duruyor, arkasında bulanacak bir şey yok.
  "Liquid glass" hissi esas olarak gradyan + iç ışık çizgisiyle veriliyor. Kullanıcı daha belirgin cam isterse ada sayfanın üstüne bindirilebilir.
- Kahve zemin üzerindeki pasif (disabled) öğeler kasıtlı olarak soluk; kontrastları WCAG eşiğinin altında (pasif öğeler muaf).
  Etkin krem (#f7f2e8) metin ile ada gövdesi (~#5a3f2b) arası kontrast yüksek, ama tam değer ölçülmedi (yarı saydamlık nedeniyle).
- Mobilde Boşluk yok; kaydırma eskisi gibi iki parmakla. Gerçek telefonda denenmedi.
- Hover ve gerçek fare hissi yalnız CDP olaylarıyla denendi, elle denenmedi.

## Karar notları
- Tuş olarak Boşluk seçildi (Figma, Photoshop, Miro vb. ortak alışkanlığı). Orta tuşla kaydırma ve teker kaydırma aynen duruyor.
- Şablon seçimi bilinçli olarak dışarıda: Adım 5.

## Nasıl kontrol ederim
1. `npm run dev`, http://localhost:3000 aç.
2. Tuvalin üstünde Boşluk'u basılı tut: imleç el olmalı. Sol tuşla sürükle: ızgara kaymalı, hücre boyanmamalı. Boşluğu bırak: boyama olmamalı.
3. Boşluk olmadan sürükle: boyamalı.
4. Tuvali Tab ile odakla, ok tuşlarıyla hücre seç, Boşluğa bas-bırak: seçili hücre boyanmalı. Enter da boyamalı.
5. Adaya bak (masaüstü + tarayıcıyı 375px'e daralt): kahverengi cam, siyah değil.
