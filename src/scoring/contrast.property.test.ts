import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, relativeLuminance, wcagLevel, type Rgb } from "./contrast";

/** Any renderable color, not just the two palettes the app happens to ship. */
const rgb = (): fc.Arbitrary<Rgb> =>
  fc.record({
    r: fc.integer({ min: 0, max: 255 }),
    g: fc.integer({ min: 0, max: 255 }),
    b: fc.integer({ min: 0, max: 255 }),
  });

const hexDigit = fc.constantFrom(..."0123456789abcdefABCDEF".split(""));

describe("contrast — properties", () => {
  it("luminance stays within 0..1 for every color", () => {
    fc.assert(
      fc.property(rgb(), (color) => {
        const l = relativeLuminance(color);
        expect(l).toBeGreaterThanOrEqual(0);
        expect(l).toBeLessThanOrEqual(1);
      }),
    );
  });

  it("luminance never decreases when a channel gets brighter", () => {
    fc.assert(
      fc.property(rgb(), fc.integer({ min: 0, max: 255 }), (color, brighter) => {
        const raised = { ...color, g: Math.max(color.g, brighter) };
        expect(relativeLuminance(raised)).toBeGreaterThanOrEqual(relativeLuminance(color) - 1e-12);
      }),
    );
  });

  it("the ratio is symmetric in its arguments", () => {
    fc.assert(
      fc.property(rgb(), rgb(), (a, b) => {
        expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 12);
      }),
    );
  });

  // The WCAG range: 1:1 for identical colors, 21:1 for black on white.
  it("the ratio always lands in 1..21", () => {
    fc.assert(
      fc.property(rgb(), rgb(), (a, b) => {
        const ratio = contrastRatio(a, b);
        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21);
      }),
    );
  });

  it("a color against itself is exactly 1:1", () => {
    fc.assert(
      fc.property(rgb(), (color) => {
        expect(contrastRatio(color, color)).toBeCloseTo(1, 12);
      }),
    );
  });

  it("grades every ratio in the range, never falling through", () => {
    fc.assert(
      fc.property(rgb(), rgb(), (a, b) => {
        expect(["AAA", "AA", "AA Large", "Fail"]).toContain(wcagLevel(contrastRatio(a, b)));
      }),
    );
  });
});

describe("parseHex — properties", () => {
  it("round-trips any 6-digit hex back to the same channels", () => {
    fc.assert(
      fc.property(rgb(), (color) => {
        const hex = `#${[color.r, color.g, color.b]
          .map((c) => c.toString(16).padStart(2, "0"))
          .join("")}`;
        expect(parseHex(hex)).toEqual(color);
      }),
    );
  });

  it("reads a 3-digit hex as its doubled 6-digit form", () => {
    fc.assert(
      fc.property(fc.array(hexDigit, { minLength: 3, maxLength: 3 }), (digits) => {
        const short = digits.join("");
        const long = digits.map((d) => d + d).join("");
        expect(parseHex(`#${short}`)).toEqual(parseHex(`#${long}`));
      }),
    );
  });

  it("is case- and hash-insensitive", () => {
    fc.assert(
      fc.property(fc.array(hexDigit, { minLength: 6, maxLength: 6 }), (digits) => {
        const hex = digits.join("");
        expect(parseHex(hex.toUpperCase())).toEqual(parseHex(hex.toLowerCase()));
        expect(parseHex(`#${hex}`)).toEqual(parseHex(hex));
      }),
    );
  });

  // A malformed color must return null so the caller can render an error —
  // never throw, and never a half-parsed color.
  it("returns null rather than throwing on arbitrary junk", () => {
    fc.assert(
      fc.property(fc.string(), (junk) => {
        const result = parseHex(junk);
        if (result === null) return;
        for (const channel of [result.r, result.g, result.b]) {
          expect(Number.isInteger(channel)).toBe(true);
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        }
      }),
    );
  });
});
