import { findFamily } from "../fonts/catalog";
import type { FontFamily } from "../fonts/types";
import { isTheme, type Theme } from "../preview/theme";

export interface Pairing {
  display: FontFamily;
  ui: FontFamily;
  theme: Theme;
}

export const DEFAULT_PAIRING: Pairing = {
  display: findFamily("Fraunces")!,
  ui: findFamily("Inter")!,
  theme: "light",
};

const PARAM = { display: "display", ui: "ui", theme: "theme" } as const;

/** Encode a pairing as a query string (no leading "?"). */
export function encodePairing(pairing: Pairing): string {
  const params = new URLSearchParams();
  params.set(PARAM.display, pairing.display.family);
  params.set(PARAM.ui, pairing.ui.family);
  params.set(PARAM.theme, pairing.theme);
  return params.toString();
}

/**
 * Restore a pairing from a query string, falling back per-field.
 *
 * A shared link is untrusted input: unknown families, a bogus theme, or junk
 * params must land on the default rather than throwing. Each field falls back
 * independently, so one bad param doesn't discard a perfectly good other one.
 */
export function decodePairing(search: string, fallback: Pairing = DEFAULT_PAIRING): Pairing {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  const display = findFamily(params.get(PARAM.display) ?? "") ?? fallback.display;
  const ui = findFamily(params.get(PARAM.ui) ?? "") ?? fallback.ui;
  const themeParam = params.get(PARAM.theme);
  const theme = isTheme(themeParam) ? themeParam : fallback.theme;

  return { display, ui, theme };
}

/** The full shareable URL for a pairing, preserving the app's own path. */
export function pairingUrl(pairing: Pairing, base: string): string {
  const url = new URL(base);
  url.search = encodePairing(pairing);
  url.hash = "";
  return url.toString();
}
