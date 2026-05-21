# Parallax and Staged Scroll Presentation in Vanilla Breeze

Date: 2026-03-27
Status: research and prototype plan

## Why this document exists

The term "parallax" gets used for several different things:

1. Scroll-triggered entrance effects
2. Continuous scroll-linked motion
3. Pinned or staged storytelling sections
4. Background or depth illusions in hero sections

Those are not the same technical problem.

Vanilla Breeze already handles the first category well. The real open question is whether VB should add a clean pattern for the second and third categories without breaking its HTML-first, progressive-enhancement model.

My conclusion is yes, but only if we treat this as a narrow opt-in pattern, not a generic animation engine.

## Executive take

Vanilla Breeze is unusually well positioned for this work because it already has:

- semantic HTML as the default authoring model
- flat page structure via `data-layout`
- a composable `data-effect` + `data-trigger` model for small motion
- a working CSS scroll-linked feature in `data-scroll-shrink`
- established reduced-motion behavior and progressive enhancement discipline

The main constraint is architectural:

- `data-effect` is built around activation
- parallax and staged scroll scenes are built around continuous progress

That means the best path is:

1. Keep `data-effect` for discrete entrances and micro-motion.
2. Prototype parallax and staged scenes as a separate scroll-scene layer.
3. Only promote the winning pattern into framework syntax after two or three demos prove the model.

## What VB already has

### Strengths already in the codebase

| Existing VB capability | Where it lives | Why it matters here |
| --- | --- | --- |
| Unified effect registration and DOM observation | [`src/lib/vb.js`](../../src/lib/vb.js) | Good foundation for opt-in enhancement hooks |
| Built-in `scroll`, `hover`, `click`, and `time` triggers | [`src/lib/vb-triggers.js`](../../src/lib/vb-triggers.js) | Scroll entrance effects already exist |
| Effect compositing and trigger independence | [`site/src/pages/docs/concepts/effect-compositing.njk`](../../site/src/pages/docs/concepts/effect-compositing.njk) | Useful for step reveals inside staged sections |
| Semantic layout attributes | [`src/custom-elements/layout-attributes.css`](../../src/custom-elements/layout-attributes.css) | Lets us build story sections without wrapper soup |
| CSS scroll-linked sticky header shrink | [`src/custom-elements/layout-attributes.css`](../../src/custom-elements/layout-attributes.css), [`demos/examples/demos/scroll-shrink-header.html`](../../demos/examples/demos/scroll-shrink-header.html) | Proof that VB can ship scroll-driven enhancement cleanly |
| `@property` token registration | [`src/main.css`](../../src/main.css) | Useful if we decide to animate custom properties later |
| Reduced-motion posture | [`site/src/pages/docs/accessibility.njk`](../../site/src/pages/docs/accessibility.njk) and effect implementations | Required for any serious scroll-motion feature |

### Important limitations

| Limitation | Why it matters |
| --- | --- |
| Built-in `scroll` trigger uses `IntersectionObserver` and fires once | Great for reveal-on-enter, not enough for scrubbed motion |
| `data-effect` is stateful activation, not timeline-driven progress | A parallax layer needs `0% -> 100%` progress, not just "active" |
| Current system has no page-section "scene" abstraction | Staged presentations need pinned regions, steps, and clear fallbacks |
| Browser support for CSS scroll-driven animations is still incomplete | Must be progressive enhancement, not a required behavior |

## Research summary

### 1. Scroll-driven animation is now a real platform feature

Official platform docs now treat scroll-linked animation as a first-class CSS capability rather than a JS trick.

- MDN documents the CSS scroll-driven animations model and its timeline types: scroll progress timelines and view progress timelines.
- Chrome's official guide shows reading progress, section-linked animation, and anonymous or named scroll timelines with plain CSS.

What matters for VB:

- `scroll()` is good for page-level progress tied to a scroller.
- `view()` is better for section-local motion as an element enters and leaves the viewport.
- This maps well onto VB's progressive enhancement model because unsupported browsers can simply see a static layout.

### 2. `IntersectionObserver` remains the right fallback for threshold-based reveals

MDN still positions `IntersectionObserver` as the browser-optimized way to react when an element crosses visibility thresholds.

That matches VB's current `data-trigger="scroll"` implementation very well.

But it does not solve the same problem as parallax:

- IO is good for "activate when visible enough"
- IO is not good for "tie motion continuously to scroll progress"

That means VB should not try to stretch the current trigger model into a scrubbed-motion engine.

### 3. The hard part of parallax is not the effect, it is the contract

The frustrating part in real projects is usually not the CSS syntax. It is the combination of:

- browser support differences
- responsive layout changes
- motion accessibility
- performance under scroll
- pinned content behavior
- fallback when motion is disabled
- keeping reading order sensible

Inference from the official docs: scroll-driven animation is now common enough that platform documentation treats sticky headers, reading indicators, and hero motion as standard examples. The pain is no longer "is this possible?" but "how do I make it resilient?"

### 4. Performance rules are strict

The official guidance still points toward the same core rule: animate compositing-friendly properties when possible.

For VB that means:

- prefer `transform` and `opacity`
- avoid animating `top`, `left`, `width`, `height`, and `background-position` for the main effect
- avoid creating too many promoted layers
- keep the number of independently moving pieces small

This strongly argues for subtle, section-scoped motion rather than elaborate multi-layer page-wide parallax.

### 5. Accessibility cannot be bolted on later

Official guidance around `prefers-reduced-motion` and VB's own accessibility posture both point the same way:

- motion must be optional
- content order must remain valid without motion
- pinned layouts must not trap keyboard users or hide anchor targets
- the static version must still be coherent

This is especially important for staged storytelling patterns, where the visual emphasis can drift away from the actual DOM order if implemented carelessly.

## What this means for VB

### The key distinction

VB currently has two motion systems:

- `data-effect`: ambient or triggered motion on an element
- `data-transition`: state-change motion during DOM swaps or navigation

Parallax and staged scenes are a third category:

- scroll-progress motion

I do not think that should be forced into `data-effect`.

### Why not overload `data-effect`

`data-effect` works because it is simple:

- one element
- one or more effect names
- optional trigger
- activate

A scrubbed parallax scene is different:

- the container matters
- the scroll source matters
- the range matters
- the relationship between layers matters
- the element may need to move continuously rather than switch state

That suggests a separate opt-in pattern.

## Recommended VB shape

### Lane 1: keep using `data-effect` for discrete motion

Use the existing system for:

- fade/slide/pop entrances
- text reveal inside a stage
- step copy activation when sections enter view

Do not rebuild this.

### Lane 2: add a narrow parallax utility

This should be for simple depth motion only:

- hero image shifts slower than content
- background media moves slightly on scroll
- foreground badge or card drifts at a different rate

Candidate shape:

```html
<section data-parallax-group>
  <figure
    data-parallax
    style="--vb-parallax-from: 0%; --vb-parallax-to: -16%; --vb-parallax-scale: 1.08"
  >
    <img src="/images/hero.jpg" alt="" />
  </figure>

  <header data-layout="stack">
    <h1>Semantic hero content</h1>
    <p>Copy remains readable and meaningful without motion.</p>
  </header>
</section>
```

Implementation direction:

- CSS-first
- root or section scroll timeline
- animate `transform`
- static fallback when unsupported

### Lane 3: add a staged presentation pattern

This is the more interesting feature for VB.

Candidate shape:

```html
<section data-stage>
  <figure data-stage-pin>
    <img src="/images/scene.jpg" alt="" />
    <figcaption>Supporting visual</figcaption>
  </figure>

  <article data-stage-steps>
    <section data-stage-step>
      <h2 data-effect="fade-in slide-up" data-trigger="scroll">Step one</h2>
      <p>Copy explains the first part of the story.</p>
    </section>

    <section data-stage-step>
      <h2 data-effect="fade-in slide-up" data-trigger="scroll">Step two</h2>
      <p>Second section advances the narrative.</p>
    </section>
  </article>
</section>
```

Baseline behavior:

- standard document flow
- semantic `figure`, `article`, and `section`
- pinned media via `position: sticky` only when space allows

Enhanced behavior:

- optional active-step styling
- optional stage progress indicator
- optional view-timeline motion on the pinned visual

This pattern fits VB better than a heavy "parallax engine" because it is really a layout-plus-enhancement pattern.

## Suggested implementation strategy

### Phase 1: do not build framework API yet

Build demos first.

The goal is to answer three questions:

1. Does the pattern feel natural in semantic HTML?
2. Does it degrade well enough without scroll-driven animation support?
3. Does the effect stay subtle and readable on mobile?

If the answer to any of those is no, the API should not ship.

### Phase 2: prototype three narrow demos

#### Prototype A: Hero depth

Goal:

- prove that a simple parallax media layer can be authored with minimal markup

Rules:

- one media layer only
- one foreground content block
- transform only
- no JS fallback

Success condition:

- static hero still looks correct with support disabled
- motion is visible but restrained
- no layout shift

Suggested demo file:

- `demos/examples/demos/parallax-hero.html`

#### Prototype B: Staged story section

Goal:

- prove that pinned media plus sequential semantic sections feels like a VB pattern rather than a one-off gimmick

Rules:

- use native sectioning elements
- use existing `data-layout` primitives
- use existing `data-effect` for copy reveal
- pin with CSS sticky before adding any JS

Success condition:

- without JS the document still reads naturally
- without scroll timeline support the pinned layout still works
- anchor links and keyboard navigation are not broken

Suggested demo file:

- `demos/examples/demos/staged-story.html`

#### Prototype C: Scroll progress utility

Goal:

- prove a simple shared infrastructure piece that can support later work

Rules:

- tiny scope
- transform-based indicator
- no scene complexity

Why include it:

- it validates shared scroll-timeline conventions
- it is easier to debug than a full parallax section

Suggested demo file:

- `demos/examples/demos/scroll-progress-story.html`

### Phase 3: compare two implementation models

#### Model A: CSS-first only

Use:

- `@supports (animation-timeline: scroll())`
- `@supports (animation-timeline: view())`
- sticky positioning
- existing `data-effect` for entrances

