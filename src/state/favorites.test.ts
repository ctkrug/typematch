import { describe, expect, it } from "vitest";
import { findFamily } from "../fonts/catalog";
import {
  FAVORITES_KEY,
  MAX_FAVORITES,
  addFavorite,
  favoriteId,
  isFavorite,
  loadFavorites,
  removeFavorite,
  safeLocalStorage,
  commitFavorites,
  saveFavorites,
  type KeyValueStore,
} from "./favorites";
import type { Pairing } from "./pairingUrl";

function pairing(display: string, ui: string, theme: "light" | "dark" = "light"): Pairing {
  return { display: findFamily(display)!, ui: findFamily(ui)!, theme };
}

const A = pairing("Fraunces", "Inter");
const B = pairing("Playfair Display", "Work Sans", "dark");

/** An in-memory store; `fail` makes every write throw, like a full quota. */
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

describe("favoriteId", () => {
  it("is stable for the same pairing", () => {
    expect(favoriteId(A)).toBe(favoriteId(pairing("Fraunces", "Inter")));
  });

  it("distinguishes slot order — display/ui swapped is a different pairing", () => {
    expect(favoriteId(pairing("Lora", "Inter"))).not.toBe(favoriteId(pairing("Inter", "Lora")));
  });

  it("distinguishes theme", () => {
    expect(favoriteId(pairing("Lora", "Inter", "light"))).not.toBe(
      favoriteId(pairing("Lora", "Inter", "dark")),
    );
  });
});

describe("addFavorite", () => {
  it("adds newest first", () => {
    expect(addFavorite([A], B)).toEqual([B, A]);
  });

  it("ignores an exact duplicate", () => {
    expect(addFavorite([A], pairing("Fraunces", "Inter"))).toEqual([A]);
  });

  it("does not mutate the input list", () => {
    const list = [A];
    addFavorite(list, B);
    expect(list).toEqual([A]);
  });

  it("caps the list, dropping the oldest", () => {
    let list: Pairing[] = [];
    for (let i = 0; i < MAX_FAVORITES + 5; i++) {
      // Distinct pairings, so none of them dedupe away.
      const ui = i % 2 === 0 ? "Inter" : "Work Sans";
      list = addFavorite(list, {
        ...pairing("Fraunces", ui),
        theme: i % 3 === 0 ? "dark" : "light",
      });
    }
    expect(list.length).toBeLessThanOrEqual(MAX_FAVORITES);
  });
});

describe("removeFavorite", () => {
  it("removes by identity", () => {
    expect(removeFavorite([B, A], pairing("Fraunces", "Inter"))).toEqual([B]);
  });

  it("is a no-op for a pairing that isn't saved", () => {
    expect(removeFavorite([A], B)).toEqual([A]);
  });

  it("handles an empty list", () => {
    expect(removeFavorite([], A)).toEqual([]);
  });
});

describe("isFavorite", () => {
  it("recognizes a saved pairing regardless of object identity", () => {
    expect(isFavorite([A], pairing("Fraunces", "Inter"))).toBe(true);
    expect(isFavorite([A], B)).toBe(false);
    expect(isFavorite([], A)).toBe(false);
  });
});

