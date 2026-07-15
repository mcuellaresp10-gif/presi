import { cn } from "@/lib/utils";

const STEPS_ONBOARDING = [
  { id: 1, label: "Club" },
  { id: 2, label: "Escudo" },
  { id: 3, label: "Sobres" },
] as const;

const STEPS_CLUB_WIZARD = [
  { id: 1, label: "Club" },
  { id: 2, label: "Escudo" },
  { id: 3, label: "Confirmar" },
] as const;

export function OnboardingStepper({
  current,
  className,
  variant = "onboarding",
}: {
  current: 1 | 2 | 3;
  className?: string;
  variant?: "onboarding" | "club-wizard";
}) {
  const STEPS = variant === "club-wizard" ? STEPS_CLUB_WIZARD : STEPS_ONBOARDING;
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {STEPS.map((step, i) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                  done && "bg-presi-gold text-presi-bg",
                  active && "bg-presi-gold text-presi-bg ring-2 ring-presi-gold/50",
                  !done && !active && "bg-white/10 text-white/40"
                )}
              >
                {done ? "✓" : step.id}
              </div>
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wide",
                  active ? "text-presi-gold" : "text-white/40"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mb-4 h-px w-8",
                  step.id < current ? "bg-presi-gold" : "bg-white/15"
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
