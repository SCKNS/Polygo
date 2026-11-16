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
