"use client";

import { useState } from "react";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  applyPalette,
  buildRandomEscudo,
  DEFAULT_ESCUDO,
  ESCUDO_COLOR_PALETTES,
  ESCUDO_ICONS,
  ESCUDO_PATTERNS,
  ESCUDO_SHAPES,
} from "@/lib/game/escudo-presets";
import type { EscudoConfig } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { Dices, RotateCcw } from "lucide-react";

type StudioSection = "shape" | "icon" | "colors";

export function EscudoStudio({
  value,
  onChange,
  clubName,
  clubApodo,
  showPreview = true,
  compact = false,
}: {
  value: EscudoConfig;
  onChange: (config: EscudoConfig) => void;
  clubName?: string;
  clubApodo?: string;
  showPreview?: boolean;
  compact?: boolean;
}) {
  const [section, setSection] = useState<StudioSection>("shape");
  const [customColors, setCustomColors] = useState(false);

  const sections: { id: StudioSection; label: string }[] = [
    { id: "shape", label: "Forma" },
    { id: "icon", label: "Símbolo" },
    { id: "colors", label: "Colores" },
  ];

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {showPreview ? (
        <div className="sticky top-0 z-10 -mx-1 rounded-xl border border-white/10 bg-presi-elevated/95 px-4 py-4 backdrop-blur">
          <div className="flex flex-col items-center gap-2">
            <EscudoRenderer config={value} size={compact ? 96 : 120} />
            {clubName ? (
              <p className="text-display text-lg text-presi-gold">{clubName}</p>
            ) : null}
            {clubApodo ? (
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                {clubApodo}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex gap-1 rounded-lg bg-white/5 p-1">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn(
              "min-h-[40px] flex-1 rounded-md text-xs font-semibold transition",
              section === item.id
                ? "bg-presi-gold text-presi-bg"
                : "text-white/60 hover:bg-white/10"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "shape" && (
        <div className="grid grid-cols-3 gap-2">
          {ESCUDO_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              aria-label={`Forma ${shape.name}`}
              aria-pressed={value.shapeId === shape.id}
              onClick={() => onChange({ ...value, shapeId: shape.id })}
              className={cn(
                "flex min-h-[72px] flex-col items-center justify-center rounded-xl border p-2 transition",
                value.shapeId === shape.id
                  ? "border-presi-gold bg-presi-gold/10"
                  : "border-white/10 hover:border-presi-gold/40"
              )}
            >
              <EscudoRenderer
                config={{ ...value, shapeId: shape.id }}
                size={44}
              />
              <span className="mt-1 text-[10px] text-white/70">{shape.name}</span>
            </button>
          ))}
        </div>
      )}

      {section === "icon" && (
        <div className="grid grid-cols-4 gap-2">
          {ESCUDO_ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              aria-label={`Símbolo ${icon.name}`}
              aria-pressed={value.iconId === icon.id}
              onClick={() => onChange({ ...value, iconId: icon.id })}
              className={cn(
                "flex min-h-[72px] flex-col items-center justify-center rounded-xl border p-1.5 transition",
                value.iconId === icon.id
                  ? "border-presi-gold bg-presi-gold/10"
                  : "border-white/10 hover:border-presi-gold/40"
              )}
            >
              <EscudoRenderer
                config={{ ...value, iconId: icon.id }}
                size={40}
              />
              <span className="mt-0.5 text-[9px] leading-tight text-white/60">
                {icon.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {section === "colors" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {ESCUDO_COLOR_PALETTES.map((palette) => (
              <button
                key={palette.id}
                type="button"
                aria-label={`Paleta ${palette.name}`}
                onClick={() => {
                  setCustomColors(false);
                  onChange(applyPalette(value, palette));
                }}
                className="flex min-h-[52px] items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-left hover:border-presi-gold/40"
              >
                <div className="flex -space-x-1">
                  <span
                    className="h-6 w-6 rounded-full border border-white/20"
                    style={{ backgroundColor: palette.primaryColor }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-white/20"
                    style={{ backgroundColor: palette.secondaryColor }}
                  />
                </div>
                <span className="text-[10px] font-medium leading-tight text-white/80">
                  {palette.name}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCustomColors((v) => !v)}
            className="text-xs font-semibold text-presi-gold hover:underline"
          >
            {customColors ? "Ocultar colores personalizados" : "Mis colores"}
          </button>

          {customColors ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="esc-primary" className="text-[10px]">
                  Fondo
                </Label>
                <Input
                  id="esc-primary"
                  type="color"
                  value={value.primaryColor}
                  onChange={(e) =>
                    onChange({ ...value, primaryColor: e.target.value })
                  }
                  className="mt-1 h-11 cursor-pointer"
                />
              </div>
              <div>
                <Label htmlFor="esc-secondary" className="text-[10px]">
                  Borde / icono
                </Label>
                <Input
                  id="esc-secondary"
                  type="color"
                  value={value.secondaryColor}
                  onChange={(e) =>
                    onChange({ ...value, secondaryColor: e.target.value })
                  }
                  className="mt-1 h-11 cursor-pointer"
                />
              </div>
              <div>
                <Label htmlFor="esc-accent" className="text-[10px]">
                  Acento
                </Label>
                <Input
                  id="esc-accent"
                  type="color"
                  value={value.accentColor ?? DEFAULT_ESCUDO.accentColor}
                  onChange={(e) =>
                    onChange({ ...value, accentColor: e.target.value })
                  }
                  className="mt-1 h-11 cursor-pointer"
                />
              </div>
            </div>
          ) : null}

          <div>
            <Label className="text-[10px] text-white/50">Patrón</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ESCUDO_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...value, pattern: p.id })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[10px] font-semibold",
                    value.pattern === p.id
                      ? "border-presi-gold bg-presi-gold/15 text-presi-gold"
                      : "border-white/15 text-white/60"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onChange(buildRandomEscudo())}
        >
          <Dices className="mr-1.5 h-4 w-4" />
          Sorpréndeme
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onChange({ ...DEFAULT_ESCUDO })}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
