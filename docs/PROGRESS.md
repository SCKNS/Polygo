# Polygo: İlerleme

## Durum
- Şu anki adım: Adım 1 — kurulum ve defter arayüzü
- Durum: İNCELEME BEKLİYOR
- Son onaylanan commit: yok
- Önerilen commit mesajı: Adım 1: defter arayüzü kuruldu

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
- Build ve lint başarılı; üretim sunucusu HTTP 200 döndürdü.
- Tarayıcı bağlantısı bulunmadığından masaüstü/mobil görsel kontrol ve ekran görüntüleri doğrulanmadı.
- Boyama, şablon değiştirme, indirme ve kalıcı kayıt eklenmedi.
- Commit/push yapılmadı; onay sonrası kimlik kontrolü yapılmalı.

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
