---
title: Vanilla Breeze Component Contract Specification
description: The authoring contract every first-party and third-party component must follow to participate in the bundle and theming system.
version: 1.0.0
---

# Vanilla Breeze Component Contract Specification

Every component in the Vanilla Breeze ecosystem — first-party or third-party — participates in a shared contract. The contract has two jobs: making components **theme-swappable** (the token layer auto-inherits from whatever theme is active) and making them **interchangeable** (multiple bundles can implement the same component tag using the same public API).

---

## Table of Contents

- [Core Principle](#core-principle)
- [The Contract Document](#the-contract-document)
- [Five Authoring Rules](#five-authoring-rules)
- [Token Layer](#token-layer)
- [Parts API](#parts-api)
- [Attribute API](#attribute-api)
- [Events API](#events-api)
- [Bundle Metadata](#bundle-metadata)
- [Graceful Degradation](#graceful-degradation)
- [Registration API](#registration-api)
- [Contract Document Format](#contract-document-format)
- [Example: `audio-player` Contract](#example-audio-player-contract)
- [Validation Checklist](#validation-checklist)

---

## Core Principle

A component has two distinct layers. The **token layer** is owned by the active theme — it swaps automatically with no work from the component author. The **chrome layer** is owned by the bundle — it defines the aesthetic personality of the component.

```
Theme active: retro
 └─ Token layer:  --color-primary = phosphor green, --radius-m = 0px
 └─ Chrome layer: (retro bundle) beveled edges, CRT screen, VU meters

Theme active: kawaii
 └─ Token layer:  --color-primary = pink, --radius-m = 999px
 └─ Chrome layer: (retro bundle still loaded) same bevels, now pink
                  (kawaii bundle loaded instead) rounded, bubbly, pastel
```

A retro audio player loaded into a kawaii theme gets kawaii *colors* with retro *structure*. That is correct behaviour. If you want full kawaii, load the kawaii audio player. Both honour the same contract and are substitutable.

---

## The Contract Document

Every component ships with a `.contract.md` file in its directory. This is both machine-readable metadata (YAML frontmatter) and human-readable documentation.

```
src/components/retro/
├── audio-player.js            ← implementation
├── audio-player.css           ← chrome layer styles
├── audio-player.contract.md   ← the contract (this format)
└── audio-player.demo.html     ← usage example
```

The contract is the interface. The implementation is the delivery. Third parties who want to provide an alternative implementation must honour the contract exactly.

---

## Five Authoring Rules

These are non-negotiable. A component that breaks any of these is not contract-compliant.

### Rule 1 — All colours reference design tokens

Raw colour values are forbidden inside a component's shadow DOM styles. Every colour must trace back to a CSS custom property from the token system.

```css
/* ✗ Wrong — hardcoded colour */
:host { background: #1a1a1a; }

/* ✓ Correct — token reference */
:host { background: var(--color-surface-sunken); }

/* ✓ Also correct — component token that falls back to system token */
:host { background: var(--audioplayer-bg, var(--color-surface-sunken)); }
```

### Rule 2 — Expose a `--component-*` custom property API

Every styleable aspect of the component must be reachable via a documented CSS custom property, defaulting to the appropriate system token.

```css
:host {
  /* Component tokens — the public override API */
  --audioplayer-screen-color: var(--color-primary);
  --audioplayer-bg:           var(--color-surface-sunken);
  --audioplayer-bezel:        var(--color-border);
  --audioplayer-text:         var(--color-text);
  --audioplayer-control-size: var(--size-m);
}
```

Authors tune these on the element without touching internals:

```html
<audio-player style="--audioplayer-screen-color: oklch(70% 0.28 30)">
```

### Rule 3 — Expose structural regions via `::part()`

Internal DOM regions that a consumer might reasonably want to restyle must be exposed via the `part` attribute. This lets consumers reach inside the shadow DOM with `::part()` without needing to override or pierce it.

```html
<!-- Inside shadow DOM template -->
<div part="screen">...</div>
<div part="controls">...</div>
<div part="bezel">...</div>
<button part="play-button control">...</button>
```

```css
/* Consumer can write this in their own stylesheet */
audio-player::part(screen) {
  border-radius: 50%;
  aspect-ratio: 1;
}
```

Parts should be named for their **function**, not their visual appearance. `controls` not `bottom-bar`. `screen` not `dark-rectangle`.

### Rule 4 — Declare bundle membership in the class static metadata

```js
class AudioPlayer extends HTMLElement {
  static bundle   = 'retro';
  static contract = 'audio-player';
  static version  = '1.0.0';

  // Tokens this component reads from the system (for tooling/docs)
  static consumesTokens = [
    '--color-primary',
    '--color-surface-sunken',
    '--color-border',
    '--color-text',
    '--size-m',
    '--radius-m',
    '--font-mono',
  ];

  // Component-level tokens this component exposes
  static exposesTokens = [
    '--audioplayer-screen-color',
    '--audioplayer-bg',
    '--audioplayer-bezel',
    '--audioplayer-text',
    '--audioplayer-control-size',
  ];
}
```

### Rule 5 — Render a usable fallback without JS

The component must render meaningful content when JavaScript is unavailable or before the custom element is defined. The minimum bar: a native `<audio>` element with browser controls. Bundle CSS may enhance; it may never be the only path to basic function.

```html
<!-- Fallback content in light DOM slot -->
<audio-player src="track.mp3">
  <!-- Shown if JS unavailable -->
  <audio controls src="track.mp3">
    Your browser does not support audio playback.
  </audio>
</audio-player>
```

---

## Token Layer

### System tokens (consumed)

The component reads these from the active theme. They must never be hardcoded.

| Token category | What to use it for |
|---|---|
| `--color-surface-sunken` | Component background, deep recessed areas |
| `--color-surface-raised` | Elevated elements, buttons at rest |
| `--color-primary` | Accent colour, active state, display highlight |
| `--color-border` | Bezel edges, dividers, inactive states |
| `--color-text` | Labels, readouts |
| `--color-text-muted` | Secondary labels, inactive indicators |
| `--size-*` | Spacing, control sizing |
| `--radius-*` | Corner rounding — use `--radius-m` for medium controls |
| `--font-mono` | Numeric readouts, technical displays |
| `--shadow-*` | Depth and elevation |

### Component tokens (exposed)

Named as `--{tag-name}-{property}`. Document every one.

| Naming pattern | Example |
|---|---|
| `--{tag}-bg` | `--audioplayer-bg` |
| `--{tag}-{part}-color` | `--audioplayer-screen-color` |
| `--{tag}-{part}-size` | `--audioplayer-control-size` |
| `--{tag}-{feature}-speed` | `--audioplayer-vu-speed` |

---

## Parts API

Declare all exposed parts in the contract. For compound parts (an element that is both a specific control and a general category), list both:

```html
<button part="play-button control">Play</button>
<button part="skip-button control">Skip</button>
<div    part="screen display">...</div>
<div    part="vu-meter display">...</div>
```

This lets consumers target all controls at once (`::part(control)`) or a specific one (`::part(play-button)`).

### Required parts for common component types

**Media players must expose:** `screen`, `controls`, `bezel`, `timeline`, `volume`  
**Data displays must expose:** `display`, `label`, `value`  
**Navigation must expose:** `nav`, `item`, `indicator`

---

## Attribute API

Attributes are the HTML author's interface. They must be consistent across all bundle implementations of the same contract.

### Conventions

- Boolean attributes use presence/absence: `<audio-player autoplay>` not `autoplay="true"`
- Enum attributes use `data-` prefix for visual/behavioural variants: `data-visualizer="bars"`
- Content attributes use plain names for semantic data: `src`, `label`, `value`
- State is reflected as `data-state`: `data-state="playing"`, `data-state="paused"`

### Required vs optional

The contract distinguishes **required** (every implementation must support), **recommended** (strong default, omit only with documented reason), and **optional** (implementation-specific).

---

## Events API

Custom events follow the `vb:component:action` naming pattern.

```js
// Dispatch
this.dispatchEvent(new CustomEvent('vb:audioplayer:play', {
  bubbles: true,
  composed: true,    // crosses shadow DOM boundary
  detail: { currentTime: 0, src: this.src }
}))
```

```js
// Consumer listens
document.querySelector('audio-player')
  .addEventListener('vb:audioplayer:play', e => {
    console.log('Playing from', e.detail.currentTime)
  })
```

All events must set `composed: true` so they cross the shadow DOM boundary and bubble to document-level listeners.

---

## Bundle Metadata

The bundle `index.js` exports a manifest that the registration system uses:

```js
// src/components/retro/index.js
export const bundle = {
  name: 'retro',
  version: '1.0.0',
  components: [
    {
      tag: 'audio-player',
      contract: 'audio-player',
      impl: () => import('./audio-player.js'),
    },
    {
      tag: 'led-counter',
      contract: 'numeric-display',
      impl: () => import('./led-counter.js'),
    },
  ],
}
```

The lazy `impl` import means components only load when first used in the DOM.

---

## Graceful Degradation

Every component must define a `reducedMotionFallback()` static method. The registration system calls this automatically when `prefers-reduced-motion: reduce` is active.

```js
static reducedMotionFallback(el) {
  // Stop the oscilloscope canvas animation
  el._stopVisualizer()
  // Show a static frequency bar instead
  el.shadowRoot.querySelector('[part="screen"]')
    .setAttribute('data-static', '')
}
```

For `prefers-color-scheme: no-preference` and high contrast mode, rely on the token system — it handles these automatically through the theme's token definitions.

---

## Registration API

Both first-party and third-party components use the same registration path. The registry wraps `customElements.define()` and adds the coordination layer.

```js
import { register } from 'vanilla-breeze/registry'

register('audio-player', AudioPlayer, {
  bundle: 'retro',
  contract: 'audio-player',
  priority: 10,  // higher number wins if multiple bundles loaded
})
```

### Priority and conflict resolution

When two bundles both register an implementation for the same contract tag, the higher priority wins. The first-party `core` bundle uses priority `0`. All other bundles should use positive integers. An explicit `data-bundle` attribute on the element overrides priority entirely:

```html
<!-- Forces retro implementation even if kawaii bundle has higher priority -->
<audio-player src="track.mp3" data-bundle="retro">
```

---

## Contract Document Format

The `.contract.md` file uses YAML frontmatter for machine-readable metadata and Markdown for human-readable documentation.

```markdown
---
contract: audio-player
version: 1.0.0
tag: audio-player
bundle-hint: retro          # suggested bundle, not required
category: media

# Tokens this component reads from the system
consumes-tokens:
  - --color-primary
  - --color-surface-sunken
  - --color-border
  - --color-text
  - --size-m
  - --radius-m
  - --font-mono

# Custom properties this component exposes
exposes-tokens:
  - name: --audioplayer-screen-color
    default: var(--color-primary)
    description: Colour of the oscilloscope line and active accents
  - name: --audioplayer-bg
    default: var(--color-surface-sunken)
    description: Main component background

# Shadow DOM parts
parts:
  - name: bezel
    description: Outer housing of the player
  - name: screen
    description: Visualizer display area
  - name: controls
    description: Transport control region
  - name: play-button
    description: Play/pause toggle button
    also: control
  - name: timeline
    description: Seek bar and progress track
  - name: volume
    description: Volume control region
  - name: time-display
    description: Current time and duration readout
    also: display

# HTML attributes
attributes:
  - name: src
    required: true
    type: string
    description: Audio source URL
  - name: autoplay
    required: false
    type: boolean
    description: Begin playback on load
  - name: loop
    required: false
    type: boolean
  - name: data-visualizer
    required: false
    type: enum
    values: [bars, wave, circle, none]
    default: wave

# DOM events dispatched by this component
events:
  - name: vb:audioplayer:play
    detail: "{ currentTime: number, src: string }"
  - name: vb:audioplayer:pause
    detail: "{ currentTime: number }"
  - name: vb:audioplayer:ended
    detail: "{ src: string }"
  - name: vb:audioplayer:timeupdate
    detail: "{ currentTime: number, duration: number, progress: number }"

# Fallback content
fallback: >
  Place a native <audio controls> element as child content.
  It will be shown if JavaScript is unavailable.
---

# audio-player

A themeable audio player with a canvas visualizer.
...
```

---

## Example: `audio-player` Contract

The full contract for the audio player component implemented in the retro bundle. This document is the authoritative spec — any alternative implementation (kawaii, sci-fi, etc.) must fulfil everything listed here.

### Minimum viable implementation

A compliant implementation must:

1. Play audio from the `src` attribute
2. Provide accessible play/pause, seek, and volume controls
3. Reflect playback state as `data-state` on the host element
4. Dispatch all listed events
5. Expose all listed `::part()` names
6. Honour all listed CSS custom properties with the specified fallbacks
7. Render a usable native audio fallback before JS executes

### What implementations are free to vary

- Visual layout and structure of the chrome
- Number and style of visualizer modes
- Extra custom properties beyond the required set
- Extra parts beyond the required set
- Animation style and character
- Whether a visualizer is present at all (must degrade cleanly if absent)

---

## Validation Checklist

Before publishing a component or bundle:

### Token compliance
- [ ] No hardcoded colour values in shadow DOM styles
- [ ] All colours reference `--color-*` tokens or `--component-*` props
- [ ] All `--component-*` props fall back to system tokens
- [ ] All custom properties documented in contract file

### Parts API
- [ ] All structural regions have `part` attributes
- [ ] Part names are functional, not visual
- [ ] Compound parts use space-separated multiple names
- [ ] All parts listed in contract frontmatter

### Attribute API
- [ ] Required attributes validated in `connectedCallback`
- [ ] Boolean attributes use presence/absence
- [ ] Enum attributes validated against allowed values
- [ ] `data-state` reflects component state

### Events
- [ ] All events use `vb:tag:action` naming
- [ ] All events set `bubbles: true, composed: true`
- [ ] All events have typed `detail` objects
- [ ] All events listed in contract frontmatter

### Fallback
- [ ] Component renders without JS (light DOM fallback)
- [ ] `reducedMotionFallback()` static method defined
- [ ] Animations stop when `prefers-reduced-motion` active

### Bundle registration
- [ ] `static bundle`, `static contract`, `static version` defined
- [ ] `static consumesTokens` array complete
- [ ] `static exposesTokens` array complete
- [ ] Registered via `VanillaBreeze.register()` not bare `customElements.define()`
