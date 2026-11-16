# Polygo: İlerleme

## Durum
- Şu anki adım: Adım 2 — şablon veri yapısı + tuvalde ızgara
- Durum: ONAYLANDI (4. tur: O1 öz-kesişme kontrolü eklendi), commit edildi
- Son onaylanan commit: 9ce2d9b Adım 1: Defter arayüzü iskeleti
- Önerilen commit mesajı: Adım 2: şablon verisi ve SVG ızgara

## Adım planı
Her adım tek oturumda yapılır, bitince incelemeye gider, onaylanmadan sonraki adıma geçilmez.

1. **Kurulum + defter arayüzü iskeleti:** Next.js/TS/Tailwind kurulumu, .gitignore, krem zeminli defter sayfası,
   sol spiral teller, sağ sekme ayraçları (Şablonlar, Renkler, İndir), ayracın açtığı küçük panel (içi boş/yer tutucu),
   ortada yer tutucu tuval. Masaüstü + mobil düzen. İşlev yok, sadece sekme açıp kapama.
2. **Şablon veri yapısı + tuvalde ızgara:** Hücre/şablon tipleri, ilk 2-3 şablon, SVG tuvalde çizim.
3. **Boyama:** Hücreye tıkla/sürükle boya, serbest renk seçici, hazır ve son kullanılan renkler, geri al, temizle (Zustand).
4. **Şablon paleti:** Çok sayıda şablon, panelde küçük önizlemeler, seçince tuval değişir.
5. **İndirme:** SVG ve şeffaf PNG (arka plan rengi seçilebilir ya da şeffaf), hücre arası çizgi sorunu çözülür.
6. **Kayıt:** Çalışma localStorage'da saklanır, sayfa yenilenince geri gelir.
7. **Cila ve yayın:** Testler (Vitest), erişilebilirlik, README (ekran görüntüleri + teknik kararlar), Vercel yayını.

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
- **AÇIK — Adım 3 engeli (O4, dokunma hedefi):** 375px'te Dörtlü üçgenleri ~22-27px, Çapraz kareleri ~33-40px.
  Boyama kodu yazılmadan önce yöntem kullanıcıyla seçilir (yakınlaştırma / mobilde daha seyrek şablon / koordinata göre hücre seçimi).
  Kabul ölçütü: 375px genişlikte her şablonda, hedeflenen hücre parmakla en az ~44×44 CSS px'lik etkin alanla seçilebilmeli
  (gerekirse yakınlaştırarak); bir dokunuş komşu hücreyi boyamamalı; bu, gerçek telefonda ya da dokunma emülasyonunda denenip REVIEW'e yazılır.
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
