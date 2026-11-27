# Step Indicator Patterns

Step indicators show progress through a multi-step process. Built with CSS counters for auto-numbering, auto-generated connectors, and ARIA attributes for accessibility.

- Documentation: https://vanilla-breeze.com/docs/patterns/navigation/steps/
- Vanilla Breeze 0.7.4

## Overview

Step indicators communicate progress through a multi-step process like checkout, registration, or onboarding. The `nav.steps` pattern uses CSS-only numbered circles, auto-generated connectors, and semantic HTML.

Key features:
- CSS counters for auto-numbering — no manual `<span>1</span>` needed
- Auto connectors between steps via `::after` pseudo-elements
- Checkmark on completed steps (replaces counter number)
- ARIA support — `aria-current="step"` for active, `aria-label` for the nav
- Variants — labels below, vertical, small/large sizes
- Dark mode — automatic via VB color tokens
- Wizard integration — auto-syncs with `wizard.js` when present

## Basic Step Indicator

The default horizontal layout with numbered circles, labels beside each circle, and auto-generated connectors between steps. Uses `<ol>` for semantic ordered progression.

Basic step indicator:

```html
<nav class="steps" aria-label="Checkout progress">
  <ol>
    <li data-completed>Shipping</li>
    <li aria-current="step">Payment</li>
    <li>Review</li>
  </ol>
</nav>
```

## Interactive Steps

Completed steps can contain `<a>` links to allow users to navigate back to earlier steps. Future steps remain plain text (non-clickable). The interactive demo below lets you navigate between steps with Previous/Next buttons.

Interactive steps with links:

```html
<nav class="steps" aria-label="Registration progress">
  <ol>
    <li data-completed>
      <a href="#account">Account</a>
    </li>
    <li data-completed>
      <a href="#profile">Profile</a>
    </li>
    <li aria-current="step">Preferences</li>
    <li>Confirm</li>
  </ol>
</nav>
```

## Labels Below

Use `data-labels="below"` to position labels below their circles. Connectors run between circles at circle height using absolute positioning. This variant works well for steps with longer labels.

Labels below variant:

```html
<nav class="steps" data-labels="below" aria-label="Account setup">
  <ol>
    <li data-completed>Account</li>
    <li aria-current="step">Details</li>
    <li>Preferences</li>
    <li>Review</li>
  </ol>
</nav>
```

## Vertical Steps

Use `data-direction="vertical"` to stack steps vertically with downward connectors. Useful for sidebar navigation or when you have many steps that need more space.

Vertical variant:

```html
<nav class="steps" data-direction="vertical" aria-label="Setup progress">
  <ol>
    <li data-completed>Create account</li>
    <li data-completed>Verify email</li>
    <li aria-current="step">Set up profile</li>
    <li>Choose plan</li>
    <li>Get started</li>
  </ol>
</nav>
```

## Size Variants

Use `data-size="sm"` for compact indicators or `data-size="lg"` for more prominent ones. The default size is `2rem`.
- Step 1
- Step 2
- Step 3
- Step 1
- Step 2
- Step 3

Small steps:

```html
<nav class="steps" data-size="sm" aria-label="Progress">
  <ol>
    <li data-completed>Step 1</li>
    <li aria-current="step">Step 2</li>
    <li>Step 3</li>
  </ol>
</nav>
```

Large steps:

```html
<nav class="steps" data-size="lg" aria-label="Progress">
  <ol>
    <li data-completed>Step 1</li>
    <li aria-current="step">Step 2</li>
    <li>Step 3</li>
  </ol>
</nav>
```

## With Wizard Forms

When used inside (or referenced by) a `form[data-wizard]`, the `wizard.js` controller auto-syncs `nav.steps` state as the user navigates steps. Point the form to the nav using `data-wizard-steps="#id"`, or place the `nav.steps` inside the form for auto-discovery.

The wizard automatically:
- Sets `data-completed` on all steps before the current one
- Sets `aria-current="step"` on the current step
- Clears attributes from future steps
- Hides conditional steps when they don't apply

Wizard + nav.steps integration:

```html
<!-- wizard.js auto-syncs nav.steps when inside a data-wizard form -->
<form data-wizard data-wizard-steps="#checkout-steps">
  <nav class="steps" id="checkout-steps" aria-label="Checkout progress">
    <ol>
      <li>Shipping</li>
      <li>Payment</li>
      <li>Review</li>
    </ol>
  </nav>

  <progress data-wizard-progress max="3" value="1"></progress>

  <fieldset data-wizard-step>
    <legend>Shipping</legend>
    <!-- shipping fields -->
  </fieldset>

  <fieldset data-wizard-step>
    <legend>Payment</legend>
    <!-- payment fields -->
  </fieldset>

  <fieldset data-wizard-step>
    <legend>Review</legend>
    <!-- review content -->
  </fieldset>

  <nav data-wizard-nav>
    <button type="button" data-wizard-prev>Previous</button>
    <button type="button" data-wizard-next>Next</button>
    <button type="submit">Place order</button>
  </nav>
</form>
```

## States

Each step can be in one of three states:

## CSS Variables

Override the private `--_` variables on `nav.steps` to customize colors and sizes:

CSS reference (included in VB):

```css
/* Step indicator — included in VB core (nav/styles.css) */
nav.steps {
  --_step-size: 2rem;
  --_step-font: var(--font-size-s);
  --_connector-height: 2px;
  --_connector-color: var(--color-border);
  --_connector-completed: var(--color-success);
  --_future-bg: var(--color-surface-raised);
  --_future-border: var(--color-border);
  --_future-color: var(--color-text-muted);
  --_active-bg: var(--color-interactive);
  --_active-border: var(--color-interactive);
  --_active-text: white;
  --_completed-bg: var(--color-success);
  --_completed-border: var(--color-success);
  --_completed-text: white;
}

/* CSS counters auto-number circles */
nav.steps > ol {
  counter-reset: step;
}
nav.steps li {
  counter-increment: step;
}
nav.steps li::before {
  content: counter(step);       /* auto number */
}
nav.steps li[data-completed]::before {
  content: "\\2713";             /* checkmark replaces number */
}
```

## Accessibility

- `aria-current="step"` on the active `<li>` announces the current step to screen readers
- `aria-label` on the `<nav>` identifies the navigation purpose
- `<ol>` conveys ordered sequence to assistive technology
- Completed steps with `<a>` links are keyboard-navigable
- When used with `wizard.js`, step changes are announced via a live region
- Future steps (no attributes) have muted visual treatment — not interactive, not focusable

## Related

Multi-step form patterns with wizard.js integration

Hierarchical location navigation

Page-level navigation patterns

Full nav element documentation with all variants
