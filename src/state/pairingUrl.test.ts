import { describe, expect, it } from "vitest";
import { FONT_CATALOG, findFamily } from "../fonts/catalog";
import { THEMES } from "../preview/theme";
import {
  DEFAULT_PAIRING,
  decodePairing,
  encodePairing,
  pairingUrl,
  type Pairing,
} from "./pairingUrl";

const PAIRING: Pairing = {
  display: findFamily("Playfair Display")!,
  ui: findFamily("Work Sans")!,
  theme: "dark",
};

describe("encodePairing", () => {
  it("encodes both families and the theme", () => {
    const params = new URLSearchParams(encodePairing(PAIRING));

    expect(params.get("display")).toBe("Playfair Display");
    expect(params.get("ui")).toBe("Work Sans");
    expect(params.get("theme")).toBe("dark");
  });

  it("escapes spaces in family names", () => {
    expect(encodePairing(PAIRING)).toContain("Playfair+Display");
  });
});

describe("decodePairing", () => {
  it("restores a pairing exactly", () => {
    expect(decodePairing(encodePairing(PAIRING))).toEqual(PAIRING);
  });

  it("tolerates a leading question mark", () => {
    expect(decodePairing(`?${encodePairing(PAIRING)}`)).toEqual(PAIRING);
  });

  it("round-trips every family in the catalog", () => {
    for (const font of FONT_CATALOG) {
      for (const theme of THEMES) {
        const pairing: Pairing = { display: font, ui: font, theme };
        expect(decodePairing(encodePairing(pairing)), font.family).toEqual(pairing);
      }
    }
  });

  it("falls back to the default for an empty query", () => {
    expect(decodePairing("")).toEqual(DEFAULT_PAIRING);
  });

  it("falls back per-field, keeping the params that are valid", () => {
    const result = decodePairing("display=Not+A+Font&ui=Work+Sans&theme=dark");

    expect(result.display).toEqual(DEFAULT_PAIRING.display);
    expect(result.ui).toEqual(findFamily("Work Sans"));
    expect(result.theme).toBe("dark");
  });

  it("rejects an unknown theme without discarding the fonts", () => {
    const result = decodePairing("display=Lora&ui=Inter&theme=neon");

    expect(result.theme).toBe(DEFAULT_PAIRING.theme);
    expect(result.display).toEqual(findFamily("Lora"));
  });

  it("ignores unrelated params", () => {
    expect(decodePairing("utm_source=twitter&display=Lora")).toMatchObject({
      display: findFamily("Lora"),
      ui: DEFAULT_PAIRING.ui,
    });
  });

  it("matches family names case-insensitively, as people type them", () => {
    expect(decodePairing("display=lora&ui=inter").display).toEqual(findFamily("Lora"));
  });

  it.each(["display=", "display=%%%", "&&&", "?", "theme", "display=<script>"])(
    "returns a usable pairing for the junk query %j",
    (search) => {
      const result = decodePairing(search);
      expect(result.display).toBeDefined();
      expect(result.ui).toBeDefined();
      expect(THEMES).toContain(result.theme);
    },
  );

  it("uses a supplied fallback over the default", () => {
    expect(decodePairing("", PAIRING)).toEqual(PAIRING);
  });
});

describe("pairingUrl", () => {
  it("keeps the app's path so links survive a subpath deploy", () => {
    const url = pairingUrl(PAIRING, "https://apps.charliekrug.com/typematch/");

    expect(url.startsWith("https://apps.charliekrug.com/typematch/?")).toBe(true);
  });

  it("replaces any existing query rather than appending to it", () => {
    const url = pairingUrl(PAIRING, "https://example.com/app?display=Lora&stale=1");

    expect(url).not.toContain("stale");
    expect(url).not.toContain("Lora");
  });

  it("drops the hash so a shared link doesn't carry local scroll state", () => {
    expect(pairingUrl(PAIRING, "https://example.com/app#pricing")).not.toContain("#");
  });

  it("produces a link that decodes back to the same pairing", () => {
    const url = new URL(pairingUrl(PAIRING, "https://example.com/typematch/"));
    expect(decodePairing(url.search)).toEqual(PAIRING);
  });
});
