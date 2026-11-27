# Error Pages

Error page patterns for 404, 500, and maintenance states. Guide users with clear messaging and helpful actions.

- Documentation: https://vanilla-breeze.com/docs/patterns/feedback/error-pages/
- Vanilla Breeze 0.7.4

## Overview

Error pages appear when something goes wrong or content is unavailable. They should clearly communicate the issue, reassure users, and provide actionable next steps to get them back on track.

Key features:
- Full-page centered layout using `data-layout="cover"`
- Large error codes or icons for immediate recognition
- Clear, concise messaging explaining the situation
- Primary action button to help users recover
- Secondary links for alternative navigation options

## 404 - Page Not Found

A 404 page appears when users navigate to a URL that doesn't exist. Display a prominent error code, explain the issue, and provide navigation options.

The oversized status number is this recipe's own look, so it keeps a class. Everything else is layout attributes: `data-layout-intrinsic` centers each child and `data-layout-text` centers the text.

error-404.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <main data-layout="center" data-layout-max="narrow" data-layout-principal
        data-layout-intrinsic data-layout-text data-layout-gap="xl">
    <span class="error-code">404</span>
    <hgroup class="spaced" data-align="center">
      <h1>Page not found</h1>
      <p>Sorry, we couldn't find the page you're looking for.
         It may have been moved or deleted.</p>
    </hgroup>
    <footer data-layout="stack" data-layout-gap="m" data-layout-align="center">
      <a href="/" class="button">
        <icon-wc name="home"></icon-wc>
        Go back home
      </a>
      <nav class="horizontal" aria-label="Additional navigation">
        <ul>
          <li><a href="/search">Search</a></li>
          <li><a href="/sitemap">Sitemap</a></li>
          <li><a href="/contact">Contact support</a></li>
        </ul>
      </nav>
    </footer>
  </main>
</body>
```

Error code CSS:

```css
.error-code {
  font-size: clamp(4rem, 15vw, 8rem);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  line-height: 1;
  letter-spacing: -0.02em;
}
```

## 500 - Server Error

A 500 page appears during server-side errors. Use a warning icon, acknowledge the problem, and offer options to retry or navigate elsewhere.

The status line is an eyebrow (`hgroup.eyebrow`) above the heading. The icon is tinted by one element rule: `main > icon-wc { color: var(--color-error); }`.

error-500.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <main data-layout="center" data-layout-max="narrow" data-layout-principal
        data-layout-intrinsic data-layout-text data-layout-gap="xl">
    <icon-wc name="alert-triangle" size="2xl"></icon-wc>
    <hgroup class="eyebrow spaced" data-align="center">
      <p>Error 500</p>
      <h1>Something went wrong</h1>
      <p>We're experiencing technical difficulties. Our team has been
         notified and is working on a fix. Please try again later.</p>
    </hgroup>
    <layout-cluster data-layout-gap="m" data-layout-justify="center">
      <button type="button" data-action="reload">
        <icon-wc name="refresh-cw"></icon-wc>
        Try again
      </button>
      <a href="/" class="button secondary">
        <icon-wc name="home"></icon-wc>
        Go back home
      </a>
    </layout-cluster>
    <nav class="horizontal" aria-label="Additional navigation">
      <ul>
        <li><a href="/status">Check system status</a></li>
        <li><a href="/contact">Contact support</a></li>
      </ul>
    </nav>
  </main>
  <script>
    document.querySelector('[data-action="reload"]')
      .addEventListener('click', () => location.reload());
  </script>
</body>
```

## Maintenance Mode

A maintenance page displays during scheduled downtime. Communicate the situation, provide an estimated return time, and offer ways to stay updated.

No classes beyond VB's own: `<layout-badge>` carries the return time, `form.inline` puts the email field beside its button, and `nav.horizontal` lays out the social links. Inside a `data-layout-intrinsic` center, group children with `<layout-stack>` rather than `<section>`: a section is an inline-size container, so as a content-sized flex item it collapses to zero width.

error-maintenance.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <main data-layout="center" data-layout-max="narrow" data-layout-principal
        data-layout-intrinsic data-layout-text data-layout-gap="xl">
    <icon-wc name="wrench" size="2xl"></icon-wc>
    <hgroup class="spaced" data-align="center">
      <h1>Under maintenance</h1>
      <p>We're currently performing scheduled maintenance to improve
         our services. We'll be back shortly.</p>
    </hgroup>
    <layout-badge data-color="info" data-size="l">
      <icon-wc name="clock" size="sm"></icon-wc>
      Estimated return: <time datetime="14:00-05:00">2:00 PM EST</time>
    </layout-badge>
    <layout-stack data-layout-gap="s" data-layout-align="center">
      <p><small>Get notified when we're back online:</small></p>
      <form class="inline" action="/notify" method="POST">
        <form-field>
          <label for="notify-email" class="visually-hidden">Email address</label>
          <input type="email" id="notify-email" name="email"
                 placeholder="Enter your email" required autocomplete="email"/>
        </form-field>
        <button type="submit">Notify me</button>
      </form>
    </layout-stack>
    <layout-stack data-layout-gap="s" data-layout-align="center">
      <p><small>Follow us for updates:</small></p>
      <nav class="horizontal" aria-label="Social media">
        <ul>
          <li><a href="https://twitter.com" aria-label="Twitter">
            <icon-wc name="twitter"></icon-wc>
          </a></li>
          <li><a href="https://facebook.com" aria-label="Facebook">
            <icon-wc name="facebook"></icon-wc>
          </a></li>
          <li><a href="/status" aria-label="Status page">
            <icon-wc name="activity"></icon-wc>
          </a></li>
        </ul>
      </nav>
    </layout-stack>
  </main>
</body>
```

## Configuration

Error pages are built from layout primitives. Here are the key components:

## Accessibility

- `<main>` landmark: Each error page wraps content in a `<main>` element, giving screen readers a clear landmark for the primary content.
- Single `<h1>`: Each page uses exactly one `<h1>` describing the error, maintaining proper heading hierarchy.
- Decorative icons: All `<icon-wc>` elements render with `aria-hidden="true"` by default, keeping them out of the accessibility tree.
- Navigation landmark: Secondary links are wrapped in `<nav aria-label="Additional navigation">` so screen readers can identify them as a navigation region.
- No JavaScript required: All error pages are fully server-rendered. The 500 page's retry button uses progressive enhancement via an event listener rather than an inline handler.

## Icon Options

Choose icons that clearly indicate the error type. Common icons from the Lucide set:

## Usage Notes

- HTTP status codes: Set the correct HTTP status code (404, 500, 503) in your server response, not just display it visually
- Error tracking: Log errors server-side for debugging while showing user-friendly messages to visitors
- Keep it simple: Avoid technical jargon; explain the issue in plain language
- Provide options: Always give users at least one action to recover (go home, retry, search)
- Brand consistency: Match your site's design to maintain trust during error states
- Accessibility: Ensure error pages work without JavaScript and are screen reader friendly
- SEO considerations: 404 pages should not be indexed; use proper meta robots tags
- Maintenance ETA: If possible, provide estimated return times to set user expectations

## Related

When there's no content to display

Loading placeholders for content

Center content horizontally
