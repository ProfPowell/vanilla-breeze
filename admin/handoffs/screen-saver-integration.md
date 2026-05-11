# Integrating with screen-saver — Handoff for Vanilla Breeze

> **Audience:** another Claude instance (or developer) working in a Vanilla Breeze app who wants to wire up the `<screen-saver>` web component so it inherits the active VB theme.
>
> **Last verified:** 2026-05-11 against screen-saver `1.1.0`. Re-verify when this date is more than ~2 weeks stale.

---

## 60-second orientation

- **screen-saver** is a standalone vanilla-JS web component published as the npm package `screen-saver`. It is **not** a Vanilla Breeze (VB) pack. There is no build coupling between the two repos.
- The interface between them is purely CSS: screen-saver reads VB tokens via `var(--color-*, …)` fallbacks. VB does not need to do anything special.
- Pre-release status: screen-saver is at `1.1.0`. Effect names are stable; the `palette` attribute is stable.

---

## Install

```html
<script type="module" src="https://unpkg.com/screen-saver@1.1.0/dist/screen-saver.js"></script>
```

Or:

```bash
npm install screen-saver
```

---

## Zero-config usage with a VB theme

Apply a VB theme on the document, drop in a `<screen-saver>`, done:

```html
<html data-theme="bauhaus">
  <body>
    <screen-saver effect="bauhaus" timeout="180">Hello</screen-saver>
  </body>
</html>
```

CSS custom properties inherit through shadow DOM, so VB tokens set on `:root` reach the effects automatically. No piercing needed.

---

## The `palette` attribute

Some built-in effects cycle through a hardcoded rainbow palette (`bounce3d`, `fireworks`, `bubbles`, `pipes`, `mystify`, `plasma`). By default they keep that rainbow. To make them cycle through VB semantic colors instead, opt in:

```html
<screen-saver effect="bounce3d" palette="theme">Hello</screen-saver>
```

The five new themed effects below ignore this attribute — they always use their VB tokens.

---

## Recommended theme pairings

| Screen-saver effect | Recommended VB theme | Requires text? |
| ------------------- | -------------------- | -------------- |
| `bauhaus`           | `bauhaus`            | yes            |
| `memphis`           | `memphis`            | no             |
| `art-deco`          | `art-deco`           | yes            |
| `brutalist`         | `brutalist`          | yes            |
| `kawaii`            | `kawaii`             | no             |

The 12 existing effects work with any VB theme. Use whichever is visually appropriate.

---

## VB tokens consumed

For users replicating the contract outside VB:

| Token                       | Used by                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `--color-primary`           | `tunnel`, `bauhaus`, `art-deco`, JS-palette effects under `palette="theme"` |
| `--color-accent`            | `bubbles`, `art-deco`, JS-palette effects                        |
| `--color-success`           | `matrix`                                                         |
| `--color-warning`           | `bauhaus`, `art-deco`                                            |
| `--color-info`              | `bauhaus`                                                        |
| `--color-error`             | `ascii-glitch`                                                   |
| `--color-text`              | `ascii-glitch`, `starfield`, `snow`, `slideshow`, `brutalist`, `kawaii` text |
| `--color-background`        | all themed effects                                               |
| `--color-surface`           | `pipes`                                                          |
| `--color-primary-subtle`    | `kawaii`                                                         |
| `--color-accent-subtle`     | `kawaii`                                                         |
| `--color-success-subtle`    | `kawaii`                                                         |
| `--font-sans`               | most effects                                                     |
| `--font-display`            | `art-deco`, `memphis`, `kawaii` (preferred over `--font-sans`)    |
| `--font-mono`               | `brutalist`, `ascii-glitch`                                       |

The `--screen-saver-*` custom properties (`--screen-saver-text-color`, `--screen-saver-bg`, `--screen-saver-font-family`, `--screen-saver-font-size`, `--screen-saver-z-index`) override the VB tokens above when set.

---

## Shadow DOM

`<screen-saver>` uses shadow DOM. Custom properties declared on `:root` inherit through shadow boundaries — no `::part`, no `:host`-piercing required from VB themes.

---

## Reduced motion

All effects respect `prefers-reduced-motion: reduce`:

- Most fall back to a static composition (no animation).
- `bauhaus`, `kawaii`, `memphis` lay out sprites/shapes in a static grid.
- `brutalist` shows all words at once in a static grid instead of slamming them in.
- `art-deco` removes the inhale/exhale scaling.

---

## Versioning

screen-saver follows semver. The `palette` attribute and the five new effects shipped in `1.1.0` and are stable.
