---
name: vanilla-breeze
description: Build or edit web pages with Vanilla Breeze, the HTML-first component system (data-layout attributes, layout-* elements, web components such as tab-set, accordion-wc and form-field). Use when a project loads or installs vanilla-breeze, or when asked to build a page, form, landing page or docs site with Vanilla Breeze.
license: MIT
---

# Building pages with Vanilla Breeze

Vanilla Breeze styles native HTML with no classes, lays pages out with `data-layout` attributes, and adds web components on top of markup that already works without JavaScript. Most pages need no new JavaScript and no new CSS.

Follow these steps in order. Do not rely on what you remember about Vanilla Breeze: element and attribute names change between versions, and the installed documentation is the source of truth.

## 1. Read the installed documentation

Find the index for the version in use and read it first.

- npm project: `node_modules/vanilla-breeze/dist/cdn/llms/llms.txt`
- Loaded from a CDN: `https://unpkg.com/vanilla-breeze@VERSION/dist/cdn/llms/llms.txt`, using the version in the page's `<link>` or `<script>` URL
- Neither: `https://vanilla-breeze.com/llms.txt` (latest release)

The index has the loading snippet, the rules for writing markup, and one line per layout and component. Each line links to a file with that component's attributes, allowed values, child structure, events and an example.

## 2. Start from patterns, then choose components

The index lists page patterns: site header and navigation, hero, feature grid, testimonial, call to action, pricing, FAQ, contact and sign-in forms, footer, dashboards and more. For each section of the page you were asked for, open its pattern file (`patterns/<name>.md` beside the index) and start from that markup. Then open the component file (`components/<tag>.md`) for each component the patterns use, for its attributes and allowed values.

If no pattern or component fits, use plain semantic HTML: it is already styled.

Never invent a tag, an attribute or a value. If it is not in the index, a pattern or a component file, it does not exist.

## 3. Write the native HTML first

Write the whole page as semantic HTML before adding anything from Vanilla Breeze: `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, headings in order, a `label` for every form control, real links and buttons. At this point the page must already be readable and usable.

## 4. Add layout, components and a theme

- Layout goes on the element you already have: `<main data-layout="stack">`, `<section data-layout="grid">`. Use a `layout-*` element only where no semantic element fits. Do not add `<div>` or `<span>` for layout.
- Give content a width: `data-layout="center"` with `data-layout-max` on each top-level section, or on `main`. Without it text runs to the edges of the window.
- Spacing, alignment and variants are attributes with fixed values (`data-layout-gap="l"`), taken from the component file.
- A component wraps working markup, and its children are its fallback: `<tab-set>` and `<accordion-wc>` wrap `<details>`, `<form-field>` wraps a `label` and a control. Do not leave a component empty for script to fill.
- State and configuration are `data-*` attributes. Classes are a short documented vocabulary (`header.site`, `nav.horizontal`, `section.hero`, `p.lead`, `a.button`, `button.secondary`); use the ones the patterns show and invent none.
- Icons are `<icon-wc name="…">`, not inline SVG.
- Choose a theme from `themes.md` and set `data-theme` on `<html>` (and `data-accent` for brand hues). Pick one that suits the content: an unthemed page works but looks generic.
- No `style` attributes. When a pattern includes CSS, or the page needs a rule of its own (a hero background, a highlighted plan), write it in a `<style>` block or stylesheet using design tokens (`var(--color-primary)`, `var(--size-l)`), not literal colours or lengths. Keep it small; layout belongs to the layout attributes.

## 5. Run the checker and fix everything

```bash
npx vb-check path/to/page.html
```

`vb-check` ships with `vanilla-breeze` and needs `html-validate` installed beside it (`npm install --save-dev html-validate`). It lists every problem with file, line, rule and the fix. A single element or section is checked as a fragment, a file with `<html>` as a whole document.

- Fix every error. An unknown element or an invalid attribute value means you used something that does not exist: go back to the component file, do not guess a second time.
- Read every warning. A warning about a `data-*` attribute Vanilla Breeze does not read is usually an invented attribute.
- Run it again until it reports no errors.

If the checker cannot be installed, re-read your markup against each component file instead, attribute by attribute.

## 6. Look at the page

The checker reads markup; it cannot see a page that renders badly. If you have a browser or screenshot tool, open the page and look at it at a desktop and a phone width. Check that:

- navigation in the header and footer runs horizontally where it should
- content has side margins and a sensible maximum width
- headings and paragraphs are not squeezed into a narrow column
- the page has a clear visual hierarchy: a hero that reads as a hero, cards that read as cards

Fix what you see by going back to the pattern, not by adding inline styles.

## 7. Check the page without JavaScript

Read the page as if no script ran: every heading, link, form and piece of content must still be present and usable. Tabs and accordions fall back to `<details>`, forms submit natively. If something is only reachable after script runs, restructure it so the content is in the markup.

## When editing an existing page

Match what the page already does: keep its layouts, theme attributes and component choices, and change only what was asked. Run the checker on the file before you edit it as well, so you can tell your problems from the ones that were already there.

## Common mistakes

These come from watching agents build pages with and without this skill.

- A bare `<nav><ul>` in the site header or footer, which renders as a vertical list. Use the navbar and footer patterns (`header.site`, `nav.horizontal`).
- No width on the content: a form or article that runs edge to edge. Use `data-layout="center"`.
- A hero built from scratch out of a heading and a paragraph. Use the hero pattern (`section.hero`).
- No theme, and no stylesheet at all, so the page is correct but plain. Choose a theme; add the small token-based CSS the patterns show.
- Wrapping content in `<div class="container">`, `<div class="row">` or `<div class="card">`. Use a semantic element with `data-layout`, or `<article>` / `<layout-card>`.
- Writing a page-specific stylesheet of several hundred lines to lay things out. Layout is attributes; your CSS is for the few things that are particular to this page.
- Guessing an attribute from another framework (`variant="primary"`, `size="lg"`, `class="active"`). Take names and values from the component file.
- Guessing a layout value (`data-layout="flex"`, `data-layout-gap="16px"`). Layout names and sizes are fixed sets listed in the index.
- An empty component (`<tab-set></tab-set>`). Put the real markup inside.
- A form control with validation and no `<form-field>`.
- Stopping when the checker passes without looking at the result.
