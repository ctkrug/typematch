export type Theme = "light" | "dark";

export const THEMES: readonly Theme[] = ["light", "dark"];

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Colors for the mock product inside the preview.
 *
 * Deliberately its own palette rather than the tool's paper-and-ink chrome:
 * the preview has to read as a believable product, and the score needs a
 * real text/background pair to judge. The terracotta accent is shared with
 * the chrome so the tool and its preview still read as one brand.
 */
export interface PreviewPalette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  /** Text placed on top of `accent` — the pair must clear WCAG AA itself. */
  onAccent: string;
}

export const PREVIEW_PALETTES: Record<Theme, PreviewPalette> = {
  light: {
    bg: "#fcfaf6",
    surface: "#fffefb",
    surfaceAlt: "#f4efe6",
    border: "#e3dbcd",
    text: "#1a1712",
    muted: "#6b6357",
    accent: "#b8492a",
    onAccent: "#fff8f2",
  },
  dark: {
    bg: "#17130e",
    surface: "#221d16",
    surfaceAlt: "#2c2620",
    border: "#3a332a",
    text: "#f4efe6",
    muted: "#a89c8a",
    accent: "#e0764f",
    onAccent: "#1a1006",
  },
};

export function paletteFor(theme: Theme): PreviewPalette {
  return PREVIEW_PALETTES[theme];
}
