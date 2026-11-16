type ZoomControlsProps = {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export function ZoomControls({ zoom, minZoom, maxZoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const percent = Math.round(zoom * 100);
  return (
    <div className="zoom-controls" role="group" aria-label="Yakınlaştırma">
      <button type="button" className="zoom-button" onClick={onZoomOut} disabled={zoom <= minZoom} aria-label="Uzaklaştır">
        <span aria-hidden="true">−</span>
      </button>
      <button type="button" className="zoom-level" onClick={onReset} disabled={zoom === minZoom}
        aria-label={`Yakınlaştırma yüzde ${percent}. Sığdırmak için bas.`}>
        {percent}%
      </button>
      <button type="button" className="zoom-button" onClick={onZoomIn} disabled={zoom >= maxZoom} aria-label="Yakınlaştır">
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
