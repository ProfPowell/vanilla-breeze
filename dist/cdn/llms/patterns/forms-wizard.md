# Wizard / Multi-Step Form Patterns

Multi-step form patterns with numbered steps, tab navigation, and progress bar indicators. Guide users through complex forms with clear progress feedback.

- Documentation: https://vanilla-breeze.com/docs/patterns/forms/wizard/
- Vanilla Breeze 0.7.4

## Overview

Wizard patterns break complex forms into manageable steps, reducing cognitive load and improving completion rates. VB includes `wizard.js`, a production-ready controller that transforms standard HTML forms into multi-step wizards with progressive enhancement — forms still work without JavaScript.

Key features:
- `wizard.js` controller — auto-initializes on `form[data-wizard]`, handles step navigation, validation, and progress
- `nav.steps` integration — auto-syncs step indicator state; auto-populates from legends when empty
- Conditional steps (`data-wizard-if`) — show/hide steps based on user input, with AND/OR compound expressions
- Optional steps (`data-wizard-optional`) — skip without validation
- Summary/review step (`data-wizard-summary`) — auto-populate a review step with field values
- Auto-injected navigation — Back/Next/Submit buttons created automatically when nav is omitted
- Programmatic API — `wizardNext()`, `wizardPrev()`, `wizardGoTo()`, `wizardReset()`
- Custom events — `wizard:step-change`, `wizard:complete`, `wizard:reset`
- Visual patterns — numbered step indicators, tab navigation, and progress bars
- Accessibility — `aria-current="step"`, live regions, roving tabindex keyboard navigation

## Numbered Steps

A horizontal step indicator with numbered circles connected by lines. Completed steps show checkmarks and can be clicked to navigate back. The current step is highlighted with the interactive color.

The step indicator uses `nav.steps` from VB core — no custom CSS needed. See the Steps pattern for all variants and CSS variables.

wizard-steps.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <layout-stack data-layout-gap="xl">
      <h1>Create your account</h1>

      <!-- Numbered step list, filled from the legends and kept in sync by wizard.js -->
      <nav class="steps" id="signup-steps" aria-label="Sign-up progress">
        <ol></ol>
      </nav>

      <form action="/signup" method="POST" data-wizard data-wizard-steps="#signup-steps">
        <fieldset data-wizard-step>
          <legend>Account</legend>
          <form-field>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email"/>
          </form-field>
        </fieldset>

        <fieldset data-wizard-step>
          <legend>Details</legend>
          <layout-stack data-layout-gap="l">
            <form-field>
              <label for="full-name">Full name</label>
              <input type="text" id="full-name" name="full_name" required autocomplete="name"/>
            </form-field>
            <form-field>
              <label for="plan">Plan</label>
              <select id="plan" name="plan">
                <option value="free">Free</option>
                <option value="pro">Pro ($12/month)</option>
              </select>
            </form-field>
          </layout-stack>
        </fieldset>

        <fieldset data-wizard-step data-wizard-summary>
          <legend>Review</legend>
        </fieldset>

        <nav data-wizard-nav data-layout="cluster" data-layout-justify="between" aria-label="Sign-up steps">
          <button type="button" class="secondary" data-wizard-prev>Back</button>
          <button type="button" data-wizard-next>Next</button>
          <button type="submit">Create account</button>
        </nav>
      </form>
    </layout-stack>
  </layout-card>
</body>
```

No custom CSS required:

```css
/* No custom CSS needed — nav.steps is included in VB core.
   See the Steps pattern page for all variants and CSS variables. */
