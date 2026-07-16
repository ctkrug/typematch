import { afterEach, describe, expect, it, vi } from "vitest";
import { LINK_ATTR, loadFaces, loadStylesheet } from "./browserLoader";
import type { FontFamily } from "./types";

const URL = "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap";

const LORA: FontFamily = { family: "Lora", category: "serif", weights: [400, 700] };

/** The <link> this module just appended, waiting for the browser to fetch it. */
const pendingLink = () => document.head.querySelector<HTMLLinkElement>(`link[${LINK_ATTR}]`)!;

afterEach(() => {
  document.head.querySelectorAll(`link[${LINK_ATTR}]`).forEach((el) => el.remove());
  vi.unstubAllGlobals();
});

describe("loadStylesheet", () => {
  it("appends a stylesheet link and resolves once it loads", async () => {
    const pending = loadStylesheet(URL);

    const link = pendingLink();
    expect(link.rel).toBe("stylesheet");
    expect(link.getAttribute("href")).toBe(URL);

    link.dispatchEvent(new Event("load"));
    await expect(pending).resolves.toBeUndefined();
  });

  it("rejects when the stylesheet can't be fetched", async () => {
    const pending = loadStylesheet(URL);
    pendingLink().dispatchEvent(new Event("error"));

    await expect(pending).rejects.toThrow(/could not fetch the font stylesheet/i);
  });

  /**
   * The dead tag has to go, or the reuse lookup below would find it and
   * resolve instantly — turning one transient network blip into a font that
   * can never load for the rest of the session.
   */
  it("drops the dead tag so a retry isn't short-circuited by it", async () => {
    const failed = loadStylesheet(URL);
    pendingLink().dispatchEvent(new Event("error"));
    await expect(failed).rejects.toThrow();

    expect(document.head.querySelectorAll(`link[${LINK_ATTR}]`)).toHaveLength(0);

    // The retry gets a real, fresh attempt.
    const retry = loadStylesheet(URL);
    expect(pendingLink()).toBeTruthy();
    pendingLink().dispatchEvent(new Event("load"));
    await expect(retry).resolves.toBeUndefined();
  });

  it("reuses an existing tag rather than duplicating it on remount", async () => {
    const first = loadStylesheet(URL);
    pendingLink().dispatchEvent(new Event("load"));
    await first;

    await expect(loadStylesheet(URL)).resolves.toBeUndefined();
    expect(document.head.querySelectorAll(`link[${LINK_ATTR}]`)).toHaveLength(1);
  });

  it("keeps separate tags for different families", async () => {
    const other = URL.replace("Lora", "Inter");
    const a = loadStylesheet(URL);
    const b = loadStylesheet(other);
    document.head
      .querySelectorAll(`link[${LINK_ATTR}]`)
      .forEach((el) => el.dispatchEvent(new Event("load")));
    await Promise.all([a, b]);

    expect(document.head.querySelectorAll(`link[${LINK_ATTR}]`)).toHaveLength(2);
  });
});

describe("loadFaces", () => {
  it("asks the font engine for every weight the family declares", async () => {
    const load = vi.fn().mockResolvedValue([]);
    vi.stubGlobal("document", Object.assign(document, { fonts: { load } }));

    await loadFaces(LORA);

    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalledWith('400 16px "Lora"');
    expect(load).toHaveBeenCalledWith('700 16px "Lora"');
  });

  it("falls back to regular for a family that declares no weights", async () => {
    const load = vi.fn().mockResolvedValue([]);
    vi.stubGlobal("document", Object.assign(document, { fonts: { load } }));

    await loadFaces({ ...LORA, weights: [] });

    expect(load).toHaveBeenCalledWith('400 16px "Lora"');
  });

  it("resolves quietly where the Font Loading API doesn't exist", async () => {
    const original = Object.getOwnPropertyDescriptor(document, "fonts");
    // @ts-expect-error — deleting an optional DOM API to model an old engine.
    delete document.fonts;
    try {
      await expect(loadFaces(LORA)).resolves.toBeUndefined();
    } finally {
      if (original) Object.defineProperty(document, "fonts", original);
    }
  });
});
