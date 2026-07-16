import { createFontLoader, type FontLoader } from "./loader";
import type { FontFamily } from "./types";

const LINK_ATTR = "data-typematch-font";

/**
 * Append a Google Fonts stylesheet and resolve when the browser has fetched it.
 * Reuses an existing tag for the same URL so a remount can't duplicate links.
 */
function loadStylesheet(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLLinkElement>(
      `link[${LINK_ATTR}][href="${CSS.escape(url)}"]`,
    );
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute(LINK_ATTR, "");
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener(
      "error",
      () => {
        // Drop the dead tag so a retry isn't short-circuited by the lookup above.
        link.remove();
        reject(new Error(`Could not fetch the font stylesheet (${url})`));
      },
      { once: true },
    );
    document.head.appendChild(link);
  });
}

/**
 * Force the faces themselves to download. The stylesheet only declares
 * @font-face rules; without this the family is "available" but not yet
 * painted, which is exactly the fallback flash the preview must avoid.
 */
async function loadFaces(font: FontFamily): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const weights = font.weights.length > 0 ? font.weights : [400];
  await Promise.all(weights.map((weight) => document.fonts.load(`${weight} 16px "${font.family}"`)));
}

/** The app-wide loader. One cache per session, as story 1.3 requires. */
export const browserFontLoader: FontLoader = createFontLoader({ loadStylesheet, loadFaces });
