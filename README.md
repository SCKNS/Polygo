# Polygo

Polygo, tekrar eden geometrik ızgaralarda hücreleri boyayarak logo ve desen üretmeye yarayan Türkçe bir web uygulamasıdır. Çizim alanı her yönde sınırsızdır; çalışma SVG veya şeffaf/renkli PNG olarak indirilebilir.

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

Gerçek tarayıcı sürüm testi kayıt, erişilebilir açıklamalar ve indirilen SVG/PNG dosyalarını birlikte doğrular:

```sh
npm run build
npm run start -- -p 3123
chrome --headless=new --remote-debugging-port=9233 --user-data-dir=<geçici-klasör> about:blank
npm run verify:release -- <geçici-indirme-klasörü>
```

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
