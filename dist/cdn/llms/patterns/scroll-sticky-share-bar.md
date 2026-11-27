# Sticky Share Bar

Vertical share rail beside an article that follows the reader. Pure position: sticky composition, no JS, no scroll listeners.

- Documentation: https://vanilla-breeze.com/docs/patterns/scroll/sticky-share-bar/
- Vanilla Breeze 0.7.4

## Overview

A vertical rail of share buttons that sticks to the side of an article as the reader scrolls. The rail releases naturally when the article ends because `position: sticky` respects its containing block.

Anatomy:
- A grid container with rail · body · gutter columns
- The rail is `position: sticky` with `align-self: start`
- `inset-block-start` sets the offset from the viewport edge
- At narrow widths the rail flips to a horizontal bar above the article

## HTML

Article with sticky share rail:

```html
<article class="post">
  <nav class="share-rail" aria-label="Share">
    <a href="#" data-platform="x" aria-label="Share on X">𝕏</a>
    <a href="#" data-platform="linkedin" aria-label="Share on LinkedIn">in</a>
    <a href="#" data-copy="https://example.com/post" aria-label="Copy link">🔗</a>
  </nav>
  <section class="post-body">
    <h1>Post title</h1>
    <p>...long-form content...</p>
  </section>
  <aside></aside>
</article>
```

## CSS

Grid layout + sticky rail:

```css
article.post {
  display: grid;
  grid-template-columns: auto minmax(0, 60ch) 1fr;
  gap: var(--size-l);
  padding: var(--size-l);
  max-inline-size: 80rem;
  margin-inline: auto;
}

.share-rail {
  position: sticky;
  inset-block-start: var(--size-l);
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: var(--size-s);
}

.post-body h1 { font-size: var(--font-size-3xl); margin-block-start: 0; }
.post-body p { line-height: 1.7; }

@media (max-width: 50rem) {
  article.post { grid-template-columns: 1fr; }
  .share-rail {
    flex-direction: row;
    inset-block-start: 0;
  }
}
```

## Composing with VB&apos;s clipboard utility

The copy-link button in the demo uses `data-copy` from VB&apos;s clipboard system — no per-page JS, automatic `data-state="copied"` feedback, screen-reader announce. See data-copy.

For a full share component with platform-specific share URLs and the Web Share API, use `<share-wc>` instead of rolling your own anchors.

## Notes

- `align-self: start` is what keeps the rail pinned at the top. Without it the rail stretches to the article&apos;s height and never sticks.
- The third column (`aside`) is intentionally empty in the demo — it gives the article a centred feel by claiming the right gutter. Drop it if you don&apos;t need symmetry.
- No `overflow: hidden` on any ancestor — same sticky caveat as everywhere.
- If the body is shorter than the viewport, the rail won&apos;t appear to stick (there&apos;s nothing to scroll). That&apos;s correct.
