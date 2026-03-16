# `video-player` Web Component Specification

> **Status:** Draft
> **Date:** 2026-03-09
> **Precedent:** `audio-player` — mirrors its architecture with video-specific adaptations

---

## 1. Markup Contract

### Single Video

```html
<video-player>
  <video controls poster="poster.jpg">
    <source src="video.mp4" type="video/mp4">
    <track kind="captions" src="en.vtt" srclang="en" label="English" default>
    <p><a href="video.mp4" download>Download video</a></p>
  </video>
</video-player>
```

### Playlist Mode

Mirrors audio-player's `<details>` + `<ol class="track-list">` pattern:

```html
<video-player>
  <video controls poster="ep1.jpg">
    <source src="episodes/01.mp4" type="video/mp4">
    <track kind="captions" src="captions/01-en.vtt" srclang="en" label="English" default>
  </video>
  <details>
    <summary>Episodes</summary>
    <ol class="track-list">
      <li data-video-active>
        <a href="episodes/01.mp4" data-poster="ep1.jpg" data-captions="captions/01-en.vtt">01. Introduction</a>
        <span class="track-meta"><time datetime="PT12M30S">12:30</time></span>
      </li>
      <li>
        <a href="episodes/02.mp4" data-poster="ep2.jpg">02. Getting Started</a>
        <span class="track-meta"><time datetime="PT18M45S">18:45</time></span>
      </li>
    </ol>
  </details>
</video-player>
```

### Key Decisions

