import { contrastRatio, parseHex, wcagLevel, type WcagLevel } from "./contrast";
import type { FontMetrics } from "./metrics";
import type { FontCategory } from "../fonts/types";

export type FactorLevel = "good" | "fair" | "poor";

export interface ScoreFactor {
  id: "contrast" | "legibility" | "distinction";
  label: string;
  /** 0–100 sub-score. */
  score: number;
  level: FactorLevel;
  /** The measured value, pre-formatted for display (e.g. "8.2:1"). */
  readout: string;
  /** Plain-language verdict — the thing a designer actually reads. */
  verdict: string;
}

export interface PairingScore {
  /** 0–100 weighted overall. */
  overall: number;
  level: FactorLevel;
  factors: ScoreFactor[];
  /**
   * False when font metrics were unavailable and the score is contrast-only.
   * The UI must say so rather than implying a full measurement happened.
   */
  measured: boolean;
}

export interface ScoreInput {
  textColor: string;
  bgColor: string;
  display?: { metrics: FontMetrics | null; category: FontCategory };
  ui?: { metrics: FontMetrics | null; category: FontCategory };
}

/** Below this, the pairing is flagged as a warning rather than just a low number. */
export const WARN_THRESHOLD = 60;

const WEIGHTS = { contrast: 0.4, legibility: 0.3, distinction: 0.3 } as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation across a set of (input, output) anchor points. */
function interpolate(value: number, anchors: ReadonlyArray<readonly [number, number]>): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (value <= first[0]) return first[1];
  if (value >= last[0]) return last[1];

  for (let i = 0; i + 1 < anchors.length; i++) {
    const [x0, y0] = anchors[i];
    const [x1, y1] = anchors[i + 1];
    if (value <= x1) return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
  }
  return last[1];
}

function levelOf(score: number): FactorLevel {
  if (score >= 75) return "good";
  if (score >= WARN_THRESHOLD) return "fair";
  return "poor";
}

/**
 * Map a WCAG contrast ratio onto 0–100, anchored on the levels that actually
 * matter: 3:1 (large-text AA) is a bare 50, 4.5:1 (AA) is 75, 7:1 (AAA) is 90.
 * Ratios past ~12:1 stop earning credit — they're not more readable, just
 * harsher.
 */
export function contrastScore(ratio: number): number {
  return clamp(
    interpolate(ratio, [
      [1, 0],
      [3, 50],
      [4.5, 75],
      [7, 90],
      [12, 100],
      [21, 100],
    ]),
  );
}

/**
 * Score body legibility from the UI font's x-height ratio (x-height ÷
 * cap-height) — the best single proxy for how large text *looks* at a given
 * px size. Faces in the 0.68–0.80 band read comfortably at 13–15px; below
 * that, body copy and form labels feel undersized however big you set them.
 */
export function legibilityScore(xHeightRatio: number): number {
  const [low, high] = [0.68, 0.8];
  if (xHeightRatio >= low && xHeightRatio <= high) return 100;
  const distance = xHeightRatio < low ? low - xHeightRatio : xHeightRatio - high;
  return clamp(100 - distance * 500);
}

/**
 * Score how distinguishable the two faces are.
 *
 * A pairing needs visible hierarchy: two faces with near-identical metrics
 * and the same category don't read as "harmonious", they read as a mistake —
 * the display font looks like the body font failed to load. Differing
 * categories buy a baseline of distinction because serif-vs-sans is legible
 * even when the metrics match.
 */
export function distinctionScore(
  display: { metrics: FontMetrics; category: FontCategory },
  ui: { metrics: FontMetrics; category: FontCategory },
): number {
  const xHeightDelta = Math.abs(display.metrics.xHeightRatio - ui.metrics.xHeightRatio);
  const widthDelta = Math.abs(display.metrics.avgCharWidth - ui.metrics.avgCharWidth);
  const categoryBonus = display.category === ui.category ? 0 : 0.12;

  const raw = xHeightDelta * 2.5 + widthDelta * 5 + categoryBonus;
  // 0.22 of accumulated difference is "clearly two different faces".
  return clamp((raw / 0.22) * 100);
}

