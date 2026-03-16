# Competition Ideas

This document covers things from other libraries and approaches to see if we can improve vanilla breeze.

# Twitter Bootstrap Ideas vs Vanilla Breeze

This review looks at what made classic Twitter Bootstrap successful and identifies what Vanilla Breeze (VB) currently omits, where quality is strong, and where there are practical opportunities.


##  Bootstrap  Leverage or VB Omissions

The following items are things to consider about Twitter Bootstrap we may want to consider for Vanilla Breeze.

### 1) Deterministic Column Math as a First-Class API

- **Bootstrap idea:** canonical `container/row/col-{breakpoint}-{n}` with offsets/order.
- **VB today:** excellent auto-fit and semantic layouts, but no equally explicit public "12-column span/offset/order" grammar.
- **Concern:** designer handoff and enterprise dashboard layouts are often specified in explicit column spans.
- **Opportunity:** add an optional explicit column mode (e.g., `data-layout="columns"` + `data-col-span`, `data-col-start`, `data-col-order`) without replacing semantic defaults.

### 2) Uniform Responsive Modifier Grammar

- **Bootstrap idea:** one breakpoint infix model used everywhere.
- **VB today:** responsive behavior exists, but it is split between component-specific attributes and authored CSS; internal CSS also uses hardcoded breakpoints (e.g., `width < 768px`, `width >= 1400px` in `src/custom-elements/layout-attributes.css`).
- **Concern:** less predictable authoring model at scale.
- **Opportunity:** publish breakpoint tokens and a shared responsive naming contract that spans layout, components, and utilities.

### 3) Global Utility API for "Last 20%" Work

- **Bootstrap idea:** ubiquitous utilities for spacing, display, alignment, visibility, overflow, etc.
- **VB today:** intentionally small global utility set; most variants are element-scoped.
- **Concern:** teams sometimes need fast one-off composition without writing custom CSS.
- **Opportunity:** optional utility pack (not default) for display/visibility/flex/grid/gap/order primitives, aligned to VB tokens.

### 4) Consistent JS Plugin/Event Contract

- **Bootstrap idea:** consistent options/methods/events contract across plugins.
- **VB today:** event naming style is mixed (`vb:submit`, `dropdown-open`, `table:sort`, etc.).
- **Concern:** integration cognitive load, harder to build generic tooling/listeners.
- **Opportunity:** define canonical event namespace (for example `vb:<component>:<event>`) and keep legacy aliases for compatibility.

### 5) Higher-Level "Drop-In App Shell" Presets

- **Bootstrap idea:** many common layouts/components were near copy-paste complete.
- **VB today:** strong primitives and patterns, but some common assemblies still require local CSS overrides (example: navbar mobile override pattern docs).
- **Concern:** time-to-first-polished-result can be slower for teams that want opinionated defaults.
- **Opportunity:** ship official preset composites (marketing header, dashboard shell, auth form, CRUD table page) that require near-zero custom CSS.

# Tailwind Ideas vs Vanilla Breeze (Current Audit)

## What We Need to Know

Tailwind and Vanilla Breeze solve different problems:

1. Tailwind is a utility-first styling system.
2. Vanilla Breeze is a semantic + native-platform + component system.
3. A 1:1 Tailwind port is the wrong goal; selective idea adoption is the right goal.

## What VB Already Covers Well

Compared to the old Tailwind notes, VB already has broad coverage across core UI:

1. Design token scale is already strong:
- spacing/size scales
- typography scale
- color system + semantic tokens
- radius/shadow/breakpoint/focus-ring tokens

2. Core forms and auth flows:
- native form styling + validation patterns
- `form-field`, `data-range`, `data-stepper`, `data-switch`, `data-upload`, `data-autosave`
- sign-in, registration, checkout, wizard patterns

3. Navigation and actions:
- navbar, sidebar, tabs, breadcrumb, pagination, steps
- dropdown, context menu, command palette, shortcuts

4. Feedback and overlays:
- status/alert patterns, toasts, tooltips
- modal + drawer via native `dialog`
- skeleton, progress, spinner patterns

5. Data display:
- tables (`table` + `data-table`)
- description lists, stats, timeline patterns

6. Layout + marketing patterns:
- app shells
- hero, features, CTA, pricing, testimonials, FAQ
- strong layout primitives (`stack`, `cluster`, `grid`, `sidebar`, etc.)

## Where Old Tailwind Notes Are Outdated

1. “VB lacks a design-system governor” is no longer true; token scales are extensive.
2. “VB lacks focus ring conveniences” is mostly outdated; focus-ring tokens and focus-visible styling are widespread.
3. Many components listed as “needed” in the catalog are already present as native styles, web components, or documented patterns.

## Real Gaps (Worth Considering)

## P0: High-value gaps

1. Datepicker/calendar primitives (especially range/time picker UX beyond native input behavior).
2. Mobile bottom navigation pattern/component.
3. Mega-menu/flyout navigation pattern.

## P1: Useful expansions

1. Marketing pattern gaps: team, blog-listing, logo-cloud as first-class pattern pages.
2. Stronger reusable list/media object variants (avatar rows, metadata lists, activity feed).
3. Unified “stepper” story (steps pattern + wizard + API docs aligned).

## P2: Nice-to-have

1. Dedicated popover component wrapper (on top of native popover attribute).
2. Speed-dial/FAB pattern.
3. Additional ecommerce patterns beyond checkout (product grid/card, cart, order summary).


