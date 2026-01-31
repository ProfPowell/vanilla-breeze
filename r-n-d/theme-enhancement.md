# Theme Review

This document is derived from a Chat effort on 2026-29-01 that I had about how maybe we could do more with metadata relating to the type of page, purpose of page, users, and presentation of the page's content.  It suggested maybe that the theme system could be driven by metadata or we could continue to scope our approach very cleanly encapsulating components, layouts, themes, and pages very nicely. I'm not sure if this is the right approach, but I'm sharing it here for now so we can review and do some thinking and maybe experiment with it in the r-n-d section.

# Chat Review Content 

Alright—this “frontier” is where  metadata stops being “labels for analytics” and becomes a page-level contract that drives layout, theme, and motion via a small set of CSS custom properties.

The core idea:

Metadata → semantic switches → design tokens → component styling
(and the tokens flow downhill with CSS inheritance)

So instead of writing a bunch of page-specific selectors, you set a few variables on html and let everything else read them.

⸻

1) Separate “semantic switches” from “design tokens”

A clean mental model is two layers:

A) Semantic switches (meaning)

These encode “what kind of experience is this page?”
•	--mode: docs | marketing | app
•	--density: cozy | comfortable | compact
•	--attention: focused | exploratory
•	--motion: full | reduced | none
•	--tone: neutral | playful | serious

B) Derived design tokens (implementation)

These are actual values used in CSS:
•	--content-max
•	--gutter
•	--radius
•	--shadow-strength
•	--font-scale
•	--motion-duration
•	--motion-ease

Rule: Your HTML/metadata sets semantic switches; your base CSS maps them to concrete tokens.

⸻

2) Use metadata to set semantic switches on <html>

Your current data-* becomes an input to token mapping:

<html
  data-page-type="docs"
  data-task="learn"
  data-audience="student developer"
  data-journey="consideration"
>

Then, in CSS you map that to page “modes”:

html[data-page-type="docs"] {
--mode: docs;
--density: comfortable;
--attention: focused;
}
html[data-page-type="product"],
html[data-page-type="pricing"],
html[data-page-type="landing"] {
--mode: marketing;
--density: cozy;
--attention: exploratory;
}
html[data-page-type="account"],
html[data-page-type="checkout"] {
--mode: app;
--density: compact;
--attention: focused;
}

Even though CSS can’t compare strings, you can still use variables as a declarative “label” and rely on them conceptually. The real power is in what you derive next.

⸻

3) Map semantic switches → concrete tokens (the “token pipeline”)

This is the crucial piece: a single place where each mode/density choice turns into actual numbers.

A) Start with defaults

:root {
/* base tokens */
--content-max: 80ch;
--gutter: clamp(1rem, 3vw, 2rem);
--radius: 12px;

--font-scale: 1;
--line-height: 1.55;

--motion-duration: 180ms;
--motion-ease: cubic-bezier(.2,.8,.2,1);
}

B) Mode changes (layout + tone)

html[data-page-type="docs"] {
--content-max: 70ch;
--line-height: 1.7;
}

html:is([data-page-type="product"], [data-page-type="pricing"], [data-page-type="landing"]) {
--content-max: 110ch;
--radius: 18px;
}

C) Density changes (spacing everywhere)

html[data-audience~="student"] {
--gutter: clamp(1.25rem, 3.5vw, 2.5rem);
--font-scale: 1.05;
}

html[data-page-type="account"] {
--gutter: clamp(.75rem, 2vw, 1.25rem);
--font-scale: 1;
}

Now components don’t care why the page is docs vs marketing. They just consume --content-max, --gutter, etc.

⸻

4) Let components consume tokens (no page selectors inside components)

Example:

main {
max-width: var(--content-max);
margin-inline: auto;
padding-inline: var(--gutter);
line-height: var(--line-height);
font-size: calc(1rem * var(--font-scale));
}

A card:

