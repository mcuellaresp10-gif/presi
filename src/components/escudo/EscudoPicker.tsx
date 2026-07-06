"use client";

import { EscudoStudio } from "@/components/escudo/EscudoStudio";
import { DEFAULT_ESCUDO } from "@/lib/game/escudo-presets";
import type { EscudoConfig } from "@/lib/game/types";

/** @deprecated Use EscudoStudio */
export function EscudoPicker({
  value = DEFAULT_ESCUDO,
  onChange,
}: {
  value?: EscudoConfig;
  onChange: (config: EscudoConfig) => void;
}) {
  return (
    <EscudoStudio
      value={value}
      onChange={onChange}
      showPreview
      compact
    />
  );
}

export { ESCUDO_TEMPLATES } from "@/lib/game/escudo-presets";
