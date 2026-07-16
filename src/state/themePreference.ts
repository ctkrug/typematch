import { isTheme, type Theme } from "../preview/theme";
import type { KeyValueStore } from "./favorites";

export const THEME_KEY = "typematch:preview-theme";

/** Read the saved preview theme, or null if none is stored or it's junk. */
export function loadThemePreference(store: KeyValueStore | null): Theme | null {
  if (!store) return null;
  try {
    const value = store.getItem(THEME_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persist the preview theme. Failures are silent — it's only a preference. */
export function saveThemePreference(store: KeyValueStore | null, theme: Theme): void {
  if (!store) return;
  try {
    store.setItem(THEME_KEY, theme);
  } catch {
    // Storage full or blocked. Losing a theme preference isn't worth an error
    // state in the UI; the theme still applies for this session.
  }
}

/**
 * Decide the preview theme at startup.
 *
 * A theme in the URL wins: it came from a shared link, and the sender chose it
 * deliberately for the pairing they're showing. Only when the link is silent
 * does the visitor's own saved preference apply.
 */
export function resolveInitialTheme(
  urlTheme: string | null,
  stored: Theme | null,
  fallback: Theme = "light",
): Theme {
  if (isTheme(urlTheme)) return urlTheme;
  return stored ?? fallback;
}
