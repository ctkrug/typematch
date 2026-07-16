# Typematch — Backlog

Epics ship in order. Every story has verifiable acceptance criteria — checks a later run can
confirm true/false, not vibes. "Design polish" stories are scheduled per epic, not an
afterthought.

## Epic 1 — Core pairing preview (the wow moment)

- [ ] **1.1 Live fake-app UI preview renders the selected pairing** — _the wow moment; must land
      first._
  - Selecting a display font and a UI font renders a nav bar, hero, pricing card, and signup
    form using those fonts within 300ms of selection, with no page reload.
  - Switching either font re-renders the preview with no visible flash of fallback/unstyled text
    (the font is preloaded before the swap commits).
- [ ] **1.2 Google Fonts picker with search**
  - Typing in the font search field filters the Google Fonts list by case-insensitive substring
    match on family name.
  - Selecting a result immediately updates the corresponding preview font (display or UI slot).
- [ ] **1.3 Font loading & caching**
  - Each selected Google Font is fetched once per session; re-selecting a previously loaded font
    does not trigger a duplicate network request (verified via `document.fonts` or a load
    counter).
  - If a font fails to load, the preview falls back to the font's system fallback stack and
    shows an inline error message, not a blank or broken screen.
- [ ] **1.4 Design polish — pairing preview**
  - The preview surface follows `docs/DESIGN.md` tokens (paper background, terracotta accent,
    editorial spacing) at 390px, 768px, and 1440px with no horizontal scroll.
  - The header wordmark's live font-split always matches the currently selected display/UI
    fonts.

## Epic 2 — Readability & contrast scoring

- [ ] **2.1 Contrast/readability score engine**
  - Given the two selected fonts and a text/background color pair, the app computes a numeric
    score (0–100) derived from measured x-height ratio (via `canvas.measureText` /
    `document.fonts`) combined with WCAG contrast ratio math.
  - The score recomputes within 300ms of any font or color change.
- [ ] **2.2 Score breakdown UI**
  - The score panel shows the overall number plus a breakdown of at least two contributing
    factors (e.g. contrast ratio, x-height ratio) with a plain-language verdict per factor (e.g.
    "Good contrast", "Low x-height").
  - A score below a defined threshold is visibly flagged as a warning (color and icon), not just
    a low number.
- [ ] **2.3 Light/dark preview toggle**
  - Toggling light/dark updates the fake UI's background/text colors and re-runs the contrast
    score against the new pair.
  - Toggle state persists across a page reload via localStorage.
- [ ] **2.4 Design polish — scoring UI**
  - The score panel and toggle carry themed hover/focus/active states and follow
    `docs/DESIGN.md` tokens at all three breakpoints.

## Epic 3 — Sharing & persistence

- [ ] **3.1 Shareable pairing URL**
  - Selecting a pairing encodes display font, UI font, and light/dark mode into the URL query
    string.
  - Loading a URL with those query params restores the exact same pairing and theme on page
    load with no manual re-selection.
- [ ] **3.2 Pairing history / favorites**
  - Saving a pairing persists it to localStorage and it reappears in a favorites list after a
    full page reload.
  - Removing a favorite deletes it from localStorage and the visible list immediately.
- [ ] **3.3 Copy/share affordance**
  - A "copy link" button copies the current shareable URL to the clipboard and shows a visible
    confirmation (toast or checkmark) for at least 1.5 seconds.
- [ ] **3.4 Design polish — sharing UI**
  - The favorites list and share controls follow `docs/DESIGN.md` tokens; the empty-favorites
    state is a designed empty state, not a blank area.

## Epic 4 — Deploy & responsive hardening

- [ ] **4.1 Responsive layout hardening**
  - At 390px, 768px, and 1440px the control rail, preview, and score panel compose without
    overlap or horizontal scroll, matching `docs/DESIGN.md`'s layout intent.
- [ ] **4.2 Static build for subpath hosting**
  - `npm run build` produces a `dist/` directory that loads correctly when served from a
    non-root subpath (built asset URLs use relative paths, no leading `/`).
  - `npm run preview` serves the built site with fonts, favicon, and preview UI all rendering
    correctly.
- [ ] **4.3 Accessibility pass**
  - All interactive controls (font pickers, toggle, favorite button, copy button) are reachable
    via Tab key in a logical order and show a visible focus ring.
  - Icon-only buttons have `aria-label`s; the score readout sits in an ARIA live region so score
    changes are announced.
