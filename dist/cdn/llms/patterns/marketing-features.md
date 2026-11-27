# Feature Patterns

Feature section patterns for marketing sites. Icon grids, alternating layouts, card grids, and feature highlights.

- Documentation: https://vanilla-breeze.com/docs/patterns/marketing/features/
- Vanilla Breeze 0.7.4

## Overview

Feature sections highlight product capabilities and benefits. These patterns use `<layout-grid>` for responsive multi-column layouts and `data-layout="split"` for image-and-text rows, with a centered `<hgroup>` for the section intro and no wrapper classes.

## Icon Grid

A responsive grid of features with icons. Uses `<layout-grid>` with `data-layout-min="m"` to create columns that automatically adjust based on available space. The outer `<section>` combines center and gap via `data-layout="center"` with `data-layout-gap`, and `data-padding` adds the fluid section padding. `<hgroup data-align="center">` centres the heading and mutes the subheading.

Icon container styles for the colored icon badges:

Feature grid with icons:

```html
<section data-layout="center" data-layout-max="wide" data-layout-gap="2xl" data-padding>
  <hgroup data-align="center">
    <h2>Everything you need to build faster</h2>
    <p>Our platform provides all the tools and features you need to ship products quickly without compromising on quality.</p>
  </hgroup>
  <layout-grid data-layout-min="m" data-layout-gap="l">
    <article data-layout="stack" data-layout-gap="s">
      <span class="feature-icon">
        <icon-wc name="zap" size="md"></icon-wc>
      </span>
      <h3>Lightning Fast</h3>
      <p>Optimized for speed with minimal overhead. Your pages load instantly, keeping users engaged.</p>
    </article>
    <article data-layout="stack" data-layout-gap="s">
      <span class="feature-icon">
        <icon-wc name="shield" size="md"></icon-wc>
      </span>
      <h3>Secure by Default</h3>
      <p>Built-in security best practices protect your data and your users without extra configuration.</p>
    </article>
    <!-- Additional features... -->
  </layout-grid>
</section>
```

Feature icon container:

```css
.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: var(--color-primary-subtle);
  color: var(--color-interactive);
  border-radius: var(--radius-m);
}
```

## Alternating Rows

Feature rows with image and text that alternate sides. Uses `data-layout="split"` directly on each `<article>` for an even two-column grid that stacks below 48rem, with one CSS rule to put the image first on even rows.

A single rule moves the image first on even rows, only once the split is two columns wide (it stacks below 48rem):

Alternating image/text rows:

```html
<section data-layout="center" data-layout-max="wide" data-layout-gap="3xl" data-padding>
  <article data-layout="split" data-layout-gap="2xl">
    <layout-stack data-layout-gap="m">
      <h2>Intuitive drag-and-drop builder</h2>
      <p>Create beautiful layouts without writing code. Our visual builder lets you design pages quickly with a library of pre-built components.</p>
      <p>
        <a href="/builder/">
          Learn about the builder
          <icon-wc name="arrow-right" size="sm"></icon-wc>
        </a>
      </p>
    </layout-stack>
    <figure>
      <img src="/images/builder.png" alt="Drag and drop builder interface" width="500" height="375" loading="lazy" />
    </figure>
  </article>
  <article data-layout="split" data-layout-gap="2xl">
    <!-- Second row automatically flips via CSS -->
    <!-- Same structure, image appears on left -->
  </article>
</section>
```

Alternating row styles:

```css
@media (width >= 48rem) {
  article[data-layout="split"]:nth-child(even) > figure {
    order: -1;
  }
}
```

## Card Grid

Features displayed in bordered cards with hover effects. Uses `<layout-grid>` with `<layout-card data-variant="outlined">` for base card styling and a small CSS addition for hover states.

Hover effects on `<layout-card>` — the component handles base border, padding, and radius:

Card-based feature grid:

```html
<section data-layout="center" data-layout-max="wide" data-layout-gap="2xl" data-padding>
  <hgroup data-align="center">
    <h2>Built for modern workflows</h2>
    <p>Streamline your development process with features designed to help teams move faster.</p>
  </hgroup>
  <layout-grid data-layout-min="l" data-layout-gap="l">
    <layout-card data-variant="outlined" data-padding="l">
      <layout-stack data-layout-gap="m">
        <span class="feature-icon">
          <icon-wc name="zap" size="sm"></icon-wc>
        </span>
        <h3>Instant Deploys</h3>
        <p>Push to git and your site is live in seconds. Zero-config deployments with automatic rollbacks.</p>
      </layout-stack>
    </layout-card>
    <!-- Additional cards... -->
  </layout-grid>
</section>
```

Feature card styles:

```css
layout-card[data-variant="outlined"] {
  transition: box-shadow var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default);
}

layout-card[data-variant="outlined"]:hover {
  box-shadow: var(--shadow-m);
  border-color: var(--color-border-strong);
}
```

## Feature Highlight

A spotlight section for a single key feature. Uses `data-layout="split"` on an `<article>` with a large image and a description whose benefit bullets use `<ul data-marker="check">`, VB's built-in checkmark list marker.

Single feature spotlight:

```html
<section data-layout="center" data-layout-max="wide" data-padding>
  <article data-layout="split" data-layout-gap="2xl">
    <figure>
      <img src="/images/assistant.png" alt="AI Assistant interface" width="500" height="375" loading="lazy" />
    </figure>
    <layout-stack data-layout-gap="l" data-layout-align="start">
      <layout-badge data-variant="subtle" data-color="primary" data-size="l">
        <icon-wc name="star" size="sm"></icon-wc>
        New Feature
      </layout-badge>
      <h2>Meet your AI-powered assistant</h2>
      <p>Our intelligent assistant helps you work smarter, not harder. It learns your preferences over time and provides personalized suggestions.</p>
      <ul data-marker="check">
        <li>Natural language processing understands complex requests</li>
        <li>Learns from your workflow to provide relevant suggestions</li>
        <!-- Additional bullet points... -->
      </ul>
      <p data-layout="cluster" data-layout-gap="m">
        <a href="/signup/" class="button">Try It Free</a>
        <a href="/demo/" class="button ghost">Watch Demo</a>
      </p>
    </layout-stack>
  </article>
</section>
```

## Usage Notes

- Icon Grid: Best for listing 4–8 capabilities at a glance. Each item is short — a heading and one sentence.
- Alternating Rows: Use when each feature needs a supporting image or illustration. Works well for 2–4 features with deeper descriptions.
- Card Grid: Choose when features are peers and benefit from visual separation. Hover effects signal interactivity — pair with links if cards are clickable.
- Feature Highlight: Use to spotlight a single flagship feature with a benefit checklist and call-to-action. Place after a grid variant for emphasis.
- Combining variants: A common pattern is Icon Grid for an overview, followed by Alternating Rows or a Feature Highlight for deeper dives.
- Semantic markup: Use `data-layout` attributes on semantic elements like `<section>`, `<article>`, and `<hgroup>` instead of nesting layout wrapper elements.

## Related

Responsive grid layout element

Sidebar layout element

Icon element for feature icons

Hero section patterns
