# Wizard Forms: Progressive Enhancement Specification

## Core Concept

Transform standard HTML forms into multi-step wizards using semantic markup, CSS, and minimal JavaScript. Works as a plain form without enhancement.

## Markup Structure

### Base Pattern
```html
<form data-wizard>
  <fieldset data-wizard-step>
    <legend>Personal Information</legend>
    <form-field>
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required>
    </form-field>
  </fieldset>
  
  <fieldset data-wizard-step>
    <legend>Contact Details</legend>
    <form-field>
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
    </form-field>
  </fieldset>
  
  <fieldset data-wizard-step>
    <legend>Review</legend>
    <output data-wizard-summary></output>
  </fieldset>
</form>
```

### Conditional Steps

Use data attributes to define visibility rules:
```html
<fieldset data-wizard-step data-wizard-if="accountType:business">
  <legend>Business Information</legend>
  <!-- Only shown when accountType radio = "business" -->
</fieldset>
```

**Condition Syntax:**
- `data-wizard-if="fieldName:value"` - show when field equals value
- `data-wizard-if="fieldName:!value"` - show when field doesn't equal value
- `data-wizard-if="fieldName"` - show when field is truthy (checked, has value)
- `data-wizard-if="!fieldName"` - show when field is falsy

## Navigation

### Standard Controls
```html
<form data-wizard>
  <!-- steps -->
  
  <nav data-wizard-nav>
    <button type="button" data-wizard-prev>Previous</button>
    <button type="button" data-wizard-next>Next</button>
    <button type="submit">Submit</button>
  </nav>
</form>
```

### Auto-injected Navigation

If no `[data-wizard-nav]` exists, inject default controls at form end.

## State Management

### CSS-Driven Display
```css
form[data-wizard] fieldset[data-wizard-step] {
  display: none;
}

form[data-wizard] fieldset[data-wizard-step][data-wizard-active] {
  display: block;
}
```

### Current Step Tracking

Form element maintains state via `data-wizard-current="2"` attribute. CSS or JS can use this for progress indicators:
```css
form[data-wizard]::before {
  content: "Step " attr(data-wizard-current) " of " attr(data-wizard-total);
}
```

## Validation Strategy

### Per-Step Validation

When clicking "Next":
1. Check `required` and native validation on current step only
2. Use `fieldset.checkValidity()`
3. Block progression if invalid
4. Use `:invalid` pseudo-class for styling

### Skip Optional Steps
```html
<fieldset data-wizard-step data-wizard-optional>
  <legend>Additional Info (Optional)</legend>
  <!-- Can skip even if empty -->
</fieldset>
```

## Progress Indication

### Native `<progress>` Element
```html
<form data-wizard data-wizard-current="1" data-wizard-total="4">
  <progress max="4" value="1" data-wizard-progress></progress>
  <!-- Automatically syncs with current step -->
</form>
```

### Step List Navigation
```html
<ol data-wizard-steps>
  <!-- Auto-populated from fieldset legends -->
  <!-- Or manually defined: -->
  <li><a href="#step-1">Personal</a></li>
  <li><a href="#step-2">Contact</a></li>
  <li data-wizard-if="accountType:business"><a href="#step-3">Business</a></li>
</ol>
```

## URL Integration

### Hash-Based Routing

- Current step tracked in URL: `#step-2`
- Enables back/forward browser navigation
- Bookmarkable wizard state
- Fallback: works without hashes

### URL State Pattern
```
/form#step=2&accountType=business
```

Read from URL on load, update on navigation. Use `URLSearchParams` in hash fragment.

## JavaScript Enhancement

### Minimal API
```js
// Auto-init on forms with [data-wizard]
// Manual init:
const wizard = document.querySelector('form[data-wizard]');
wizard.wizardGoTo(2); // Jump to step
wizard.wizardNext(); // Advance
wizard.wizardPrev(); // Go back
wizard.wizardReset(); // Start over
```

### Custom Events
```js
wizard.addEventListener('wizard:stepchange', (e) => {
  console.log(e.detail.from, e.detail.to);
});

wizard.addEventListener('wizard:complete', (e) => {
  // All steps completed, form valid
});
```

## Progressive Enhancement Layers

### Layer 1: No JS
- Standard multi-fieldset form
- All fields visible
- Submits normally
- Fully functional

### Layer 2: CSS Only
- Hide all but first fieldset
- Manual navigation via IDs and `:target`
- No validation enforcement

### Layer 3: CSS + Minimal JS
- Smart navigation
- Conditional steps
- Per-step validation
- URL sync
- Progress tracking

## Accessibility

### ARIA Integration
```html
<form data-wizard role="group" aria-label="Account Setup">
  <fieldset data-wizard-step 
            role="group" 
            aria-labelledby="step-1-title"
            data-wizard-active>
    <legend id="step-1-title">Personal Information</legend>
  </fieldset>
</form>
```

### Keyboard Navigation

- Tab through current step only
- Previous/Next respond to arrow keys when focused
- Escape returns to first step (or cancels)

### Screen Reader Announcements

Use `aria-live` region for step changes:
```html
<div role="status" aria-live="polite" aria-atomic="true" data-wizard-status>
  <!-- "Now on step 2 of 4: Contact Details" -->
</div>
```

## Summary/Review Step

### Auto-Summary Pattern
```html
<fieldset data-wizard-step>
  <legend>Review Your Information</legend>
  <dl data-wizard-summary>
    <!-- Auto-populated with name/value pairs from all fields -->
    <!-- Or manual: -->
    <dt>Name</dt>
    <dd data-wizard-field="name"></dd>
  </dl>
</fieldset>
```

## Form Data Persistence

### SessionStorage Integration
```html
<form data-wizard data-wizard-persist="sessionStorage">
  <!-- Auto-saves on each step -->
  <!-- Auto-restores on page load -->
</form>
```

Key: `wizard-${form.id || form.name || location.pathname}`

## Configuration Options
```html
<form data-wizard
      data-wizard-persist="sessionStorage"
      data-wizard-validate="step"
      data-wizard-history="hash"
      data-wizard-auto-nav="true">
```

**Options:**
- `data-wizard-persist`: none | sessionStorage | localStorage
- `data-wizard-validate`: none | step | complete
- `data-wizard-history`: none | hash | state
- `data-wizard-auto-nav`: true | false (inject navigation)

## Implementation Notes

### Detection
Enhance only forms with `[data-wizard]` attribute.

### Fieldset as Primitive
Each `<fieldset data-wizard-step>` is a step. Order in DOM is order of wizard.

### Conditional Logic
Evaluated on input change. Steps dynamically added/removed from sequence.

### Native Form Features
Preserve form submission, validation, FormData APIs. Wizard is pure UI layer.

### No Framework Lock-in
Markup works standalone. Enhancement is additive. Degrade gracefully.