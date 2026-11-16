"use client";

import { useEffect, type CSSProperties } from "react";
import { usePaintStore } from "@/lib/paintStore";

const UNDO_PATH = "M8 7 4 11l4 4M4 11h10a6 6 0 0 1 0 12";
const REDO_PATH = "m16 7 4 4-4 4m4-4H10a6 6 0 0 0 0 12";
const CLEAR_PATH = "M5 8h14M9 8V5h6v3M7 8l1 15h8l1-15M10 12v7m4-7v7";

type ToolButtonProps = {
  label: string;
  shortcut?: string;
  path: string;
  disabled: boolean;
  onClick: () => void;
};

function ToolButton({
  label,
  shortcut,
  path,
  disabled,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      className="tool-button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-keyshortcuts={shortcut}
    >
      <svg viewBox="0 0 24 28" fill="none" aria-hidden="true">
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="tool-tooltip" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

type ToolBarProps = { onOpenColors: () => void };

export function ToolBar({ onOpenColors }: ToolBarProps) {
  const color = usePaintStore((state) => state.color);
  const canUndo = usePaintStore((state) => state.past.length > 0);
  const canRedo = usePaintStore((state) => state.future.length > 0);
  const canClear = usePaintStore(
    (state) => Object.keys(state.fills).length > 0,
  );
  const { undo, redo, clear } = usePaintStore.getState();

  // Ctrl/Cmd+Z geri alır; Ctrl/Cmd+Shift+Z ve Ctrl+Y yineler.
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      // Yazı alanlarında tarayıcının kendi geri almasına karışılmaz.
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        usePaintStore.getState().undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        usePaintStore.getState().redo();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="toolbar" role="group" aria-label="Çizim araçları">
      <ToolButton
        label="geri al"
        shortcut="Control+Z"
        path={UNDO_PATH}
        disabled={!canUndo}
        onClick={undo}
      />
      <ToolButton
        label="yinele"
        shortcut="Control+Shift+Z"
        path={REDO_PATH}
        disabled={!canRedo}
        onClick={redo}
      />
      <ToolButton
        label="temizle"
        path={CLEAR_PATH}
        disabled={!canClear}
        onClick={clear}
      />
      <button
        type="button"
        className="current-color"
        onClick={onOpenColors}
        aria-label={`Seçili renk ${color}. Renkleri aç.`}
      >
        <span
          className="current-color-swatch"
          style={{ "--pigment": color } as CSSProperties}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
