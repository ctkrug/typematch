import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PairingScore, ScoreFactor } from "../scoring/score";
import { ScorePanel } from "./ScorePanel";

/**
 * The panel is driven entirely by a PairingScore, so it's built here by hand.
 * That's deliberate: jsdom exposes no glyph metrics, so driving it through the
 * real app only ever renders the contrast-only path — the full breakdown, the
 * one users actually come for, would go untested.
 */
function factor(overrides: Partial<ScoreFactor> = {}): ScoreFactor {
  return {
    id: "contrast",
    label: "Text contrast",
    score: 90,
    level: "good",
    readout: "8.20:1 · AAA",
    verdict: "Clears WCAG AAA — comfortable at any size.",
    ...overrides,
  };
}

function score(overrides: Partial<PairingScore> = {}): PairingScore {
  return {
    overall: 82,
    level: "good",
    measured: true,
    factors: [
      factor(),
      factor({ id: "legibility", label: "Body legibility", score: 74, level: "fair" }),
      factor({ id: "distinction", label: "Pairing contrast", score: 55, level: "poor" }),
    ],
    ...overrides,
  };
}

describe("ScorePanel", () => {
  it("leads with the overall number", () => {
    render(<ScorePanel score={score({ overall: 82 })} />);
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
  });

  it("renders every factor with a labelled meter and a plain-language verdict", () => {
    render(<ScorePanel score={score()} />);

    const meters = screen.getAllByRole("meter");
    expect(meters).toHaveLength(3);
    expect(screen.getByRole("meter", { name: "Body legibility" })).toHaveAttribute(
      "aria-valuenow",
      "74",
    );
    expect(screen.getByRole("meter", { name: "Pairing contrast" })).toHaveAttribute(
      "aria-valuenow",
      "55",
    );
    expect(screen.getAllByText(/clears wcag aaa/i).length).toBeGreaterThan(0);
  });

  // Story 2.2: a low score must be *flagged*, not merely small.
  it("flags a sub-threshold score as a warning, not just a low number", () => {
    const { container } = render(<ScorePanel score={score({ overall: 41, level: "poor" })} />);

    // Both a word and a mark: color alone would fail the a11y bar.
    expect(container.querySelector(".score__caption")).toHaveTextContent(/needs work/i);
    expect(container.querySelector(".score__warn-icon")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Readability score 41 out of 100");
    expect(screen.getByRole("status")).toHaveTextContent(/needs work/i);
  });

  it("calls a passing score passing", () => {
    render(<ScorePanel score={score({ overall: 82, level: "good" })} />);

    expect(screen.getByText(/solid pairing/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/passing/i);
    expect(screen.queryByText(/needs work/i)).not.toBeInTheDocument();
  });

  it("announces the score in a live region so it isn't visual-only", () => {
    render(<ScorePanel score={score({ overall: 82 })} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  // The panel must never imply a measurement it didn't take.
  it("says so when only contrast could be measured", () => {
    render(<ScorePanel score={score({ measured: false, factors: [factor()] })} />);
    expect(screen.getByText(/only contrast could be measured/i)).toBeInTheDocument();
  });

  it("stays quiet about measurement when everything was measured", () => {
    render(<ScorePanel score={score({ measured: true })} />);
    expect(screen.queryByText(/only contrast could be measured/i)).not.toBeInTheDocument();
  });

  it("degrades to a designed empty state when there's no score at all", () => {
    render(<ScorePanel score={null} />);

    expect(screen.getByLabelText(/readability score/i)).toBeInTheDocument();
    expect(screen.getByText(/score unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  });

  // The ring is decorative; the number beside it is the accessible answer.
  it("keeps the ring sweep inside the track for an out-of-range score", () => {
    const { container } = render(<ScorePanel score={score({ overall: 140 })} />);
    const fill = container.querySelector(".score__ring-fill")!;
    const [filled] = fill.getAttribute("stroke-dasharray")!.split(" ").map(Number);

    expect(filled).toBeLessThanOrEqual(2 * Math.PI * 26);
    expect(filled).toBeGreaterThanOrEqual(0);
  });
});
