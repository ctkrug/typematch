import { findFamily } from "../fonts/catalog";
import { isTheme } from "../preview/theme";
import type { Pairing } from "./pairingUrl";

export const FAVORITES_KEY = "typematch:favorites";
export const MAX_FAVORITES = 24;

/** Stable identity for a pairing — two saves of the same pairing are one. */
export function favoriteId(pairing: Pairing): string {
  return `${pairing.display.family}|${pairing.ui.family}|${pairing.theme}`;
}

/** Minimal storage surface, so tests don't depend on a real localStorage. */
export interface KeyValueStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/**
 * localStorage, or null where it's unavailable.
 *
 * Access itself can throw, not just fail: Safari in private mode and
 * cookie-blocked embeds throw on the property access. Favorites are a
 * convenience, so an unavailable store degrades to in-memory rather than
 * taking the app down.
 */
export function safeLocalStorage(): KeyValueStore | null {
  try {
    const probe = "__typematch_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function toPairing(value: unknown): Pairing | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  const display = typeof record.display === "string" ? findFamily(record.display) : undefined;
  const ui = typeof record.ui === "string" ? findFamily(record.ui) : undefined;
  if (!display || !ui) return null;

  // A pairing saved before the theme existed is still a valid pairing.
  const theme = isTheme(record.theme) ? record.theme : "light";
  return { display, ui, theme };
}

/**
 * Read saved favorites.
 *
 * Everything in storage is untrusted: it may be truncated, hand-edited, or
 * written by an older version whose families we've since dropped. Unreadable
 * entries are skipped individually so one bad record doesn't wipe the list.
 */
export function loadFavorites(store: KeyValueStore | null): Pairing[] {
  if (!store) return [];

  let raw: string | null;
  try {
    raw = store.getItem(FAVORITES_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const favorites: Pairing[] = [];
  for (const entry of parsed) {
    const pairing = toPairing(entry);
    if (!pairing) continue;
    const id = favoriteId(pairing);
    if (seen.has(id)) continue;
    seen.add(id);
    favorites.push(pairing);
  }
  return favorites.slice(0, MAX_FAVORITES);
}

/**
 * Persist favorites. Returns false if the write failed (quota, disabled
 * storage) so the caller can tell the user instead of silently losing it.
 */
export function saveFavorites(store: KeyValueStore | null, favorites: Pairing[]): boolean {
  if (!store) return false;
  const payload = favorites.slice(0, MAX_FAVORITES).map((pairing) => ({
    display: pairing.display.family,
    ui: pairing.ui.family,
    theme: pairing.theme,
  }));

  try {
    store.setItem(FAVORITES_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Apply a change to the stored favorites, merging against storage as it is
 * right now rather than against a caller's snapshot.
 *
 * Favorites are shared mutable state: a second tab may have saved since this
 * one read the list. Writing a mount-time snapshot back wholesale silently
 * destroys whatever the other tab added, so the read happens here, at write
 * time. `fallback` covers the no-store case, where there's nothing to merge
 * against and the in-memory list is all there is.
 */
export function commitFavorites(
  store: KeyValueStore | null,
  fallback: Pairing[],
  change: (current: Pairing[]) => Pairing[],
): { favorites: Pairing[]; ok: boolean } {
  const current = store ? loadFavorites(store) : fallback;
  const favorites = change(current);
  return { favorites, ok: saveFavorites(store, favorites) };
}

/** Add a pairing, newest first, ignoring an exact duplicate. */
export function addFavorite(favorites: Pairing[], pairing: Pairing): Pairing[] {
  const id = favoriteId(pairing);
  if (favorites.some((f) => favoriteId(f) === id)) return favorites;
  return [pairing, ...favorites].slice(0, MAX_FAVORITES);
}

/** Remove a pairing by identity. Removing an absent pairing is a no-op. */
export function removeFavorite(favorites: Pairing[], pairing: Pairing): Pairing[] {
  const id = favoriteId(pairing);
  return favorites.filter((f) => favoriteId(f) !== id);
}

export function isFavorite(favorites: Pairing[], pairing: Pairing): boolean {
  const id = favoriteId(pairing);
  return favorites.some((f) => favoriteId(f) === id);
}
