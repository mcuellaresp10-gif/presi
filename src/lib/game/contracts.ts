import type { Rarity } from "./types";

export const MAX_RENEWALS = 3;
export const RENEWAL_COST_RATE = 0.4;
export const OFFICE_RENEWAL_DISCOUNT_PER_LEVEL = 0.02;
export const RELEASE_REFUND_RATE = 0.25;
export const OFFICE_RELEASE_REFUND_MIN_LEVEL = 3;

const JORNADAS_BY_RARITY: Record<Rarity, number> = {
  bronce: 5,
  plata: 4,
  oro: 3,
  leyenda: 2,
};

export interface PlayerContract {
  jornadas_restantes: number;
  renovaciones: number;
}

export interface InitialContractResult {
  jornadas: number;
  jornadasTotal: number;
}

export function getContractJornadas(rareza: Rarity, isStarter = false): number {
  const base = JORNADAS_BY_RARITY[rareza];
  return isStarter ? base * 2 : base;
}

export function getInitialContract(
  rareza: Rarity,
  isStarter = false
): InitialContractResult {
  const jornadas = getContractJornadas(rareza, isStarter);
  return {
    jornadas,
    jornadasTotal: jornadas,
  };
}

export function getInitialContractFields(rareza: Rarity, isStarter = false) {
  const contract = getInitialContract(rareza, isStarter);
  return {
    jornadas_restantes: contract.jornadas,
    renovaciones: 0,
  };
}

export function canRenewContract(renovaciones: number): boolean {
  return renovaciones < MAX_RENEWALS;
}

export function getRenewalCost(
  costoBase: number,
  oficinaNivel: number,
  renovaciones: number
): number {
  if (!canRenewContract(renovaciones)) return Infinity;
  const officeDiscount = Math.min(
    0.18,
    Math.max(0, oficinaNivel - 1) * OFFICE_RENEWAL_DISCOUNT_PER_LEVEL
  );
  const rate = RENEWAL_COST_RATE * (1 - officeDiscount);
  return Math.round(costoBase * rate);
}

export function getReleaseRefund(
  costoBase: number,
  oficinaNivel: number
): number {
  if (oficinaNivel < OFFICE_RELEASE_REFUND_MIN_LEVEL) return 0;
  return Math.round(costoBase * RELEASE_REFUND_RATE);
}

export function isContractExpired(jornadasRestantes: number): boolean {
  return jornadasRestantes <= 0;
}

export function isContractExpiringSoon(jornadasRestantes: number): boolean {
  return jornadasRestantes <= 1;
}

export function getRenewalContractFields(
  rareza: Rarity,
  renovaciones: number
) {
  const contract = getInitialContract(rareza, false);
  return {
    jornadas_restantes: contract.jornadas,
    renovaciones: renovaciones + 1,
  };
}

export function applyGameweekToTitulars(
  roster: Array<{ player_id: string; jornadas_restantes: number }>,
  titularIds: string[]
): Array<{ player_id: string; jornadas_restantes: number }> {
  const titularSet = new Set(titularIds);
  return roster.map((row) => {
    if (!titularSet.has(row.player_id)) return row;
    return {
      ...row,
      jornadas_restantes: Math.max(0, row.jornadas_restantes - 1),
    };
  });
}

export function getJornadasTotal(rareza: Rarity, isStarter = false): number {
  return getContractJornadas(rareza, isStarter);
}