```

## Tab Navigation

A tab-style step list where each step is represented as a tab. The tab look is bespoke (one `.wizard-tabs` class, styles below), but the behaviour is all wizard.js: `data-wizard-steps` points it at the list, and it marks each `<li>` with `data-completed`, `aria-current="step"` or `aria-disabled="true"`. Completed tabs can be clicked (or reached with the arrow keys) to jump back; future tabs stay disabled until their prerequisites are met.

wizard-tabs.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-padding="none" data-layout-principal>
    <form action="/onboarding" method="POST" data-wizard data-wizard-steps="#onboarding-tabs">
      <!-- Tab-style step list, synced by wizard.js -->
      <nav class="wizard-tabs" id="onboarding-tabs" aria-label="Onboarding steps">
        <ol>
          <li>Account</li>
          <li>Profile</li>
          <li>Preferences</li>
          <li>Confirm</li>
        </ol>
      </nav>

      <fieldset data-wizard-step data-variant="minimal">
        <legend>Create your account</legend>
        <layout-stack data-layout-gap="l">
          <form-field>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required
                   autocomplete="email" placeholder="you@example.com"/>
          </form-field>
          <form-field>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="8"
                   autocomplete="new-password"/>
          </form-field>
        </layout-stack>
      </fieldset>

      <fieldset data-wizard-step data-variant="minimal">
        <legend>Tell us about yourself</legend>
        <layout-stack data-layout-gap="l">
          <form-field>
            <label for="full-name">Full name</label>
            <input type="text" id="full-name" name="full_name" required
                   autocomplete="name" placeholder="Jane Doe"/>
          </form-field>
          <form-field>
            <label for="company">Company</label>
            <input type="text" id="company" name="company"
                   autocomplete="organization" placeholder="Acme Inc."/>
          </form-field>
        </layout-stack>
      </fieldset>

      <fieldset data-wizard-step data-variant="minimal">
        <legend>Set your preferences</legend>
        <layout-stack data-layout-gap="l">
          <form-field>
            <label for="timezone">Timezone</label>
            <select id="timezone" name="timezone" required>
              <option value="">Select timezone...</option>
              <option value="pst">Pacific Time (PT)</option>
              <option value="mst">Mountain Time (MT)</option>
              <option value="cst">Central Time (CT)</option>
              <option value="est" selected>Eastern Time (ET)</option>
              <option value="utc">UTC</option>
            </select>
          </form-field>

          <fieldset data-layout="stack" data-layout-gap="s">
            <legend>Notifications</legend>
            <label>
              <input type="checkbox" name="email_notifications" value="Product updates" checked/>
              Email notifications for updates
            </label>
            <label>
              <input type="checkbox" name="weekly_digest" value="Weekly digest" checked/>
              Weekly activity digest
            </label>
          </fieldset>

          <fieldset data-layout="cluster" data-layout-gap="l">
            <legend>Theme preference</legend>
            <label><input type="radio" name="theme" value="light"/> Light</label>
            <label><input type="radio" name="theme" value="dark"/> Dark</label>
            <label><input type="radio" name="theme" value="system" checked/> System</label>
          </fieldset>
        </layout-stack>
      </fieldset>

      <fieldset data-wizard-step data-wizard-summary data-variant="minimal">
        <legend>Confirm your details</legend>
        <layout-stack data-layout-gap="l">
          <p>Check your answers, then finish setting up your account.</p>
        </layout-stack>
      </fieldset>

      <nav data-wizard-nav aria-label="Step navigation">
        <button type="button" class="secondary" data-wizard-prev>Back</button>
        <button type="button" data-wizard-next>Continue</button>
        <button type="submit">Finish</button>
      </nav>
    </form>
  </layout-card>
</body>
```

Tab wizard styles:

```css
/* Tab-style step list. wizard.js sets [data-completed],
   [aria-current="step"] and [aria-disabled="true"] on each <li>. */
.wizard-tabs ol {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: wizard-tab;
  border-block-end: var(--border-width-thin) solid var(--color-border);
}
.wizard-tabs li {
  counter-increment: wizard-tab;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--size-xs);
  margin: 0 0 -1px;
  padding: var(--size-m) var(--size-l);
  border-block-end: 3px solid transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-s);
  font-weight: 500;
}
.wizard-tabs li::before {
  content: counter(wizard-tab);
  display: inline-grid;
  place-items: center;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  border-radius: 50%;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
/* Current step */
.wizard-tabs li[aria-current="step"] {
  color: var(--color-interactive);
  border-block-end-color: var(--color-interactive);
}
.wizard-tabs li[aria-current="step"]::before {
  background: var(--color-interactive);
  border-color: var(--color-interactive);
  color: var(--color-text-on-primary);
}
/* Completed step: a check, and clickable to go back */
.wizard-tabs li[data-completed] {
  color: var(--color-text);
  cursor: pointer;
}
.wizard-tabs li[data-completed]:hover {
  background: var(--color-surface-raised);
}
.wizard-tabs li[data-completed]::before {
  content: "\2713";
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}
/* Future step */
.wizard-tabs li[aria-disabled="true"] {
  opacity: 0.6;
}
/* The tabs already say which step is current */
form:has(> .wizard-tabs)::before {
  display: none;
}
/* Inset the steps and buttons; the tabs run edge to edge */
.wizard-tabs ~ :is(fieldset, nav) {
  margin-inline: var(--size-l);
}
.wizard-tabs ~ fieldset {
  padding-block-start: var(--size-m);
}
.wizard-tabs ~ fieldset > legend {
  font-size: var(--font-size-xl);
  font-weight: 600;
}
form:has(> .wizard-tabs) {
  padding-block-end: var(--size-l);
}
```