.card {
border-radius: var(--radius);
padding: calc(var(--gutter) * 0.75);
transition: transform var(--motion-duration) var(--motion-ease);
}
.card:hover {
transform: translateY(-2px);
}

No mention of “docs” or “pricing” inside .card. The page context flows in via inheritance.

That’s the frontier: components become policy-free.

⸻

5) Motion as a first-class token system

Treat motion exactly like spacing.

A) Define motion tokens

:root {
--motion-duration-fast: 120ms;
--motion-duration: 180ms;
--motion-duration-slow: 280ms;
--motion-ease: cubic-bezier(.2,.8,.2,1);
}

B) Respect user preference AND page context

User preference should win:

@media (prefers-reduced-motion: reduce) {
:root {
--motion-duration-fast: 1ms;
--motion-duration: 1ms;
--motion-duration-slow: 1ms;
}
}

Then optionally tighten motion for “serious” pages (legal, checkout):

html:is([data-page-type="legal"], [data-page-type="checkout"]) {
--motion-duration-fast: 90ms;
--motion-duration: 120ms;
--motion-duration-slow: 180ms;
}

Now every component animation automatically becomes calmer in “legal/checkout” without per-component hacks.

⸻

6) Theme tokens driven by metadata (but keep it sane)

Use theme tokens for:
•	surface colors
•	emphasis colors
•	border/outline
•	shadow strength
•	contrast constraints

Example:

:root {
--bg: Canvas;
--fg: CanvasText;
--surface: color-mix(in oklab, Canvas 92%, CanvasText 8%);
--border: color-mix(in oklab, CanvasText 18%, Canvas 82%);
--shadow-strength: 0.12;
}

Docs pages might prefer higher legibility:

html[data-page-type="docs"] {
--shadow-strength: 0.08;
--border: color-mix(in oklab, CanvasText 22%, Canvas 78%);
}

Marketing pages might allow more depth:

html:is([data-page-type="product"], [data-page-type="landing"]) {
--shadow-strength: 0.18;
}

Then your shadow uses the strength:

.card {
box-shadow: 0 10px 30px color-mix(in oklab, CanvasText calc(var(--shadow-strength) * 100%), transparent);
}

(You can also keep shadows simpler if you don’t want math-y color-mix usage.)

⸻

7) The big win: fewer selectors, less coupling, more consistency

Traditional approach:
•	Lots of page-specific overrides
•	Components get polluted with “if docs then…”

Token approach:
•	Page sets context once
•	Components just consume tokens
•	Global consistency and easy tuning

It also makes your content “LLM-friendly”: the manifest describes intent; tokens enforce policy.

⸻

8) Practical constraints (where this breaks)

A) You can’t truly “switch on” variable strings in CSS

CSS variables aren’t like enums you can branch on. You still need selectors to set them. That’s okay—the branching happens at the top (html selector mapping), not inside components.

B) Token explosion

If you create 50 tokens, no one will know which to use.
Keep a small “golden set”:
•	layout: --content-max, --gutter, --radius
•	type: --font-scale, --line-height
•	theme: --bg, --fg, --surface, --border, --shadow-strength
•	motion: --motion-duration(-fast/-slow), --motion-ease

C) Mixing semantics with implementation

Don’t create --docs-h2-margin tokens. That’s backsliding.
Use tokens that represent universal properties.

⸻

9) A concrete pattern I’d recommend for your Astro setup
	1.	Use your manifest to derive:
		  •	data-page-type
		  •	data-task
		  •	data-audience
		  •	data-journey
	2.	In a single tokens.css file, map those attributes → token values.
	3.	All other CSS (components, layouts) must only use tokens.

So you get a 3-layer CSS model:
•	tokens.css (context mapping, small, centralized)
•	layout.css (uses tokens)
•	components/ (uses tokens)

This aligns with your separation-of-concerns preference.

⸻

10) A minimal “tokens.css” sketch (ready-to-use)

