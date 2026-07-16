# Typematch — Design

## Aesthetic direction

**Editorial serif.** Typematch is a typography tool, so the chrome itself should read like a
well-set page, not a SaaS dashboard: warm paper background, ink-black text, a single terracotta
accent, generous margins, and a serif display face doing the talking. Think a well-typeset
magazine spread, not a dark "developer tool" console — nothing else in the recent portfolio has
used a warm/paper palette or a serif-led direction, so this also keeps the shipped set varied.

## Tokens

| Token                         | Value                                                         | Use                                             |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `--color-bg`                  | `#FAF6EC`                                                     | page background (warm paper)                    |
| `--color-surface-1`           | `#F0E7D5`                                                     | cards, panels                                   |
| `--color-surface-2`           | `#E4D6B8`                                                     | nested surfaces, hover fill                     |
| `--color-text`                | `#221B12`                                                     | ink — primary text                              |
| `--color-text-muted`          | `#6F6552`                                                     | secondary text, captions                        |
| `--color-accent`              | `#C1502E`                                                     | terracotta — primary actions, links, focus ring |
| `--color-accent-support`      | `#2E5940`                                                     | forest green — secondary accent, badges         |
| `--color-success`             | `#2E5940`                                                     | success states (shares support accent)          |
| `--color-danger`              | `#A61C1C`                                                     | errors, invalid states                          |
| `--font-display`              | `"Fraunces", Georgia, "Times New Roman", serif`               | wordmark, headings                              |
| `--font-ui`                   | `"Inter", -apple-system, "Segoe UI", sans-serif`              | body, controls, labels                          |
| `--space-1..8`                | `4, 8, 12, 16, 24, 32, 48, 64px`                              | 4/8px spacing scale                             |
| `--radius-sm` / `--radius-md` | `4px` / `8px`                                                 | crisp, print-like corners — never pill-shaped   |
| `--shadow-card`               | `0 1px 2px rgba(34,27,18,.08), 0 8px 24px rgba(34,27,18,.10)` | lifted-off-the-page depth                       |
| `--motion-ui`                 | `160ms ease-out`                                              | hover/focus/panel transitions                   |
| `--motion-feedback`           | `90ms ease-out`                                               | button press, toggle flip                       |

Both fonts are loaded once for the app chrome itself (self-hosted via `@fontsource` or Google
Fonts CDN) — independent of whatever pairing the user is previewing inside the fake UI.

## Layout intent

- **Hero = the fake app UI preview.** A control rail (two font pickers + score readout) sits
  above the preview on all sizes; the preview itself — nav bar, hero, pricing card, signup
  form — fills the remaining viewport (~65%+ on desktop, full width on phone) inside a "page"
  surface with a visible paper-card edge (`--shadow-card`, `--radius-md`), so it reads as a
  distinct product mock rather than blending into the tool's own chrome.
- **Desktop (1440×900):** control rail as a slim horizontal strip (wordmark + two font-search
  fields + theme toggle) at the top; below it a two-column body — preview at `minmax(0, 1fr)`
  taking `min-height: 70vh`, and a 340px sticky side column holding the score, the share
  control, and saved pairings. The whole shell is capped at `max-width: 1440px` so the paper
  background still frames the content rather than leaving dead space.
- **Phone (390×844):** rail stacks vertically (pickers full-width, toggle below); the side
  column drops beneath the preview and reflows to auto-fit columns. Preview scrolls vertically
  through nav → hero → pricing → form.
- No horizontal scroll at any breakpoint; text measures in the preview's form/paragraph content
  stay ≤ 70ch.

> **Changed 2026-07-16 (BUILD):** the original intent put a *score chip* in the top rail. Once
> the score grew a real breakdown — three factors, each with a meter and a plain-language
> verdict — a chip couldn't hold it without either truncating the verdicts (which are the useful
> part; a bare "62" tells a designer nothing) or pushing the rail past 200px and eating the
> preview's viewport. The score moved to a sticky side column, which also gives the favorites
> list and share control a home. The preview keeps ~65%+ of the desktop viewport either way, so
> the hero intent above is unchanged.

## Signature detail

**The wordmark IS the demo.** "Typematch" in the header is set with the first word rendered in
the user's chosen **display** font and the second half in their chosen **UI** font, live —
swapping either font pairing updates the logotype itself before the user even looks at the
preview below. Zero extra UI needed; the product's core value is visible in the brand mark.

## Motion

- Font swaps cross-fade the preview text (`--motion-ui`) instead of a hard flash-of-fallback —
  fonts are preloaded before the swap commits.
- Buttons/inputs use `--motion-feedback` for press/depress; panels and score updates use
  `--motion-ui`.
- `prefers-reduced-motion` disables the cross-fade and any score-counter animation, swapping
  instantly instead.
