// Polygo tarayıcı doğrulaması: Chrome DevTools Protocol ile gerçek fare, teker ve dokunma olayları gönderir, sonucu sayfadan okur.
// Ek paket gerektirmez (Node 22+: fetch ve WebSocket yerleşik). Uygulama koduna dahil değildir; elle çalıştırılır.
//
// Kullanım:
//   1. npm run build && npm run start -- -p 3123
//   2. chrome --headless=new --remote-debugging-port=9233 --user-data-dir=<geçici klasör> about:blank
//   3. node scripts/verify-paint.mjs <etiket> [ekran-görüntüsü-klasörü]
// Betik varsayılan şablonla (Kare) çalışır; köşe hesabı yalnız Kare ve Dörtlü id'lerini bilir.
// Dörtlü'yü denemek için paintStore.ts'te başlangıç şablonunu geçici olarak "cross" yapıp yeniden derleyin ve etiketi
// "cross" verin. Şablon seçiminin kendisi scripts/verify-templates.mjs ile denenir.
// Çıktı: her kontrol için "OK" ya da "HATA" satırı. Herhangi bir HATA varsa çıkış kodu 1.
//
// Yalnız boyalı hücreler DOM'da olduğundan hücre geometrisi id'den hesaplanır (dünya koordinatı) ve SVG'nin
// ekran dönüşümüyle (getScreenCTM) piksele çevrilir.
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
const evaluate = async (expr) => {
  const response = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(`sayfada hata: ${response.exceptionDetails.exception?.description ?? response.exceptionDetails.text}
${expr.slice(0, 200)}`);
  return response.result.value;
};
const shot = async (name) => {
  if (!outDir) return;
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${outDir}/${name}.png`, Buffer.from(data, "base64"));
  console.log("ekran görüntüsü:", `${outDir}/${name}.png`);
};

// Sayfa içi yardımcılar.
// __points(id): hücrenin dünya köşeleri (id'den). __geom(id): ekrandaki iç teğet daire merkezi ve yarıçapı.
// __worldToScreen(x, y): dünya noktasının ekran konumu.
const HELPERS = `
window.__points = (id) => {
  const m = id.match(/^(-?\\d+)-(-?\\d+)(?:-(\\w+))?$/);
  const x = +m[1], y = +m[2], part = m[3], c = [x + .5, y + .5];
  const tl = [x, y], tr = [x + 1, y], br = [x + 1, y + 1], bl = [x, y + 1];
  return ({ undefined: [tl, tr, br, bl], a: [tl, tr, bl], b: [tr, br, bl],
    top: [tl, tr, c], right: [tr, br, c], bottom: [br, bl, c], left: [bl, tl, c] })[part];
};
window.__worldToScreen = (x, y) => { const m = document.querySelector('.drawing-canvas').getScreenCTM(); return { x: x*m.a + y*m.c + m.e, y: x*m.b + y*m.d + m.f }; };
window.__geom = (id) => {
  const pts = __points(id).map(([x, y]) => __worldToScreen(x, y));
  if (pts.length === 3) {
    const [A,B,C] = pts; const d = (u,v) => Math.hypot(u.x-v.x, u.y-v.y);
    const a = d(B,C), b = d(A,C), c = d(A,B), s = (a+b+c)/2;
    const area = Math.abs((B.x-A.x)*(C.y-A.y) - (C.x-A.x)*(B.y-A.y))/2;
    return { x: (a*A.x+b*B.x+c*C.x)/(2*s), y: (a*A.y+b*B.y+c*C.y)/(2*s), r: area/s };
  }
  const xs = pts.map(q=>q.x), ys = pts.map(q=>q.y);
  return { x: (Math.min(...xs)+Math.max(...xs))/2, y: (Math.min(...ys)+Math.max(...ys))/2, r: (Math.max(...xs)-Math.min(...xs))/2 };
};
window.__fills = () => [...document.querySelectorAll('[data-cell-id]')].map(p => p.dataset.cellId).sort();
window.__zoom = () => document.querySelector('.zoom-level').textContent;
window.__rect = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
true;`;

// Şablona göre hücre id'si: Kare "x-y", Çapraz "x-y-a", Dörtlü "x-y-top".
const PART = { square: "", diagonal: "-a", cross: "-top" }[label];
const cell = (x, y) => `${x}-${y}${PART}`;

async function open(width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  await send("Page.navigate", { url: URL });
  await wait(2800); // açılış animasyonları
  await evaluate(HELPERS);
}

const touch = (type, points) => send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([x, y], i) => ({ x, y, id: i })) });
async function tap(x, y) { await touch("touchStart", [[x, y]]); await touch("touchEnd", []); await wait(30); }
async function mouse(type, x, y, button = "left") {
  const buttons = type === "mouseReleased" ? 0 : button === "middle" ? 4 : 1;
  await send("Input.dispatchMouseEvent", { type, x, y, button, buttons, clickCount: 1 });
}
async function click(x, y) { await mouse("mousePressed", x, y); await mouse("mouseReleased", x, y); await wait(60); }
async function wheel(x, y, deltaX, deltaY, modifiers = 0) {
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX, deltaY, modifiers }); await wait(80);
}
async function key(keyName, code, vk, modifiers = 0) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code, windowsVirtualKeyCode: vk, modifiers });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code, windowsVirtualKeyCode: vk, modifiers });
}
const center = (sel) => evaluate(`(() => { const r = __rect('${sel}'); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
async function clickSelector(sel) { const c = await center(sel); await click(c.x, c.y); }
async function tapSelector(sel) { const c = await center(sel); await tap(c.x, c.y); await wait(60); }
const geom = (id) => evaluate(`__geom('${id}')`);
const fills = () => evaluate("__fills()");
let failures = 0;
const result = (name, ok, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "HATA"} ${name}${detail ? " — " + detail : ""}`);
};

// ---------- Masaüstü (1280×800, fare) ----------
await send("Page.enable");
await open(1280, 800, false);
await shot(`step4-${label}-desktop-empty`);
{
  const layout = await evaluate(`({
    pageScroll: document.scrollingElement.scrollHeight - innerHeight,
    islandOutside: !document.querySelector('.island').closest('.notebook'),
    onlyCanvas: [...document.querySelector('.notebook').children].map(e => e.className.baseVal ?? e.className).join(' | '),
    canvas: __rect('.drawing-canvas'), notebook: __rect('.notebook'), island: __rect('.island'),
  })`);
  result("sayfa kaymaz (tuval ekranı doldurur)", layout.pageScroll <= 0, `taşma ${layout.pageScroll}px`);
  result("ada defterin dışında, üstünde", layout.islandOutside && layout.island.bottom <= layout.notebook.top, `ada alt ${layout.island.bottom}, defter üst ${layout.notebook.top}`);
  const same = ["left", "top", "right", "bottom"].every((k) => Math.abs(layout.canvas[k] - layout.notebook[k]) < 1);
  result("ızgara sayfayı kenardan kenara doldurur", same, `defter çocukları: ${layout.onlyCanvas}`);
}

let g = await geom(cell(0, 0));
await click(g.x, g.y);
result("tık tek hücre boyar", JSON.stringify(await fills()) === JSON.stringify([cell(0, 0)]), JSON.stringify(await fills()));

// Sürükleme: 1. satır boyunca 0..3
const row = [0, 1, 2, 3].map((x) => cell(x, 1));
const rowPts = [];
for (const id of row) rowPts.push(await geom(id));
await mouse("mousePressed", rowPts[0].x, rowPts[0].y);
for (const p of rowPts.slice(1)) await mouse("mouseMoved", p.x, p.y);
await mouse("mouseReleased", rowPts.at(-1).x, rowPts.at(-1).y); await wait(60);
const afterDrag = await fills();
result("sürükleme hücreleri boyar", row.every((id) => afterDrag.includes(id)), `${afterDrag.length} boyalı`);
await clickSelector('[aria-label="geri al"]');
result("adadaki geri al sürüklemeyi tek adımda geri alır", (await fills()).length === 1);
await clickSelector('[aria-label="yinele"]');
result("adadaki yinele geri getirir", (await fills()).length === afterDrag.length);

// Hızlı sürükleme: 3. satırda -4'ten 4'e TEK fare hareketi; aradaki her karede en az bir hücre boyanmalı.
{
  const from = await geom(cell(-4, 3));
  const to = await geom(cell(4, 3));
  await mouse("mousePressed", from.x, from.y);
  await mouse("mouseMoved", to.x, from.y);
  await mouse("mouseReleased", to.x, from.y); await wait(60);
  const painted = await fills();
  const missing = [];
  for (let x = -4; x <= 4; x++) if (!painted.some((id) => id.startsWith(`${x}-3`))) missing.push(x);
  result("hızlı sürükleme aradaki kareleri atlamaz (negatif x dahil)", missing.length === 0, `boş kalan sütunlar: [${missing}]`);
  await clickSelector('[aria-label="geri al"]');
}

// Teker: aşağı 200px kaydırınca hücre ekranda 200px yukarı gider; boyama değişmez.
{
  const before = await geom(cell(0, 0));
  const c = await center(".drawing-canvas");
  await wheel(c.x, c.y, 0, 200);
  const after = await geom(cell(0, 0));
  result("teker dikey kaydırır", Math.abs(before.y - after.y - 200) < 0.5 && Math.abs(before.x - after.x) < 0.5, `Δy ${(before.y - after.y).toFixed(1)}`);
  await wheel(c.x, c.y, 0, 300, 8); // Shift
  const shifted = await geom(cell(0, 0));
  result("Shift + teker yatay kaydırır", Math.abs(after.x - shifted.x - 300) < 0.5, `Δx ${(after.x - shifted.x).toFixed(1)}`);
  await wheel(c.x, c.y, -300, -200);
}

// Ctrl + teker: imlecin altındaki dünya noktası yerinde kalarak yakınlaşır.
{
  const anchor = await geom(cell(2, 2));
  const before = await evaluate("__zoom()");
  await wheel(anchor.x, anchor.y, 0, -60, 2); // Ctrl
  const zoomed = await geom(cell(2, 2));
  const after = await evaluate("__zoom()");
  result("Ctrl + teker imleç çevresinde yakınlaştırır", before !== after && Math.hypot(zoomed.x - anchor.x, zoomed.y - anchor.y) < 1, `${before} → ${after}, hücre kayması ${Math.hypot(zoomed.x - anchor.x, zoomed.y - anchor.y).toFixed(2)}px`);
  await clickSelector(".zoom-level");
  result("% düğmesi %100'e döndürür", (await evaluate("__zoom()")) === "100%");
}

// Orta tuşla sürükleme kaydırır, boyamaz.
{
  const before = await geom(cell(0, 0));
  const paintedBefore = (await fills()).length;
  const c = await center(".drawing-canvas");
  await mouse("mousePressed", c.x, c.y, "middle");
  for (let i = 1; i <= 5; i++) await mouse("mouseMoved", c.x - i * 30, c.y - i * 20, "middle");
  await mouse("mouseReleased", c.x - 150, c.y - 100, "middle"); await wait(60);
  const after = await geom(cell(0, 0));
  result("orta tuşla sürükleme kaydırır, boyamaz", Math.abs(before.x - after.x - 150) < 0.5 && Math.abs(before.y - after.y - 100) < 0.5 && (await fills()).length === paintedBefore,
    `Δ (${(before.x - after.x).toFixed(1)}, ${(before.y - after.y).toFixed(1)})`);
}

// Sınırsız: çok uzağa kaydır (≈ 125 kare), orada boya; geri dön, eski boyama yerinde.
{
  const c = await center(".drawing-canvas");
  for (let i = 0; i < 10; i++) await wheel(c.x, c.y, 500, 0);
  const far = await evaluate(`(() => { const m = document.querySelector('.drawing-canvas').getScreenCTM().inverse(); return [Math.floor(${c.x}*m.a + ${c.y}*m.c + m.e), Math.floor(${c.x}*m.b + ${c.y}*m.d + m.f)]; })()`);
  const farId = cell(far[0], far[1]);
  g = await geom(farId);
  await click(g.x, g.y);
  const farFills = await fills();
  result("uzakta (sınırsız ızgarada) boyanır", far[0] > 100 && farFills.includes(farId), `${farId}, görünen boyalı: ${JSON.stringify(farFills)}`);
  await shot(`step4-${label}-desktop-far`);
  for (let i = 0; i < 10; i++) await wheel(c.x, c.y, -500, 0);
  result("geri dönünce eski boyama yerinde", (await fills()).includes(cell(0, 0)));
}

// Renk: Renkler panelinden kiremit seç, negatif koordinatta boya.
await clickSelector("#tab-colors");
await clickSelector('[aria-label="kiremit"]');
await key("Escape", "Escape", 27); await wait(400);
g = await geom(cell(-3, -2));
await click(g.x, g.y);
const negFill = await evaluate(`document.querySelector('[data-cell-id="${cell(-3, -2)}"]')?.style.fill`);
result("negatif koordinatlı hücre seçilen renkle boyanır", negFill === "rgb(217, 72, 43)", `${cell(-3, -2)}: ${negFill}`);
await click(g.x, g.y);
result("aynı renge tekrar tık siler", !(await fills()).includes(cell(-3, -2)));
// Gösterim için birkaç hücre boya ve masaüstü ekran görüntüsü al.
for (const [x, y] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0]]) { g = await geom(cell(x, y)); await click(g.x, g.y); }
await shot(`step4-${label}-desktop-painted`);
await clickSelector('[aria-label="temizle"]');
result("temizle boşaltır", (await fills()).length === 0);
await key("z", "KeyZ", 90, 2); await wait(60);
result("Ctrl+Z temizlemeyi geri alır", (await fills()).length > 0);

// Klavye: 0-0'a tıkla (odak), temizle, tuvale odaklan; sola 30 kez git (ekran dışına), Enter.
g = await geom(cell(0, 0));
await click(g.x, g.y);
await evaluate("document.querySelector('[aria-label=\"temizle\"]').click(); document.querySelector('.drawing-canvas').focus(); true");
for (let i = 0; i < 30; i++) await key("ArrowLeft", "ArrowLeft", 37);
await key("Enter", "Enter", 13); await wait(80);
{
  const keyFills = await fills();
  const target = keyFills[0];
  const visible = target && await evaluate(`(() => { const g = __geom('${target}'); const r = __rect('.drawing-canvas'); return g.x > r.left && g.x < r.right && g.y > r.top && g.y < r.bottom; })()`);
  result("klavye: 30 kez sol ok + Enter, ekran dışına çıkan hücreyi boyar ve görüş onu izler", keyFills.length === 1 && target.startsWith("-") && visible, JSON.stringify(keyFills));
}

// Adadaki + düğmesi
await evaluate("document.querySelector('[aria-label=\"temizle\"]').click(); true");
await clickSelector('[aria-label="Yakınlaştır"]');
result("adadaki + yakınlaştırır", (await evaluate("__zoom()")) === "150%", await evaluate("__zoom()"));
await clickSelector(".zoom-level");

// ---------- Mobil (375×812, dokunma) ----------
await open(375, 812, true);
await shot(`step4-${label}-mobile-empty`);
{
  const layout = await evaluate(`({ island: __rect('.island'), notebook: __rect('.notebook'), canvas: __rect('.drawing-canvas'), overflow: document.scrollingElement.scrollWidth - innerWidth })`);
  result("mobil: ada ekrana sığar, yatay taşma yok", layout.island.left >= 0 && layout.island.right <= 375 && layout.overflow <= 0, `ada ${layout.island.left.toFixed(0)}–${layout.island.right.toFixed(0)}px, genişlik ${layout.island.width.toFixed(0)}px`);
  const buttons = await evaluate(`[...document.querySelectorAll('.island button')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })`);
  result("mobil: adadaki düğmeler ≥44px", buttons.every((s) => s >= 44), `${buttons.length} düğme, en küçük ${Math.min(...buttons)}px`);
}
// Dokunma iptali (pointercancel): yarım fırça kaydedilmemeli, geçmişe yazılmamalı.
{
  const a = await geom(cell(0, 0));
  const b = await geom(cell(1, 0));
  await touch("touchStart", [[a.x, a.y]]);
  await touch("touchMove", [[b.x, b.y]]);
  await touch("touchCancel", []); await wait(60);
  const cancelFills = await fills();
  const undoDisabled = await evaluate("document.querySelector('[aria-label=\"geri al\"]').disabled");
  result("dokunma iptali fırçayı geri alır, geçmişe yazmaz", cancelFills.length === 0 && undoDisabled, `boyalı: ${cancelFills.length}, geri al kapalı: ${undoDisabled}`);
  await tap(a.x, a.y);
  result("iptalden sonraki dokunuş normal boyar", JSON.stringify(await fills()) === JSON.stringify([cell(0, 0)]));
  await tap(a.x, a.y);
}

// + düğmesine dokunarak her hücre biçiminde ≥44px'e ulaşana dek yakınlaştır (kare başına tüm hücreler ölçülür).
const squareIds = await evaluate(`(() => { const p = ${JSON.stringify(PART)}; return p === "" ? ["0-0"] : p === "-a" ? ["0-0-a", "0-0-b"] : ["0-0-top", "0-0-right", "0-0-bottom", "0-0-left"]; })()`);
const minDiameter = async () => { let r = Infinity; for (const id of squareIds) r = Math.min(r, (await geom(id)).r); return 2 * r; };
let diameter = await minDiameter();
console.log(`375px, 100%: en küçük iç teğet daire çapı ${diameter.toFixed(1)}px`);
let zoomTaps = 0;
while (diameter < 44 && zoomTaps < 5) {
  await tapSelector('[aria-label="Yakınlaştır"]');
  zoomTaps++;
  diameter = await minDiameter();
  console.log(`  + (${zoomTaps}) → ${await evaluate("__zoom()")}: en küçük iç teğet daire çapı ${diameter.toFixed(1)}px`);
}
result("yakınlaştırınca her hücrede ≥44px çaplı daire sığar", diameter >= 44, `${zoomTaps} dokunuş, ${await evaluate("__zoom()")}`);

// Dokunma isabeti: ekranın ortasındaki kareler; merkez ve merkezden 15px (iç teğet daire içinde) kaymış 8 nokta.
{
  const c = await center(".drawing-canvas");
  const origin = await evaluate(`(() => { const m = document.querySelector('.drawing-canvas').getScreenCTM().inverse(); return [Math.floor(${c.x}*m.a + ${c.y}*m.c + m.e), Math.floor(${c.x}*m.b + ${c.y}*m.d + m.f)]; })()`);
  // Ortadaki kare ve altı/üstü (yakınken kare 135px olabilir; yan kareler 375px ekrana sığmaz). Ekran dışındakiler elenir.
  const targets = [];
  for (const dy of [0, -1, 1]) {
    for (const id of squareIds) {
      const target = id.replace(/^0-0/, `${origin[0]}-${origin[1] + dy}`);
      const inside = await evaluate(`(() => { const g = __geom('${target}'); const r = __rect('.drawing-canvas'); return g.x - g.r > r.left && g.x + g.r < r.right && g.y - g.r > r.top && g.y + g.r < r.bottom; })()`);
      if (inside) targets.push(target);
    }
  }
  let hits = 0, misses = 0;
  const offsets = [[0, 0], [15, 0], [-15, 0], [0, 15], [0, -15], [10.6, 10.6], [-10.6, 10.6], [10.6, -10.6], [-10.6, -10.6]];
  for (const id of targets) {
    for (const [dx, dy] of offsets) {
      const t = await geom(id);
      const k = Math.min(1, (t.r - 2) / 15);
      await tap(t.x + dx * k, t.y + dy * k);
      const f = await fills();
      if (f.length === 1 && f[0] === id) hits++; else { misses++; console.log("   ıska", id, dx, dy, JSON.stringify(f)); }
      await tap(t.x, t.y);
      if ((await fills()).length !== 0) await evaluate("document.querySelector('[aria-label=\"temizle\"]').click()");
    }
  }
  result("dokunuş yalnız hedef hücreyi boyar (komşu boyanmaz)", misses === 0, `${hits} isabet / ${hits + misses} dokunuş, ${targets.length} hücre`);

  // Tek parmakla sürükleyerek boya
  const drag = [];
  for (const id of targets.slice(0, 3)) drag.push(await geom(id));
  await touch("touchStart", [[drag[0].x, drag[0].y]]);
  for (const p of drag.slice(1)) { await touch("touchMove", [[p.x, p.y]]); await wait(20); }
  await touch("touchEnd", []); await wait(60);
  const dragged = await fills();
  result("tek parmak sürükleme boyar", targets.slice(0, 3).every((id) => dragged.includes(id)), JSON.stringify(dragged));
  await shot(`step4-${label}-mobile-zoomed-painted`);
  await evaluate("document.querySelector('[aria-label=\"temizle\"]').click(); true");
}

// İki parmak: aralarını açınca yakınlaşır; birlikte kaydırınca görüş kayar; hiçbiri boyamaz.
{
  await evaluate("document.querySelector('.zoom-level').click(); true"); // %100
  const before = await evaluate("__zoom()");
  const c = await center(".drawing-canvas");
  await touch("touchStart", [[c.x - 20, c.y]]);
  await wait(30);
  await touch("touchStart", [[c.x - 20, c.y], [c.x + 20, c.y]]);
  for (let i = 1; i <= 8; i++) { await touch("touchMove", [[c.x - 20 - i * 10, c.y], [c.x + 20 + i * 10, c.y]]); await wait(20); }
  await touch("touchEnd", []); await wait(80);
  const afterPinch = await evaluate("__zoom()");
  result("iki parmak yakınlaştırır ve boyamaz", afterPinch !== before && (await fills()).length === 0, `${before} → ${afterPinch}`);

  const startCell = await geom(cell(0, 0));
  await touch("touchStart", [[c.x - 40, c.y]]);
  await wait(30);
  await touch("touchStart", [[c.x - 40, c.y], [c.x + 40, c.y]]);
  for (let i = 1; i <= 6; i++) { await touch("touchMove", [[c.x - 40, c.y - i * 20], [c.x + 40, c.y - i * 20]]); await wait(20); }
  await touch("touchEnd", []); await wait(80);
  const endCell = await geom(cell(0, 0));
  result("iki parmakla birlikte sürükleme kaydırır, boyamaz", Math.abs(startCell.y - endCell.y - 120) < 1 && (await fills()).length === 0, `Δy ${(startCell.y - endCell.y).toFixed(1)}`);
}

// Mobil renk paneli. Chrome, iki parmakla kaydırmadan hemen sonra (~100 ms) gelen dokunuşun click olayını yutar
// (kaydırmayı durdurma dokunuşu sayar); gerçek kullanımı taklit etmek için bir süre beklenir.
await wait(1000);
await tapSelector("#tab-colors"); await wait(400);
result("mobil: Renkler ayracı paneli açar", (await evaluate("document.querySelector('.panel-layer').dataset.open")) === "true");
await shot(`step4-${label}-mobile-colors`);

// Mobil panel (Adım 3 regresyonu): kaydırılmış içerikte aşağı çekmek kapatmamalı; en üstteyken kapatmalı.
await open(375, 480, true);
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
result("panel en üstteyken aşağı çekmek kapatır", (await evaluate("document.querySelector('.panel-layer').dataset.open")) === "false");

const closed = new Promise((r) => ws.addEventListener("close", r));
ws.close();
await closed;
await fetch(`http://127.0.0.1:9233/json/close/${list.id}`);
console.log(failures === 0 ? "SONUÇ: tüm kontroller geçti" : `SONUÇ: ${failures} kontrol başarısız`);
// process.exit yerine: Windows'ta bağlantı kapanırken zorla çıkmak Node'u çökertebiliyor.
process.exitCode = failures === 0 ? 0 : 1;
