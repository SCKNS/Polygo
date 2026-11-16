// Son sürüm tarayıcı doğrulaması: kayıt, ekran okuyucu metni ve gerçek SVG/PNG indirmeleri.
// Kullanım: npm run build && npm run verify:browser (sunucuyu ve Chrome'u kendisi açıp kapatır).
// Elle: sunucu 3123'te, Chrome 9233 CDP portunda açıkken node scripts/verify-release.mjs <geçici-indirme-klasörü>
import { resolve } from "node:path";
import {
  APP_URL,
  connect,
  createChecker,
  wait,
  waitForDownload,
} from "./cdp.mjs";

// Her çalıştırma kendi boş klasörüne indirir; önceki çalıştırmanın dosyaları karışmaz.
const downloadDir = resolve(
  process.argv[2] ?? "./tmp/polygo-downloads",
  String(Date.now()),
);

const browser = await connect();
const { send, evaluate, waitFor } = browser;
const checker = createChecker();
const { check } = checker;
const press = async (selector) =>
  browser.click(await browser.elementCenter(selector));

await send("Page.enable");
await send("Runtime.enable");
await browser.setDownloadDirectory(downloadDir);
await send("Page.navigate", { url: APP_URL });
await waitFor(
  "document.readyState === 'complete' && !!document.querySelector('.drawing-canvas')",
);

await evaluate("localStorage.clear(); location.reload(); true");
await waitFor(
  "document.readyState === 'complete' && !!document.querySelector('.drawing-canvas')",
);
await wait(300);

const center = await evaluate(`(() => {
  const box = document.querySelector('.drawing-canvas').getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
})()`);
await browser.click(center);
await waitFor("document.querySelectorAll('[data-cell-id]').length === 1");

const saved = await evaluate(
  "JSON.parse(localStorage.getItem('polygo-drawing')).state",
);
check(
  "boyama localStorage'a yazıldı",
  Object.keys(saved.fills).length === 1 && saved.templateId === "square",
);

await send("Page.reload");
await waitFor(
  "document.readyState === 'complete' && document.querySelectorAll('[data-cell-id]').length === 1",
);
check(
  "sayfa yenilenince çizim geri geldi",
  await evaluate("document.querySelectorAll('[data-cell-id]').length === 1"),
);

const accessibility = await evaluate(`(() => {
  const canvas = document.querySelector('.drawing-canvas');
  const ids = canvas.getAttribute('aria-describedby').split(' ');
  const text = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  return { label: canvas.getAttribute('aria-label'), text };
})()`);
check(
  "tuvalin erişilebilir adı şablonu açıklıyor",
  accessibility.label.includes("Kare şablonunda"),
  accessibility.label,
);
check(
  "seçili hücre teknik kimlik yerine konumla anlatılıyor",
  accessibility.text.includes("yatay") && !accessibility.text.includes("0-0:"),
);
check(
  "çizim özeti boyalı hücre sayısını açıklıyor",
  accessibility.text.includes("1 boyalı hücre"),
);

await press("#tab-download");
check(
  "indirme düğmeleri boyalı çizimde etkin",
  await evaluate(
    "[...document.querySelectorAll('.download-stamp')].every((button) => !button.disabled)",
  ),
);

await press(".download-stamp:nth-of-type(1)");
const svg = String(await waitForDownload(downloadDir, ".svg"));
check(
  "SVG dosyası geçerli ve şeffaf",
  svg.startsWith("<svg") && svg.includes("<path") && !svg.includes("<rect"),
);

await evaluate(`(() => {
  const select = [...document.querySelectorAll('.download-settings select')].at(-1);
  select.value = '1024';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`);
await wait(100);
await press(".download-stamp:nth-of-type(2)");
const png = await waitForDownload(downloadDir, ".png");
const pngSignature = png
  .subarray(0, 8)
  .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
check(
  "PNG dosyası geçerli",
  pngSignature && Math.max(width, height) === 1024,
  `${width}×${height}`,
);

browser.close();
console.log(
  checker.failures
    ? `SONUÇ: ${checker.failures} kontrol başarısız`
    : "SONUÇ: tüm sürüm kontrolleri geçti",
);
process.exitCode = checker.failures ? 1 : 0;
