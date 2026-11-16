// Polygo şablon seçimi doğrulaması: Chrome DevTools Protocol ile gerçek fare tıklaması ve dokunuş gönderir, sonucu sayfadan okur.
// Ek paket gerektirmez (Node 22+: fetch ve WebSocket yerleşik). Uygulama koduna dahil değildir; elle çalıştırılır.
//
// Kullanım:
//   1. npm run build && npm run start -- -p 3123
//   2. chrome --headless=new --remote-debugging-port=9233 --user-data-dir=<geçici klasör> about:blank
//   3. node scripts/verify-templates.mjs [ekran-görüntüsü-klasörü]
// Çıktı: her kontrol için "OK" ya da "HATA" satırı. Herhangi bir HATA varsa çıkış kodu 1.
import { writeFileSync } from "node:fs";

const outDir = process.argv[2];
const URL = "http://127.0.0.1:3123/";

const target = await (await fetch("http://127.0.0.1:9233/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(`sayfada hata: ${response.exceptionDetails.exception?.description ?? response.exceptionDetails.text}`);
  return response.result.value;
};
const shot = async (name) => {
  if (!outDir) return;
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${outDir}/${name}.png`, Buffer.from(data, "base64"));
  console.log("ekran görüntüsü:", `${outDir}/${name}.png`);
};

let failures = 0;
function check(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "HATA"} ${name}${detail ? ` (${detail})` : ""}`);
}

let mobile = false;
// Gerçek giriş olayı: masaüstünde fare tıklaması, mobilde dokunuş.
async function press(x, y) {
  if (mobile) {
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 0 }] });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  }
  await wait(120);
}
// Seçicinin ekran merkezi; önce görünür alana kaydırılır (panel uzunsa).
async function centerOf(selector) {
  return evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
}
async function pressSelector(selector) {
  const point = await centerOf(selector);
  if (!point) throw new Error(`bulunamadı: ${selector}`);
  await wait(50);
  await press(point.x, point.y);
}
const paintedCount = () => evaluate(`document.querySelectorAll(".canvas-cells path").length`);
const canvasLabel = () => evaluate(`document.querySelector(".drawing-canvas").getAttribute("aria-label")`);
const pressedNames = () => evaluate(`[...document.querySelectorAll('.template-option[aria-pressed="true"]')].map((b) => b.textContent.replace("✓", "").trim())`);
// Şablon düğmesi kimliğiyle bulunur (düğmeler gruplara bölündüğü için sıra numarası işe yaramaz).
const optionSelector = (id) => `.template-option[data-template="${id}"]`;
const canvasCenter = () => evaluate(`(() => { const r = document.querySelector(".drawing-canvas").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);

async function openTemplates() {
  await pressSelector("#tab-templates");
  await wait(400);
}
async function closePanel() {
  await pressSelector(".panel-close");
  await wait(400);
}

async function run(width, height, isMobile) {
  mobile = isMobile;
  const tag = isMobile ? "mobil" : "masaüstü";
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: isMobile ? 2 : 1, mobile: isMobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: isMobile, maxTouchPoints: isMobile ? 5 : 1 });
  await send("Page.navigate", { url: URL });
  await wait(1500);

  await openTemplates();
  const names = await evaluate(`[...document.querySelectorAll(".template-option")].map((b) => b.textContent.replace("✓", "").trim())`);
  const ids = await evaluate(`[...document.querySelectorAll(".template-option")].map((b) => b.dataset.template)`);
  check(`${tag}: panelde 42 şablon düğmesi`, names.length === 42, names.join(", "));
  const groups = await evaluate(`[...document.querySelectorAll(".template-group h3")].map((h) => h.textContent)`);
  check(`${tag}: dört grup başlığı`, groups.join("|") === "Kare|Yay|Taş örgü|Üçgen ve altıgen", groups.join("|"));
  check(`${tag}: başlangıçta yalnız Kare seçili`, JSON.stringify(await pressedNames()) === JSON.stringify(["Kare"]));
  const previewsDrawn = await evaluate(`[...document.querySelectorAll(".template-option .mini-grid path")].every((p) => p.getTotalLength() > 10)`);
  check(`${tag}: her önizlemede çizgi var`, previewsDrawn);
  await evaluate(`document.querySelector(".paper-panel").scrollTop = 0`);
  await wait(100);
  await shot(`step5-panel-${isMobile ? "mobile" : "desktop"}`);
  // Panelin geri kalanı: aşağı kaydırılarak iki görüntü daha.
  for (const part of [2, 3]) {
    await evaluate(`(() => { const p = document.querySelector(".paper-panel"); p.scrollTop = (p.scrollHeight - p.clientHeight) * ${part - 1} / 2; })()`);
    await wait(150);
    await shot(`step5-panel-${isMobile ? "mobile" : "desktop"}-${part}`);
  }

  // Her şablona gerçek tıklama/dokunuşla geçilir: düğme seçili olur, tuval o şablonu çizer.
  for (let i = 0; i < names.length; i++) {
    await pressSelector(optionSelector(ids[i]));
    const pressed = await pressedNames();
    const label = await canvasLabel();
    check(`${tag}: "${names[i]}" seçildi`, pressed.length === 1 && pressed[0] === names[i] && label.startsWith(`${names[i]} şablonu`), `${pressed.join("|")} / ${label.slice(0, 30)}`);
  }

  // Boyama + şablon değiştirme + geri al akışı (Daire -> Altıgen -> geri al).
  await pressSelector(optionSelector("circle"));
  await closePanel();
  const c = await canvasCenter();
  await press(c.x, c.y);
  check(`${tag}: Daire'de tuvalin ortasına dokunmak bir hücre boyar`, (await paintedCount()) === 1);
  await openTemplates();
  await pressSelector(optionSelector("hexagon"));
  check(`${tag}: şablon değişince tuval boşalır`, (await paintedCount()) === 0);
  await closePanel();
  await pressSelector('button[aria-label="geri al"]');
  check(`${tag}: geri al Daire'yi boyamasıyla geri getirir`, (await paintedCount()) === 1 && (await canvasLabel()).startsWith("Daire şablonu"));
}

