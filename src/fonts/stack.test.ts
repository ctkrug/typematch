import { describe, expect, it } from "vitest";
import { FONT_CATALOG } from "./catalog";
import { fallbackStack, fontStack } from "./stack";
import { FALLBACK_STACK, type FontFamily } from "./types";

const EXO: FontFamily = { family: "Exo 2", category: "sans-serif", weights: [400] };

describe("fontStack", () => {
  it("quotes the family and appends its category fallback", () => {
    expect(fontStack(EXO)).toBe(`"Exo 2", ${FALLBACK_STACK["sans-serif"]}`);
  });

  it("uses a serif fallback for a serif family", () => {
    const lora: FontFamily = { family: "Lora", category: "serif", weights: [400] };
    expect(fontStack(lora)).toContain("serif");
    expect(fontStack(lora)).not.toContain("sans-serif");
  });

  it("quotes every family in the catalog so multi-word names parse", () => {
    for (const font of FONT_CATALOG) {
      expect(fontStack(font), font.family).toContain(`"${font.family}"`);
    }
  });

  it("ends every catalog stack in a CSS generic so text always renders", () => {
    const generics = ["serif", "sans-serif", "cursive", "monospace"];
    for (const font of FONT_CATALOG) {
      const last = fontStack(font).split(",").pop()!.trim();
      expect(generics, font.family).toContain(last);
    }
  });
});

describe("fallbackStack", () => {
  it("drops the family and keeps only the system stack", () => {
    expect(fallbackStack(EXO)).toBe(FALLBACK_STACK["sans-serif"]);
    expect(fallbackStack(EXO)).not.toContain("Exo 2");
  });
});
