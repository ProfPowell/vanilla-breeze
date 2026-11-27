# <text-reader>

Text-to-speech reader with word-level highlighting (Web Speech API + CSS Custom Highlight API)

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/text-reader/
- Vanilla Breeze 0.7.4

## Example

```html
<text-reader for="my-article" speed="1"></text-reader>

<article id="my-article">
  <p>The web platform has evolved dramatically over the past decade.
     Modern browsers now support features that previously required
     complex JavaScript libraries or plugins.</p>
  <p>Progressive enhancement remains the most resilient approach
     to building for the web.</p>
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `for` | string |  | ID of the element to read (required) |
| `variant` | `icon` |  | "icon" renders a compact speaker trigger with a floating mini-toolbar instead of the full control bar |
| `selectors` | string |  | Comma-separated selectors for text extraction (default: "p,li") |
| `speed` | number |  | Playback rate 0.5–2 (default: 1) |
| `voice` | string |  | voiceURI to pre-select |
| `highlight` | string |  | Set to "false" to disable word highlighting |
| `scroll` | string |  | Set to "false" to disable auto-scroll |
| `data-label-play` | string | `Play` | Play button label (i18n override) |
| `data-label-pause` | string | `Pause` | Pause button label (i18n override) |
| `data-label-stop` | string | `Stop` | Stop button label (i18n override) |
| `data-label-reader` | string | `Article reader` | Control-bar group label and icon trigger label (i18n override) |
| `data-label-controls` | string | `Reader controls` | Icon-variant toolbar group label (i18n override) |
| `data-label-voice` | string | `Voice` | Voice select label (i18n override) |
| `data-label-loading-voices` | string | `Loading voices…` | Voice select placeholder while voices load (i18n override) |
| `data-label-speed` | string | `Speed` | Speed slider label (i18n override) |
| `data-label-slower` | string | `Slower` | Icon-toolbar slower button label (i18n override) |
| `data-label-faster` | string | `Faster` | Icon-toolbar faster button label (i18n override) |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `slot` | direct child | `icon-play`, `icon-pause`, `icon-stop`, `icon-trigger` |  | Moves the element into the matching generated button (icon-trigger: icon variant only); restored on disconnect |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `text-reader:play` | `{ voice, speed }` | Speech started |
| `text-reader:pause` | `{}` | Speech paused |
| `text-reader:resume` | `{}` | Speech resumed |
| `text-reader:stop` | `{}` | Speech stopped by stop(), a target change, or another reader taking over the speech queue |
| `text-reader:end` | `{ duration }` | Reached the end of the text (duration in ms) |
| `text-reader:word` | `{ word, charIndex, element }` | Word boundary reached |
| `text-reader:error` | `{ error }` | SpeechSynthesisUtterance error (also logged with console.warn) |

## Methods

| Method | Description |
| --- | --- |
| `play()` | Start reading from the beginning (re-extracts the target text), or resume if paused |
| `pause()` | Pause speech |
| `resume()` | Resume paused speech |
| `stop()` | Cancel speech and reset; no-op when this reader is not speaking |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `voices` | `Promise<SpeechSynthesisVoice[]>` | Available voices |
| `speaking` | `boolean` | Speech is active (including paused) |
| `paused` | `boolean` | Speech is paused |
| `progress` | `number` | Position as a 0–1 fraction of the extracted text |

## Accessibility

- Pattern: Native form controls
- The component manages: `role="group"`, `aria-label`, `aria-pressed`, `aria-hidden`, `hidden`, `popover`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Hide the floating toolbar and move focus to the trigger | variant="icon" with the toolbar showing, focus on the trigger or inside the toolbar |
