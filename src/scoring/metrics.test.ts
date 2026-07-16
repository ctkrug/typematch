import { describe, expect, it, vi } from "vitest";
import { createCanvasMeasurer, measureFontMetrics, type MeasureText } from "./metrics";

/**
 * A measurer standing in for a real rasterizer: ascent scales with the
 * requested px size, so the em-normalized output is exact and assertable.
 */
function fakeMeasurer(ratios: { x: number; cap: number; charWidth: number }): MeasureText {
  return (text, cssFont) => {
    const size = Number.parseFloat(cssFont);
    if (text === "x") return { width: size * ratios.charWidth, ascent: size * ratios.x };
    if (text === "H") return { width: size * ratios.charWidth, ascent: size * ratios.cap };
    return { width: size * ratios.charWidth * text.length, ascent: size * ratios.x };
  };
}

const HELVETICA_ISH = { x: 0.52, cap: 0.72, charWidth: 0.5 };

/** The lowercase alphabet the measurer probes for average character width. */
const ALPHABET_PROBE = "abcdefghijklmnopqrstuvwxyz";

describe("measureFontMetrics", () => {
  it("normalizes measurements to the em", () => {
    const metrics = measureFontMetrics('"Inter", sans-serif', fakeMeasurer(HELVETICA_ISH))!;

    expect(metrics.xHeight).toBeCloseTo(0.52, 6);
    expect(metrics.capHeight).toBeCloseTo(0.72, 6);
    expect(metrics.avgCharWidth).toBeCloseTo(0.5, 6);
  });

  it("derives the x-height ratio from x-height over cap-height", () => {
    const metrics = measureFontMetrics("serif", fakeMeasurer(HELVETICA_ISH))!;
    expect(metrics.xHeightRatio).toBeCloseTo(0.52 / 0.72, 6);
  });

  it("yields the same em-normalized metrics at any measuring size", () => {
    const measure = fakeMeasurer(HELVETICA_ISH);
    const small = measureFontMetrics("serif", measure, 16)!;
    const large = measureFontMetrics("serif", measure, 400)!;

    expect(small.xHeight).toBeCloseTo(large.xHeight, 6);
    expect(small.xHeightRatio).toBeCloseTo(large.xHeightRatio, 6);
  });

  it("asks the measurer for the font stack it was given", () => {
    const measure = vi.fn(fakeMeasurer(HELVETICA_ISH));
    measureFontMetrics('"Lora", serif', measure, 200);

    expect(measure).toHaveBeenCalledWith("x", '200px "Lora", serif');
    expect(measure).toHaveBeenCalledWith("H", '200px "Lora", serif');
  });

  it("returns null when the measurer cannot measure", () => {
    expect(measureFontMetrics("serif", () => null)).toBeNull();
  });

  it("returns null rather than dividing by zero on a zero-height glyph", () => {
    const measure: MeasureText = () => ({ width: 10, ascent: 0 });
    expect(measureFontMetrics("serif", measure)).toBeNull();
  });

  it("returns null on a zero-width alphabet", () => {
    const measure: MeasureText = (text) =>
      text.length > 1 ? { width: 0, ascent: 10 } : { width: 10, ascent: 10 };
    expect(measureFontMetrics("serif", measure)).toBeNull();
  });

  it("returns null for a nonsensical measuring size", () => {
    const measure = fakeMeasurer(HELVETICA_ISH);
    expect(measureFontMetrics("serif", measure, 0)).toBeNull();
    expect(measureFontMetrics("serif", measure, -10)).toBeNull();
    expect(measureFontMetrics("serif", measure, Number.NaN)).toBeNull();
  });

  it("distinguishes a large-x-height face from a small-x-height one", () => {
    const large = measureFontMetrics(
      "serif",
      fakeMeasurer({ x: 0.56, cap: 0.72, charWidth: 0.5 }),
    )!;
    const small = measureFontMetrics("serif", fakeMeasurer({ x: 0.4, cap: 0.72, charWidth: 0.5 }))!;

    expect(large.xHeightRatio).toBeGreaterThan(small.xHeightRatio);
  });
});

describe("measureFontMetrics — hostile measurements", () => {
  /** A measurer that reports garbage for one probe and sane numbers otherwise. */
  function poisoned(text: string, box: { width: number; ascent: number }): MeasureText {
    return (probe, cssFont) => (probe === text ? box : fakeMeasurer(HELVETICA_ISH)(probe, cssFont));
  }

  // "Unmeasurable" must mean null, never a number built from garbage: a NaN
  // here propagates all the way to a NaN on screen.
  it.each([
    ["a NaN ascent", "x", { width: 100, ascent: Number.NaN }],
    ["a NaN width", ALPHABET_PROBE, { width: Number.NaN, ascent: 100 }],
    ["an infinite ascent", "H", { width: 100, ascent: Number.POSITIVE_INFINITY }],
  ])("returns null for %s", (_name, text, box) => {
    expect(measureFontMetrics("serif", poisoned(text as string, box))).toBeNull();
  });
});

describe("createCanvasMeasurer", () => {
  it("returns null when the environment has no usable text metrics", () => {
    // jsdom ships no canvas backend, so this is the real degraded path.
    expect(createCanvasMeasurer()).toBeNull();
  });
});
