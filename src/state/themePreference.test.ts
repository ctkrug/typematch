import { describe, expect, it } from "vitest";
import type { KeyValueStore } from "./favorites";
import {
  THEME_KEY,
  loadThemePreference,
  resolveInitialTheme,
  saveThemePreference,
} from "./themePreference";

function memoryStore(initial: Record<string, string> = {}, fail = false): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (fail) throw new DOMException("QuotaExceededError");
      data.set(key, value);
    },
    removeItem: (key) => void data.delete(key),
  };
}

describe("loadThemePreference / saveThemePreference", () => {
  it("round-trips a saved theme", () => {
    const store = memoryStore();
    saveThemePreference(store, "dark");
    expect(loadThemePreference(store)).toBe("dark");
  });

  it("survives a reload — the point of persisting", () => {
    const store = memoryStore();
    saveThemePreference(store, "dark");
    expect(loadThemePreference(memoryStore({ [THEME_KEY]: store.getItem(THEME_KEY)! }))).toBe(
      "dark",
    );
  });

  it("returns null when nothing is stored", () => {
    expect(loadThemePreference(memoryStore())).toBeNull();
  });

  it("returns null for a junk stored value rather than trusting it", () => {
    expect(loadThemePreference(memoryStore({ [THEME_KEY]: "neon" }))).toBeNull();
  });

  it("tolerates a missing store", () => {
    expect(loadThemePreference(null)).toBeNull();
    expect(() => saveThemePreference(null, "dark")).not.toThrow();
  });

  it("swallows a failed write — a preference isn't worth an error state", () => {
    expect(() => saveThemePreference(memoryStore({}, true), "dark")).not.toThrow();
  });

  it("tolerates a store whose reads throw", () => {
    const hostile: KeyValueStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(loadThemePreference(hostile)).toBeNull();
  });
});

describe("resolveInitialTheme", () => {
  it("prefers the URL — a shared link's theme was chosen deliberately", () => {
    expect(resolveInitialTheme("dark", "light")).toBe("dark");
    expect(resolveInitialTheme("light", "dark")).toBe("light");
  });

  it("falls back to the saved preference when the link is silent", () => {
    expect(resolveInitialTheme(null, "dark")).toBe("dark");
  });

  it("ignores a junk URL theme and uses the saved preference", () => {
    expect(resolveInitialTheme("neon", "dark")).toBe("dark");
  });

  it("lands on the default when there's neither", () => {
    expect(resolveInitialTheme(null, null)).toBe("light");
    expect(resolveInitialTheme("", null)).toBe("light");
  });
});
