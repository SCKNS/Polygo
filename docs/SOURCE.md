# Polygo — tam kaynak kodu

Dosya ağacı ve kurulum: README.md. Kilit dosyası package-lock.json projede ayrıca bulunur.

## .gitignore

```
node_modules/
.next/
out/
dist/
.env*
!.env.example
*.tsbuildinfo
next-env.d.ts
docs/review_diff.patch

```

## package.json

```
{
  "name": "polygo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --hostname 0.0.0.0",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "16.4.6",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.5",
    "tailwindcss": "4.3.5",
    "@types/node": "22.20.5",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "typescript": "5.9.3",
    "eslint": "9.39.5",
    "eslint-config-next": "16.4.6"
  }
}

```

## tsconfig.json

```
{
  "compilerOptions": {
    "target": "ES2017", "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true, "skipLibCheck": true, "strict": true, "noEmit": true,
    "esModuleInterop": true, "module": "esnext", "moduleResolution": "bundler",
    "resolveJsonModule": true, "isolatedModules": true, "jsx": "react-jsx",
    "incremental": true, "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

## postcss.config.mjs

```
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;

```

## eslint.config.mjs

```
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([...nextVitals, ...nextTs, globalIgnores([".next/**", "out/**", "next-env.d.ts"])]);

```

## app/layout.tsx

```
import type { Metadata } from "next";
import { Caveat, DM_Sans } from "next/font/google";
import "./globals.css";

// Latin-ext, Türkçe harflerin başka bir yazı tipine düşmesini önler.
const handwriting = Caveat({ subsets: ["latin", "latin-ext"], variable: "--font-hand", display: "swap" });
const interfaceFont = DM_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: "Polygo — küçük bir çizim defteri",
  description: "Bir ızgara, birkaç hücre, sana ait bir işaret. Polygo çizim defteri.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className={`${handwriting.variable} ${interfaceFont.variable}`}>{children}</body></html>;
}

```

## app/page.tsx

```
import Notebook from "@/components/Notebook";

export default function Home() {
  return <Notebook />;
}

```

## app/globals.css

```
@import "tailwindcss";

:root {
  --desk: #e7dfcf;
  --paper: #f7f2e8;
  --paper-shade: #efe8d8;
  --paper-shade-deep: #e9e0cc;
  --ink: #1f2230;
  --ink-line: rgba(31, 34, 48, 0.18);
  --ink-soft: rgba(31, 34, 48, 0.55);
  --accent: #d9482b;
  --ease-paper: cubic-bezier(0.22, 1, 0.36, 1);
}

* { box-sizing: border-box; }
html { background: var(--desk); }
body { margin: 0; color: var(--ink); font-family: var(--font-ui), sans-serif; -webkit-font-smoothing: antialiased; }
button { font: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }
button:not(:disabled) { cursor: pointer; }
button:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--accent); outline-offset: 5px; }
button:disabled { cursor: default; }
::selection { background: var(--paper-shade-deep); color: var(--ink); }

