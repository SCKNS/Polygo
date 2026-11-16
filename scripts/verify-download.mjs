// İndirme piksel doğrulaması (Chrome mobil emülasyonu, dokunma): gerçek indirilen PNG/SVG dosyalarının köşe, kenar ve
// farklı renk dikiş piksellerini okur; SVG'deki çizginin (miter uçları dahil) viewBox dışına taşıp kırpılmadığını
// raster olarak ölçer. Fiziksel telefonun yerini tutmaz (iOS Safari'nin rasterleştiricisi farklıdır).
// Kullanım: npm run build && npm run verify:browser (sunucuyu ve Chrome'u kendisi açıp kapatır).
// Elle: sunucu 3123'te, Chrome 9233 CDP portunda açıkken node scripts/verify-download.mjs <geçici-indirme-klasörü>
import { resolve } from "node:path";
import {
  APP_URL,
  connect,
  createChecker,
  wait,
  waitForDownload,
} from "./cdp.mjs";

const downloadRoot = resolve(
  process.argv[2] ?? "./tmp/polygo-download-check",
  String(Date.now()),
);

const browser = await connect();
const { send, evaluate, waitFor, tap } = browser;
const checker = createChecker();
const { check } = checker;
const tapSelector = async (selector) =>
  tap(await browser.elementCenter(selector));

