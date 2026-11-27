# Scroll-Down Indicator

Animated chevron at the bottom of a hero nudging readers to scroll. Pure CSS, reduced-motion aware.

- Documentation: https://vanilla-breeze.com/docs/patterns/scroll/scroll-down-indicator/
- Vanilla Breeze 0.7.4

## Overview

A small chevron pinned to the bottom of a hero section, gently bouncing to hint that more content lives below the fold. Used by countless marketing sites; recognised instantly by readers.

Anatomy:
- A link inside the hero, absolutely positioned at `inset-block-end`
- A `::after` pseudo-element renders the chevron glyph
- A keyframe animation bounces the chevron on a continuous loop
- Anchors to the section below for keyboard users — clicking it scrolls to the next anchor
- `prefers-reduced-motion` stops the bounce

## HTML

Hero with scroll-down indicator:

```html
<header class="hero">
  <hgroup>
    <h1>The hero</h1>
    <p>Headline copy here.</p>
  </hgroup>
  <a href="#below" class="scroll-down" aria-label="Scroll to content">Scroll</a>
</header>
<main id="below">
  ...
</main>
```

## CSS

Indicator styles:

```css
.scroll-down {
  position: absolute;
  inset-inline: 0;
  inset-block-end: var(--size-l);
  margin-inline: auto;
  inline-size: fit-content;
  color: white;
  text-decoration: none;
  font-size: var(--font-size-s);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-2xs);
}

.scroll-down::after {
  content: "↓";
  display: block;
  font-size: 1.5rem;
  line-height: 1;
  animation: scroll-bounce 1.6s ease-in-out infinite;
}

@keyframes scroll-bounce {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50%      { transform: translateY(6px); opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-down::after { animation: none; }
}
```

## Notes

- Use an `<a>` rather than a button — the destination is content, not an action. Keyboard users get free Enter-to-scroll behaviour and you don&apos;t need any JavaScript.
- The hero needs `position: relative` (or any non-static positioning) so the absolute indicator anchors to it.
- An alternative glyph: use VB&apos;s `<icon-wc name="chevron-down">` instead of the unicode arrow for a sharper look.
