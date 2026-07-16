import { useEffect, useState } from "react";
import { useFontLoader } from "./FontLoaderContext";
import type { FontLoader } from "./loader";
import { fallbackStack, fontStack } from "./stack";
import type { FontFamily } from "./types";

export interface AppliedFont {
  /** The family currently painted — not necessarily the one just selected. */
  font: FontFamily;
  /** The CSS font-family value to render with. */
  stack: string;
  /** Set when this family failed to load and `stack` is a system fallback. */
  error: string | null;
}

export interface LoadedFontState extends AppliedFont {
  /** True while a newly selected family is still downloading. */
  isLoading: boolean;
}

/**
 * Resolve a family to a paintable CSS stack, swapping only once the face is
 * actually loaded.
 *
 * The previously applied family keeps rendering while the next one downloads,
 * which is what keeps a font switch free of a flash of fallback text (story
 * 1.1). A failed load still commits — to the category's system stack plus an
 * error the UI can surface — so a dead family degrades instead of blanking.
 */
export function useLoadedFont(font: FontFamily, override?: FontLoader): LoadedFontState {
  const contextLoader = useFontLoader();
  const loader = override ?? contextLoader;

  const [applied, setApplied] = useState<AppliedFont>(() => ({
    font,
    stack: fontStack(font),
    error: null,
  }));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    loader.load(font).then((result) => {
      if (cancelled) return;
      setApplied({
        font,
        stack: result.status === "error" ? fallbackStack(font) : fontStack(font),
        error: result.status === "error" ? (result.error ?? "This font could not be loaded.") : null,
      });
      setIsLoading(false);
    });

    return () => {
      // A rapid re-selection must not let a stale load overwrite the newer one.
      cancelled = true;
    };
  }, [font, loader]);

  return { ...applied, isLoading };
}
