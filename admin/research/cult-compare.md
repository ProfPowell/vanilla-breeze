# cult-ui vs. Vanilla Breeze — Comparative Review

**Source reviewed:** https://www.cult-ui.com/ (homepage, `/docs`, ~10 component pages, the shadcn registry JSON format)
**Date:** 2026-05-22
**Scope:** Positioning, component philosophy, novel interaction patterns, distribution mechanism, AI angle, animation stack — and what (if anything) we should port, learn from, or explicitly avoid.

---

## TL;DR

cult-ui is a **78-component "expansion pack" for shadcn/ui** — React + Tailwind + Framer Motion, distributed as JSON files via shadcn's CLI registry. Its identity is **"animated, opinionated, marketing-grade flair"**: shader heroes, Apple Dynamic Island clones, neumorphic texture cards, animated buttons, AI prompt-library widgets. Free tier on the site, paid "Cult Pro" / Enterprise tiers behind it.

Compared to Vanilla Breeze:
- **VB is 1.8× larger** (140 vs 78), spans much wider territory (UX-planning, charts, data tables, calendars, code blocks, theme tooling, doc-site components), and rests on a fundamentally different stack (Web Components + CSS layers + zero framework lock-in).
- **cult-ui beats us on three things:** aesthetic **swagger** (their hero pages *feel* premium), a handful of **interaction-pattern ideas worth porting** (Dynamic Island state machine, direction-aware tabs, expandable composable disclosure, prompt-library compound primitive), and the **shadcn-registry distribution model** (one URL → CLI installs a component + its deps).
- **What we should not copy:** Framer Motion dependency, React-only API, WebGL-shader heroes as a default, neumorphism, the tiered free/Pro/Enterprise gating of "premium" components.

The honest take: cult-ui is **mostly marketing-component eye candy with a few genuinely interesting interaction primitives buried inside**. The eye candy isn't our market. The primitives are worth a serious look.

---

## What cult-ui does well (and what we could steal)

### 1. Distribution via the shadcn registry JSON format
Every component has a sibling URL like `https://cult-ui.com/r/typewriter.json` containing:
- `name`, `type` (`registry:ui`), `description`
- `dependencies` (npm packages required)
- `files[]` — each with `path`, `content` (the actual source code), `type`

One CLI command installs it:
```bash
pnpm dlx shadcn@latest add https://cult-ui.com/r/typewriter.json
```

**Why this matters for us:** This is the same `shadcn add` CLI that already exists in the wild. cult-ui inherited a working install workflow for free. We have `api.json` per component (richer, machine-readable), but **nothing that produces a one-command install**. A VB-compatible registry endpoint — `/r/<component>.json` that emits the `<link>`/`<script>`/HTML snippet and any pack dependencies — would slot us into the same agent/CLI ecosystem without changing our architecture.

This is also a natural pair with the `shad-compare.md` recommendation to ship a "Copy for LLM" button and an `npx vanilla-breeze add` CLI. **One registry format, three consumers** (CLI, agent, browser button).

### 2. The Dynamic Island as a "size-preset state machine" pattern
cult-ui's Dynamic Island isn't "iPhone notch widget" — it's a small, generalizable primitive:

- A **`DynamicIslandProvider`** holds current size state and a queued transition list.
- **12 size presets** (`default`, `compact`, `large`, `tall`, `medium`, `massive`, `compactLong`, `ultra`, etc.) animate the shell between morphologies.
- **`useDynamicIslandSize()`** hook exposes `setSize()` and `scheduleAnimation()` for chained transitions.
- Content slots (`DynamicTitle`, `DynamicDescription`, `DynamicDiv`) re-flow with motion.

This is genuinely interesting independent of the iPhone aesthetic: it's a **declarative state-machine for a single morphing surface**, applicable to compact-to-expanded notifications, in-progress media controls, ambient status pills. We have `<toast-msg>` (transient), `<notification-wc>` (persistent), `<status-wc>` (indicator), and `<pop-over>` (anchored) — but no morphing surface that holds state across modes.

**Steal worthiness:** The *idea* is high-value (5/5). The Framer Motion impl is not. A web-component version using View Transitions for shape morphing + CSS containers + `data-mode="..."` attribute switching would be ~80 lines and feel native.

