# Testimonial Patterns

Testimonial section patterns for landing pages and marketing sites. Quote cards, avatar grids, and carousel layouts.

- Documentation: https://vanilla-breeze.com/docs/patterns/marketing/testimonials/
- Vanilla Breeze 0.7.4

## Overview

Testimonials are essential for building credibility on marketing pages. These patterns put each quote in a `<figure>`: the words go in a `<blockquote>` and the attribution in a `<figcaption>`, outside the quotation as the HTML spec recommends. Cards are `<layout-card>` elements in a `<layout-grid>`; no custom CSS is needed.

Key features:
- Semantic HTML with `figure`, `blockquote` and `figcaption`
- Responsive grids of `layout-card` with `layout-grid`
- Avatar integration with `user-avatar`
- Read-only star ratings with `star-rating`
- `carousel-wc` component for featured testimonials
- Accessible by default

## Simple Quotes

The most straightforward testimonial pattern: quote cards with author attribution. Uses `<layout-grid>` for a responsive layout that adjusts columns to the available space. The header is an `<hgroup>` centred with `data-layout="center"` and `data-layout-text`.

Simple testimonial quotes:

```html
<section data-layout="center" data-layout-max="wide" data-layout-gap="2xl">
  <hgroup data-layout="center" data-layout-max="narrow" data-layout-text data-layout-gap="s">
    <h2>What our customers say</h2>
    <p class="lead">Hear from teams who have transformed their development workflow with our platform.</p>
  </hgroup>
  <layout-grid data-layout-min="l" data-layout-gap="l">
    <layout-card data-variant="outlined" data-padding="l">
      <figure data-layout="stack" data-layout-gap="m">
        <blockquote>
          <p>"This framework has completely changed how we build interfaces. We shipped our redesign in half the time."</p>
        </blockquote>
        <figcaption>
          <strong>Sarah Chen</strong><br/><small>Engineering Lead, TechCorp</small>
        </figcaption>
      </figure>
    </layout-card>
    <layout-card data-variant="outlined" data-padding="l">
      <figure data-layout="stack" data-layout-gap="m">
        <blockquote>
          <p>"The semantic HTML approach means our sites are accessible by default. It's refreshing to work with something so well thought out."</p>
        </blockquote>
        <figcaption>
          <strong>Marcus Johnson</strong><br/><small>Senior Developer, StartupXYZ</small>
        </figcaption>
      </figure>
    </layout-card>
    <layout-card data-variant="outlined" data-padding="l">
      <figure data-layout="stack" data-layout-gap="m">
        <blockquote>
          <p>"No build step, no complex configuration. We went from idea to production in record time."</p>
        </blockquote>
        <figcaption>
          <strong>Elena Rodriguez</strong><br/><small>CTO, WebAgency</small>
        </figcaption>
      </figure>
    </layout-card>
  </layout-grid>
</section>
```

## With Avatars and Ratings

Enhanced testimonials featuring author avatars and star ratings. The `user-avatar` component displays profile images, and `<star-rating value="5" readonly>` renders the rating with an accessible "Rating: 5 out of 5" summary.

Testimonials with avatars and star ratings:

```html
<layout-grid data-layout-min="l" data-layout-gap="l">
  <layout-card data-variant="outlined" data-padding="l">
    <figure data-layout="stack" data-layout-gap="m">
      <star-rating value="5" readonly label="Rating"></star-rating>
      <blockquote>
        <p>"The layout primitives are incredibly powerful. We've built complex dashboards with minimal custom CSS."</p>
      </blockquote>
      <figcaption data-layout="cluster" data-layout-gap="s" data-layout-align="center">
        <user-avatar data-size="lg">
          <img src="user-photo.jpg" alt="" />
        </user-avatar>
        <span><strong>Alex Thompson</strong><br/><small>Lead Developer, DataFlow</small></span>
      </figcaption>
    </figure>
  </layout-card>
  <!-- more cards... -->
</layout-grid>
```

## Carousel

A carousel of featured testimonials using the `carousel-wc` component. A length in `item-width` sizes each slide, and `p.lead` gives the quotes more weight. The component provides real prev/next buttons, clickable dot indicators, keyboard navigation, and full ARIA semantics.

Testimonial carousel:

```html
<section data-layout="center" data-layout-max="wide" data-layout-gap="l">
  <hgroup data-layout="center" data-layout-max="narrow" data-layout-text data-layout-gap="s">
    <h2>Loved by teams everywhere</h2>
    <p class="lead">See what developers and designers are saying about their experience.</p>
  </hgroup>
  <carousel-wc item-width="min(500px, 85vw)" gap="l">
    <layout-card data-variant="outlined" data-padding="l">
      <figure data-layout="stack" data-layout-gap="m">
        <blockquote>
          <p class="lead">"The shift to semantic HTML has made our codebase so much cleaner. Junior developers can understand and contribute immediately. It's been a game-changer for our team velocity."</p>
        </blockquote>
        <figcaption data-layout="cluster" data-layout-gap="s" data-layout-align="center">
          <user-avatar data-size="xl">
            <img src="user-photo.jpg" alt="" />
          </user-avatar>
          <span><strong>David Park</strong><br/><small>Engineering Manager, TechVenture</small></span>
        </figcaption>
      </figure>
    </layout-card>
    <!-- more slides... -->
  </carousel-wc>
</section>
```

## Layout Configuration

Common data attributes for testimonial sections:

## Usage Notes

- Semantic markup: Use `<blockquote>` for the quote and keep the attribution in the figure's `<figcaption>`, outside the quotation. `<cite>` names a work, not a person.
- Avatar alt text: Avatar images should have empty `alt=""` since the author name is provided in text. The image is decorative.
- Quote marks: Include quotation marks in the text content rather than using CSS `::before` pseudo-elements. This ensures quotes are read by screen readers.
- Star ratings: `<star-rating readonly>` announces its value as text ("Rating: 5 out of 5"); set `label` to change the prefix.
- Carousel UX: The `carousel-wc` component provides keyboard navigation (arrow keys, Home/End), prev/next buttons, clickable dot indicators, and full ARIA semantics. It also respects `prefers-reduced-motion`.
- Performance: Use `loading="lazy"` on avatar images that are below the fold. For above-the-fold testimonials, use `loading="eager"`.
- Authenticity: Real testimonials with full names, titles, and company names are more credible. Consider linking to the author's profile or the company website.

## Related

Grid layout element documentation

Avatar component documentation

Rating component documentation

Scroll carousel component documentation

CTA section patterns
