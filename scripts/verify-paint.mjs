// Polygo boyama doğrulaması: Chrome DevTools Protocol ile gerçek fare ve dokunma olayları gönderir, sonucu sayfadan okur.
// Ek paket gerektirmez (Node 22+: fetch ve WebSocket yerleşik). Uygulama koduna dahil değildir; elle çalıştırılır.
//
// Kullanım:
//   1. npm run build && npm run start -- -p 3123
//   2. chrome --headless=new --remote-debugging-port=9233 --user-data-dir=<geçici klasör> about:blank
//   3. node scripts/verify-paint.mjs <etiket> [ekran-görüntüsü-klasörü]
// Tuval şimdilik yalnız varsayılan şablonu gösterir; başka şablonu denemek için Notebook.tsx'te geçici olarak
// getTemplate("cross") verip yeniden derleyin (Adım 4'te şablon seçimiyle gereksiz olacak).
// Çıktı: her kontrol için "OK" ya da "HATA" satırı. Herhangi bir HATA varsa çıkış kodu 1.
import { writeFileSync } from "node:fs";

const label = process.argv[2] ?? "square";
const outDir = process.argv[3];
const URL = "http://127.0.0.1:3123/";

const list = await (await fetch("http://127.0.0.1:9233/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(list.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
const shot = async (name) => {
  if (!outDir) return;
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${outDir}/${name}.png`, Buffer.from(data, "base64"));
  console.log("ekran görüntüsü:", `${outDir}/${name}.png`);
};

// Sayfa içi yardımcılar: hücrenin ekran köşeleri, iç teğet daire merkezi ve yarıçapı (üçgen), kare için kenar/2.
const HELPERS = `
window.__cellGeom = (id) => {
  const p = document.querySelector('[data-cell-id="' + id + '"]');
  const m = p.getScreenCTM();
  const pts = [...p.points].map(q => ({ x: q.x*m.a + q.y*m.c + m.e, y: q.x*m.b + q.y*m.d + m.f }));
  if (pts.length === 3) {
    const [A,B,C] = pts; const d = (u,v) => Math.hypot(u.x-v.x, u.y-v.y);
    const a = d(B,C), b = d(A,C), c = d(A,B), s = (a+b+c)/2;
    const area = Math.abs((B.x-A.x)*(C.y-A.y) - (C.x-A.x)*(B.y-A.y))/2;
    return { x: (a*A.x+b*B.x+c*C.x)/(2*s), y: (a*A.y+b*B.y+c*C.y)/(2*s), r: area/s };
  }
  const xs = pts.map(q=>q.x), ys = pts.map(q=>q.y);
  return { x: (Math.min(...xs)+Math.max(...xs))/2, y: (Math.min(...ys)+Math.max(...ys))/2, r: Math.min(Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys))/2 };
};
window.__fills = () => [...document.querySelectorAll('[data-cell-id]')].filter(p => p.style.fill).map(p => p.dataset.cellId);
window.__visible = (id) => { const g = __cellGeom(id); const v = document.querySelector('.canvas-viewport').getBoundingClientRect();
  return g.x - g.r > v.left && g.x + g.r < v.right && g.y - g.r > v.top && g.y + g.r < v.bottom; };
window.__zoom = () => document.querySelector('.zoom-level').textContent;
true;`;

async function open(width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  await send("Page.navigate", { url: URL });
  await wait(2800); // açılış animasyonları
  await evaluate(HELPERS);
}

const touch = (type, points) => send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([x, y], i) => ({ x, y, id: i })) });
async function tap(x, y) { await touch("touchStart", [[x, y]]); await touch("touchEnd", []); await wait(30); }
async function mouse(type, x, y) { await send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 }); }
async function clickSelector(sel) {
  const c = await evaluate(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
  await mouse("mousePressed", c.x, c.y); await mouse("mouseReleased", c.x, c.y); await wait(60);
}
async function tapSelector(sel) {
  const c = await evaluate(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
  await tap(c.x, c.y); await wait(60);
}
const ids = () => evaluate(`[...document.querySelectorAll('[data-cell-id]')].map(p => p.dataset.cellId)`);
let failures = 0;
const result = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "HATA"} ${name}${detail ? " — " + detail : ""}`);
};

