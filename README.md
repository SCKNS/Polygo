# Polygo

Polygo, tekrar eden geometrik ızgaralarda hücreleri boyayarak logo ve desen üretmeye yarayan Türkçe bir web uygulamasıdır. Çizim alanı her yönde sınırsızdır; çalışma SVG veya şeffaf/renkli PNG olarak indirilebilir.

Production: [polygo-app.vercel.app](https://polygo-app.vercel.app) _(Vercel Deployment Protection etkin olabilir.)_

## Özellikler

- Dört grupta 42 geometrik şablon
- Fare, dokunma ve klavyeyle hücre boyama
- Serbest renk seçici, hazır ve son kullanılan renkler
- Geri al, yinele ve temizle
- Kaydırılabilir ve %100–%400 yakınlaştırılabilir sonsuz ızgara
- Yalnız boyalı alanı kırpan, kayıpsız SVG ve 1024/2048/4096 px PNG indirme
- Çizimi, şablonu ve renk tercihlerini tarayıcıda otomatik saklama
- Masaüstü ve mobil düzen; azaltılmış hareket tercihi ve klavye kullanımı desteği

## Çalıştırma

Node.js 20.9 veya üzeri gerekir.

```sh
npm ci
npm run dev
```

Windows PowerShell betik yürütmesini engelliyorsa `npm.cmd` kullanın. Uygulama varsayılan olarak `http://localhost:3000` adresindedir.

## Kalite kontrolleri

```sh
npm test
npm run lint
npm run build
```

Gerçek tarayıcı testleri kayıt, erişilebilir açıklamalar ve indirilen SVG/PNG dosyalarını (piksel düzeyinde köşe,
dikiş, kenar ve kırpılma ölçümü; Chrome mobil emülasyonu) doğrular. Komut production sunucusunu ve headless Chrome'u
kendisi açıp kapatır; Chrome başka yerdeyse `CHROME_PATH` verin. Yayından önce hepsi birlikte:

```sh
npm run check:release   # lint + format + test + build + verify:browser
```

Bu testler fiziksel telefonun yerini tutmaz. Yayından önce iPhone Safari ve Android Chrome'da elle denenir
(`npm run dev`, aynı Wi-Fi'den `http://<bilgisayar-ip>:3000`); indirilen resim galeride tam ekran büyütülür:

1. Kare'de tek hücre, PNG 4096: dört köşe sivri.
2. Elmas'ta yalnız ortadaki baklava, SVG ve PNG 4096: dört uç kesilmemiş.
3. Kare'de 13 hücrelik yatay şerit, arka plan renkli, PNG 1024: sol/sağ kenarda şeffaf şerit yok.

Sonuç cihaz, işletim sistemi ve tarayıcı sürümüyle `docs/PROGRESS.md`'ye yazılır.

Boyama/kamera ve bütün şablonların ayrıntılı Chrome testleri sırasıyla `scripts/verify-paint.mjs` ve `scripts/verify-templates.mjs` içindedir.

## Kullanım

- Sağdaki, mobilde alttaki **Şablonlar** ayracından desen seçin.
- Hücrelere tıklayın veya sürükleyin. Aynı renkle boyalı hücreye yeniden basmak siler.
- Tekerleği kaydırmak, `Ctrl/Cmd + teker` yakınlaştırmak için kullanılır. Boşluk basılıyken sürüklemek de görünümü kaydırır.
- Klavyede oklar ve çapraz yönler için `Home`, `Page Up`, `End`, `Page Down`; boyamak için `Enter` veya `Boşluk` kullanılır.
- **İndir** panelinden arka planı ve PNG boyutunu seçin. Çıktı yalnız boyalı alanı kapsar.
- Çalışma her değişiklikte bu tarayıcının `localStorage` alanına kaydedilir ve sayfa yenilendiğinde geri yüklenir.

## Yapı

```text
app/                    Next.js App Router sayfası, metadata ve stiller
components/             tuval, araç adası, paneller ve şablon seçici
lib/templates/          geometri modeli, 42 şablon ve testleri
lib/paintStore.ts       boyama, geçmiş ve güvenli yerel kayıt
lib/download.ts         kırpılmış SVG/PNG üretimi
lib/camera.ts           kaydırma/yakınlaştırma hesapları
scripts/                gerçek Chrome doğrulama betikleri
docs/                   ilerleme, inceleme notları ve ekran görüntüleri
```

Teknik kararlar ve doğrulama özeti [docs/PROGRESS.md](docs/PROGRESS.md) ile [docs/REVIEW.md](docs/REVIEW.md) dosyalarındadır.
