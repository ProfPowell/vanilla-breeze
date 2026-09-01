# Vanilla Breeze

A layered HTML component system extending HTML's native model. Build accessible, themeable interfaces with semantic HTML, CSS cascade layers, and progressive enhancement — no build step required.

Docs, interactive demos, and examples: **[vanilla-breeze.com](https://vanilla-breeze.com/)**

## Features

- **Zero-class styling** — native HTML elements styled through cascade layers, not utility classes
- **Layout attributes** — responsive layouts via `data-layout="stack | cluster | sidebar | grid"` instead of wrapper divs
- **90+ web components** — accordion, tabs, carousel, data-table, command-palette, combo-box, toast, tooltip, drag-surface, and more
- **Design tokens** — spacing, typography, colors, sizing, borders, shadows, motion
- **Theme engine** — 50+ themes as tiny à-la-carte token files (1–4 KB each), plus dark/light mode; only core themes ship in the main bundle
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

Smaller entry points are exported too: `vanilla-breeze/core-js` + `vanilla-breeze/core-css` for the foundation only, and `vanilla-breeze/ui-js`, `effects-js`, `icons-js`, and friends for individual packs. See the `exports` map in `package.json`.

### Themes

The main bundle includes only the core themes. Decorative themes are standalone token files — add one line and set `data-theme`:

```html
<link rel="stylesheet" href="https://unpkg.com/vanilla-breeze/dist/cdn/themes/nord.css">
<html data-theme="nord">
```

Or via npm: `import 'vanilla-breeze/themes/nord';`. Runtime switching (`<theme-picker>`, `ThemeManager`) fetches theme CSS automatically on first use.

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

## Companion packs

Two component families ship as separate packages that read Vanilla Breeze tokens and adopt the active theme automatically:

- [`@profpowell/vb-design-system`](https://www.npmjs.com/package/@profpowell/vb-design-system) — specimens, palette and gradient builders, font pairing, theme catalog/import/export
- [`@profpowell/vb-project-planning`](https://www.npmjs.com/package/@profpowell/vb-project-planning) — kanban, gantt, roadmap, story map, personas, risk register, and other planning surfaces

## Development

```bash
npm install
npm run build      # CDN bundles + doc site into site/dist/pages
npm test           # unit tests
npm run conformance
```

The doc site is built with Cook SSG and deployed to Cloudflare Pages from this repo. See `admin/reference/build-and-deploy.md` for the full pipeline and [CHANGELOG.md](CHANGELOG.md) for release notes.

## License

[MIT](LICENSE)
