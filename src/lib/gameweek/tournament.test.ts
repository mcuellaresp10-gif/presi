import { describe, expect, it } from "vitest";
import {
  getActiveTournamentPhase,
  inferTournamentPhaseFromDate,
  parseFixtureTournamentPhase,
} from "@/lib/gameweek/tournament";

describe("tournament phase", () => {
  it("infers clausura from july onwards", () => {
    expect(inferTournamentPhaseFromDate("2026-07-15T00:00:00.000Z")).toBe(
      "clausura"
    );
    expect(inferTournamentPhaseFromDate("2026-01-15T00:00:00.000Z")).toBe(
      "apertura"
    );
  });

  it("parses explicit round labels", () => {
    expect(
      parseFixtureTournamentPhase("Clausura - 1", "2026-01-01T00:00:00.000Z")
    ).toBe("clausura");
    expect(
      parseFixtureTournamentPhase("Apertura - 3", "2026-08-01T00:00:00.000Z")
    ).toBe("apertura");
  });

  it("uses date when round label has no semester", () => {
    expect(
      parseFixtureTournamentPhase(
        "Regular Season - 1",
        "2026-01-16T00:00:00.000Z"
      )
    ).toBe("apertura");
    expect(
      parseFixtureTournamentPhase(
        "Regular Season - 1",
        "2026-07-26T00:00:00.000Z"
      )
    ).toBe("clausura");
  });

  it("selects clausura in july by default", () => {
    expect(getActiveTournamentPhase(new Date("2026-07-05T00:00:00.000Z"))).toBe(
      "clausura"
    );
  });
});
