import { cn } from "@/lib/utils";

export function LiveBadge({
  live,
  label,
  className,
}: {
  live?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        live
          ? "bg-presi-cyan/20 text-presi-cyan"
          : "bg-presi-gold/20 text-presi-gold",
        className
      )}
    >
      {live ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-presi-cyan opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-presi-cyan" />
        </span>
      ) : null}
      {label ?? (live ? "En vivo" : "Jornada")}
    </span>
  );
}
