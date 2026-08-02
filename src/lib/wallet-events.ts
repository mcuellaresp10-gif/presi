export const WALLET_EVENT = "presi:wallet";

export type WalletUpdate = {
  presupuesto?: number;
  gemas?: number;
};

export function emitWalletUpdate(update: WalletUpdate) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WALLET_EVENT, { detail: update }));
}

export function subscribeWalletUpdate(
  handler: (update: WalletUpdate) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<WalletUpdate>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(WALLET_EVENT, listener);
  return () => window.removeEventListener(WALLET_EVENT, listener);
}
