---
title: Vanilla Breeze Demo Site Specification
description: A spec for a multi-page demo site that exercises the full Vanilla Breeze feature surface in real-world context.
date: 2025-03-07
tags:
  - vanilla-breeze
  - demo
  - specification
---

# Vanilla Breeze Demo Site Specification

A living test site for Vanilla Breeze called **Alpenglow Gear** — a fictional outdoor equipment retailer. The domain gives us natural justification for every common page type, component pattern, and interactive feature, without inventing contrived use cases.

## Purpose

This site is not a marketing site for Vanilla Breeze. It is a **functional integration test** written in real HTML. Every page should expose real browser behavior, not pass a checkbox. If a feature regresses, a page on this site should visibly break.

---

## Table of Contents

- [Site Architecture](#site-architecture)
- [Shared Shell](#shared-shell)
- [Pages](#pages)
  - [Home](#home)
  - [About](#about)
  - [Products (Gallery)](#products-gallery)
  - [Product Detail](#product-detail)
  - [Order Form](#order-form)
  - [Contact](#contact)
  - [Blog Listing](#blog-listing)
  - [Blog Post](#blog-post)
  - [FAQ](#faq)
  - [Search Results](#search-results)
  - [Kitchen Sink](#kitchen-sink)
  - [404](#404)
- [Feature Coverage Matrix](#feature-coverage-matrix)
- [Implementation Notes](#implementation-notes)

---

## Site Architecture

```
/
├── index.html              # Home
├── about/index.html        # About
├── products/index.html     # Product gallery
├── products/[slug]/        # Product detail (one per product)
├── order/index.html        # Order form
├── contact/index.html      # Contact form
├── blog/index.html         # Blog listing
├── blog/[slug]/            # Blog post detail
├── faq/index.html          # FAQ
├── search/index.html       # Search results
├── kitchen-sink/index.html # Component showcase / style guide
└── 404.html                # Not found
```

**Three real products** should be defined so the gallery, detail, and order pages form a coherent flow:

| Slug | Name | Category |
|------|------|----------|
| `trail-runner-pack` | Trail Runner Pack 32L | Packs |
| `summit-shelter` | Summit Shelter 3P Tent | Shelter |
| `beacon-headlamp` | Beacon Pro Headlamp 700L | Lighting |

---

## Shared Shell

Every page shares the same outer shell. The shell must exercise:

### Site Header

- Skip-to-content link (accessibility)
- Logo (SVG inline or `<img>`) with home link
- Primary `<nav>` with `aria-label="Primary"`
- Active page state via `aria-current="page"`
- Hamburger toggle for mobile — **CSS-only with `<details>`/`<summary>` or `:has()` pattern** (no JS required to open/close)
- **Brand theme switcher** — a fixed developer widget (bottom-right corner) with five modes: Raw HTML, Vanilla Breeze default, Anthropic, McDonald's, IBM. Sets `data-theme` on `<html>`. See [Brand Theme System Specification](./vanilla-breeze-brand-themes-spec.md) for full detail.

### Site Footer

- Secondary nav with grouped links
- Newsletter signup — a minimal inline form (email + submit only)
- Social links with `rel="noopener noreferrer"` and visually hidden labels
- Copyright line with `<time>` element

**VB features exercised:** layout system, theming tokens, CSS `@layer`, `custom-elements` (for theme toggle), progressive enhancement on nav.

---

## Pages

### Home

**File:** `index.html`

**Goal:** Exercise marketing/content patterns — hero, grids, CTAs, testimonials.

#### Sections

1. **Hero** — Full-width section with headline, subhead, two CTAs (primary + secondary button styles), and a background image using the backdrop system. Test `loading="eager"` on hero image.

2. **Feature Strip** — Three-column icon + text cards. Uses grid layout. Icons are inline SVG.

3. **Product Spotlight** — A row of three product cards (linking to `/products/`). Each card contains:
   - Responsive `<picture>` with `srcset`
   - Product name, short description, price
   - "View Product" link (full card is clickable via CSS — not JS)

4. **Editorial Callout** — A full-bleed section with a blockquote and a background image. Tests text contrast over imagery.

5. **Testimonials** — Three pull quotes in a grid. Tests `<blockquote>` + `<cite>` markup.

6. **Newsletter CTA** — Inline form with email input and submit. Tests form styling tokens outside a full form context.

**VB features:** backdrop system, responsive images, grid layout, button variants, card component, form tokens, brand theme switcher.

---

### About

**File:** `about/index.html`

**Goal:** Exercise typography, editorial layout, and team card patterns.

#### Sections

1. **Page Hero** — Smaller hero with page title and breadcrumb nav (`<nav aria-label="Breadcrumb">`).

2. **Mission Statement** — Long-form prose. Tests:
   - Heading hierarchy (H1 → H2 → H3)
   - Drop cap on first paragraph
   - Pull quote (`<blockquote>`) mid-article
   - Measure/line-length control (`max-ch` or equivalent token)

3. **Timeline** — A vertical timeline of company milestones. Uses `<ol>` with custom CSS. No JS.

4. **Team Grid** — Cards with photo (`<img>` with `aspect-ratio`), name, title, and short bio. Tests `object-fit` patterns and card layout.

5. **Values List** — Icon + heading + description pattern in a two-column grid.

**VB features:** typography system, layout grid, card component, breadcrumb component, `@layer` cascade.

---

### Products (Gallery)

**File:** `products/index.html`

**Goal:** Exercise filtering, grid layout, and card patterns at scale.

#### Sections

1. **Page Header** — Title, breadcrumb, result count (`<output>` element).

2. **Filter Bar** — Category filter using `<fieldset>` + radio buttons. CSS-only filtering with `:has()` selector targeting the grid. No JS fallback acceptable here — document the `:has()` dependency explicitly in a comment.

3. **Sort Controls** — A `<select>` for sort order. Marks a progressive enhancement boundary: without JS the select is present but inert (document this).

4. **Product Grid** — Responsive card grid. Each card:
   - `<article>` semantics
   - `<figure>` + `<figcaption>` for image + product name
   - Price, short spec list, "View Details" CTA
   - `data-category` attribute used for CSS filter targeting
   - `loading="lazy"` on all images

5. **Empty State** — Hidden by default; shown via CSS when no cards match (`:not(:has(...))` pattern). Tests empty state component.

**VB features:** grid layout, card component, form tokens (filter), progressive enhancement boundary, `data-*` attribute patterns, responsive images.

---

### Product Detail

**File:** `products/trail-runner-pack/index.html` (one per product)

**Goal:** The most complex page. Exercises media, interactive disclosure, and structured data.

#### Sections

1. **Breadcrumb** — Three levels: Home > Products > Product Name.

2. **Product Summary** — Two-column layout:
   - Left: Image gallery — primary `<img>` + thumbnail strip. Thumbnail click changes primary image via CSS sibling/`:has()` trick (no JS required, use `<label>`+`<input type="radio">` pattern).
   - Right: Name, price, short description, size selector (`<select>`), quantity (`<input type="number" min="1">`), "Add to Order" button (links to order form with query params pre-filled), wishlist toggle button.

3. **Tabbed Content** — Description / Specs / Sizing Guide tabs. CSS-only using the `:has()` + `<input type="radio">` + `[role="tabpanel"]` pattern. JavaScript enhances ARIA attributes if present.

4. **Specs Table** — `<table>` with proper `<th scope="row">` headers. Tests table styling tokens.

5. **Reviews** — Three static `<article>` reviews with star rating (CSS-only using Unicode or SVG), reviewer name, date (`<time>`), and body text.

6. **Related Products** — A horizontal scroll strip of two other product cards. Tests overflow scroll pattern.

7. **JSON-LD** — `<script type="application/ld+json">` Product schema. Not visible but part of the spec.

**VB features:** two-column layout, CSS-only tabs, CSS-only gallery, table styles, disclosure/accordion tokens, horizontal scroll, structured data pattern.

---

### Order Form

**File:** `order/index.html`

**Goal:** The most complete form page. Must work without JS. JS enhances only.

#### Sections

1. **Progress Indicator** — Three steps: Cart → Shipping → Confirm. Static for now (all on one page); style as a `<ol>` with `aria-current="step"`.

2. **Order Summary** (sidebar) — Product name, quantity, unit price, subtotal. Static HTML. Uses `<dl>` for price breakdown.

3. **Form Sections** (main column):

   **Contact Info**
   - First name, last name (side by side on wide screens)
   - Email (`type="email"`)
   - Phone (`type="tel"`, optional)

   **Shipping Address**
   - Address line 1, line 2 (optional)
   - City, State (`<select>`), ZIP (`pattern` attribute), Country (`<select>`)

   **Delivery Options**
   - Three radio options with label, description, and price. Uses `<fieldset>` + `<legend>`.

   **Payment** (static / no real processing)
   - Card number (`inputmode="numeric"`, `autocomplete="cc-number"`)
   - Expiry (`autocomplete="cc-exp"`), CVC
   - Name on card

   **Order Notes**
   - `<textarea>` with character count using `<output>` + CSS `counter` or JS enhancement

4. **Submit / Confirm Button** — Primary CTA. On submit (without JS) posts to a `/thank-you` stub. With JS, shows an inline confirmation state.

5. **Validation** — HTML5 native constraint validation only (`:valid`, `:invalid`, `:user-invalid` CSS hooks). No JS validation library.

**VB features:** form component system, fieldset/legend tokens, input variants, select styling, radio/checkbox styling, `:user-invalid` patterns, two-column form layout, `<output>` element.

---

### Contact

**File:** `contact/index.html`

**Goal:** Simpler form page. Tests a different form layout and map embed.

#### Sections

1. **Two-Column Layout** — Form left, contact details right.

2. **Contact Form**
   - Name, email, subject (`<select>` with topic options), message (`<textarea>`), file attachment (`<input type="file">`)
   - Honeypot field (`aria-hidden`, visually hidden, `tabindex="-1"`)
   - Submit with loading state via `[aria-busy]` attribute + CSS

3. **Contact Details** — Address as `<address>`, phone, email (as `<a href="tel:">` and `<a href="mailto:">`), hours using `<dl>`.

4. **Map** — `<iframe>` embed of OpenStreetMap (no API key needed). Test lazy loading (`loading="lazy"`) and `<figure>`+`<figcaption>` wrapping.

**VB features:** form tokens, two-column layout, `[aria-busy]` loading state, `<address>` styling, map embed pattern.

---

### Blog Listing

**File:** `blog/index.html`

**Goal:** Exercise list layout, metadata display, and pagination patterns.

#### Sections

1. **Featured Post** — Large card at top: image, category badge, title, excerpt, author avatar + name, date, read time.

2. **Post Grid** — Two-column grid of smaller post cards.

3. **Sidebar** — Category list (as `<nav>`), recent posts list, tag cloud.

4. **Pagination** — `<nav aria-label="Pagination">` with prev/next and numbered pages. Current page marked `aria-current="page"`.

**VB features:** card component, badge component, grid layout, sidebar layout, pagination component, responsive image in card.

---

### Blog Post

**File:** `blog/gear-care-guide/index.html`

**Goal:** Exercise the full typographic system with real long-form content.

#### Sections

1. **Post Header** — Category, title, subtitle, author block (avatar + name + date + read time), hero image with caption.

2. **Post Body** — Minimum 800 words of real content containing:
   - H2 and H3 headings
   - Ordered and unordered lists
   - A `<table>`
   - A `<figure>` + `<figcaption>` with inline image
   - A `<blockquote>` with `<cite>`
   - Inline `<code>` and a `<pre><code>` block
   - An `<aside>` callout box ("Pro Tip")
   - `<abbr>` with `title` attribute
   - `<details>` + `<summary>` for an expandable FAQ at the end

3. **Author Bio** — Card below post body.

4. **Related Posts** — Three cards in a row.

5. **Comments Placeholder** — Static `<section>` with `aria-label="Comments"`. Empty state message and a comment form (same tokens as contact form).

**VB features:** typography system, prose measure control, code block styling, table in prose, `<details>` component, callout/aside component, all inline text-level element styling.

---

### FAQ

**File:** `faq/index.html`

**Goal:** The primary test for the disclosure/accordion pattern, anchor linking, and in-page search. Secondary test for structured `<dl>` and `<details>` at scale.

#### Sections

1. **Page Hero** — Title, subtitle, breadcrumb. Includes a prominent search input (`<input type="search">`) that filters questions client-side via JS. Without JS, the full list is shown — no content is hidden.

2. **Category Jump Nav** — A sticky `<nav aria-label="FAQ categories">` with anchor links to each section below. Uses `position: sticky` and CSS scroll-margin on targets. Tests the sticky utility and smooth scroll behavior.

3. **FAQ Sections** — Five topic sections (e.g. Shipping, Returns, Products, Care & Maintenance, Warranty), each containing 5–8 Q&A pairs. Each pair is a `<details>`+`<summary>` element. This is the primary `<details>` stress test — 30+ instances on one page.

   Each `<details>` must:
   - Animate open/close using the `@starting-style` + `height` transition pattern (CSS-only, no JS)
   - Show a chevron icon that rotates via `[open]` selector
   - Be individually addressable via `id` + fragment link
   - Show answer content that may include inline links, `<code>`, and short lists

4. **Didn't Find Your Answer?** — A CTA strip linking to Contact page and a secondary link to the Community forum (external). Tests inline CTA pattern outside a hero context.

5. **JS Filter Behavior** — When the search input has a value, non-matching `<details>` receive `hidden` attribute; matching ones have their parent section shown. A live region (`aria-live="polite"`) announces result count. This is the **primary test of `<input type="search">` + live region + `hidden` attribute toggling** in VB.

   ```html
   <!-- PE boundary: JS required for live filtering. Without JS, search input
        is visible but inert; all questions remain visible. -->
   ```

**VB features:** `<details>`/`<summary>` component with animation, sticky nav, anchor linking, `<input type="search">` tokens, `aria-live` pattern, in-page navigation, disclosure at scale.

---

### Search Results

**File:** `search/index.html`

**Goal:** Test the search input in a results context, empty/loading/populated states, mixed result types, and highlight markup.

#### Sections

1. **Search Bar** — Full-width `<search>` landmark element (HTML 5.3) containing `<input type="search">` with submit button. Current query pre-populated from `?q=` URL param (read via JS; gracefully absent without JS). Tests the `<search>` element and its styling token.

2. **Results Meta** — Below the bar: result count (`<o>` element or `<p>`), active filters as dismissible badge chips, sort `<select>`.

3. **Filter Sidebar** — Collapsible on mobile (`<details>`). Checkboxes grouped by result type: Products, Blog Posts, FAQ. Checking a type filters the results list via `:has()` on the result container or JS. Tests the sidebar filter pattern in a different context from the product gallery.

4. **Results List** — A vertical list (not a grid) of heterogeneous result cards. Three result types, each with a distinct visual treatment:

   | Type | Thumbnail | Meta |
   |------|-----------|------|
   | Product | Product image (small) | Price, category badge |
   | Blog Post | Post image (small) | Author, date, read time |
   | FAQ Entry | Icon (no image) | Topic category, excerpt |

   Each result card shows the search term **highlighted** within the title and excerpt using `<mark>` element. This is the **primary `<mark>` element test** in the demo site.

   Each card includes a `data-result-type` attribute used for filter targeting.

5. **Pagination** — Same pagination component as the Blog Listing. Tests it in a list (not grid) context.

6. **Empty State** — Shown when no results match. Contains:
   - Illustrated SVG (inline, not an image)
   - "No results for '[query]'" message
   - Suggestions: check spelling, try broader terms
   - Three quick-link buttons to popular sections

7. **Loading State** — Skeleton placeholder cards shown before results arrive (or on first load without JS). Three skeleton items using CSS animation (`@keyframes` pulse). Tests the skeleton/loading pattern.

   ```html
   <!-- PE boundary: Results are static HTML for the demo. JS would normally
        fetch from a search API. The static page always shows pre-set results
        for the query "pack"; other queries show the empty state. -->
   ```

**VB features:** `<search>` landmark, `<mark>` element styling, skeleton loading pattern, empty state component, heterogeneous card list, `data-*` filter, `aria-live` for result count, badge chip (dismissible), sort `<select>` token.

---

### Kitchen Sink

**File:** `kitchen-sink/index.html`

**Goal:** A developer-facing reference page. Not linked from primary nav; accessible at the URL directly.

#### Sections (one `<section>` per subsystem)

1. **Typography** — Every heading level, body copy, lead paragraph, small text, `<strong>`, `<em>`, `<code>`, `<abbr>`, `<del>`, `<ins>`, `<mark>`, `<sub>`, `<sup>`, `<kbd>`, `<var>`.

2. **Colors** — Design token swatches rendered via CSS custom properties. Surface, brand, feedback (success, warning, error, info) palettes.

3. **Buttons** — All button variants: primary, secondary, ghost, destructive, link. All sizes. Disabled state. Loading state (`[aria-busy]`). Icon + text. Icon only (with `aria-label`).

4. **Forms** — Every input type: text, email, tel, number, password, search, url, date, datetime-local, time, color, range, file. Plus textarea, select, multi-select. Plus radio group, checkbox group, toggle/switch. Plus field with hint text, field with error state, field with success state.

5. **Cards** — All card variants and combinations.

6. **Navigation** — Breadcrumb, tabs, pagination, tag list.

7. **Feedback** — Alert variants (info, success, warning, error). Inline validation messages. Badge variants. Progress bar.

8. **Disclosure** — `<details>`/`<summary>` raw. Accordion pattern (stacked details). Tabs (CSS-only).

9. **Tables** — Plain, striped, bordered variants. Responsive overflow wrapper.

10. **Media** — Responsive image. `<figure>` + `<figcaption>`. Video (`<video controls>`). Audio (`<audio controls>`). Inline SVG.

11. **Layout Demos** — Grid variants (1-col, 2-col, 3-col, auto-fill). Sidebar layout. Center layout. Stack layout. Cluster layout.

12. **Motion** — Reduced-motion aware animation examples. View Transitions API demo if supported.

**VB features:** everything. This page is the canonical regression target.

---

### 404

**File:** `404.html`

**Goal:** Graceful error state.

#### Sections

1. Large typographic "404" (CSS-only, not an image).
2. Friendly message and explanation.
3. Search bar (links to `/products/` with `?q=` param).
4. Links back to Home, Products, Contact.

**VB features:** typography, button, form input token in isolation.

---

## Feature Coverage Matrix

| Feature | Home | About | Gallery | Detail | Order | Contact | Blog | Post | FAQ | Search | KS |
|---------|:----:|:-----:|:-------:|:------:|:-----:|:-------:|:----:|:----:|:---:|:------:|:--:|
| Typography system | ○ | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ● |
| Grid layout | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | ● |
| Sidebar layout | ○ | ○ | ● | ○ | ● | ● | ● | ○ | ○ | ● | ● |
| Responsive images | ● | ● | ● | ● | ○ | ○ | ● | ● | ○ | ● | ● |
| Card component | ● | ● | ● | ● | ○ | ○ | ● | ● | ○ | ● | ● |
| Button variants | ● | ○ | ○ | ● | ● | ● | ○ | ○ | ● | ○ | ● |
| Form tokens | ● | ○ | ● | ● | ● | ● | ○ | ● | ● | ● | ● |
| Native validation | ○ | ○ | ○ | ○ | ● | ● | ○ | ● | ○ | ○ | ● |
| Fieldset/legend | ○ | ○ | ● | ● | ● | ○ | ○ | ○ | ○ | ● | ● |
| Select styling | ○ | ○ | ● | ● | ● | ● | ○ | ○ | ○ | ● | ● |
| Checkbox/radio | ○ | ○ | ● | ● | ● | ○ | ○ | ○ | ○ | ● | ● |
| Table styles | ○ | ○ | ○ | ● | ○ | ○ | ○ | ● | ○ | ● | ● |
| Breadcrumb | ○ | ● | ● | ● | ○ | ○ | ● | ● | ● | ○ | ● |
| Tabs (CSS-only) | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| Disclosure/details | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● | ● | ● |
| Pagination | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ● | ● |
| Backdrop/theming | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| Theme toggle | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| Blockquote/cite | ● | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ● |
| Callout/aside | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ● |
| Code block | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ● |
| Badge | ○ | ○ | ● | ● | ○ | ○ | ● | ● | ○ | ● | ● |
| Progress/steps | ○ | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ● |
| Alert/feedback | ○ | ○ | ○ | ○ | ● | ● | ○ | ○ | ○ | ○ | ● |
| Loading state | ○ | ○ | ○ | ○ | ● | ● | ○ | ○ | ○ | ● | ● |
| Skeleton pattern | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● |
| Empty state | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● |
| aria-busy pattern | ○ | ○ | ○ | ○ | ● | ● | ○ | ○ | ○ | ○ | ● |
| aria-live region | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● | ● |
| input[type=search] | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● | ● |
| `<mark>` element | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● |
| `<search>` landmark | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| Sticky nav | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| Anchor/fragment links | ○ | ● | ○ | ○ | ○ | ○ | ○ | ● | ● | ○ | ● |
| Skip link | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| aria-current | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| CSS-only mobile nav | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| View Transitions | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| JSON-LD | ○ | ○ | ○ | ● | ○ | ○ | ○ | ● | ● | ○ | ○ |

> ● = primary test site  ○ = incidental / secondary

---

## Implementation Notes

### Technology Constraints

- **No build step required.** All pages must work as static HTML files served from any static host. The framework itself may have a build step; the demo site should not require one beyond what VB provides.
- **No JavaScript frameworks.** Vanilla JS only, matching VB's own philosophy.
- **No third-party CSS.** Only Vanilla Breeze itself. The demo is not valid if it compensates for VB gaps with utility classes from elsewhere.
- **External resources allowed:** OpenStreetMap iframe, Google Fonts (or a self-hosted equivalent for the type system test).

### Placeholder Content

- Product images: Use real-looking outdoors photography (Unsplash/Pexels with proper attribution `<figure>` + `<figcaption>`), or SVG placeholder images generated by the `placeholder-images` VB utility.
- Text content: Write real copy, not Lorem Ipsum. Real content exposes real typographic edge cases.

### Progressive Enhancement Boundaries

Document each PE boundary clearly in an HTML comment:

```html
<!-- PE boundary: :has() filter requires Chrome 105+, Safari 16+, Firefox 121+.
     Fallback: all products shown when :has() unsupported. -->
```

### Accessibility Standard

WCAG 2.1 AA minimum. Every page should pass without JavaScript disabled. Test with:
- Keyboard-only navigation
- VoiceOver or NVDA
- `prefers-reduced-motion: reduce`
- `prefers-color-scheme: dark`

### File Naming Convention

- Pages: `kebab-case/index.html`
- Assets: `kebab-case.ext`
- Images: `[product-slug]-[variant]-[size].webp` (e.g., `trail-runner-pack-hero-800.webp`)

### Build Order

Implement in this order to maximize early feedback:

1. Shared shell (header + footer) — validates layout system and theming
2. Kitchen Sink — validates every token and component before pages use them
3. Home — validates marketing layout patterns
4. Products Gallery + one Product Detail — validates grid and form tokens
5. Order Form — validates full form system
6. Contact — validates secondary form patterns
7. FAQ — validates disclosure pattern at scale and in-page search
8. Search Results — validates `<mark>`, skeleton, empty state, and mixed card list
9. About + Blog Listing + Blog Post — validates typography system
10. 404 — trivial, last

---

## Related Documents

- [Vanilla Breeze CSS Architecture](../architecture/css-layers.md)
- [Component Catalog](../catalog/components.md)
- [Design Token Specification](../tokens/tokens.md)
- [Form System Specification](../specs/forms.md)
- [Brand Theme System Specification](./vanilla-breeze-brand-themes-spec.md)