// ---------- Masaüstü (1280×800, fare) ----------
await send("Page.enable");
await open(1280, 800, false);
await shot(`step3-${label}-desktop-empty`);
const all = await ids();
let g = await evaluate(`__cellGeom('${all[0]}')`);
await mouse("mousePressed", g.x, g.y); await mouse("mouseReleased", g.x, g.y); await wait(60);
result("masaüstü tık tek hücre boyar", JSON.stringify(await evaluate("__fills()")) === JSON.stringify([all[0]]), JSON.stringify(await evaluate("__fills()")));
// Sürükleme: ikinci satır boyunca dört hücre (Kare'de 0-1..3-1)
const rowIds = all.filter((id) => /^\d-1(-|$)/.test(id)).slice(0, label === "square" ? 4 : 8);
const pts = [];
for (const id of rowIds) pts.push(await evaluate(`__cellGeom('${id}')`));
await mouse("mousePressed", pts[0].x, pts[0].y);
for (const p of pts.slice(1)) await mouse("mouseMoved", p.x, p.y);
await mouse("mouseReleased", pts.at(-1).x, pts.at(-1).y); await wait(60);
const afterDrag = await evaluate("__fills()");
result("masaüstü sürükleme hücreleri boyar", rowIds.every((id) => afterDrag.includes(id)), `${afterDrag.length} boyalı`);
await clickSelector('[aria-label="geri al"]');
result("geri al sürüklemeyi tek adımda geri alır", (await evaluate("__fills()")).length === 1);
await clickSelector('[aria-label="yinele"]');
result("yinele geri getirir", (await evaluate("__fills()")).length === afterDrag.length);
// Hızlı sürükleme: 3. satırın ilk karesinden 7. karesine TEK fare hareketi. Aradaki her karede en az bir hücre boyanmalı.
await clickSelector('[aria-label="temizle"]');
const lastColumn = label === "cross" ? 5 : 6; // Dörtlü 6×6, diğerleri 8×8
const fastFrom = await evaluate(`__cellGeom('${all.find((id) => /^0-3(-|$)/.test(id))}')`);
const fastTo = await evaluate(`__cellGeom('${all.filter((id) => new RegExp(`^${lastColumn}-3(-|$)`).test(id)).at(-1)}')`);
await mouse("mousePressed", fastFrom.x, fastFrom.y);
await mouse("mouseMoved", fastTo.x, fastFrom.y);
await mouse("mouseReleased", fastTo.x, fastFrom.y); await wait(60);
const fastFills = await evaluate("__fills()");
const missing = [];
for (let x = 0; x <= lastColumn; x++) if (!fastFills.some((id) => id.startsWith(`${x}-3`))) missing.push(x);
result("hızlı sürükleme (tek olay) aradaki kareleri atlamaz", missing.length === 0, `${fastFills.length} boyalı, boş kalan sütunlar: [${missing}]`);
// İki kez geri al: hızlı sürükleme ve temizleme geri alınır, önceki boyama geri gelir.
await clickSelector('[aria-label="geri al"]');
await clickSelector('[aria-label="geri al"]');
result("iki geri al önceki duruma döner", (await evaluate("__fills()")).length === afterDrag.length);
// Renk değiştir: Renkler panelini aç, kiremit seç, kapat, boya
await clickSelector("#tab-colors");
await clickSelector('[aria-label="kiremit"]');
await shot(`step3-${label}-desktop-colors`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(400);
g = await evaluate(`__cellGeom('${all[all.length - 1]}')`);
await mouse("mousePressed", g.x, g.y); await mouse("mouseReleased", g.x, g.y); await wait(60);
const lastFill = await evaluate(`document.querySelector('[data-cell-id="${all[all.length - 1]}"]').style.fill`);
result("seçilen renkle boyar", lastFill === "rgb(217, 72, 43)", lastFill);
// Aynı renge tekrar tık: siler
await mouse("mousePressed", g.x, g.y); await mouse("mouseReleased", g.x, g.y); await wait(60);
result("aynı renge tekrar tık siler", !(await evaluate("__fills()")).includes(all[all.length - 1]));
await shot(`step3-${label}-desktop-painted`);
await clickSelector('[aria-label="temizle"]');
result("temizle boşaltır", (await evaluate("__fills()")).length === 0);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "z", code: "KeyZ", modifiers: 2, windowsVirtualKeyCode: 90 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "z", code: "KeyZ", modifiers: 2, windowsVirtualKeyCode: 90 });
await wait(60);
result("Ctrl+Z temizlemeyi geri alır", (await evaluate("__fills()")).length > 0);
// Klavye: önce sol üst hücreye tıklayıp odağı oraya taşı, temizle, sonra tuvale odaklan: sağ ok, Enter.
g = await evaluate(`__cellGeom('${all[0]}')`);
await mouse("mousePressed", g.x, g.y); await mouse("mouseReleased", g.x, g.y); await wait(60);
await evaluate("document.querySelector('[aria-label=\"temizle\"]').click(); document.querySelector('.drawing-canvas').focus(); true");
for (const key of ["ArrowRight", "Enter"]) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: key === "Enter" ? 13 : 39 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: key === "Enter" ? 13 : 39 });
}
await wait(60);
const keyFills = await evaluate("__fills()");
result(`klavye: ${all[0]} odaklıyken sağ ok + Enter başka bir hücreyi boyar`, keyFills.length === 1 && keyFills[0] !== all[0], JSON.stringify(keyFills));

