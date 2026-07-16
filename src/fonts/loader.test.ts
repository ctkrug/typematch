import { describe, expect, it, vi } from "vitest";
import { buildFontCssUrl, createFontLoader } from "./loader";
import type { FontFamily } from "./types";

const INTER: FontFamily = { family: "Inter", category: "sans-serif", weights: [400, 700] };
const PLAYFAIR: FontFamily = {
  family: "Playfair Display",
  category: "serif",
  weights: [700, 400, 400],
};

function noop() {
  return Promise.resolve();
}

describe("buildFontCssUrl", () => {
  it("builds a keyless CSS2 URL with the family's weights", () => {
    expect(buildFontCssUrl(INTER)).toBe(
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
    );
  });

  it("encodes spaces in multi-word family names as plus signs", () => {
    expect(buildFontCssUrl(PLAYFAIR)).toContain("family=Playfair+Display:wght@");
  });

  it("sorts and dedupes weights so the same family yields a stable URL", () => {
    expect(buildFontCssUrl(PLAYFAIR)).toContain(":wght@400;700&");
  });

  it("omits the weight axis for a family with no declared weights", () => {
    const bare: FontFamily = { family: "Lobster", category: "display", weights: [] };
    expect(buildFontCssUrl(bare)).toBe(
      "https://fonts.googleapis.com/css2?family=Lobster&display=swap",
    );
  });

  it("never requires an API key", () => {
    expect(buildFontCssUrl(INTER)).not.toMatch(/key=/i);
  });
});

describe("createFontLoader", () => {
  it("reports a loaded font once the stylesheet and faces resolve", async () => {
    const loader = createFontLoader({ loadStylesheet: noop, loadFaces: noop });
    await expect(loader.load(INTER)).resolves.toEqual({ family: "Inter", status: "loaded" });
    expect(loader.loaded()).toEqual(["Inter"]);
  });

  it("passes the built CSS URL to the stylesheet loader", async () => {
    const loadStylesheet = vi.fn(noop);
    await createFontLoader({ loadStylesheet, loadFaces: noop }).load(INTER);
    expect(loadStylesheet).toHaveBeenCalledWith(buildFontCssUrl(INTER));
  });

  it("fetches a given family only once per session", async () => {
    const loadStylesheet = vi.fn(noop);
    const loader = createFontLoader({ loadStylesheet, loadFaces: noop });

    await loader.load(INTER);
    await loader.load(INTER);
    await loader.load(INTER);

    expect(loadStylesheet).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent loads of the same family into one fetch", async () => {
    const loadStylesheet = vi.fn(noop);
    const loader = createFontLoader({ loadStylesheet, loadFaces: noop });

    await Promise.all([loader.load(INTER), loader.load(INTER)]);

    expect(loadStylesheet).toHaveBeenCalledTimes(1);
  });

  it("fetches distinct families separately", async () => {
    const loadStylesheet = vi.fn(noop);
    const loader = createFontLoader({ loadStylesheet, loadFaces: noop });

    await loader.load(INTER);
    await loader.load(PLAYFAIR);

    expect(loadStylesheet).toHaveBeenCalledTimes(2);
    expect(loader.loaded()).toEqual(["Inter", "Playfair Display"]);
  });

  it("returns an error result instead of rejecting when the stylesheet fails", async () => {
    const loader = createFontLoader({
      loadStylesheet: () => Promise.reject(new Error("network down")),
      loadFaces: noop,
    });

    const result = await loader.load(INTER);

    expect(result.status).toBe("error");
    expect(result.error).toContain("network down");
    expect(loader.loaded()).toEqual([]);
  });

  it("returns an error result when the faces never become usable", async () => {
    const loader = createFontLoader({
      loadStylesheet: noop,
      loadFaces: () => Promise.reject(new Error("face decode failed")),
    });

    await expect(loader.load(INTER)).resolves.toMatchObject({ status: "error" });
  });

  it("reports a timeout rather than hanging forever", async () => {
    const loader = createFontLoader({
      loadStylesheet: () => new Promise(() => {}),
      loadFaces: noop,
      timeoutMs: 10,
    });

    const result = await loader.load(INTER);

    expect(result.status).toBe("error");
    expect(result.error).toContain("Timed out");
  });

  it("lets a retry recover after a failure", async () => {
    const loadStylesheet = vi
      .fn(noop)
      .mockRejectedValueOnce(new Error("blip"))
      .mockResolvedValue(undefined);
    const loader = createFontLoader({ loadStylesheet, loadFaces: noop });

    expect((await loader.load(INTER)).status).toBe("error");
    expect((await loader.load(INTER)).status).toBe("loaded");
    expect(loadStylesheet).toHaveBeenCalledTimes(2);
  });

  it("surfaces a non-Error rejection as a readable message", async () => {
    const loader = createFontLoader({
      loadStylesheet: () => Promise.reject("just a string"),
      loadFaces: noop,
    });

    await expect(loader.load(INTER)).resolves.toMatchObject({
      status: "error",
      error: "just a string",
    });
  });
});
