import { FALLBACK_STACK, type FontFamily } from "./types";

/**
 * The CSS `font-family` value for a family: the family itself, then the
 * system stack for its category. Family names are quoted so multi-word and
 * numeric-leading names ("Exo 2") parse correctly.
 */
export function fontStack(font: FontFamily): string {
  return `"${font.family}", ${FALLBACK_STACK[font.category]}`;
}

/**
 * The stack to use when a family failed to load: its category's system
 * fallback only. Keeps the preview readable and roughly the right flavor
 * instead of dropping to the browser default.
 */
export function fallbackStack(font: FontFamily): string {
  return FALLBACK_STACK[font.category];
}
