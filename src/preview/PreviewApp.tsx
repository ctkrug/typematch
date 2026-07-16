import type { CSSProperties } from "react";
import { Hero } from "./Hero";
import { NavBar } from "./NavBar";
import { PricingCards } from "./PricingCards";
import { SignupForm } from "./SignupForm";
import { paletteFor, type Theme } from "./theme";
import "./preview.css";

export interface PreviewAppProps {
  /** CSS font-family value for headings and the mock wordmark. */
  displayStack: string;
  /** CSS font-family value for body copy, labels, and controls. */
  uiStack: string;
  theme: Theme;
}

/**
 * The whole point of Typematch: an entire fake product — nav, hero, pricing,
 * signup form — rendered in the selected pairing.
 *
 * Fonts and palette are pushed down as CSS custom properties on one wrapper
 * rather than threaded through every child. That keeps the swap to a single
 * style write on one element, so re-rendering the mock in a new pairing costs
 * no React reconciliation of the subtree and lands well inside the 300ms
 * budget from story 1.1.
 */
export function PreviewApp({ displayStack, uiStack, theme }: PreviewAppProps) {
  const palette = paletteFor(theme);

  const style = {
    "--preview-display": displayStack,
    "--preview-ui": uiStack,
    "--preview-bg": palette.bg,
    "--preview-surface": palette.surface,
    "--preview-surface-alt": palette.surfaceAlt,
    "--preview-border": palette.border,
    "--preview-text": palette.text,
    "--preview-muted": palette.muted,
    "--preview-accent": palette.accent,
    "--preview-on-accent": palette.onAccent,
  } as CSSProperties;

  return (
    <div className="preview" style={style} data-theme={theme} data-testid="preview">
      <div className="preview__page">
        <NavBar />
        <Hero />
        <PricingCards />
        <SignupForm />
      </div>
    </div>
  );
}
