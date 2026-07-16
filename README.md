# Typematch

[![CI](https://github.com/ctkrug/typematch/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/typematch/actions/workflows/ci.yml)

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
- A contrast/readability score is computed from the rendered font metrics (x-height, weight,
  letter-spacing) against WCAG contrast math, so you get a number, not just a vibe.
- Swap either font and everything re-renders instantly, with no layout jank.

## Planned features

- [ ] Live dual Google Fonts picker with search and weight/style selection
- [ ] Fake app UI preview: nav bar, hero, pricing card, signup form, buttons, inputs
- [ ] Contrast/readability scorer wired to real rendered font metrics
- [ ] Shareable pairing links (encode the pair + theme in the URL)
- [ ] Light/dark preview toggle
- [ ] Pairing history / favorites (local storage)

## Stack

- TypeScript + React, built with Vite
- Google Fonts API for font metadata and dynamic loading
- Vitest for unit tests
- Static output — no server required, deployable to any static host

## Status

Early scaffold. See [`docs/VISION.md`](docs/VISION.md) for the product vision,
[`docs/DESIGN.md`](docs/DESIGN.md) for the art direction, and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build     # production build to dist/
npm run test      # run the test suite
npm run lint      # lint the codebase
```

## License

MIT — see [`LICENSE`](LICENSE).
