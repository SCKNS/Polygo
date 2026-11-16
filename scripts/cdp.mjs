// Tarayıcı doğrulama betiklerinin ortak altyapısı: Chrome DevTools Protocol (CDP) bağlantısı, sayfada kod
// çalıştırma, bekleme, dokunma/tıklama ve indirilen dosyayı bekleme. Senaryolar ve ölçümler betiklerin kendisindedir.
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export const APP_URL = "http://localhost:3123/";
export const CHROME_PORT = 9233;

export const wait = (milliseconds) =>
  new Promise((done) => setTimeout(done, milliseconds));

// Chrome'da yeni bir sekme açar ve ona bağlanır.
export async function connect() {
  const target = await (
    await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    ws.addEventListener("open", done);
    ws.addEventListener("error", () =>
      fail(new Error("CDP bağlantısı açılamadı")),
    );
  });

  let sequence = 0;
  const pending = new Map();
  // Bekleyen isteği sonuçlandırır; zaman aşımı sayacını da durdurur.
  function settle(id, error, result) {
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    clearTimeout(request.timer);
    if (error) request.reject(error);
    else request.accept(result);
  }
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    settle(
      message.id,
      message.error && new Error(JSON.stringify(message.error)),
      message.result,
    );
  });
  // Chrome kapanır ya da çökerse bekleyen hiçbir istek askıda kalmaz.
  const failAll = (reason) => {
    for (const id of [...pending.keys()]) settle(id, new Error(reason));
  };
  ws.addEventListener("close", () => failAll("CDP bağlantısı kapandı"));
  ws.addEventListener("error", () => failAll("CDP bağlantı hatası"));

  // Her istek en fazla REQUEST_TIMEOUT bekler (büyük PNG ölçümü birkaç saniye sürebilir).
  const REQUEST_TIMEOUT = 60_000;
  const send = (method, params = {}) =>
    new Promise((accept, reject) => {
      if (ws.readyState !== WebSocket.OPEN)
        return reject(new Error("CDP bağlantısı açık değil"));
      const id = ++sequence;
      const timer = setTimeout(
        () => settle(id, new Error(`CDP zaman aşımı: ${method}`)),
        REQUEST_TIMEOUT,
      );
      pending.set(id, { accept, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });

  // Sayfada bir JS ifadesi çalıştırır, sonucunu (Promise ise bekleyerek) döndürür.
  async function evaluate(expression) {
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

  async function elementCenter(selector) {
    const point = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      element.scrollIntoView({ block: "center" });
      const box = element.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    })()`);
    if (!point) throw new Error(`öğe bulunamadı: ${selector}`);
    return point;
  }

  async function tap(point) {
    await send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    await send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await wait(120);
  }

  async function click(point) {
    const button = { ...point, button: "left", clickCount: 1 };
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...button });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      ...button,
    });
    await wait(150);
  }

  // Sonraki indirmeler bu klasöre iner.
  async function setDownloadDirectory(directory) {
    mkdirSync(directory, { recursive: true });
    await send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: directory,
    });
  }

  return {
    send,
    evaluate,
    waitFor,
    elementCenter,
    tap,
    click,
    setDownloadDirectory,
    close: () => ws.close(),
  };
}

// Klasörde bu uzantılı dosya tamamlanınca (yarım .crdownload kalmayınca) içeriğini döndürür.
export async function waitForDownload(directory, extension, timeout = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const names = readdirSync(directory);
    const name = names.find((item) => item.endsWith(extension));
    if (name && !names.some((item) => item.endsWith(".crdownload")))
      return readFileSync(resolve(directory, name));
    await wait(150);
  }
  throw new Error(`${extension} indirmesi zaman aşımına uğradı`);
}

// Kontrol sonuçlarını yazar ve başarısızları sayar.
export function createChecker() {
  let failures = 0;
  return {
    check(name, result, detail = "") {
      if (!result) failures++;
      console.log(
        `${result ? "OK  " : "HATA"} ${name}${detail ? ` (${detail})` : ""}`,
      );
    },
    get failures() {
      return failures;
    },
  };
}
