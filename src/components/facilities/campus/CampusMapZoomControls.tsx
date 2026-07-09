import { cn } from "@/lib/utils";

export function CampusMapZoomControls({
  scale,
  minScale,
  maxScale,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  scale: number;
  minScale: number;
  maxScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const zoomPercent = Math.round(scale * 100);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex items-end justify-between px-2">
      <p className="pointer-events-none rounded-md bg-black/55 px-2 py-1 text-[9px] text-white/70 backdrop-blur-sm">
        Pellizca o ± para zoom · doble toque reinicia
      </p>

      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-white/15 bg-black/60 p-0.5 backdrop-blur-md">
        <button
          type="button"
          onClick={onZoomOut}
          disabled={scale <= minScale}
          aria-label="Alejar mapa"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white transition-colors",
            scale <= minScale ? "opacity-40" : "hover:bg-white/10"
          )}
        >
          −
        </button>
        <span
          className="min-w-[2.5rem] text-center text-[9px] font-mono text-white/80"
          aria-live="polite"
        >
          {zoomPercent}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          disabled={scale >= maxScale}
          aria-label="Acercar mapa"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white transition-colors",
            scale >= maxScale ? "opacity-40" : "hover:bg-white/10"
          )}
        >
          +
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={scale <= minScale}
          aria-label="Restablecer zoom del mapa"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-[10px] text-white transition-colors",
            scale <= minScale ? "opacity-40" : "hover:bg-white/10"
          )}
          title="Restablecer"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
