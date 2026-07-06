import { describe, expect, it } from "vitest";
import {
  buildGameweekGroupsFromFixtures,
  getActiveTournamentPhase,
  inferTournamentPhaseFromDate,
  parseFixtureTournamentPhase,
} from "@/lib/gameweek/tournament";
import type { ApiFixture } from "@/lib/api-football/client";

function makeFixture(
  round: string,
  date: string,
  id = 1
): ApiFixture {
  return {
    fixture: { id, date, status: { short: "NS" } },
    league: { round, season: 2026 },
    goals: { home: null, away: null },
    teams: { home: { name: "Local" }, away: { name: "Visitante" } },
  };
}

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

  it("renumbers clausura rounds from kickoff order, not API cumulative round", () => {
    const fixtures: ApiFixture[] = [
      makeFixture("Regular Season - 20", "2026-07-25T23:10:00.000Z", 1),
      makeFixture("Regular Season - 20", "2026-07-26T01:15:00.000Z", 2),
      makeFixture("Regular Season - 21", "2026-08-02T23:10:00.000Z", 3),
    ];

    const groups = buildGameweekGroupsFromFixtures(fixtures);
    const clausura = groups.filter((g) => g.phase === "clausura");

    expect(clausura).toHaveLength(2);
    expect(clausura[0]?.round).toBe(1);
    expect(clausura[0]?.fixtures).toHaveLength(2);
    expect(clausura[1]?.round).toBe(2);
  });
});
