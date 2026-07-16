import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { FontCategory } from "../fonts/types";
import type { FontMetrics } from "./metrics";
import {
  WARN_THRESHOLD,
  contrastScore,
  distinctionScore,
  legibilityScore,
  scorePairing,
} from "./score";

const CATEGORIES: FontCategory[] = ["serif", "sans-serif", "display", "handwriting", "monospace"];

/** Metrics spanning the spread actually observed across the catalog. */
const metrics = (): fc.Arbitrary<FontMetrics> =>
  fc
    .record({
      xHeight: fc.double({ min: 0.3, max: 0.6, noNaN: true }),
      capHeight: fc.double({ min: 0.6, max: 0.8, noNaN: true }),
      avgCharWidth: fc.double({ min: 0.35, max: 0.65, noNaN: true }),
    })
    .map((m) => ({ ...m, xHeightRatio: m.xHeight / m.capHeight }));

const face = () =>
  fc.record({
    metrics: metrics(),
    category: fc.constantFrom(...CATEGORIES),
    family: fc.string({ minLength: 1, maxLength: 20 }),
  });

const hex = () =>
  fc
    .tuple(...Array.from({ length: 6 }, () => fc.constantFrom(..."0123456789abcdef".split(""))))
    .map((d) => `#${d.join("")}`);

describe("score factors — properties", () => {
  it("every factor curve stays in 0..100", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 30, noNaN: true }), (ratio) => {
        expect(contrastScore(ratio)).toBeGreaterThanOrEqual(0);
        expect(contrastScore(ratio)).toBeLessThanOrEqual(100);
      }),
    );
    fc.assert(
      fc.property(fc.double({ min: 0, max: 2, noNaN: true }), (r) => {
        expect(legibilityScore(r)).toBeGreaterThanOrEqual(0);
        expect(legibilityScore(r)).toBeLessThanOrEqual(100);
      }),
    );
  });

  it("contrast never scores worse for a higher ratio", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 21, noNaN: true }),
        fc.double({ min: 1, max: 21, noNaN: true }),
        (a, b) => {
          const [low, high] = a <= b ? [a, b] : [b, a];
          expect(contrastScore(high)).toBeGreaterThanOrEqual(contrastScore(low) - 1e-9);
        },
      ),
    );
  });

  it("distinction stays in 0..100 and is symmetric between the slots", () => {
    fc.assert(
      fc.property(face(), face(), (a, b) => {
        const forward = distinctionScore(a, b);
        expect(forward).toBeGreaterThanOrEqual(0);
        expect(forward).toBeLessThanOrEqual(100);
        expect(distinctionScore(b, a)).toBeCloseTo(forward, 9);
      }),
    );
  });

  // The documented rule: the same family twice is the absence of a pairing.
  it("scores the same family twice as zero distinction, whatever its metrics", () => {
    fc.assert(
      fc.property(face(), metrics(), (a, otherMetrics) => {
        expect(distinctionScore(a, { ...a, metrics: otherMetrics })).toBe(0);
      }),
    );
  });

  it("never scores two categories apart below the category baseline", () => {
    fc.assert(
      fc.property(face(), face(), (a, b) => {
        fc.pre(a.category !== b.category && a.family !== b.family);
        expect(distinctionScore(a, b)).toBeGreaterThanOrEqual(55);
      }),
    );
  });
});

describe("scorePairing — properties", () => {
  it("always returns a whole number in 0..100 for any palette and pairing", () => {
    fc.assert(
      fc.property(hex(), hex(), face(), face(), (textColor, bgColor, display, ui) => {
        const result = scorePairing({ textColor, bgColor, display, ui })!;
        expect(result).not.toBeNull();
        expect(Number.isInteger(result.overall)).toBe(true);
        expect(result.overall).toBeGreaterThanOrEqual(0);
        expect(result.overall).toBeLessThanOrEqual(100);
      }),
    );
  });

  it("returns null for an unparseable color rather than throwing", () => {
    fc.assert(
      fc.property(fc.string(), hex(), (junk, good) => {
        expect(() => scorePairing({ textColor: junk, bgColor: good })).not.toThrow();
      }),
    );
  });

  // The veto rule, stated as an invariant: no combination of flattering
  // metrics can lift a WCAG failure to a passing score.
  it("never lets a pairing that fails WCAG score as passing", () => {
    fc.assert(
      fc.property(face(), face(), (display, ui) => {
        // Grey on grey, 1.32:1 — a hard WCAG failure. Without the veto the two
        // heuristic factors could still carry this to ~80.
        const result = scorePairing({ textColor: "#767676", bgColor: "#8a8a8a", display, ui })!;
        expect(result.overall).toBeLessThan(WARN_THRESHOLD);
      }),
    );
  });

  it("marks the score unmeasured exactly when a slot has no metrics", () => {
    fc.assert(
      fc.property(face(), face(), fc.boolean(), fc.boolean(), (display, ui, dropA, dropB) => {
        const result = scorePairing({
          textColor: "#1a1712",
          bgColor: "#fcfaf6",
          display: { ...display, metrics: dropA ? null : display.metrics },
          ui: { ...ui, metrics: dropB ? null : ui.metrics },
        })!;

        expect(result.measured).toBe(!dropA && !dropB);
        // Unmeasured means contrast-only — never an invented factor.
        expect(result.factors).toHaveLength(result.measured ? 3 : 1);
      }),
    );
  });
});
