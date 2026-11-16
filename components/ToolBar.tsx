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
