"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { panelTabs, type PanelId } from "./Tabs";
import { PRESET_COLORS, usePaintStore } from "@/lib/paintStore";
import { TemplatePicker } from "./TemplatePicker";

type PanelProps = { activePanel: PanelId | null; onClose: () => void };

const COLOR_NAMES: Record<string, string> = {
  "#1f2230": "mürekkep", "#d9482b": "kiremit", "#f2b134": "hardal", "#2e7d6b": "yosun",
  "#3a5ba0": "çivit", "#8c5e9e": "erik", "#9a9384": "taş", "#ffffff": "beyaz",
};

function PigmentButton({ color, selected, onSelect }: { color: string; selected: boolean; onSelect: (color: string) => void }) {
  return (
    <button type="button" className="pigment" style={{ "--pigment": color } as CSSProperties}
      aria-label={COLOR_NAMES[color] ?? color} aria-pressed={selected} onClick={() => onSelect(color)} />
  );
}

function Colors() {
  const color = usePaintStore((state) => state.color);
  const recentColors = usePaintStore((state) => state.recentColors);
  const setColor = usePaintStore((state) => state.setColor);
  return <>
    <p className="panel-note">istediğin renk</p>
    <div className="pigment-row" role="group" aria-label="Hazır renkler">
      {PRESET_COLORS.map((preset) => <PigmentButton key={preset} color={preset} selected={preset === color} onSelect={setColor} />)}
    </div>
    <p className="pigment-label">son kullanılanlar</p>
    {recentColors.length > 0
      ? <div className="pigment-row" role="group" aria-label="Son kullanılan renkler">
          {recentColors.map((recent) => <PigmentButton key={recent} color={recent} selected={recent === color} onSelect={setColor} />)}
        </div>
      : <p className="pigment-empty">boyadıkça burada birikir.</p>}
    <label className="custom-pigment-row">
      {/* Tarayıcının kendi renk seçicisi: klavye ve ekran okuyucu desteği hazır gelir. */}
      <input type="color" className="custom-pigment" value={color} onChange={(event) => setColor(event.target.value)} />
      <span>özel renk <code>{color}</code></span>
    </label>
    <p className="panel-footnote">aynı renkle boyalı hücreye dokunmak onu siler.</p>
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
    // Kapanınca odak paneli açan öğeye döner (ayraç ya da araç çubuğundaki renk düğmesi).
    const opener = document.activeElement;
    returnFocus.current = opener instanceof HTMLElement && opener !== document.body && !panelRef.current?.contains(opener)
      ? opener : document.getElementById(`tab-${activePanel}`);
    // Oklarla ayraç değiştiren kişinin odağını kaçırmayız.
    if (!document.activeElement?.classList.contains("index-tab")) {
      panelRef.current?.querySelector<HTMLButtonElement>(".panel-close")?.focus();
    }

    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      // Ayraçlar da odak döngüsünde kalır; panel açıkken başka yaprağa geçilebilir.
      const controls = [
        ...document.querySelectorAll<HTMLElement>('.index-tab[tabindex="0"]'),
        // Gizli yapraklardaki denetimler döngüye girmez.
        ...panelRef.current!.querySelectorAll<HTMLElement>(
          ".panel-header button, .panel-content:not([hidden]) button:not(:disabled), .panel-content:not([hidden]) input:not(:disabled)"),
      ];
      const current = controls.indexOf(document.activeElement as HTMLElement);
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
          onTouchStart={(event) => {
            // Aşağı çekip kapatma yalnız içerik en üstteyken: kaydırılmış paneli yukarı kaydırmak onu kapatmasın.
            touchStart.current = event.currentTarget.scrollTop <= 0 ? event.touches[0].clientY : null;
          }}
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
          {id === "templates" ? <TemplatePicker /> : id === "colors" ? <Colors /> : <Download />}
        </div>)}
      </section>
    </div>
  );
}
