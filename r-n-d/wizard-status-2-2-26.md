# Wizard Forms Lab Experiment - Status Report

**Date:** February 2, 2026
**Status:** Implemented in Labs
**Location:** `/lab/experiments/wizard-forms/`

---

## Overview

The wizard forms progressive enhancement pattern has been implemented as a lab experiment. It transforms standard HTML forms with `[data-wizard]` into multi-step wizards while maintaining full functionality without JavaScript.

---

## Implementation Summary

### Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/labs/wizard.css` | Wizard styles (visibility, progress, nav) | ~160 |
| `src/lib/wizard.js` | WizardController class | ~500 |
| `site/pages/lab/experiments/wizard-forms.astro` | Demo page | ~500 |

### Files Modified

| File | Change |
|------|--------|
| `src/labs/labs.css` | Added `@import "./wizard.css" layer(labs);` |
| `src/labs/labs.js` | Added `export * from '../lib/wizard.js';` |
| `site/pages/lab/experiments/index.astro` | Added wizard-forms card |

---

## Features Implemented

### Core Features (All Working)

- [x] Step visibility and navigation (next/prev/goTo)
- [x] Per-step validation using `checkValidity()`
- [x] Conditional steps via `data-wizard-if="field:value"`
- [x] Progress bar sync with `<progress>` element
- [x] URL hash integration (`#step=2`)
- [x] Screen reader announcements via `aria-live` region
- [x] Custom events (`wizard:stepchange`, `wizard:complete`, `wizard:reset`)
- [x] Optional steps via `data-wizard-optional`

### Deferred Features

- [ ] SessionStorage persistence (`data-wizard-persist`)
- [ ] Auto-summary generation (`data-wizard-summary`)
- [ ] Step list navigation (clickable breadcrumbs)
- [ ] Complex condition syntax (AND/OR operators)

---

## Technical Notes

### File Location Decision

The JavaScript controller is placed in `src/lib/wizard.js` rather than `src/labs/wizard.js` due to Astro's script bundling behavior:

- Astro processes `<script>` tags through esbuild by default
- Private class fields (`#`) in the WizardController caused bundling issues
- Solution: Use `<script is:inline>` to bypass Astro processing
- The `src/lib/` location follows the pattern used by `charts.js` and `wireframe.js`

### Usage in Astro Pages

```html
<!-- Load wizard.js as inline module (bypasses Astro bundling) -->
<script type="module" src="/src/lib/wizard.js" is:inline></script>

<!-- Additional page scripts also need is:inline -->
<script is:inline>
  // Page-specific code here
</script>
```

### CSS Layer

Wizard styles are imported into the `labs` layer:
```css
@import "./wizard.css" layer(labs);
```

---

## Markup Pattern

```html
<form data-wizard>
  <progress data-wizard-progress max="3" value="1"></progress>

  <fieldset data-wizard-step>
    <legend>Step 1: Personal Info</legend>
    <form-field>
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required>
    </form-field>
  </fieldset>

  <fieldset data-wizard-step data-wizard-if="accountType:business">
    <legend>Step 2: Business Details</legend>
    <!-- Conditional step -->
  </fieldset>

  <fieldset data-wizard-step data-wizard-optional>
    <legend>Step 3: Optional Info</legend>
    <!-- Can be skipped -->
  </fieldset>

  <nav data-wizard-nav>
    <button type="button" data-wizard-prev>Previous</button>
    <button type="button" data-wizard-next>Next</button>
    <button type="submit">Submit</button>
  </nav>
</form>
```

---

## Condition Syntax

| Pattern | Meaning |
|---------|---------|
| `data-wizard-if="fieldName:value"` | Show when field equals value |
| `data-wizard-if="fieldName:!value"` | Show when field does NOT equal value |
| `data-wizard-if="fieldName"` | Show when field is truthy |
| `data-wizard-if="!fieldName"` | Show when field is falsy |

---

## JavaScript API

```js
// Get the form
const form = document.querySelector('#my-wizard');

// Navigation methods (attached to form element)
form.wizardNext();      // Go to next step
form.wizardPrev();      // Go to previous step
form.wizardGoTo(2);     // Jump to step index (zero-based)
form.wizardReset();     // Reset to first step

// Access the controller directly
const controller = form.wizardController;
console.log(controller.currentStep);  // Current step index
console.log(controller.totalSteps);   // Total visible steps

// Listen for events
form.addEventListener('wizard:stepchange', (e) => {
  console.log(`From ${e.detail.from} to ${e.detail.to}`);
});

form.addEventListener('wizard:complete', () => {
  console.log('Wizard completed!');
});
```

---

## Demo Page Sections

The demo page at `/lab/experiments/wizard-forms/` includes:

1. **Basic Wizard** - 3-step account setup with validation
2. **Conditional Steps** - Business/personal toggle showing dynamic steps
3. **Optional Steps** - Demonstrating skip behavior
4. **Events Demo** - Live event logging panel
5. **API Usage** - Code examples
6. **Markup Reference** - Complete attribute documentation

---

## Verification Checklist

| Test | Status |
|------|--------|
| No-JS fallback (all fields visible) | Needs testing |
| Next/Prev navigation | Working |
| Validation blocks invalid steps | Working |
| Conditional step toggle | Working |
| Progress bar updates | Working |
| URL hash sync | Working |
| Screen reader announcements | Working |
| Theme compatibility | Needs testing |

---

## Promotion Criteria

Before promoting to core `src/web-components/wizard-wc/`:

- [ ] Stable API (no breaking changes for 2+ weeks)
- [ ] Accessibility audit passes
- [ ] Works with all existing themes
- [ ] Documentation written
- [ ] Test coverage added
- [ ] No performance regressions on large forms

### Migration Path

When ready to promote:
1. Move `src/lib/wizard.js` → `src/web-components/wizard-wc/logic.js`
2. Move `src/labs/wizard.css` → `src/web-components/wizard-wc/styles.css`
3. Update imports in `src/web-components/index.js`
4. Update imports in `src/web-components/index.css`
5. Remove imports from `src/labs/labs.css` and `src/labs/labs.js`
6. Add documentation page

---

## Known Issues

1. **Astro bundling** - Must use `is:inline` scripts to avoid esbuild issues with private class fields
2. **Hash collision** - URL hash `#step=N` may conflict with anchor links on same page
3. **Form reset** - Native form reset doesn't trigger wizard reset (may need event listener)

---

## Next Steps

1. Manual testing across themes (default, cyber, organic, etc.)
2. Accessibility audit with screen reader
3. Consider adding keyboard shortcuts (arrow keys for navigation)
4. Evaluate need for persistence feature
5. Gather feedback from usage