/* tokens.css */
:root {
--content-max: 80ch;
--gutter: clamp(1rem, 3vw, 2rem);
--radius: 12px;

--font-scale: 1;
--line-height: 1.55;

--motion-duration-fast: 120ms;
--motion-duration: 180ms;
--motion-duration-slow: 280ms;
--motion-ease: cubic-bezier(.2,.8,.2,1);

--shadow-strength: 0.12;
}

@media (prefers-reduced-motion: reduce) {
:root {
--motion-duration-fast: 1ms;
--motion-duration: 1ms;
--motion-duration-slow: 1ms;
}
}

/* Mode: docs */
html[data-page-type="docs"],
html[data-page-type="guide"] {
--content-max: 70ch;
--line-height: 1.7;
--shadow-strength: 0.08;
}

/* Mode: marketing */
html:is([data-page-type="landing"], [data-page-type="product"], [data-page-type="pricing"]) {
--content-max: 110ch;
--radius: 18px;
--shadow-strength: 0.18;
}

/* Mode: app-like */
html:is([data-page-type="account"], [data-page-type="checkout"]) {
--content-max: 95ch;
--gutter: clamp(.75rem, 2vw, 1.25rem);
--motion-duration: 140ms;
--shadow-strength: 0.10;
}

/* Audience tuning */
html[data-audience~="student"] {
--font-scale: 1.05;
--gutter: clamp(1.25rem, 3.5vw, 2.5rem);
}

Then your component/layout CSS just uses the tokens.

⸻

If you want to take it one notch further after this: introduce a tiny naming convention for token categories (layout/type/theme/motion) and a lint rule (“components may not contain [data-page-type] selectors”). That one discipline is what makes the system stay elegant over time.

Tiny token naming convention

Keep tokens in 4 buckets with clear, consistent prefixes. The goal is: when you see a token, you instantly know what it affects.

1) Layout tokens: --l-*
   Used for spacing, sizing, grids, radii.
   •	--l-content-max
   •	--l-gutter
   •	--l-gap
   •	--l-radius
   •	--l-border-width
   •	--l-nav-width
   •	--l-stack-space (vertical rhythm)

2) Type tokens: --t-*
   Used for font sizing, line height, measure, weights.
   •	--t-font-scale
   •	--t-line-height
   •	--t-measure (same idea as content max but explicitly “text measure”)
   •	--t-font-family
   •	--t-weight-body
   •	--t-weight-heading

3) Theme tokens: --c-* (color) + optional --e-* (elevation)
   Keep theme mostly about color; elevation/shadow can be its own tiny set.
   •	--c-bg
   •	--c-fg
   •	--c-surface
   •	--c-border
   •	--c-accent
   •	--c-muted
   •	--e-shadow-strength
   •	--e-shadow-color

(If you want super minimal: skip --e-* and use --c-shadow + --shadow-strength.)

4) Motion tokens: --m-*
   Durations, easing, distance.
   •	--m-fast
   •	--m-base
   •	--m-slow
   •	--m-ease
   •	--m-distance (hover lift, slide distance)
   •	--m-delay

Rule of thumb: 6–12 tokens per bucket is plenty. More than that and you’ve built a second design system accidentally.

⸻

Example: rewritten tokens.css using the convention

/* tokens.css */
:root {
/* layout */
--l-content-max: 80ch;
--l-gutter: clamp(1rem, 3vw, 2rem);
--l-gap: clamp(.75rem, 2vw, 1.25rem);
--l-radius: 12px;

/* type */
--t-font-scale: 1;
--t-line-height: 1.55;

/* theme */
--c-bg: Canvas;
--c-fg: CanvasText;
--c-surface: color-mix(in oklab, Canvas 92%, CanvasText 8%);
--c-border: color-mix(in oklab, CanvasText 18%, Canvas 82%);
--c-accent: LinkText;

/* elevation */
--e-shadow-strength: 0.12;

/* motion */
--m-fast: 120ms;
--m-base: 180ms;
--m-slow: 280ms;
--m-ease: cubic-bezier(.2,.8,.2,1);
--m-distance: 2px;
}

