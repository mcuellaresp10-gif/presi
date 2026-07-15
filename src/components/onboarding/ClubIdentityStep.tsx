"use client";

import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { DEFAULT_ESCUDO } from "@/lib/game/escudo-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CITY_SUGGESTIONS,
  CLUB_STYLE_OPTIONS,
  type ClubStyle,
} from "@/lib/game/escudo-presets";
import { cn } from "@/lib/utils";

export type ClubIdentity = {
  nombre: string;
  apodo: string;
  ciudad: string;
  estilo: ClubStyle | "";
};

export function ClubIdentityStep({
  value,
  onChange,
  onContinue,
  continueLabel = "Continuar",
  showContinue = true,
}: {
  value: ClubIdentity;
  onChange: (value: ClubIdentity) => void;
  onContinue?: () => void;
  continueLabel?: string;
  showContinue?: boolean;
}) {
  const nombreValid = value.nombre.trim().length >= 3;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-presi-surface/80 p-6">
        <EscudoRenderer config={DEFAULT_ESCUDO} size={72} className="opacity-40" />
        <p className="text-center text-sm text-white/50">
          {nombreValid
            ? "Así lucirá tu club en la liga"
            : "Elige nombre y personaliza tu escudo en el siguiente paso"}
        </p>
        {nombreValid ? (
          <p className="text-display text-xl text-presi-gold">{value.nombre}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="club-nombre">Nombre del club</Label>
        <Input
          id="club-nombre"
          value={value.nombre}
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
          placeholder="Ej. Los Halcones FC"
          minLength={3}
          maxLength={30}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="club-apodo">Apodo o siglas (opcional)</Label>
        <Input
          id="club-apodo"
          value={value.apodo}
          onChange={(e) =>
            onChange({ ...value, apodo: e.target.value.toUpperCase() })
          }
          placeholder="Ej. MFC"
          maxLength={6}
          className="mt-1 uppercase"
        />
      </div>

      <div>
        <Label htmlFor="club-ciudad">Ciudad ficticia (opcional)</Label>
        <Input
          id="club-ciudad"
          value={value.ciudad}
          onChange={(e) => onChange({ ...value, ciudad: e.target.value })}
          placeholder="Ej. Villa Andina"
          maxLength={40}
          className="mt-1"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {CITY_SUGGESTIONS.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onChange({ ...value, ciudad: city })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[10px] font-semibold transition",
                value.ciudad === city
                  ? "border-presi-gold bg-presi-gold/15 text-presi-gold"
                  : "border-white/15 text-white/60 hover:border-white/30"
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Estilo del club (opcional)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLUB_STYLE_OPTIONS.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  estilo: value.estilo === style ? "" : style,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-[10px] font-semibold transition",
                value.estilo === style
                  ? "border-presi-gold bg-presi-gold/15 text-presi-gold"
                  : "border-white/15 text-white/60 hover:border-white/30"
              )}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {showContinue && onContinue ? (
        <Button
          type="button"
          variant="cta"
          className="w-full"
          disabled={!nombreValid}
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      ) : null}
    </div>
  );
}
