# <image-gallery>

Thumbnail grid with lightbox viewer. Progressive enhancement: thumbnails link to full images without JS. With JS, opens a native <dialog> lightbox with prev/next, keyboard (direction-aware), swipe, and View Transitions.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/image-gallery/
- Vanilla Breeze 0.7.4

## Example

```html
<image-gallery>
  <a href="photos/full-1.jpg">
    <img src="photos/thumb-1.jpg" alt="Mountain landscape" loading="lazy" />
  </a>
  <a href="photos/full-2.jpg">
    <img src="photos/thumb-2.jpg" alt="Ocean sunset" loading="lazy" />
  </a>
</image-gallery>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `100px`, `150px`, `200px`, `250px`, `300px` | `200px` | Minimum column width for the thumbnail grid. |
| `gap` | `none`, `xs`, `s`, `m`, `l`, `xl` | `s` | Gap between thumbnails. |
| `ratio` | `1`, `4:3`, `3:2`, `16:9`, `3:4`, `auto` | `1` | Aspect ratio for thumbnail images. |
| `controls` | `edge`, `bar`, `minimal` | `edge` | Lightbox control layout. 'edge' puts prev/next on the sides with a floating header, 'bar' moves prev/next into the top bar, 'minimal' shows close only (swipe/keyboard to navigate). Changing it rebuilds the lightbox on next open. |
| `loop` | boolean |  | Wrap navigation at first/last image. |
| `captions` | `auto`, `overlay`, `hidden` | `auto` | Caption display in the lightbox. 'auto' adds an info button in a footer that toggles the caption text (hidden attribute), 'overlay' shows the caption under the image, 'hidden' suppresses it. Changing it rebuilds the lightbox on next open. |
| `transition` | `morph`, `fade`, `none` | `morph` | View Transition type. 'morph' animates thumbnail to full image, 'fade' cross-fades, 'none' disables. |
| `data-label-dialog` | string | `Image viewer` | Accessible name of the lightbox dialog. |
| `data-label-close` | string | `Close gallery` | Close button name. |
| `data-label-prev` | string | `Previous image` | Previous button name. |
| `data-label-next` | string | `Next image` | Next button name. |
| `data-label-show-details` | string | `Show image details` | Info button name while the caption is collapsed (captions="auto"). |
| `data-label-hide-details` | string | `Hide image details` | Info button name while the caption is expanded (captions="auto"). |
| `data-label-counter` | string | `Image {n} of {total}` | Counter text template; {n} and {total} are replaced. Announced on navigation when the image has no alt text. |
| `data-label-announce` | string | `{alt}, {n} of {total}` | Text announced politely when the lightbox image changes; {alt}, {n} and {total} are replaced. |

## Structure

| Child | Description |
| --- | --- |
| `<a href="full.jpg">` | Image-only item: anchor wrapping a thumbnail img. |
| `<figure>` | Rich item: figure wrapping an anchor and figcaption. |
| `<img>` | Thumbnail image inside anchor. src is the thumbnail, parent anchor href is the full image. |
| `<figcaption>` | Optional caption inside figure. Supports HTML including links; its nodes are cloned into the lightbox. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `image-gallery:images-changed` | `{ images, source: 'property' }` | Fired after the images setter rebuilds the gallery. |

## Methods

| Method | Description |
| --- | --- |
| `open(index)` | Open the lightbox at a zero-based index (no-op when out of range). |
| `close()` | Close the lightbox (with the morph transition when enabled). |
| `next()` | Show the next image (wraps with loop). |
| `prev()` | Show the previous image (wraps with loop). |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `images` | `Array<{ href, thumbSrc, alt?, caption? }>` | Get the image set (caption is a string for text-only captions, a cloned DocumentFragment for markup, or null) or assign one to rebuild the thumbnails. String captions render as text, never HTML; pass a Node, DocumentFragment or <template> for rich captions. Assigning closes an open lightbox and fires image-gallery:images-changed with source 'property'. |

## Accessibility

- Pattern: Native dialog
- You provide: Thumbnail links that each contain an <img> with alt text
- The component manages: `aria-label`, `aria-expanded`, `aria-controls`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` | Open the lightbox at that image | Native behaviour of a (a thumbnail link) |
| `ArrowRight` | Show the next image (reversed in right-to-left) | Lightbox open |
| `ArrowLeft` | Show the previous image (reversed in right-to-left) | Lightbox open |
| `Home` | Show the first image | Lightbox open |
| `End` | Show the last image | Lightbox open |
| `Escape` | Close the lightbox | Native behaviour of dialog |
