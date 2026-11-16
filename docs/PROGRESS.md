# Polygo: İlerleme

## Durum

- Şu anki adım: Adım 8 — cila, erişilebilirlik ve yayın
- Durum: YEREL DOĞRULAMA TAMAMLANDI
- Son doğrulama: 476 birim testi, ESLint, Next.js production build ve gerçek Chrome sürüm testi temiz
- Yayın: Vercel projesi bağlı; son sürüm dağıtımı ve canlı adres kontrolü bu değişikliklerin gönderilmesinden sonra yapılacak

## Adım planı

Her adım tek oturumda yapılır, bitince incelemeye gider, onaylanmadan sonraki adıma geçilmez.

1. ✅ **Kurulum + defter arayüzü iskeleti:** Next.js/TS/Tailwind kurulumu, .gitignore, krem zeminli defter sayfası,
   sol spiral teller, sağ sekme ayraçları (Şablonlar, Renkler, İndir), ayracın açtığı küçük panel (içi boş/yer tutucu),
   ortada yer tutucu tuval. Masaüstü + mobil düzen. İşlev yok, sadece sekme açıp kapama.
2. ✅ **Şablon veri yapısı + tuvalde ızgara:** Hücre/şablon tipleri, ilk 2-3 şablon, SVG tuvalde çizim.
3. ✅ **Boyama:** Hücreye tıkla/sürükle boya, serbest renk seçici, hazır ve son kullanılan renkler, geri al, temizle (Zustand).
4. ✅ **Tam sayfa sonsuz ızgara:** Defter sayfasının içi yalnız ızgara (kullanıcı kararı, Adım 3 incelemesi sırasında).
   Izgara her yöne sınırsız; kaydırma (masaüstü teker/sürükleme, mobil iki parmak) ve yakınlaştırma. Görünen alanın hücreleri
   o an üretilir; hücre id'leri dünya koordinatı (`x-y`, `x-y-a` ...) olarak kalır, negatif koordinat da olabilir.
   İndirmede (Adım 6) yalnız boyalı hücrelerin çevresi kırpılır. Şablonlar sabit boyutlu tuval değil, tekrar eden desen olur.
   Logo, araçlar ve yakınlaştırma defterin dışında, masada duran hap biçimli "ada"ya taşınır (kullanıcı: "dynamic island şeklinde").
5. ✅ **Şablon paleti:** Çok sayıda şablon, panelde küçük önizlemeler, seçince tuval değişir.
   Kullanıcı isteği (videodaki gibi): farklı geometrik şekillerin birleşiminden oluşan desenler (daire, yay, altıgen, üçgen, sekizgen...).
6. ✅ **İndirme:** SVG ve şeffaf PNG (arka plan rengi seçilebilir ya da şeffaf), hücre arası çizgi sorunu çözülür.
7. ✅ **Kayıt:** Çalışma localStorage'da saklanır, sayfa yenilenince geri gelir.
8. ⏳ **Cila ve yayın:** Testler (Vitest), erişilebilirlik ve README tamamlandı; Vercel canlı dağıtım kontrolü kaldı.

## Bilinen kararlar / açık sorular