// ---------- Mobil (375×812, dokunma) ----------
await open(375, 812, true);
await shot(`step3-${label}-mobile-empty`);
// Dokunma iptali (pointercancel): yarım fırça kaydedilmemeli, geçmişe yazılmamalı.
{
  const startIds = await ids();
  const a = await evaluate(`__cellGeom('${startIds[0]}')`);
  const b = await evaluate(`__cellGeom('${startIds[1]}')`);
  await touch("touchStart", [[a.x, a.y]]);
  await touch("touchMove", [[b.x, b.y]]);
  await touch("touchCancel", []); await wait(60);
  const cancelFills = await evaluate("__fills()");
  const undoDisabled = await evaluate("document.querySelector('[aria-label=\"geri al\"]').disabled");
  result("dokunma iptali fırçayı geri alır, geçmişe yazmaz", cancelFills.length === 0 && undoDisabled, `boyalı: ${cancelFills.length}, geri al kapalı: ${undoDisabled}`);
  await tap(a.x, a.y);
  result("iptalden sonraki dokunuş normal boyar (işaretçi takılı kalmadı)", JSON.stringify(await evaluate("__fills()")) === JSON.stringify([startIds[0]]));
  await tap(a.x, a.y);
}
const mobileIds = await ids();
const radii1 = [];
for (const id of mobileIds) radii1.push((await evaluate(`__cellGeom('${id}')`)).r);
console.log(`375px, 100%: en küçük iç teğet daire çapı ${(2 * Math.min(...radii1)).toFixed(1)}px`);

// + düğmesine dokunarak 44px'e ulaşana dek yakınlaştır
let zoomTaps = 0;
let minDiameter = 2 * Math.min(...radii1);
while (minDiameter < 44 && zoomTaps < 5) {
  await tapSelector('[aria-label="Yakınlaştır"]');
  zoomTaps++;
  const radii = [];
  for (const id of mobileIds) radii.push((await evaluate(`__cellGeom('${id}')`)).r);
  minDiameter = 2 * Math.min(...radii);
  console.log(`  + (${zoomTaps}) → ${await evaluate("__zoom()")}: en küçük iç teğet daire çapı ${minDiameter.toFixed(1)}px`);
}
result("yakınlaştırınca her hücrede ≥44px çaplı daire sığar", minDiameter >= 44, `${zoomTaps} dokunuş, ${await evaluate("__zoom()")}`);

// Görünür hücrelerde dokunma isabeti: merkeze ve merkezden 15px kaymış 8 noktaya dokun; yalnız hedef boyanmalı.
const visible = [];
for (const id of mobileIds) if (await evaluate(`__visible('${id}')`)) visible.push(id);
let hits = 0, misses = 0;
const offsets = [[0, 0], [15, 0], [-15, 0], [0, 15], [0, -15], [10.6, 10.6], [-10.6, 10.6], [10.6, -10.6], [-10.6, -10.6]];
for (const id of visible.slice(0, 12)) {
  for (const [dx, dy] of offsets) {
    const c = await evaluate(`__cellGeom('${id}')`);
    await tap(c.x + dx * Math.min(1, (c.r - 2) / 15), c.y + dy * Math.min(1, (c.r - 2) / 15));
    const f = await evaluate("__fills()");
    if (f.length === 1 && f[0] === id) hits++; else { misses++; console.log("   ıska", id, dx, dy, JSON.stringify(f)); }
    await tap(c.x, c.y); // aynı renk: siler (bir sonraki deneme için boşalt)
    if ((await evaluate("__fills()")).length !== 0) { console.log("   silinmedi", id); await evaluate("document.querySelector('[aria-label=\"temizle\"]').click()"); }
  }
}
result("dokunuş yalnız hedef hücreyi boyar (komşu boyanmaz)", misses === 0, `${hits} isabet / ${hits + misses} dokunuş, ${Math.min(12, visible.length)} hücre, merkez ±15px (iç teğet dairenin içinde)`);

