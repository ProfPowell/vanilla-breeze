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

## 2. Choose from what exists

For the page you were asked for, pick layouts and components from the index, then open the file for each one you will use (`components/<tag>.md` beside the index). If nothing fits, use plain semantic HTML: it is already styled.

Never invent a tag, an attribute or a value. If it is not in the index or a component file, it does not exist.

## 3. Write the native HTML first

Write the whole page as semantic HTML before adding anything from Vanilla Breeze: `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, headings in order, a `label` for every form control, real links and buttons. At this point the page must already be readable and usable.

## 4. Add layout and components

- Layout goes on the element you already have: `<main data-layout="stack">`, `<section data-layout="grid">`. Use a `layout-*` element only where no semantic element fits. Do not add `<div>` or `<span>` for layout.
- Spacing, alignment and variants are attributes with fixed values (`data-layout-gap="l"`), taken from the component file. Do not write inline styles or utility classes.
- A component wraps working markup, and its children are its fallback: `<tab-set>` and `<accordion-wc>` wrap `<details>`, `<form-field>` wraps a `label` and a control. Do not leave a component empty for script to fill.
- State and configuration are `data-*` attributes; classes are not used for state.
- Icons are `<icon-wc name="…">`, not inline SVG.
- Themes and colour scheme are attributes on `<html>`: `data-theme`, `data-mode`.

## 5. Run the checker and fix everything

```bash
npx vb-check path/to/page.html
```

`vb-check` ships with `vanilla-breeze` and needs `html-validate` installed beside it (`npm install --save-dev html-validate`). It lists every problem with file, line, rule and the fix.

- Fix every error. An unknown element or an invalid attribute value means you used something that does not exist: go back to the component file, do not guess a second time.
- Read every warning. A warning about a `data-*` attribute Vanilla Breeze does not read is usually an invented attribute.
- Run it again until it reports no errors.

If the checker cannot be installed, re-read your markup against each component file instead, attribute by attribute.

## 6. Check the page without JavaScript

Read the page as if no script ran: every heading, link, form and piece of content must still be present and usable. Tabs and accordions fall back to `<details>`, forms submit natively. If something is only reachable after script runs, restructure it so the content is in the markup.

## When editing an existing page

Match what the page already does: keep its layouts, theme attributes and component choices, and change only what was asked. Run the checker on the file before you edit it as well, so you can tell your problems from the ones that were already there.

## Common mistakes

- Wrapping content in `<div class="container">`, `<div class="row">` or `<div class="card">`. Use a semantic element with `data-layout`, or `<article>` / `<layout-card>`.
- Guessing an attribute from another framework (`variant="primary"`, `size="lg"`, `class="active"`). Take names and values from the component file.
- Guessing a layout value (`data-layout="flex"`, `data-layout-gap="16px"`). Layout names and sizes are fixed sets listed in the index.
- An empty component (`<tab-set></tab-set>`, `<accordion-wc data-items="…">`). Put the real markup inside.
- Inline `style` for spacing or colour. Use the documented attribute, or a design token in a stylesheet.
- A form control with validation and no `<form-field>`.
- A custom element name that sounds plausible. Check it is in the index.
