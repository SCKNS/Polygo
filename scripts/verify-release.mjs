// Son sürüm tarayıcı doğrulaması: kayıt, ekran okuyucu metni ve gerçek SVG/PNG indirmeleri.
// Kullanım:
//   1. npm run build && npm run start -- -p 3123
//   2. chrome --headless=new --remote-debugging-port=9233 --user-data-dir=<geçici klasör> about:blank
//   3. node scripts/verify-release.mjs <geçici-indirme-klasörü>
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const downloadDir = resolve(process.argv[2] ?? "./tmp/polygo-downloads");
mkdirSync(downloadDir, { recursive: true });

const target = await (
  await fetch("http://127.0.0.1:9233/json/new?about:blank", { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((done) => ws.addEventListener("open", done));

let sequence = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve: accept, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(JSON.stringify(message.error)));
  else accept(message.result);
});

const send = (method, params = {}) =>
  new Promise((accept, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve: accept, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const wait = (milliseconds) =>
  new Promise((done) => setTimeout(done, milliseconds));
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text,
    );
  return result.result.value;
};

let failures = 0;
function check(name, result, detail = "") {
  if (!result) failures++;
  console.log(
    `${result ? "OK  " : "HATA"} ${name}${detail ? ` (${detail})` : ""}`,
  );
}

async function waitFor(expression, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const value = await evaluate(expression);
    if (value) return value;
    await wait(100);
  }
  throw new Error(`zaman aşımı: ${expression}`);
}

async function press(selector) {
  const point = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    element.scrollIntoView({ block: "center" });
    const box = element.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  })()`);
  if (!point) throw new Error(`öğe bulunamadı: ${selector}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    ...point,
    button: "left",
    clickCount: 1,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    ...point,
    button: "left",
    clickCount: 1,
  });
  await wait(150);
}

async function waitForDownload(extension) {
  const started = Date.now();
  while (Date.now() - started < 12_000) {
    const names = readdirSync(downloadDir);
    const name = names.find((item) => item.endsWith(extension));
    if (name && !names.some((item) => item.endsWith(".crdownload")))
      return resolve(downloadDir, name);
    await wait(150);
  }
  throw new Error(`${extension} indirmesi zaman aşımına uğradı`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Browser.setDownloadBehavior", {
  behavior: "allow",
  downloadPath: downloadDir,
  eventsEnabled: true,
});
await send("Page.navigate", { url: "http://localhost:3123/" });
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
await send("Input.dispatchMouseEvent", {
  type: "mousePressed",
  ...center,
  button: "left",
  clickCount: 1,
});
await send("Input.dispatchMouseEvent", {
  type: "mouseReleased",
  ...center,
  button: "left",
  clickCount: 1,
});
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
const svgPath = await waitForDownload(".svg");
const svg = readFileSync(svgPath, "utf8");
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
const pngPath = await waitForDownload(".png");
const png = readFileSync(pngPath);
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

ws.close();
console.log(
  failures
    ? `SONUÇ: ${failures} kontrol başarısız`
    : "SONUÇ: tüm sürüm kontrolleri geçti",
);
process.exitCode = failures ? 1 : 0;
