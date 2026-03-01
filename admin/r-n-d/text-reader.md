# `<text-reader>` Component Specification

## Overview

A zero-dependency custom element that attaches a TTS reading control bar to any article element. Uses the Web Speech API for synthesis and the CSS Custom Highlight API for word tracking. Designed as a progressive enhancement — if the browser doesn't support either API, the element stays silent and hidden.

---

## Element Name

```html
<text-reader for="article-body"></text-reader>
```

---

## Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `for` | string | — | ID of the article element to read. Required. |
| `selectors` | string | `p,li` | Comma-separated list of selectors to extract text from within the target element |
| `speed` | number | `1` | Initial playback rate (0.1–10) |
| `voice` | string | — | Initial `voiceURI` to select on load |
| `highlight` | boolean | `true` | Whether to use CSS Custom Highlight API for word tracking |
| `scroll` | boolean | `true` | Whether to scroll active word into view |
| `label-play` | string | `Play` | Accessible label for play button |
| `label-pause` | string | `Pause` | Accessible label for pause button |
| `label-stop` | string | `Stop` | Accessible label for stop button |

---

## Observed Attributes → Reactive Behavior

- `speed` change mid-read → restart from `currentCharIndex`
- `voice` change mid-read → restart from `currentCharIndex`
- `for` change → re-initialize target, stop current speech

---

## Internal Structure (Shadow DOM)

```html
<div part="controls" role="group" aria-label="Article reader">

  <button part="button play" aria-label="Play">
    <slot name="icon-play">▶</slot>
  </button>

  <button part="button pause" aria-label="Pause" hidden>
    <slot name="icon-pause">⏸</slot>
  </button>

  <button part="button stop" aria-label="Stop">
    <slot name="icon-stop">⏹</slot>
  </button>

  <select part="select voices" aria-label="Voice"></select>

  <label part="speed-label">
    <span part="speed-value">1×</span>
    <input part="speed-input" type="range" min="0.5" max="2" step="0.1" value="1">
  </label>

</div>
```

The element renders into a **shadow DOM** so its controls are encapsulated. The highlighted text lives in the **light DOM** (the article), styled via `::highlight(text-reader-word)` which the component injects into an adopted stylesheet.

---

## CSS Parts (for external styling)

```css
text-reader::part(controls) { }
text-reader::part(button) { }
text-reader::part(play) { }
text-reader::part(pause) { }
text-reader::part(stop) { }
text-reader::part(select voices) { }
text-reader::part(speed-input) { }
text-reader::part(speed-value) { }
```

---

## CSS Custom Properties (theming)

```css
text-reader {
  --text-reader-bg: transparent;
  --text-reader-gap: 0.5rem;
  --text-reader-button-size: 2rem;
}

/* highlight applied to document, not shadow */
::highlight(text-reader-word) {
  background-color: var(--text-reader-highlight, Mark);
  color: var(--text-reader-highlight-text, MarkText);
}
```

Using system colors `Mark`/`MarkText` as defaults respects user contrast preferences out of the box.

---

## JavaScript API (public methods/properties)

```js
const reader = document.querySelector('text-reader');

reader.play()      // begin or resume
reader.pause()     // pause mid-sentence
reader.resume()    // resume from pause
reader.stop()      // cancel, reset position

reader.voices      // Promise<SpeechSynthesisVoice[]>
reader.speaking    // boolean (read-only)
reader.paused      // boolean (read-only)
reader.progress    // 0–1 (read-only, charIndex / fullText.length)
```

---

## Events (dispatched on the element)

| Event | Detail | When |
|---|---|---|
| `text-reader:play` | `{ voice, speed }` | Speech starts |
| `text-reader:pause` | — | Speech paused |
| `text-reader:resume` | — | Speech resumed |
| `text-reader:stop` | — | Stopped or cancelled |
| `text-reader:end` | `{ duration }` | Naturally completed |
| `text-reader:word` | `{ word, charIndex, element }` | Each word boundary |
| `text-reader:error` | `{ error }` | SpeechSynthesis error |

---

## Text Extraction Logic

