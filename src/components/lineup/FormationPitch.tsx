import type { Position } from "@/lib/game/types";
import { getFormationSlots } from "@/lib/game";

export function FormationPitch({
  formation,
  counts,
}: {
  formation: string;
  counts: Record<Position, number>;
}) {
  const slots = getFormationSlots(formation);

  const rows: { pos: Position; count: number; label: string }[] = [
    { pos: "DEL", count: slots.DEL, label: "DEL" },
    { pos: "MED", count: slots.MED, label: "MED" },
    { pos: "DEF", count: slots.DEF, label: "DEF" },
    { pos: "GK", count: slots.GK, label: "GK" },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-presi-navy/80 to-presi-bg/90 p-4">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="mx-auto mt-8 h-16 w-32 rounded border-2 border-white" />
        <div className="absolute left-0 right-0 top-1/2 border-t border-white/50" />
      </div>

      <div className="relative space-y-3">
        {rows.map((row) => (
          <div key={row.pos} className="flex justify-center gap-2">
            {Array.from({ length: row.count }).map((_, i) => {
              const filled = counts[row.pos] > i;
              return (
                <div
                  key={`${row.pos}-${i}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                    filled
                      ? "border-presi-gold bg-presi-gold text-white"
                      : "border-white/40 bg-white/10 text-white/70"
                  }`}
                >
                  {row.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
