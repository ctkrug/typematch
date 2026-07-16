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

// The provider and its hook belong together; splitting them across files to
// satisfy fast-refresh's one-export rule would cost more than the warning.
// eslint-disable-next-line react-refresh/only-export-components
export function useFontLoader(): FontLoader {
  return useContext(FontLoaderContext);
}
