export interface GlyphBox {
  width: number;
  /** Distance from the baseline to the top of the inked glyph, in px. */
  ascent: number;
}

/** Measure a string in a given CSS font. Returns null if measurement is unavailable. */
export type MeasureText = (text: string, cssFont: string) => GlyphBox | null;

export interface FontMetrics {
  /** x-height as a fraction of the em (typically ~0.44–0.56). */
  xHeight: number;
  /** Cap-height as a fraction of the em (typically ~0.66–0.75). */
  capHeight: number;
  /** Mean advance width of a lowercase alphabet, as a fraction of the em. */
  avgCharWidth: number;
  /** x-height ÷ cap-height. The single best proxy for apparent text size. */
  xHeightRatio: number;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/**
 * A canvas-backed measurer, or null where canvas text metrics don't exist
 * (jsdom, very old browsers). Callers must handle null — the score degrades
 * to contrast-only rather than the app breaking.
 */
export function createCanvasMeasurer(): MeasureText | null {
  if (typeof document === "undefined") return null;

  const context = document.createElement("canvas").getContext("2d");
  if (!context || typeof context.measureText !== "function") return null;

  return (text, cssFont) => {
    context.font = cssFont;
    const metrics = context.measureText(text);
    // jsdom's stub returns a TextMetrics with only `width`; a real engine
    // fills in the bounding box. Treat a missing box as unmeasurable rather
    // than silently scoring against undefined.
    if (typeof metrics.actualBoundingBoxAscent !== "number") return null;
    return { width: metrics.width, ascent: metrics.actualBoundingBoxAscent };
  };
}

/**
 * Measure a font's real rendered metrics, normalized to the em.
 *
 * Measures at a large size (200px by default) because the bounding box is
 * reported in integer-ish device units — at 16px, an x-height of 7 vs 8px is
 * a 14% error, which is larger than the differences between the fonts we're
 * trying to distinguish.
 *
 * Returns null if the font can't be measured, which the caller must treat as
 * "unknown", never as zero.
 */
export function measureFontMetrics(
  stack: string,
  measure: MeasureText,
  sizePx = 200,
): FontMetrics | null {
  if (!Number.isFinite(sizePx) || sizePx <= 0) return null;

  const font = (text: string) => measure(text, `${sizePx}px ${stack}`);

  const x = font("x");
  const cap = font("H");
  const alphabet = font(ALPHABET);
  if (!x || !cap || !alphabet) return null;
  if (x.ascent <= 0 || cap.ascent <= 0 || alphabet.width <= 0) return null;

  const xHeight = x.ascent / sizePx;
  const capHeight = cap.ascent / sizePx;

  return {
    xHeight,
    capHeight,
    avgCharWidth: alphabet.width / ALPHABET.length / sizePx,
    xHeightRatio: xHeight / capHeight,
  };
}
