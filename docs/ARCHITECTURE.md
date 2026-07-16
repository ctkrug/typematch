# Typematch — Architecture

A map of the codebase for anyone (human or agent) picking it up cold.
See [VISION.md](./VISION.md) for _why_, [DESIGN.md](./DESIGN.md) for the visual system,
[BACKLOG.md](./BACKLOG.md) for what's done and what's left.

## Shape

A static React + TypeScript SPA built by Vite. **No backend, no API key, no secrets.** Font
data is vendored; font files come from the keyless Google Fonts CSS2 CDN; everything else is
computed in the browser.

```
src/
  App.tsx                  composition root: owns the Pairing, wires everything together
  main.tsx                 React entry
  fonts/                   catalog, search, loading, and the applied-font hook
  preview/                 the fake product UI (the wow moment) + its palettes
  scoring/                 contrast math, glyph measurement, the score model
  controls/                the tool's own chrome: pickers, score panel, toggle, share, favorites
  state/                   URL codec + localStorage favorites (+ cross-tab merge)
  styles/                  global tokens (global.css) + app chrome (app-shell.css)
  test/setup.ts            jest-dom matchers + auto-cleanup
```

## Data flow

```
URL query ─┐
           ├─► App: pairing = { display, ui, theme }   (single source of truth)
defaults ──┘        │
                    ├─► useLoadedFont(display) ─► loader ─► CSS2 CDN ─► { stack, revision }
                    ├─► useLoadedFont(ui)      ─┘                        │
                    │                                                    ▼
                    ├─► usePairingScore(stacks, theme, revision) ─► canvas measure ─► PairingScore
                    │                                                    │
                    ├─► PreviewApp(displayStack, uiStack, theme) ────────┤
                    │        └─ sets --preview-* custom props on ONE wrapper
                    │                                                    ▼
                    ├─► ScorePanel(score)                          side column
                    ├─► history.replaceState(?display&ui&theme)    (always shareable)
                    └─► favorites ⇄ localStorage
```

`Pairing` (`state/pairingUrl.ts`) is the one piece of app state. The URL is a _mirror_ of it,
not a second source of truth — it's written on change and read only at first paint.

## The load-and-swap contract (the subtle part)

`fonts/useLoadedFont.ts` is where the "no flash of fallback" guarantee lives:

- It keeps painting the **previously applied** family until the newly selected face has actually
  downloaded. The selected font and the _applied_ font are deliberately different values.
- A failed load still commits — to the category's system stack (`fonts/stack.ts`) plus an error
  string — so a dead family degrades instead of blanking the preview.
- `revision` increments on every commit. It is **load-bearing**: the first paint applies a
  stack before the face exists, and the stack string doesn't change when the real face arrives,
  so anything measuring rendered pixels (i.e. the score) must depend on `revision`, not the
  stack. Removing it silently freezes the score on the fallback's metrics.
- Stale loads are ignored via a `cancelled` flag, so fast re-selection can't let an older font
  overwrite a newer one.

