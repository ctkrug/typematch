import { FONT_CATALOG } from "./catalog";
import type { FontFamily } from "./types";

export interface SearchOptions {
  /** Max results to return. Must be >= 0. Defaults to 12. */
  limit?: number;
  /** Restrict results to one category. */
  category?: FontFamily["category"];
  /** Search this list instead of the vendored catalog (used by tests). */
  catalog?: readonly FontFamily[];
}

const DEFAULT_LIMIT = 12;

/**
 * Rank buckets, lowest sorts first: an exact name beats a prefix hit, which
 * beats a hit anywhere in the name. Without this, searching "Inter" buries
 * Inter under "Instrument Serif" and every other substring match.
 */
function rank(family: string, needle: string): number {
  const name = family.toLowerCase();
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  return 2;
}

/**
 * Filter families by case-insensitive substring match on the family name.
 *
 * An empty or whitespace-only query is not an error — it returns the head of
 * the catalog, so a freshly-focused picker shows suggestions instead of a
 * blank list.
 */
export function searchFamilies(query: string, options: SearchOptions = {}): FontFamily[] {
  const { limit = DEFAULT_LIMIT, category, catalog = FONT_CATALOG } = options;
  if (!Number.isFinite(limit) || limit <= 0) return [];

  const pool = category ? catalog.filter((f) => f.category === category) : catalog;
  const needle = query.trim().toLowerCase();
  if (needle === "") return pool.slice(0, limit);

  return pool
    .filter((f) => f.family.toLowerCase().includes(needle))
    .sort((a, b) => rank(a.family, needle) - rank(b.family, needle))
    .slice(0, limit);
}
