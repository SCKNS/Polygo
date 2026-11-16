# Polygo: İlerleme

## Durum
- Şu anki adım: Adım 3 — boyama (tıkla/sürükle, renkler, geri al, temizle, yakınlaştırma)
- Durum: ONAYLANDI (2. tur: denetçi düzeltmeleri — hızlı sürükleme, pointercancel, mobil panel kaydırma), commit edildi
- Son onaylanan commit: 22df4d9 Adım 2: şablon verisi ve SVG ızgara
- Önerilen commit mesajı: Adım 3: hücre boyama ve yakınlaştırma

## Adım planı
Her adım tek oturumda yapılır, bitince incelemeye gider, onaylanmadan sonraki adıma geçilmez.

1. **Kurulum + defter arayüzü iskeleti:** Next.js/TS/Tailwind kurulumu, .gitignore, krem zeminli defter sayfası,
   sol spiral teller, sağ sekme ayraçları (Şablonlar, Renkler, İndir), ayracın açtığı küçük panel (içi boş/yer tutucu),
   ortada yer tutucu tuval. Masaüstü + mobil düzen. İşlev yok, sadece sekme açıp kapama.
2. **Şablon veri yapısı + tuvalde ızgara:** Hücre/şablon tipleri, ilk 2-3 şablon, SVG tuvalde çizim.
3. **Boyama:** Hücreye tıkla/sürükle boya, serbest renk seçici, hazır ve son kullanılan renkler, geri al, temizle (Zustand).
4. **Tam sayfa sonsuz ızgara:** Defter sayfasının içi yalnız ızgara (kullanıcı kararı, Adım 3 incelemesi sırasında).
   Izgara her yöne sınırsız; kaydırma (masaüstü teker/sürükleme, mobil iki parmak) ve yakınlaştırma. Görünen alanın hücreleri
   o an üretilir; hücre id'leri dünya koordinatı (`x-y`, `x-y-a` ...) olarak kalır, negatif koordinat da olabilir.
   İndirmede (Adım 6) yalnız boyalı hücrelerin çevresi kırpılır. Şablonlar sabit boyutlu tuval değil, tekrar eden desen olur.
5. **Şablon paleti:** Çok sayıda şablon, panelde küçük önizlemeler, seçince tuval değişir.
6. **İndirme:** SVG ve şeffaf PNG (arka plan rengi seçilebilir ya da şeffaf), hücre arası çizgi sorunu çözülür.
7. **Kayıt:** Çalışma localStorage'da saklanır, sayfa yenilenince geri gelir.
8. **Cila ve yayın:** Testler (Vitest), erişilebilirlik, README (ekran görüntüleri + teknik kararlar), Vercel yayını.

## Bilinen kararlar / açık sorular
- Tasarım kararları proje kurallar dosyasında.
- Vurgu: #D9482B. El yazısı: Caveat; arayüz: DM Sans (latin-ext).
- Şablonlar `lib/templates/` altında veri: hücre = köşe noktaları (çokgen), birim = bir kare kenarı.
- Hücre id'leri kalıcı (`x-y`, `x-y-a`, `x-y-top` ...); Adım 3'te boyama bu id'lerle tutulacak.
- İlk şablonlar: Kare (8×8), Çapraz (8×8, 2 üçgen/kare), Dörtlü (6×6, 4 üçgen/kare).
- Adım 2: build, lint ve test (20/20) temiz; üretim sunucusu 200, 64 hücre render edildi.
- Tuval şimdilik yalnızca varsayılan şablonu (Kare) gösterir; şablon seçimi Adım 4'te.
- Vitest Adım 2 düzeltmesinde kuruldu (denetçi kalıcı geometri testi istedi): `lib/templates/templates.test.ts`.
- Hücre sözleşmesi: her hücre dışbükey çokgendir; test basitliği (öz-kesişme yok) + dışbükeyliği, ikili örtüşmeyi (ayırıcı eksen) ve alan toplamını
  toleranslı (EPSILON = 1e-9), örneklemesiz denetler; yardımcıların negatif testleri var (yıldız, kelebek, içbükey).
