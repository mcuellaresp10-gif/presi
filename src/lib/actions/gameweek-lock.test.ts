import { describe, expect, it } from "vitest";
import { computeIsLineupLocked } from "@/lib/gameweek/lineup-lock";

function gw(
  overrides: {
    firstKickoffAt: string;
    status?: string;
  }
) {
  return {
    firstKickoffAt: overrides.firstKickoffAt,
    status: overrides.status ?? "upcoming",
  };
}

describe("computeIsLineupLocked", () => {
  it("stays open before first kickoff", () => {
    const editing = gw({
      firstKickoffAt: "2026-07-20T00:00:00.000Z",
      status: "upcoming",
    });
    expect(
      computeIsLineupLocked(
        editing,
        editing,
        new Date("2026-07-05T00:00:00.000Z")
      )
    ).toBe(false);
  });

  it("locks after first kickoff", () => {
    const editing = gw({
      firstKickoffAt: "2026-07-01T00:00:00.000Z",
      status: "live",
    });
    expect(
      computeIsLineupLocked(
        editing,
        editing,
        new Date("2026-07-05T00:00:00.000Z")
      )
    ).toBe(true);
  });

  it("stays open when there is no gameweek yet", () => {
    expect(
      computeIsLineupLocked(null, null, new Date("2026-07-05T00:00:00.000Z"))
    ).toBe(false);
  });

  it("locks when current gameweek is live and there is no next one", () => {
    const current = gw({
      firstKickoffAt: "2026-07-01T00:00:00.000Z",
      status: "live",
    });
    expect(
      computeIsLineupLocked(null, current, new Date("2026-07-05T00:00:00.000Z"))
    ).toBe(true);
  });
});
