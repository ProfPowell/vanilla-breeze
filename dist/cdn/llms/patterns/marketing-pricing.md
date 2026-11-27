# Pricing Patterns

Pricing section patterns for SaaS and product landing pages. Tiered cards, feature comparison tables, and billing toggle options.

- Documentation: https://vanilla-breeze.com/docs/patterns/marketing/pricing/
- Vanilla Breeze 0.7.4

## Overview

Pricing sections help users understand and compare your offerings. These patterns use `data-layout="grid"` for responsive card layouts and semantic table markup for feature comparisons, creating accessible and mobile-friendly pricing displays.

Key features:
- Responsive card grids with `data-layout="grid"`
- Highlighted recommended tier
- Feature comparison tables with row-group headings and a `data-table-scroll` wrapper
- Monthly/yearly billing toggle: a native `input[data-switch]` plus the `:has()` selector
- Accessible markup with proper semantics
- No JavaScript required

## Pricing Cards

Three-tier pricing cards in a responsive grid. Each plan is a `<layout-card>` with an `<hgroup>` for its name and price and a `ul[data-marker="check"]` for its features. The middle tier carries `data-featured` and a `<layout-badge data-shape="ribbon">`.

The card, badge and list come from VB. Only the featured lift and the price typography are bespoke:

Three-tier pricing cards:

```html
<section data-layout="center" data-layout-max="wide" data-layout-gap="2xl">
  <hgroup data-layout="stack" data-layout-gap="s" data-layout-align="center">
    <h2>Simple, transparent pricing</h2>
    <p>Choose the plan that's right for you</p>
  </hgroup>
  <layout-grid data-layout-min="l" data-layout-gap="l">
    <layout-card data-variant="outlined" data-padding="l" data-layout="stack" data-layout-gap="l">
      <hgroup data-layout="stack" data-layout-gap="xs">
        <h3 class="plan-name">Basic</h3>
        <p><span class="price">$9</span> <span class="price-period">/month</span></p>
        <p><small>Perfect for individuals and small projects</small></p>
      </hgroup>
      <ul data-marker="check">
        <li>Up to 3 projects</li>
        <li>5 GB storage</li>
        <li>Basic analytics</li>
        <li>Email support</li>
      </ul>
      <a href="#" class="button secondary full-width">Get Started</a>
    </layout-card>
    <layout-card data-variant="outlined" data-padding="l" data-featured data-layout="stack" data-layout-gap="l">
      <layout-badge data-shape="ribbon" data-color="primary" data-size="l">Most Popular</layout-badge>
      <hgroup data-layout="stack" data-layout-gap="xs">
        <h3 class="plan-name">Pro</h3>
        <p><span class="price">$29</span> <span class="price-period">/month</span></p>
        <p><small>Best for growing teams and businesses</small></p>
      </hgroup>
      <ul data-marker="check">
        <li>Unlimited projects</li>
        <li>50 GB storage</li>
        <li>Advanced analytics</li>
        <li>Priority support</li>
        <li>Custom integrations</li>
        <li>Team collaboration</li>
      </ul>
      <a href="#" class="button full-width">Get Started</a>
    </layout-card>
    <layout-card data-variant="outlined" data-padding="l" data-layout="stack" data-layout-gap="l">
      <hgroup data-layout="stack" data-layout-gap="xs">
        <h3 class="plan-name">Enterprise</h3>
        <p><span class="price">$99</span> <span class="price-period">/month</span></p>
        <p><small>For large organizations with custom needs</small></p>
      </hgroup>
      <ul data-marker="check">
        <li>Everything in Pro</li>
        <li>Unlimited storage</li>
        <li>Custom analytics</li>
        <li>24/7 phone support</li>
        <li>Dedicated account manager</li>
        <li>SLA guarantee</li>
      </ul>
      <a href="#" class="button secondary full-width">Contact Sales</a>
    </layout-card>
  </layout-grid>
</section>
```

Pricing card styles:

```css
layout-card[data-featured] {
  position: relative;
  border-color: var(--color-interactive);
  box-shadow: var(--shadow-m);
  scale: 1.05;
}

layout-card[data-featured] > layout-badge {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 50%;
  translate: -50% -50%;
}

layout-card > hgroup {
  text-align: center;
}

.plan-name {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
}

.price {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.price-period {
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
}
```

## Comparison Table

A feature comparison table with plan columns and feature rows. Uses semantic `<table>` markup with proper `scope` attributes for accessibility: each category is its own `<tbody>` headed by a `th scope="rowgroup"`, and each feature name is a `th scope="row"`. Included and missing features use the `.status` marker with visually hidden text, so the table reads correctly without the glyphs. The `data-table-scroll` wrapper lets the table scroll sideways on narrow screens; add `data-table-scroll="block"` and `data-sticky="header"` to pin the plan row while scrolling a long table.

VB styles the table itself. These rules centre the plan columns and set the plan-header typography; on a real site, scope them under your pricing section:

Feature comparison table:

```html
<section data-table-scroll tabindex="0" aria-labelledby="compare-plans">
  <table>
    <thead>
      <tr>
        <th scope="col">Features</th>
        <th scope="col">
          <span class="plan-header">
            <span class="plan-name">Basic</span>
            <span class="plan-price">$9<span class="plan-period">/mo</span></span>
          </span>
        </th>
        <th scope="col" data-featured>
          <span class="plan-header">
            <span class="plan-name">Pro</span>
            <span class="plan-price">$29<span class="plan-period">/mo</span></span>
          </span>
        </th>
        <th scope="col">
          <span class="plan-header">
            <span class="plan-name">Enterprise</span>
            <span class="plan-price">$99<span class="plan-period">/mo</span></span>
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="rowgroup" colspan="4">Usage</th>
      </tr>
      <tr>
        <th scope="row">Projects</th>
        <td>3</td>
        <td>Unlimited</td>
        <td>Unlimited</td>
      </tr>
      <tr>
        <th scope="row">Storage</th>
        <td>5 GB</td>
        <td>50 GB</td>
        <td>Unlimited</td>
      </tr>
    </tbody>
    <tbody>
      <tr>
        <th scope="rowgroup" colspan="4">Features</th>
      </tr>
      <tr>
        <th scope="row">Custom integrations</th>
        <td><span class="status" data-status="inactive"><span class="visually-hidden">Not included</span></span></td>
        <td><span class="status" data-status="check"><span class="visually-hidden">Included</span></span></td>
        <td><span class="status" data-status="check"><span class="visually-hidden">Included</span></span></td>
      </tr>
      <tr>
        <th scope="row">API access</th>
        <td><span class="status" data-status="inactive"><span class="visually-hidden">Not included</span></span></td>
        <td><span class="status" data-status="check"><span class="visually-hidden">Included</span></span></td>
        <td><span class="status" data-status="check"><span class="visually-hidden">Included</span></span></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td></td>
        <td><a href="#" class="button secondary">Get Started</a></td>
        <td><a href="#" class="button">Get Started</a></td>
        <td><a href="#" class="button secondary">Contact Sales</a></td>
      </tr>
    </tfoot>
  </table>
</section>
```

Pricing table styles:

```css
td {
  text-align: center;
  vertical-align: middle;
}

thead th:not(:first-child) {
  text-align: center;
  vertical-align: bottom;
}

td > .status {
  font-size: var(--font-size-l);
}

th[scope="rowgroup"] {
  background: var(--color-surface-raised);
}

th[scope="row"] {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.plan-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-xs);
}

.plan-name {
  font-size: var(--font-size-l);
}

.plan-price {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.plan-period {
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-normal);
}

th[data-featured] .plan-header {
  color: var(--color-interactive);
}
```

## With Billing Toggle

Pricing cards with a monthly/yearly billing toggle. The switch is a native checkbox with `data-switch`, labelled "Yearly". The CSS `:has()` selector swaps the prices and highlights the active billing period, so no JavaScript is needed.

Add these styles for the billing toggle, alongside the card styles above. VB draws the switch; the `:has()` rules handle the label state and the price swap:

Pricing with monthly/yearly toggle:

```html
<section data-layout="center" data-layout-max="wide" data-layout-gap="2xl">
  <header data-layout="stack" data-layout-gap="m" data-layout-align="center">
    <h2>Simple, transparent pricing</h2>
    <p>Choose the plan that's right for you</p>
    <p class="pricing-toggle">
      <span class="toggle-label" aria-hidden="true">Monthly</span>
      <input type="checkbox" role="switch" data-switch id="billing-yearly"/>
      <label class="toggle-label" for="billing-yearly">Yearly</label>
      <layout-badge data-color="success" data-variant="subtle">Save 20%</layout-badge>
    </p>
  </header>
  <layout-grid data-layout-min="l" data-layout-gap="l">
    <layout-card data-variant="outlined" data-padding="l" data-layout="stack" data-layout-gap="l">
      <hgroup data-layout="stack" data-layout-gap="xs">
        <h3 class="plan-name">Basic</h3>
        <p><span class="price price-monthly">$9</span><span class="price price-yearly">$7</span> <span class="price-period">/month</span></p>
        <p><small>Perfect for individuals and small projects</small></p>
      </hgroup>
      <!-- features... -->
      <a href="#" class="button secondary full-width">Get Started</a>
    </layout-card>
    <!-- more cards... -->
  </layout-grid>
</section>
```

Billing toggle styles:

```css
/* Billing toggle: the switch is a native checkbox (input[data-switch]) */
.pricing-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--size-m);
}

.toggle-label {
  font-weight: var(--font-weight-medium);
  margin-block: 0;
  color: var(--color-text-muted);
  transition: color 0.2s ease;
}

/* The active side: Monthly while unchecked, Yearly while checked */
.toggle-label:has(+ input:not(:checked)),
input:checked + .toggle-label {
  color: var(--color-text);
}

/* Price visibility follows the switch, no JavaScript */
section:has(.pricing-toggle input:checked) .price-monthly,
section:has(.pricing-toggle input:not(:checked)) .price-yearly {
  display: none;
}
```

## Layout Configuration

Common data attributes for pricing sections:

## Usage Notes

- Tier naming: Use clear, hierarchical names (Basic, Pro, Enterprise) that indicate value progression.
- Feature ordering: List features in order of importance. Lead with the most compelling features.
- Highlight recommended: Always highlight one tier as recommended. This guides user decisions and improves conversion.
- CTAs: Use primary buttons for the recommended plan and secondary buttons for others. Use "Contact Sales" for enterprise tiers.
- Pricing transparency: Show all costs upfront. If there are per-user or usage-based costs, make them clear.
- Yearly savings: When offering discounts for annual billing, display the savings prominently (e.g., "Save 20%").
- Comparison tables: Use tables for detailed feature comparisons. Cards work better for quick overviews.
- Mobile considerations: Cards stack naturally on mobile. Tables may need horizontal scrolling.
- Accessibility: Use proper table semantics with `scope` attributes. Ensure toggle has proper labeling.

## Related

Grid layout element documentation

Stack layout element documentation

CTA section patterns

Feature grid patterns
