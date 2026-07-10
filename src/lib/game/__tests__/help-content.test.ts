import { describe, expect, it } from "vitest";
import {
  HELP_SECTIONS,
  HOWTO_TOUR_STEPS,
  getHelpSection,
  isHelpSectionId,
} from "../help-content";

describe("help-content", () => {
  it("has nine player-facing sections with summaries", () => {
    expect(HELP_SECTIONS).toHaveLength(9);
    for (const section of HELP_SECTIONS) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.summary.length).toBeGreaterThan(10);
      expect(section.body.length).toBeGreaterThan(0);
      expect(isHelpSectionId(section.id)).toBe(true);
    }
  });

  it("tour steps resolve to known sections", () => {
    expect(HOWTO_TOUR_STEPS.length).toBeGreaterThanOrEqual(4);
    for (const id of HOWTO_TOUR_STEPS) {
      expect(getHelpSection(id).id).toBe(id);
    }
  });

  it("includes a scoring table in puntuacion", () => {
    const scoring = getHelpSection("puntuacion");
    const table = scoring.body.find((b) => b.type === "table");
    expect(table?.type).toBe("table");
    if (table?.type === "table") {
      expect(table.headers).toEqual(["Acción", "GK", "DEF", "MED", "DEL"]);
      expect(table.rows.length).toBeGreaterThan(5);
    }
  });
});
