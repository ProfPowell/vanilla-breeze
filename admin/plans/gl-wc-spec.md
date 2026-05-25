# `<gl-wc>` — Design Spec

**Status:** Spec, ready to implement.
**Audience:** Implementer (likely a separate repo, mirroring the screen-saver / pdf-viewer integration model).
**Last revised:** 2026-05-22.
**Source of motivation:** `admin/research/cult-compare.md` § Integration-tier candidates.

---

## 1. One-line positioning

> `<gl-wc>` is a Vanilla Breeze-integrated, theme-aware graphics-layer web component that renders an animated background (shaders, particles, mesh gradients) behind any HTML content, opting into WebGL or Canvas2D as each preset requires.

It is the integration-tier answer to cult-ui's shader-hero / particle / warp / dithering components — but as a single primitive with preset catalog rather than 10 sibling components.

---

## 2. Why it exists

VB core has 30+ CSS-driven decoration effects (`shimmer`, `glow`, `neon`, `glitch`, `sparkle`, …). They're declarative, lightweight, and accessible. They do not cover **continuous, GPU-rendered or canvas-rendered backgrounds** — animated shader heroes, particle drifts, mesh gradients — because those carry costs (GL runtime, RAF loop, canvas memory) that should never be paid by a page that doesn't ask for them.

`<gl-wc>` is the opt-in escape hatch: a single component you can drop on a page when you want ambient motion at the cost of a small JS payload and a GPU frame budget. Pages that don't use it pay nothing.

Follows the same integration pattern as `<pdf-viewer>` (PDF.js), `<screen-saver>` (17 effects), `<terminal-window>`, `<code-playground>`: standalone npm package, reads VB tokens via shadow-DOM inheritance, no build coupling with the core VB repo.

---

## 3. Distribution & repo posture

Mirrors screen-saver exactly:

- **npm package:** `@profpowell/gl-wc` (or chosen org scope).
- **GitHub repo:** `ProfPowell/gl-wc`.
- **License:** MIT.
- **Stack:** vanilla JS, no framework, no build dependency on VB.
- **Versioning:** semver. Pre-`1.0` while preset names settle; lock the preset namespace at `1.0`.
- **VB coupling:** zero. The contract is CSS custom properties only.
- **Docs page in VB site:** `/docs/integrations/web-components/gl-wc.html`, structured like `screen-saver.html`.
- **Handoff doc:** `admin/handoffs/gl-wc-integration.md` (to be authored alongside `1.0`, mirroring `screen-saver-integration.md`).

---

## 4. Public API

### 4.1 Element

```html
<gl-wc preset="dither" intensity="0.7">
  <h1>Hero headline</h1>
  <p>This content sits above the rendered layer.</p>
  <!-- Optional reduced-motion / no-GL fallback -->
  <picture slot="fallback">
    <img src="hero-static.webp" alt="">
  </picture>
</gl-wc>
```

### 4.2 Attributes

| Attribute       | Type / values                                                                                                  | Default       | Notes |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| `preset`        | One of the named presets in § 5. **Required.**                                                                  | —             | Changing at runtime swaps renderers (lazy-loads the new preset). |
| `palette`       | `"theme"` \| `"rainbow"` \| `"mono"`                                                                            | `"theme"`     | Theme reads VB semantic tokens; rainbow uses preset-internal hardcoded palette; mono uses `--color-foreground`. |
| `intensity`     | `0`–`1` (clamped)                                                                                              | `0.5`         | Generic "how dramatic" knob; meaning is preset-specific. |
| `speed`         | `0`–`5`                                                                                                        | `1`           | Time multiplier. `0` freezes the first frame. |
| `density`       | `0`–`1`                                                                                                        | `0.5`         | Particle count / shader step density. |
| `seed`          | integer                                                                                                        | `0`           | Deterministic randomness — same seed produces same animation. Useful for screenshots. |
| `paused`        | boolean (presence)                                                                                              | unset         | Pauses the RAF loop without unmounting. |
| `pixel-ratio`   | number                                                                                                          | clamped to `min(devicePixelRatio, 2)` | Authors can lower it for cheaper rendering on big monitors. |
| `quality`       | `"low"` \| `"med"` \| `"high"`                                                                                  | `"med"`       | Renderer-level hint — controls anti-aliasing, particle count cap, shader detail. |
| `fit`           | `"cover"` \| `"contain"` \| `"stretch"`                                                                         | `"cover"`     | How the rendered surface sizes inside the host box. |
| `motion`        | `"auto"` \| `"reduce"` \| `"force"`                                                                             | `"auto"`      | `auto` honors `prefers-reduced-motion`; `reduce` always falls back; `force` ignores the media query (use sparingly, document trade-off). |

