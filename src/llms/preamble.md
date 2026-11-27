Vanilla Breeze is an HTML-first component system. Native HTML elements are styled with no classes, layout comes from `data-layout` attributes, and custom elements add behaviour on top of markup that already works without JavaScript. There is no build step.

## Load it

```html
<link rel="stylesheet" href="https://unpkg.com/vanilla-breeze@{{version}}/dist/cdn/vanilla-breeze.css">
<script type="module" src="https://unpkg.com/vanilla-breeze@{{version}}/dist/cdn/vanilla-breeze.js"></script>
```

With npm: `npm install vanilla-breeze`, then `import 'vanilla-breeze/css'` and `import 'vanilla-breeze'`.

## Rules for writing markup

1. **Write complete native HTML first.** Use `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, headings in order, `label` with every form control. The page must be readable and usable before any Vanilla Breeze element or script is involved.
2. **Build page sections from the patterns.** The header and navigation, hero, feature grid, testimonial, call to action, pricing, FAQ, forms and footer each have a pattern file below with working markup. Start from the pattern; do not design these from scratch. A bare `<nav><ul>` is a vertical list: the navbar pattern shows `header.site` and `nav.horizontal`.
3. **Give content a width.** Put `data-layout="center"` (with `data-layout-max="narrow"`, `"normal"` or `"wide"`) on each top-level section inside `main`, or on `main` itself, so text does not run edge to edge. A full-width band such as a hero keeps its background on the outer element and centres an inner one.
4. **Do not use `<div>` or `<span>` for layout.** Put `data-layout` on a semantic element, or use a `layout-*` element where no semantic element fits. Layout values: {{layouts}}.
5. **Attributes carry state and configuration.** Use the `data-*` attributes listed for a layout or component, with the values listed. Never invent a tag, an attribute or a value: if it is not in these files, it does not exist.
6. **Classes are a short documented vocabulary, not utilities.** Vanilla Breeze defines a few named variants, such as `header.site`, `nav.horizontal`, `section.hero`, `p.lead`, `a.button`, `button.secondary` and `button.ghost`. Use the ones the patterns and component files show. Do not invent utility classes, and do not use a class for state.
7. **Custom elements wrap working markup.** A component's children are its fallback: `<tab-set>` and `<accordion-wc>` wrap `<details>`, `<form-field>` wraps a `label` and an `input`. Never leave a component empty and expect script to fill it.
8. **Use `<form-field>` for form controls and `<icon-wc name="…">` for icons**, not hand-written wrappers or inline SVG.
9. **Choose a theme.** Set `data-theme` on `<html>` from `themes.md` to suit the content (and `data-accent` for brand hues); `data-mode="light"` or `"dark"` forces a colour scheme. An unthemed page works but looks generic.
10. **Style with a stylesheet and tokens, never inline.** No `style` attributes. When a pattern includes CSS, or the page needs a rule of its own (a hero background, a highlighted card), put it in a `<style>` block or a stylesheet and use design tokens such as `var(--color-primary)` and `var(--size-l)`, not literal colours or lengths. Keep it small: if you are writing layout CSS, there is a layout attribute for it.

## Check your work

Run the checker on every file you write or change, and fix everything it reports before you finish:

```bash
npx vb-check page.html
```

It needs `html-validate` installed beside `vanilla-breeze` (`npm install --save-dev html-validate`). It lists each problem with file, line, rule and the fix: unknown elements, attribute values that do not exist, `<div>` used for layout, inline styles, layout attributes no layout reads. An error means the markup is wrong; a warning asks you to confirm an attribute or class is intentional.

The checker reads markup. It cannot tell you the page looks right, so look at the rendered page as well when you can.

## How to use these files

Read the pattern file for each section of the page you are building, then the component file for each component those patterns use; a component file has the allowed attributes, values, child structure, events and keyboard behaviour, plus an example. `themes.md` lists the themes and the tokens to style with, `attributes.md` the attributes that work on any element, `native-elements.md` the native elements with dedicated documentation, and `llms-full.txt` holds everything in one file.
