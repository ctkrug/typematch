# Typematch — Vision

## The problem

Every font-pairing tool shows the same thing: a big headline over a paragraph of lorem ipsum.
That tells a designer almost nothing about how a pairing behaves once it's doing real work —
a button label at 14px, a dense signup form, small print in a nav bar, numbers in a pricing
card. Two fonts can look great side-by-side as a headline/body pair and still fall apart the
moment they have to fill a real interface: mismatched x-heights making body copy feel cramped
next to a display face, a "body" font that turns illegible at button-label sizes, or a pairing
that reads fine in isolation but has no discernible contrast in a form's label/input hierarchy.
Designers currently have to paste fonts into a real mockup (or a real product) to find this out,
which is slow enough that most people don't bother — they eyeball a specimen page and hope.

## Who it's for

Designers and front-end developers picking a type system for a real product — landing pages,
dashboards, marketing sites — who want to know how a pairing performs under actual UI density
before committing to it, not just whether it looks nice as a headline.

## The core idea

Paste (or pick) two Google Fonts — one display, one UI/body — and instead of a specimen sheet,
render an entire fake product UI in that pairing: a nav bar, a hero, a pricing card, a signup
form with labeled inputs, buttons in multiple states. Everything re-renders live as either font
changes, with zero layout jank, so the comparison is instant and visceral. Alongside the visual
preview, compute a live contrast/readability score from the *actual rendered* font metrics
(x-height ratio, weight, letter-spacing, measured against WCAG contrast math) — a number that
tells you whether the pairing is legible, not just whether it's pretty.

## Key design decisions

- **Fake UI, not text samples.** The preview surface is a believable, densely-populated mock
  product (nav, hero, pricing card, signup form) — never an isolated headline/paragraph block.
  This is the whole differentiator; every other tool stops at text samples.
- **Real rendered metrics for the score, not font-family heuristics.** The readability score is
  computed by measuring actual rendered glyphs (canvas text metrics: x-height, cap-height,
  average character width) for the loaded fonts, not a static lookup table of "known good"
  pairings. This means it works for any Google Fonts pairing, not just curated ones.
  Combined with WCAG contrast ratio math for the color pairing, this produces a single legibility
  score with a visible breakdown.
- **Instant, jank-free re-renders.** Swapping a font must never cause a visible flash of
  unstyled/fallback text or layout reflow the user can perceive as janky. Fonts are preloaded
  and swapped with `font-display: optional`/measurement-guarded transitions.
- **Static, zero-backend.** No server, no accounts, no database. All font data and metrics come
  from the Google Fonts API and the browser's own text-measurement APIs (Canvas
  `measureText`, `document.fonts`). The whole app is a static bundle deployable anywhere,
  including a subpath like `apps.charliekrug.com/typematch`.
- **Shareable state.** A chosen pairing (plus any preview theme) encodes into the URL so a
  pairing can be shared or bookmarked without an account or backend.

## What "v1 done" looks like

- Two font pickers (display + UI/body) backed by live Google Fonts search, each showing family,
  variants, and a live specimen as you browse.
- A fake app UI (nav bar, hero, pricing card, signup form, buttons in default/hover/disabled
  states) rendering the chosen pairing, updating with no layout jank when either font changes.
- A visible contrast/readability score with a breakdown (x-height ratio, contrast ratio, a
  plain-language verdict), computed from the actual rendered fonts.
- The chosen pairing is encoded in the URL and restorable from a shared link.
- Light/dark preview toggle that doesn't fight the chosen fonts' own color needs.
- Fully responsive from 390px to 1440px+, keyboard-navigable, deployable as a static bundle to
  a subpath with relative asset paths.