// Tek parmakla sürükleyerek boya
const drag = [];
for (const id of visible.slice(0, 3)) drag.push(await evaluate(`__cellGeom('${id}')`));
await touch("touchStart", [[drag[0].x, drag[0].y]]);
for (const p of drag.slice(1)) { await touch("touchMove", [[p.x, p.y]]); await wait(20); }
await touch("touchEnd", []); await wait(60);
const dragged = await evaluate("__fills()");
result("tek parmak sürükleme boyar", visible.slice(0, 3).every((id) => dragged.includes(id)), JSON.stringify(dragged));
await shot(`step3-${label}-mobile-zoomed-painted`);
await evaluate("document.querySelector('[aria-label=\"temizle\"]').click(); true");

// İki parmakla yakınlaştır: boyama olmamalı, yakınlaştırma artmalı.
await tapSelector('[aria-label^="Yakınlaştırma yüzde"]'); // %100'e dön
const before = await evaluate("__zoom()");
const vp = await evaluate("(() => { const r = document.querySelector('.canvas-viewport').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()");
await touch("touchStart", [[vp.x - 20, vp.y]]);
await wait(30);
await touch("touchStart", [[vp.x - 20, vp.y], [vp.x + 20, vp.y]]);
for (let i = 1; i <= 8; i++) { await touch("touchMove", [[vp.x - 20 - i * 10, vp.y], [vp.x + 20 + i * 10, vp.y]]); await wait(20); }
await touch("touchEnd", []); await wait(80);
const afterPinch = await evaluate("__zoom()");
const pinchFills = await evaluate("__fills()");
result("iki parmak yakınlaştırır ve boyamaz", afterPinch !== before && pinchFills.length === 0, `${before} → ${afterPinch}, boyalı: ${pinchFills.length}`);

// Renk paneli mobilde
await tapSelector("#tab-colors"); await wait(400);
await shot(`step3-${label}-mobile-colors`);

// Mobil panel: kaydırılmış içerikte aşağı çekmek paneli kapatmamalı; en üstteyken aşağı çekmek kapatmalı.
await open(375, 480, true); // kısa ekran: Renkler paneli kaydırılabilir olur
// Kısa ekranda ayraçlar sayfanın altında, görünür alanın dışında kalır; panel doğrudan açılır (test konusu panelin içi).
await evaluate("document.querySelector('#tab-colors').click(); true"); await wait(450);
const scrollable = await evaluate("(() => { const p = document.querySelector('.paper-panel'); return p.scrollHeight - p.clientHeight; })()");
const swipeDown = async () => {
  const r = await evaluate("(() => { const b = document.querySelector('.paper-panel').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 60 }; })()");
  await touch("touchStart", [[r.x, r.y]]);
  for (let i = 1; i <= 6; i++) { await touch("touchMove", [[r.x, r.y + i * 20]]); await wait(16); }
  await touch("touchEnd", []); await wait(450);
};
await evaluate("document.querySelector('.paper-panel').scrollTop = 1e6; true");
await swipeDown();
const openAfterScrolledSwipe = await evaluate("document.querySelector('.panel-layer').dataset.open");
result("kaydırılmış panelde aşağı çekmek paneli kapatmaz", scrollable > 0 && openAfterScrolledSwipe === "true", `kaydırılabilir: ${scrollable}px, açık: ${openAfterScrolledSwipe}`);
await evaluate("document.querySelector('.paper-panel').scrollTop = 0; true");
await swipeDown();
const openAfterTopSwipe = await evaluate("document.querySelector('.panel-layer').dataset.open");
result("panel en üstteyken aşağı çekmek kapatır", openAfterTopSwipe === "false", `açık: ${openAfterTopSwipe}`);

const closed = new Promise((r) => ws.addEventListener("close", r));
ws.close();
await closed;
await fetch(`http://127.0.0.1:9233/json/close/${list.id}`);
console.log(failures === 0 ? "SONUÇ: tüm kontroller geçti" : `SONUÇ: ${failures} kontrol başarısız`);
// process.exit yerine: Windows'ta bağlantı kapanırken zorla çıkmak Node'u çökertebiliyor.
process.exitCode = failures === 0 ? 0 : 1;
