---
title: youtube-embed Web Component — Planning Document
description: Design specification for a lightweight YouTube embed web component in the Vanilla Breeze system
date: 2026-03-03
tags:
  - vanilla-breeze
  - web-components
  - media
  - specification
status: draft
---

# `youtube-embed` Web Component — Planning Document

A lightweight, accessible YouTube embed component that follows the Vanilla Breeze HTML-first, CSS-second, JS-third philosophy. Prioritises performance via the facade pattern — no iframe is loaded until the user explicitly requests playback.

## Table of Contents

- [Rationale](#rationale)
- [Architecture decision](#architecture-decision)
- [Component API](#component-api)
- [Variants](#variants)
- [HTML structure](#html-structure)
- [Progressive enhancement strategy](#progressive-enhancement-strategy)
- [CSS design](#css-design)
- [JavaScript design](#javascript-design)
- [Accessibility](#accessibility)
- [Performance contract](#performance-contract)
- [Compendium entry](#compendium-entry)
- [File structure](#file-structure)
- [Open questions](#open-questions)

---

## Rationale

A raw YouTube `<iframe>` embed loads ~500 KB of JavaScript and fires dozens of network requests on page load regardless of whether the user ever plays the video. A facade-based web component defers all of that until click, keeping the page fast. The component also provides a consistent, token-driven visual appearance that integrates with the existing Vanilla Breeze `video` native-element styles and layout system.

---

## Architecture decision

**Facade pattern (recommended)** — render a thumbnail image with a custom play button overlay. On click, replace the facade with a real `<iframe>` that autoplays. This is the approach popularised by [lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed) but implemented as a native web component with zero external dependencies and full Vanilla Breeze integration.

**Rejected alternatives:**

- Raw `<iframe>` — unacceptable performance cost on page load.
- Intersection Observer lazy-load — still loads iframe before user intent.
- Shadow DOM — would prevent token inheritance and require style duplication. Use light DOM instead.

---

## Component API

### Tag name

```html
<youtube-embed data-id="dQw4w9WgXcQ"></youtube-embed>
```

### Data attributes

| Attribute | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `data-id` | ✓ | string | — | YouTube video ID |
| `data-title` | ✓ | string | `"Play video"` | Accessible title for iframe + play button |
| `data-start` | — | integer | `0` | Start playback at N seconds |
| `data-list` | — | string | — | YouTube playlist ID |
| `data-params` | — | string | — | Raw query string appended to embed URL (escape hatch) |
| `data-autoplay` | — | boolean attr | false | Auto-initialise iframe on load (no facade) — use sparingly |
| `data-thumbnail` | — | `hq` \| `mq` \| `sd` \| `maxres` | `hq` | Thumbnail resolution |

### CSS classes (inherited from `video` native element)

Classes applied to the host element follow the existing video styling vocabulary:

| Class | Effect |
|-------|--------|
| `widescreen` | aspect-ratio 16/9 (default) |
| `standard` | aspect-ratio 4/3 |
| `ultrawide` | aspect-ratio 21/9 |
| `rounded` | border-radius token `--radius-m` |
| `full` | inline-size: 100% |

No new CSS classes are invented. The component inherits the video element's aspect-ratio and shape utilities by applying them to the host element itself.

---

## Variants

These map directly to compendium entries.

| ID | Name | Notes |
|----|------|-------|
| `default` | Default (Widescreen) | Bare minimum usage |
| `rounded` | Rounded | `class="rounded"` on host |
| `with-caption` | With Caption | `<figcaption>` slot inside `<figure>` wrapper |
| `standard` | Standard 4:3 | `class="standard"` |
| `playlist` | Playlist | `data-list` provided |
| `autoplay` | Autoplay | `data-autoplay` — iframe loads immediately |

---

## HTML structure

### Authored markup (minimal)

```html
<youtube-embed data-id="dQw4w9WgXcQ" data-title="Rick Astley — Never Gonna Give You Up"></youtube-embed>
```

### Authored markup (with caption)

```html
<figure>
  <youtube-embed
    data-id="dQw4w9WgXcQ"
    data-title="Rick Astley — Never Gonna Give You Up"
    class="rounded widescreen"
  ></youtube-embed>
  <figcaption>Never Gonna Give You Up, Rick Astley (1987)</figcaption>
</figure>
```

### Component-rendered DOM (facade state, light DOM)

The component renders directly into its own light DOM — no shadow root — so tokens, resets and utility classes all apply without re-declaration.

```html
<youtube-embed data-id="dQw4w9WgXcQ" data-title="..." data-state="ready">
  <img
    src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    alt=""
    loading="lazy"
    decoding="async"
  >
  <button type="button" aria-label="Play Rick Astley — Never Gonna Give You Up">
    <svg aria-hidden="true" focusable="false"><!-- play icon --></svg>
  </button>
</youtube-embed>
```

### Component-rendered DOM (active state, after click)

```html
<youtube-embed data-id="dQw4w9WgXcQ" data-title="..." data-state="active">
  <iframe
    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&start=0"
    title="Rick Astley — Never Gonna Give You Up"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    loading="lazy"
  ></iframe>
</youtube-embed>
```

> **Privacy:** Uses `youtube-nocookie.com` by default. No cookies set until user clicks play.

---

## Progressive enhancement strategy

| Scenario | Behaviour |
|----------|-----------|
| No JS | Renders as a plain anchor: `<a href="https://youtu.be/{id}">{title}</a>` inside the element. User lands on YouTube. |
| JS, before upgrade | The `<a>` fallback is visible momentarily. |
| JS, after upgrade | Facade (thumbnail + play button) replaces the anchor. |
| After click | Iframe replaces facade; video autoplays. |
| `data-autoplay` present | Iframe rendered immediately on `connectedCallback`, no facade step. |

The fallback `<a>` is authored in the HTML or injected as the first step of `connectedCallback`, ensuring crawlability and no-JS usability.

---

## CSS design

**Layer:** `@layer web-components`

**File:** `src/web-components/youtube-embed/styles.css`

### Key rules

```css
@layer web-components {
  youtube-embed {
    /* Establish positioning context for the play button */
    display: block;
    position: relative;
    /* Inherit aspect-ratio from video classes — widescreen is default */
    aspect-ratio: 16 / 9;
    background: var(--color-gray-900);
    overflow: hidden;
    cursor: pointer;

    /* Remove default aspect-ratio when an explicit class is applied
       — the video native-element rules handle it from there */
  }

  youtube-embed img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    display: block;
    /* Letterbox fade to match YouTube's own thumbnail style */
    transition: opacity var(--duration-fast) var(--ease-default);
  }

  youtube-embed:hover img,
  youtube-embed:focus-within img {
    opacity: 0.85;
  }

  /* Play button */
  youtube-embed button {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    translate: -50% -50%;
    /* Styled as a YouTube-style pill — use tokens */
    background: var(--color-danger, #f00);
    color: #fff;
    border: none;
    border-radius: var(--radius-s);
    padding: var(--size-s) var(--size-m);
    display: flex;
    align-items: center;
    gap: var(--size-xs);
    cursor: pointer;
    transition:
      scale var(--duration-fast) var(--ease-default),
      background var(--duration-fast) var(--ease-default);
  }

  youtube-embed button:hover,
  youtube-embed button:focus-visible {
    scale: 1.08;
    background: var(--color-danger-dark, #c00);
  }

  /* Active state — fill with iframe */
  youtube-embed[data-state="active"] {
    cursor: auto;
  }

  youtube-embed iframe {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    border: none;
  }

  /* No-JS / pre-upgrade fallback link */
  youtube-embed a {
    display: flex;
    align-items: center;
    justify-content: center;
    block-size: 100%;
    inline-size: 100%;
    color: var(--color-text-inverse);
    text-decoration: underline;
  }
}
```

---

## JavaScript design

**File:** `src/web-components/youtube-embed/element.js`

### Class outline

```javascript
class YouTubeEmbed extends HTMLElement {
  // Private fields
  #id;
  #title;
  #params;

  connectedCallback() {
    this.#id = this.dataset.id;
    this.#title = this.dataset.title ?? 'Play video';

    if (!this.#id) return; // bail gracefully

    if (this.hasAttribute('data-autoplay')) {
      this.#activate();
    } else {
      this.#renderFacade();
    }
  }

  disconnectedCallback() {
    // Clean up click listener if needed (delegated so likely none)
  }

  #buildEmbedURL() {
    const base = `https://www.youtube-nocookie.com/embed/${this.#id}`;
    const params = new URLSearchParams({
      autoplay: '1',
      start: this.dataset.start ?? '0',
      ...(this.dataset.list ? { list: this.dataset.list } : {}),
    });
    if (this.dataset.params) {
      new URLSearchParams(this.dataset.params)
        .forEach((v, k) => params.set(k, v));
    }
    return `${base}?${params}`;
  }

  #thumbnailURL() {
    const res = this.dataset.thumbnail ?? 'hq';
    const map = { hq: 'hqdefault', mq: 'mqdefault', sd: 'sddefault', maxres: 'maxresdefault' };
    return `https://i.ytimg.com/vi/${this.#id}/${map[res] ?? 'hqdefault'}.jpg`;
  }

  #renderFacade() {
    this.dataset.state = 'ready';
    this.innerHTML = `
      <img src="${this.#thumbnailURL()}" alt="" loading="lazy" decoding="async">
      <button type="button" aria-label="Play ${this.#title}">
        <!-- SVG play icon inline -->
      </button>
    `;
    this.addEventListener('click', () => this.#activate(), { once: true });
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') this.#activate();
    }, { once: true });
  }

  #activate() {
    this.dataset.state = 'active';
    this.innerHTML = `
      <iframe
        src="${this.#buildEmbedURL()}"
        title="${this.#title}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
      ></iframe>
    `;
    // Move focus to iframe for keyboard users
    this.querySelector('iframe')?.focus();
  }
}

customElements.define('youtube-embed', YouTubeEmbed);
```

### Design notes

- Light DOM only — no shadow root. Tokens and utility classes apply naturally.
- `innerHTML` is safe here because `data-id` and `data-title` are authored values, not user input. Sanitise if ever driven by dynamic/API data.
- Uses `{ once: true }` on event listeners — no manual cleanup needed.
- Keyboard: host element should receive `tabindex="0"` in the facade state so keyboard users can activate it. Set and remove programmatically alongside `data-state`.

---

## Accessibility

| Concern | Solution |
|---------|----------|
| Thumbnail image | `alt=""` — decorative, title is on the button |
| Play button label | `aria-label="Play {data-title}"` |
| Keyboard activation | Host gets `tabindex="0"` in facade state; Enter/Space activates |
| Iframe title | `title="{data-title}"` on the iframe |
| Focus management | After activation, focus is moved to the iframe |
| No-JS fallback | Visible anchor with meaningful text |
| Reduced motion | No animations that would violate `prefers-reduced-motion` (transitions only, no auto-play animation) |

---

## Performance contract

| Metric | Target |
|--------|--------|
| Bytes added to page (before click) | < 2 KB JS + < 1 KB CSS |
| Network requests before click | 1 (thumbnail image only) |
| Network requests after click | YouTube-managed (same as raw iframe) |
| iframe load trigger | User click / keyboard activation only (unless `data-autoplay`) |

---

## Compendium entry

```json
{
  "id": "youtube-embed",
  "tag": "youtube-embed",
  "type": "web-component",
  "category": "media",
  "cssFile": "src/web-components/youtube-embed/styles.css",
  "jsRequired": true,
  "variants": [
    {
      "id": "default",
      "name": "Default (Widescreen)",
      "interactive": true,
      "setup": "await new Promise(r => setTimeout(r, 300));",
      "html": "<youtube-embed data-id=\"dQw4w9WgXcQ\" data-title=\"Rick Astley — Never Gonna Give You Up\"></youtube-embed>"
    },
    {
      "id": "rounded",
      "name": "Rounded",
      "interactive": true,
      "html": "<youtube-embed class=\"rounded\" data-id=\"dQw4w9WgXcQ\" data-title=\"Rick Astley — Never Gonna Give You Up\"></youtube-embed>"
    },
    {
      "id": "with-caption",
      "name": "With Caption",
      "interactive": true,
      "html": "<figure>\n  <youtube-embed data-id=\"dQw4w9WgXcQ\" data-title=\"Rick Astley — Never Gonna Give You Up\"></youtube-embed>\n  <figcaption>Never Gonna Give You Up — Rick Astley (1987)</figcaption>\n</figure>"
    },
    {
      "id": "standard",
      "name": "Standard 4:3",
      "interactive": true,
      "html": "<youtube-embed class=\"standard\" data-id=\"dQw4w9WgXcQ\" data-title=\"Rick Astley — Never Gonna Give You Up\"></youtube-embed>"
    },
    {
      "id": "playlist",
      "name": "Playlist",
      "interactive": true,
      "html": "<youtube-embed data-id=\"dQw4w9WgXcQ\" data-list=\"PLbpi6ZahtOH6Ar_3GPy3j-g4s4zu4jOeJ\" data-title=\"Playlist example\"></youtube-embed>"
    }
  ]
}
```

---

## File structure

```
src/web-components/youtube-embed/
├── element.js          # Web component class + customElements.define
└── styles.css          # @layer web-components scoped styles
```

Registered in:

- `src/web-components/index.css` — `@import ./youtube-embed/styles.css`
- `src/web-components/index.js` — `import ./youtube-embed/element.js`

---

## Open questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Should `data-autoplay` still use `youtube-nocookie.com`? | Yes / No | Yes — privacy-first regardless |
| 2 | Should the play button use a Lucide icon or an inline SVG? | Lucide `icon-wc` / inline SVG | Inline SVG to avoid dependency on `icon-wc` loading order |
| 3 | Should `data-title` be required (warn in console if missing)? | Hard warn / soft warn / silent | Console warn in dev, silent in prod |
| 4 | Thumbnail fallback if `maxresdefault` 404s? | Retry lower res / show placeholder | Out of scope for v1 — `hq` is always present |
| 5 | Should the component observe attribute changes (e.g. swapping `data-id`)? | Yes (attributeChangedCallback) / No | No for v1 — keep simple; re-render on reconnect is sufficient |
| 6 | Playlist vs single video: should `data-list` without `data-id` be valid? | Yes (use list's first video) / No | No for v1 — require `data-id` always |