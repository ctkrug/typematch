import { createContext, useContext } from "react";
import { browserFontLoader } from "./browserLoader";
import type { FontLoader } from "./loader";

/**
 * The loader the app pulls fonts through.
 *
 * Defaults to the real browser loader; exists so tests (and any future
 * offline/self-hosted mode) can supply their own without every component
 * threading a loader prop down from the root.
 */
const FontLoaderContext = createContext<FontLoader>(browserFontLoader);

export const FontLoaderProvider = FontLoaderContext.Provider;

export function useFontLoader(): FontLoader {
  return useContext(FontLoaderContext);
}