### 3. Direction-aware tabs (animation responds to direction of travel)
A trivial-sounding but consistently overlooked detail: when the active tab indicator slides left → right vs right → left, the *content* underneath should animate in from the opposite direction. cult-ui's `DirectionAwareTabs` computes the direction signed integer and feeds it into the content animation.

Our `<tab-set>` does tab switching with View Transitions but doesn't direction-flag. Adding a `data-direction="forward|backward"` attribute on the active content (set imperatively before triggering VT) would give us this for free.

**Steal worthiness:** Small, polished. Worth a 30-line patch.

### 4. The "Expandable" composable disclosure primitive
cult-ui's `Expandable` is positioned as "what `<details>` would be if it were designed for product UIs": animated, slot-based, with multiple demonstrated use cases (calendar event, product card, weather forecast). It's not just a styled `<details>` — it's a primitive *meant to be composed inside other cards.*

We have `<accordion-wc>` (built on `<details>` + `[name]` for exclusive groups). It's optimized for FAQ-style stacks, not for embedding inside a card. The cult-ui pattern is "**inline disclosure inside an arbitrary surface, with smooth height transitions**." That's a real gap.

**Steal worthiness:** Medium — could be solved by a new `data-expandable` attribute on any element, or a small `<expand-wc>` that wraps trigger + content with CSS `interpolate-size: allow-keywords` for the height transition (which is now broadly supported and would let us avoid JS height-juggling entirely).

### 5. The "Prompt Library" compound primitive for AI workflows
A compound API (`PromptLibrary`, `Trigger`, `Content`, `Group`, `Search`, `Item`, `CreateDialog`) for **storing, searching, and inserting prompt templates** into an attached input. This is a useful, focused primitive — and we have nothing like it, but we *do* have `<ai-chat>`, `<ai-summary>`, `<chat-input>`, `<command-palette>`, `<combo-box>`, `<selection-menu>`.

The interesting design move: it's an *input-side* component, not a chat-side one. A user keeps a personal library of prompts and inserts them into any text field on the page. Pairs naturally with `<chat-input>` and our markdown editor.

**Steal worthiness:** High *if* AI workflows are a strategic direction; otherwise medium. Aligns with the `shad-compare.md` "AI Workflows" docs page.

### 6. Border Beam Button — animated outline as decoration
A traveling glow that orbits the button border. cult-ui implements it as a wrapper component using the `border-beam` npm package. It's a small thing but it makes their site feel alive.

We already have `outline.glow.animate`, `neon`, `shimmer`, `sparkle`, and `glow` in our decoration effects slot. We could ship a `data-effect="border-beam"` (or rename to fit) in ~40 lines of CSS using `@property --angle` + `conic-gradient(from var(--angle))` — pure CSS, no library, no JS, respects `prefers-reduced-motion` natively.

**Steal worthiness:** Very high — small, demo-friendly, would close a "their site looks slicker than ours" perception gap.

### 7. The shadcn registry JSON as an `llms.txt` companion
Their per-component `/r/<name>.json` doubles as a machine-readable installation contract. Agents already know how to read it. This is a *second* AI-native asset alongside `api.json` and skill markdown — and it's the one the install CLI consumes.