- Tasarım kararları proje kurallar dosyasında.
- Vurgu: #D9482B. El yazısı: Caveat; arayüz: DM Sans (latin-ext).
- Şablonlar `lib/templates/` altında veri; builder'lar `lib/templates/builders/` altında gruplara göre dosyalarda
  (`square.ts`, `curve.ts`, `brick.ts`, `hex.ts`; ortak yardımcılar `common.ts`). Birim = Kare şablonundaki bir kare kenarı (%100'de 40px).
  Adım 5'ten beri şablon dikdörtgen bir karonun (`tile: {width, height}`) tekrarıdır: `cellsInTile(col, row)` o karonun hücrelerini verir.
  Altıgen/üçgen desenleri dikdörtgene sığmadığından hücre karosundan en fazla bir karo taşabilir. `cellsInTiles` karo aralığı,
  `cellsInView` dünya alanı (+1 karo pay) için hücre üretir; `cellAt` noktanın karosu + çevresindeki 8 karoda geometriyle arar.
- Hücre = `{ id, points, d }`, `shape.ts`'teki `shape(id, parçalar)` ile üretilir. Parça = köşe ya da yay (merkez, yarıçap, açılar).
  `d` çizim içindir ve yaylar gerçek SVG `A` komutudur; `points` isabet testi/geometri testleri içindir, yaylar 7.5°'lik parçalarla
  yaklaşık verilir ve ilk erişimde hesaplanır (tembel). Yaylı şablonlarda çizgi yolu 1280×800'de 1.2 MB'tan ~170 KB'a, üretim ~40 ms'den ~8 ms'ye indi.
- Hücre id'leri kalıcı (`x-y`, `x-y-a`, `x-y-top` ...); Adım 3'te boyama bu id'lerle tutulacak.
- İlk şablonlar: Kare (1 hücre/kare), Çapraz (2 üçgen/kare), Dörtlü (4 üçgen/kare). Adım 4'e kadar 8×8 / 6×6 sabit tuvaldi.
- Adım 5 şablonları: önce 15, kullanıcı "2-3 katı" isteyince 42 (aynı adımda, inceleme öncesi). Dört grup (`Template.group`,
  panelde el yazısı başlık): Kare (12), Yay (12), Taş örgü (6), Üçgen ve altıgen (12). Grup sırası `TEMPLATE_GROUPS`'ta.
  Komşu karolarda aynalanan: Dalga, Halka, Zikzak, Çiçek, Hasır; Kemer'de tek satırlar kayar. Kıvrım (Truchet) karonun yönünü
  koordinattan hesaplanan "yazı-tura" ile seçer (`coinFlip`): rastgele görünür ama hep aynıdır, id'ler değişmez.
  Büyük karolu olanlar: Balıksırtı 2×2, İki kare 2.5×2.5, Parke 1.5×1.5, Merdiven 1×2, Petek halka / İnce üçgen / Altıgen + kare 2 × 2√3.
- Adım 2: build, lint ve test (20/20) temiz; üretim sunucusu 200, 64 hücre render edildi.
- Vitest Adım 2 düzeltmesinde kuruldu (denetçi kalıcı geometri testi istedi): `lib/templates/templates.test.ts`.
- Hücre sözleşmesi (Adım 5'te genişledi): hücre BASİT çokgendir, İÇBÜKEY olabilir (daire çevresindeki parçalar); ağırlık merkezi kendi içindedir;
  karosundan en fazla bir karo taşar. Test: basitlik, sıfır kenar yok, merkez içeride, taşma sınırı, ikili örtüşme (kenar kesişmesi +
  köşe/kenar ortası/merkez diğerinin içinde mi; 6×6 karoluk bölgede iki karonun hücreleri), karo başına alan = karo alanı,
  `d`'nin uç noktaları `points`'te. Yardımcıların olumlu/olumsuz testleri var (yıldız, kelebek, L, artı biçimli kesişme).
- Şablon düğmeleri `data-template` (kimlik) taşır; tarayıcı betiği düğmeyi kimlikle bulur (gruplarda sıra numarası işe yaramaz).
- Yeni şablon eklemek 3 yer: `TemplateId`, `TEMPLATES` girdisi, testteki `EXPECTED_CELLS_PER_TILE` (unutulursa tsc hata verir).
- Windows notu: `npm test` küçük harfli sürücü yolundan (`c:\...`) çalışınca Vitest "reading 'config'" hatası verir;
  büyük harfli `C:\...` yolundan çalıştırın. Linux/Vercel etkilenmez.
- Kamera: `lib/camera.ts` (saf hesaplar, testli) + `lib/viewStore.ts` (Zustand). Kamera = ekran ortasındaki dünya noktası + yakınlaştırma;
  %100'de bir kare 40px, %100–%400. Teker kaydırır, Shift+teker yatay, Ctrl/Cmd+teker (dokunmatik yüzeyde sıkıştırma) imleç çevresinde
  yakınlaştırır, orta tuşla ya da Boşluk basılıyken sol tuşla sürükleme kaydırır (el aracı; Boşluk tuvalde artık bırakılınca boyar,
  basılıyken kaydırma yapıldıysa boyamaz; odak yazı alanında ya da klavyeyle gelinen düğmedeyse Boşluk onlarındır. Fareyle tıklanmış
  düğmede (panel kapanınca odak ayraca döner) Boşluk düğmeyi bırakır ve el aracı olur; yoksa ilk tıklamadan sonra kaydırma bozuluyordu); mobilde iki parmak hem yakınlaştırır hem kaydırır. Klavyede seçili hücre kenara yaklaşınca görüş onu ortalar.
- Çizim: ızgara çizgileri tek `<path>`, yalnız boyalı hücreler `<polygon>`. Görünen aralık 4 karenin katlarına yuvarlanır; kaydırırken
  hücre listesi yalnız aralık değişince yeniden üretilir. En küçük yakınlaştırma bu yüzden %100 (4K ekranda ~9 bin Dörtlü hücresi).
- Adım 4 ölçümü (375px, dokunma emülasyonu): Kare %150'de (1 dokunuş), Dörtlü %338'de (3 dokunuş) her hücreye ≥44px daire sığıyor;
  Adım 3'te Dörtlü 2 dokunuştu (kare artık 60 değil 40px). Merkez ±15px dokunuşlarda komşu boyanmadı. Gerçek telefonda denenmedi.
- O4 (dokunma hedefi) için kullanıcı **yakınlaştırmayı** seçti (Adım 3 başı). +/− düğmeleri (×1.5, %100–%400), iki parmakla
  yakınlaştırma/kaydırma, klavyede +/−. Dokunma emülasyonunda ölçüldü: 375px'te Dörtlü ve Çapraz 2 dokunuşta (%225), Kare 1 dokunuşta (%150)
  her hücreye ≥44px çaplı daire sığıyor; merkez ±15px dokunuşlarda komşu hücre boyanmadı. Gerçek telefonda denenmedi.
- Boyama durumu: `lib/paintStore.ts` (Zustand). Hücre id -> hex renk; bir sürükleme = bir geri alma adımı; geçmiş en çok 100.
  Aynı renkle boyalı hücreye dokunmak siler (ayrı silgi yok). Son kullanılan renkler yalnız boyamada güncellenir (en çok 6).
- Şablon değişince (Adım 5 kararı): hücre id'leri şablona özgü olduğundan tuval boşalır; bu bir geri alma adımıdır. Geçmiş artık
  `{ templateId, fills }` saklar: geri al, önceki şablonu boyamasıyla geri getirir. Boş tuvalde şablon değiştirmek geçmişe yazılmaz.
  Seçili şablon `paintStore.templateId`'de (kayıt adımında localStorage'a bununla birlikte gider).
- Adım 4 kararları (kullanıcı): sonsuz ızgara; ayrı adım; "defterin içi sınırsız ızgara olsun sadece" — sayfa içindeki logo, araç çubuğu,
  tuval altı notu ve sayfa altı yazıları sayfanın içinden kalkar. Adım 4 başında soruldu: logo ve araçlar "masaüstü ama dynamic island
  şeklinde" → defterin üstünde ortalanmış hap (`components/Island.tsx`). Adım 4 düzeltmesinde kullanıcı isteğiyle siyah yerine
  defter tonlarında yarı saydam kahverengi "liquid glass" (gradyan + backdrop-filter + iç ışık çizgisi). Dar ekranda adada yalnız logo işareti, ≤420px'te % göstergesi gizli.
  Sayfa altı yazıları ve tuval altı notu kaldırıldı (yeri yok); dekoratif kağıt ızgarası da kalktı, gerçek ızgara onun yerini aldı.
- Şablon seçimi kullanıcı tarafından istendi (Adım 4 sonrası, "şablonlar seçilemiyor") ve Adım 5'te yapıldı: `components/TemplatePicker.tsx`.
  Önizlemeler elle çizilmiş ikon değil, şablon verisinden üretilir (3×3 birim). Panel uzun olduğundan masaüstünde de kayar.
- Klavye: ok tuşlarına ek olarak çaprazlar (Home ↖, Page Up ↗, End ↙, Page Down ↘; sayısal tuş takımı düzeni). Sekizgen gibi
  desenlerde köşe parçaları her komşunun tam çaprazındadır; dört yönle ulaşılamıyordu. Komşu seçiminde kenar paylaşan hücre önce gelir.
- `video/` (kullanıcının referans videosu, ~6 MB) repoya girmez: `.git/info/exclude`'a eklendi.
- Bu makinede git "dubious ownership" uyarısı veriyor (.git başka Windows kullanıcısına ait); komutlar `git -c safe.directory=C:/Users/sec/Desktop/polygo ...`
  ile çalıştırıldı, global ayar değiştirilmedi.
- Erişilebilirlik: tuvalin adı, ayrıntılı klavye yönergeleri, toplam/renk bazlı çizim özeti ve seçili hücrenin okunabilir dünya konumu
  ekran okuyucuya sunulur. Görsel hücre kimlikleri artık canlı bölgede okunmaz.
- Tarayıcı doğrulama betikleri: `scripts/verify-paint.mjs` (boyama/kamera, Kare'de) ve `scripts/verify-templates.mjs` (Adım 5: şablon seçimi,
  geri al, çapraz tuş, ekran görüntüleri). Kullanımları dosyaların başında.
- Windows notu: `next build` çalışan bir `next start`'ın altındaki `.next`'i değiştirir; eski sunucu stilsiz/eski sayfa verir. Doğrulamadan önce
  3123 portundaki süreci durdurup sunucuyu yeniden başlatın (komut satırında `next" start` geçer, `next start` diye aramak eşleşmez).
- Chrome notu: iki parmakla kaydırmadan ~100 ms içinde gelen dokunuşun `click` olayı yutuluyor (boyama pointerdown kullandığından etkilenmez).
- Kayıt `zustand/persist` ile hydration sonrasında yüklenir. Bilinmeyen şablon, geçersiz renk, hücre kimliği ve eski/bozuk veri
  `sanitizePersistedState` tarafından doğrulanır; geçersiz şablon Kare'ye düşer.
- Sayfa yakınlaşması (Adım 5 incelemesi öncesi, kullanıcı "site bozuldu"): tuval dışında touchpad sıkıştırması tarayıcıya kalıp bütün
  sayfayı büyütüyordu. `Canvas.tsx`'te `window` düzeyinde Ctrl/Cmd + teker engellenir, `.desk`'te `touch-action: pan-x pan-y`.
  Yakınlaşmış bir sekmede Ctrl+0 sayfayı düzeltir.
- Dev sunucusu tarayıcı testleri `localhost` ile açılmalı: `127.0.0.1` üzerinden Next dev JS'i engeller, sayfa hydrate olmaz.
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
