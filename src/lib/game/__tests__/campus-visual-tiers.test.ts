import { describe, expect, it } from "vitest";
import {
  getCampusBuildingScale,
  getCampusVisualTier,
  getCampusVisualTierLabel,
  getConstructionStage,
  getTargetCampusVisualTier,
} from "../campus-visual-tiers";

describe("getCampusVisualTier", () => {
  it("maps levels to bronze, silver, gold tiers", () => {
    expect(getCampusVisualTier(1)).toBe(1);
    expect(getCampusVisualTier(3)).toBe(1);
    expect(getCampusVisualTier(4)).toBe(2);
    expect(getCampusVisualTier(6)).toBe(2);
    expect(getCampusVisualTier(7)).toBe(3);
    expect(getCampusVisualTier(10)).toBe(3);
  });
});

describe("getCampusBuildingScale", () => {
  it("scales up with tier", () => {
    expect(getCampusBuildingScale(2, 1)).toBe(1);
    expect(getCampusBuildingScale(5, 1)).toBeGreaterThan(1);
    expect(getCampusBuildingScale(9, 1)).toBeGreaterThan(getCampusBuildingScale(5, 1));
  });
});

describe("getConstructionStage", () => {
  it("returns stages by progress thresholds", () => {
    expect(getConstructionStage(0)).toBe(1);
    expect(getConstructionStage(0.24)).toBe(1);
    expect(getConstructionStage(0.25)).toBe(2);
    expect(getConstructionStage(0.5)).toBe(3);
    expect(getConstructionStage(0.75)).toBe(4);
    expect(getConstructionStage(1)).toBe(5);
  });
});

describe("getCampusVisualTierLabel", () => {
  it("returns Spanish tier names", () => {
    expect(getCampusVisualTierLabel(2)).toBe("Bronce");
    expect(getCampusVisualTierLabel(5)).toBe("Plata");
    expect(getCampusVisualTierLabel(8)).toBe("Oro");
  });
});

describe("getTargetCampusVisualTier", () => {
  it("uses next level for upgrade preview", () => {
    expect(getTargetCampusVisualTier(3)).toBe(2);
    expect(getTargetCampusVisualTier(6)).toBe(3);
  });
});
