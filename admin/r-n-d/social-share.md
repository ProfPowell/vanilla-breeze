---
title: share-wc — Social Share Web Component
description: Specification for a configurable social share web component for Vanilla Breeze
category: web-components
status: implementing
---

# `share-wc` — Social Share Web Component

A configurable social share component that uses the native **Web Share API** on supported platforms and falls back to individually targeted share links on desktop. Progressive enhancement through three tiers: semantic links (no JS), enhanced buttons (JS, no Share API), native sheet (JS + Share API).

## Table of Contents

- [Design Principles](#design-principles)
- [Platform Strategy](#platform-strategy)
- [API](#api)
- [Markup Patterns](#markup-patterns)
- [Behaviour](#behaviour)
- [CSS Architecture](#css-architecture)
- [Accessibility](#accessibility)
- [File Structure](#file-structure)
- [Compendium Entry](#compendium-entry)
- [Open Questions](#open-questions)

---

## Design Principles

1. **Native Share API first** — `navigator.share()` on mobile surfaces the OS-native share sheet, which reaches every installed app (Messages, WhatsApp, Notes, AirDrop, etc.) without the component needing to know about them.
2. **Progressive enhancement** — Without JS the component renders plain `<a>` links that open share URLs. This is the functional baseline.
3. **Author controls what matters** — URL, title, and text come from attributes; platforms listed in `data-platforms` or slotted manually. Sane defaults auto-read from `<head>`.
4. **CSS only for styling** — No layout or visual decisions in the JS layer; all states driven by `data-*` attributes and CSS.
5. **Zero dependencies** — Web Share API, Clipboard API, and `<a>` elements cover everything.

---

## Platform Strategy

### Tier 1 — `navigator.share()` (mobile + supported desktop)

When `navigator.share` is available, the component renders a **single trigger button**. Clicking it calls `navigator.share({ url, title, text })`, delegating entirely to the OS. No platform list is shown.

```
navigator.canShare()   →  true  →  render single "Share" button
```

This is the optimal mobile experience: AirDrop, iMessage, WhatsApp, Telegram, Instagram, Reminders — everything — without the component knowing about them.

### Tier 2 — Explicit platform buttons (desktop / no Share API)

When `navigator.share` is unavailable, the component renders a button per platform from `data-platforms`. Each button opens a new tab via `window.open()` using constructed share URLs.

### Tier 3 — Static `<a>` links (no JS)

Without JavaScript the light DOM renders as plain anchor tags. They open native app URIs or web fallback URLs in a new tab.

---

## API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-url` | string | `document.location.href` | URL to share |
| `data-title` | string | `document.title` | Share title |
| `data-text` | string | OG description or `""` | Share text / description |
| `data-platforms` | string | `"twitter,facebook,linkedin,whatsapp,email,copy"` | Comma-separated platform list (Tier 2 only) |
| `data-variant` | string | `"icon-label"` | Visual variant: `icon`, `label`, `icon-label` |
| `data-size` | string | `"m"` | Button size: `s`, `m`, `l` |
| `data-label` | string | `"Share"` | Label for the Tier 1 native share button |
| `data-color` | boolean | absent | Present = use platform brand colours |

### Properties (JS)

```javascript
element.url    // get/set current share URL
element.title  // get/set current share title
element.text   // get/set current share text
element.share()// programmatically trigger share
```

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `share:open` | `{ platform }` | Fired when a share is initiated |
| `share:success` | `{ platform }` | Fired after successful share / copy |
| `share:error` | `{ platform, error }` | Fired on failure (user cancel is not an error) |

---

## Markup Patterns

### Auto (recommended)

The component reads `data-url`, `data-title`, `data-text` or pulls them from `<head>`. The JS layer renders appropriate UI.

```html
<share-wc data-platforms="twitter,linkedin,whatsapp,copy"></share-wc>
```

Reads title from `document.title`, URL from `location.href`, description from `meta[name=description]`.

### Explicit attributes

```html
<share-wc
  data-url="https://example.com/article"
  data-title="Interesting Article"
  data-text="A fascinating read about web components"
  data-platforms="twitter,facebook,linkedin,whatsapp,telegram,email,copy"
  data-variant="icon-label"
  data-size="m"
></share-wc>
```

### Native-only (no platform buttons ever)

```html
<share-wc data-platforms="native-only"></share-wc>
```

Forces Tier 1 behaviour. Renders nothing on desktop if Share API is unavailable.

### Manual slot markup (enhanced)

For full control over structure, slot child links. The component enhances them with JS behaviour but they remain functional `<a>` elements without JS:

```html
<share-wc>
  <a href="https://twitter.com/intent/tweet?url={url}&text={title}"
     data-platform="twitter"
     rel="noopener noreferrer"
     target="_blank">Twitter</a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url={url}"
     data-platform="linkedin"
     rel="noopener noreferrer"
     target="_blank">LinkedIn</a>
  <button data-platform="copy">Copy link</button>
</share-wc>
```

> **Note:** Slotted `<a>` `href` values may contain the literal tokens `{url}`, `{title}`, `{text}` — the component substitutes them at runtime.

---

## Behaviour

### Initialisation

```
connectedCallback
  → resolve url, title, text (attribute → head meta → location)
  → detect navigator.share capability
  → if canShare && data-platforms !== "none" → renderNative()
  → else → renderPlatforms()
```

### URL / meta resolution order

1. `data-url` attribute
2. `link[rel=canonical]` href
3. `location.href`

Title resolution:

1. `data-title` attribute
2. `og:title` meta content
3. `document.title`

Text resolution:

1. `data-text` attribute
2. `meta[name=description]` content
3. `og:description` meta content
4. `""` (empty)

### Native share (Tier 1)

```javascript
async #handleNativeShare() {
  const payload = { url: this.url, title: this.title, text: this.text };
  this.dispatchEvent(new CustomEvent('share:open', { detail: { platform: 'native' } }));
  try {
    await navigator.share(payload);
    this.dispatchEvent(new CustomEvent('share:success', { detail: { platform: 'native' } }));
  } catch (err) {
    if (err.name !== 'AbortError') { // AbortError = user cancelled, not an error
      this.dispatchEvent(new CustomEvent('share:error', { detail: { platform: 'native', error: err } }));
    }
  }
}
```

### Platform button handler (Tier 2)

| Platform | Action |
|----------|--------|
| `twitter` / `x` | `window.open('https://twitter.com/intent/tweet?...')` |
| `facebook` | `window.open('https://www.facebook.com/sharer/sharer.php?u=...')` |
| `linkedin` | `window.open('https://www.linkedin.com/sharing/share-offsite/?url=...')` |
| `whatsapp` | `window.open('https://wa.me/?text=...')` — opens native app on mobile |
| `telegram` | `window.open('https://t.me/share/url?url=...')` — opens native app on mobile |
| `email` | `location.href = 'mailto:?subject=...&body=...'` |
| `copy` | `navigator.clipboard.writeText(url)` with `data-state="copied"` feedback |
| `bluesky` | `window.open('https://bsky.app/intent/compose?text=...')` |
| `mastodon` | Opens a configurable instance URL, defaults to `mastodon.social` |

> **WhatsApp / Telegram on mobile:** `window.open` with their URL schemes hands off to the installed app via the browser's deep-link handling — no special code needed.

### Copy feedback

```
click "copy"
  → navigator.clipboard.writeText(url)
  → button[data-state="copied"]
  → CSS: show "Copied!" via content or icon swap
  → after 2000ms → remove data-state
```

### `data-platforms` ordering

The order of platforms in `data-platforms` controls render order. Authors can put the most contextually relevant platform first.

### Attribute changes

`observedAttributes` on `data-url`, `data-title`, `data-text`, `data-platforms` — component re-renders on change.

---

## CSS Architecture

### Layer

```css
@layer web-components { ... }
```

### Design token usage

```css
share-wc {
  --_gap: var(--size-xs, 0.5rem);
  --_btn-size: var(--size-m, 2.5rem);     /* overridden by data-size */
  --_radius: var(--radius-m, 0.5rem);
  --_transition: var(--duration-fast, 150ms) var(--ease-out);
}
```

### States via data attributes

```css
/* Variant: icon only */
share-wc[data-variant="icon"] .share-label { display: none; }

/* Variant: label only */
share-wc[data-variant="label"] .share-icon { display: none; }

/* Size modifiers */
share-wc[data-size="s"] { --_btn-size: var(--size-s, 2rem); }
share-wc[data-size="l"] { --_btn-size: var(--size-l, 3rem); }

/* Copy confirmation */
[data-platform="copy"][data-state="copied"] .share-label::after {
  content: " ✓";
}
[data-platform="copy"][data-state="copied"] { color: var(--color-success); }

/* Platform brand colours (opt-in) */
share-wc[data-color] [data-platform="twitter"]  { --_brand: #1da1f2; }
share-wc[data-color] [data-platform="facebook"] { --_brand: #1877f2; }
share-wc[data-color] [data-platform="linkedin"] { --_brand: #0a66c2; }
share-wc[data-color] [data-platform="whatsapp"] { --_brand: #25d366; }
share-wc[data-color] [data-platform="telegram"] { --_brand: #229ed9; }
share-wc[data-color] [data-platform="email"]    { --_brand: var(--color-text); }
share-wc[data-color] [data-platform="copy"]     { --_brand: var(--color-text); }
```

### Structural CSS (rendered markup)

The component renders into light DOM (not shadow DOM) to allow global CSS to reach it:

```html
<!-- Tier 1 rendered output -->
<share-wc data-tier="native">
  <button class="share-trigger" type="button" aria-label="Share this page">
    <span class="share-icon" aria-hidden="true"><!-- icon-wc or SVG --></span>
    <span class="share-label">Share</span>
  </button>
</share-wc>

<!-- Tier 2 rendered output -->
<share-wc data-tier="platforms">
  <nav aria-label="Share this page">
    <button type="button" data-platform="twitter">
      <span class="share-icon" aria-hidden="true"><!-- SVG --></span>
      <span class="share-label">Twitter</span>
    </button>
    <button type="button" data-platform="linkedin">...</button>
    <button type="button" data-platform="copy">
      <span class="share-icon" aria-hidden="true"><!-- SVG --></span>
      <span class="share-label">Copy link</span>
    </button>
  </nav>
</share-wc>
```

> **Light DOM rationale:** Shadow DOM would prevent global `icon-wc` usage, break the design token cascade, and add unnecessary complexity. Light DOM is consistent with all other VB web components.

---

## Accessibility

- Tier 1 button: `aria-label="Share this page"` (or author-set via `data-label`)
- Tier 2 `<nav>`: `aria-label="Share this page"`
- Each platform button: `aria-label="Share on Twitter"` etc.
- Copy button: `aria-live="polite"` region announces "Link copied" on success
- All icons wrapped in `aria-hidden="true"` spans; labels always present in DOM (hidden visually for `icon` variant via CSS, not `display:none` globally)
- `prefers-reduced-motion`: no transitions on copy feedback
- `tabindex` follows natural DOM order

---

## File Structure

```
src/web-components/share-wc/
├── index.js          # Custom element class
├── styles.css        # Component styles (@layer web-components)
├── platforms.js      # Platform URL builders (pure functions, tree-shakeable)
└── icons/            # Inline SVG per platform (no external requests)
    ├── share.svg
    ├── twitter.svg
    ├── facebook.svg
    ├── linkedin.svg
    ├── whatsapp.svg
    ├── telegram.svg
    ├── email.svg
    ├── copy.svg
    ├── bluesky.svg
    └── mastodon.svg
```

`platforms.js` exports a `Map<string, (opts) => string>` of URL builders — separated from the element class so it can be tested independently.

---

## Compendium Entry

```json
{
  "id": "share-wc",
  "tag": "share-wc",
  "type": "web-component",
  "category": "interactive",
  "cssFile": "src/web-components/share-wc/styles.css",
  "jsRequired": true,
  "variants": [
    {
      "id": "default",
      "name": "Default (auto-detect)",
      "interactive": true,
      "html": "<share-wc></share-wc>"
    },
    {
      "id": "platforms",
      "name": "Platform buttons",
      "interactive": true,
      "html": "<share-wc data-platforms=\"twitter,linkedin,whatsapp,copy\" data-variant=\"icon-label\"></share-wc>"
    },
    {
      "id": "icon-only",
      "name": "Icon only",
      "interactive": true,
      "html": "<share-wc data-platforms=\"twitter,linkedin,copy\" data-variant=\"icon\"></share-wc>"
    },
    {
      "id": "branded",
      "name": "Brand colours",
      "interactive": true,
      "html": "<share-wc data-platforms=\"twitter,facebook,linkedin,whatsapp\" data-color></share-wc>"
    },
    {
      "id": "manual",
      "name": "Manual slot markup",
      "interactive": true,
      "html": "<share-wc>\n  <a href=\"https://twitter.com/intent/tweet?url={url}&text={title}\" data-platform=\"twitter\" target=\"_blank\" rel=\"noopener noreferrer\">Twitter</a>\n  <button data-platform=\"copy\">Copy link</button>\n</share-wc>"
    }
  ]
}
```

---

## Open Questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Shadow DOM vs light DOM? | Shadow encapsulates; light inherits tokens | **Light DOM** — consistent with all VB WCs |
| 2 | Mastodon instance? | Hardcode `mastodon.social`; prompt for instance | **Attribute `data-mastodon-instance`**, default `mastodon.social` |
| 3 | Should `data-platforms="native-only"` hide entirely on desktop? | Hide; show nothing; show copy only | **Hide entirely** — avoid showing empty container |
| 4 | Icon source — `icon-wc` or inline SVG? | `icon-wc` requires Lucide coverage; inline SVG is self-contained | **Inline SVG** in `platforms.js` — avoids dep on Lucide having brand icons |
| 5 | Count tracking (share analytics)? | Dispatch events only; consumer responsibility | **Events only** — keep it framework-agnostic |
| 6 | `navigator.canShare()` vs `navigator.share`? | `canShare` checks payload validity; `share` checks capability | Check `navigator.share` for Tier 1 detection; call `canShare(payload)` before invoking |