## Progress Bar

A native `<progress data-wizard-progress>` bar with a `<progress-tracker>` of step dots below it, both driven by wizard.js. Great for checkout flows and linear processes.

Nothing to add. Inside `form[data-wizard]` the `<progress data-wizard-progress>` is styled by VB core and wizard.js updates its `value` and `max`. The `<progress-tracker>` named by `data-wizard-steps` draws the step dots and follows the current step; with `data-clickable`, completed steps take the user back. wizard.js also prints a "Step N of M" line above the form.

wizard-progress.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <layout-stack data-layout-gap="xl">
      <header data-layout="stack" data-layout-gap="xs">
        <h1>Checkout</h1>
        <p>Four quick steps. Your payment details are encrypted.</p>
      </header>

      <form action="/checkout" method="POST" data-wizard data-wizard-steps="#checkout-steps">
        <!-- Progress bar: wizard.js sets value/max on every step change -->
        <label for="checkout-progress">Checkout progress</label>
        <progress id="checkout-progress" data-wizard-progress max="4" value="1"></progress>

        <!-- Step dots, synced by wizard.js through data-wizard-steps -->
        <progress-tracker id="checkout-steps" data-clickable data-label-list="Checkout steps">
          <ol>
            <li data-step="cart">Cart</li>
            <li data-step="payment">Payment</li>
            <li data-step="shipping">Shipping</li>
            <li data-step="confirm">Confirm</li>
          </ol>
        </progress-tracker>

        <fieldset data-wizard-step>
          <legend>Your cart</legend>
          <dl data-variant="horizontal">
            <div>
              <dt>Premium Wireless Headphones</dt>
              <dd>$249.00</dd>
            </div>
            <div>
              <dt>USB-C Charging Cable &times; 2</dt>
              <dd>$29.98</dd>
            </div>
          </dl>
        </fieldset>

        <fieldset data-wizard-step>
          <legend>Payment details</legend>
          <layout-stack data-layout-gap="l">
            <form-field>
              <label for="card-name">Name on card</label>
              <input type="text" id="card-name" name="card_name" required
                     autocomplete="cc-name" placeholder="John Doe"
                     aria-describedby="card-name-error"/>
              <output id="card-name-error" class="error" for="card-name" aria-live="polite">
                Please enter the name on your card.
              </output>
            </form-field>

            <form-field>
              <label for="card-number">Card number</label>
              <input type="text" id="card-number" name="card_number" required
                     autocomplete="cc-number" placeholder="1234 5678 9012 3456"
                     inputmode="numeric" pattern="[0-9\s]{13,19}"
                     aria-describedby="card-number-error"/>
              <output id="card-number-error" class="error" for="card-number" aria-live="polite">
                Please enter a valid card number.
              </output>
            </form-field>

            <layout-grid data-layout-min="xs" data-layout-gap="m">
              <form-field>
                <label for="expiry">Expiry date</label>
                <input type="text" id="expiry" name="expiry" required
                       autocomplete="cc-exp" placeholder="MM/YY"
                       inputmode="numeric" pattern="[0-9]{2}/[0-9]{2}"
                       aria-describedby="expiry-error"/>
                <output id="expiry-error" class="error" for="expiry" aria-live="polite">
                  Enter MM/YY format.
                </output>
              </form-field>

              <form-field>
                <label for="cvc">Security code</label>
                <input type="text" id="cvc" name="cvc" required
                       autocomplete="cc-csc" placeholder="123"
                       inputmode="numeric" pattern="[0-9]{3,4}"
                       aria-describedby="cvc-error"/>
                <output id="cvc-error" class="error" for="cvc" aria-live="polite">
                  3 or 4 digits.
                </output>
              </form-field>
            </layout-grid>
          </layout-stack>
        </fieldset>

        <fieldset data-wizard-step>
          <legend>Shipping address</legend>
          <layout-stack data-layout-gap="l">
            <form-field>
              <label for="address">Street address</label>
              <input type="text" id="address" name="address" required
                     autocomplete="address-line1" placeholder="123 Main St"/>
            </form-field>

            <layout-grid data-layout-min="xs" data-layout-gap="m">
              <form-field>
                <label for="city">City</label>
                <input type="text" id="city" name="city" required
                       autocomplete="address-level2" placeholder="San Francisco"/>
              </form-field>

              <form-field>
                <label for="zip">ZIP code</label>
                <input type="text" id="zip" name="zip" required
                       autocomplete="postal-code" placeholder="94102"/>
              </form-field>
            </layout-grid>
          </layout-stack>
        </fieldset>

        <fieldset data-wizard-step data-wizard-summary>
          <legend>Confirm your order</legend>
          <p>Check the details below, then place your order.</p>
        </fieldset>

        <nav data-wizard-nav>
          <button type="button" class="secondary" data-wizard-prev>
            <icon-wc name="arrow-left" size="sm"></icon-wc>
            Back
          </button>
          <button type="button" data-wizard-next>
            Continue
            <icon-wc name="arrow-right" size="sm"></icon-wc>
          </button>
          <button type="submit">Place order</button>
        </nav>
      </form>
    </layout-stack>
  </layout-card>
