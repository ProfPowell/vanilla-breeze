# Footer Patterns

Footer navigation patterns with links, social icons, multi-column layouts, and newsletter signup forms.

- Documentation: https://vanilla-breeze.com/docs/patterns/navigation/footer/
- Vanilla Breeze 0.7.4

## Overview

Footers provide secondary navigation, legal links, and brand information at the bottom of pages. These patterns use semantic `<footer>` and `<nav>` elements with `aria-label` for accessibility.

Key features:
- Semantic HTML with proper ARIA attributes for screen readers
- Responsive layouts using `data-layout` attributes (`grid`, `sidebar`, `cluster`, `stack`)
- Social media icons with accessible labels, wrapped in `<nav aria-label="Social media">`
- Newsletter signup with `form-field` component
- `footer.site` provides base styling (background, border, link colors, compact nav padding) with zero custom CSS

## Simple Footer

A compact footer with horizontal links, logo, and social icons. Uses `<layout-cluster data-layout-justify="between">` for flexible horizontal spacing that wraps gracefully on smaller screens.

Simple footer with horizontal links:

```html
<footer class="site" data-layout="stack" data-layout-gap="m">
  <layout-cluster data-layout-justify="between">
    <layout-cluster data-layout-gap="m">
      <a href="/"><brand-mark>Acme Co</brand-mark></a>
      <nav class="horizontal" aria-label="Footer navigation">
        <ul>
          <li><a href="/about/">About</a></li>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/careers/">Careers</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </nav>
    </layout-cluster>
    <nav class="horizontal" aria-label="Social media">
      <ul>
        <li><a href="https://github.com" aria-label="GitHub">
          <icon-wc name="github"></icon-wc>
        </a></li>
        <li><a href="https://twitter.com" aria-label="Twitter">
          <icon-wc name="twitter"></icon-wc>
        </a></li>
        <li><a href="https://linkedin.com" aria-label="LinkedIn">
          <icon-wc name="linkedin"></icon-wc>
        </a></li>
      </ul>
    </nav>
  </layout-cluster>
  <small>&copy; 2024 Acme Co. All rights reserved.</small>
</footer>
```

## Multi-Column Footer

A comprehensive footer with organized link categories in columns. Uses `<layout-grid data-layout-min="s">` to create responsive columns that automatically adjust based on available space.

## Company

- About
- Careers
- Press
- News

## Product

- Features
- Pricing
- Integrations
- Changelog

## Resources

- Documentation
- Guides
- Blog
- Support

## Legal

- Privacy
- Terms
- Cookies
- Licenses

Acme Co &copy; 2024 Acme Co. All rights reserved.
- 
- 
- 
- 

Additional styles for the multi-column layout: uppercase, muted column headings and smaller links. The bottom row needs no CSS of its own: a native `<hr>` draws the separator.

Multi-column footer styles:

```css
/* Column headings — uppercase, muted */
footer.site nav h2 {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0;
}

/* Smaller nav links in column layout */
footer.site nav a {
  font-size: var(--font-size-s);
}
```

## Footer with Newsletter

A footer that includes a newsletter signup form alongside navigation links. Uses `<layout-sidebar>` to create a split layout where the newsletter section takes priority, with link columns on the side. The form is `form.inline`, so the field and button sit on one row without a wrapper.

## Subscribe to our newsletter

Get the latest updates, tips, and news delivered to your inbox.

By subscribing, you agree to our Privacy Policy.
- Features
- Pricing
- Integrations
- Documentation
- Guides
- Blog
- About
- Careers
- Contact

Acme Co &copy; 2024 Acme Co. All rights reserved.
- 
- 
- 

Additional styles specific to the newsletter section:

Newsletter section styles:

```css
/* Newsletter heading and description */
footer.site section h2 {
  font-size: var(--font-size-l);
  margin: 0;
}

footer.site section p {
  color: var(--color-text-muted);
  font-size: var(--font-size-s);
}

/* Column headings for newsletter footer */
footer.site nav h3 {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0;
}
```

## Base Footer Styles

The `footer.site` class from VB handles most base styling automatically — background, border, padding, muted link colors with hover transitions, and compact nav link padding. No custom CSS is needed for the simple footer variant.

Base footer styles:

```css
/* VB provides footer.site base styles automatically:
   - background, border, padding, margin-block-start
   - muted link color, no underline, hover brightens
   - compact nav link padding (8px vertical, 0 horizontal)
   - tight gap between horizontal nav items

   No custom CSS needed for the simple footer variant. */
```

## Usage Notes

- Accessibility: Use `aria-label` on each `<nav>` element to distinguish between different navigation sections (e.g., "Company links", "Legal links")
- Social icons: Always include `aria-label` on social media links since they only contain icons. Wrap social links in `<nav aria-label="Social media">` for proper semantics and to suppress external-link indicators
- Newsletter forms: Use `class="visually-hidden"` on labels for screen reader accessibility when using placeholder text
- Copyright: Use `<small>` for copyright text — VB styles it at the correct size automatically
- Link organization: Group related links under descriptive headings for better navigation
- Layout attributes: Put `data-layout` directly on semantic elements. Where no semantic element fits, use the matching `layout-*` element (`layout-grid`, `layout-cluster`) rather than a `<div>`
- Responsive behavior: Test footer layouts at various viewport widths to ensure graceful wrapping

## Related

Header navigation patterns

Icon web component documentation

Responsive grid layout documentation

Form field component for inputs
