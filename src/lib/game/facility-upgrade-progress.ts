import type { Facility } from "./types";
import { getUpgradeDurationMs } from "./facilities";

export type FacilityUpgradeProgressState = {
  isUpgrading: boolean;
  progress: number;
  remainingMs: number;
  isCompletePending: boolean;
  targetLevel: number;
  totalDurationMs: number;
};

export function getFacilityUpgradeProgress(
  facility: Pick<Facility, "nivel" | "mejora_inicia_en" | "mejora_termina_en">,
  now: number
): FacilityUpgradeProgressState | null {
  if (!facility.mejora_termina_en) return null;

  const endMs = new Date(facility.mejora_termina_en).getTime();
  const targetLevel = facility.nivel + 1;

  if (endMs <= now) {
    return {
      isUpgrading: true,
      progress: 1,
      remainingMs: 0,
      isCompletePending: true,
      targetLevel,
      totalDurationMs: resolveTotalDurationMs(facility, endMs),
    };
  }

  const totalDurationMs = resolveTotalDurationMs(facility, endMs);
  const startMs = facility.mejora_inicia_en
    ? new Date(facility.mejora_inicia_en).getTime()
    : endMs - totalDurationMs;
  const elapsed = Math.max(0, now - startMs);
  const progress = Math.min(1, Math.max(0, elapsed / totalDurationMs));

  return {
    isUpgrading: true,
    progress,
    remainingMs: endMs - now,
    isCompletePending: false,
    targetLevel,
    totalDurationMs,
  };
}

function resolveTotalDurationMs(
  facility: Pick<Facility, "nivel" | "mejora_inicia_en" | "mejora_termina_en">,
  endMs: number
): number {
  if (facility.mejora_inicia_en) {
    const startMs = new Date(facility.mejora_inicia_en).getTime();
    const fromTimestamps = endMs - startMs;
    if (fromTimestamps > 0) return fromTimestamps;
  }
  return getUpgradeDurationMs(facility.nivel);
}

export function formatUpgradeEndTime(
  mejoraTerminaEn: string,
  locale = "es-CO"
): string {
  return new Date(mejoraTerminaEn).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getUpgradeStatusCopy(
  progress: FacilityUpgradeProgressState
): { title: string; subtitle: string } {
  if (progress.isCompletePending) {
    return {
      title: "¡Obra terminada!",
      subtitle: "Finalizando nivel...",
    };
  }
  if (progress.progress < 0.05) {
    return {
      title: "Iniciando obra...",
      subtitle: `Obra al ${Math.round(progress.progress * 100)}%`,
    };
  }
  if (progress.progress >= 0.9) {
    return {
      title: "Casi listo...",
      subtitle: `Obra al ${Math.round(progress.progress * 100)}%`,
    };
  }
  return {
    title: "Obra en curso",
    subtitle: `Obra al ${Math.round(progress.progress * 100)}%`,
  };
}
