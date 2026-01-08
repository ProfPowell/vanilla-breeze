# Add Noscript Command

Add `<noscript>` fallback patterns to HTML files for JavaScript-required functionality.

## Usage

```
/add-noscript [type]
```

## Arguments

- `$ARGUMENTS` - Fallback type: `message` (default), `redirect`, `hide`, `beacon`

## Types

### message (default)

Display a user-friendly message:

```html
<noscript>
  <div class="js-required-notice" role="alert">
    <h2>JavaScript Required</h2>
    <p>This feature requires JavaScript to function.
       Please enable JavaScript in your browser settings.</p>
    <p><a href="/help/javascript">How to enable JavaScript</a></p>
  </div>
</noscript>
```

### redirect

Redirect to a static fallback page:

```html
<head>
  <noscript>
    <meta http-equiv="refresh" content="0; url=/no-javascript.html"/>
  </noscript>
</head>
<body>
  <noscript>
    <p>Redirecting... <a href="/no-javascript.html">Click here</a> if not redirected.</p>
  </noscript>
</body>
```

### hide

Hide JS-only elements and show fallback:

```html
<head>
  <noscript>
    <style>
      [data-js-required] { display: none !important; }
      .no-js-message { display: block !important; }
    </style>
  </noscript>
</head>
<body>
  <div class="no-js-message" hidden>
    JavaScript is required for this application.
  </div>
  <main data-js-required>
    <!-- JS-only content -->
  </main>
</body>
```

### beacon

Track JS-disabled users with analytics:

```html
<noscript>
  <img src="/api/analytics?event=js_disabled" alt="" width="1" height="1"/>
</noscript>
```

## Steps to Execute

### 1. Parse Type

Determine which pattern to add based on argument.

### 2. Check for Existing Noscript

Scan the HTML file for existing `<noscript>` elements to avoid duplicates.

### 3. Add to Appropriate Location

- `message`, `beacon`: Add in `<body>`
- `redirect`, `hide`: Add in both `<head>` and `<body>`

### 4. Add Supporting CSS

For `message` type, add basic styles:

```css
.js-required-notice {
  padding: var(--space-6, 1.5rem);
  max-width: 40rem;
  margin: var(--space-8, 2rem) auto;
  background: var(--color-warning-bg, #fef3c7);
  border: 1px solid var(--color-warning, #f59e0b);
  border-radius: var(--radius-md, 0.375rem);
  text-align: center;
}

.js-required-notice h2 {
  margin: 0 0 var(--space-2, 0.5rem);
  color: var(--color-warning-text, #92400e);
}

.js-required-notice a {
  color: var(--color-link, #2563eb);
}
```

## CSS Scripting Media Query

Modern browsers support detecting JS availability in CSS:

```css
/* When JS is disabled */
@media (scripting: none) {
  [data-js-required] { display: none; }
  .no-js-message { display: block; }
}

/* When JS is enabled */
@media (scripting: enabled) {
  .no-js-message { display: none; }
}
```

**Note:** Supported in Chrome 120+, Firefox 113+, Safari 17+

## When to Use Each Type

| Your App | Use This |
|----------|----------|
| Content site with JS enhancements | Usually not needed |
| SPA / web app | `message` or `hide` |
| Full-page JS app | `redirect` |
| Any site needing analytics | Add `beacon` |

## Notes

- `<noscript>` in `<head>` can only contain `<link>`, `<style>`, `<meta>`
- `<noscript>` in `<body>` can contain any block content
- Always provide a way for users to get help enabling JS
- Consider whether your feature truly requires JS
