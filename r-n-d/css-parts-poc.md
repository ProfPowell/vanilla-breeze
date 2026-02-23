# Parts Taxonomy: Themeable Custom Elements via CSS `::part()`

Shadow DOM gives custom elements encapsulation. That's its strength and its friction point — external stylesheets can't reach inside. The `part` attribute and `::part()` pseudo-element are the platform's answer: a controlled theming API where the component author decides *what* is styleable and the consumer decides *how*.

Vanilla Breeze needs a consistent parts vocabulary so that theming one component teaches you how to theme them all.

## The Mechanism

A quick grounding in how `part` and `exportparts` actually work, since these are among the least-understood CSS features.

### `part` — Naming Internal Elements

Inside a custom element's shadow DOM, add `part="name"` to any element you want to expose for external styling:

```html
<!-- Inside <fancy-input> shadow DOM -->
<template>
  <label part="label">
    <slot name="label"></slot>
  </label>
  <input part="input" />
  <div part="description">
    <slot name="description"></slot>
  </div>
  <div part="error">
    <slot name="error"></slot>
  </div>
</template>
```

External CSS can now style these:

```css
fancy-input::part(label) {
  font-weight: 600;
  color: oklch(0.3 0 0);
}

fancy-input::part(input) {
  border: 2px solid oklch(0.8 0 0);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
}

fancy-input::part(error) {
  color: oklch(0.55 0.2 25);
  font-size: 0.875em;
}
```

### What `::part()` Can and Cannot Style

This is where developers get surprised.

**Can style:** Any CSS property — colors, fonts, borders, padding, backgrounds, transitions, transforms. You have full styling power on the targeted element.

**Cannot do:**

- Pseudo-elements on parts: `::part(input)::placeholder` does not work. The spec explicitly disallows chaining pseudo-elements after `::part()`.
- Descendant selectors inside parts: `::part(label) span` does not work. Parts are flat — you style the part element itself, not its children.
- State selectors *on* parts do work: `::part(input):focus`, `::part(input):hover`, `::part(input):invalid` all work correctly.

The workaround for pseudo-elements is to expose them as separate parts:

```html
<!-- Expose the placeholder as its own styled region via a wrapper -->
<div part="input-wrapper">
  <input part="input" />
</div>
```

Or use custom properties as a bridge (more on this below).

### `exportparts` — Passing Parts Through Nested Components

When custom elements compose other custom elements, the inner parts disappear from the outer consumer's view. `exportparts` re-exports them:

```html
<!-- <form-field> shadow DOM uses <fancy-input> internally -->
<template>
  <div part="base">
    <fancy-input exportparts="label, input, error"></fancy-input>
  </div>
</template>
```

Now the consumer can style through the composition:

```css
form-field::part(label) { /* reaches fancy-input's label part */ }
form-field::part(input) { /* reaches fancy-input's input part */ }
```

You can also rename parts during export to avoid collisions:

```html
<fancy-input exportparts="label: field-label, input: field-input"></fancy-input>
```

```css
form-field::part(field-label) { /* remapped name */ }
```

## The Vanilla Breeze Parts Vocabulary

Every Vanilla Breeze component exposes parts from a shared vocabulary. If you learn the part names once, you can theme any component.

### Standard Part Names

| Part Name | Purpose | Typical Element |
|:----------|:--------|:----------------|
| `base` | The outermost wrapper inside shadow DOM | `<div>`, `<fieldset>` |
| `label` | Primary label text | `<label>`, `<legend>`, `<span>` |
| `input` | The interactive input element | `<input>`, `<textarea>`, `<select>` |
| `description` | Help text / supporting description | `<div>`, `<span>` |
| `error` | Validation error message | `<div>`, `<span>` |
| `icon` | Decorative or functional icon | `<svg>`, `<span>` |
| `badge` | Count, status, or notification indicator | `<span>` |
| `trigger` | The element that activates a disclosure | `<button>`, `<summary>` |
| `content` | The disclosed/expanded content region | `<div>`, `<section>` |
| `header` | Header area of a card/dialog/section | `<header>`, `<div>` |
| `footer` | Footer area with actions | `<footer>`, `<div>` |
| `item` | Repeated items in a list/menu | `<li>`, `<div>` |
| `separator` | Visual divider between items | `<hr>`, `<div>` |
| `overlay` | Backdrop/scrim behind modals | `<div>` |

### Multi-Part Elements

An element can have multiple parts. This is how you expose fine-grained theming:

```html
<!-- <alert-banner> shadow DOM -->
<div part="base">
  <svg part="icon" aria-hidden="true"><!-- icon --></svg>
  <div part="content">
    <strong part="label"><slot name="title"></slot></strong>
    <div part="description"><slot></slot></div>
  </div>
  <button part="trigger" aria-label="Dismiss">×</button>
</div>
```

Themed:

