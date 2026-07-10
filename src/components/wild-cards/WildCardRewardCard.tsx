"use client";

import { useEffect } from "react";
import { CloseButton } from "@/components/ui/close-button";
import { Button } from "@/components/ui/button";
import {
  getWildCardIcon,
  WILD_CARD_KIND_LABEL,
} from "@/components/wild-cards/wild-card-icons";
import { getWildCardDefinition } from "@/lib/game/wild-cards";
import type { WildCardType } from "@/lib/game/wild-cards";
import { cn } from "@/lib/utils";

export function WildCardRewardCard({
  cardType,
  className,
}: {
  cardType: WildCardType;
  className?: string;
}) {
  const card = getWildCardDefinition(cardType);
  const Icon = getWildCardIcon(cardType);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/20 p-4 text-white shadow-lg",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-95",
          card.color
        )}
      />
      <div className="relative z-10 space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/25 ring-1 ring-white/25">
          <Icon className="h-7 w-7 text-white" strokeWidth={2.25} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
          Wild Card · {WILD_CARD_KIND_LABEL[card.kind]}
        </p>
        <p className="text-display text-xl leading-tight text-presi-gold">
          {card.name}
        </p>
        <p className="text-[11px] leading-snug text-white/90">
          {card.description}
        </p>
      </div>
    </div>
  );
}

export function WildCardTile({
  cardType,
  status,
  onOpen,
}: {
  cardType: WildCardType;
  status: "available" | "active" | "used";
  onOpen?: () => void;
}) {
  const card = getWildCardDefinition(cardType);
  const Icon = getWildCardIcon(cardType);
  const interactive = typeof onOpen === "function";

  const body = (
    <>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          card.color
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />

      <div className="relative z-10 flex h-full flex-col p-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/85 ring-1 ring-white/15">
            {WILD_CARD_KIND_LABEL[card.kind]}
          </span>
          {status === "active" ? (
            <span className="rounded-full bg-presi-cyan/90 px-2 py-0.5 text-[9px] font-bold uppercase text-presi-bg">
              Activa
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/30 ring-1 ring-white/25 shadow-lg">
            <Icon className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <p className="text-display text-sm leading-tight text-white drop-shadow">
            {card.name}
          </p>
          {cardType === "double_gameweek" ? (
            <p className="text-lg font-black text-presi-gold">×2</p>
          ) : null}
        </div>

        <p className="mt-auto text-center text-[9px] font-semibold uppercase tracking-wider text-white/55">
          {interactive ? "Toca para ver" : "Wild Card"}
        </p>
      </div>
    </>
  );

  const className = cn(
    "relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/15 text-left shadow-md transition",
    status === "active" && "ring-2 ring-presi-cyan/70",
    status === "used" && "opacity-50",
    interactive && "active:scale-[0.98] hover:border-white/30"
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={className}
        aria-label={`${card.name}. Toca para ver detalle`}
      >
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

export function WildCardDetailSheet({
  cardType,
  status,
  open,
  onClose,
  onActivate,
  loading,
}: {
  cardType: WildCardType;
  status: "available" | "active" | "used";
  open: boolean;
  onClose: () => void;
  onActivate?: () => void;
  loading?: boolean;
}) {
  const card = getWildCardDefinition(cardType);
  const Icon = getWildCardIcon(cardType);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-labelledby="wildcard-detail-title"
        className="relative z-10 mx-4 mb-6 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-presi-surface shadow-2xl sm:mb-0"
      >
        <div
          className={cn(
            "relative px-4 pb-5 pt-4 text-white",
            "bg-gradient-to-br",
            card.color
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <span className="rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90 ring-1 ring-white/20">
              {WILD_CARD_KIND_LABEL[card.kind]}
            </span>
            <CloseButton
              onClick={onClose}
              variant="overlay"
              className="h-9 w-9"
              iconClassName="h-4 w-4"
            />
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/30 ring-1 ring-white/30">
              <Icon className="h-8 w-8" strokeWidth={2.25} />
            </div>
            <h2
              id="wildcard-detail-title"
              className="text-display text-2xl text-presi-gold"
            >
              {card.name}
            </h2>
            {cardType === "double_gameweek" ? (
              <p className="text-2xl font-black text-white">×2</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <p className="text-sm leading-relaxed text-white/75">
            {card.description}
          </p>

          {status === "active" ? (
            <p className="rounded-lg bg-presi-cyan/15 px-3 py-2 text-center text-xs font-semibold text-presi-cyan">
              Activa esta jornada
            </p>
          ) : null}

          {status === "available" && onActivate ? (
            <Button
              type="button"
              variant="cta"
              className="w-full"
              disabled={loading}
              onClick={onActivate}
            >
              {loading ? "Activando..." : "Activar"}
            </Button>
          ) : null}

          {status === "used" ? (
            <p className="text-center text-xs text-white/40">Ya fue usada</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