1. Query all `[selectors]` within `#[for]`, excluding anything inside `pre`, `code`, `[aria-hidden]`
2. Build flat paragraph map: `[{ element, text, speechStart, speechEnd }]`
3. Concatenate with single space separators → `fullText`
4. On `boundary` event: use `charIndex` to find the paragraph via binary search on `speechStart/speechEnd`, then find the text node and local offset via `TreeWalker`

---

## Highlight Injection Strategy

The component adopts a `CSSStyleSheet` into `document.adoptedStyleSheets` (not shadow), so `::highlight(text-reader-word)` applies to the light DOM article. This is the only way to style `CSS.highlights` ranges — `::highlight` does not pierce shadow DOM.

```js
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  ::highlight(text-reader-word) {
    background-color: var(--text-reader-highlight, Mark);
    color: var(--text-reader-highlight-text, MarkText);
  }
`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
```

---

## Progressive Enhancement / Graceful Degradation

| Condition | Behavior |
|---|---|
| No `speechSynthesis` | Element hides itself (`display:none`), no error thrown |
| No `CSS.highlights` | Speech still works, word highlighting skipped |
| No `for` target found | Warn to console, disable controls |
| Mid-article navigation | `beforeunload` → `speechSynthesis.cancel()` |
| Chrome long-text bug | Keep-alive: `setInterval` pause/resume every 10s while speaking |

---

## Chrome Keep-Alive Implementation Detail

Chrome silently stops synthesis on long texts. Workaround runs on an interval while speech is active:

```js
#keepAlive = null;

#startKeepAlive() {
  this.#keepAlive = setInterval(() => {
    if (!speechSynthesis.speaking) {
      this.#stopKeepAlive();
      return;
    }
    speechSynthesis.pause();
    speechSynthesis.resume();
  }, 10_000);
}

#stopKeepAlive() {
  clearInterval(this.#keepAlive);
  this.#keepAlive = null;
}
```

---

## File Structure

```
text-reader/
  text-reader.js      ← single-file custom element (no build step)
  text-reader.css     ← optional default theme
  README.md
```

Ships as a native ES module. No build step required.

```js
import 'text-reader/text-reader.js';
```

Or via script tag:

```html
<script type="module" src="text-reader.js"></script>
```

---

## Minimal Usage Example

```html
<text-reader for="post-body" speed="1.1"></text-reader>

<article id="post-body">
  <p>...</p>
</article>
```

## Customized Icon Slots Example

```html
<text-reader for="post-body">
  <svg slot="icon-play" aria-hidden="true">...</svg>
  <svg slot="icon-pause" aria-hidden="true">...</svg>
  <svg slot="icon-stop" aria-hidden="true">...</svg>
</text-reader>
```

## Full Theming Example

```css
text-reader {
  --text-reader-bg: #f5f5f5;
  --text-reader-gap: 0.75rem;
  --text-reader-button-size: 2.5rem;
  --text-reader-highlight: #ffe066;
  --text-reader-highlight-text: #000;
}

text-reader::part(controls) {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--text-reader-bg);
}

text-reader::part(button) {
  border: none;
  cursor: pointer;
  width: var(--text-reader-button-size);
  height: var(--text-reader-button-size);
}
```

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Notes |
|---|---|---|---|---|
| Web Speech API | ✅ 33+ | ✅ 49+ | ✅ 7+ | Core feature |
| CSS Custom Highlight API | ✅ 105+ | ✅ 117+ | ✅ 17.2+ | Word highlight only |
| Shadow DOM / Custom Elements | ✅ | ✅ | ✅ | Baseline 2022 |
| `adoptedStyleSheets` | ✅ | ✅ | ✅ 16.4+ | Highlight injection |

The component functions in all modern browsers. Word highlighting degrades gracefully in older environments.

---

## Reference Implementations Surveyed

- **blog.damato.design** — bespoke ES class (not a custom element) that inspired this spec; uses `CSS.highlights` + paragraph map + restart-from-position
- **Microsoft Edge Demos / reader** — demonstrates `CSS.highlights` for search, not TTS
- **react-text-to-speech** — React only, word highlighting via DOM mutation not `CSS.highlights`
- **react-readalong-component** — React only, 2015 vintage, no `CSS.highlights`

No existing standalone web component was found that combines Web Speech API synthesis with CSS Custom Highlight API word tracking.