If we ship a registry endpoint, every component gets *three* coordinated artifacts (per `shad-compare.md`'s thinking): `api.json` (machine schema), `skill.md` (human + LLM prose), `r/<name>.json` (install manifest). All generated from the same source of truth.

---

## Where Vanilla Breeze is already stronger

| Dimension | VB | cult-ui |
|---|---|---|
| Component count | ~140 | 78 |
| Stack | Web Components + native HTML/CSS, no framework | React + Tailwind + Framer Motion required |
| API surface | Custom elements with attributes — works in any framework | React components — React-only |
| Animation | CSS-driven decoration effects + View Transitions | Framer Motion (~30 KB) on most components |
| Themes | 10 brand + 18 extreme + 4 a11y + packs | Light/dark only |
| Layout primitives | `layout-stack/cluster/grid/sidebar` + `data-layout-*` | None (Tailwind utilities) |
| Scroll effects | `data-trigger="scroll"` + `data-effect` catalog + parallax + scroll-progress + view-progress (just shipped) | None — they have animated heroes but no first-class scroll system |
| UX-planning verticals | user-persona, empathy-map, impact-effort, user-journey, story-map, work-item, gantt-chart, kanban, capacity-plan, traceability-matrix, risk-register | None |
| Doc-site components | code-block, browser-window, theme-picker, page-toc, syntax catalog, accessibility-specimen, breakpoint-specimen, motion-specimen, token-specimen | None — they *use* a doc site but don't ship doc components |
| Conformance / quality gates | `npm run conformance`, `htmlvalidate`, Playwright, api.json schema validation | Not advertised |
| Distribution | npm packages with per-pack subpaths + CDN-friendly bundle | shadcn registry only (and Pro CSV gating) |
| Pricing model | Free, open, no tiers | Free / Cult Pro / Enterprise (premium components paywalled) |
| Accessibility framing | First-class — `accessibility-specimen`, `prefers-reduced-motion` honored across effects, `accessibility-checker` skill | "Built on shadcn" (which is good) but not centered |
| Provenance / signing | `meta-tag-contract-v1`, `canonical-document-v1`, signed pages | None |
| LLM-readable contracts | `api.json` per component + `llm-theme-reference.css` + planned skill files | shadcn registry JSON only |

**Takeaway:** we already cover ~all of their territory at the framework level. What they have that we don't is **specific component swagger** (Dynamic Island, shader heroes, neumorphic textures) and **a one-command install story**.

---

## What we should explicitly NOT copy

### 1. Don't take on Framer Motion (or any motion-library dependency)
Most of cult-ui's components require `motion` / Framer Motion. That's a 30 KB+ React-only runtime cost per app. Our entire animation surface is CSS-driven with View Transitions for orchestration — much smaller, no framework coupling, scoped to elements that actually use it.

If we port any cult-ui pattern, **re-implement it in CSS + native APIs**, not by adopting their library choice.

### 2. Don't add WebGL/shader heroes as a default
Their `HeroDithering` requires `@paper-design/shaders-react`. It looks impressive in a marketing screenshot and quietly costs the user ~100 KB + GPU + battery. WebGL heroes are a fine *opt-in* for a designed brand site; they are not a fit for a general HTML-first library.

If we want a "wow" hero, do it with CSS `mix-blend-mode` + animated `conic-gradient` + `@property` — same visual impact, ~2 KB, no GPU shader stack.

### 3. Don't adopt neumorphism as a default texture
Texture-card's "neumorphism with sophisticated depth" is a 2020-vintage aesthetic that has aged poorly for accessibility (neumorphism is famously bad for contrast). Our themes lean flat / clear / contrast-aware. Adding a `pack-neumorphism` is fine; making it default is not.

### 4. Don't paywall components
cult-ui's Pro tier locks marketing components behind a payment. That's a fine business model for them; it'd be the wrong move for VB. We're positioned as a fully open library (and we have stronger primitives than they're charging for).

### 5. Don't restructure our component model around the React compound pattern
Their compound APIs (`<PromptLibrary>` + `<PromptLibraryTrigger>` + `<PromptLibraryContent>` + 6 more children) are idiomatic React. Web Components express the same shape with **slots + attributes** (which we already do). Don't be tempted to mint 5 child elements per primitive — slots are sufficient and produce less authoring noise.

### 6. Don't drift toward "marketing components" as a category
"Marketing Hero with Neuro Noise" and similar components are aesthetic SaaS-landing-page templates dressed as primitives. We're a doc-site / app-UI / UX-planning library. Adding marketing templates dilutes that. The right home for that work is the existing `prototype` pack or a new `marketing` pack — *not* the core surface.

---

## Component-by-component port assessment

Drawn from the 10+ cult-ui pages I sampled. Rated by relevance to VB's positioning.

| cult-ui component | VB analog today | Worth porting? | Notes |
|---|---|---|---|
| Dynamic Island | None | **Yes — high value** | Generalize as a morphing-surface primitive, not iPhone clone. Use View Transitions. |
| Direction Aware Tabs | `<tab-set>` (no direction) | **Yes — small patch** | Add `data-direction` flag before VT trigger. |
| Expandable | `<accordion-wc>` (FAQ-style) | **Yes — medium** | Either `data-expandable` attribute or `<expand-wc>` using `interpolate-size: allow-keywords`. |
| Prompt Library | None (but adjacent to `<chat-input>`, `<command-palette>`) | **Maybe — depends on AI strategy** | Worth a brainstorm doc, not a build-now. |
| Border Beam Button | `outline.glow.animate`, `neon`, `shimmer` | **Yes — small CSS add** | `@property --angle` + conic-gradient. Pure CSS, ~40 lines. |
| Text Shimmer | `shimmer` decoration effect | **Already have it** | Verify our coverage matches their look; tune if needed. |
| Typewriter | `src/effects/typewriter.js` + `data-effect="typewriter"` | **Already have it** | Audit feature parity (multi-string cycling, baseText prefix). |
| Hero Dithering (shader) | None | **No — explicit anti-rec** | Don't ship WebGL hero. If we want a dithering vibe, do it in CSS. |
| 3D Carousel | `<carousel-wc>` | **Audit + maybe enhance** | Their 3D version is CSS transforms based on the markup. Worth comparing depth-of-feature. |
| Minimal Card | `<card-list>` + `<requirement-card>` + many card-shaped components | **Already covered** | We have multiple. |
| Texture Card | None (and that's fine) | **No — anti-rec on neumorphism** | If we want a `pack-neumorphism`, fine, but not default. |
| Family Button (expanding FAB) | None | **Maybe** | Expandable FAB pattern is common in mobile UIs. Could be a `<float-action>` component or just a `data-fab` attribute on a button group. Low priority. |
| Color Picker | `<color-picker>`, `<color-palette>`, `<palette-generator>` | **Already have 3** | We're ahead. |
| Browser Window | `<browser-window>` | **Already have it** | And ours is better-integrated with doc pages. |
| Marketing Hero with Neuro Noise / Marketing CTA Particles | None | **No — anti-rec on marketing-component category** | If desired, scope to a separate `marketing` pack. |
| Apple Product Mockups (iPhone, Watch, keyboard) | `<watch-wc>` exists! | **Already have one; rest = no** | iPhone/keyboard mockups are demo-page chrome, not primitives. |
| Dock (Apple-style) | None | **Maybe** | `<nav-bar>` covers a lot of dock-like territory. A dedicated `<dock-wc>` could land but isn't critical. |
| AI SDK Agents (multi-agent orchestration templates) | None | **Out of scope** | This is more "starter template" than "component library." Different product. |

**Bottom line — ports worth a beads issue right now:**
1. Border-beam decoration effect (smallest, highest visible payoff).
2. Direction-aware tabs (smallest API addition).
3. Expandable / inline disclosure primitive (closes a real gap).
4. Dynamic Island-style morphing surface (largest scope, highest ceiling — needs design doc first).
5. shadcn-style registry endpoint (`/r/<name>.json`) (pairs with `shad-compare.md` recommendations).

---

## Cross-references

- **shad-compare.md** (2026-04-20) already recommended `skill.md` per component, `llms.txt`, "Copy for LLM" button, shadcn token compat layer, and an `npx vanilla-breeze add` CLI. **Adopting cult-ui's registry JSON format would consolidate all of those into one distribution artifact** — instead of "CLI emits link/script snippet," the CLI fetches a registry JSON that embeds the snippet, pack deps, and skill.md inline.
- **scroll-effects-audit.md** (2026-05-22) found that VB has broad scroll-effect coverage already; cult-ui has *less* scroll-effect surface than us. No port pressure from that direction.
- **future-wc.md** wishlist may want a row for the morphing-surface primitive idea.

---

## Proposed sequence (if any of this lands as beads)

**Single small commit / fast wins:**
- `data-effect="border-beam"` decoration (~40 lines CSS, ~10 lines doc).
- `<tab-set>` direction-aware transition (~30 lines JS patch, doc note).

**Medium scope (one beads issue each):**
- Inline `<expand-wc>` (or `data-expandable` attribute) using `interpolate-size`.
- Registry endpoint: `/r/<component>.json` builder hooked into `api.json` and the skill-file generator from `shad-compare.md`. Pairs naturally with the same week's work.

**Larger / needs design doc:**
- Morphing-surface primitive (Dynamic Island idea, generalized). Brainstorm document first, then a `plans/` doc, then beads. Don't build before the API shape is settled.
- Prompt-library primitive — only if the AI workflow direction is going to be a strategic push (per `shad-compare.md` rec #6 "AI Workflows" docs page).

---

## Integration-tier candidates (VB-adjacent, not core)

The original port assessment treated "would pollute core" as a reason to skip. That's the wrong frame — VB already has a clean answer for heavy, opinionated, or library-wrapping components: the **integrations tier** at [vanilla-breeze.com/docs/integrations/](https://vanilla-breeze.com/docs/integrations/), which today houses `<pdf-viewer>` (PDF.js), `<image-editor>`, `<code-block>`, `<code-playground>`, `<browser-window>`, `<terminal-window>`, `<browser-console>`, `<epub-reader>`, `<screen-saver>`.

Pattern of an integration:
- **Lives in its own package**, not bundled into core or any pack.
- **Wraps a heavy dependency** (PDF.js, a WebGL renderer, a sandboxed iframe runtime) *or* is too domain-specific for core (`<epub-reader>`, `<image-editor>`).
- **Theme-aware** — inherits `--color-*`, `--size-*`, `--font-*`, `--shadow-*` tokens with sensible fallbacks. The integration consumes VB's design language; it doesn't impose its own.
- **Standalone** — usable without VB, but obviously better with it.
- **Documented under `/docs/integrations/web-components/<name>.html`** with the same browser-window + code-block pattern as core docs.

This is the right home for everything cult-ui ships that we admire-but-wouldn't-bundle. Below is a triaged shortlist of *new* integration candidates inspired by cult-ui patterns.

### Tier 1 — One spec worth drafting

**`<gl-wc>`** *(one unified WebGL/canvas primitive)*

A single opt-in integration that replaces what would otherwise have been three components (shader hero, particle background, animated mesh gradient). It covers cult-ui's entire "marketing flair" category — Hero Dithering, Marketing CTA Particles, Neuro Noise, Warp — under one runtime.

- **Shape:** continuous-render canvas with a `preset="..."` attribute selecting from a small named catalog (`dither`, `noise`, `mesh-gradient`, `warp`, `particles`, `stars`, `confetti`, `network`). Slotted children render *above* the GL layer so it's a background renderer by default.
- **Theme-aware:** reads VB tokens as shader uniforms (`--color-accent` → `uColor`, `--gl-speed`, `--gl-density`, `--gl-intensity`). Theme switches re-tint the renderer without re-init.
- **Accessibility:** `prefers-reduced-motion` freezes on first frame *or* swaps to a static `<picture>` fallback (author can slot it). Pauses when the element is out of viewport (IntersectionObserver) and when the tab is hidden.
- **Bundle strategy:** each preset lazy-loaded — importing `<gl-wc>` core is small; the requested preset's shader/GLSL/particle program is fetched on first use. Shared WebGL context.
- **Pairs with** existing `data-effect` decoration. Could even ship `data-effect="gl:dither"` that delegates to a `<gl-wc>` rendered on demand.
- **Why one component, not three:** they all share a runtime (WebGL context management, RAF loop, reduced-motion handling, viewport-pause logic, theme-uniform binding). Three sibling components would duplicate ~70% of code and force authors to learn three APIs. One primitive + presets = one mental model.

**Why integration tier:** WebGL runtime, GLSL strings, never load-bearing for an HTML-first lib. Lives outside core; opted into by authors who want ambient motion / marketing flair.

### Tier 2 — Brainstorm first

**`<prompt-library>`**
Personal-prompt storage + insert primitive. Stores prompts in IndexedDB (per the `data-storage` skill pattern), `<prompt-library-trigger for="...">` opens a panel, selecting inserts into the named field. Integrates naturally with `<chat-input>`, `<markdown-editor>`, `<command-palette>`.

- **Why brainstorm first:** depends on whether the "AI workflows" strategic direction lands (see `shad-compare.md` rec #6). If it does, this slots in. If it doesn't, it's a solution looking for a problem.

### Tier 3 — Skip

- **`<phone-window>`** — `<browser-window>` already covers mobile chrome. Don't fragment the demo-chrome surface.
- **`<app-dock>`** — magnification-on-hover is accessibility-hostile (focus/tap targets warp under the cursor), tied to one aesthetic, and not a primitive. `<nav-bar>` covers the real use cases.
- **`<motion-surface>` / "Dynamic Island generalized"** — the morphing-DOM-between-modes use case is solved by View Transitions on the platform. If a real use case for an identity-preserving multi-mode surface shows up in the VB corpus, revisit then. Don't ship a wrapper for a primitive that already exists.
- **3D carousel via three.js** — `<carousel-wc>` handles 3D-via-CSS-transforms; a three.js wrapper is too much asset for too little gain.
- **Conversational spreadsheet editor** — wholly different product, not an integration.
- **AI SDK Agents starter templates** — `reference-implementations/` candidate, not a web component.

### Why this split keeps core clean

The integration tier lets us **say yes to good ideas with heavy costs**. A `<shader-canvas>` integration:
- Doesn't add a WebGL runtime to anyone's bundle who doesn't import it.
- Doesn't make our "HTML-first, zero-build copy-paste" pitch incoherent — it's clearly opted into.
- Can have its own dependency tree (a shader-language preprocessor, a noise function library) without the core having any opinion on them.
- Can be themed-but-not-bundled — the integration reads our tokens; our tokens don't know it exists.

Without this tier, every "shiny thing" debate would be all-or-nothing. With it, we can keep core minimal and *still* have answers for "can VB do a shader hero?" — "yes, via the `<shader-canvas>` integration; here's the docs page."

### Re-allocation summary (replaces parts of the table above)

| Original assessment | Revised home |
|---|---|
| Hero Dithering — *"No — anti-rec on WebGL in core"* | **`<gl-wc>` integration, `preset="dither"`** |
| Marketing CTA Particles — *"No — anti-rec on marketing-component category"* | **`<gl-wc>` integration, `preset="particles"`** |
| Marketing Hero with Neuro Noise / Warp / Mesh-gradient | **`<gl-wc>` integration, named presets** |
| Apple iPhone mockup — *"No, demo chrome not a primitive"* | **Skip — `<browser-window>` already has mobile chrome** |
| Dock — *"Maybe, `<nav-bar>` is close"* | **Skip — a11y-hostile and not a primitive** |
| Dynamic Island generalized | **Skip — View Transitions cover the morphing use case at the platform layer** |
| Prompt Library — *"Maybe, depends on AI strategy"* | **`<prompt-library>` integration (Tier 2, brainstorm first)** |

The earlier "core port" recommendations (border-beam decoration, direction-aware tabs, inline expandable, registry endpoint) are unchanged — those *should* land in core because they're small, native-platform-native, and broadly useful.

---

## Anti-recommendations summary

- No Framer Motion / no JS-animation library dependency.
- No WebGL/shader components in core.
- No paywalled components.
- No neumorphism default.
- No proliferation of compound child elements (slots beat children).
- No "marketing-template" components in core surface (scope to a pack if at all).

---

## Sources

- [Cult UI homepage](https://www.cult-ui.com/)
- [Cult UI docs — components index](https://www.cult-ui.com/docs)
- [Typewriter component](https://www.cult-ui.com/docs/components/typewriter) and [registry JSON](https://www.cult-ui.com/r/typewriter.json)
- [Dynamic Island](https://www.cult-ui.com/docs/components/dynamic-island)
- [Family Button](https://www.cult-ui.com/docs/components/family-button)
- [Direction Aware Tabs](https://www.cult-ui.com/docs/components/direction-aware-tabs)
- [Prompt Library](https://www.cult-ui.com/docs/components/prompt-library)
- [Texture Card](https://www.cult-ui.com/docs/components/texture-card)
- [Hero Dithering](https://www.cult-ui.com/docs/components/hero-dithering)
- [Border Beam Button](https://www.cult-ui.com/docs/components/border-beam-button)
- [Expandable](https://www.cult-ui.com/docs/components/expandable)
- [Minimal Card](https://www.cult-ui.com/docs/components/minimal-card)
- [3D Carousel](https://www.cult-ui.com/docs/components/three-d-carousel)
- [DEV — curated list of shadcn/ui-like libraries](https://dev.to/keitam83/a-curated-list-of-shadcnui-like-react-component-collections-44pa)
- VB internal: `admin/research/shad-compare.md`, `admin/research/scroll-effects-audit.md`, `admin/research/future-wc.md`