// Her indirme kendi boş klasörüne iner; aynı adlı dosyalar karışmaz.
let downloadCount = 0;
async function download(kind, pngSize = 1024) {
  const directory = resolve(downloadRoot, String(++downloadCount));
  await browser.setDownloadDirectory(directory);
  // Panel kapalıyken de düğmeler DOM'dadır ama boyutları 0'dır.
  const panelOpen = await evaluate(
    "(document.querySelector('.download-stamp')?.getBoundingClientRect().width ?? 0) > 0",
  );
  if (!panelOpen) {
    await tapSelector("#tab-download");
    await wait(500); // panel açılış animasyonu bitsin; yoksa dokunuş kayan düğmeyi ıskalar
  }
  await evaluate(`(() => {
    const select = [...document.querySelectorAll('.download-settings select')].at(-1);
    select.value = '${pngSize}';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await wait(100);
  await tapSelector(`.download-stamp:nth-of-type(${kind === "svg" ? 1 : 2})`);
  return waitForDownload(directory, `.${kind}`);
}

// Kayıt biçimiyle (lib/paintStore.ts) çizimi yükleyip sayfayı yeniler.
async function openDrawing(templateId, fills) {
  const saved = JSON.stringify({
    state: { templateId, fills, color: "#1f2230", recentColors: [] },
    version: 1,
  });
  await evaluate(
    `localStorage.setItem('polygo-drawing', ${JSON.stringify(saved)}); location.reload(); true`,
  );
  await waitFor(
    "document.readyState === 'complete' && !!document.querySelector('.drawing-canvas')",
  );
  await wait(400);
}

async function setBackground(value) {
  await tapSelector("#tab-download");
  await wait(500);
  await evaluate(`(() => {
    const select = document.querySelector('.download-settings select');
    select.value = '${value}';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await wait(150);
}

// PNG'yi tarayıcıda açar ve ölçer:
// corners: her köşeden çapraz içeri ilk opak (alfa ≥ 250) piksele uzaklık (yuvarlak köşe = büyük sayı)
// innerMinAlpha: 1 piksellik dış çerçeve hariç en düşük alfa (dolu çizimde dikiş = düşük sayı)
// edgeReach: her kenardan içeri ilk boyalı (alfa > 0) piksele en kısa uzaklığın en büyüğü. Yalnız "şekil dört kenara
//   ulaşıyor" der (daire gibi şekiller kenara tek noktada değer); kenar boyunca şerit olup olmadığını ÖLÇMEZ.
// edgeMinAlpha: sol, üst, sağ, alt kenardaki BÜTÜN piksel sütununun/satırının en düşük alfası (şerit = 255'ten küçük)
async function measurePng(png) {
  const base64 = png.toString("base64");
  return evaluate(`(async () => {
    const image = new Image();
    image.src = 'data:image/png;base64,${base64}';
    await image.decode();
    const width = image.width, height = image.height;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, width, height).data;
    const alpha = (x, y) => data[(y * width + x) * 4 + 3];
    const opaque = (x, y) => alpha(x, y) >= 250;
    const diagonal = (x, y, dx, dy) => {
      let step = 0;
      while (step < 200 && !opaque(x + dx * step, y + dy * step)) step++;
      return step;
    };
    const corners = [
      diagonal(0, 0, 1, 1), diagonal(width - 1, 0, -1, 1),
      diagonal(0, height - 1, 1, -1), diagonal(width - 1, height - 1, -1, -1),
    ];
    let innerMinAlpha = 255;
    const reach = [Infinity, Infinity, Infinity, Infinity]; // sol, üst, sağ, alt
    const edgeMinAlpha = [255, 255, 255, 255];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const a = alpha(x, y);
        if (x > 0 && y > 0 && x < width - 1 && y < height - 1)
          innerMinAlpha = Math.min(innerMinAlpha, a);
        if (x === 0) edgeMinAlpha[0] = Math.min(edgeMinAlpha[0], a);
        if (y === 0) edgeMinAlpha[1] = Math.min(edgeMinAlpha[1], a);
        if (x === width - 1) edgeMinAlpha[2] = Math.min(edgeMinAlpha[2], a);
        if (y === height - 1) edgeMinAlpha[3] = Math.min(edgeMinAlpha[3], a);
        if (a > 0) {
          reach[0] = Math.min(reach[0], x); reach[1] = Math.min(reach[1], y);
          reach[2] = Math.min(reach[2], width - 1 - x); reach[3] = Math.min(reach[3], height - 1 - y);
        }
      }
    }
    return { width, height, corners, innerMinAlpha, edgeReach: Math.max(...reach), edgeMinAlpha };
  })()`);
}

function svgSize(svg) {
  const [, width, height] = /width="([^"]+)" height="([^"]+)"/.exec(svg);
  return { width: Number(width), height: Number(height) };
}

// Kırpılma ölçümü: SVG, viewBox'ı her yönde MARGIN piksel genişletilerek yeniden çizilir. Dosyanın kendi alanı
// tam piksel ızgarasına oturur; o alanın dışında boyalı piksel varsa çizgi/miter viewBox'tan taşıyor, yani
// indirilen dosyada kırpılıyor demektir. (getBBox çizgiyi ve miter uçlarını saymaz; bu yüzden kullanılmaz.)
// ZOOM kat büyük çizilir: 1 piksellik çizginin ~0,2 piksellik miter ucu, Chrome'un kenar yumuşatmasında
// (1/4 piksellik alt satırlar) hiç piksel boyamadan kaybolabiliyordu (Elmas merkezi böyleydi).
const MARGIN = 8;
const ZOOM = 4;
async function measureOverflow(svg) {
  const { width, height } = svgSize(svg);
  const [x, y, viewWidth, viewHeight] = /viewBox="([^"]+)"/
    .exec(svg)[1]
    .split(" ")
    .map(Number);
  const pad = (MARGIN * viewWidth) / width; // MARGIN pikselin dünya birimindeki karşılığı
  const outWidth = (width + 2 * MARGIN) * ZOOM;
  const outHeight = (height + 2 * MARGIN) * ZOOM;
  const expanded = svg.replace(
    /width="[^"]+" height="[^"]+" viewBox="[^"]+"/,
    `width="${outWidth}" height="${outHeight}" viewBox="${x - pad} ${y - pad} ${viewWidth + 2 * pad} ${viewHeight + 2 * pad}"`,
  );
  return evaluate(`(async () => {
    const url = URL.createObjectURL(new Blob([${JSON.stringify(expanded)}], { type: 'image/svg+xml' }));
    const image = new Image();
    image.src = url;
    await image.decode();
    URL.revokeObjectURL(url);
    const width = ${outWidth}, height = ${outHeight}, margin = ${MARGIN * ZOOM};
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    const data = context.getImageData(0, 0, width, height).data;
    let maxAlpha = 0, pixels = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const inside = x >= margin && y >= margin && x < width - margin && y < height - margin;
        const a = data[(y * width + x) * 4 + 3];
        if (!inside && a > 0) { pixels++; maxAlpha = Math.max(maxAlpha, a); }
      }
    }
    return { maxAlpha, pixels };
  })()`);
}

