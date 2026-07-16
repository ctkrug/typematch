---
title: I built a font pairing tool that shows the fonts doing real work
published: false
tags: webdev, react, typescript, design
---

Every font pairing tool I have used shows the same thing: a big headline, a paragraph of filler,
and a vague feeling that the combination is fine. That view flatters almost everything. Fonts fail
at 13px form labels and button captions, not at 72px headlines, and I kept finding that out only
after the pairing was already wired into a project.

So I built [Typebed](https://apps.charliekrug.com/typematch/). You pick two Google Fonts and it sets
them into a whole fake product: a nav bar, a hero, a three-tier pricing table, and a signup form
with labels, helper text, an error state, and a disabled button. Then it scores the pairing out of 100. Static React, no backend, no API key.

Two parts turned out to be more interesting than I expected.

## The score was frozen on a font that was not there

The app measures real glyphs with canvas `measureText` and derives x-height over cap-height.
Straightforward, except the number was quietly wrong: it always described the fallback, never the
font I had picked.

The cause is that a CSS font stack is a bad change signal. Select Lora and the app immediately sets
`font-family: "Lora", Georgia, serif`, before the face has downloaded. When the face lands a moment
later the browser repaints. But the stack string is **identical** before and after. Nothing in a
dependency array changed, so nothing recomputed, and the score went on describing Georgia.

The fix is a `revision` counter that increments every time a load commits. Anything measuring
painted pixels depends on it rather than on the stack:

```ts
const score = usePairingScore({
  displayStack: display.stack,
  uiStack: ui.stack,
  revision: `${display.revision}:${ui.revision}`,
});
```

It reads like a redundant field. It is the only thing in the app saying "the pixels changed even
though the string did not." I wrote it into the architecture doc as load-bearing, because it is
exactly the kind of line a future cleanup deletes as noise.

## A measurement cannot see a typeface's skeleton

My first scoring model capped the overall score whenever any factor came out poor. That felt
principled. It also condemned Oswald with Inter, which is a pairing real products ship happily.

The problem is that a bounding box knows almost nothing about how a face reads. Fraunces and Inter
differ by 0.0015 in average character width. One is a chunky serif, the other a grotesque, and no
one would confuse them, but the measurement cannot tell them apart at all. Width and x-height will
cheerfully report that two unmistakable faces are twins.

So I split the factors by what they can actually prove. Contrast is WCAG math against real colors,
so it is objective and it is allowed to veto. The same family in both slots is objective, so it can
veto too. Legibility and pairing contrast are heuristics: they steer the number through their weight
and explain themselves in the breakdown, but they never cap it. Then I calibrated the distinction
constants against measured data from the catalog instead of intuition, and gave the font's category
a deliberately large share, precisely because the metrics are blind to skeleton.

The scores are reproducible, which I like more than I expected to. Bebas Neue with Work Sans lands
at 100, Fraunces with Inter at 90, Roboto with Open Sans at 72 and flagged as too alike. Those
numbers are in the docs as anchors, so if one moves, something changed.

## What I would do differently

The distinction factor leans on category as a proxy for "these look different," which is a
workaround rather than an answer. Comparing stroke contrast or outline curvature would be the real
version, and that is the part I would revisit first.

The other thing I would plan for earlier: jsdom exposes no canvas text metrics at all, so the whole
test suite runs the "unmeasurable" branch. Anything about measured scoring has to be verified by
driving a real browser. That split is fine once you design for it, but I discovered it rather than
chose it, and the test suite still shows the seam.

Live: [apps.charliekrug.com/typematch](https://apps.charliekrug.com/typematch/)
Source: [github.com/ctkrug/typematch](https://github.com/ctkrug/typematch)