@media (prefers-reduced-motion: reduce) {
:root {
--m-fast: 1ms;
--m-base: 1ms;
--m-slow: 1ms;
--m-distance: 0px;
}
}

/* docs / guide */
html:is([data-page-type="docs"], [data-page-type="guide"]) {
--l-content-max: 70ch;
--t-line-height: 1.7;
--e-shadow-strength: 0.08;
}

/* marketing */
html:is([data-page-type="landing"], [data-page-type="product"], [data-page-type="pricing"]) {
--l-content-max: 110ch;
--l-radius: 18px;
--e-shadow-strength: 0.18;
}

/* app-like */
html:is([data-page-type="account"], [data-page-type="checkout"]) {
--l-content-max: 95ch;
--l-gutter: clamp(.75rem, 2vw, 1.25rem);
--m-base: 140ms;
--e-shadow-strength: 0.10;
}

/* audience tuning */
html[data-audience~="student"] {
--t-font-scale: 1.05;
--l-gutter: clamp(1.25rem, 3.5vw, 2.5rem);
}

Then components only do:

.card {
border-radius: var(--l-radius);
background: var(--c-surface);
border: 1px solid var(--c-border);
box-shadow: 0 10px 30px color-mix(in oklab, var(--c-fg) calc(var(--e-shadow-strength) * 100%), transparent);
transition: transform var(--m-base) var(--m-ease);
}
.card:hover { transform: translateY(calc(-1 * var(--m-distance))); }

No page selectors. Only tokens.

⸻

The lint rule: “components may not contain [data-page-type] selectors”

You can enforce this in a few ways; here are two that match your “minimal deps” preference.

Option A: Zero-dependency Node check (recommended)

Create scripts/lint-css-selectors.mjs:

import fs from "node:fs";
import path from "node:path";

const COMPONENTS_DIR = "src/styles/components"; // adjust to your repo

