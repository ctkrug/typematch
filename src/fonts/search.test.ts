import { describe, expect, it } from "vitest";
import { FONT_CATALOG, findFamily } from "./catalog";
import { searchFamilies } from "./search";
import type { FontFamily } from "./types";

const FIXTURE: FontFamily[] = [
  { family: "Inter", category: "sans-serif", weights: [400, 700] },
  { family: "Inter Tight", category: "sans-serif", weights: [400] },
  { family: "Winter Sans", category: "sans-serif", weights: [400] },
  { family: "Lora", category: "serif", weights: [400] },
  { family: "Instrument Serif", category: "serif", weights: [400] },
];

describe("searchFamilies", () => {
  it("matches on a case-insensitive substring of the family name", () => {
    const names = searchFamilies("lor", { catalog: FIXTURE }).map((f) => f.family);
    expect(names).toEqual(["Lora"]);
  });

  it("ignores case in both the query and the family name", () => {
    expect(searchFamilies("INTER", { catalog: FIXTURE }).map((f) => f.family)).toEqual(
      searchFamilies("inter", { catalog: FIXTURE }).map((f) => f.family),
    );
  });

  it("ranks an exact match above a prefix match above a mid-name match", () => {
    const names = searchFamilies("inter", { catalog: FIXTURE }).map((f) => f.family);
    expect(names).toEqual(["Inter", "Inter Tight", "Winter Sans"]);
  });

  it("returns the head of the catalog for an empty query", () => {
    expect(searchFamilies("", { catalog: FIXTURE, limit: 2 })).toEqual(FIXTURE.slice(0, 2));
  });

  it("treats a whitespace-only query as empty", () => {
    expect(searchFamilies("   ", { catalog: FIXTURE, limit: 2 })).toEqual(FIXTURE.slice(0, 2));
  });

  it("trims surrounding whitespace before matching", () => {
    expect(searchFamilies("  lora  ", { catalog: FIXTURE }).map((f) => f.family)).toEqual(["Lora"]);
  });

  it("returns an empty list when nothing matches, not an error", () => {
    expect(searchFamilies("zzzznope", { catalog: FIXTURE })).toEqual([]);
  });

  it("caps results at the requested limit", () => {
    expect(searchFamilies("", { catalog: FIXTURE, limit: 1 })).toHaveLength(1);
  });

  it("returns nothing for a zero or negative limit rather than throwing", () => {
    expect(searchFamilies("inter", { catalog: FIXTURE, limit: 0 })).toEqual([]);
    expect(searchFamilies("inter", { catalog: FIXTURE, limit: -5 })).toEqual([]);
  });

  it("narrows to a single category when asked", () => {
    const names = searchFamilies("", { catalog: FIXTURE, category: "serif" }).map((f) => f.family);
    expect(names).toEqual(["Lora", "Instrument Serif"]);
  });

  it("searches the vendored catalog by default", () => {
    expect(searchFamilies("fraunces").map((f) => f.family)).toContain("Fraunces");
  });

  it("never returns more than the catalog holds", () => {
    expect(searchFamilies("", { limit: 10_000 })).toHaveLength(FONT_CATALOG.length);
  });
});

describe("findFamily", () => {
  it("finds a family regardless of case or surrounding whitespace", () => {
    expect(findFamily("  playfair display ")?.family).toBe("Playfair Display");
  });

  it("returns undefined for an unknown family", () => {
    expect(findFamily("Not A Real Font")).toBeUndefined();
  });

  it("returns undefined for an empty name", () => {
    expect(findFamily("")).toBeUndefined();
  });
});

describe("FONT_CATALOG", () => {
  it("has no duplicate family names", () => {
    const names = FONT_CATALOG.map((f) => f.family.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every family at least one weight, sorted ascending", () => {
    for (const font of FONT_CATALOG) {
      expect(font.weights.length, font.family).toBeGreaterThan(0);
      expect(font.weights, font.family).toEqual([...font.weights].sort((a, b) => a - b));
    }
  });

  it("every family is resolvable through findFamily", () => {
    for (const font of FONT_CATALOG) {
      expect(findFamily(font.family), font.family).toEqual(font);
    }
  });
});
