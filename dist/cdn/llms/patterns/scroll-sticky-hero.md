# Sticky Hero with Scale-Out

Pinned hero that scales and fades as the reader scrolls past. Pure CSS via position: sticky + animation-timeline: view().

- Documentation: https://vanilla-breeze.com/docs/patterns/scroll/sticky-hero/
- Vanilla Breeze 0.7.4

## Overview

A hero section that stays pinned to the top of the viewport while the user scrolls past it, then scales down and fades as it exits. The effect makes the transition into the article body feel cinematic without hijacking scroll.

Anatomy:
- An outer `.stage` taller than the viewport — its height controls how long the hero stays pinned
- The hero is `position: sticky` inside the stage
- `animation-timeline: view()` on the hero binds a scale/fade animation to its exit progress
- Browsers without scroll-driven animation support see a normal sticky hero — no broken layout

## HTML

Stage + sticky hero:

```html
<section class="stage">
  <header class="hero">
    <hgroup>
      <h1>Sticky hero with scale-out</h1>
      <p>The hero stays pinned while the user scrolls past it.</p>
    </hgroup>
  </header>
</section>
<main>
  ... content below the stage ...
</main>
```

## CSS

Stage + sticky + scroll-driven shrink:

```css
.stage {
  block-size: 200vh;  /* twice the viewport — controls how long the hero pins */
  position: relative;
}

.hero {
  position: sticky;
  inset-block-start: 0;
  block-size: 100vh;
  display: grid;
  place-items: center;
}

@supports (animation-timeline: view()) {
  .hero {
    animation: hero-shrink 1s linear forwards;
    animation-timeline: view();
    animation-range: exit -10% exit 90%;
  }
  @keyframes hero-shrink {
    to { transform: scale(0.85); opacity: 0.2; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero { animation: none; animation-timeline: auto; }
}
```

## How it composes with VB

If you&apos;d rather use the unified trigger system, swap the custom animation for an entrance-slot effect plus `data-trigger="view-progress:exit"`:

This gives a fade only. For combined scale-out you currently still want the custom keyframe shown above — bundled scale+fade is a future addition. See the view-progress trigger docs.

With data-trigger view-progress:

```html
<section class="stage">
  <header class="hero" data-effect="fade-out" data-trigger="view-progress:exit">
    <hgroup>
      <h1>Page title</h1>
      <p>Tagline</p>
    </hgroup>
  </header>
</section>
```

## Notes

- Stage height controls timing. A 2× viewport stage gives a comfortable hero pin. Make it 3× for a slower exit, 1.5× for a quicker one.
- The `animation-range` negative start (`exit -10%`) starts the animation just before the hero actually begins exiting, so it feels responsive at the top of the scroll-out.
- Don&apos;t set `overflow: hidden` on the stage — it breaks `position: sticky`.
