# Vanilla Breeze

A layered HTML component system extending HTML's native model. Build accessible, themeable interfaces with semantic HTML, CSS cascade layers, and progressive enhancement — no build step required.

## Features

- **Zero-class styling** — native HTML elements styled through cascade layers, not utility classes
- **Layout attributes** — responsive layouts via `data-layout="stack | cluster | sidebar | grid"` instead of wrapper divs
- **30+ web components** — accordion, tabs, carousel, data-table, command-palette, combo-box, toast, tooltip, drag-surface, and more
- **Design tokens** — spacing, typography, colors, sizing, borders, shadows, motion
- **Theme engine** — 10 brand themes, 18 extreme themes, 4 accessibility themes, dark/light mode
- **Progressive enhancement** — everything works without JavaScript; JS adds interactivity

## Quick Start

### CDN

```html
<link rel="stylesheet" href="https://unpkg.com/vanilla-breeze/dist/cdn/vanilla-breeze.css">
<script type="module" src="https://unpkg.com/vanilla-breeze/dist/cdn/vanilla-breeze.js"></script>
```

### npm

```bash
npm install vanilla-breeze
```

```js
import 'vanilla-breeze';
import 'vanilla-breeze/css';
```

## Usage

```html
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>

<main data-layout="stack">
  <h1>Hello Vanilla Breeze</h1>
  <p>Semantic HTML, styled automatically.</p>

  <accordion-wc>
    <details>
      <summary>Section One</summary>
      <p>Content here.</p>
    </details>
    <details>
      <summary>Section Two</summary>
      <p>More content.</p>
    </details>
  </accordion-wc>
</main>
```

No classes needed — elements are styled through cascade layers.

## Documentation

Full docs, interactive demos, and examples at **[profpowell.github.io/vanilla-breeze](https://profpowell.github.io/vanilla-breeze/)**.

## License

[MIT](LICENSE)