- Yeni şablon eklemek 3 yer: `TemplateId`, `TEMPLATES` girdisi, testteki `EXPECTED_CELL_COUNTS` (unutulursa tsc hata verir).
- Windows notu: `npm test` küçük harfli sürücü yolundan (`c:\...`) çalışınca Vitest "reading 'config'" hatası verir;
  büyük harfli `C:\...` yolundan çalıştırın. Linux/Vercel etkilenmez.
- O4 (dokunma hedefi) için kullanıcı **yakınlaştırmayı** seçti (Adım 3 başı). +/− düğmeleri (×1.5, %100–%400), iki parmakla
  yakınlaştırma/kaydırma, klavyede +/−. Dokunma emülasyonunda ölçüldü: 375px'te Dörtlü ve Çapraz 2 dokunuşta (%225), Kare 1 dokunuşta (%150)
  her hücreye ≥44px çaplı daire sığıyor; merkez ±15px dokunuşlarda komşu hücre boyanmadı. Gerçek telefonda denenmedi.
- Boyama durumu: `lib/paintStore.ts` (Zustand). Hücre id -> hex renk; bir sürükleme = bir geri alma adımı; geçmiş en çok 100.
  Aynı renkle boyalı hücreye dokunmak siler (ayrı silgi yok). Son kullanılan renkler yalnız boyamada güncellenir (en çok 6).
- Boyama tek bir şablon için tutuluyor; şablon değişince ne olacağı (ayrı kayıt mı, temizleme mi) şablon paleti adımında karar.
- Adım 4 kararları (kullanıcı): sonsuz ızgara; ayrı adım; "defterin içi sınırsız ızgara olsun sadece" — sayfa içindeki logo, araç çubuğu,
  tuval altı notu ve sayfa altı yazıları sayfanın içinden kalkar. AÇIK SORU (Adım 4 başında sorulacak): logo ve araçlar nereye
  (defterin dışında masa üstünde mi, ayraçlara mı taşınır?).
- Erişilebilirlik borcu (denetçi, Adım 3): tuvalin ekran okuyucu modeli yetersiz (`role="application"`, hücre id'si okunuyor,
  boyalı hücre yapısı gezilemiyor). Adım 8'de (ya da ızgara modeli oturduktan sonra) ele alınacak.
- Tarayıcı doğrulama betiği: `scripts/verify-paint.mjs` (kullanımı dosyanın başında).
- `getTemplate` yalnız `TemplateId` alır; kayıttan gelen bilinmeyen kimliği varsayılana düşüren kontrol Adım 6'da.
- Görsel kontrol: yerel Chrome headless ekran görüntüsü (masaüstü 1280px, mobil 375px iframe). Hover/tık bu yolla doğrulanmaz.

## DENETÇİYE VER şablonu
Adım sonunda kullanıcıya bu blok, boşlukları doldurularak verilir:

```
Sen sıkı bir kod denetçisisin. Projeyi sen yazmadın, kayırma yapma.
Proje: Polygo (şablon ızgarasında hücre boyayarak logo tasarlayıp SVG/PNG indiren web sitesi).
Teknoloji: TypeScript, React, Next.js, Tailwind, Zustand.
Denetlenen adım: Adım <N>: <amaç>

Ekte: docs/REVIEW.md (iddialar, çıktılar, şüpheler) ve docs/review_diff.patch (değişiklik).

Yap:
1. REVIEW.md'deki her iddiayı diff ve çıktılarla karşılaştır; kanıtsız iddiayı işaretle.
2. Hataları, eksik kenar durumlarını, erişilebilirlik ve mobil sorunlarını bul.
3. Gereksiz karmaşıklığı ve acemi için fazla soyut kodu işaretle.
4. Bulguları önem sırasına göre listele: kritik / orta / küçük. Her bulgu için dosya ve satır ver.
5. Kod yazma; yalnızca bulguları ve önerilen düzeltmeyi söyle.
```