```css
alert-banner::part(base) {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: oklch(0.97 0.01 85);
  border-inline-start: 4px solid oklch(0.7 0.15 85);
}

alert-banner::part(icon) {
  color: oklch(0.6 0.15 85);
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
}

alert-banner::part(label) {
  font-weight: 600;
}

alert-banner::part(trigger) {
  margin-inline-start: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: oklch(0.5 0 0);
}

alert-banner::part(trigger):hover {
  color: oklch(0.3 0 0);
}
```

## Custom Properties as the Theming Bridge

Parts let you style specific internal elements. Custom properties let you configure *values* from the outside. These two mechanisms work together.

The component defines custom properties with fallbacks in its shadow CSS:

```css
/* Inside <fancy-input> shadow CSS */
:host {
  --field-radius: 0.375rem;
  --field-border-color: oklch(0.8 0 0);
  --field-focus-color: oklch(0.55 0.15 250);
  --field-error-color: oklch(0.55 0.2 25);
  --field-font: inherit;
}

[part="input"] {
  border: 2px solid var(--field-border-color);
  border-radius: var(--field-radius);
  font: var(--field-font);
}

[part="input"]:focus {
  border-color: var(--field-focus-color);
  outline: 2px solid var(--field-focus-color);
  outline-offset: 2px;
}

[part="error"] {
  color: var(--field-error-color);
}
```

The consumer can theme via custom properties (broad strokes) or `::part()` (surgical overrides):

```css
/* Theme-level: set values for all fancy-inputs */
fancy-input {
  --field-radius: 0;
  --field-focus-color: oklch(0.5 0.2 150);
}

/* Instance-level: override one specific part */
fancy-input.search::part(input) {
  padding-inline-start: 2.5rem; /* make room for search icon */
}
```

### When to Use Which

| Mechanism | Use For | Example |
|:----------|:--------|:--------|
| Custom properties | Design tokens that affect multiple parts (colors, radii, spacing) | `--field-radius` |
| `::part()` | Styling a specific internal element with arbitrary CSS | `::part(input) { border-style: dashed; }` |
| Both together | Token + override | Set `--color` globally, override `::part(error)` color specifically |

## Demo: Theming a Complete Component Library

Consider three Vanilla Breeze components, each exposing standard parts:

```html
<!-- Form field with label, input, help text, error -->
<form-field label="Email" type="email" name="email" help="We won't share this.">
</form-field>

<!-- Alert banner with icon, title, description, dismiss -->
<alert-banner variant="warning">
  <span slot="title">Check your email</span>
  We sent a confirmation link.
</alert-banner>

<!-- Dialog with header, content, footer -->
<modal-dialog>
  <span slot="title">Confirm deletion</span>
  <p>This action cannot be undone.</p>
  <button slot="footer">Cancel</button>
  <button slot="footer" data-variant="danger">Delete</button>
</modal-dialog>
```

A single theme stylesheet targets all of them consistently:

```css
/* === Base theme: all components === */

/* Every component's outermost wrapper */
form-field::part(base),
alert-banner::part(base),
modal-dialog::part(base) {
  font-family: system-ui, sans-serif;
}

/* Every label across the system */
form-field::part(label),
alert-banner::part(label),
modal-dialog::part(label) {
  font-weight: 600;
  color: oklch(0.25 0 0);
}

/* Every error message */
form-field::part(error),
alert-banner[variant="error"]::part(description) {
  color: oklch(0.5 0.2 25);
  font-size: 0.875em;
}

/* Every dismiss/close trigger */
alert-banner::part(trigger),
modal-dialog::part(trigger) {
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.25rem;
  padding: 0.25rem;
}

alert-banner::part(trigger):focus-visible,
modal-dialog::part(trigger):focus-visible {
  outline: 2px solid oklch(0.55 0.15 250);
  outline-offset: 2px;
}
```

Because the part names are consistent, the theme author doesn't need to learn each component's internal structure. `label` is always `label`. `trigger` is always `trigger`.

## `exportparts` in Practice: Nested Composition

Real applications compose components deeply. A `<settings-panel>` might contain `<form-field>` elements, which internally use `<fancy-input>`. Without `exportparts`, the top-level theme can't reach the innermost parts.

```html
<!-- settings-panel shadow DOM -->
<template>
  <section part="base">
    <h2 part="header"><slot name="title"></slot></h2>
    <div part="content">
      <form-field
        exportparts="label: field-label, input: field-input, error: field-error"
        label="Display name"
        name="display-name"
      ></form-field>
      <form-field
        exportparts="label: field-label, input: field-input, error: field-error"
        label="Bio"
        name="bio"
        type="textarea"
      ></form-field>
    </div>
  </section>
</template>
```

Now the consumer of `<settings-panel>` can theme the nested fields:

```css
settings-panel::part(header) {
  font-size: 1.25rem;
  margin-block-end: 1rem;
}

settings-panel::part(field-label) {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

settings-panel::part(field-input) {
  background: oklch(0.97 0 0);
}
```

### The `exportparts` Naming Convention

When re-exporting parts from nested components, Vanilla Breeze uses a consistent prefix pattern:

| Wrapper Component | Inner Component | Export Mapping |
|:------------------|:----------------|:---------------|
| `settings-panel` | `form-field` | `label: field-label`, `input: field-input` |
| `settings-panel` | `alert-banner` | `label: alert-label`, `trigger: alert-trigger` |
| `data-table` | `sort-button` | `trigger: sort-trigger`, `icon: sort-icon` |

The prefix matches the inner component's purpose within the wrapper, not its tag name. This avoids leaking implementation details.

## Building a Theme Switcher

Since `::part()` selectors work like any other CSS, theme switching is just swapping a stylesheet or toggling a class on a parent:

```css
/* theme-corporate.css */
:root {
  --brand-primary: oklch(0.45 0.15 250);
  --brand-surface: oklch(0.98 0.005 250);
  --brand-radius: 0.25rem;
}

form-field::part(input) {
  border-radius: var(--brand-radius);
  border: 1px solid oklch(0.75 0 0);
}

form-field::part(input):focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px oklch(0.45 0.15 250 / 0.15);
}
```

```css
/* theme-playful.css */
:root {
  --brand-primary: oklch(0.6 0.25 330);
  --brand-surface: oklch(0.98 0.01 330);
  --brand-radius: 1rem;
}

form-field::part(input) {
  border-radius: var(--brand-radius);
  border: 2px solid oklch(0.85 0.05 330);
}

form-field::part(input):focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px oklch(0.6 0.25 330 / 0.2);
}
```

Switching themes is a single line:

```js
document.getElementById('theme-link').href = 'theme-playful.css';
```

The component internals don't change. The shadow DOM structure is stable. Only the external `::part()` rules differ. This is CSS Zen Garden for web components.

## Documenting Parts as API

Every Vanilla Breeze component should document its parts the way it documents its attributes and events. Parts *are* the styling API.

A component's README section:

```markdown
## Styling API

### Parts

| Part | Description |
|:-----|:------------|
| `base` | Outer wrapper. Controls layout, background, border. |
| `label` | The field label. Controls typography, color. |
| `input` | The native input element. Controls borders, padding, background. |
| `description` | Help text below the input. Controls font size, color. |
| `error` | Validation error text. Controls color, icon spacing. |

### Custom Properties

| Property | Default | Description |
|:---------|:--------|:------------|
| `--field-radius` | `0.375rem` | Border radius for the input |
| `--field-border-color` | `oklch(0.8 0 0)` | Default border color |
| `--field-focus-color` | `oklch(0.55 0.15 250)` | Border and outline color on focus |
| `--field-error-color` | `oklch(0.55 0.2 25)` | Error text and border color |

### Supported State Selectors

These pseudo-classes work with `::part()`:

- `::part(input):focus` — input has keyboard focus
- `::part(input):invalid` — input fails validation
- `::part(input):disabled` — input is disabled
- `::part(input):placeholder-shown` — input is empty
- `::part(trigger):hover` — dismiss/action button hover
```

## Gotchas and Limitations

### Parts Don't Pierce Multiple Shadow Boundaries Automatically

If component A contains component B which contains component C, A cannot style C's parts unless B explicitly re-exports them with `exportparts`. This is by design — it preserves encapsulation — but it means component authors must be intentional about what they expose upward.

### No Wildcard Parts

You can't do `::part(*)` to style all parts at once. Each part must be named explicitly. This is actually good — it forces the component author to make deliberate choices about what's themeable.

### Parts Can Have Multiple Names

A single element can belong to multiple parts:

```html
<input part="input control focusable" />
```

This lets theme authors target at different granularities:

```css
/* Style all focusable parts consistently */
my-component::part(focusable):focus-visible {
  outline: 2px solid var(--focus-color);
}

/* Style just the input part */
my-component::part(input) {
  font-family: monospace;
}
```

Multi-name parts can serve as a lightweight trait system: `focusable`, `interactive`, `destructive` as cross-cutting concerns.

### `::part()` Specificity

`::part()` has the same specificity as `::slotted()` and other pseudo-elements: (0, 0, 1) for the pseudo-element itself, plus whatever the compound selector before it contributes. This means:

```css
fancy-input::part(input) { /* specificity: 0,0,2 (element + pseudo) */ }
.form-dark fancy-input::part(input) { /* specificity: 0,1,2 */ }
```

This works naturally with cascade layers and is no surprise to anyone familiar with CSS specificity.

## Implementation Checklist for Component Authors

When building a new Vanilla Breeze component:

- [ ] Identify which internal elements consumers will want to theme
- [ ] Assign part names from the standard vocabulary (use `base`, `label`, `input`, `trigger`, etc.)
- [ ] Add multi-name parts for cross-cutting traits (`focusable`, `interactive`)
- [ ] Define custom properties for values that affect multiple parts (tokens)
- [ ] If the component nests other Vanilla Breeze components, add `exportparts` with prefixed names
- [ ] Document the parts table, custom properties, and supported state selectors
- [ ] Test that `::part():focus-visible`, `::part():hover`, and `::part():invalid` work as expected
- [ ] Verify that a theme stylesheet can restyle the component without touching its shadow DOM