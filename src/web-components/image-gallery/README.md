# image-gallery

Thumbnail grid with lightbox viewer. Progressive enhancement at every layer.

## No-JS Baseline

Without JavaScript, `<a href>` thumbnails link directly to full images. CSS provides a responsive auto-fit grid with aspect-ratio thumbnails and hover zoom hints.

## Platform APIs

- **`<dialog>`** — native modal for lightbox (top-layer, focus trap, `::backdrop`, Escape)
- **`commandfor`/`command="close"`** — Invokers API on close button (declarative close)
- **`popovertarget`** — Popover API on info button (toggles caption details)
- **View Transitions** — morph thumbnail to full image on open, fade between images

## Authoring

### Image-only

```html
<image-gallery>
  <a href="full.jpg"><img src="thumb.jpg" alt="..." loading="lazy" /></a>
</image-gallery>
```

### With captions

```html
<image-gallery>
  <figure>
    <a href="full.jpg"><img src="thumb.jpg" alt="..." loading="lazy" /></a>
    <figcaption>Caption with <a href="/link">link</a></figcaption>
  </figure>
</image-gallery>
```

## Attributes

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| columns | 100px-300px | 200px | Min column width |
| gap | none, xs, s, m, l, xl | s | Grid gap |
| ratio | 1, 4:3, 3:2, 16:9, 3:4, auto | 1 | Thumbnail aspect-ratio |
| loop | boolean | — | Wrap at ends |
| captions | auto, overlay, hidden | auto | Caption mode in lightbox |
| transition | morph, fade, none | morph | View Transition type |

## Keyboard

| Key | Action |
|-----|--------|
| ArrowLeft | Previous image |
| ArrowRight | Next image |
| Home | First image |
| End | Last image |
| Escape | Close lightbox (native dialog) |