</body>
```

No custom CSS required:

```css
/* No custom CSS needed: form[data-wizard] [data-wizard-progress]
   and <progress-tracker> are both styled by VB. */
```

## wizard.js Controller

VB includes `wizard.js`, a lightweight controller that enhances `form[data-wizard]` elements with step navigation, validation, conditional steps, and progress tracking. It works as a standard form without JavaScript (progressive enhancement).

Add `data-wizard` to a form. Each `<fieldset data-wizard-step>` becomes a step. The controller auto-initializes on `DOMContentLoaded`.

Use `data-wizard-if` to show a step only when a form field matches a value. The step is hidden when the condition is not met and the progress bar adjusts automatically.

Use `data-wizard-optional` to mark a step that can be skipped. The "Next" button advances without requiring validation on optional steps.

When a `nav.steps` element is found inside the form (or referenced via `data-wizard-steps="#id"`), wizard.js automatically syncs step states — setting `data-completed` on past steps, `aria-current="step"` on the current step, and hiding `<li>` elements for conditional steps that don't apply.

Basic wizard form:

```html
<form data-wizard>
  <progress data-wizard-progress max="3" value="1"></progress>

  <fieldset data-wizard-step>
    <legend>Personal Information</legend>
    <!-- form fields -->
  </fieldset>

  <fieldset data-wizard-step>
    <legend>Account Details</legend>
    <!-- form fields -->
  </fieldset>

  <fieldset data-wizard-step>
    <legend>Confirmation</legend>
    <!-- form fields -->
  </fieldset>

  <nav data-wizard-nav>
    <button type="button" data-wizard-prev>Previous</button>
    <button type="button" data-wizard-next>Next</button>
    <button type="submit">Submit</button>
  </nav>
</form>
```

Conditional step:

```html
<form data-wizard>
  <fieldset data-wizard-step>
    <legend>Account Type</legend>
    <label>
      <input type="radio" name="accountType" value="personal" checked>
      Personal Account
    </label>
    <label>
      <input type="radio" name="accountType" value="business">
      Business Account
    </label>
  </fieldset>

  <!-- Only shown when "business" is selected -->
  <fieldset data-wizard-step data-wizard-if="accountType:business">
    <legend>Business Information</legend>
    <form-field>
      <label for="company">Company Name</label>
      <input type="text" id="company" name="company" required>
    </form-field>
  </fieldset>

  <fieldset data-wizard-step>
    <legend>Contact Information</legend>
    <!-- always shown -->
  </fieldset>

  <nav data-wizard-nav>
    <button type="button" data-wizard-prev>Previous</button>
    <button type="button" data-wizard-next>Next</button>
    <button type="submit">Submit</button>
  </nav>
</form>
```

Optional step:

```html
<form data-wizard>
  <fieldset data-wizard-step>
    <legend>Required Info</legend>
    <form-field>
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required>
    </form-field>
  </fieldset>

  <!-- Can be skipped without validation -->
  <fieldset data-wizard-step data-wizard-optional>
    <legend>Additional Details (Optional)</legend>
    <form-field>
      <label for="bio">Bio</label>
      <textarea id="bio" name="bio" rows="3"></textarea>
    </form-field>
  </fieldset>

  <fieldset data-wizard-step>
    <legend>Done</legend>
    <p>Click Submit to finish.</p>
  </fieldset>

  <nav data-wizard-nav>
    <button type="button" data-wizard-prev>Previous</button>
    <button type="button" data-wizard-next>Next</button>
    <button type="submit">Submit</button>
  </nav>
</form>
```

Wizard + nav.steps integration:

```html
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
    <button type="submit">Place Order</button>
  </nav>