Attribute changes after first render are observed via `attributeChangedCallback`. Cheap params (uniforms like `intensity`, `speed`) update without recompile. `preset` triggers a renderer swap (tear down old, dynamic-import new).

### 4.3 Slots

| Slot         | Purpose                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| *(default)*  | Content rendered above the GL/canvas layer. Stays in the light DOM, fully styleable by VB.               |
| `fallback`   | What to show when GL is unavailable, the preset fails to load, or `motion="reduce"` is active. Author usually drops a `<picture>` here. If absent, the element falls back to its computed `background` (so authors can also fall back via CSS). |

### 4.4 Properties / methods (JS surface)

| Member         | Type                                  | Behavior |
| -------------- | ------------------------------------- | -------- |
| `.preset`      | string                                | Reflects `preset` attribute. |
| `.paused`      | boolean                               | Reflects `paused` attribute. |
| `.pause()`     | `() => void`                          | Pause the render loop. |
| `.resume()`    | `() => void`                          | Resume the render loop. |
| `.snapshot()`  | `() => Promise<Blob>`                 | PNG snapshot of current frame. |
| `.ready`       | `Promise<void>`                       | Resolves when the active preset has compiled / first frame is on screen. |

### 4.5 Events

| Event                    | Detail                                | When |
| ------------------------ | ------------------------------------- | ---- |
| `gl-wc:ready`            | `{ preset, renderer: "webgl"\|"canvas2d" }` | First frame rendered. |
| `gl-wc:preset-changed`   | `{ from, to }`                        | After successful preset swap. |
| `gl-wc:error`            | `{ phase, error }`                    | Compile, load, or runtime errors. Element transitions to fallback. |
| `gl-wc:visibility`       | `{ visible: boolean }`                | IntersectionObserver gate flips (informational). |

---

## 5. Preset catalog (v1)

Ship with **nine** presets. Two renderer families: WebGL (shader-based) and Canvas2D (particle-based). The component internally chooses; authors don't.

### 5.1 WebGL shader presets

| Preset          | Visual                                                                              | Renderer | VB tokens consumed                                            |
| --------------- | ----------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `dither`        | Bayer/ordered-dither animated gradient between two theme colors.                    | WebGL    | `--color-primary`, `--color-accent`, `--color-background`     |
| `noise`         | Cellular / fractal noise, slowly drifting. Two-color tint.                          | WebGL    | `--color-foreground`, `--color-background`                    |
| `mesh-gradient` | Animated multi-stop gradient with soft warping blobs (Stripe-style hero).           | WebGL    | `--color-primary`, `--color-accent`, `--color-info`, `--color-background` |
| `warp`          | Warped grid / displacement field. Distorts a theme-color base.                      | WebGL    | `--color-primary`, `--color-background`                       |

### 5.2 Canvas2D particle presets

