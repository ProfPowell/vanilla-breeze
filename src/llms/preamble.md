Vanilla Breeze is an HTML-first component system. Native HTML elements are styled with no classes, layout comes from `data-layout` attributes, and custom elements add behaviour on top of markup that already works without JavaScript. There is no build step.

## Load it

```html
<link rel="stylesheet" href="https://unpkg.com/vanilla-breeze@{{version}}/dist/cdn/vanilla-breeze.css">
<script type="module" src="https://unpkg.com/vanilla-breeze@{{version}}/dist/cdn/vanilla-breeze.js"></script>
```

With npm: `npm install vanilla-breeze`, then `import 'vanilla-breeze/css'` and `import 'vanilla-breeze'`.

## Rules for writing markup

1. **Write complete native HTML first.** Use `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, headings in order, `label` with every form control. The page must be readable and usable before any Vanilla Breeze element or script is involved.
2. **Do not use `<div>` or `<span>` for layout.** Put `data-layout` on a semantic element, or use a `layout-*` element where no semantic element fits. Layout values: {{layouts}}.
3. **Do not write inline styles or utility classes.** Native elements are already styled. Spacing, alignment and variants are set with the `data-*` attributes each layout or component documents.
4. **Attributes carry state and configuration; classes do not.** Use the `data-*` attributes listed for a component, with the values listed. Never invent a tag, an attribute or a value: if it is not in these files, it does not exist.
5. **Custom elements wrap working markup.** A component's children are its fallback: `<tab-set>` and `<accordion-wc>` wrap `<details>`, `<form-field>` wraps a `label` and an `input`. Never leave a component empty and expect script to fill it.
6. **Use `<form-field>` for form controls and `<icon-wc name="…">` for icons**, not hand-written wrappers or inline SVG.
7. **Theme with attributes on `<html>`**: `data-theme="name"` selects a theme, `data-mode="light"` or `"dark"` forces a colour scheme. Colours, spacing and type come from design tokens (CSS custom properties); do not hard-code values.

## Check your work

Run the checker on every file you write or change, and fix everything it reports before you finish:

```bash
npx vb-check page.html
```

It needs `html-validate` installed beside `vanilla-breeze` (`npm install --save-dev html-validate`). It lists each problem with file, line, rule and the fix: unknown elements, attribute values that do not exist, `<div>` used for layout, inline styles, layout attributes no layout reads. An error means the markup is wrong; a warning asks you to confirm an attribute or class is intentional.

## How to use these files

Start from the component list below and open the file for each component you plan to use; it has the allowed attributes, values, child structure, events and keyboard behaviour, plus an example. `attributes.md` lists the attributes that work on any element, `native-elements.md` the native elements with dedicated documentation, and `llms-full.txt` holds everything in one file.
