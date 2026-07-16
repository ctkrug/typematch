import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  contrastRatioOfHex,
  parseHex,
  relativeLuminance,
  wcagLevel,
} from "./contrast";

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

/** Deterministic pseudo-random channels — property tests must not flake. */
function* sampleColors(count: number) {
  let seed = 12345;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % 256;
  };
  for (let i = 0; i < count; i++) {
    yield { r: next(), g: next(), b: next() };
  }
}

describe("parseHex", () => {
  it("parses a 6-digit hex", () => {
    expect(parseHex("#c1502e")).toEqual({ r: 193, g: 80, b: 46 });
  });

  it("expands a 3-digit shorthand", () => {
    expect(parseHex("#fff")).toEqual(WHITE);
    expect(parseHex("#f00")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("accepts a missing leading hash and mixed case", () => {
    expect(parseHex("C1502E")).toEqual(parseHex("#c1502e"));
  });

  it("ignores surrounding whitespace", () => {
    expect(parseHex("  #fff  ")).toEqual(WHITE);
  });

  it.each(["", "#", "#ff", "#ffff", "#fffff", "#gggggg", "rgb(0,0,0)", "#1234567"])(
    "returns null for the malformed input %j",
    (input) => {
      expect(parseHex(input)).toBeNull();
    },
  );
});

describe("relativeLuminance", () => {
  it("anchors black at 0 and white at 1", () => {
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 5);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 5);
  });

  it("stays within 0..1 for any color", () => {
    for (const color of sampleColors(200)) {
      const luminance = relativeLuminance(color);
      expect(luminance).toBeGreaterThanOrEqual(0);
      expect(luminance).toBeLessThanOrEqual(1);
    }
  });

  it("is monotonic — lightening a channel never lowers luminance", () => {
    let previous = -1;
    for (let v = 0; v <= 255; v += 5) {
      const luminance = relativeLuminance({ r: v, g: v, b: v });
      expect(luminance).toBeGreaterThan(previous);
      previous = luminance;
    }
  });

  it("weights green above red above blue, per the sRGB coefficients", () => {
    const green = relativeLuminance({ r: 0, g: 255, b: 0 });
    const red = relativeLuminance({ r: 255, g: 0, b: 0 });
    const blue = relativeLuminance({ r: 0, g: 0, b: 255 });
    expect(green).toBeGreaterThan(red);
    expect(red).toBeGreaterThan(blue);
  });
});

describe("contrastRatio", () => {
  it("gives 21:1 for black on white, the WCAG maximum", () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 2);
  });

  it("gives 1:1 for a color against itself", () => {
    for (const color of sampleColors(50)) {
      expect(contrastRatio(color, color)).toBeCloseTo(1, 10);
    }
  });

  it("is symmetric in its arguments", () => {
    const colors = [...sampleColors(40)];
    for (let i = 0; i + 1 < colors.length; i += 2) {
      expect(contrastRatio(colors[i], colors[i + 1])).toBeCloseTo(
        contrastRatio(colors[i + 1], colors[i]),
        10,
      );
    }
  });

  it("always lands within the 1..21 range", () => {
    const colors = [...sampleColors(60)];
    for (const a of colors) {
      for (const b of [BLACK, WHITE, ...colors.slice(0, 5)]) {
        const ratio = contrastRatio(a, b);
        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21);
      }
    }
  });

  it("matches a known published value (#767676 on white is the AA boundary)", () => {
    // #767676 is the canonical lightest gray that still clears 4.5:1 on white.
    expect(contrastRatio(parseHex("#767676")!, WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(parseHex("#777777")!, WHITE)).toBeLessThan(4.5);
  });
});

describe("wcagLevel", () => {
  it.each([
    [21, "AAA"],
    [7, "AAA"],
    [6.99, "AA"],
    [4.5, "AA"],
    [4.49, "AA Large"],
    [3, "AA Large"],
    [2.99, "Fail"],
    [1, "Fail"],
  ])("maps a ratio of %s to %s", (ratio, expected) => {
    expect(wcagLevel(ratio)).toBe(expected);
  });
});

describe("contrastRatioOfHex", () => {
  it("computes the ratio between two hex colors", () => {
    expect(contrastRatioOfHex("#000", "#fff")).toBeCloseTo(21, 2);
  });

  it("returns null when either color is malformed", () => {
    expect(contrastRatioOfHex("nope", "#fff")).toBeNull();
    expect(contrastRatioOfHex("#fff", "nope")).toBeNull();
  });
});
