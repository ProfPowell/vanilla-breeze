# Checkout Form Patterns

Checkout form patterns with single-page, split layout, and multi-step flows. Accessible and secure payment form designs.

- Documentation: https://vanilla-breeze.com/docs/patterns/forms/checkout/
- Vanilla Breeze 0.7.4

## Overview

Checkout forms are critical for e-commerce success. These patterns demonstrate best practices for collecting shipping and payment information while maintaining user trust and a smooth experience using Vanilla Breeze components.

Key features:
- `<fieldset>` with `<legend>` for semantic grouping of related fields
- `<form-field>` for consistent input styling and validation
- `data-layout="sidebar"` with `<main>` and `<aside>` for order summary placement
- `data-layout="split"` for side-by-side fields (city/state, expiry/CVC)
- `<dl>` with `<dl-item>` rows for the order summary; `<small>` for the security note
- `<icon-wc name="lock">` for security indicators
- Proper `autocomplete` attributes for address and payment autofill
- `inputmode="numeric"` for mobile keyboard optimization

## Single-Page Checkout

A complete checkout form on a single page, using `<fieldset>` to group contact, shipping, and payment sections. Centered with `data-layout="center"` and wrapped in a `<layout-card>` for visual containment. Ideal for simpler purchases or when you want to minimize steps.

VB provides native `<fieldset>` styling (border, radius, padding, legend formatting). These overrides increase the padding and legend font size for a more spacious checkout layout, and tint the `<small>` security note:

checkout-single.html:

```html
<body>
  <main data-layout="center" data-layout-max="narrow">
    <layout-card data-padding="l">
      <form action="/checkout" method="POST" data-layout="stack" data-layout-gap="l">
        <header data-layout="stack" data-layout-gap="s">
          <h1>Checkout</h1>
          <p>Complete your purchase by providing the information below.</p>
        </header>

        <!-- Contact Information -->
        <fieldset data-layout="stack" data-layout-gap="m">
          <legend>Contact information</legend>
            <form-field>
              <label for="email">Email address</label>
              <input type="email" id="email" name="email" required
                     autocomplete="email" placeholder="you@example.com"
                     aria-describedby="email-error"/>
              <output id="email-error" class="error" for="email" aria-live="polite">
                Please enter a valid email address.
              </output>
            </form-field>
        </fieldset>

        <!-- Shipping Address -->
        <fieldset data-layout="stack" data-layout-gap="m">
          <legend>Shipping address</legend>
            <form-field>
              <label for="full-name">Full name</label>
              <input type="text" id="full-name" name="full_name" required
                     autocomplete="name" placeholder="John Doe"/>
            </form-field>

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
                <label for="state">State / Province</label>
                <input type="text" id="state" name="state" required
                       autocomplete="address-level1" placeholder="CA"/>
              </form-field>
            </layout-grid>

            <layout-grid data-layout-min="xs" data-layout-gap="m">
              <form-field>
                <label for="zip">ZIP / Postal code</label>
                <input type="text" id="zip" name="zip" required
                       autocomplete="postal-code" placeholder="94102"/>
              </form-field>

              <form-field>
                <label for="country">Country</label>
                <select id="country" name="country" required autocomplete="country-name">
                  <option value="">Select country</option>
                  <option value="US" selected>United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </form-field>
            </layout-grid>
        </fieldset>

        <!-- Payment Information -->
        <fieldset data-layout="stack" data-layout-gap="m">
          <legend>Payment</legend>
            <form-field>
              <label for="card-number">Card number</label>
              <input type="text" id="card-number" name="card_number" required
                     autocomplete="cc-number" placeholder="1234 5678 9012 3456"
                     inputmode="numeric"/>
            </form-field>

            <layout-grid data-layout-min="xs" data-layout-gap="m">
              <form-field>
                <label for="expiry">Expiration date</label>
                <input type="text" id="expiry" name="expiry" required
                       autocomplete="cc-exp" placeholder="MM / YY"
                       inputmode="numeric"/>
              </form-field>

              <form-field>
                <label for="cvc">CVC</label>
                <input type="text" id="cvc" name="cvc" required
                       autocomplete="cc-csc" placeholder="123"
                       inputmode="numeric" maxlength="4"/>
              </form-field>
            </layout-grid>

            <p>
              <small data-layout="cluster" data-layout-gap="xs" data-layout-align="center">
                <icon-wc name="lock"></icon-wc>
                Your payment information is encrypted and secure.
              </small>
            </p>
        </fieldset>

        <button type="submit">Place order</button>
      </form>
    </layout-card>
  </main>
</body>
```

Fieldset customization:

```css
/* Override VB native fieldset padding and legend size */
fieldset {
  padding: var(--size-l);
}
fieldset legend {
  font-size: var(--font-size-m);
}
/* Security note: muted small print with a green lock */
fieldset small {
  color: var(--color-text-muted);
}
fieldset small icon-wc {
  color: var(--color-success);
}
```

## Split Layout with Order Summary

A two-column layout using `data-layout="sidebar"` with the checkout form in a `<main>` and an order summary `<aside>`. The sidebar layout automatically recognizes these semantic elements for content vs sidebar sizing. The order summary is a description list: each `<dl-item>` pairs a `<dt>` label (item details in `<small>`) with its `<dd>` price, laid out as a `data-layout="cluster"` row. Native `<hr>` elements provide visual dividers.

