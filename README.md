# Polygo

Sıcak kâğıt tonlarında, geometrik logo aracının ilk ekranı. Bu aşamada yalnızca arayüz kabuğu vardır: sekmeler ve paneller çalışır; çizim, şablon değiştirme ve indirme henüz uygulanmaz.

## Çalıştırma

Node.js 20.9 veya üzeri gerekir.

```sh
npm ci
npm run dev
```

Windows PowerShell betik yürütmesini engelliyorsa `npm.cmd` kullanın. `http://localhost:3000` adresini açın. İlk derleme Google Fonts erişimi gerektirir; fontlar daha sonra Next.js tarafından yerel sunulur.

```sh
npm run lint
npm run build
npm start
```

## Dosya ağacı

```text
app/
  globals.css          renkler, düzen, hareket ve mobil kurallar
  layout.tsx           Türkçe dil, metadata ve next/font
  page.tsx             ilk ekran
components/
  Notebook.tsx         yalnızca açık panel durumu ve sayfa düzeni
  Spiral.tsx           SVG cilt telleri
  WordMark.tsx         el yazısı ve altıgen
  ToolBar.tsx          pasif araçlar
  Canvas.tsx           statik 9×9 örnek
  Tabs.tsx             sekmeler ve ok tuşları
  Panel.tsx            panel içeriği, odak ve kapatma
docs/
  PROGRESS.md          adım durumu
  REVIEW.md            doğrulama ve inceleme notları
  SOURCE.md            kaynak dosyaların tam kodu
  review_diff.patch    yerel inceleme farkı; Git'e alınmaz
.gitignore
eslint.config.mjs
postcss.config.mjs
tsconfig.json
package.json
package-lock.json
README.md
```

`next-env.d.ts`, `.next/` ve `node_modules/` otomatik üretilir. Yeni create-next-app projesinde aynı adlı kaynak/config dosyalarını buradakilerle değiştirin; başka bir UI paketi gerekmez.

## Tasarım kararları

- Caveat el yazısı, DM Sans küçük arayüz metinleri için seçildi. Her ikisi `latin-ext` ile yüklenir.
- Renkler briefteki paletle sınırlı. Küçük metinlerde AA kontrastı için tam mürekkep rengi kullanıldı; soluk ton büyük el yazısı ve çizgilerde kaldı.
- Statik P işareti, çizim alanının ne işe yarayacağını anlatır. Açılış yaklaşık 1,6 saniye sürer; sürekli animasyon yoktur.
- Masaüstünde sağ ayraçlar, mobilde alt şeritler ve üst spiral kullanılır. Mobil tuval genişliği 320px ekranda 264px, 375px ekranda 319px olur.
- Boyama, indirme, renk seçimi ve geri alma bilinçli olarak bu adımın dışındadır. Yeni durum kütüphanesi eklenmedi.

## İnceleme

320px, 375×812 ve 1440×900 boyutlarında kontrol edin. Sekmeye tıklayın, aynı sekmeyle kapatın; ok tuşları, Home/End, Tab/Shift+Tab, Escape ve dışarı tıklamayı deneyin. Mobilde paneli aşağı kaydırın. İşletim sisteminde hareketi azaltmayı açarak tekrar kontrol edin.

Bu oturumda tarayıcı bağlantısı olmadığı için ekran görüntüsü ve görsel Türkçe glif kontrolü doğrulanamadı. Derleme ve lint sonuçları `docs/REVIEW.md` içindedir.