Pros:

- cleanest VB fit
- lowest JS cost
- easiest to reason about

Cons:

- incomplete browser support
- less control over active step state

#### Model B: CSS baseline plus tiny JS enhancement

Use:

- CSS sticky and layout as the baseline
- `IntersectionObserver` only for active-step state and class toggles
- CSS scroll timelines only where supported

Pros:

- more consistent step state behavior
- still matches VB's progressive enhancement contract

Cons:

- slightly more complexity
- risk of sliding toward an overbuilt engine

Recommendation:

- Prototype both
- Default toward Model A
- Only keep Model B pieces that solve a real authoring problem

## Proposed acceptance criteria

The feature should not advance beyond demo stage unless all of these are true:

- The markup remains semantic without needing anonymous wrapper divs everywhere.
- The static version is still publishable.
- `prefers-reduced-motion` produces a calm, non-broken experience.
- The effect uses mostly `transform` and `opacity`.
- The feature does not require scroll listeners for every animated element.
- Mobile layout remains readable when the pinned layout collapses.
- Anchor navigation and focus movement still make sense.

## Test matrix

| Test area | What to verify |
| --- | --- |
| No JS | Content order, readability, and media placement still work |
| No scroll-driven animation support | Static or sticky fallback still looks intentional |
| Reduced motion | Motion removed or greatly reduced without losing context |
| Mobile narrow viewport | Stage collapses cleanly, no clipped sticky media |
| Tall content | Progress ranges still feel correct, no dead zones |
| Keyboard navigation | Focus is never hidden behind sticky regions |
| Anchor links | `scroll-margin` or equivalent prevents sticky overlap |
| Screen reader pass | DOM order matches reading order |
| Performance | No visible stutter on a realistic page |
| Theming | Motion works across surface and contrast variations |

## Risks specific to VB

### 1. Too much page magic

VB works best when behavior is explicit in markup. A parallax system that auto-detects page structure would cut against that.

Recommendation:

- require explicit opt-in attributes

### 2. Overloading the effect system

If scrubbed motion is shoved into `data-effect`, the mental model gets muddier.

Recommendation:

- keep scroll scenes separate from effect activation

### 3. Marketing-pattern creep

Parallax features often expand from subtle depth into oversized spectacle.

Recommendation:

- define conservative defaults
- document the anti-patterns as clearly as the pattern

### 4. Support mismatch

The platform feature is real, but not universal enough to treat as baseline.

Recommendation:

- ship only where the static fallback is already acceptable

## Concrete recommendation

I would test this in the following order:

1. Build a hero-depth demo using a single `data-parallax` attribute.
2. Build a staged story demo using sticky layout and current `data-effect` reveals.
3. Add a tiny progress indicator demo to validate shared timeline assumptions.
4. Decide whether the winning abstraction is:
   - a parallax utility
   - a stage layout pattern
   - or both

My expectation is that the staged-story pattern will be more valuable to Vanilla Breeze than generic parallax.

Parallax by itself is easy to overuse. A staged semantic presentation pattern is much closer to VB's strengths.

## Draft API direction if the demos succeed

If the experiments go well, I would explore this shape:

- `data-parallax-group`: scene container
- `data-parallax`: continuous transform-based depth motion
- `data-stage`: staged layout container
- `data-stage-pin`: pinned visual region
- `data-stage-step`: semantic content step

I would not add:

- a generic scroll event engine
- effect names like `data-effect="parallax"`
- mandatory JS polyfills for unsupported browsers

## Internal references

- [`src/lib/vb.js`](../../src/lib/vb.js)
- [`src/lib/vb-triggers.js`](../../src/lib/vb-triggers.js)
- [`src/custom-elements/layout-attributes.css`](../../src/custom-elements/layout-attributes.css)
- [`src/main.css`](../../src/main.css)
- [`site/src/pages/docs/concepts/effect-compositing.njk`](../../site/src/pages/docs/concepts/effect-compositing.njk)
- [`site/src/pages/docs/attributes/data-effect.njk`](../../site/src/pages/docs/attributes/data-effect.njk)
- [`site/src/pages/docs/attributes/data-stagger.njk`](../../site/src/pages/docs/attributes/data-stagger.njk)
- [`demos/examples/demos/scroll-shrink-header.html`](../../demos/examples/demos/scroll-shrink-header.html)
- [`admin/r-n-d/themes/review-first/css-layout-future.md`](./review-first/css-layout-future.md)
- [`admin/r-n-d/mobile/mobile-phases.md`](../plans/mobile/mobile-phases.md)
- [`admin/r-n-d/mobile/mobile-strategy.md`](../plans/mobile/mobile-strategy.md)

## External sources

- MDN, CSS scroll-driven animations: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations
- MDN, scroll-driven animation timelines: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations/Timelines
- MDN, `animation-timeline`: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
- MDN, Intersection Observer API: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- MDN, `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Chrome for Developers, Animate elements on scroll with Scroll-driven animations: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- web.dev, Parallaxin': https://web.dev/articles/speed-parallax
