# Call to Action Patterns

Call to action section patterns for landing pages and marketing sites. Centered banners, split layouts, and background image CTAs.

- Documentation: https://vanilla-breeze.com/docs/patterns/marketing/cta/
- Vanilla Breeze 0.7.4

## Overview

Call to Action (CTA) sections are critical conversion points on marketing pages. They typically appear after feature sections or at the bottom of landing pages, prompting users to take the next step. These patterns use `section.hero` for vertical centering and centered text, `data-padding` for fluid block padding, and `<layout-center>` for horizontal alignment.

Key features:
- Vertical centering with `section.hero`
- Multiple layout variants (centered, split, full-width)
- Background image support with overlays
- Inline form integration with `form.inline`
- Button groups with `data-layout="cluster"`
- Responsive without media queries

## Centered CTA

The most common CTA pattern: centered headline, supporting text, and action buttons. Perfect for page endings and conversion sections. `section.hero` centers the content, `.alt` adds the raised surface, and `data-padding` swaps the hero's large padding for the fluid section padding.

Centered CTA with button group:

```html
<section class="hero alt" data-padding>
  <layout-center data-layout-max="normal">
    <layout-stack data-layout-gap="l">
      <h2>Ready to get started?</h2>
      <p class="lead">
        Join thousands of developers building better interfaces with Vanilla Breeze.
        Start your free trial today, no credit card required.
      </p>
      <nav>
        <ul data-layout="cluster" data-layout-justify="center" data-layout-gap="m">
          <li><a href="/signup/" class="button large">Start Free Trial</a></li>
          <li><a href="/contact/" class="button large secondary">Talk to Sales</a></li>
        </ul>
      </nav>
    </layout-stack>
  </layout-center>
</section>
```

## Split CTA with Form

Text on one side, form or image on the other. Uses `<layout-sidebar>` for a flexible two-column layout that stacks on narrow viewports, inside a plain `section.alt` so the text stays start-aligned. Great for newsletter signups and lead capture.

Split CTA with inline form:

```html
<section class="alt" data-padding>
  <layout-center data-layout-max="wide">
    <layout-sidebar data-layout-gap="2xl" data-layout-sidebar-width="wide" data-layout-content-min="m">
      <layout-stack data-layout-gap="l">
        <h2>Get notified when we launch</h2>
        <p class="lead">
          Be the first to know when new features are released.
          Sign up for early access and exclusive updates.
        </p>
        <form class="inline" action="/subscribe" method="POST">
          <form-field>
            <input type="email" name="email" required autocomplete="email" placeholder="Enter your email" aria-label="Email address" />
          </form-field>
          <button type="submit">Notify Me</button>
        </form>
        <p>
          <small>We respect your privacy. Unsubscribe at any time.</small>
        </p>
      </layout-stack>
      <img
        src="/images/cta-illustration.png"
        alt="Product illustration"
        width="500"
        height="375"
        loading="lazy"
      />
    </layout-sidebar>
  </layout-center>
</section>
```

## With Background Image

Full-width background image with a dark overlay for text readability. The overlay uses `--color-overlay-strong` from design tokens. Great for creating visual impact.

Add these styles to support background images with overlay:

For buttons over dark backgrounds, add these ghost button overrides:

CTA with background image:

```html
<section class="hero cta-with-bg" data-padding>
  <layout-center data-layout-max="normal">
    <layout-stack data-layout-gap="l">
      <h2>Transform your workflow today</h2>
      <p class="lead">
        Stop struggling with complex toolchains. Vanilla Breeze gives you
        everything you need to build beautiful, responsive interfaces.
      </p>
      <nav>
        <ul data-layout="cluster" data-layout-justify="center" data-layout-gap="m">
          <li><a href="/signup/" class="button large">Get Started Free</a></li>
          <li><a href="/pricing/" class="button large ghost">See Pricing</a></li>
        </ul>
      </nav>
    </layout-stack>
  </layout-center>
</section>
```

Background image styles:

```css
.cta-with-bg {
  background-image: url('/images/cta-bg.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
}

.cta-with-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--color-overlay-strong);
}

.cta-with-bg > * {
  position: relative;
  color: var(--color-white);
}

.cta-with-bg :is(h2, .lead) {
  color: var(--color-white);
}
```

Ghost button styles for dark backgrounds:

```css
.cta-with-bg .button.ghost {
  color: var(--color-white);
  border-color: var(--color-white);
}

.cta-with-bg .button.ghost:hover {
  background: oklch(100% 0 0 / 0.1);
}
```

## Layout Configuration

Common data attributes for CTA sections:

## Usage Notes

- Placement: CTAs work best after feature sections, testimonials, or at the bottom of landing pages. Avoid placing multiple CTAs too close together.
- Button text: Use action-oriented language that clearly states the benefit (e.g., "Start Free Trial" instead of "Submit").
- Primary vs secondary: Use one primary button for the main action and a secondary/ghost button for alternative actions.
- Contrast: Ensure sufficient color contrast between text and background, especially with background images. Use `--color-overlay-strong` for dark overlays.
- Height: `section.hero` has a `50vh` minimum, which keeps a CTA shorter than a full-height hero section.
- Forms: Keep inline forms simple with one or two fields. Use full forms in split layouts for more complex signups.
- Mobile: Split layouts stack automatically on narrow viewports thanks to `<layout-sidebar>`.

## Related

Above-the-fold hero sections

Cover layout element documentation

Center layout element documentation

Button component documentation