// What we forbid in component CSS:
const FORBIDDEN = [
/\[data-page-type\b/g,
/\[data-task\b/g,
/\[data-audience\b/g,
/\[data-journey\b/g
];

// Optional: also forbid html[data-*] in components
const FORBIDDEN_HTML_DATA = /html\s*\[[^\]]*data-/g;

function walk(dir, out = []) {
if (!fs.existsSync(dir)) return out;
for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
const p = path.join(dir, ent.name);
if (ent.isDirectory()) walk(p, out);
else if (ent.isFile() && p.endsWith(".css")) out.push(p);
}
return out;
}

const files = walk(COMPONENTS_DIR);
if (files.length === 0) {
console.log(`(css lint) No CSS files found under ${COMPONENTS_DIR}`);
process.exit(0);
}

let failed = false;

for (const file of files) {
const css = fs.readFileSync(file, "utf8");

// Strip comments to reduce false positives
const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

const hits = [];
for (const re of FORBIDDEN) {
if (re.test(noComments)) hits.push(re.toString());
re.lastIndex = 0;
}
if (FORBIDDEN_HTML_DATA.test(noComments)) hits.push("html[data-*] pattern");
FORBIDDEN_HTML_DATA.lastIndex = 0;

if (hits.length) {
failed = true;
console.error(`✗ ${file}\n  Forbidden page-context selector(s): ${hits.join(", ")}\n`);
}
}

if (failed) {
console.error("CSS lint failed: components must not depend on page context selectors.\n" +
"Move page-context mapping into tokens.css (or a layout-level stylesheet) and consume tokens in components.");
process.exit(1);
} else {
console.log(`✓ CSS lint passed (${files.length} files checked)`);
}

Add to package.json:

{
"scripts": {
"lint:css-context": "node scripts/lint-css-selectors.mjs"
}
}

And run it in CI / prebuild:

{
"scripts": {
"build": "npm run lint:css-context && astro build"
}
}

Policy encoded: component CSS cannot reach “up” to page context.

⸻

Option B: Stylelint rule (more standard, adds deps)

If you’re okay with a dependency, Stylelint can enforce selector bans. The minimal concept is:
•	enable stylelint
•	add selector-disallowed-list: ["\\[data-page-type", "html\\[data-"]

But since you prefer minimal dependencies, Option A usually wins.

⸻

One extra rule that makes this system really work

In addition to “no page selectors in components,” add:

“Only tokens.css may set --l-*, --t-*, --c-*, --m-* on html or :root.”

Meaning:
•	components can use tokens
•	components can set local component vars like --card-pad, but not global tokens

That prevents a component from quietly redefining your global contract.

You can extend the same Node linter later to catch :root { --l-... } outside tokens.css if you want.


# Vanilla Breeze Possibilities

Here is Claude's response reviewed and edited by me afterwards.

## Current State Analysis

Vanilla Breeze already has foundational pieces in place:

| Current | Chat Proposal | Alignment |
|---------|---------------|-----------|
| `data-page="docs"` | `data-page-type="docs"` | Direct match, just rename |
| `data-theme="brutalist"` | Theme via tokens | VB themes already set tokens |
| `data-mode="light\|dark"` | Color mode handling | Already implemented |
| Layout primitives | `--l-content-max`, etc. | Partial overlap |
| Spacing tokens | `--l-gutter`, `--l-gap` | VB uses `--size-*` scale |

The gap is primarily in:
1. **Page-context-driven token overrides** - VB doesn't map page types to layout tokens
2. **Semantic switches** - VB themes are visual, not semantic (mode/density/attention)
3. **Motion tokens** - VB has minimal motion token system
4. **Lint enforcement** - No rule preventing page selectors in components

## Recommended Approach for VB

### Phase 1: Extend Existing Attributes (Low Risk)

Keep current `data-page` but add optional semantic context:

```html
<html data-page="docs" data-task="learn" data-audience="developer">
```

Map these to existing tokens in a single location:

```css
/* src/tokens/page-context.css */
html[data-page="docs"] {
  --content-max: 70ch;
  --stack-gap: var(--size-m);
}

html[data-page="landing"] {
  --content-max: 110ch;
  --stack-gap: var(--size-l);
}
```

**Benefit**: Works with existing token system, no breaking changes.

### Phase 2: Token Naming Convention (Medium Effort)

Current VB tokens are flat: `--size-m`, `--color-primary`, `--radius-m`.

The proposed convention adds prefixes: `--l-gap`, `--c-primary`, `--t-scale`.

**Recommendation**: Don't rename existing tokens. Instead, add a mapping layer:

```css
:root {
  /* Map VB tokens to semantic switches */
  --l-gutter: var(--size-m);
  --l-radius: var(--radius-m);
  --t-line-height: var(--leading-relaxed);
  --m-base: var(--duration-normal);
}
```

This allows gradual adoption without breaking existing components.

### Phase 3: Component Isolation Rule (High Value)

This is the most impactful change. Enforce that components only consume tokens:

**Allowed in components:**
```css
.card {
  border-radius: var(--l-radius);
  padding: var(--l-gutter);
}
```

**Forbidden in components:**
```css
/* NO - component should not know about page context */
html[data-page="docs"] .card {
  padding: var(--size-s);
}
```

**Where page-context selectors ARE allowed:**
- `tokens.css` or `page-context.css`
- Layout CSS files
- Base/reset CSS

This aligns with VB's existing separation of concerns (elements, attributes, layouts, themes).

## Token Categories for VB

Mapping the proposed convention to VB's existing structure:

### Layout (`--l-*`)
```css
--l-content-max    /* Main content width */
--l-gutter         /* Inline padding */
--l-gap            /* Default gap for stacks/grids */
--l-radius         /* Border radius */
--l-nav-width      /* Sidebar/nav width */
```

### Typography (`--t-*`)
```css
--t-scale          /* Font size multiplier */
--t-line-height    /* Body line height */
--t-measure        /* Optimal text line length */
```

### Color/Theme (`--c-*`)
Already covered by VB's `--color-*` tokens. Could alias:
```css
--c-bg: var(--color-surface);
--c-fg: var(--color-text);
--c-accent: var(--color-primary);
```

### Motion (`--m-*`)
VB needs expansion here:
```css
--m-fast: 100ms;
--m-base: 180ms;
--m-slow: 300ms;
--m-ease: cubic-bezier(.2,.8,.2,1);
--m-distance: 2px;    /* Hover lift, translate distance */
```

## Integration with Extreme Themes

VB's extreme themes (brutalist, swiss, cyber, terminal, organic) already demonstrate the power of token-driven design. The page-context system would layer on top:

```
User sets:     data-theme="brutalist" data-page="docs"
                    ↓                      ↓
Theme tokens:  --radius: 0             Page tokens: --l-content-max: 70ch
                    ↓                      ↓
                    └──────────┬───────────┘
                               ↓
Component:     border-radius: var(--radius);
               max-width: var(--l-content-max);
```

Both systems feed into the same token layer; components remain unaware of either.

## What NOT to Do

1. **Don't create page-specific component variants**
   - Bad: `.card--docs`, `.card--marketing`
   - Good: Use tokens that are set by page context

2. **Don't add semantic switches without use cases**
   - `--attention: focused | exploratory` is interesting but VB doesn't need it yet
   - Add switches only when you have concrete styling that differs

3. **Don't mix concerns in theme files**
   - Theme files should set color/visual tokens
   - Page context should set layout/density tokens
   - Keep them separate

4. **Don't over-engineer the manifest**
   - VB docs site doesn't need `journey.stage` or `experiments`
   - Start with `data-page` and `data-task`, add others when needed

## Practical Next Steps

1. **Experiment in r-n-d**: Create a `page-context-demo.html` that shows tokens changing based on `data-page`

2. **Motion tokens**: Add `--m-*` tokens to VB's token system - this is a clear gap

3. **Lint script**: Add the CSS lint script to catch page selectors in components

4. **Document the pattern**: If we adopt this, document it clearly so contributors understand the token flow

## Open Questions

1. Should VB rename `data-page` to `data-page-type` for clarity?
2. Is the `--l-`/`--t-`/`--c-`/`--m-` prefix convention worth the migration cost?
3. How do layout primitives (`<layout-stack>`, `<layout-grid>`) interact with page-context tokens?
4. Should extreme themes be able to override page-context tokens, or vice versa?


# Theme Extension R-n-D

A few aspects of the theme system feel they could be explored further.  One aspect is that idea that we can have more variation on borders, shadows, and elevations.  We should have for example rough borders for a wire-frame theme or a grungy theme.

Another aspect is that we should be able to load fonts that are not part of the system like Google Fonts or other Web fonts that may be more display oriented.  Obviously such fonts would need to be loaded.

Another aspect would be to set backgrounds and background colors for page and components.  As we recall components are not just web components but also custom elements and regular HTML elements.

Another aspect would be motion for hovers, transitions, and animations on the page and components as part of the theme itself. motion tokens would be a good addition to the theme system.

We could even have sounds as a theme aspect to be displayed on hovers, transitions, and actions.  This gets into JavaScript and audio API but could be incredibly motivating to people.  We would need a way to turn off the sounds just like adjusting the light and dark mode.

# Theme Picker R-n-D

The theme picker probably needs to updated to reflect our more complex theme system.  Light and dark and auto makes sense.  Changing colors or contrast broadly also makes sense.  The themes themself probably need to be updated with different approaches of how to provide access to them.  One by icon/name/button, one by a rich list of these icon/button/name previews, and then obviously a drop down list of themese if we are allowing many of them.  We should make a variation of the theme-picker component that is more complex and allows for more themes and test it in isolation in the r-n-d area.