# <carousel-wc>

Scrolling carousel with autoplay, looping, indicators, and view transitions

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/carousel/
- Vanilla Breeze 0.7.4

## Example

```html
<carousel-wc aria-label="Product photos">
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
</carousel-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `autoplay` | boolean |  | Auto-advance slides and render a pause/play rotation control (ignored under reduced motion) |
| `autoplay-delay` | number |  | Delay between auto-advance in milliseconds (default 5000) |
| `loop` | boolean |  | Loop back to start after last slide |
| `indicators` | string |  | Show dot indicators; "false" hides them |
| `item-width` | string |  | Slide width: "full" (default), "auto" (content width), or a CSS length such as "18rem" |
| `gap` | `xs`, `s`, `m`, `l`, `xl` |  | Gap between slides |
| `start` | number |  | Initial slide index |
| `persist` | string |  | localStorage key for position persistence |
| `transition` | `fade`, `slide`, `scale` |  | View Transition animation between slides |
| `data-label-track` | string | `Slides` | Accessible name of the focusable slide track |

## Structure

| Child | Description |
| --- | --- |
| `any child elements` | Each direct child becomes a slide |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `carousel-wc:change` | `{ index, slide }` | Fired once per slide change (scroll settling is debounced) |
| `carousel-wc:play` |  | Fired when the autoplay timer starts or resumes (including after a hover/focus suspension ends) |
| `carousel-wc:pause` |  | Fired when the autoplay timer stops: explicit pause, or a hover/focus/touch suspension |
| `carousel-wc:slides-changed` | `{ slides, source: 'property' }` | Fired after the slides property rebuilds the carousel |

## Methods

| Method | Description |
| --- | --- |
| `next()` | Go to the next slide (wraps with loop) |
| `prev()` | Go to the previous slide (wraps with loop) |
| `goTo(index, smooth = true)` | Jump to a slide; out-of-range indexes are ignored |
| `play()` | Start or resume rotation; overrides a hover/focus suspension. No-op under reduced motion |
| `pause()` | Stop rotation until play() or the rotation control resumes it |
| `reset()` | Return to the start slide and clear persistence |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `currentIndex` | `number` | Current slide index (read-only) |
| `slideCount` | `number` | Number of slides (read-only) |
| `playing` | `boolean` | Whether the autoplay timer is running right now (read-only; false while suspended by hover/focus) |
| `slides` | `Array<{ id?, html, label? }>` | Get the slides as data, or assign records to rebuild the carousel |

## Accessibility

- Pattern: Carousel
- You provide: An aria-label on the carousel when the default "Carousel" does not describe it; an aria-label on a slide replaces the generated "n of total"; data-label-track renames the slide track (default "Slides")
- The component manages: `role="region"`, `role="group"`, `aria-roledescription`, `aria-label`, `aria-current`, `aria-live`, `aria-atomic`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowRight` | Go to the next slide (reversed in right-to-left) | Focus on the slide track |
| `ArrowLeft` | Go to the previous slide (reversed in right-to-left) | Focus on the slide track |
| `Home` | Go to the first slide | Focus on the slide track |
| `End` | Go to the last slide | Focus on the slide track |
