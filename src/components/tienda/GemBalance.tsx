import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

export function GemBalance({
  gemas,
  className,
}: {
  gemas: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1.5 text-sm font-bold text-violet-100 shadow-sm",
        className
      )}
    >
      <Gem className="h-4 w-4 text-violet-300" aria-hidden />
      <span>{gemas.toLocaleString("es-CO")}</span>
    </div>
  );
}
