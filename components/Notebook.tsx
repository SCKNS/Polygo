"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { Spiral } from "./Spiral";
import { WordMark } from "./WordMark";
import { ToolBar } from "./ToolBar";
import { Canvas } from "./Canvas";
import { Tabs, type PanelId } from "./Tabs";
import { Panel } from "./Panel";
import { DEFAULT_TEMPLATE } from "@/lib/templates";

export default function Notebook() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const closePanel = useCallback(() => setActivePanel(null), []);
  const openColors = useCallback(() => setActivePanel("colors"), []);

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
        <header className="notebook-header"><WordMark /><ToolBar onOpenColors={openColors} /></header>
        <div className="workspace"><div className="canvas-composition"><Canvas template={DEFAULT_TEMPLATE} /></div></div>
        <footer className="page-footer"><span>küçük şekiller, kendine ait bir iz.</span><span>01 / çizim defteri</span></footer>
        <Tabs activePanel={activePanel} onChange={setActivePanel} />
        <Panel activePanel={activePanel} onClose={closePanel} />
      </section>
    </main>
  );
}
