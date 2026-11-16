import { WordMark } from "./WordMark";
import { ToolBar } from "./ToolBar";
import { ZoomControls } from "./ZoomControls";

type IslandProps = { onOpenColors: () => void };

// Defterin üstünde, masada duran hap biçimli çubuk: logo, çizim araçları ve yakınlaştırma.
// Defterin sayfası yalnız ızgaraya kalsın diye bunlar sayfanın dışında durur.
export function Island({ onOpenColors }: IslandProps) {
  return (
    <header className="island">
      <WordMark />
      <span className="island-divider" aria-hidden="true" />
      <ToolBar onOpenColors={onOpenColors} />
      <span className="island-divider" aria-hidden="true" />
      <ZoomControls />
    </header>
  );
}
