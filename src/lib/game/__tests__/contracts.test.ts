import { describe, expect, it } from "vitest";
import {
  applyGameweekToTitulars,
  canRenewContract,
  getInitialContract,
  getReleaseRefund,
  getRenewalCost,
  isContractExpired,
  isContractExpiringSoon,
} from "../contracts";

describe("contracts", () => {
  it("initial contract is always 3 jornadas", () => {
    expect(getInitialContract("bronce").jornadas).toBe(3);
    expect(getInitialContract("leyenda").jornadas).toBe(3);
    expect(getInitialContract("oro", true).jornadas).toBe(3);
  });

  it("expiry triggers only when jornadas reach zero", () => {
    expect(isContractExpired(0)).toBe(true);
    expect(isContractExpired(-1)).toBe(true);
    expect(isContractExpired(1)).toBe(false);
    expect(isContractExpired(5)).toBe(false);
  });

  it("renewal cost respects office discount and max renewals", () => {
    expect(getRenewalCost(10_000_000, 1, 0)).toBe(4_000_000);
    expect(getRenewalCost(10_000_000, 5, 0)).toBe(3_680_000);
    expect(canRenewContract(3)).toBe(false);
    expect(getRenewalCost(10_000_000, 5, 3)).toBe(Infinity);
  });

  it("release refund requires office level 3+", () => {
    expect(getReleaseRefund(10_000_000, 2)).toBe(0);
    expect(getReleaseRefund(10_000_000, 3)).toBe(2_500_000);
  });

  it("gameweek decrements only titulars", () => {
    const roster = [
      { player_id: "a", jornadas_restantes: 3 },
      { player_id: "b", jornadas_restantes: 3 },
    ];
    const updated = applyGameweekToTitulars(roster, ["a"]);
    expect(updated[0].jornadas_restantes).toBe(2);
    expect(updated[1].jornadas_restantes).toBe(3);
  });

  it("expiring soon detects low jornadas only", () => {
    expect(isContractExpiringSoon(1)).toBe(true);
    expect(isContractExpiringSoon(0)).toBe(true);
    expect(isContractExpiringSoon(2)).toBe(false);
  });
});
