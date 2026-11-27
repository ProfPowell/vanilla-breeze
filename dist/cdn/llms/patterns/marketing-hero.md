# Hero Patterns

Hero section patterns for landing pages and marketing sites. Centered text, split layouts, background images, forms, and video backgrounds.

- Documentation: https://vanilla-breeze.com/docs/patterns/marketing/hero/
- Vanilla Breeze 0.7.4

## Overview

Hero sections are the first thing visitors see on a landing page. These patterns use `<layout-cover>` for vertical centering and `<layout-center>` for horizontal alignment, creating responsive layouts without media queries.

Key features:
- Vertical centering with `layout-cover`
- Configurable minimum height via `data-layout-min`
- Multiple layout variants (centered, split, full-width)
- Background image and video support
- Embedded form integration
- Responsive without media queries

## Centered Text

The simplest hero pattern: centered headline, lead text, and call-to-action buttons. Perfect for product launches and announcements. `section.hero` centers the text and sets a minimum height; adding `.alt` gives it the raised surface background.

Centered hero with CTA buttons:

```html
<section class="hero alt">
  <layout-cover data-layout-min="m" data-layout-padding="xl">
    <layout-center data-layout-max="normal">
      <layout-stack data-layout-gap="l">
        <h1>Ship faster with less code</h1>
        <p class="lead">
          Vanilla Breeze is a lightweight CSS framework built on modern standards.
          Semantic HTML, custom elements, and design tokens. No build step required.
        </p>
        <nav>
          <ul data-layout="cluster" data-layout-justify="center" data-layout-gap="m">
            <li><a href="/get-started/" class="button large">Get Started</a></li>
            <li><a href="/docs/" class="button large secondary">Documentation</a></li>
          </ul>
        </nav>
      </layout-stack>
    </layout-center>
  </layout-cover>
</section>
```

## Split with Image

Text on one side, image on the other. Uses `layout-sidebar` for a flexible two-column layout that stacks on narrow viewports. `data-layout-align="start"` on the stack keeps the badge at its natural width.

`section.hero` centers its text, which suits the single-column variants. Split heroes (this one and the form hero below) read better start-aligned:

Split layout with image:

```html
<section class="hero alt">
  <layout-cover data-layout-min="m" data-layout-padding="xl">
    <layout-center data-layout-max="wide">
      <layout-sidebar data-layout-gap="2xl" data-layout-sidebar-width="wide" data-layout-content-min="m">
        <layout-stack data-layout-gap="l" data-layout-align="start">
          <layout-badge data-color="success">Now Available</layout-badge>
          <h1>Build interfaces that scale</h1>
          <p>
            Start with semantic HTML and enhance with custom elements.
            Our layout primitives handle the complexity so you can focus on content.
          </p>
          <nav>
            <ul data-layout="cluster" data-layout-gap="m">
              <li><a href="/get-started/" class="button">Start Building</a></li>
              <li><a href="/examples/" class="button ghost">View Examples</a></li>
            </ul>
          </nav>
        </layout-stack>
        <figure>
          <img
            src="/images/hero-illustration.png"
            alt="Application interface mockup"
            width="600"
            height="450"
            loading="eager"
          />
        </figure>
      </layout-sidebar>
    </layout-center>
  </layout-cover>
</section>
```

Start-align split heroes:

```css
section.hero layout-sidebar {
  text-align: start;
}
```

## With Background Image

Full-width background image with a dark overlay for text readability. The overlay uses `--color-overlay-strong` from design tokens.

Add these styles to support background images with overlay:

Hero with background image:

```html
<section class="hero hero-with-bg">
  <layout-cover data-layout-min="l" data-layout-padding="xl">
    <layout-center data-layout-max="normal">
      <layout-stack data-layout-gap="l">
        <h1>Experience the difference</h1>
        <p class="lead">
          Immerse yourself in a new way of building for the web.
          Modern standards, timeless simplicity.
        </p>
        <nav>
          <ul data-layout="cluster" data-layout-justify="center" data-layout-gap="m">
            <li><a href="/demo/" class="button large">Watch Demo</a></li>
            <li><a href="/pricing/" class="button large ghost">View Pricing</a></li>
          </ul>
        </nav>
      </layout-stack>
    </layout-center>
  </layout-cover>
</section>
```

Background image styles:

```css
.hero-with-bg {
  background-image: url('/images/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
}

.hero-with-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--color-overlay-strong);
}

.hero-with-bg > * {
  position: relative;
  color: var(--color-white);
}

.hero-with-bg :is(h1, .lead) {
  color: var(--color-white);
}

.hero-with-bg .button.ghost {
  color: var(--color-white);
  border-color: var(--color-white);
}

.hero-with-bg .button.ghost:hover {
  background: oklch(100% 0 0 / 0.1);
}
```

## With Form

Hero with an embedded newsletter signup or registration form. Uses `layout-sidebar` to place content and form side by side, and `<ul data-marker="check">` for the benefit list.

Hero with signup form:

```html
<section class="hero alt">
  <layout-cover data-layout-min="m" data-layout-padding="xl">
    <layout-center data-layout-max="wide">
      <layout-sidebar data-layout-gap="2xl" data-layout-sidebar-width="wide" data-layout-content-min="m">
        <layout-stack data-layout-gap="l">
          <h1>Stay in the loop</h1>
          <p class="lead">
            Get the latest updates on new features, best practices,
            and community highlights delivered to your inbox.
          </p>
          <ul data-marker="check">
            <li>Weekly digest</li>
            <li>No spam</li>
            <li>Unsubscribe anytime</li>
          </ul>
        </layout-stack>
        <layout-card data-variant="outlined">
          <form action="/subscribe" method="POST" data-layout="stack" data-layout-gap="m">
              <h2>Subscribe to our newsletter</h2>
              <form-field>
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required autocomplete="name" placeholder="Your name" />
              </form-field>
              <form-field>
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required autocomplete="email" placeholder="you@example.com" />
              </form-field>
              <button type="submit" class="full-width">Subscribe</button>
              <p>
                <small>By subscribing, you agree to our <a href="/privacy/">Privacy Policy</a>.</small>
              </p>
          </form>
        </layout-card>
      </layout-sidebar>
    </layout-center>
  </layout-cover>
</section>
```

## With Video

Hero with video background or an embedded video player. The video background version uses an overlay for text readability.

Add these styles for the video background effect:

Hero with video background:

```html
<section class="hero hero-video-bg">
  <video autoplay muted loop playsinline poster="/images/video-poster.jpg">
    <source src="/videos/hero-bg.mp4" type="video/mp4" />
  </video>
  <layout-cover data-layout-min="l" data-layout-padding="xl">
    <layout-center data-layout-max="normal">
      <layout-stack data-layout-gap="l">
        <h1>See it in action</h1>
        <p class="lead">
          Watch how teams are building faster with modern CSS.
          No frameworks, no complexity, just clean code.
        </p>
        <nav>
          <ul data-layout="cluster" data-layout-justify="center" data-layout-gap="m">
            <li><a href="/demo/" class="button large">Play Full Video</a></li>
            <li><a href="/get-started/" class="button large ghost">Get Started</a></li>
          </ul>
        </nav>
      </layout-stack>
    </layout-center>
  </layout-cover>
</section>
```

Video background styles:

```css
.hero-video-bg {
  position: relative;
  overflow: hidden;
}

.hero-video-bg video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-video-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--color-overlay-strong);
  z-index: 1;
}

.hero-video-bg > *:not(video) {
  position: relative;
  z-index: 2;
  color: var(--color-white);
}

.hero-video-bg :is(h1, .lead) {
  color: var(--color-white);
}

.hero-video-bg .button.ghost {
  color: var(--color-white);
  border-color: var(--color-white);
}

.hero-video-bg .button.ghost:hover {
  background: oklch(100% 0 0 / 0.1);
}
```

## Layout Configuration

Common data attributes for hero sections:

## Usage Notes

- Height: Use `vh` units for viewport-relative heights. `70vh` to `80vh` works well for primary heroes.
- Content width: Use `normal` for centered text to maintain comfortable line lengths.
- Buttons: Use `data-layout="cluster"` with `data-layout-justify="center"` for centered layouts, or default alignment for split layouts.
- Images: Use `loading="eager"` for hero images since they're above the fold.
- Overlays: Use `--color-overlay-strong` for dark overlays that ensure text readability.
- Videos: Always include `poster` attribute and use `muted` with `autoplay` for background videos.
- Accessibility: Ensure sufficient color contrast with overlays and use semantic headings.

## Related

Cover layout element documentation

Center layout element documentation

Sidebar layout element documentation

CTA section patterns
