import { describe, expect, it } from "vitest";
import {
  AI_IDLE_VERIFIED_CAMPUS_VARIANTS,
  AI_VERIFIED_CAMPUS_VARIANTS,
} from "../campus-asset-inventory.generated";
import {
  getCampusAsset,
  getCampusAssetFormat,
  getCampusAssetPath,
  getCampusMasterBackground,
  hasAiIdleAssets,
  hasAiMasterBackground,
  hasAiVerifiedAssets,
  hasIllustratedAssets,
  ILLUSTRATED_CAMPUS_VARIANTS,
  resolveCampusAssetSrc,
  shouldUseAiCampusArt,
} from "../campus-asset-manifest";

describe("campus-asset-manifest", () => {
  it("lists all six illustrated variants", () => {
    expect(ILLUSTRATED_CAMPUS_VARIANTS).toHaveLength(6);
    expect(ILLUSTRATED_CAMPUS_VARIANTS).toContain("academy");
  });

  it("detects academy idle raster assets when present", () => {
    const academyIdle = AI_IDLE_VERIFIED_CAMPUS_VARIANTS.includes("academy");
    expect(hasAiIdleAssets("academy")).toBe(academyIdle);
    if (academyIdle) {
      expect(getCampusAssetFormat({ variant: "academy", mode: "idle", tier: 1 })).toBe("png");
    }
  });

  it("builds asset paths with correct extension", () => {
    const format = getCampusAssetFormat({ variant: "academy", mode: "idle", tier: 2 });
    expect(getCampusAssetPath({ variant: "academy", mode: "idle", tier: 2 }, format)).toMatch(
      /\/campus\/buildings\/academy\/idle\/tier-2\.(png|webp|svg)$/
    );
  });

  it("shouldUseAiCampusArt for idle when idle verified", () => {
    const idle = shouldUseAiCampusArt("academy", "idle");
    expect(idle).toBe(AI_IDLE_VERIFIED_CAMPUS_VARIANTS.includes("academy"));
  });

  it("shouldUseAiCampusArt for construction only when fully verified", () => {
    const construction = shouldUseAiCampusArt("academy", "construction");
    expect(construction).toBe(AI_VERIFIED_CAMPUS_VARIANTS.includes("academy"));
  });

  it("returns alt text for assets", () => {
    const asset = getCampusAsset({
      variant: "academy",
      mode: "idle",
      tier: 1,
    });
    expect(asset.alt).toContain("Academia");
  });

  it("exposes master background path", () => {
    expect(getCampusMasterBackground()).toMatch(/\/campus\/bg\/master\.(svg|webp|png)/);
    expect(hasAiMasterBackground()).toBe(getCampusMasterBackground().includes("master.webp") || getCampusMasterBackground().includes("master.png"));
  });

  it("resolves academy idle src when raster present", () => {
    const src = resolveCampusAssetSrc({ variant: "academy", mode: "idle", tier: 1 });
    if (AI_IDLE_VERIFIED_CAMPUS_VARIANTS.includes("academy")) {
      expect(src).toMatch(/tier-1\.(png|webp)/);
    } else {
      expect(src === null || src?.endsWith(".svg")).toBe(true);
    }
  });

  it("hasAiVerifiedAssets tracks full rollout", () => {
    for (const variant of ILLUSTRATED_CAMPUS_VARIANTS) {
      expect(hasAiVerifiedAssets(variant)).toBe(
        AI_VERIFIED_CAMPUS_VARIANTS.includes(variant)
      );
    }
  });

  it("hasIllustratedAssets remains true for all campus variants", () => {
    expect(hasIllustratedAssets("medical")).toBe(true);
  });
});