async function checkNoClipping(name, svg) {
  const overflow = await measureOverflow(svg);
  check(
    `${name}: SVG çizgisi viewBox dışına taşmıyor (kırpılma yok)`,
    overflow.pixels === 0,
    `dışarıda ${overflow.pixels} boyalı piksel, en yüksek alfa ${overflow.maxAlpha}`,
  );
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 812,
  deviceScaleFactor: 3,
  mobile: true,
});
await send("Emulation.setTouchEmulationEnabled", {
  enabled: true,
  maxTouchPoints: 5,
});
await send("Page.navigate", { url: APP_URL });
await waitFor(
  "document.readyState === 'complete' && !!document.querySelector('.drawing-canvas')",
);

// 1) Kullanıcının bildirdiği durum: Kare'de tek hücre parmakla boyanır, 4096 PNG indirilir.
await openDrawing("square", {});
const center = await evaluate(`(() => {
  const box = document.querySelector('.drawing-canvas').getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
})()`);
await tap(center);
const painted = await evaluate(
  "Object.keys(JSON.parse(localStorage.getItem('polygo-drawing')).state.fills).length",
);
check("dokunarak tek hücre boyandı", painted === 1, `${painted} hücre`);
let result = await measurePng(await download("png", 4096));
check(
  "tek hücre 4096 PNG: dört köşe sivri",
  result.width === 4096 && result.corners.every((distance) => distance <= 1),
  `köşeden opak piksele: ${result.corners.join(",")}`,
);

// 2) PNG kalitesi 4096 seçiliyken SVG yine 1024 boyutunda iner.
let svg = String(await download("svg", 4096));
const size = svgSize(svg);
check(
  "SVG boyutu PNG kalitesinden bağımsız",
  Math.max(size.width, size.height) === 1024,
  `${size.width}×${size.height}`,
);
await checkNoClipping("Kare tek hücre", svg);

// 3) Kare 3×2, iki renk dama: farklı renk dikişlerinde şeffaf çizgi yok, köşeler sivri.
const checker3x2 = {};
for (let x = 0; x < 3; x++)
  for (let y = 0; y < 2; y++)
    checker3x2[`${x}-${y}`] = (x + y) % 2 ? "#1f2230" : "#d9482b";
await openDrawing("square", checker3x2);
result = await measurePng(await download("png", 2048));
check(
  "Kare 3×2 dama: dikişte şeffaf çizgi yok",
  result.innerMinAlpha >= 250,
  `iç bölge en düşük alfa ${result.innerMinAlpha}`,
);
check(
  "Kare 3×2 dama: köşeler sivri",
  result.corners.every((distance) => distance <= 1),
  `köşeden opak piksele: ${result.corners.join(",")}`,
);

// 4) Dörtlü: dört farklı renk üçgen, çapraz dikişler.
await openDrawing("cross", {
  "0-0-top": "#d9482b",
  "0-0-right": "#1f2230",
  "0-0-bottom": "#2b7a4b",
  "0-0-left": "#e2b33c",
});
result = await measurePng(await download("png", 1024));
check(
  "Dörtlü dört renk: çapraz dikişte şeffaf çizgi yok",
  result.innerMinAlpha >= 250,
  `iç bölge en düşük alfa ${result.innerMinAlpha}`,
);
check(
  "Dörtlü dört renk: köşeler sivri",
  result.corners.every((distance) => distance <= 1),
  `köşeden opak piksele: ${result.corners.join(",")}`,
);

