export const HOWTO_TOUR_KEY = "presi_howto_tour_seen";
export const HOWTO_TOUR_EVENT = "presi:howto-tour";

export function hasSeenHowToTour(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(HOWTO_TOUR_KEY) === "1";
}

export function markHowToTourSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HOWTO_TOUR_KEY, "1");
}

/** Clears the seen flag and asks HowToPlayTour to open. */
export function requestHowToTourReplay(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HOWTO_TOUR_KEY);
  window.dispatchEvent(new CustomEvent(HOWTO_TOUR_EVENT));
}
