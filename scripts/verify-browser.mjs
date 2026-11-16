// Yayın öncesi tarayıcı kontrolleri tek komutla: production sunucusunu (3123) ve headless Chrome'u (CDP 9233)
// açar, verify-release ve verify-download betiklerini sırayla çalıştırır, sonra ikisini de kapatır.
// Önce `npm run build` gerekir. Chrome başka yerdeyse: CHROME_PATH=<chrome yolu> npm run verify:browser
// Portlardan biri doluysa hiç başlamaz: aksi hâlde başka (eski) bir sunucu ya da Chrome test edilmiş olurdu.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { APP_URL, CHROME_PORT, wait } from "./cdp.mjs";

const APP_PORT = Number(new URL(APP_URL).port);
const DEFAULT_CHROME = {
  win32: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "google-chrome",
};
const chromePath = process.env.CHROME_PATH ?? DEFAULT_CHROME[process.platform];

// Port bu adreste dinlenebiliyorsa boştur.
function canListen(port, host) {
  return new Promise((done) => {
    const probe = createServer();
    probe.once("error", () => done(false));
    probe.listen(port, host, () => probe.close(() => done(true)));
  });
}

for (const port of [APP_PORT, CHROME_PORT]) {
  const free = (await canListen(port, "127.0.0.1")) && (await canListen(port));
  if (!free) {
    console.error(
      `Port ${port} dolu. Önce o süreci kapatın (eski sunucu ya da Chrome yanlışlıkla test edilmesin).`,
    );
    process.exit(1);
  }
}

const workDir = mkdtempSync(join(tmpdir(), "polygo-verify-"));

// Sunucu ya da Chrome testler bitmeden kapanırsa (port, eksik build, yanlış Chrome yolu...) sonuç başarısızdır.
let childProblem = null;
let stopping = false;
function start(name, command, args) {
  const child = spawn(command, args, { stdio: "ignore" });
  child.on("error", (error) => {
    childProblem ??= `${name} başlatılamadı: ${error.message}`;
  });
  child.on("exit", (code) => {
    if (!stopping)
      childProblem ??= `${name} beklenmedik şekilde kapandı (çıkış kodu ${code})`;
  });
  return child;
}

const server = start("Sunucu", process.execPath, [
  resolve("node_modules/next/dist/bin/next"),
  "start",
  "-p",
  String(APP_PORT),
]);
const chrome = start("Chrome", chromePath, [
  "--headless=new",
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${join(workDir, "chrome")}`,
  "about:blank",
]);

// Windows'ta Chrome alt süreçleriyle birlikte kapanmalı; kill() yalnız ana süreci kapatır.
function stop(child) {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === "win32")
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  else child.kill();
}

async function waitForUrl(url, timeout = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (childProblem) throw new Error(childProblem);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // henüz açılmadı
    }
    await wait(250);
  }
  throw new Error(`açılmadı: ${url}`);
}

function runScript(script) {
  return new Promise((done) => {
    const child = spawn(
      process.execPath,
      [resolve("scripts", script), join(workDir, "downloads")],
      { stdio: "inherit" },
    );
    child.on("close", (code) => done(code));
  });
}

let failed = false;
try {
  await waitForUrl(APP_URL);
  await waitForUrl(`http://127.0.0.1:${CHROME_PORT}/json/version`);
  for (const script of ["verify-release.mjs", "verify-download.mjs"]) {
    console.log(`\n== ${script}`);
    if ((await runScript(script)) !== 0) failed = true;
    if (childProblem) throw new Error(childProblem);
  }
} catch (error) {
  console.error(error.message);
  failed = true;
} finally {
  stopping = true;
  stop(chrome);
  stop(server);
  await wait(500); // Chrome profil klasörünü bıraksın
  rmSync(workDir, { recursive: true, force: true, maxRetries: 5 });
}

console.log(
  failed
    ? "\nSONUÇ: tarayıcı kontrolleri BAŞARISIZ"
    : "\nSONUÇ: tarayıcı kontrolleri geçti",
);
process.exit(failed ? 1 : 0);