- `<video>` stays in **light DOM** (queried via `this.querySelector('video')`) — identical to audio-player pattern
- `<track>` elements stay on native `<video>` — browser handles caption rendering
- Custom controls overlay the video in **shadow DOM** (unlike audio-player where controls sit beside the hidden audio)
- The `<video>` element remains **visible via `<slot>`** (not hidden like `<audio>`)
- Uses `data-video-active` / `data-video-played` / `data-video-favorite` (parallels audio's `data-audio-*`)
- Track `<a>` elements support optional `data-poster` and `data-captions` for per-track switching

---

## 2. Shadow DOM Structure

```
.player (part="player") — position: relative wrapper
├── <slot> — renders <video> + track-list from light DOM
├── .play-overlay (part="play-overlay") — big center play button
├── .buffer-indicator — spinner shown during buffering
├── .controls-gradient — bottom gradient scrim for readability
└── .controls (part="controls") — overlay at bottom
    ├── .timeline-wrap
    │   ├── input.timeline (part="timeline") — seek slider
    │   ├── .timeline-buffer — buffered range fill
    │   └── .timeline-fill — playback progress fill
    └── .controls-row
        ├── button.play-btn (part="play-button")
        ├── button.skip-back-btn — skip -10s
        ├── button.skip-forward-btn — skip +10s
        ├── .volume-wrap
        │   ├── button.mute-btn
        │   └── input.volume (part="volume")
        ├── span.time-display (part="time-display")
        ├── span.spacer
        ├── button.speed-btn (part="speed-button") — cycles 0.5x–2x
        ├── button.captions-btn (part="captions-button")
        └── button.fullscreen-btn (part="fullscreen-button")
```

**Critical difference from audio-player:** Controls are an overlay that fades in/out, not a permanent bar. A gradient scrim ensures readability over any video content.

---

## 3. Controls Visibility

- Visible for **3 seconds** after any interaction (mousemove, focus, keypress), then fade out
- **Always visible** when paused, not yet started, or ended
- **Touch devices:** tap toggles visibility
- CSS `opacity` + `visibility` transitions (not `display: none`) — remains accessible to screen readers
- Cursor hides when controls are hidden during playback
- `data-controls-visible` attribute on host reflects state
- `prefers-reduced-motion`: controls stay permanently visible (no fade)

---

## 4. Feature Roadmap

### Phase 1 — Core

| Feature | Notes |
|---------|-------|
| Overlay controls with gradient scrim | Bottom-bar layout over video |
| Big center play button | Shown before first play and after ended |
| Click/tap video to toggle play/pause | Clicks on slot area outside controls |
| Fullscreen toggle | Fullscreen API on **host element** (not `<video>`) so custom controls stay visible |
| Playback speed | Cycle through `[0.5, 0.75, 1, 1.25, 1.5, 2]` |
| Captions toggle | Toggle first `<track kind="captions|subtitles">` mode between `showing`/`hidden` |
| Buffer indicator | Spinner overlay on `waiting` event, buffer progress bar on timeline |
| Skip ±10s buttons | Inline buttons in controls row |
| Hour-aware time format | `h:mm:ss` when duration ≥ 1 hour, `m:ss` otherwise |
| Playlist support | Track-list navigation, per-track poster/caption switching |

### Phase 2 — Extended

| Feature | Notes |
|---------|-------|
| Picture-in-Picture | Feature-gated on `'pictureInPictureEnabled' in document` |
| Multi-track captions menu | When >1 caption/subtitle track exists |
| Chapter markers on timeline | Visual notches from `<track kind="chapters">` |
| Chapter list in shadow DOM | Absorb `chapter-list-init.js` behavior, guard with `data-chapter-list-init` |
| Shuffle mode | `data-shuffle` for playlists |
| Custom playback rates | `data-playback-rates="0.5,1,1.5,2"` |
| Number-key percentage seeking | 0–9 keys seek to 0%–90% |
| Thumbnail preview on hover | Author-provided sprite sheet via `data-preview-sprite` |
| Double-click to fullscreen | Standard convention |

---

## 5. Attributes

### Author-Set

| Attribute | Type | Phase |
|-----------|------|-------|
| `data-autoplay` | Boolean | 1 |
| `data-loop` | Boolean | 1 |
| `data-shuffle` | Boolean | 2 |
| `data-muted` | Boolean | 1 |
| `data-hide-controls` | Boolean | 2 |
| `data-playback-rates` | String (CSV) | 2 |

### Component-Managed

| Attribute | Phase | Values |
|-----------|-------|--------|
| `data-state` | 1 | `idle`, `playing`, `paused`, `buffering`, `ended` |
| `data-upgraded` | 1 | Present when initialized |
| `data-muted` | 1 | Toggled by mute control |
| `data-fullscreen` | 1 | Present in fullscreen |
| `data-captions-active` | 1 | Present when captions showing |
| `data-controls-visible` | 1 | Present when overlay controls visible |
| `data-pip` | 2 | Present in Picture-in-Picture |

---

## 6. CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--video-player-accent` | `var(--color-primary, oklch(55% 0.2 260))` | Play button, timeline fill, active states |
| `--video-player-controls-bg` | `oklch(0% 0 0 / 0.75)` | Controls bar background (semi-transparent dark) |
| `--video-player-controls-text` | `#fff` | Controls text and icon color |
| `--video-player-radius` | `var(--radius-m, 0.5rem)` | Player border radius |
| `--video-player-border` | `none` | Player border (off by default) |
| `--video-player-shadow` | `none` | Player box shadow (opt-in) |
| `--video-player-controls-padding` | `var(--size-xs) var(--size-s)` | Controls padding |
| `--video-player-overlay-bg` | `oklch(0% 0 0 / 0.4)` | Center play button backdrop |
| `--video-player-timeline-height` | `4px` | Timeline track height |
| `--video-player-timeline-buffer` | `oklch(100% 0 0 / 0.3)` | Buffer progress color |

**Key difference from audio-player:** Video controls overlay the content, so defaults are semi-transparent dark with white text (not `var(--color-surface)` with `var(--color-text)`).

---

## 7. Shadow Parts

### Phase 1

`player`, `controls`, `play-overlay`, `play-button`, `timeline`, `volume`, `time-display`, `speed-button`, `captions-button`, `fullscreen-button`

### Phase 2

`pip-button`

---

## 8. Events

All bubble + composed, `vb:video:*` namespace:

| Event | Detail | Phase |
|-------|--------|-------|
| `vb:video:play` | `{ currentTime, src }` | 1 |
| `vb:video:pause` | `{ currentTime }` | 1 |
| `vb:video:ended` | `{ src }` | 1 |
| `vb:video:track-change` | `{ src, title }` | 1 |
| `vb:video:fullscreen` | `{ active: boolean }` | 1 |
| `vb:video:speed` | `{ rate: number }` | 1 |
| `vb:video:captions` | `{ active: boolean, label: string }` | 1 |
| `vb:video:timeupdate` | `{ currentTime, duration, percent }` | 2 |
| `vb:video:pip` | `{ active: boolean }` | 2 |

---

## 9. Keyboard Shortcuts

### Phase 1

| Key | Action |
|-----|--------|
| Space | Play/pause |
| K | Play/pause (YouTube convention) |
| Left/Right arrows | Seek ±10s |
| Up/Down arrows | Volume ±5% |
| M | Mute toggle |
| F | Fullscreen toggle |
| C | Captions toggle |
| Escape | Exit fullscreen |

### Phase 2

| Key | Action |
|-----|--------|
| J / L | Seek ±10s (YouTube convention) |
| `<` / `>` | Decrease / increase speed |
| 0–9 | Seek to 0%–90% |
| Home / End | Seek to start / end |
| P | Picture-in-Picture toggle |

**Guard:** Skip if `e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'`. Set `tabindex="0"` on host if not present.

---

## 10. Progressive Enhancement

### Pre-Upgrade CSS (`styles.css`)

```css
video-player:not(:defined) {
  display: block;
}
video-player:not(:defined) video {
  display: block;
  width: 100%;
  height: auto;
}
```

### Behavior

- **Without JS:** Native `<video controls>` works fully — poster displays, `<track>` captions work via browser, playlist links navigate directly to video files
- **With JS:** Native controls suppressed (`video.controls = false`), custom shadow DOM chrome appears. Native controls restored on `disconnectedCallback`

---

## 11. Accessibility

- All controls use native `<button>` or `<input type="range">` with `aria-label` (toggled based on state, e.g. "Play" / "Pause")
- Controls group: `role="group" aria-label="Video controls"`
- Seek slider: `aria-valuetext` with formatted time (e.g. "2 minutes 30 seconds")
- Captions button: `aria-pressed` reflects current state
- Speed label: `aria-live="polite"` for rate-change announcements
- Hidden live region `role="status"` announces state changes: "Playing", "Paused", "Buffering"
- Focus ring: `var(--focus-ring-width, 2px) solid var(--color-focus-ring)`
- `prefers-reduced-motion`: all transitions disabled, controls stay permanently visible
- Captions rendering delegated to native `<video>` — browser handles text overlay positioning

---

## 12. Architecture Notes

### chapter-list-init.js Coordination

- **Phase 1:** The existing utility works on the `<video>` in light DOM because it's slotted. The chapter `<nav>` renders in light DOM after the video. No conflict.
- **Phase 2:** Component detects `data-chapter-list` and guards with `data-chapter-list-init` to prevent double-enhancement.

### Time Formatting

Must handle hours (video can be long). Reuse the pattern from `chapter-list-init.js` lines 129–138.

### container-type

Set `container-type: normal` on `.player` wrapper to prevent ancestor `container-type: inline-size` from collapsing width. (See `layout-attributes.css` — it sets `container-type: inline-size` on `main, article, section, aside`.)

### Theme Change Listener

Same force-reflow pattern as audio-player on `theme-change` event.

### Idle Timer Cleanup

`clearTimeout(this.#idleTimer)` in `disconnectedCallback`.

### Fullscreen Strategy

Call `requestFullscreen()` on the **host element** (not on `<video>`) so the shadow DOM controls remain visible in fullscreen mode. The `<video>` fills the host via CSS.

---

## 13. Bundle Placement

**`extras.js`** — consistent with audio-player's placement. Also import from `index.js` (full bundle). Add CSS import to `index.css`.

---

## 14. Implementation Files

### Create

| File | Description |
|------|-------------|
| `src/web-components/video-player/logic.js` | Component class (~800–1000 lines Phase 1) |
| `src/web-components/video-player/styles.css` | Pre-upgrade CSS |
| `src/web-components/video-player/static.html` | Progressive enhancement documentation |

### Modify

| File | Change |
|------|--------|
| `src/web-components/extras.js` | Add `import './video-player/logic.js'` |
| `src/web-components/index.js` | Add `import './video-player/logic.js'` |
| `src/web-components/index.css` | Add `@import "./video-player/styles.css"` |
| `site/src/_data/webComponents.js` | Add entry |
| `site/src/_data/navigation.json` | Add entry in Web Components section |

### Doc/Demo Files (Separate Task)

| File | Description |
|------|-------------|
| `site/src/pages/docs/elements/web-components/video-player.njk` | Doc page |
| `demos/examples/demos/video-player-basic.html` | Standalone example |
| `demos/snippets/demos/video-player-*.html` | Feature demo snippets |
| `tests/components/video-player.spec.js` | Playwright component tests |
