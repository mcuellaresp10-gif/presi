import { describe, expect, it } from "vitest";
import {
  deriveGameweekStatus,
  deriveGameweekStatusFromFixtures,
  GAMEWEEK_LIVE_BUFFER_MS,
  GAMEWEEK_SCORE_CATCHUP_MS,
  isGameweekScoreable,
} from "@/lib/gameweek/status";

describe("deriveGameweekStatus", () => {
  const first = "2026-07-10T00:00:00.000Z";
  const last = "2026-07-12T00:00:00.000Z";

  it("returns upcoming before first kickoff", () => {
    expect(
      deriveGameweekStatus(first, last, new Date("2026-07-01T00:00:00.000Z"))
    ).toBe("upcoming");
  });

  it("returns live during the gameweek window", () => {
    expect(
      deriveGameweekStatus(first, last, new Date("2026-07-11T00:00:00.000Z"))
    ).toBe("live");
  });

  it("returns finished after live buffer", () => {
    const afterBuffer = new Date(
      new Date(last).getTime() + GAMEWEEK_LIVE_BUFFER_MS + 1
    );
    expect(deriveGameweekStatus(first, last, afterBuffer)).toBe("finished");
  });
});

describe("isGameweekScoreable", () => {
  const first = "2026-07-10T00:00:00.000Z";
  const last = "2026-07-12T00:00:00.000Z";

  it("is scoreable while live", () => {
    expect(
      isGameweekScoreable(
        "live",
        last,
        first,
        new Date("2026-07-12T01:00:00.000Z")
      )
    ).toBe(true);
  });

  it("is scoreable shortly after finished", () => {
    const shortlyAfter = new Date(
      new Date(last).getTime() + GAMEWEEK_LIVE_BUFFER_MS + 60_000
    );
    expect(isGameweekScoreable("finished", last, first, shortlyAfter)).toBe(
      true
    );
  });

  it("is not scoreable after catch-up window", () => {
    const tooLate = new Date(
      new Date(last).getTime() + GAMEWEEK_SCORE_CATCHUP_MS + 1
    );
    expect(isGameweekScoreable("finished", last, first, tooLate)).toBe(false);
  });

  it("is not scoreable for upcoming", () => {
    expect(
      isGameweekScoreable(
        "upcoming",
        last,
        first,
        new Date("2026-07-01T00:00:00.000Z")
      )
    ).toBe(false);
  });
});

describe("deriveGameweekStatusFromFixtures", () => {
  it("returns upcoming when all fixtures are scheduled in the future", () => {
    expect(
      deriveGameweekStatusFromFixtures(
        [
          {
            kickoffAt: "2026-07-20T00:00:00.000Z",
            status: "NS",
          },
        ],
        new Date("2026-07-05T00:00:00.000Z")
      )
    ).toBe("upcoming");
  });

  it("returns finished when all fixtures ended", () => {
    expect(
      deriveGameweekStatusFromFixtures(
        [
          {
            kickoffAt: "2026-01-16T00:00:00.000Z",
            status: "FT",
          },
        ],
        new Date("2026-07-05T00:00:00.000Z")
      )
    ).toBe("finished");
  });
});
