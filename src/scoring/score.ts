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

/** A face with metrics resolved — what the factor functions actually judge. */
export interface ScoredFace {
  metrics: FontMetrics;
  category: FontCategory;
  /** Family name, used to detect the same font in both slots. */
  family?: string;
}

export interface ScoreInput {
  textColor: string;
  bgColor: string;
  display?: { metrics: FontMetrics | null; category: FontCategory; family?: string };
  ui?: { metrics: FontMetrics | null; category: FontCategory; family?: string };
}

/** Below this, the pairing is flagged as a warning rather than just a low number. */
export const WARN_THRESHOLD = 60;

const WEIGHTS = { contrast: 0.4, legibility: 0.3, distinction: 0.3 } as const;

/**
 * Constrain to a range, treating a non-finite value as the floor.
 *
 * Failing closed is deliberate: a score we can't compute must never present
 * as a good one, and NaN escapes Math.min/Math.max untouched.
 */
function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation across a set of (input, output) anchor points. */
function interpolate(value: number, anchors: ReadonlyArray<readonly [number, number]>): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  // A non-finite input matches no anchor and would fall through to the *top*
  // of the curve — a perfect score for an uninterpretable ratio.
  if (!Number.isFinite(value)) return first[1];
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
  // Asymmetric on purpose: a too-small x-height makes 13px labels genuinely
  // hard to read, while a too-large one only costs some elegance. Measured
  // reference points — Inter sits at 0.75, Cormorant Garamond at 0.63.
  const distance = xHeightRatio < low ? (low - xHeightRatio) * 700 : (xHeightRatio - high) * 400;
  return clamp(100 - distance);
}

/**
 * Point budgets for the distinction factor, summing to 100.
 *
 * Calibrated against measured Google Fonts data, not intuition. The category
 * share is large because the metrics genuinely can't see the thing that most
 * separates two faces — their skeleton. Measured: Fraunces and Inter differ by
 * 0.0015 in average character width (they are, numerically, the same width),
 * yet nobody would mistake one for the other. The saturation points are set
 * from the observed spread: x-height ratios run ~0.61–1.0 across the catalog,
 * and average widths ~0.39–0.60.
 */
const DISTINCTION = {
  /** Serif-vs-sans reads at a glance even when every metric agrees. */
  category: 55,
  xHeight: { points: 25, saturateAt: 0.15 },
  width: { points: 20, saturateAt: 0.1 },
} as const;

/**
 * Score how distinguishable the two faces are.
 *
 * A pairing needs visible hierarchy: two faces with near-identical metrics
 * and the same category don't read as "harmonious", they read as a mistake —
 * the display font looks like the body font failed to load. Differing
 * categories buy a baseline of distinction because serif-vs-sans is legible
 * even when the metrics match.
 */
export function distinctionScore(display: ScoredFace, ui: ScoredFace): number {
  // The same family twice isn't a weak pairing, it's the absence of one.
  if (display.family && display.family === ui.family) return 0;

  const category = display.category === ui.category ? 0 : DISTINCTION.category;

  // Each metric contributes a *bounded* share. Letting one saturate the whole
  // score meant two garamond-ish serifs that merely differ in x-height scored
  // as "unmistakable contrast" — a big x-height gap is a size difference, not
  // the structural difference that actually builds hierarchy.
  const xHeightDelta = Math.abs(display.metrics.xHeightRatio - ui.metrics.xHeightRatio);
  const widthDelta = Math.abs(display.metrics.avgCharWidth - ui.metrics.avgCharWidth);

  const xHeight =
    Math.min(xHeightDelta / DISTINCTION.xHeight.saturateAt, 1) * DISTINCTION.xHeight.points;
  const width = Math.min(widthDelta / DISTINCTION.width.saturateAt, 1) * DISTINCTION.width.points;

  return clamp(category + xHeight + width);
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

function distinctionFactor(display: ScoredFace, ui: ScoredFace): ScoreFactor {
  const score = distinctionScore(display, ui);
  const sameFamily = Boolean(display.family) && display.family === ui.family;

  const verdict = sameFamily
    ? "This is the same font twice — there's no pairing here to judge."
    : score < 40
      ? "Too alike to build hierarchy — headings won't separate from body copy."
      : score < WARN_THRESHOLD
        ? "Subtle difference. The hierarchy may not read at a glance."
        : score < 85
          ? "Clear hierarchy between display and body."
          : "Strong, unmistakable contrast between the two faces.";

  return {
    id: "distinction",
    label: "Pairing contrast",
    score,
    level: levelOf(score),
    readout: sameFamily
      ? "same family"
      : display.category === ui.category
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
    const displayMeasured: ScoredFace = {
      metrics: display!.metrics!,
      category: display!.category,
      family: display!.family,
    };
    const uiMeasured: ScoredFace = {
      metrics: ui!.metrics!,
      category: ui!.category,
      family: ui!.family,
    };
    factors.push(legibilityFactor(uiMeasured.metrics));
    factors.push(distinctionFactor(displayMeasured, uiMeasured));
  }

  const weighted = measured
    ? factors.reduce((sum, factor) => sum + factor.score * WEIGHTS[factor.id], 0)
    : factors[0].score;

  // A weighted average lets a real defect hide behind two good factors, so
  // some defects veto the overall instead of being averaged.
  //
  // Only *objective* ones qualify: text that fails WCAG, and the same family
  // in both slots (which isn't a weak pairing, it's the absence of one).
  // Legibility and distinction are heuristics — they steer the number through
  // their weight and state their case in the breakdown, but they don't veto.
  // An earlier version let any poor factor cap, which condemned genuinely
  // good same-category pairings like Oswald + Inter: the metrics can't see
  // the condensed skeleton that makes that hierarchy work.
  const failsContrast = wcagLevel(ratio) === "Fail";
  const sameFamily = Boolean(display?.family) && display?.family === ui?.family;
  const capped =
    failsContrast || (measured && sameFamily) ? Math.min(weighted, WARN_THRESHOLD - 1) : weighted;

  const rounded = Math.round(capped);
  return { overall: rounded, level: levelOf(rounded), factors, measured };
}
