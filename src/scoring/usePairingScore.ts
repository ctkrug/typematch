import { useMemo } from "react";
import type { FontCategory } from "../fonts/types";
import { paletteFor, type Theme } from "../preview/theme";
import { createCanvasMeasurer, measureFontMetrics } from "./metrics";
import { scorePairing, type PairingScore } from "./score";

export interface UsePairingScoreInput {
  displayStack: string;
  uiStack: string;
  displayCategory: FontCategory;
  uiCategory: FontCategory;
  theme: Theme;
  /**
   * Changes whenever either slot commits a new render.
   *
   * Load-bearing, not decorative: the first paint applies a font's stack
   * before its face has downloaded, so measuring on stack alone scores the
   * *fallback* and never recomputes — the stack string is identical once the
   * real face arrives.
   */
  revision: string;
}

/**
 * Measure the applied pairing and score it against the preview's colors.
 *
 * Memoized on the applied stacks rather than the selected fonts: the score
 * must describe what is painted right now, so it updates when the swap
 * commits, not when the user clicks. That also keeps it inside story 2.1's
 * 300ms budget — canvas measurement is synchronous and only reruns on a real
 * change.
 */
export function usePairingScore(input: UsePairingScoreInput): PairingScore | null {
  const { displayStack, uiStack, displayCategory, uiCategory, theme, revision } = input;

  // One canvas for the app's lifetime; allocating per measurement is wasteful
  // and, in some engines, leaks until GC.
  const measurer = useMemo(() => createCanvasMeasurer(), []);

  return useMemo(() => {
    const palette = paletteFor(theme);
    const displayMetrics = measurer ? measureFontMetrics(displayStack, measurer) : null;
    const uiMetrics = measurer ? measureFontMetrics(uiStack, measurer) : null;

    return scorePairing({
      textColor: palette.text,
      bgColor: palette.bg,
      display: { metrics: displayMetrics, category: displayCategory },
      ui: { metrics: uiMetrics, category: uiCategory },
    });
    // `revision` looks unused to the lint rule, but it stands in for "the
    // painted pixels changed" — dropping it freezes the score on the fallback
    // measured at first paint. See the doc comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayStack, uiStack, displayCategory, uiCategory, theme, measurer, revision]);
}