function contrastFactor(ratio: number): ScoreFactor {
  const score = contrastScore(ratio);
  const level: WcagLevel = wcagLevel(ratio);
  const verdict =
    level === "Fail"
      ? "Body text fails WCAG AA. Users will strain to read this."
      : level === "AA Large"
        ? "Passes only for large text. Labels and fine print will suffer."
        : level === "AA"
          ? "Clears WCAG AA for body text."
          : "Clears WCAG AAA — comfortable at any size.";

  return {
    id: "contrast",
    label: "Text contrast",
    score,
    level: levelOf(score),
    readout: `${ratio.toFixed(2)}:1 · ${level}`,
    verdict,
  };
}

function legibilityFactor(metrics: FontMetrics): ScoreFactor {
  const score = legibilityScore(metrics.xHeightRatio);
  const verdict =
    metrics.xHeightRatio < 0.62
      ? "Low x-height — body copy and form labels will look undersized."
      : metrics.xHeightRatio < 0.68
        ? "Slightly low x-height. Consider bumping body size a step."
        : metrics.xHeightRatio > 0.8
          ? "Very tall x-height — roomy, but ascenders get cramped."
          : "Comfortable x-height for UI text.";

  return {
    id: "legibility",
    label: "Body legibility",
    score,
    level: levelOf(score),
    readout: `x-height ${(metrics.xHeightRatio * 100).toFixed(0)}% of cap`,
    verdict,
  };
}

function distinctionFactor(
  display: { metrics: FontMetrics; category: FontCategory },
  ui: { metrics: FontMetrics; category: FontCategory },
): ScoreFactor {
  const score = distinctionScore(display, ui);
  const verdict =
    score < 40
      ? "These two faces are near-identical — the pairing reads as an accident."
      : score < WARN_THRESHOLD
        ? "Subtle difference. Headings may not separate from body copy."
        : score < 85
          ? "Clear hierarchy between display and body."
          : "Strong, unmistakable contrast between the two faces.";

  return {
    id: "distinction",
    label: "Pairing contrast",
    score,
    level: levelOf(score),
    readout:
      display.category === ui.category
        ? `both ${display.category}`
        : `${display.category} + ${ui.category}`,
    verdict,
  };
}

/**
 * Score a pairing from measured metrics plus WCAG contrast math.
 *
 * The weighting is a deliberate heuristic, not a standard: contrast is the
 * only factor with an objective pass/fail (WCAG), so it carries the most
 * weight, while legibility and distinction encode what the mock UI is built
 * to expose. When metrics are unmeasurable the score falls back to
 * contrast-only and reports `measured: false` rather than inventing numbers.
 */
export function scorePairing(input: ScoreInput): PairingScore | null {
  const text = parseHex(input.textColor);
  const bg = parseHex(input.bgColor);
  if (!text || !bg) return null;

  const ratio = contrastRatio(text, bg);
  const factors: ScoreFactor[] = [contrastFactor(ratio)];

  const display = input.display;
  const ui = input.ui;
  const measured = Boolean(display?.metrics && ui?.metrics);

  if (measured) {
    const displayMeasured = { metrics: display!.metrics!, category: display!.category };
    const uiMeasured = { metrics: ui!.metrics!, category: ui!.category };
    factors.push(legibilityFactor(uiMeasured.metrics));
    factors.push(distinctionFactor(displayMeasured, uiMeasured));
  }

  const weighted = measured
    ? factors.reduce((sum, factor) => sum + factor.score * WEIGHTS[factor.id], 0)
    : factors[0].score;

  // A weighted average lets one real defect hide behind two good factors —
  // text that fails WCAG would still score "fair" on the strength of a nice
  // x-height. Any poor factor therefore caps the overall below the warning
  // threshold: the pairing has a defect, and the number has to say so.
  const capped = factors.some((factor) => factor.level === "poor")
    ? Math.min(weighted, WARN_THRESHOLD - 1)
    : weighted;

  const rounded = Math.round(capped);
  return { overall: rounded, level: levelOf(rounded), factors, measured };
}
