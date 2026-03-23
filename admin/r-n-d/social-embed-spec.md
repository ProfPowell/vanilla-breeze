---
title: Social Embed Component Specification
description: Specification for the social-embed web component and rss-feed component in Vanilla Breeze
tags:
  - web-components
  - specification
  - vanilla-breeze
date: 2026-03-03
status: draft
---

# Social Embed Component Specification

Specification for `<social-embed>` and `<rss-feed>` — a pair of web components for embedding third-party social content in a Vanilla Breeze-compatible, progressively enhanced, provider-extensible way.

## Table of Contents

- [Goals](#goals)
- [Non-Goals](#non-goals)
- [Component Overview](#component-overview)
- [social-embed](#social-embed)
  - [HTML API](#html-api)
  - [Attributes](#attributes)
  - [States](#states)
  - [Progressive Enhancement](#progressive-enhancement)
  - [Accessibility](#accessibility)
- [rss-feed](#rss-feed)
  - [HTML API](#html-api-1)
  - [Attributes](#attributes-1)
  - [States](#states-1)
  - [Progressive Enhancement](#progressive-enhancement-1)
- [Provider Registry](#provider-registry)
  - [Registration API](#registration-api)
  - [Provider Interface](#provider-interface)
  - [Built-in Providers](#built-in-providers)
  - [Writing a Custom Provider](#writing-a-custom-provider)
- [CSS Architecture](#css-architecture)
  - [Layer Placement](#layer-placement)
  - [Design Token Usage](#design-token-usage)
  - [State-Driven Styling](#state-driven-styling)
  - [Responsive Behaviour](#responsive-behaviour)
- [JavaScript Architecture](#javascript-architecture)
  - [SocialEmbed Core](#socialembed-core)
  - [Provider Utilities](#provider-utilities)
  - [Script Injection](#script-injection)
- [File Structure](#file-structure)
- [Compendium Entry](#compendium-entry)
- [Privacy and Performance Considerations](#privacy-and-performance-considerations)
- [Browser Support](#browser-support)
- [Implementation Checklist](#implementation-checklist)

---

## Goals

- Embed social content (posts, feeds) from any platform with a single, consistent HTML element.
- Work without JavaScript — the inner fallback link is always rendered and is real, indexable content.
- Be open for extension: adding a new platform never requires touching core component code.
- Follow Vanilla Breeze conventions: `data-*` attributes for behaviour, CSS classes for styling, design tokens for appearance.
- Respect privacy — lazy-load third-party scripts only when the embed is visible (Intersection Observer).
- Provide clear loading, loaded, and error states driven by `data-state`, styled entirely via CSS.

## Non-Goals

- Server-side rendering or pre-fetching of embed HTML — this is a client-side enhancement.
- Built-in analytics or tracking of embedded content.
- Support for embedded video players (those warrant their own component).
- A comprehensive library of every provider on the web — only common defaults are shipped; the registry handles the rest.

---

## Component Overview

Two components ship in this feature:

| Component | Purpose |
|---|---|
| `<social-embed>` | Embeds a single post or piece of content from a social platform |
| `<rss-feed>` | Fetches and renders a list of items from an RSS or Atom feed |

They share the provider registry concept but have distinct APIs because a single post and a feed are meaningfully different things.

---

## social-embed

### HTML API

```html
<!-- Minimal: provider + url, with accessible fallback -->
<social-embed data-provider="bluesky" data-url="https://bsky.app/profile/user.bsky.social/post/3abc">
  <a href="https://bsky.app/profile/user.bsky.social/post/3abc">View post on Bluesky</a>
</social-embed>

<!-- Auto-detect provider from URL (no data-provider needed) -->
<social-embed data-url="https://mastodon.social/@user/109876543210">
  <a href="https://mastodon.social/@user/109876543210">View post on Mastodon</a>
</social-embed>

<!-- With explicit theme override -->
<social-embed data-provider="x" data-url="https://x.com/user/status/123" data-theme="dark">
  <a href="https://x.com/user/status/123">View post on X</a>
</social-embed>

<!-- Lazy: only loads when scrolled into view (default behaviour) -->
<!-- Eager: loads immediately regardless of viewport -->
<social-embed data-provider="instagram" data-url="..." data-loading="eager">
  <a href="...">View on Instagram</a>
</social-embed>
```

### Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-provider` | any registered key | — | Explicitly names the provider. If omitted, `canHandle(url)` auto-detection runs. |
| `data-url` | valid URL | — | **Required.** The URL of the content to embed. |
| `data-theme` | `light` \| `dark` \| `auto` | `auto` | Passes a theme hint to providers that support it. `auto` reads `prefers-color-scheme`. |
| `data-loading` | `lazy` \| `eager` | `lazy` | Controls when the provider renders. `lazy` uses Intersection Observer. |
| `data-state` | set by component (read-only for authors) | — | Current lifecycle state. See [States](#states). |

### States

`data-state` is written by the component JS, never by the author. It drives all visual feedback via CSS.

| Value | When set | CSS purpose |
|---|---|---|
| `idle` | Before JS initialises | Default; displays fallback content |
| `loading` | Provider `render()` called, awaiting response | Skeleton / shimmer animation |
| `loaded` | Provider `render()` resolved successfully | Hides skeleton, shows embed |
| `error` | Provider `render()` rejected | Displays error message |
| `unsupported` | No matching provider found | Displays fallback link only, no error treatment |

> **Note:** `unsupported` is a graceful state, not an error. It means "we don't know how to embed this" and the fallback link remains the user's action.

### Progressive Enhancement

The component degrades in three layers:

1. **No JS / unsupported provider** — the inner content (typically an `<a>`) renders as-is. This is real DOM, not a `<noscript>` block, so it is indexable and accessible.
2. **JS available, provider matched** — the inner content is replaced with the rendered embed HTML.
3. **JS available, provider matched, `data-loading="lazy"`** — rendering is deferred until the element intersects the viewport, reducing third-party script load on initial page load.

The component must not remove the fallback content until `render()` has resolved successfully. On rejection, the fallback content is restored.

### Accessibility

- The fallback `<a>` provides a meaningful link for all users regardless of JS state.
- When the embed renders, if the provider injects an `<iframe>`, it must have a `title` attribute. Providers are responsible for this; the component README should document the requirement.
- `data-state="loading"` triggers a visually hidden live region announcement: `"Loading embed…"` to inform screen reader users that content is loading.
- `data-state="error"` announces: `"Embed failed to load."` with the fallback link still accessible.
- The component renders as `display: block` and does not interfere with document flow.
- Authors should wrap embeds in a `<figure>` with an optional `<figcaption>` for semantic context:

```html
<figure>
  <social-embed data-provider="bluesky" data-url="...">
    <a href="...">View post on Bluesky</a>
  </social-embed>
  <figcaption>Thomas Davis commenting on the new CSS nesting spec.</figcaption>
</figure>
```

---

## rss-feed

`<rss-feed>` fetches an RSS or Atom feed URL and renders a list of items. It is a display component, not a subscription component.

### HTML API

```html
<!-- Minimal -->
<rss-feed data-url="https://example.com/feed.xml">
  <p>Latest posts from <a href="https://example.com">example.com</a></p>
</rss-feed>

<!-- With options -->
<rss-feed
  data-url="https://example.com/feed.xml"
  data-limit="5"
  data-loading="lazy"
  data-show-description="true"
  data-date-format="relative"
>
  <p>Latest posts from <a href="https://example.com">example.com</a></p>
</rss-feed>
```

### Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-url` | valid feed URL | — | **Required.** URL of the RSS or Atom feed. |
| `data-limit` | positive integer | `5` | Maximum number of items to display. |
| `data-loading` | `lazy` \| `eager` | `lazy` | Intersection Observer deferral, same as `social-embed`. |
| `data-show-description` | `true` \| `false` | `false` | Renders item description/summary if present. |
| `data-date-format` | `relative` \| `absolute` \| `none` | `relative` | How to format item dates. `relative` uses `Intl.RelativeTimeFormat`. |
| `data-state` | set by component | — | Same state lifecycle as `social-embed`. |

### States

Same state model as `social-embed`: `idle`, `loading`, `loaded`, `error`.

### Progressive Enhancement

The fallback content (inner HTML) is displayed while loading and replaced on successful fetch. On error, fallback content is retained. No third-party scripts are involved — the component fetches the feed URL directly, so CORS must be enabled on the feed endpoint.

> **CORS note:** Most CDN-hosted or major platform feeds allow CORS. Self-hosted feeds may need `Access-Control-Allow-Origin: *`. The component surfaces a descriptive error in `data-state="error"` for CORS failures.

### Rendered Output

The component renders a `<ul>` with `<li>` items. Authors can style it via the component's CSS custom properties. The rendered structure:

```html
<rss-feed data-state="loaded">
  <ul class="rss-feed-list">
    <li class="rss-feed-item">
      <a class="rss-feed-title" href="...">Item title</a>
      <time class="rss-feed-date" datetime="2026-02-28T10:00:00Z">2 days ago</time>
      <!-- if data-show-description="true" -->
      <p class="rss-feed-description">Item excerpt…</p>
    </li>
    <!-- … -->
  </ul>
</rss-feed>
```

---

## Provider Registry

The registry is the core extension point. It is a static `Map` on `SocialEmbed`. No framework, no build step, no config file — just a `register()` call.

### Registration API

```js
import { SocialEmbed } from './social-embed.js';
import { BlueskyProvider } from './providers/bluesky.js';
import { MastodonProvider } from './providers/mastodon.js';

// Named registration (matches data-provider="bluesky")
SocialEmbed.register('bluesky', BlueskyProvider);

// Or: providers self-register by convention
// (each built-in provider file calls register() at module load)
import './providers/bluesky.js';
import './providers/mastodon.js';
```

Auto-detection order when `data-provider` is absent:

1. Iterate registry in insertion order.
2. Call `provider.canHandle(url)` for each.
3. First truthy result wins.
4. If none match, set `data-state="unsupported"` and leave fallback content in place.

### Provider Interface

A provider is a plain object implementing this interface:

```ts
interface EmbedProvider {
  /**
   * Optional. Return true if this provider can handle the given URL.
   * Used for auto-detection when data-provider is not set.
   */
  canHandle?(url: string): boolean;

  /**
   * Required. Render the embed into the given host element.
   * Should replace host.innerHTML with the embed content.
   * Must reject (throw) on failure so the component can set data-state="error".
   */
  render(host: HTMLElement, url: string, options: ProviderOptions): Promise<void>;
}

interface ProviderOptions {
  theme: 'light' | 'dark'; // resolved from data-theme + prefers-color-scheme
}
```

### Built-in Providers

The following providers ship with the component in `src/web-components/social-embed/providers/`:

| File | key | Mechanism | Notes |
|---|---|---|---|
| `bluesky.js` | `bluesky` | oEmbed fetch (`embed.bsky.app/oembed`) | No third-party script required |
| `mastodon.js` | `mastodon` | oEmbed fetch (instance-relative `/api/oembed`) | Requires instance URL parsing |
| `x.js` | `x` | Third-party script (`platform.x.com/widgets.js`) | Injects script once; respects `data-theme` |
| `instagram.js` | `instagram` | Third-party script (`www.instagram.com/embed.js`) | Injects script once |
| `youtube.js` | `youtube` | `<iframe>` embed URL | No script; aspect-ratio preserved via CSS |

> **Not included by default:** TikTok, LinkedIn, Pinterest, Threads. These follow the same provider pattern and can be added by consumers without core changes.

### Writing a Custom Provider

A minimal provider using oEmbed:

```js
// my-provider.js
import { SocialEmbed, loadScript } from '../social-embed.js';

const MyProvider = {
  canHandle(url) {
    return url.includes('myprovider.example');
  },

  async render(host, url, { theme }) {
    const endpoint = `https://myprovider.example/oembed?url=${encodeURIComponent(url)}&theme=${theme}`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`oEmbed fetch failed: ${res.status}`);
    const data = await res.json();
    host.innerHTML = data.html;
  }
};

SocialEmbed.register('my-provider', MyProvider);
```

A provider using a third-party script:

```js
import { SocialEmbed, loadScript } from '../social-embed.js';

const ScriptProvider = {
  canHandle(url) {
    return url.includes('example-platform.com');
  },

  async render(host, url, { theme }) {
    // loadScript is idempotent — safe to call per-render
    await loadScript('https://example-platform.com/embed.js');
    host.innerHTML = `<blockquote class="example-embed" data-theme="${theme}"><a href="${url}"></a></blockquote>`;
    // Trigger platform widget init if required
    window.ExampleEmbed?.process(host);
  }
};

SocialEmbed.register('example-platform', ScriptProvider);
```

---

## CSS Architecture

### Layer Placement

```css
@layer web-components {
  /* social-embed and rss-feed styles */
}
```

Both components live in the existing `web-components` layer, consistent with all other Vanilla Breeze interactive components.

### Design Token Usage

The components use only existing Vanilla Breeze design tokens. No new tokens are introduced unless a clear gap exists.

| CSS property | Token used |
|---|---|
| Border radius | `--radius-m` |
| Background (skeleton) | `--color-surface-2` |
| Border | `--color-border` |
| Font size (feed items) | `--font-size-s` |
| Spacing | `--space-m`, `--space-s` |
| Animation duration | `--duration-slow` |
| Error text color | `--color-danger` |

One optional component-scoped property is exposed for consumer overrides:

```css
social-embed {
  --embed-max-width: 550px; /* matches Twitter/Bluesky card widths */
}
```

### State-Driven Styling

All visual feedback is CSS-only, driven by `data-state`. No JS style manipulation.

```css
@layer web-components {

  social-embed,
  rss-feed {
    display: block;
  }

  /* Skeleton loading state */
  social-embed[data-state="loading"],
  rss-feed[data-state="loading"] {
    min-height: 8rem;
    background: var(--color-surface-2);
    border-radius: var(--radius-m);
    animation: skeleton-pulse var(--duration-slow) ease-in-out infinite alternate;
  }

  /* Error state */
  social-embed[data-state="error"] .embed-error,
  rss-feed[data-state="error"] .embed-error {
    display: block;
    color: var(--color-danger);
    font-size: var(--font-size-s);
    padding: var(--space-s);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-m);
  }

  /* Loaded embeds: constrain width, centre */
  social-embed[data-state="loaded"] {
    max-width: var(--embed-max-width, 550px);
  }

  /* iframe inside embeds */
  social-embed iframe,
  rss-feed iframe {
    border: none;
    max-width: 100%;
  }

  /* RSS feed list */
  .rss-feed-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  .rss-feed-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-xs);
    align-items: baseline;
  }

  .rss-feed-date {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .rss-feed-description {
    grid-column: 1 / -1;
    font-size: var(--font-size-s);
    color: var(--color-text-muted);
    margin: 0;
  }

  @keyframes skeleton-pulse {
    from { opacity: 0.6; }
    to   { opacity: 1;   }
  }

  @media (prefers-reduced-motion: reduce) {
    social-embed[data-state="loading"],
    rss-feed[data-state="loading"] {
      animation: none;
    }
  }
}
```

### Responsive Behaviour

Embeds are constrained to `--embed-max-width` but never exceed their container. Authors should not need to override this for typical use.

---

## JavaScript Architecture

### SocialEmbed Core

**`src/web-components/social-embed/social-embed.js`**

```js
const registry = new Map();
const scriptCache = new Map(); // keyed by src URL

export function loadScript(src) {
  if (scriptCache.has(src)) return scriptCache.get(src);
  const p = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(el);
  });
  scriptCache.set(src, p);
  return p;
}

function resolveTheme(hint) {
  if (hint === 'light') return 'light';
  if (hint === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

class SocialEmbed extends HTMLElement {
  static register(name, provider) {
    registry.set(name, provider);
  }

  #observer = null;

  connectedCallback() {
    const loading = this.dataset.loading ?? 'lazy';

    if (loading === 'eager') {
      this.#init();
    } else {
      this.#observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.#observer.disconnect();
          this.#init();
        }
      }, { rootMargin: '200px' });
      this.#observer.observe(this);
    }
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  async #init() {
    const url = this.dataset.url;
    if (!url) return;

    const name = this.dataset.provider;
    const provider = name
      ? registry.get(name)
      : [...registry.values()].find(p => p.canHandle?.(url));

    if (!provider) {
      this.dataset.state = 'unsupported';
      return;
    }

    const fallback = this.innerHTML; // preserve for error recovery
    this.dataset.state = 'loading';
    this.#announceToScreenReader('Loading embed…');

    try {
      const options = { theme: resolveTheme(this.dataset.theme ?? 'auto') };
      await provider.render(this, url, options);
      this.dataset.state = 'loaded';
    } catch (err) {
      console.warn('[social-embed] render failed:', err);
      this.innerHTML = fallback;
      this.dataset.state = 'error';
      this.#announceToScreenReader('Embed failed to load.');
    }
  }

  #announceToScreenReader(message) {
    const live = this.querySelector('.embed-live-region')
      ?? Object.assign(document.createElement('span'), {
          className: 'embed-live-region visually-hidden',
          role: 'status',
          ariaLive: 'polite',
        });
    this.prepend(live);
    live.textContent = message;
  }
}

customElements.define('social-embed', SocialEmbed);
export { SocialEmbed };
```

### Provider Utilities

`loadScript` is exported from the core module so providers can use it without duplicating the idempotency logic.

Additional utilities providers may use:

```js
// Fetch oEmbed JSON from any endpoint
export async function fetchOEmbed(endpoint, url, params = {}) {
  const query = new URLSearchParams({ url, ...params });
  const res = await fetch(`${endpoint}?${query}`);
  if (!res.ok) throw new Error(`oEmbed error ${res.status}`);
  return res.json();
}

// Parse an RSS/Atom feed from a Response (used by rss-feed)
export function parseFeed(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const isAtom = !!doc.querySelector('feed');
  const items = isAtom
    ? [...doc.querySelectorAll('entry')]
    : [...doc.querySelectorAll('item')];
  return items.map(item => ({
    title: item.querySelector('title')?.textContent?.trim() ?? '',
    link:  isAtom
      ? item.querySelector('link')?.getAttribute('href') ?? ''
      : item.querySelector('link')?.textContent?.trim() ?? '',
    date:  item.querySelector('published, updated, pubDate')?.textContent?.trim() ?? '',
    description: item.querySelector('summary, description')?.textContent?.trim() ?? '',
  }));
}
```

### Script Injection

`loadScript` is idempotent by design: if a provider calls it twice, the second call returns the same cached Promise. This prevents duplicate script tags when multiple embeds from the same platform exist on a page.

---

## File Structure

```
src/web-components/social-embed/
├── social-embed.js          # Core component + registry + utilities
├── rss-feed.js              # RSS feed component
├── styles.css               # All CSS for both components
├── index.js                 # Re-exports both components
└── providers/
    ├── bluesky.js
    ├── mastodon.js
    ├── x.js
    ├── instagram.js
    └── youtube.js
```

**`src/web-components/social-embed/index.js`** — the default import registers all built-in providers:

```js
export { SocialEmbed } from './social-embed.js';
export { RssFeed }     from './rss-feed.js';

// Built-in providers auto-register on import
import './providers/bluesky.js';
import './providers/mastodon.js';
import './providers/x.js';
import './providers/instagram.js';
import './providers/youtube.js';
```

Consumers who want only specific providers import them explicitly:

```js
import { SocialEmbed } from './social-embed/social-embed.js';
import './social-embed/providers/bluesky.js';
// X, Instagram, etc. not loaded — their scripts never execute
```

---

## Compendium Entry

The following entries should be added to `compendium.json`:

```json
{
  "id": "social-embed",
  "tag": "social-embed",
  "type": "web-component",
  "category": "media",
  "cssFile": "src/web-components/social-embed/styles.css",
  "jsRequired": true,
  "variants": [
    {
      "id": "bluesky",
      "name": "Bluesky Post",
      "interactive": true,
      "html": "<social-embed data-provider=\"bluesky\" data-url=\"https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w\">\n  <a href=\"https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w\">View post on Bluesky</a>\n</social-embed>"
    },
    {
      "id": "mastodon",
      "name": "Mastodon Post",
      "interactive": true,
      "html": "<social-embed data-provider=\"mastodon\" data-url=\"https://mastodon.social/@Mastodon/109838793196353548\">\n  <a href=\"https://mastodon.social/@Mastodon/109838793196353548\">View post on Mastodon</a>\n</social-embed>"
    },
    {
      "id": "youtube",
      "name": "YouTube Video",
      "interactive": true,
      "html": "<social-embed data-provider=\"youtube\" data-url=\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\">\n  <a href=\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\">Watch on YouTube</a>\n</social-embed>"
    }
  ]
},
{
  "id": "rss-feed",
  "tag": "rss-feed",
  "type": "web-component",
  "category": "media",
  "cssFile": "src/web-components/social-embed/styles.css",
  "jsRequired": true,
  "variants": [
    {
      "id": "default",
      "name": "RSS Feed",
      "interactive": true,
      "html": "<rss-feed data-url=\"https://www.w3.org/blog/news/feed\" data-limit=\"5\">\n  <p>Latest news from <a href=\"https://www.w3.org/blog/news/\">W3C</a></p>\n</rss-feed>"
    }
  ]
}
```

---

## Privacy and Performance Considerations

Third-party embeds carry inherent privacy implications. The following defaults and recommendations apply:

- **Lazy loading by default** (`data-loading="lazy"`). Third-party scripts and requests only execute when the user scrolls the embed into the viewport. This prevents off-screen embeds from tracking page visits.
- **Script injection is deferred** until `render()` is called. No provider scripts are loaded until the embed is in view.
- **No cookies or localStorage** are set by the component itself. Platform scripts may set their own cookies; this is outside component scope.
- **oEmbed-based providers** (Bluesky, Mastodon) make only a single API request and inject HTML. They do not inject third-party scripts, making them the most privacy-preserving option.
- **Authors should disclose** to their users (e.g. in a site privacy policy) which platforms' embeds are used, since those platforms may receive the visitor's IP on load.
- **Future consideration:** a `data-consent="required"` attribute pattern could gate rendering behind a consent signal, delegating to a site-level consent mechanism. Not in scope for v1.

---

## Browser Support

Targets evergreen browsers. All APIs used:

| API | Chrome | Firefox | Safari |
|---|---|---|---|
| Custom Elements v1 | 67+ | 63+ | 10.1+ |
| Intersection Observer | 58+ | 55+ | 12.1+ |
| `DOMParser` | All | All | All |
| `Intl.RelativeTimeFormat` | 71+ | 65+ | 14+ |
| CSS `light-dark()` | 123+ | 120+ | 17.5+ |

No polyfills are required for the target browser matrix.

---

## Implementation Checklist

### Component

- [ ] `social-embed.js` — core class, registry, `loadScript`, `fetchOEmbed`, `parseFeed`
- [ ] `rss-feed.js` — feed component using `parseFeed` and `Intl.RelativeTimeFormat`
- [ ] `styles.css` — all states, skeleton animation, feed list, responsive behaviour
- [ ] `index.js` — re-exports + auto-registers built-in providers

### Providers

- [ ] `bluesky.js` — oEmbed via `embed.bsky.app`
- [ ] `mastodon.js` — oEmbed with instance URL parsing
- [ ] `x.js` — widgets.js script injection + blockquote markup
- [ ] `instagram.js` — instagram embed.js script injection
- [ ] `youtube.js` — `<iframe>` with `youtube-nocookie.com` domain, aspect-ratio CSS

### CSS

- [ ] All `data-state` variants styled
- [ ] Skeleton animation with `prefers-reduced-motion` override
- [ ] `--embed-max-width` custom property exposed
- [ ] RSS feed list layout tokens used throughout
- [ ] Added to `web-components` layer

### Documentation

- [ ] Compendium entries added (`social-embed`, `rss-feed`)
- [ ] Doc page created at `docs/elements/web/social-embed.html`
- [ ] Provider authoring guide in component README
- [ ] Privacy considerations documented for site authors

### Testing

- [ ] Each built-in provider renders correctly
- [ ] Fallback content displays with JS disabled
- [ ] `data-state` transitions verified for loading, loaded, error, unsupported
- [ ] Lazy loading defers third-party scripts until intersection
- [ ] `data-theme="dark"` passed correctly to providers that support it
- [ ] Multiple embeds from same platform use cached script (no duplicate injection)
- [ ] `rss-feed` handles RSS 2.0 and Atom formats
- [ ] `rss-feed` handles CORS failure gracefully
- [ ] Screen reader announcements fire on state change
