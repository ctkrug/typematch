import type { FontFamily } from "./types";

/** Build the keyless Google Fonts CSS2 URL for a family's weights. */
export function buildFontCssUrl(font: FontFamily): string {
  const weights = [...new Set(font.weights)].sort((a, b) => a - b);
  const family = font.family.trim().replace(/\s+/g, "+");
  const spec = weights.length > 0 ? `${family}:wght@${weights.join(";")}` : family;
  // `display=swap` renders the fallback immediately; we still gate the visual
  // swap on the load promise, so the user never sees the fallback flash.
  return `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
}

export type FontLoadStatus = "loaded" | "error";

export interface FontLoadResult {
  family: string;
  status: FontLoadStatus;
  /** Human-readable reason, present only when status is "error". */
  error?: string;
}

export interface FontLoaderDeps {
  /** Attach the stylesheet; resolves once the CSS itself is fetched. */
  loadStylesheet: (url: string) => Promise<void>;
  /** Force the actual font faces to download and resolve when they're usable. */
  loadFaces: (font: FontFamily) => Promise<void>;
  /** Milliseconds before a load is treated as failed. */
  timeoutMs?: number;
}

export interface FontLoader {
  /** Load a family once per session; repeat calls reuse the in-flight or settled result. */
  load: (font: FontFamily) => Promise<FontLoadResult>;
  /** Families that have loaded successfully this session. */
  loaded: () => string[];
}

const DEFAULT_TIMEOUT_MS = 6000;

/** Reject after `ms`, clearing the timer once the race settles either way. */
function withTimeout<T>(work: Promise<T>, ms: number, family: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out loading "${family}" after ${ms}ms`)), ms);
  });
  return Promise.race([work, expiry]).finally(() => clearTimeout(timer));
}

export function createFontLoader(deps: FontLoaderDeps): FontLoader {
  const { loadStylesheet, loadFaces, timeoutMs = DEFAULT_TIMEOUT_MS } = deps;
  const cache = new Map<string, Promise<FontLoadResult>>();
  const succeeded = new Set<string>();

  async function loadOnce(font: FontFamily): Promise<FontLoadResult> {
    try {
      const work = (async () => {
        await loadStylesheet(buildFontCssUrl(font));
        await loadFaces(font);
      })();
      await withTimeout(work, timeoutMs, font.family);
      succeeded.add(font.family);
      return { family: font.family, status: "loaded" };
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : String(cause);
      // Drop failures from the cache so a later retry can recover from a
      // transient network blip; successes stay cached for the session.
      cache.delete(font.family);
      return { family: font.family, status: "error", error };
    }
  }

  return {
    load(font) {
      const cached = cache.get(font.family);
      if (cached) return cached;
      const pending = loadOnce(font);
      cache.set(font.family, pending);
      return pending;
    },
    loaded() {
      return [...succeeded];
    },
  };
}