Complete your purchase by providing shipping and payment information.

Your payment information is encrypted and secure.

## Order summary

Layout is handled entirely by `data-layout` attributes. These element styles cover only the visual details (no classes needed):

Order summary styling:

```css
/* Each dl-item is a cluster row; drop the default dd indent */
aside dd {
  margin: 0;
  white-space: nowrap;
}
/* Item details sit under the name as muted small print */
aside dt small {
  display: block;
  font-weight: normal;
  color: var(--color-text-muted);
}
aside hr {
  margin-block: 0;
}
```

## Multi-Step Checkout

A wizard-style checkout flow with a visual step indicator. Breaks the checkout into Shipping, Payment, and Review steps. Uses `data-layout="cluster"` for the progress indicator. Reduces cognitive load by focusing on one section at a time.

The step indicator uses `nav.steps` from VB core — no custom CSS needed. See the Steps pattern for all variants and customization.

checkout-steps.html:

```html
<body>
  <main data-layout="center" data-layout-max="narrow">
    <layout-card data-padding="l">
      <layout-stack data-layout-gap="l">
        <header data-layout="stack" data-layout-gap="s">
          <h1>Checkout</h1>
          <p>Step 1 of 3: Shipping</p>
        </header>

        <!-- Step Indicator — uses nav.steps from VB core -->
        <nav class="steps" aria-label="Checkout progress">
          <ol>
            <li aria-current="step">Shipping</li>
            <li>Payment</li>
            <li>Review</li>
          </ol>
        </nav>

        <!-- Step 1: Shipping -->
        <form action="/checkout/shipping" method="POST" data-layout="stack" data-layout-gap="l">
          <fieldset data-layout="stack" data-layout-gap="m">
            <legend>Contact information</legend>
              <form-field>
                <label for="email">Email address</label>
                <input type="email" id="email" name="email" required
                       autocomplete="email" placeholder="you@example.com"/>
              </form-field>

              <form-field>
                <label for="phone">Phone number</label>
                <input type="tel" id="phone" name="phone"
                       autocomplete="tel" placeholder="(555) 123-4567"/>
              </form-field>
          </fieldset>

          <fieldset data-layout="stack" data-layout-gap="m">
            <legend>Shipping address</legend>
              <layout-grid data-layout-min="xs" data-layout-gap="m">
                <form-field>
                  <label for="first-name">First name</label>
                  <input type="text" id="first-name" name="first_name" required
                         autocomplete="given-name" placeholder="John"/>
                </form-field>

                <form-field>
                  <label for="last-name">Last name</label>
                  <input type="text" id="last-name" name="last_name" required
                         autocomplete="family-name" placeholder="Doe"/>
                </form-field>
              </layout-grid>

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
                  <label for="state">State</label>
                  <select id="state" name="state" required autocomplete="address-level1">
                    <option value="">Select state</option>
                    <option value="CA" selected>California</option>
                  </select>
                </form-field>
              </layout-grid>

              <layout-grid data-layout-min="xs" data-layout-gap="m">
                <form-field>
                  <label for="zip">ZIP code</label>
                  <input type="text" id="zip" name="zip" required
                         autocomplete="postal-code" placeholder="94102"/>
                </form-field>

                <form-field>
                  <label for="country">Country</label>
                  <select id="country" name="country" required>
                    <option value="US" selected>United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </form-field>
              </layout-grid>
          </fieldset>

          <layout-cluster data-layout-justify="between" data-layout-gap="m">
            <a href="/cart" class="button secondary">Back to cart</a>
            <button type="submit">Continue to payment</button>
          </layout-cluster>
        </form>
      </layout-stack>
    </layout-card>
  </main>
</body>
```

No custom CSS required:

```css
/* No custom CSS needed — nav.steps is included in VB core.
   Numbered circles, connectors, and checkmarks are automatic.
   See the Steps pattern page for all variants and CSS variables. */
```

## Configuration

Key configuration options for checkout forms:

## Usage Notes

- Never store raw credit card numbers on your server
- Use a payment processor (Stripe, Braintree, etc.) with hosted fields or tokenization
- These patterns show the form structure; actual payment handling requires integration with a PCI-compliant payment gateway
- Display security indicators (lock icon, "encrypted" messaging) to build user trust
- Use proper `autocomplete` values: `address-line1` (street), `address-level2` (city), `address-level1` (state), `postal-code`, `country-name`
- Consider integrating address verification services (Google Places, SmartyStreets) for accuracy
- Support international addresses with flexible field requirements
- Add a checkbox "Billing address same as shipping" to reduce form fields
- Show/hide billing address section based on checkbox state
- Pre-populate billing fields when checkbox is unchecked
- Validate card numbers with Luhn algorithm
- Check expiration date is in the future
- Validate ZIP/postal codes based on selected country
- Show inline validation errors using `<output class="error">`
- `<fieldset>` and `<legend>` provide semantic grouping for screen readers
- All inputs have associated labels
- Error messages linked via `aria-describedby`
- Step indicator uses `aria-current="step"` for current step
- Progress is announced with descriptive step text (e.g., "Step 1 of 3: Shipping")

## Related

Step indicator CSS pattern used in multi-step checkout

Sign up forms with multi-step flows

Form field element with validation

Sidebar layout for split designs

Icon component for security indicators
