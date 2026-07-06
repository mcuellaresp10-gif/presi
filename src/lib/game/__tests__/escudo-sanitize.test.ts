import { describe, expect, it } from "vitest";
import {
  buildRandomEscudo,
  LEGACY_TEMPLATE_MAP,
} from "@/lib/game/escudo-presets";
import {
  normalizeEscudoConfig,
  sanitizeEscudoConfig,
} from "@/lib/game/escudo-sanitize";

describe("escudo sanitize", () => {
  it("maps legacy templateId to shapeId and iconId", () => {
    const config = normalizeEscudoConfig({
      templateId: 5,
      primaryColor: "#111111",
      secondaryColor: "#EEEEEE",
    });

    expect(config.shapeId).toBe(LEGACY_TEMPLATE_MAP[5]!.shapeId);
    expect(config.iconId).toBe(LEGACY_TEMPLATE_MAP[5]!.iconId);
  });

  it("rejects identical primary and secondary colors", () => {
    const config = normalizeEscudoConfig({
      shapeId: 1,
      iconId: 1,
      primaryColor: "#AABBCC",
      secondaryColor: "#AABBCC",
    });

    expect(config.primaryColor).toBe("#AABBCC");
    expect(config.secondaryColor).not.toBe(config.primaryColor);
  });

  it("clamps invalid shape and icon ids", () => {
    const config = normalizeEscudoConfig({
      shapeId: 99,
      iconId: -1,
      primaryColor: "#070B18",
      secondaryColor: "#F5C518",
    });

    expect(config.shapeId).toBeGreaterThanOrEqual(1);
    expect(config.shapeId).toBeLessThanOrEqual(6);
    expect(config.iconId).toBeGreaterThanOrEqual(1);
    expect(config.iconId).toBeLessThanOrEqual(12);
  });

  it("sanitizeEscudoConfig returns ok for valid input", () => {
    const result = sanitizeEscudoConfig({
      shapeId: 2,
      iconId: 3,
      primaryColor: "#0B5E2E",
      secondaryColor: "#FFFFFF",
      pattern: "vertical",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.pattern).toBe("vertical");
    }
  });

  it("buildRandomEscudo produces valid config", () => {
    const config = buildRandomEscudo();
    const result = sanitizeEscudoConfig(config);
    expect(result.ok).toBe(true);
  });
});