// 5) Uzun logo + renkli arka plan: dört kenarın her biri baştan sona opak (şeffaf şerit yok).
// Bu uzunluk/boyut çiftleri bilerek seçildi: eski kod (viewBox oranı piksel oranından farklı) burada sol ve
// sağ kenarda 13×1 @1024'te ~3,2 px, 21×1 @2048'de ~4,7 px şeffaf şerit üretiyordu. 13×1 @2048 eski kodda da geçer.
for (const [length, pngSize] of [
  [13, 1024],
  [21, 2048],
]) {
  const strip = {};
  for (let x = 0; x < length; x++) strip[`${x}-0`] = "#d9482b";
  await openDrawing("square", strip);
  await setBackground("color");
  result = await measurePng(await download("png", pngSize));
  check(
    `Kare ${length}×1 renkli arka plan ${pngSize} PNG: dört kenar baştan sona opak`,
    result.edgeMinAlpha.every((value) => value === 255) &&
      result.innerMinAlpha === 255,
    `${result.width}×${result.height}, kenar en düşük alfa sol/üst/sağ/alt ${result.edgeMinAlpha.join("/")}`,
  );
}

// 6) Elmas'ın yalnız merkezi: 45° döndürülmüş karenin dik köşeleri miter ucuyla eksen yönünde ~0,71 çizgi
// genişliği taşar. Yarım çizgi pay bunu kırpıyordu.
await openDrawing("diamond", { "0-0-center": "#d9482b" });
svg = String(await download("svg"));
await checkNoClipping("Elmas yalnız merkez", svg);
result = await measurePng(await download("png", 4096));
check(
  "Elmas yalnız merkez 4096 PNG: dört uç kenara ulaşıyor",
  result.edgeReach <= 1,
  `en uzak kenar ${result.edgeReach}px`,
);

// 6b) Kesişen daire mercekleri tek başına: yayın tepe noktası (0° / 90°) hücrenin yaklaşık köşe listesinde (points)
// yoktu; sınır points'ten hesaplanınca tepe ~0,00076 birim kırpılıyordu. Ölçüm 4× büyütmeyle (≈ 4096 px) yapılır.
for (const id of ["0-0-h", "0-0-v"]) {
  await openDrawing("overlap", { [id]: "#d9482b" });
  await checkNoClipping(
    `Kesişen daire ${id} yalnız`,
    String(await download("svg")),
  );
  result = await measurePng(await download("png", 4096));
  check(
    `Kesişen daire ${id} yalnız 4096 PNG: şekil dört kenara ulaşıyor`,
    result.edgeReach <= 1,
    `en uzak kenar ${result.edgeReach}px`,
  );
}

// 7) Bütün şablonlar: ekranın ortasındaki tek hücre (dış köşelerinin hepsi açıkta) ve SVG kırpılması.
const templateIds = await evaluate(
  "[...document.querySelectorAll('[data-template]')].map((button) => button.dataset.template)",
);
check(
  "şablon listesi okundu",
  templateIds.length >= 40,
  `${templateIds.length} şablon`,
);
for (const templateId of templateIds) {
  await openDrawing(templateId, {});
  await tap(center);
  svg = String(await download("svg"));
  await checkNoClipping(`${templateId} tek hücre`, svg);
}

// 8) Yaylı ve dar açılı şablonlar: 3×3 dokunuşla boyanır; PNG dört kenara ulaşıyor, SVG kırpılmıyor.
for (const templateId of ["circle", "flower", "star8", "triangle", "scales"]) {
  await openDrawing(templateId, {});
  for (const dx of [-30, 0, 30])
    for (const dy of [-30, 0, 30])
      await tap({ x: center.x + dx, y: center.y + dy });
  result = await measurePng(await download("png", 1024));
  check(
    `${templateId} 3×3: şekil PNG'nin dört kenarına ulaşıyor`,
    result.edgeReach <= 1,
    `en uzak kenar ${result.edgeReach}px`,
  );
  await checkNoClipping(`${templateId} 3×3`, String(await download("svg")));
}

console.log(
  checker.failures === 0
    ? "SONUÇ: tüm indirme kontrolleri geçti"
    : `SONUÇ: ${checker.failures} kontrol başarısız`,
);
browser.close();
process.exit(checker.failures === 0 ? 0 : 1);
