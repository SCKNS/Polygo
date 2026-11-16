"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { Spiral } from "./Spiral";
import { Island } from "./Island";
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
      <Island onOpenColors={openColors} />
      <section className="notebook" ref={pageRef} aria-label="Polygo çizim defteri" onPointerMove={moveHighlight}>
        {/* Sayfanın içi yalnız ızgara: tuval sayfayı kenardan kenara doldurur. */}
        <div className="page-canvas"><Canvas template={DEFAULT_TEMPLATE} /></div>
        <Spiral />
        <Tabs activePanel={activePanel} onChange={setActivePanel} />
        <Panel activePanel={activePanel} onClose={closePanel} />
      </section>
    </main>
  );
}