</form>
```

## Markup Reference

The `data-wizard-if` attribute supports these patterns:

AND (`&&`) has higher precedence than OR (`||`).

## Summary / Review Step

Add `data-wizard-summary` to a step fieldset to create a review step. The wizard populates it with form values each time the step becomes active.

Place elements with `data-wizard-field="fieldName"` to control exactly which values appear and where:

If no `data-wizard-field` elements are present, a `<dl>` is auto-generated from all non-empty fields across visible steps. Labels are detected from `<label>` associations.

Manual summary step:

```html
<fieldset data-wizard-step data-wizard-summary>
  <legend>Review</legend>
  <dl>
    <dt>Email</dt>
    <dd data-wizard-field="email"></dd>
    <dt>Name</dt>
    <dd data-wizard-field="fullname"></dd>
  </dl>
</fieldset>
```

Auto-generated summary:

```html
<fieldset data-wizard-step data-wizard-summary>
  <legend>Review</legend>
  <!-- dl auto-generated from all form values -->
</fieldset>
```

## Auto-Injected Navigation

If no `[data-wizard-nav]` element exists in the form, the wizard automatically injects a Back / Next / Submit navigation bar. This allows minimal wizard markup:

Minimal wizard — nav auto-injected:

```html
<form data-wizard>
  <fieldset data-wizard-step><legend>Step 1</legend>...</fieldset>
  <fieldset data-wizard-step><legend>Step 2</legend>...</fieldset>
  <!-- nav injected automatically -->
</form>
```

## Auto-Populated Step List

When a `nav.steps` element contains an empty `<ol>`, the wizard auto-populates `<li>` items from each step's `<legend>` text. This eliminates the need to duplicate step names between fieldset legends and the navigation list.

Auto-populated step list:

```html
<form data-wizard>
  <nav class="steps" aria-label="Progress">
    <ol><!-- auto-populated from legends --></ol>
  </nav>
  <fieldset data-wizard-step><legend>Account</legend>...</fieldset>
  <fieldset data-wizard-step><legend>Profile</legend>...</fieldset>
  <fieldset data-wizard-step><legend>Confirm</legend>...</fieldset>
</form>
```

## Keyboard Navigation

The step indicator (`nav.steps`) uses the roving tabindex pattern for keyboard access:
- Arrow Right / Arrow Down — move focus to next step item
- Arrow Left / Arrow Up — move focus to previous step item
- Home — move focus to first step item
- End — move focus to last step item
- Enter / Space — activate completed step items to navigate back

Only the current step item is in the tab order (`tabindex="0"`). All other items have `tabindex="-1"` and are reachable only via arrow keys.

## API & Events

Access the wizard programmatically via methods attached to the form element:

Programmatic API:

```javascript
// Get the form
const form = document.querySelector('#my-wizard');

// Navigation methods
form.wizardNext();      // Go to next step (validates first)
form.wizardPrev();      // Go to previous step
form.wizardGoTo(2);     // Jump to step index 2 (zero-based)
form.wizardReset();     // Reset to first step

// Access the controller
const ctrl = form.wizardController;
console.log(ctrl.currentStep);  // Current step index
console.log(ctrl.totalSteps);   // Total visible steps

// Listen for events
form.addEventListener('wizard:step-change', (e) => {
  console.log(`Moved from step ${e.detail.from} to ${e.detail.to}`);
});

form.addEventListener('wizard:complete', () => {
  console.log('Wizard completed!');
});
```

## Configuration

Key configuration options for wizard patterns:

## Usage Notes

- Validate each step before allowing progression to the next
- Show inline validation errors using `<output class="error">`
- Disable the "Next" button until required fields are valid
- Consider allowing users to skip optional steps
- Auto-save form data to prevent loss on accidental navigation
- Use `sessionStorage` or server-side persistence
- Show a "saved" indicator when data is preserved
- Allow users to resume incomplete forms
- Use `aria-current="step"` on the active step for screen readers
- Use a native `<progress>` with a `<label>`; it carries the progressbar role and value without extra ARIA
- Completed steps should have descriptive `aria-label` (e.g., "Go back to Account step (completed)")
- Announce step changes to screen readers with live regions
- Use `aria-disabled="true"` on future steps that cannot be accessed
- Ensure keyboard navigation works for clickable completed steps
- Always allow users to go back to previous steps
- Preserve form data when navigating between steps
- Disable future steps until prerequisites are complete
- Show a summary/review step before final submission
- Provide a "Save and exit" option for long forms

## Related

Step indicator CSS pattern with variants and customization

Multi-step registration forms

Contact and inquiry forms

Form field element with validation

Icon component for step indicators
