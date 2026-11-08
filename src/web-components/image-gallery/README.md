# image-gallery

Thumbnail grid with lightbox viewer. Progressive enhancement at every layer.

## No-JS Baseline

Without JavaScript, `<a href>` thumbnails link directly to full images. CSS provides a responsive auto-fit grid with aspect-ratio thumbnails and hover zoom hints.

## Platform APIs

- **`<dialog>`** — native modal for lightbox (top-layer, focus trap, focus return, `::backdrop`, Escape), built by JS on first open
- **`hidden` + `aria-expanded`** — info button in the caption footer toggles the caption text
- **View Transitions** — morph thumbnail to full image on open/close, fade between images

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
| controls | edge, bar, minimal | edge | Lightbox control layout |
| loop | boolean | — | Wrap at ends |
| captions | auto, overlay, hidden | auto | Caption mode in lightbox (auto = footer info toggle) |
| transition | morph, fade, none | morph | View Transition type |
| data-label-dialog / -close / -prev / -next / -show-details / -hide-details | string | English | UI strings |
| data-label-counter | string | `Image {n} of {total}` | Counter template |

## JavaScript API

- `images` — get/set `{ href, thumbSrc, alt, caption }[]`. String captions render as text (never HTML); pass a Node, DocumentFragment or `<template>` for rich captions. Setting closes an open lightbox and fires `image-gallery:images-changed` `{ images, source: 'property' }`.
- `open(index)`, `close()`, `next()`, `prev()`.

## Keyboard

| Key | Action |
|-----|--------|
| ArrowLeft | Previous image (next in RTL) |
| ArrowRight | Next image (previous in RTL) |
| Home | First image |
| End | Last image |
| Escape | Close lightbox (native dialog) |
