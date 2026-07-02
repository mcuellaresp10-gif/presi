"use client";

import { EscudoRenderer, ESCUDO_TEMPLATES } from "./EscudoRenderer";
import type { EscudoConfig } from "@/lib/game/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const DEFAULT_CONFIG: EscudoConfig = {
  templateId: 1,
  primaryColor: "#1B2A4A",
  secondaryColor: "#C9A227",
};

export function EscudoPicker({
  value = DEFAULT_CONFIG,
  onChange,
}: {
  value?: EscudoConfig;
  onChange: (config: EscudoConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <EscudoRenderer config={value} size={120} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ESCUDO_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange({ ...value, templateId: template.id })}
            className={`rounded-lg border p-2 text-xs transition ${
              value.templateId === template.id
                ? "border-presi-gold bg-presi-gold/10"
                : "border-white/10 hover:border-presi-gold/50"
            }`}
          >
            <EscudoRenderer
              config={{ ...value, templateId: template.id }}
              size={48}
              className="mx-auto"
            />
            <span className="mt-1 block text-center leading-tight">
              {template.name}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primary">Color primario</Label>
          <Input
            id="primary"
            type="color"
            value={value.primaryColor}
            onChange={(e) =>
              onChange({ ...value, primaryColor: e.target.value })
            }
            className="h-12 cursor-pointer"
          />
        </div>
        <div>
          <Label htmlFor="secondary">Color secundario</Label>
          <Input
            id="secondary"
            type="color"
            value={value.secondaryColor}
            onChange={(e) =>
              onChange({ ...value, secondaryColor: e.target.value })
            }
            className="h-12 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
