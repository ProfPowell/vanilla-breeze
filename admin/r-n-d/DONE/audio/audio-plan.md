---
title: Audio Element — Progressive Enhancement Plan
description: Design document for a properly layered, platform-native audio system built upward from <audio>, culminating in <audio-player> and <audio-visualizer> web components.
author: Thomas
date: 2026-03-05
status: draft
tags:
  - audio
  - progressive-enhancement
  - native-elements
  - web-components
  - vanilla-breeze
---

# Audio Element — Progressive Enhancement Plan

A redesign of audio handling in Vanilla Breeze. The retro bundle's `audio-player` was built top-down (JS-first, `src` attribute, no fallback). This plan rebuilds bottom-up from `<audio>`, adding capability in layers — each layer functional and complete on its own.  The audio-player plan that exists should first be renamed audio-player-retro for safe migration and some aspects will be removed to put in a new <audio-visualizer> component.  As the library is pre-release we will not retain that feature and it will eventually be removed.

## Table of Contents

- [The Problem with the Current Approach](#the-problem-with-the-current-approach)
- [Design Principles](#design-principles)
- [The Four Layers](#the-four-layers)
  - [Layer 1: Native Baseline](#layer-1-native-baseline)
  - [Layer 2: Styled Native Audio](#layer-2-styled-native-audio)
  - [Layer 3: Track Listing (Playlist Mode)](#layer-3-track-listing-playlist-mode)
  - [Layer 4: audio-player Web Component](#layer-4-audio-player-web-component)
- [audio-visualizer Companion Component](#audio-visualizer-companion-component)
- [Source Strategy](#source-strategy)
- [Track Element Strategy](#track-element-strategy)
- [CSS Token API](#css-token-api)
- [Track List Data Attributes](#track-list-data-attributes)
- [Compendium Entries](#compendium-entries)
- [Migration from Retro audio-player](#migration-from-retro-audio-player)
- [Open Questions](#open-questions)

---

## The Problem with the Current Approach

The existing `audio-player` web component in the retro bundle starts at Layer 4. It:

- Renders nothing meaningful before JS executes
- Owns the audio via a `src` attribute — no relationship to native `<audio>`, `<source>`, or `<track>`
- Cannot degrade to a download link when audio is unsupported
- Bakes the visualizer into the player, making them inseparable

The correct architecture treats `<audio>` as the foundation, separates the visualizer into its own composable component, and reserves the web component layer for enhancements only HTML cannot provide.

---

## Design Principles

1. **Start with `<audio>`** — the browser's native player is Layer 1 and always works
2. **`<source>` for format negotiation** — list formats best-to-worst; browser picks
3. **`<track>` for text tracks** — captions, chapters, descriptions are HTML, not JS
4. **Download links as the deepest fallback** — even if `<audio>` is unsupported
5. **Style before scripting** — CSS alone improves the experience at Layer 2
6. **Playlist as HTML** — `<details>/<summary>` + `<ol>` gives a track listing without JS
7. **`<audio-player>` wraps, never replaces** — the native `<audio>` lives in its light DOM
8. **Visualizer is a separate concern** — `<audio-visualizer>` is a companion, not a built-in

---

## The Four Layers

### Layer 1: Native Baseline

Works everywhere with no CSS or JS. The fallback `<p>` renders only when `<audio>` itself is unsupported.

```html
<!-- Single track — absolute minimum -->
<audio controls>
  <source src="track.ogg" type="audio/ogg">
  <source src="track.mp3" type="audio/mpeg">
  <p>
    Your browser does not support audio playback.
    <a href="track.mp3" download>Download the audio file</a>.
  </p>
</audio>
```

**Rules at this layer:**

- Always include at least one `<source>` with a `type` attribute
- Always provide a download `<a>` as the ultimate fallback
- `controls` attribute must be present — no custom controls at this layer

---

### Layer 2: Styled Native Audio

CSS only, `@layer native-elements`. No new HTML required — the Layer 1 markup gains visual polish from VB tokens.

The native player's shadow DOM is not fully cross-browser styleable, but the `<audio>` element itself is: dimensions, display, border radius, and `accent-color`.

```css
/* @layer native-elements */
audio {
  display: block;
  width: 100%;
  border-radius: var(--radius-m);
  accent-color: var(--color-primary);
  color-scheme: light dark;
}

audio.compact {
  max-width: 320px;
}
```

> Deep styling of native player chrome (progress bar shape, button icons) requires Layer 4. Accept the native chrome at Layer 2 — it is accessible and keyboard-navigable for free.

**Variant classes:**

| Class | Effect |
|-------|--------|
| *(none)* | Full-width player |
| `.compact` | Max-width constrained |

---

### Layer 3: Track Listing (Playlist Mode)

HTML + CSS only. No JavaScript required. `<details>/<summary>` exposes a track list that shows/hides natively. This is the Winamp-with-many-tracks use case.

The canonical HTML structure established here carries forward into Layer 4:

```html
<audio controls>
  <source src="tracks/01-opening.mp3" type="audio/mpeg">
  <source src="tracks/01-opening.ogg" type="audio/ogg">
  <p>
    <a href="tracks/01-opening.mp3" download>Download track 1</a>
  </p>
</audio>

<details>
  <summary>Track Listing</summary>
  <ol class="track-list">
    <li data-audio-played>
      <a href="tracks/01-opening.mp3">01. Opening Theme</a>
      <span class="track-meta"><time datetime="PT2M14S">2:14</time></span>
    </li>
    <li data-audio-active>
      <a href="tracks/02-main.mp3">02. Main Theme</a>
      <span class="track-meta"><time datetime="PT3M45S">3:45</time></span>
    </li>
    <li>
      <a href="tracks/03-battle.mp3">03. Battle Theme</a>
      <span class="track-meta"><time datetime="PT1M58S">1:58</time></span>
    </li>
    <li data-audio-favorite>
      <a href="tracks/04-ending.mp3">04. Ending Theme</a>
      <span class="track-meta"><time datetime="PT4M12S">4:12</time></span>
    </li>
    <li>
      <a href="tracks/05-bonus.mp3">05. Bonus Track</a>
      <span class="track-meta"><time datetime="PT1M30S">1:30</time></span>
    </li>
  </ol>
</details>
```

**Without JS:** Track links navigate to the audio file — it plays inline or triggers a download. Valid fallback.

**With a small JS utility** (not a web component): clicking a track updates `<audio>` src and calls `play()`. `<audio-player>` handles this natively at Layer 4; this utility is for the no-component case.

```javascript
// src/utils/audio-playlist.js
document.querySelectorAll('audio-player, .audio-standalone').forEach(root => {
  const audio = root.querySelector('audio');
  const items = root.querySelectorAll('.track-list li');

  root.querySelector('.track-list')?.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    e.preventDefault();

    audio.src = link.href;
    audio.play();

    items.forEach(li => li.removeAttribute('data-audio-active'));
    link.closest('li').setAttribute('data-audio-active', '');
  });
});
```

**CSS for track listing:**

```css
/* @layer native-elements */
details:has(.track-list) {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  overflow: hidden;
}

details:has(.track-list) summary {
  padding: var(--size-xs) var(--size-s);
  cursor: pointer;
  font-size: var(--text-sm);
  background: var(--color-surface-alt);
  user-select: none;
}

.track-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.track-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--size-xs) var(--size-s);
  border-top: 1px solid var(--color-border-subtle);
}

.track-list li[data-audio-active] {
  background: color-mix(in oklch, var(--color-primary), transparent 85%);
}

.track-list li[data-audio-played] {
  opacity: 0.6;
}

.track-list li[data-audio-favorite]::before {
  content: "♥";
  color: var(--color-primary);
  font-size: var(--text-xs);
  margin-inline-end: var(--size-xs);
}

.track-list a {
  text-decoration: none;
  font-size: var(--text-sm);
  flex: 1;
}

.track-meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
```

---

### Layer 4: audio-player Web Component

`<audio-player>` wraps the Layer 1–3 markup. The `<audio>` element and `<details>` track listing live directly inside it as light DOM children. If JS is unavailable or the component fails to register, the native `<audio>` and `<details>` render and function normally.

**Single track:**

```html
<audio-player>
  <audio controls>
    <source src="track.ogg" type="audio/ogg">
    <source src="track.mp3" type="audio/mpeg">
    <p><a href="track.mp3" download>Download track</a></p>
  </audio>
</audio-player>
```

**Playlist mode:**

```html
<audio-player>
  <audio controls>
    <source src="tracks/01-opening.mp3" type="audio/mpeg">
    <source src="tracks/01-opening.ogg" type="audio/ogg">
    <p><a href="tracks/01-opening.mp3" download>Download track 1</a></p>
  </audio>
  <details>
    <summary>Track Listing</summary>
    <ol class="track-list">
      <li data-audio-played>
        <a href="tracks/01-opening.mp3">01. Opening Theme</a>
        <span class="track-meta"><time datetime="PT2M14S">2:14</time></span>
      </li>
      <li data-audio-active>
        <a href="tracks/02-main.mp3">02. Main Theme</a>
        <span class="track-meta"><time datetime="PT3M45S">3:45</time></span>
      </li>
      <li data-audio-favorite>
        <a href="tracks/03-ending.mp3">03. Ending Theme</a>
        <span class="track-meta"><time datetime="PT4M12S">4:12</time></span>
      </li>
    </ol>
  </details>
</audio-player>
```

**Component responsibilities:**

- Suppress native `<audio controls>`; render custom control chrome in shadow DOM
- Handle track list clicks — update `<audio>` src, manage `data-audio-active` / `data-audio-played` state on `<li>` elements
- Expose `::part()` names: `player`, `controls`, `play-button`, `timeline`, `volume`, `track-info`
- Emit VB events: `vb:audio:play`, `vb:audio:pause`, `vb:audio:ended`, `vb:audio:track-change`
- Respect `prefers-reduced-motion`
- Keyboard: Space (play/pause), ←/→ (seek 10s), M (mute)

**What the component does NOT do:**

- Own or generate `<source>` or `<track>` elements — those stay in HTML
- Replace the download fallback — that stays in light DOM
- Own the playlist data model — the `<ol class="track-list">` is the source of truth
- Render the visualizer — that is `<audio-visualizer>`'s job

**Component attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-autoplay` | boolean | Start playing on load (subject to browser autoplay policy) |
| `data-loop` | boolean | Loop single track or entire playlist |
| `data-shuffle` | boolean | Randomise playlist order |

---

## audio-visualizer Companion Component

`<audio-visualizer>` is a separate web component that connects to an `<audio>` element via a `for` attribute — mirroring the `<label for="">` pattern. It draws a canvas-based visualization using `AudioContext` / `AnalyserNode`.

Separating it from `<audio-player>` means:

- It pairs with any `<audio>` element — with or without `<audio-player>`
- It can be omitted entirely without touching `<audio-player>`
- It can be positioned independently in the layout
- Its bundle cost is strictly opt-in

**Authoring:**

```html
<!-- With audio-player -->
<audio-player>
  <audio id="my-track" controls>
    <source src="track.ogg" type="audio/ogg">
    <source src="track.mp3" type="audio/mpeg">
    <p><a href="track.mp3" download>Download</a></p>
  </audio>
</audio-player>

<audio-visualizer for="my-track" data-mode="bars"></audio-visualizer>

<!-- Without audio-player — pairs with a plain <audio> -->
<audio id="ambient" controls loop>
  <source src="ambient.ogg" type="audio/ogg">
  <source src="ambient.mp3" type="audio/mpeg">
</audio>

<audio-visualizer for="ambient" data-mode="waveform"></audio-visualizer>
```

**Component attributes:**

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `for` | Yes | — | `id` of the target `<audio>` element |
| `data-mode` | No | `bars` | Visualization style: `bars`, `waveform`, `circle` |
| `data-fft-size` | No | `256` | AnalyserNode FFT size — power of 2, 32–32768 |

**Behavior:**

- Finds target `<audio>` by `#id`; does nothing if not found (safe no-op fallback)
- Creates `AudioContext` lazily on first play event — respects browser autoplay policy
- When `prefers-reduced-motion: reduce` is set: stops canvas animation, `<audio>` continues playing
- Pauses rendering when off-screen via `IntersectionObserver`
- If `AudioContext` is unavailable: renders nothing, no error thrown

**Fallback:** Without JS, nothing renders — the `<audio>` plays normally. The visualizer is pure enhancement.

**Visualization modes:**

| Mode | Description |
|------|-------------|
| `bars` | Frequency bar chart (classic equalizer) |
| `waveform` | Time-domain oscilloscope line |
| `circle` | Radial frequency display |

**AudioContext sharing:** Multiple `<audio-visualizer>` elements on one page share a single `AudioContext` instance via an internal page-level registry. Browsers cap concurrent contexts at ~6 — the singleton pattern avoids hitting this limit.

**CSS token API:**

| Token | Fallback | Purpose |
|-------|---------|---------|
| `--audio-visualizer-color` | `--color-primary` | Bar / waveform draw color |
| `--audio-visualizer-bg` | `transparent` | Canvas background |
| `--audio-visualizer-height` | `80px` | Canvas block size |
| `--audio-visualizer-radius` | `--radius-m` | Canvas border radius |

---

## Source Strategy

```html
<!-- Full format chain: best codec first, universal fallback last -->
<audio controls>
  <source src="audio/track.opus" type="audio/ogg; codecs=opus">
  <source src="audio/track.ogg" type="audio/ogg">
  <source src="audio/track.m4a" type="audio/mp4">
  <source src="audio/track.mp3" type="audio/mpeg">
  <p><a href="audio/track.mp3" download>Download audio (MP3)</a></p>
</audio>
```

**Practical minimum:**

```html
<audio controls>
  <source src="audio/track.ogg" type="audio/ogg">
  <source src="audio/track.mp3" type="audio/mpeg">
  <p><a href="audio/track.mp3" download>Download audio</a></p>
</audio>
```

---

## Track Element Strategy

`<track>` adds timed text to `<audio>`. All kinds are declarative HTML — no JS involved.

```html
<audio controls>
  <source src="podcast.mp3" type="audio/mpeg">

  <!-- Captions: dialogue + non-speech sounds, for deaf/HoH -->
  <track kind="captions"
         src="podcast-captions-en.vtt"
         srclang="en"
         label="English captions"
         default>

  <!-- Subtitles: dialogue only, for non-native speakers -->
  <track kind="subtitles"
         src="podcast-subtitles-es.vtt"
         srclang="es"
         label="Español">

  <!-- Chapters: navigable time markers -->
  <track kind="chapters"
         src="podcast-chapters.vtt"
         srclang="en"
         label="Chapters">

  <p><a href="podcast.mp3" download>Download podcast</a></p>
</audio>
```

> `<track>` on `<audio>` is valid HTML. Browser rendering varies — chapters are the most reliably useful kind. The `<audio-player>` component can render captions as a scrolling transcript in its custom chrome.

**VTT chapter example:**

```text
WEBVTT

00:00:00.000 --> 00:05:30.000
Introduction

00:05:30.000 --> 00:18:45.000
Main Topic

00:18:45.000 --> 00:32:00.000
Q&A

00:32:00.000 --> 00:35:15.000
Closing
```

---

## CSS Token API

Native `<audio>` and `.track-list` use these VB tokens:

| Token | Purpose |
|-------|---------|
| `--color-primary` | `accent-color`, active track highlight, favorite icon |
| `--color-surface-alt` | Track list `<summary>` background |
| `--color-border` | Track list `<details>` border |
| `--color-border-subtle` | Divider between track items |
| `--color-text-muted` | Track duration text |
| `--radius-m` | Player and track list border radius |
| `--size-xs`, `--size-s` | Spacing in track list |
| `--text-sm`, `--text-xs` | Track name and duration type scale |

`<audio-player>` component-scoped tokens:

| Token | Fallback | Purpose |
|-------|---------|---------|
| `--audio-player-accent` | `--color-primary` | Control accent, progress fill |
| `--audio-player-bg` | `--color-surface` | Player background |
| `--audio-player-radius` | `--radius-m` | Player border radius |

---

## Track List Data Attributes

`<li>` elements in `.track-list` carry state via data attributes. Valid at Layer 3 (CSS only) and managed by `<audio-player>` at Layer 4.

| Attribute | Set by | Meaning |
|-----------|--------|---------|
| `data-audio-active` | Component + author | Currently loaded / playing track |
| `data-audio-played` | Component | Track has been played this session |
| `data-audio-favorite` | Author | Editorially marked as a highlight |

Authors can pre-set `data-audio-active` and `data-audio-favorite` in HTML. The component inherits `data-audio-active` and continues managing it as playback progresses. It never modifies `data-audio-favorite` — that is always author intent.

---

## Compendium Entries

| ID | Tag | Type | Layer |
|----|-----|------|-------|
| `audio` | `audio` | `native` | 1–2 |
| `audio-player` | `audio-player` | `web-component` | 4 |
| `audio-visualizer` | `audio-visualizer` | `web-component` | 4 |

The `audio` native entry variants:

- `default` — single `<source>`, fallback `<p>` with download link
- `multi-source` — Opus + OGG + MP3 sources
- `with-captions` — includes `<track kind="captions">`
- `with-chapters` — includes `<track kind="chapters">`
- `compact` — `.compact` class
- `with-track-list` — `<audio>` + `<details>` playlist at Layer 3

The `audio-player` entry variants:

- `single` — wraps one `<audio>`, no track list
- `playlist` — wraps `<audio>` + `<details>` with 3+ tracks, showing all data attribute states

The `audio-visualizer` entry variants:

- `bars` — `data-mode="bars"`
- `waveform` — `data-mode="waveform"`
- `circle` — `data-mode="circle"`
- `paired` — shown alongside `<audio-player>` for full context

---

## Migration from Retro audio-player

The retro bundle's `audio-player` is **not deleted** — it remains a valid themed implementation. Two changes are required:

**1. Fix the fallback — it must contain a native `<audio>`:**

```html
<!-- Before: fragile, renders nothing without JS -->
<audio-player src="track.mp3"></audio-player>

<!-- After: native player renders without JS -->
<audio-player>
  <audio controls>
    <source src="track.mp3" type="audio/mpeg">
    <p><a href="track.mp3" download>Download track</a></p>
  </audio>
</audio-player>
```

**2. Extract the visualizer:** The retro visualizer, currently embedded in `audio-player`, should become a retro-styled `<audio-visualizer>` implementation. The two components remain visually paired but are independently composable.

> **Tag name note:** The new platform-native `<audio-player>` and the retro bundle's existing `<audio-player>` share a tag name. This needs resolution before both ship. Options: rename the retro component (e.g. `retro-audio-player`), or accept that the retro component is superseded by this spec and migrate it rather than maintain two.

---

## Open Questions

- **`data-audio-played` persistence:** Should played state survive page reload via `localStorage` keyed on track `href`? Or session-only?
    - Thomas: Like themes and page notes it will be retained.
- **`data-audio-favorite` interactivity:** Should `<audio-player>` allow users to toggle favorites (written back to DOM), or is this always author-only?
    - Thomas: This suggests that we have some author mechanism for a hot or favorited track as opposed to a user preference which is selected by the end user.
- **AudioContext singleton scope:** The shared registry pattern assumes one page. Does it hold correctly when multiple `<audio-visualizer>` elements reference different `<audio>` elements simultaneously?
     - Thomas: If there are multiple audio players per page they either will have separate visualizers or if a single the start of a play on one would pause the others.
- **Track list without JS — navigation:** Without JS, clicking a track link navigates away. Should track `<a>` elements also carry `download` to trigger in-place download instead? Or is navigation acceptable?
      - Thomas: Audio tracks are downloaded if no audio support is available.  If JS is available a download link via a small icon is provided on listing or the player.
- **Autoplay policy:** `data-autoplay` on `<audio-player>` will be silently blocked by browsers unless there has been prior user interaction. Document this constraint; consider a console warning in dev builds.
     - Thomas: document only