import { describe, expect, it } from "vitest";
import type { FontMetrics } from "./metrics";
import {
  WARN_THRESHOLD,
  contrastScore,
  distinctionScore,
  legibilityScore,
  scorePairing,
} from "./score";

function metrics(over: Partial<FontMetrics> = {}): FontMetrics {
  const base: FontMetrics = {
    xHeight: 0.52,
    capHeight: 0.72,
    avgCharWidth: 0.5,
    xHeightRatio: 0.52 / 0.72,
  };
  return { ...base, ...over };
}

const INK_ON_PAPER = { textColor: "#1a1712", bgColor: "#fcfaf6" };

describe("contrastScore", () => {
  it("scores the WCAG anchors as designed", () => {
    expect(contrastScore(1)).toBe(0);
    expect(contrastScore(3)).toBeCloseTo(50, 5);
    expect(contrastScore(4.5)).toBeCloseTo(75, 5);
    expect(contrastScore(7)).toBeCloseTo(90, 5);
  });

  it("tops out at 100 and stops rewarding ever-harsher contrast", () => {
    expect(contrastScore(12)).toBe(100);
    expect(contrastScore(21)).toBe(100);
  });

  it("never leaves the 0..100 range, even for out-of-range input", () => {
    for (const ratio of [-5, 0, 0.5, 1, 2, 4.5, 10, 21, 100]) {
      const score = contrastScore(ratio);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("increases monotonically with the ratio", () => {
    let previous = -1;
    for (let ratio = 1; ratio <= 12; ratio += 0.25) {
      const score = contrastScore(ratio);
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });
});

describe("legibilityScore", () => {
  it("gives a full score across the comfortable x-height band", () => {
    expect(legibilityScore(0.68)).toBe(100);
    expect(legibilityScore(0.74)).toBe(100);
    expect(legibilityScore(0.8)).toBe(100);
  });

  it("penalizes an x-height below the band", () => {
    expect(legibilityScore(0.6)).toBeCloseTo(44, 5);
    expect(legibilityScore(0.5)).toBeCloseTo(0, 5);
  });

  it("penalizes an x-height above the band", () => {
    expect(legibilityScore(0.86)).toBeCloseTo(76, 5);
  });

  it("punishes a too-small x-height harder than a too-large one", () => {
    // A cramped body face hurts 13px labels; a roomy one only costs elegance.
    const below = legibilityScore(0.68 - 0.06);
    const above = legibilityScore(0.8 + 0.06);
    expect(below).toBeLessThan(above);
  });

  it("clamps to 0 rather than going negative for an extreme face", () => {
    expect(legibilityScore(0.1)).toBe(0);
    expect(legibilityScore(1.5)).toBe(0);
  });
});

describe("distinctionScore", () => {
  const sans = { metrics: metrics(), category: "sans-serif" as const };

  it("scores a font paired with itself at zero — no hierarchy at all", () => {
    expect(distinctionScore(sans, sans)).toBe(0);
  });

  it("rewards a cross-category pairing over a same-category one", () => {
    const serif = { metrics: metrics(), category: "serif" as const };
    expect(distinctionScore(serif, sans)).toBeGreaterThan(distinctionScore(sans, sans));
  });

  it("rewards diverging metrics within the same category", () => {
    const wide = { metrics: metrics({ avgCharWidth: 0.62 }), category: "sans-serif" as const };
    expect(distinctionScore(wide, sans)).toBeGreaterThan(distinctionScore(sans, sans));
  });

  it("is symmetric — swapping the slots doesn't change how different they are", () => {
    const serif = { metrics: metrics({ xHeightRatio: 0.6 }), category: "serif" as const };
    expect(distinctionScore(serif, sans)).toBeCloseTo(distinctionScore(sans, serif), 10);
  });

  it("clamps a wildly divergent pairing to 100", () => {
    const extreme = {
      metrics: metrics({ xHeightRatio: 0.95, avgCharWidth: 1.5 }),
      category: "display" as const,
    };
    expect(distinctionScore(extreme, sans)).toBe(100);
  });
});

describe("scorePairing", () => {
  const display = { metrics: metrics({ xHeightRatio: 0.62 }), category: "serif" as const };
  const ui = { metrics: metrics({ xHeightRatio: 0.74 }), category: "sans-serif" as const };

  it("returns an overall score with all three factors when metrics exist", () => {
    const score = scorePairing({ ...INK_ON_PAPER, display, ui })!;

    expect(score.measured).toBe(true);
    expect(score.factors.map((f) => f.id)).toEqual(["contrast", "legibility", "distinction"]);
    expect(score.overall).toBeGreaterThan(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("returns an integer overall so the UI never renders 73.4291", () => {
    const score = scorePairing({ ...INK_ON_PAPER, display, ui })!;
    expect(Number.isInteger(score.overall)).toBe(true);
  });

  it("falls back to contrast-only and flags it when metrics are unavailable", () => {
    const score = scorePairing({
      ...INK_ON_PAPER,
      display: { metrics: null, category: "serif" },
      ui: { metrics: null, category: "sans-serif" },
    })!;

    expect(score.measured).toBe(false);
    expect(score.factors.map((f) => f.id)).toEqual(["contrast"]);
    expect(score.overall).toBe(Math.round(score.factors[0].score));
  });

  it("falls back to contrast-only when only one slot could be measured", () => {
    const score = scorePairing({ ...INK_ON_PAPER, display, ui: { metrics: null, category: "sans-serif" } })!;
    expect(score.measured).toBe(false);
  });

  it("scores a legible ink-on-paper pairing above the warning threshold", () => {
    const score = scorePairing({ ...INK_ON_PAPER, display, ui })!;
    expect(score.overall).toBeGreaterThanOrEqual(WARN_THRESHOLD);
    expect(score.level).not.toBe("poor");
  });

  it("marks a low-contrast pairing poor and says so in plain language", () => {
    const score = scorePairing({ textColor: "#bbbbbb", bgColor: "#cccccc", display, ui })!;

    expect(score.level).toBe("poor");
    expect(score.factors[0].level).toBe("poor");
    expect(score.factors[0].verdict).toMatch(/fails WCAG AA/i);
  });

  it("never lets a good factor average away a failing one", () => {
    // Perfect legibility and distinction must not lift a WCAG failure into
    // "fair" — the pairing has a real defect and the number has to say so.
    const score = scorePairing({
      textColor: "#bbbbbb",
      bgColor: "#cccccc",
      display: { metrics: metrics({ xHeightRatio: 0.74, avgCharWidth: 0.9 }), category: "display" },
      ui: { metrics: metrics({ xHeightRatio: 0.74 }), category: "sans-serif" },
    })!;

    expect(score.factors.find((f) => f.id === "legibility")!.score).toBe(100);
    expect(score.overall).toBeLessThan(WARN_THRESHOLD);
    expect(score.level).toBe("poor");
  });

  it("caps the overall when the same family fills both slots", () => {
    const same = { ...ui, family: "Inter" };
    const score = scorePairing({ ...INK_ON_PAPER, display: same, ui: same })!;

    expect(score.overall).toBeLessThan(WARN_THRESHOLD);
  });

  it("does not let a heuristic factor veto an otherwise sound pairing", () => {
    // Two same-category faces score low on distinction, but the metrics can't
    // see skeleton — a condensed sans display over a neutral sans body is a
    // real pairing and must not be condemned to "needs work" on that alone.
    const condensed = {
      metrics: metrics({ xHeightRatio: 0.716, avgCharWidth: 0.3997 }),
      category: "sans-serif" as const,
      family: "Oswald",
    };
    const body = {
      metrics: metrics({ xHeightRatio: 0.748, avgCharWidth: 0.5352 }),
      category: "sans-serif" as const,
      family: "Inter",
    };

    const score = scorePairing({ ...INK_ON_PAPER, display: condensed, ui: body })!;

    expect(score.factors.find((f) => f.id === "distinction")!.level).toBe("poor");
    expect(score.overall).toBeGreaterThan(WARN_THRESHOLD);
  });

  it("calls out the same font in both slots as no pairing at all", () => {
    const same = { ...ui, family: "Inter" };
    const score = scorePairing({ ...INK_ON_PAPER, display: same, ui: same })!;
    const distinction = score.factors.find((f) => f.id === "distinction")!;

    expect(distinction.score).toBe(0);
    expect(distinction.readout).toBe("same family");
    expect(distinction.verdict).toMatch(/same font twice/i);
  });

  it("gives every factor a readout and a non-empty verdict", () => {
    const score = scorePairing({ ...INK_ON_PAPER, display, ui })!;
    for (const factor of score.factors) {
      expect(factor.readout, factor.id).toBeTruthy();
      expect(factor.verdict, factor.id).toBeTruthy();
      expect(factor.label, factor.id).toBeTruthy();
    }
  });

  it("reports the contrast ratio in the readout", () => {
    const score = scorePairing({ textColor: "#000000", bgColor: "#ffffff", display, ui })!;
    expect(score.factors[0].readout).toMatch(/^21\.00:1 · AAA$/);
  });

  it("returns null for a malformed color rather than throwing", () => {
    expect(scorePairing({ textColor: "not-a-color", bgColor: "#fff" })).toBeNull();
    expect(scorePairing({ textColor: "#fff", bgColor: "" })).toBeNull();
  });

  it("keeps the overall within 0..100 for every combination of extremes", () => {
    const faces = [
      { metrics: metrics({ xHeightRatio: 0.1, avgCharWidth: 0.1 }), category: "serif" as const },
      { metrics: metrics({ xHeightRatio: 0.99, avgCharWidth: 2 }), category: "display" as const },
      ui,
    ];
    for (const a of faces) {
      for (const b of faces) {
        for (const colors of [INK_ON_PAPER, { textColor: "#fff", bgColor: "#fff" }]) {
          const score = scorePairing({ ...colors, display: a, ui: b })!;
          expect(score.overall).toBeGreaterThanOrEqual(0);
          expect(score.overall).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