| Preset      | Visual                                                                                       | Renderer | VB tokens consumed                                                   |
| ----------- | --------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| `stars`     | Slow-drifting starfield (plus optional parallax layer with `intensity` > 0.5).               | Canvas2D | `--color-foreground`, `--color-background`                            |
| `snow`      | Falling flakes with slight drift.                                                             | Canvas2D | `--color-foreground` (white at high contrast), `--color-background`   |
| `confetti`  | Triggered-or-continuous confetti drop. Pull palette from VB semantic colors.                  | Canvas2D | `--color-primary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-error` |
| `network`   | Connected-dots network mesh (lines drawn between near neighbors).                             | Canvas2D | `--color-primary`, `--color-foreground`                               |
| `particles` | Generic colored particles drifting in random directions. Most-configurable, least-opinionated. | Canvas2D | Per `palette` attribute (theme / rainbow / mono).                     |

### 5.3 Adding presets later

Each preset is its own module (see § 7) and a new preset is one file + a registry entry. Document a `CONTRIBUTING.md` rule: presets must (a) honor the `palette` / `intensity` / `speed` / `density` knobs, (b) ship a reduced-motion behavior, (c) declare which VB tokens they consume, (d) be < 4 KB minified.

---

## 6. Theme-token contract

Identical philosophy to screen-saver: read VB tokens via shadow-DOM inheritance with sensible fallbacks. **No build-time coupling. No piercing.**

### 6.1 Tokens consumed by the component itself

| Token                 | Used for                                          | Fallback                  |
| --------------------- | ------------------------------------------------- | ------------------------- |
| `--color-background`  | Clear color / canvas backdrop                     | `transparent`             |
| `--color-foreground`  | Default particle / line color                     | `#1a1a1a`                 |
| `--color-primary`     | Primary tint in shader presets                    | `#3b82f6`                 |
| `--color-accent`      | Accent tint in shader presets                     | `#ec4899`                 |
| `--color-info`        | Tertiary tint (`mesh-gradient`)                   | `#10b981`                 |
| `--color-success`     | Confetti palette                                  | `#22c55e`                 |
| `--color-warning`     | Confetti palette                                  | `#f59e0b`                 |
| `--color-error`       | Confetti palette                                  | `#ef4444`                 |

### 6.2 Component-namespaced overrides

For when an author wants to feed a specific value without changing the global theme:

| Override                    | Beats                  |
| --------------------------- | ---------------------- |
| `--gl-wc-color-1`           | `--color-primary`      |
| `--gl-wc-color-2`           | `--color-accent`       |
| `--gl-wc-color-3`           | `--color-info`         |
| `--gl-wc-color-bg`          | `--color-background`   |
| `--gl-wc-color-fg`          | `--color-foreground`   |
| `--gl-wc-speed`             | `speed` attribute      |
| `--gl-wc-density`           | `density` attribute    |
| `--gl-wc-intensity`         | `intensity` attribute  |
| `--gl-wc-pixel-ratio`       | `pixel-ratio` attribute |
| `--gl-wc-z-index`           | internal stacking      |

Tokens read once per frame via `getComputedStyle()` for cheap params; theme switches reflect within one RAF tick without re-init.

### 6.3 Color sampling: how strings become GL uniforms

VB tokens may be `hsl(...)`, `oklch(...)`, `#hex`, named, etc. Internally, the component parses via a temporary `<canvas>` `getContext("2d").fillStyle` round-trip to convert to RGBA. Cached per-string. This avoids needing a color-parsing dependency.

---

## 7. Architecture

### 7.1 Module shape

```
src/
├── gl-wc.js              # Element class, attribute handling, RAF loop
├── renderer/
│   ├── webgl.js          # Shared WebGL2 (with WebGL1 fallback) context wrapper
│   ├── canvas2d.js       # Shared Canvas2D wrapper
│   └── tokens.js         # VB-token resolver (CSS var → RGBA cache)
├── presets/
│   ├── dither.js
│   ├── noise.js
│   ├── mesh-gradient.js
│   ├── warp.js
│   ├── stars.js
│   ├── snow.js
│   ├── confetti.js
│   ├── network.js
│   ├── particles.js
│   └── index.js          # Registry — name → dynamic import
└── util/
    ├── observe.js        # IntersectionObserver, visibility, reduced-motion
    └── pause.js          # Tab-hidden / out-of-viewport pause logic
```