The loader itself (`fonts/loader.ts`) is dependency-injected and caches one promise per family
(story 1.3's "fetch once per session"). Failures are evicted so a retry can recover.
`fonts/browserLoader.ts` supplies the real deps; `fonts/FontLoaderContext.tsx` provides it to
the tree so tests can swap it and never hit the network.

## Scoring model

`scoring/score.ts` produces a 0–100 overall plus a factor breakdown:

| Factor           | Weight | Source                                                     |
| ---------------- | ------ | ---------------------------------------------------------- |
| Text contrast    | 0.40   | WCAG 2.x ratio of the preview palette's text vs background |
| Body legibility  | 0.30   | UI font's measured x-height ÷ cap-height                   |
| Pairing contrast | 0.30   | measured divergence of the two faces + category difference |

Three rules that are easy to break by accident:

- **Only objective defects veto the overall** (cap below `WARN_THRESHOLD` = 60): text that fails
  WCAG, and the same family in both slots. A weighted average would otherwise let a nice
  x-height hide a hard WCAG failure. Legibility and distinction are _heuristics_ — they steer via
  weight and explain themselves in the breakdown, but they don't veto. An earlier version let
  any poor factor cap, which wrongly condemned good same-category pairings (Oswald + Inter).
- **The distinction constants are calibrated from measured data, not intuition** — see the
  `DISTINCTION` block. The category share is large because the metrics _cannot see skeleton_:
  Fraunces and Inter differ by 0.0015 in average character width yet are unmistakable. If you
  retune, re-measure first; the observed spread is x-height ratio ~0.61–1.0 and average width
  ~0.39–0.60 across the catalog.
- **Unmeasurable ⇒ `measured: false`, contrast-only** — never a fabricated number. Canvas text
  metrics don't exist in jsdom, so this path is exercised by the whole test suite.

Sanity anchors from driving the real app (useful when retuning): Fraunces + Inter 90 ·
Bebas Neue + Work Sans 100 · Oswald + Inter 78 · Roboto + Open Sans 72 (flagged "too alike") ·
Playfair Display + Cormorant Garamond 68 · the same font twice 59.

`scoring/metrics.ts` measures at 200px because the glyph bounding box comes back in near-integer
units; at 16px the rounding error exceeds the differences between fonts.

## Shared state: the URL and localStorage

Two invariants here were each a real bug, so they're written down:

- **The share URL is built from the pairing, never read back from
  `window.location`.** The address bar is written by an effect that runs _after_ render, so
  anything reading `location.href` during render sees the _previous_ pairing. That's what
  `pairingUrl(pairing, base)` is for. A theme flip loads no font and so triggers no later
  re-render — it leaves a stale link stale forever.
- **Favorites are shared mutable state.** A second tab may have written since this one mounted,
  so `commitFavorites` re-reads storage and merges at write time rather than blindly writing a
  mount-time snapshot back (which silently destroyed the other tab's saves). The `storage`
  event keeps a background tab's list live; it fires only in _other_ tabs, so it can't echo our
  own writes.

Everything read from a URL or from storage is untrusted: unknown families, bogus themes, and
truncated or hand-edited JSON each fall back per-field, so one bad value can't take the app
down or discard a good neighbouring one.

## Styling

Two layers, both plain CSS (no framework):

- `styles/global.css` — the design tokens from DESIGN.md as `:root` custom properties, plus the
  chrome's own Fraunces/Inter webfont import.
- `styles/app-shell.css` — the tool chrome (paper background, rail, pickers, score, favorites).
- `preview/preview.css` — the mock product, scoped under `.preview` and driven entirely by the
  `--preview-*` props set on the wrapper. It uses **container queries**, not media queries: the
  preview is a resizable panel, so it must respond to its own width, not the window's.

The mock's controls are presentational `<span>`s, not real buttons/inputs. That's deliberate:
~20 focusable dead controls would bury the tool's real ones in the tab order.

## Run / test

```bash
npm run dev            # vite dev server
npm test               # vitest (jsdom) — 250+ tests, no network
npm test -- --coverage # v8 coverage report
npm run typecheck      # tsc -b --noEmit
npm run lint           # eslint (zero warnings expected)
npm run build          # tsc -b && vite build → dist/
npm run preview        # serve the built bundle
```

Pure logic (contrast, score, parsers) also carries **property-based tests** (fast-check, the
`*.property.test.ts` files): they state the laws — symmetry, monotonicity, the veto rules —
that example tests can only sample.

**jsdom exposes no canvas text metrics**, which shapes the suite more than anything else: every
test that goes through the real app hits the `measured: false`, contrast-only path. Components
that render the full breakdown (`ScorePanel`) are therefore tested by feeding them a
`PairingScore` directly. Anything about _measured_ scoring has to be verified in a real
browser, not in the suite.

**Subpath hosting:** `vite.config.ts` sets `base: "./"`, so every built asset path is relative
and the bundle works at `apps.charliekrug.com/typematch/`. Any leading-slash asset path is a
bug. Verified by serving `dist/` from a `/typematch/` prefix.

## Conventions

- Errors are handled at boundaries and turn into designed states — no silent `catch {}`.
  Untrusted input (shared URLs, localStorage) falls back per-field rather than throwing.
- Pure logic (search, contrast, score, codecs) is separated from React so it's tested directly.
- Every public function ships with tests covering the boundaries, not just the happy path.
