/** Alturas compartidas para nav + docks flotantes en móvil. */
export const BOTTOM_NAV_HEIGHT = "4.75rem";
/** Barra «Descubre tu próximo jugador» (~py-2.5 + icono 36px). */
export const SCOUTING_DOCK_HEIGHT = "3.25rem";
export const DOCK_STACK_GAP = "0.75rem";

export const bottomNavOffset = `calc(${BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`;

export const scoutingDockBottom = bottomNavOffset;

export const installPromptBottom = (
  withScoutingDock: boolean
): string => {
  if (!withScoutingDock) {
    return `calc(${bottomNavOffset} + ${DOCK_STACK_GAP})`;
  }
  return `calc(${bottomNavOffset} + ${SCOUTING_DOCK_HEIGHT} + ${DOCK_STACK_GAP})`;
};

export const Z_BOTTOM_NAV = 50;
export const Z_SCOUTING_DOCK = 60;
export const Z_INSTALL_PROMPT = 75;
