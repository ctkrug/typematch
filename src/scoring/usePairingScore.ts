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
   * Bump this when the underlying faces change identity, so the memo
   * re-measures. Two different families can share a stack string only if one
   * failed to load, but the fallback *is* a different rendering — the score
   * must reflect what's actually painted.
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
    // `revision` is a deliberate dependency: see the doc comment above.
  }, [displayStack, uiStack, displayCategory, uiCategory, theme, measurer, revision]);
}
