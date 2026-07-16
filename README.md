# Typematch

[![CI](https://github.com/ctkrug/typematch/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/typematch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Paste two Google Fonts. Instantly see the pairing across a real UI — not a headline-and-paragraph
mockup, an entire fake app: a nav bar, a pricing card, a signup form — plus a live
contrast/readability score computed from the actual rendered font metrics.

## Why

Every font-pairing tool on the web shows you the same thing: a big headline and a paragraph of
lorem ipsum. That tells you almost nothing about how a typeface behaves once it's doing real
work — labels inside a button, a dense form, small print in a nav bar. Typematch renders your
pairing across a densely-populated fake product UI so you can tell, in one glance, whether it
actually looks like a shipped product or just a specimen sheet.

## What it does

- Paste (or pick) two Google Fonts — one display, one UI/body.
- A fake app UI re-renders live in that pairing: pricing card, signup form, nav bar, buttons,
  and form controls — not isolated text samples.
- A contrast/readability score is computed from the rendered font metrics (x-height,
  cap-height, character width) against WCAG contrast math, so you get a number, not just a vibe.
- Swap either font and everything re-renders instantly, with no layout jank.

## Features

- **Dual font picker** with search across 112 Google Fonts families — keyboard-driven, with
  category and weight metadata on every result.
- **A whole fake product**, not text samples: nav bar, marketing hero with stat row, a
  three-tier pricing grid, and a signup form with labels, helper text, an error state, and a
  disabled button. Small type is sized honestly (12–13px), because that's where pairings fail.
- **A readability score out of 100**, with a breakdown: text contrast (real WCAG 2.x math),
  body legibility (measured x-height ÷ cap-height), and pairing contrast (how distinguishable
  the two faces actually are). Every factor gets a plain-language verdict, not just a bar.
- **Flash-free swaps** — the current font keeps painting until the next face has downloaded, so
  changing a font never flashes the fallback.
- **Shareable links** — the pairing and theme live in the URL; copy the link and it restores
  exactly.
- **Saved pairings** in localStorage, and a light/dark preview toggle that persists.

## How the score works

| Factor           | Weight | Measured from                                               |
| ---------------- | ------ | ----------------------------------------------------------- |
| Text contrast    | 0.40   | WCAG 2.x contrast ratio of the preview's text vs background |
| Body legibility  | 0.30   | the UI font's rendered x-height ÷ cap-height                |
| Pairing contrast | 0.30   | how far the two faces' metrics and categories diverge       |

Metrics come from measuring the _actual rasterized glyphs_ via canvas, not a lookup table of
curated pairings — so it works for any pairing you throw at it. Contrast carries the most
weight because it's the only factor with an objective pass/fail.

**Only objective defects cap the overall score** — text that fails WCAG, and the same family in
both slots. A healthy x-height should never average away text that fails WCAG. Legibility and
pairing contrast are heuristics: they steer the number through their weight and explain
themselves in the breakdown, but they don't veto, because the metrics can't see a typeface's
skeleton. (Oswald + Inter is a genuinely good pairing that a naive "any weak factor caps it"
rule condemns.)

Where the glyphs can't be measured at all, the score falls back to contrast-only and says so,
rather than inventing a number.

## Stack

- TypeScript + React, built with Vite
- Google Fonts CSS2 CDN for font loading — **no API key, no backend, no secrets**
- Vitest + React Testing Library
- Static output — deployable to any static host, including a subpath

## Status

Core feature set is functionally complete: pairing preview, scoring, sharing, and favorites all
work end-to-end. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the codebase map,
[`docs/VISION.md`](docs/VISION.md) for the product vision,
[`docs/DESIGN.md`](docs/DESIGN.md) for the art direction, and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for what's left.

## Development

```bash
npm install
npm run dev        # start the dev server
npm run build      # production build to dist/
npm run preview    # serve the production build
npm test           # run the test suite (no network needed)
npm run typecheck  # tsc --noEmit
npm run lint       # lint the codebase
```

The test suite injects its own font loader, so it never hits the network and stays fast.

## Deploy

`npm run build` outputs a fully static, self-contained bundle to `dist/`. Vite is configured
with a relative `base` (`./`), so the build works when served from the domain root or from any
subpath (e.g. `example.com/typematch/`) — no server, no rewrite rules required.

## License

MIT — see [`LICENSE`](LICENSE).