describe("saveFavorites / loadFavorites", () => {
  it("round-trips a list through storage", () => {
    const store = memoryStore();
    expect(saveFavorites(store, [B, A])).toBe(true);
    expect(loadFavorites(store)).toEqual([B, A]);
  });

  it("survives a full reload — the point of persisting at all", () => {
    const store = memoryStore();
    saveFavorites(store, [A]);
    const reloaded = memoryStore({ [FAVORITES_KEY]: store.getItem(FAVORITES_KEY)! });
    expect(loadFavorites(reloaded)).toEqual([A]);
  });

  it("stores family names, not whole font objects", () => {
    const store = memoryStore();
    saveFavorites(store, [A]);
    expect(JSON.parse(store.getItem(FAVORITES_KEY)!)).toEqual([
      { display: "Fraunces", ui: "Inter", theme: "light" },
    ]);
  });

  it("returns an empty list when nothing is saved", () => {
    expect(loadFavorites(memoryStore())).toEqual([]);
  });

  it("returns an empty list, not a crash, for corrupted JSON", () => {
    expect(loadFavorites(memoryStore({ [FAVORITES_KEY]: "{not json" }))).toEqual([]);
  });

  it("returns an empty list when the stored value isn't an array", () => {
    expect(loadFavorites(memoryStore({ [FAVORITES_KEY]: '{"display":"Inter"}' }))).toEqual([]);
  });

  it("skips unreadable entries instead of discarding the whole list", () => {
    const raw = JSON.stringify([
      { display: "Fraunces", ui: "Inter", theme: "light" },
      null,
      "garbage",
      { display: "A Font We Dropped", ui: "Inter", theme: "light" },
      { ui: "Inter" },
      { display: "Playfair Display", ui: "Work Sans", theme: "dark" },
    ]);
    expect(loadFavorites(memoryStore({ [FAVORITES_KEY]: raw }))).toEqual([A, B]);
  });

  it("defaults a themeless legacy record to light rather than dropping it", () => {
    const raw = JSON.stringify([{ display: "Fraunces", ui: "Inter" }]);
    expect(loadFavorites(memoryStore({ [FAVORITES_KEY]: raw }))).toEqual([A]);
  });

  it("dedupes entries that arrive duplicated in storage", () => {
    const raw = JSON.stringify([
      { display: "Fraunces", ui: "Inter", theme: "light" },
      { display: "Fraunces", ui: "Inter", theme: "light" },
    ]);
    expect(loadFavorites(memoryStore({ [FAVORITES_KEY]: raw }))).toEqual([A]);
  });

  it("caps what it reads back, however much is in storage", () => {
    const raw = JSON.stringify(
      Array.from({ length: MAX_FAVORITES + 10 }, (_, i) => ({
        display: "Fraunces",
        ui: i % 2 ? "Inter" : "Work Sans",
        theme: i % 2 ? "light" : "dark",
      })),
    );
    expect(loadFavorites(memoryStore({ [FAVORITES_KEY]: raw })).length).toBeLessThanOrEqual(
      MAX_FAVORITES,
    );
  });

  it("reports a failed write rather than pretending it saved", () => {
    expect(saveFavorites(memoryStore({}, true), [A])).toBe(false);
  });

  it("treats a missing store as empty and unsaveable", () => {
    expect(loadFavorites(null)).toEqual([]);
    expect(saveFavorites(null, [A])).toBe(false);
  });

  it("survives a store whose reads throw", () => {
    const hostile: KeyValueStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(loadFavorites(hostile)).toEqual([]);
  });
});

describe("safeLocalStorage", () => {
  it("returns a working store in a normal environment", () => {
    const store = safeLocalStorage();
    expect(store).not.toBeNull();
    expect(saveFavorites(store, [A])).toBe(true);
    expect(loadFavorites(store)).toEqual([A]);
    store!.removeItem(FAVORITES_KEY);
  });
});

/**
 * Favorites are shared mutable state: a second tab may have written since this
 * one mounted. A change must therefore be applied to what is in storage right
 * now, not to the snapshot this tab happens to be holding.
 */
describe("commitFavorites", () => {
  it("merges a save on top of what another tab already wrote", () => {
    const store = memoryStore();
    saveFavorites(store, [B]); // the other tab saved B after we mounted
    const stale: Pairing[] = []; // ...and we still believe the list is empty

    const { favorites, ok } = commitFavorites(store, stale, (current) => addFavorite(current, A));

    expect(ok).toBe(true);
    expect(favorites.map(favoriteId)).toEqual([favoriteId(A), favoriteId(B)]);
    expect(loadFavorites(store).map(favoriteId)).toContain(favoriteId(B));
  });

  it("removes against storage without resurrecting another tab's entries", () => {
    const store = memoryStore();
    saveFavorites(store, [A, B]);

    const { favorites } = commitFavorites(store, [A], (current) => removeFavorite(current, A));

    expect(favorites.map(favoriteId)).toEqual([favoriteId(B)]);
  });

  it("keeps the in-memory list when there's no store to merge against", () => {
    const { favorites, ok } = commitFavorites(null, [A], (current) => addFavorite(current, B));

    expect(ok).toBe(false);
    expect(favorites.map(favoriteId)).toEqual([favoriteId(A), favoriteId(B)]);
  });

  it("reports a failed write so the caller can say so", () => {
    const { ok } = commitFavorites(memoryStore({}, true), [], (current) => addFavorite(current, A));
    expect(ok).toBe(false);
  });
});
