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
