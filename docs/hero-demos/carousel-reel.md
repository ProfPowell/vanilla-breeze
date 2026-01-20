# Horizontal Scroll Perfected

**Tagline:** "Scroll snap carousel. No JavaScript."

## The Wow Factor

Explain how `layout-reel` provides a complete carousel experience with scroll-snap, momentum scrolling, and item sizing - all with zero JavaScript.

## How It Works

Explain the CSS:
- `overflow-x: auto` for horizontal scrolling
- `scroll-snap-type: x mandatory` for snap behavior
- `scroll-snap-align: start` on children
- `-webkit-overflow-scrolling: touch` for momentum
- Hidden scrollbar by default, optional with `data-scrollbar`

## Usage

```html
<layout-reel data-item-width="m" data-gap="m">
  <article>Card 1</article>
  <article>Card 2</article>
  <article>Card 3</article>
</layout-reel>
```

## Available Attributes

| Attribute | Values |
|-----------|--------|
| data-item-width | auto, s (15rem), m (20rem), l (25rem), xl (30rem), full |
| data-gap | none, xs, s, m, l, xl |
| data-padding | none, s, m, l |
| data-scrollbar | (boolean) Show scrollbar |
| data-align | start, center, end, stretch |

## Accessibility

- Respects `prefers-reduced-motion` (disables snap)
- Keyboard accessible with arrow keys
- Touch/swipe friendly

## See Also

Link to demo: [View Demo](./carousel-reel.html)
