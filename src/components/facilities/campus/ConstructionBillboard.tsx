import { formatRemainingTime } from "@/lib/game/facilities";
import { cn } from "@/lib/utils";

export function ConstructionBillboard({
  progress,
  remainingMs,
  isCompletePending = false,
  inline = false,
}: {
  progress: number;
  remainingMs: number;
  isCompletePending?: boolean;
  inline?: boolean;
}) {
  const percent = Math.round(progress * 100);
  const almostDone = !isCompletePending && progress >= 0.9;

  return (
    <div
      className={cn(
        "z-30 min-w-[72px] rounded-lg border px-2 py-1 shadow-lg backdrop-blur-md",
        inline
          ? "relative mb-1"
          : "absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full",
        isCompletePending
          ? "border-presi-gold/50 bg-presi-gold/20"
          : almostDone
            ? "border-presi-cyan/40 bg-presi-cyan/15"
            : "border-orange-500/40 bg-orange-950/80"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-1">
        <span className="text-[10px]" aria-hidden>
          {isCompletePending ? "✓" : "🔨"}
        </span>
        <span
          className={cn(
            "font-mono text-[10px] font-bold",
            isCompletePending
              ? "text-presi-gold"
              : almostDone
                ? "text-presi-cyan"
                : "text-orange-100"
          )}
          suppressHydrationWarning
        >
          {isCompletePending ? "¡Listo!" : formatRemainingTime(remainingMs)}
        </span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/15">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isCompletePending
              ? "w-full bg-presi-gold"
              : "bg-gradient-to-r from-presi-gold to-presi-cyan"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!inline ? (
        <div
          className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-b border-r border-inherit bg-inherit"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
