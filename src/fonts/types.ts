export type FontCategory = "serif" | "sans-serif" | "display" | "handwriting" | "monospace";

export interface FontFamily {
  /** Google Fonts family name, exactly as the CSS API expects it. */
  family: string;
  category: FontCategory;
  /** Numeric weights the family offers, ascending. */
  weights: number[];
}

/** The CSS generic that a family falls back to while it loads or if it fails. */
export const FALLBACK_STACK: Record<FontCategory, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  "sans-serif": '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  display: 'Georgia, "Times New Roman", serif',
  handwriting: '"Segoe Script", "Brush Script MT", cursive',
  monospace: '"SF Mono", Menlo, Consolas, monospace',
};