### 7.2 Render loop

- **Single RAF loop per element.** No global ticker — keeps elements independent and lets each pause cleanly.
- **Auto-pause when:**
  - Element is fully outside the viewport (IntersectionObserver, `rootMargin: "200px"`).
  - Document tab is hidden (`document.visibilitychange`).
  - `paused` attribute is present.
  - `prefers-reduced-motion: reduce` is active and `motion !== "force"`.
- **Resume rules:** mirror the pause rules. No frame is rendered while paused. On resume, `time` advances from where it left off (don't fast-forward).

### 7.3 WebGL context handling

- Prefer **WebGL2**, fall back to WebGL1.
- One context per element (do *not* share across elements — context loss handling becomes painful and most pages will only have one `<gl-wc>` anyway).
- `webglcontextlost` → pause + dispatch `gl-wc:error` + show `fallback` slot.
- `webglcontextrestored` → re-init the active preset and resume.
- Use offscreen-canvas where supported (`OffscreenCanvas`) so the main thread is freer.

### 7.4 Bundle/lazy-load strategy

- Importing `<gl-wc>` ships **only** the element class + RAF loop + WebGL/Canvas2D wrappers + the IntersectionObserver/visibility utilities. Target: < 6 KB gzipped.
- Each preset is a separate dynamic import: `await import(`./presets/${name}.js`)`. Triggered on first use of that preset on that page (cache shared across elements).
- Presets register themselves into the registry on import; the registry is a `Map<string, PresetFactory>`.
- The registry exposes the preset catalog so the docs page (and any tooling) can enumerate presets without loading them.

### 7.5 Reduced-motion contract

`prefers-reduced-motion: reduce` triggers the same code path as `motion="reduce"`:

1. **If `fallback` slot has content** → show the slot, hide the canvas.
2. **Else if the preset declares a `static()` method** → render one frame at `time=0, seed=seed`, then halt.
3. **Else** → hide the canvas, keep the host transparent (CSS `background` shows through).

Authors are encouraged to provide a `<picture slot="fallback">` for the best result; the component degrades gracefully without.

---

## 8. Accessibility

- The rendered layer is **decorative**. The internal `<canvas>` carries `aria-hidden="true"` and `role="presentation"`. It must never be tab-stoppable.
- The default slot (slotted children) is the **only** thing AT consumers see — semantically the host element is whatever the children make it. Author should pick the right wrapper element type (`<section>`, `<header>`, `<aside>`) by wrapping `<gl-wc>` in it, *not* by making `<gl-wc>` claim a role.
- `:focus-within` styling: when a focusable child is focused inside `<gl-wc>`, the host gets `:state(--child-focused)` for authors to use (e.g. pause motion on focus). This is a small affordance for users who find motion distracting under cognitive load.
- Color sampling does **not** check contrast. Authors choose theme combinations; the component renders what it's told. Document this clearly — `<gl-wc>` is not a contrast tool.

---

## 9. Performance posture

- **Default `pixel-ratio` clamp to `min(devicePixelRatio, 2)`.** 5K monitors don't get the perf bill for full-res GPU rendering by default.
- **Frame budget target:** under 4 ms / frame on a M1-class device at 1080p for any v1 preset. Anything that can't meet that ships behind `quality="high"`.
- **Particle counts:** preset-specific cap of ~500 (med), ~1500 (high), ~150 (low).
- **Devicelab smoke test** before shipping each preset: scroll a 2-up `<gl-wc>` page on a 4-year-old Pixel and confirm > 30 fps.
- **Battery posture:** auto-pause when battery API reports `level < 0.2 && !charging` (where API is available). Optional, behind a `power-save="auto"` attribute (default `"auto"`); authors can disable.

---

## 10. Docs page outline (`/docs/integrations/web-components/gl-wc.html`)

Mirror `screen-saver.html` exactly:

1. Breadcrumb.
2. H1 + lead paragraph that includes the theme-inheritance promise.
3. "Where to find it" (npm / GitHub / license).
4. Install (CDN + npm).
5. Demos — one `<browser-window>` per preset, theme-paired demo HTML in `demos/gl-wc-<preset>.html`.
6. Preset catalog table (preset → renderer → tokens consumed).
7. The `palette` attribute deep-dive.
8. Quick reference table (attributes + custom props).
9. Reduced motion behavior.
10. Performance notes.
11. Link to README for the full token list.

A 12-preset future state would call for a preset gallery component (a `<gl-wc-gallery>` that previews each at low quality + low density). Out of scope for v1.

---

## 11. What's out of scope for v1

- **Author-provided custom GLSL.** Defer to v1.1. The risk surface (XSS via shader, perf, debuggability) deserves a separate pass. Authors who need it can fork.
- **Audio-reactive presets** (FFT-driven uniforms). Cool, niche, defer.
- **3D/depth presets** (three.js wrapper). Different scope, different package.
- **Mouse-following / interactive presets.** Defer — needs an explicit interaction-model decision.
- **Server-side render to static image.** Not impossible (offscreen-canvas in a Worker), but defer.

---

## 12. Open questions for the implementer

1. **Naming the npm package.** `@profpowell/gl-wc` follows the screen-saver pattern. Confirm scope.
2. **Confetti as a one-shot vs continuous preset.** Decide: is `confetti` continuous (drift loop) or burst (fires once, configurable by `.burst()` method)? Recommend continuous default + `.burst(count)` method for one-shots.
3. **Palette for `confetti` and `particles` under `palette="rainbow"`.** Pick a fixed 8-color rainbow (document it) or sample from `hsl(0..360, 70%, 60%)` algorithmically. Recommend algorithmic.
4. **OffscreenCanvas availability.** Safari ships it as of 2023. Confirm if we want a Worker-rendered path for v1 or defer until v1.1 once telemetry shows main-thread cost matters.
5. **Should `motion="force"` exist?** It's an a11y trap. Recommend ship it but emit a `console.warn` when it overrides the user's media query.

---

## 13. Acceptance checklist (v1.0 ship)

- [ ] All nine presets implemented, each < 4 KB minified.
- [ ] Each preset honors `palette`, `intensity`, `speed`, `density`, `seed`, `motion`.
- [ ] `prefers-reduced-motion` fallback wired and tested for every preset.
- [ ] Theme-token inheritance verified in a VB host page across at least 3 brand themes + 1 a11y theme.
- [ ] IntersectionObserver auto-pause measurably stops rendering when scrolled off-screen (verify with Chrome DevTools performance panel).
- [ ] `webglcontextlost` / `webglcontextrestored` handled — page survives a tab-throttle / GPU-reset cycle.
- [ ] Docs page at `/docs/integrations/web-components/gl-wc.html` matches the screen-saver template.
- [ ] Handoff doc `admin/handoffs/gl-wc-integration.md` authored.
- [ ] `gl-wc-integration` beads issue closed with link to npm and the docs page.

---

## 14. Cross-references

- **Pattern precedent:** `admin/handoffs/screen-saver-integration.md` (the doc this spec most closely mirrors).
- **Token surface precedent:** `admin/research/pdf-viewer-token-audit.md` (showed how to inventory which tokens an integration consumes).
- **Motivation:** `admin/research/cult-compare.md` § Integration-tier candidates.
- **Related core work in cult-compare:** border-beam decoration, direction-aware tabs, inline expandable, shadcn-registry endpoint — independent of this spec.
- **VB integrations index:** [vanilla-breeze.com/docs/integrations/](https://vanilla-breeze.com/docs/integrations/).