/* Doku tek katmanda kalır; metin ve çizgiler her zaman keskindir. */
.desk { min-height: 100svh; padding: 28px 62px 34px 46px; isolation: isolate; animation: desk-appear 400ms ease both; }
.desk::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: .032; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.76' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath fill='%231f2230' filter='url(%23n)' opacity='.8' d='M0 0h180v180H0z'/%3E%3C/svg%3E"); }
.notebook { position: relative; min-height: calc(100svh - 62px); display: flex; flex-direction: column; border-radius: 7px; background: var(--paper); box-shadow: 0 1px 1px rgba(31,34,48,.1), 0 7px 13px -9px rgba(31,34,48,.24), 0 22px 42px -31px rgba(31,34,48,.24); isolation: isolate; animation: notebook-settle 800ms var(--ease-paper) both; }
/* Üç ince yaprak, ağır bir gölgeye ihtiyaç duymadan derinlik verir. */
.notebook::before, .notebook::after { content: ""; position: absolute; inset: 3px -3px -3px 3px; z-index: -3; border-radius: 7px; background: var(--paper-shade); border: 1px solid rgba(31,34,48,.09); pointer-events: none; }
.notebook::after { inset: 0; z-index: -2; background: var(--paper); border: 0; box-shadow: 4px 6px 0 -2px var(--paper-shade-deep), 5px 7px 0 -2px rgba(31,34,48,.12); }
.page-grid { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; color: var(--ink-line); opacity: .36; mask-image: radial-gradient(ellipse at 50% 49%, #000 15%, transparent 74%); }
.page-grid path, .page-grid line { fill: none; stroke: currentColor; stroke-width: .65; stroke-dasharray: 1; stroke-dashoffset: 1; animation: pencil-draw 900ms var(--ease-paper) 280ms forwards; }
.notebook-header { display: flex; align-items: center; justify-content: space-between; padding: 44px 60px 0 66px; }
.wordmark { display: inline-flex; align-items: center; gap: 10px; color: var(--ink); }
.wordmark-text { font-family: var(--font-hand), cursive; font-size: 49px; line-height: 1; font-weight: 500; letter-spacing: -2px; clip-path: inset(0 100% 0 0); animation: wordmark-write 420ms var(--ease-paper) 1180ms forwards; }
.wordmark-doodle { width: 29px; height: 34px; transform: rotate(-9deg); animation: ink-appear 450ms ease 1220ms both; }
.toolbar { display: flex; align-items: center; gap: 7px; }
.tool-button { position: relative; display: grid; place-items: center; width: 44px; height: 44px; padding: 11px; border: 0; border-radius: 3px; background: transparent; color: var(--ink-soft); }
.tool-button > svg { width: 22px; height: 22px; opacity: .63; }
.tool-tooltip { position: absolute; top: calc(100% + 5px); left: 50%; transform: translate(-50%, -3px); padding: 2px 8px; font-family: var(--font-hand), cursive; font-size: 19px; white-space: nowrap; background: var(--paper); color: var(--ink); opacity: 0; pointer-events: none; transition: opacity 120ms, transform 120ms; }
.tool-button:hover .tool-tooltip, .tool-button:focus-visible .tool-tooltip { opacity: 1; transform: translate(-50%, 0); }
.workspace { position: relative; display: grid; place-items: center; flex: 1; min-height: 490px; padding: 55px 40px 30px; }
.canvas-composition { width: min(100%, 378px); }
.canvas-area { position: relative; width: 100%; }
.drawing-canvas { display: block; width: 100%; height: auto; overflow: visible; cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Ccircle cx='6' cy='6' r='2' fill='%231f2230'/%3E%3C/svg%3E") 6 6, crosshair; }
.canvas-frame { fill: none; stroke: var(--ink); stroke-width: 1.1; opacity: .48; stroke-dasharray: 1; stroke-dashoffset: 1; animation: pencil-draw 700ms var(--ease-paper) 430ms forwards; }
.canvas-grid-line { fill: none; stroke: var(--ink-line); stroke-width: .65; stroke-dasharray: 1; stroke-dashoffset: 1; animation: pencil-draw 650ms var(--ease-paper) 420ms forwards; }
.filled-cell { fill: var(--ink); transform-box: fill-box; transform-origin: center; animation: cell-appear 380ms var(--ease-paper) calc(650ms + var(--cell-index, 0) * 20ms) both; }
.hover-cell { opacity: 0; transition: opacity 120ms ease; }
.hover-cell:hover { opacity: .35; }
.canvas-note { display: flex; justify-content: flex-end; align-items: flex-start; gap: 6px; margin: 20px -5px 0 0; font-family: var(--font-hand), cursive; font-size: 24px; line-height: 1.2; color: var(--ink-soft); transform: rotate(-3deg); animation: ink-appear 450ms ease 1100ms both; }
.canvas-note-arrow { width: 44px; height: 36px; margin-top: -9px; }
.canvas-caption { margin-top: 13px; font-size: 10px; line-height: 1.5; letter-spacing: .16em; color: var(--ink); text-align: left; }
.page-footer { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 60px 30px 66px; font-size: 10px; line-height: 1.6; letter-spacing: .12em; color: var(--ink); }
.page-footer p { margin: 0; }
.page-footer .footer-note { font-family: var(--font-hand), cursive; font-size: 19px; letter-spacing: 0; }

.spiral { position: absolute; left: -29px; top: 31px; bottom: 29px; z-index: 5; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
.spiral-ring { display: block; width: 60px; height: 28px; flex-shrink: 0; animation: ring-drop 390ms cubic-bezier(.2,.9,.35,1.2) calc(100ms + var(--ring-index, 0) * 40ms) both; }
.spiral-highlight { transform: translateX(var(--pointer-x, 0px)); transition: transform 240ms ease-out; }

.index-tabs { position: absolute; top: 32%; right: -34px; z-index: 20; display: flex; flex-direction: column; align-items: flex-start; gap: 13px; }
.index-tab { position: relative; width: 48px; min-height: 121px; display: flex; justify-content: center; align-items: center; padding: 17px 8px 17px 14px; border: 1px solid rgba(31,34,48,.22); border-left: 0; border-radius: 0 5px 5px 0; background: var(--paper-shade); font-family: var(--font-hand), cursive; font-size: 23px; writing-mode: vertical-rl; box-shadow: 2px 2px 3px rgba(31,34,48,.025); transform-origin: left center; transition: transform 260ms var(--ease-paper); animation: tab-reveal 560ms var(--ease-paper) 680ms backwards; }
.index-tab:nth-child(2) { background: var(--paper-shade-deep); animation-delay: 790ms; }
.index-tab:nth-child(3) { min-height: 99px; background: var(--paper-shade); animation-delay: 900ms; }
.index-tab::after { content: ""; position: absolute; top: 16px; bottom: 16px; right: 7px; width: 2px; background: var(--accent); transform: scaleY(0); transform-origin: top; transition: transform 260ms var(--ease-paper); }
.index-tab span { transition: transform 260ms var(--ease-paper); }
.index-tab:hover { transform: translateX(6px) rotate(1deg); }
.index-tab:hover span { transform: translateY(2px); }
.index-tab[data-active="true"] { transform: translateX(8px); }
.index-tab[data-active="true"]::after { transform: scaleY(1); }

/* Kapalı panel DOM'da kalır; kapanış da açılış kadar sakin görünür. */
.panel-layer { position: absolute; inset: 0; z-index: 15; pointer-events: none; visibility: hidden; transition: visibility 0s 260ms; }
.panel-layer[data-open="true"] { pointer-events: auto; visibility: visible; transition-delay: 0s; }
.panel-backdrop { position: absolute; inset: 0; border: 0; background: transparent; padding: 0; }
.paper-panel { position: absolute; right: 10px; top: 50%; width: 320px; min-height: 362px; padding: 31px 27px 33px 31px; background: var(--paper-shade); border: 1px solid rgba(31,34,48,.09); border-radius: 2px; opacity: 0; transform: translate(36px, -49%) rotate(1.2deg); transition: transform 260ms var(--ease-paper), opacity 200ms ease; box-shadow: -15px 12px 28px -19px rgba(31,34,48,.23), -2px 2px 5px -3px rgba(31,34,48,.22); }
.paper-panel::before { content: ""; position: absolute; left: 8px; top: 12px; bottom: 12px; width: 1px; background: repeating-linear-gradient(to bottom, var(--ink-line) 0 2px, transparent 2px 7px); }
.paper-panel::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none; box-shadow: -14px 18px 24px -12px rgba(31,34,48,.18); opacity: 1; transition: opacity 480ms var(--ease-paper); }
.panel-layer[data-open="true"] .paper-panel::after { opacity: 0; }
.panel-layer[data-open="true"] .paper-panel { opacity: 1; transform: translate(0, -50%) rotate(.4deg); transition-duration: 480ms, 280ms; }
.panel-handle { display: none; }
.panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 23px; gap: 8px; }
.panel-header h2 { margin: 0; font-family: var(--font-hand), cursive; font-size: 31px; line-height: 1.2; font-weight: 500; }
.panel-close { display: grid; place-items: center; width: 44px; height: 44px; margin: -9px -10px -9px 0; border: 0; background: transparent; color: var(--ink-soft); }
.panel-close svg { width: 18px; height: 18px; }
.panel-content { font-size: 12px; line-height: 1.7; letter-spacing: .02em; }
/* İçeriğin display geçişi destekleyen tarayıcılarda kâğıtla birlikte kaybolmasını sağlar. */
.panel-content { transition: display 260ms allow-discrete; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.template-option { position: relative; display: flex; flex-direction: column; align-items: center; aspect-ratio: .86; min-width: 0; padding: 5px 6px 8px; border: 1px solid var(--ink-line); border-radius: 2px; background: var(--paper); }
.template-option > span:not(.selected-indicator) { font-size: 9px; line-height: 1.2; color: var(--ink); }
.selected-indicator { position: absolute; top: 1px; right: 5px; color: var(--accent); font-size: 11px; }
.template-option[data-selected="true"], .template-option[aria-pressed="true"] { border-color: var(--accent); }
.mini-grid { display: block; width: 100%; height: auto; color: var(--ink-soft); }
.pigment-row { display: flex; flex-wrap: wrap; align-items: center; gap: 11px; margin: 30px 0 23px; }
.pigment { flex-shrink: 0; display: block; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--ink-line); background: var(--pigment); }
.pigment[data-selected="true"] { outline: 1px solid var(--ink-soft); outline-offset: 3px; }
.custom-pigment { display: grid; place-items: center; width: 46px; height: 46px; margin-top: 18px; border: 1px dashed var(--ink-soft); border-radius: 50%; background: transparent; color: var(--ink-soft); font-size: 23px; font-weight: 300; }
.download-options { display: flex; flex-direction: column; gap: 17px; margin: 30px 0; }
.download-stamp { min-height: 48px; padding: 11px 15px; background: transparent; border: 1px solid var(--ink-soft); border-radius: 2px; font-size: 12px; letter-spacing: .09em; }
.download-stamp:nth-child(2) { transform: rotate(-.7deg); }
.panel-note { margin: 25px 0 0; font-family: var(--font-hand), cursive; font-size: 24px; color: var(--ink-soft); letter-spacing: 0; }
.panel-content > .panel-note:first-child { margin: -4px 0 23px; color: var(--ink); font-size: 30px; }
.panel-eyebrow { font-size: 9px; color: var(--ink); letter-spacing: .16em; }
.panel-footnote { margin: 24px 0 0; font-size: 10px; color: var(--ink); letter-spacing: .025em; }
.download-stamp { display: flex; align-items: center; gap: 5px; text-align: left; }
.download-stamp > span { margin-left: auto; font-size: 18px; }
.download-stamp small { font-size: 10px; letter-spacing: .02em; }

@keyframes desk-appear { from { opacity: 0; } to { opacity: 1; } }
@keyframes notebook-settle { from { opacity: 0; transform: translateY(-6px) scale(.985); } to { opacity: 1; transform: none; } }
@keyframes ring-drop { from { opacity: 0; transform: translateY(-7px); } 75% { opacity: 1; transform: translateY(1px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pencil-draw { to { stroke-dashoffset: 0; } }
@keyframes cell-appear { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
@keyframes ink-appear { from { opacity: 0; } to { opacity: 1; } }
@keyframes tab-reveal { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes wordmark-write { to { clip-path: inset(0 0 0 0); } }

@media (min-height: 950px) and (min-width: 641px) { .canvas-composition { width: min(100%, 420px); } }
@media (max-height: 850px) and (min-width: 641px) { .spiral-ring:nth-child(n+24) { display: none; } }
@media (max-height: 760px) and (min-width: 641px) {
  .notebook-header { padding-top: 28px; }
  .workspace { min-height: 390px; padding-top: 28px; }
  .canvas-composition { width: min(100%, 310px); }
  .spiral-ring:nth-child(n+21) { display: none; }
  .index-tabs { top: 27%; gap: 10px; }
  .index-tab { min-height: 108px; }
}
@media (max-height: 650px) and (min-width: 641px) { .spiral-ring:nth-child(n+17) { display: none; } }

@media (max-width: 900px) and (min-width: 641px) {
  .notebook-header { padding-left: 42px; padding-right: 30px; }
  .page-footer { padding-left: 42px; padding-right: 30px; }
  .canvas-composition { width: min(100%, 338px); }
}

@media (max-width: 640px) {
  .desk { padding: 29px 12px 37px; }
  .notebook { min-height: calc(100svh - 66px); border-radius: 6px; }
  .notebook-header { flex-direction: column; align-items: center; gap: 9px; padding: 40px 16px 0; }
  .wordmark-text { font-size: 45px; }
  .wordmark-doodle { width: 26px; height: 30px; }
  .toolbar { gap: 6px; }
  .workspace { min-height: 360px; padding: 31px 16px 34px; }
  .canvas-composition { width: min(100%, 360px); }
  .canvas-note { font-size: 24px; margin-top: 18px; margin-right: 2px; }
  .canvas-caption { font-size: 9px; }
  .page-footer { padding: 0 19px 39px; gap: 10px; font-size: 8px; letter-spacing: .08em; }
  .page-footer .footer-note { font-size: 16px; }
  .spiral { left: 20px; right: 20px; top: -14px; bottom: auto; height: 28px; flex-direction: row; align-items: center; }
  .spiral-ring { width: 60px; height: 28px; margin-inline: -16px; overflow: visible; transform: rotate(90deg); animation-name: ring-drop-mobile; }
  .spiral-ring:nth-child(n+11) { display: none; }
  .index-tabs { top: auto; right: 0; left: 0; bottom: -20px; z-index: 40; flex-direction: row; align-items: flex-start; justify-content: center; gap: 8px; }
  .index-tab, .index-tab:nth-child(3) { width: 91px; min-height: 56px; padding: 9px 5px 16px; font-size: 21px; writing-mode: horizontal-tb; border: 1px solid rgba(31,34,48,.22); border-top: 0; border-radius: 0; transform-origin: top center; clip-path: polygon(0 0,100% 0,100% 100%,50% 91%,0 100%); animation-name: tab-reveal-mobile; }
  .index-tab::after { top: auto; left: 25%; right: 25%; bottom: 13px; height: 1.5px; width: auto; transform: scaleX(0); transform-origin: left; }
  .index-tab:hover { transform: translateY(4px) rotate(1deg); }
  .index-tab:hover span { transform: translateY(1px); }
  .index-tab[data-active="true"] { transform: translateY(5px); }
  .index-tab[data-active="true"]::after { transform: scaleX(1); }
  .panel-layer { position: fixed; inset: 0; z-index: 30; }
  .panel-backdrop { background: var(--ink); opacity: 0; transition: opacity 260ms ease; }
  .panel-layer[data-open="true"] .panel-backdrop { opacity: .12; }
  .paper-panel { position: absolute; top: auto; right: 12px; left: 12px; bottom: 52px; width: auto; max-height: calc(100svh - 100px); overflow-y: auto; min-height: 320px; padding: 33px 28px 29px; border-radius: 7px 7px 2px 2px; transform: translateY(35px) rotate(.4deg); }
  .panel-layer[data-open="true"] .paper-panel { transform: translateY(0); }
  .paper-panel::before { left: 9px; }
  .panel-handle { display: block; position: absolute; top: 12px; left: calc(50% - 16px); width: 32px; height: 3px; border-radius: 2px; background: var(--ink-line); }
  .panel-header { margin-bottom: 18px; }
  .template-grid { max-width: 300px; margin-inline: auto; }
  .template-option { max-height: 95px; }
  .pigment-row { gap: 13px; }
  .index-tab:focus-visible { outline-offset: -5px; }
}

@media (max-width: 360px) {
  .index-tab, .index-tab:nth-child(3) { width: 81px; }
  .spiral-ring:nth-child(10) { display: none; }
  .page-footer { letter-spacing: 0; }
  .workspace { min-height: 330px; }
}

@keyframes ring-drop-mobile { from { opacity: 0; transform: translateY(-7px) rotate(90deg); } 75% { opacity: 1; transform: translateY(1px) rotate(90deg); } to { opacity: 1; transform: rotate(90deg); } }
@keyframes tab-reveal-mobile { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }

/* Hareket tercihi tüm ilk açılış ve fare tepkileri için aynı yerde ele alınır. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  .wordmark-text { clip-path: none; }
  .page-grid path, .page-grid line, .canvas-frame, .canvas-grid-line { stroke-dashoffset: 0; }
  .spiral-highlight, .wordmark-doodle, .canvas-note, .download-stamp:nth-child(2), .index-tab:hover, .index-tab[data-active="true"], .index-tab:hover span { transform: none; }
  .panel-layer[data-open="true"] .paper-panel { transform: translateY(-50%); }
}
@media (prefers-reduced-motion: reduce) and (max-width: 640px) { .panel-layer[data-open="true"] .paper-panel { transform: none; } }

```

## components/Notebook.tsx

```
"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { Spiral } from "./Spiral";
import { WordMark } from "./WordMark";
import { ToolBar } from "./ToolBar";
import { Canvas } from "./Canvas";
import { Tabs, type PanelId } from "./Tabs";
import { Panel } from "./Panel";

export default function Notebook() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const closePanel = useCallback(() => setActivePanel(null), []);

  function moveHighlight(event: PointerEvent<HTMLElement>) {
    // Görsel ayrıntı React durumunu değiştirmez; hareket tercihi her zaman önceliklidir.
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const offset = (event.clientX / window.innerWidth - 0.5) * 3;
    pageRef.current?.style.setProperty("--pointer-x", `${offset}px`);
  }

  return (
    <main className="desk">
      <section className="notebook" ref={pageRef} aria-label="Polygo çizim defteri" onPointerMove={moveHighlight}>
        <svg className="page-grid" aria-hidden="true" width="100%" height="100%">
          <defs><pattern id="paper-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" pathLength="1" fill="none" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#paper-grid)" />
        </svg>
        <Spiral />
        <header className="notebook-header"><WordMark /><ToolBar /></header>
        <div className="workspace"><div className="canvas-composition"><Canvas /></div></div>
        <footer className="page-footer"><span>küçük şekiller, kendine ait bir iz.</span><span>01 / çizim defteri</span></footer>
        <Tabs activePanel={activePanel} onChange={setActivePanel} />
        <Panel activePanel={activePanel} onClose={closePanel} />
      </section>
    </main>
  );
}

```

## components/Spiral.tsx

```
import type { CSSProperties } from "react";

export function Spiral() {
  // Aynı ince telin tekrarı, ağır bir görsel dosyası olmadan cilt hissi verir.
  return (
    <div className="spiral" aria-hidden="true">
      {Array.from({ length: 26 }, (_, index) => (
        <svg className="spiral-ring" viewBox="0 0 60 28" key={index}
          style={{ "--ring-index": index } as CSSProperties}>
          <defs>
            <linearGradient id={`wire-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#1F2230" stopOpacity=".65" />
              <stop offset=".3" stopColor="#E7DFCF" />
              <stop offset=".55" stopColor="#F7F2E8" />
              <stop offset="1" stopColor="#1F2230" stopOpacity=".7" />
            </linearGradient>
          </defs>
          <ellipse cx="45" cy="16" rx="5" ry="5.5" fill="#1F2230" opacity=".12" />
          <ellipse cx="45" cy="16" rx="3.2" ry="3.7" fill="#1F2230" opacity=".35" />
          <path d="M44 17C51 5 34 3 23 4C6 5 4 18 17 21C25 23 35 21 37 18"
            fill="none" stroke="#1F2230" strokeOpacity=".12" strokeWidth="4.5" transform="translate(0 1)" />
          <path d="M44 16C51 4 34 2 23 3C6 4 4 17 17 20C25 22 35 20 37 17"
            fill="none" stroke={`url(#wire-${index})`} strokeWidth="3.2" strokeLinecap="round" />
          <path className="spiral-highlight" d="M14 7C20 3 35 3 41 6"
            fill="none" stroke="#F7F2E8" strokeWidth=".8" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}

```

## components/WordMark.tsx

```
export function WordMark() {
  return (
    <div className="wordmark" aria-label="Polygo">
      <span className="wordmark-text" aria-hidden="true">Polygo</span>
      <svg className="wordmark-doodle" viewBox="0 0 38 42" fill="none" aria-hidden="true">
        <path d="m19 3 15 9v18l-15 9L4 30V12Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="m19 21 15-9-15-9Z" fill="var(--accent)" />
        <path d="m4 12 15 9 15-9M19 3v36M4 30l15-9 15 9" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    </div>
  );
}

```

## components/ToolBar.tsx

```
const tools = [
  { label: "geri al", path: "M8 7 4 11l4 4M4 11h10a6 6 0 0 1 0 12" },
  { label: "yeniden yap", path: "m16 7 4 4-4 4m4-4H10a6 6 0 0 0 0 12" },
  { label: "temizle", path: "M5 8h14M9 8V5h6v3M7 8l1 15h8l1-15M10 12v7m4-7v7" },
];

export function ToolBar() {
  // aria-disabled, henüz çalışmayan araçların klavyeyle açıklanabilmesini sağlar.
  return (
    <div className="toolbar" role="group" aria-label="Çizim araçları">
      {tools.map((tool) => (
        <button key={tool.label} className="tool-button" type="button" aria-disabled="true" aria-label={`${tool.label} (yakında)`}>
          <svg viewBox="0 0 24 28" fill="none" aria-hidden="true">
            <path d={tool.path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="tool-tooltip" aria-hidden="true">{tool.label}</span>
        </button>
      ))}
    </div>
  );
}

```

## components/Canvas.tsx

```
import type { CSSProperties } from "react";

// Bu örnek yalnızca ilk ekranın kompozisyonudur; hücreler değiştirilemez.
const filledCells = [
  [2, 1], [3, 1], [4, 1], [5, 1],
  [2, 2], [3, 2], [5, 2], [6, 2],
  [2, 3], [3, 3], [5, 3], [6, 3],
  [2, 4], [3, 4], [4, 4], [5, 4],
  [2, 5], [3, 5], [2, 6], [3, 6], [2, 7], [3, 7],
];

export function Canvas() {
  return (
    <div className="canvas-area">
      <svg className="drawing-canvas" viewBox="0 0 360 360" role="img" aria-label="Dokuz çarpı dokuz kareli tuvalde geometrik P harfi. Statik arayüz önizlemesi.">
        <defs>
          <pattern id="pencil-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 0V7" stroke="var(--accent)" strokeWidth="1.5" />
          </pattern>
        </defs>
        {Array.from({ length: 8 }, (_, index) => (
          <path key={index} className="canvas-grid-line" pathLength="1" d={`M${(index + 1) * 40} 0V360M0 ${(index + 1) * 40}H360`} fill="none" />
        ))}
        {filledCells.map(([column, row], index) => (
          <rect key={`${column}-${row}`} className="canvas-cell filled-cell" x={column * 40} y={row * 40} width="40" height="40"
            style={{ "--cell-index": index } as CSSProperties} />
        ))}
        <rect className="canvas-frame" x=".75" y=".75" width="358.5" height="358.5" rx="3" fill="none" pathLength="1" />
        {Array.from({ length: 81 }, (_, index) => (
          <rect className="hover-cell" key={index} x={(index % 9) * 40 + 1} y={Math.floor(index / 9) * 40 + 1}
            width="38" height="38" fill="url(#pencil-hatch)" />
        ))}
      </svg>
      <div className="canvas-note" aria-hidden="true">
        <svg className="canvas-note-arrow" viewBox="0 0 54 43" fill="none">
          <path d="M48 36C24 41 15 27 17 8m-7 8 7-9 7 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>bir hücreye dokun</span>
      </div>
      <p className="canvas-caption">küçük kareler, sonsuz ihtimal.</p>
    </div>
  );
}

```

## components/Tabs.tsx

```
"use client";

import type { KeyboardEvent } from "react";

export type PanelId = "templates" | "colors" | "download";

export const panelTabs: { id: PanelId; label: string }[] = [
  { id: "templates", label: "Şablonlar" },
  { id: "colors", label: "Renkler" },
  { id: "download", label: "İndir" },
];

type TabsProps = {
  activePanel: PanelId | null;
  onChange: (panel: PanelId | null) => void;
};

export function Tabs({ activePanel, onChange }: TabsProps) {
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? 2
      : (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + 3) % 3;
    const next = panelTabs[nextIndex].id;
    onChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div className="index-tabs" role="tablist" aria-label="Defter araçları">
      {panelTabs.map(({ id, label }, index) => (
        <button
          key={id}
          id={`tab-${id}`}
          type="button"
          role="tab"
          className="index-tab"
          data-active={activePanel === id}
          aria-selected={activePanel === id}
          aria-controls={`panel-${id}`}
          tabIndex={activePanel === id || (!activePanel && index === 0) ? 0 : -1}
          onClick={() => onChange(activePanel === id ? null : id)}
          onKeyDown={(event) => navigate(event, index)}
        >
          <span className="tab-mark" aria-hidden="true" />
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

```

## components/Panel.tsx

```
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { panelTabs, type PanelId } from "./Tabs";

type PanelProps = { activePanel: PanelId | null; onClose: () => void };

function MiniGrid({ kind }: { kind: number }) {
  return (
    <svg className="mini-grid" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="0.65">
        {kind === 0 && Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${12 + i * 8} 12V60 M12 ${12 + i * 8}H60`} />
        ))}
        {kind === 1 && <g transform="translate(36 36) rotate(45) translate(-36 -36)">
          {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${20 + i * 8} 20V52 M20 ${20 + i * 8}H52`} />)}
        </g>}
        {kind === 2 && Array.from({ length: 12 }, (_, i) => {
          const x = 15 + (i % 4) * 14;
          const y = 19 + Math.floor(i / 4) * 16 + (i % 2) * 8;
          return <path key={i} d={`M${x} ${y - 8}l7 4v8l-7 4-7-4v-8Z`} />;
        })}
        {kind === 3 && Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${12 + i * 12} 58L36 16L${60 - i * 12} 58 M${18 + i * 6} ${48 - i * 10}H${54 - i * 6}`} />)}
        {kind === 4 && Array.from({ length: 16 }, (_, i) => <circle key={i} cx={18 + (i % 4) * 12} cy={18 + Math.floor(i / 4) * 12} r="6" />)}
        {kind === 5 && <>{[9, 17, 25].map((r) => <circle key={r} cx="36" cy="36" r={r} />)}<path d="M11 36h50M36 11v50M18 18l36 36M18 54l36-36" /></>}
      </g>
    </svg>
  );
}

function Templates() {
  const labels = ["kare", "baklava", "altıgen", "üçgen", "daire", "ışın"];
  return <>
    <p className="panel-note">şablon seç</p>
    <div className="template-grid">
      {labels.map((label, i) => <div className="template-option" data-selected={i === 0} key={label}>
        <MiniGrid kind={i} />
        <span>{label}</span>
        {i === 0 && <span className="selected-indicator" aria-label="seçili">✓</span>}
      </div>)}
    </div>
    <p className="panel-footnote">her şekil, başka bir başlangıç.</p>
  </>;
}

function Colors() {
  const pigments = ["var(--ink)", "var(--accent)", "rgba(31,34,48,.55)", "rgba(31,34,48,.18)", "#E9E0CC", "#F7F2E8"];
  return <>
    <p className="panel-note">istediğin renk</p>
    <div className="pigment-row" aria-label="Örnek renk paleti">
      {pigments.map((pigment, i) => <span key={pigment} className="pigment" data-selected={i === 0} style={{ "--pigment": pigment } as CSSProperties} />)}
    </div>
    <div className="custom-pigment" aria-label="Özel renk seçici yer tutucusu"><span aria-hidden="true">+</span></div>
    <p className="panel-footnote">biraz mürekkep, biraz sen.</p>
  </>;
}

function Download() {
  return <>
    <p className="panel-note">kâğıttan dışarı</p>
    <div className="download-options">
      <button type="button" className="download-stamp" disabled>SVG indir <span aria-hidden="true">↗</span></button>
      <button type="button" className="download-stamp" disabled>PNG indir <small>(şeffaf)</small> <span aria-hidden="true">↗</span></button>
    </div>
    <p className="panel-note">arka planı sen seç</p>
  </>;
}

export function Panel({ activePanel, onClose }: PanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const touchStart = useRef<number | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!activePanel) {
      returnFocus.current?.focus();
      returnFocus.current = null;
      return;
    }
    returnFocus.current = document.getElementById(`tab-${activePanel}`);
    // Oklarla ayraç değiştiren kişinin odağını kaçırmayız.
    if (!document.activeElement?.classList.contains("index-tab")) {
      panelRef.current?.querySelector<HTMLButtonElement>(".panel-close")?.focus();
    }

    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      // Ayraçlar da odak döngüsünde kalır; panel açıkken başka yaprağa geçilebilir.
      const controls = [
        ...document.querySelectorAll<HTMLButtonElement>('.index-tab[tabindex="0"]'),
        ...panelRef.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
      ];
      const current = controls.indexOf(document.activeElement as HTMLButtonElement);
      const next = (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      event.preventDefault();
      controls[next]?.focus();
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [activePanel, onClose]);

  return (
    <div className="panel-layer" data-open={activePanel !== null} aria-hidden={!activePanel} inert={!activePanel}>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />
      <section className="paper-panel" ref={panelRef} aria-label="Defter yaprağı"
          onTouchStart={(event) => { touchStart.current = event.touches[0].clientY; }}
          onTouchEnd={(event) => {
            if (touchStart.current !== null && event.changedTouches[0].clientY - touchStart.current > 45) onClose();
            touchStart.current = null;
          }}>
        <div className="panel-handle" aria-hidden="true" />
        <div className="panel-header">
          <span className="panel-eyebrow">küçük araçlar</span>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Paneli kapat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {panelTabs.map(({ id }) => <div key={id} className="panel-content" id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden={activePanel !== id}>
          {id === "templates" ? <Templates /> : id === "colors" ? <Colors /> : <Download />}
        </div>)}
      </section>
    </div>
  );
}

```