// Klavye: Sekizgen'de köşe üçgenine yalnız çapraz tuşla gidilir (Page Down = sağ aşağı).
async function keyboardDiagonal() {
  mobile = false;
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setTouchEmulationEnabled", { enabled: false, maxTouchPoints: 1 });
  await send("Page.navigate", { url: URL });
  await wait(1500);
  await openTemplates();
  await pressSelector(optionSelector("octagon"));
  await closePanel();
  await evaluate(`document.querySelector(".drawing-canvas").focus()`);
  const selected = () => evaluate(`document.querySelector(".canvas-area [aria-live]").textContent`);
  const pressKey = async (keyName, code, keyCode) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code, windowsVirtualKeyCode: keyCode });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code, windowsVirtualKeyCode: keyCode });
    await wait(120);
  };
  const path = [await selected()];
  await pressKey("ArrowRight", "ArrowRight", 39);
  path.push(await selected());
  await pressKey("PageDown", "PageDown", 34);
  path.push(await selected());
  await pressKey("PageDown", "PageDown", 34);
  path.push(await selected());
  const ids = path.map((text) => text.match(/Seçili hücre (\S+):/)?.[1]);
  check("klavye: ok ve Page Down ile Sekizgen'de köşe üçgenine gidilir", ids.every(Boolean) && new Set(ids).size === 4 && ids.some((id) => /-(nw|ne|se|sw)$/.test(id)), ids.join(" → "));
}

// Ekran görüntüsü için her şablonda tuvalin ortasında birkaç hücre boyanır (masaüstü).
async function gallery() {
  mobile = false;
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setTouchEmulationEnabled", { enabled: false, maxTouchPoints: 1 });
  await send("Page.navigate", { url: URL });
  await wait(1500);
  // Dosya adları ASCII kalsın diye şablon kimliğiyle yazılır.
  const galleryIds = ["clover", "trihex", "overlap", "scales", "truchet", "star8", "herringbone", "pythagorean", "parquet", "stair", "rhombi", "fineHex", "hexRing", "arch"];
  for (const id of galleryIds) {
    await openTemplates();
    await pressSelector(optionSelector(id));
    await closePanel();
    // Yakınlaştırıp ortadaki birkaç noktaya dokunulur.
    const c = await canvasCenter();
    for (const [dx, dy] of [[0, 0], [12, -14], [-16, 10], [30, 8], [-28, -20], [6, 30]]) await press(c.x + dx * 2, c.y + dy * 2);
    const count = await paintedCount();
    check(`galeri: ${id} boyandı`, count > 0, `${count} hücre`);
    await shot(`step5-${id}`);
  }
}

await run(1280, 800, false);
await run(375, 812, true);
await keyboardDiagonal();
await gallery();
ws.close();
console.log(failures === 0 ? "\nHepsi geçti." : `\n${failures} HATA`);
process.exit(failures === 0 ? 0 : 1);
