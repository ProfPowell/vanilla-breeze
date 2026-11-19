# Ambient pack

Opt-in styling that follows the season, time of day, weather and calendar occasions at the author's place. State is `data-*` attributes on `<html>`; looks are decorative tokens. The user documentation is `site/src/pages/docs/packs/ambient.html`; the design is `docs/plans/Ambient weather, season and occasion styling for Vanilla Breeze.md`.

## Files

| File | Role |
| --- | --- |
| `ambient.resolve.js` | Pure resolvers, no DOM: season, daypart, occasions, calendar expansion, WMO code mapping. Shared by the browser, the head script and site builds. |
| `ambient.head.js` | Source of the inline head snippet. Built as a classic script; a site inlines it after `#ambient-config`. |
| `ambient.core.js` | Browser module: resolves, writes the attributes, schedules the next boundary, wires the opt-out and the preview. Exports `Ambient`. |
| `ambient.theme.css` | Tokens and the state mapping, in `@layer bundle-theme`. |
| `ambient.bundle.js` | Pack manifest. |

The visitor preference (`localStorage` key `vb-ambient`) is in `src/lib/ambient-pref.js`, outside the pack, so `<settings-panel>` can offer the switch without importing the pack.

## Status

Phase 1 of the plan is built: resolvers, head script, attribute contract, tint tokens, opt-out, preview. Not built yet: built-in calendars, motif icons and slots, `data-ambient-level` (phase 2); the weather feed and its client (phase 3); atmosphere effects (phase 4), which are to reuse the `snow`, `rain`, `leaves`, `fog` and `confetti` presets of `@profpowell/bg-wc` when a page has it, with no second canvas engine in this pack.

## Deviations from the plan

- **Tint model.** `--ambient-hue` is an absolute oklch hue per season, not an offset from the theme's primary: an offset turns a blue primary purple in autumn. The season colour takes its lightness from the primary, caps the chroma, and keeps `--ambient-blend` (25%) of the primary. Extra tokens: `--ambient-warmth` (dawn and dusk), `--ambient-blend`, `--ambient-season-chroma`.
- **Night surface.** Set with `light-dark()` on `--color-ambient-surface` directly, because a percentage token cannot depend on the colour scheme.
- **Daypart without a feed.** One code path: a fixed sunrise and sunset per season with the same 45-minute window used with a feed (the plan's example table used 30 minutes).
- **Module entry.** `Ambient` is imported from `packs/ambient.core.js`. `ambient.full.js` is a side-effect rollup with no exports, like the other packs.
- **Resolver file.** The rule parser lives in `ambient.resolve.js`. The head script reads only dated windows (`config.occasions`), which a build writes with `expandCalendar()`; the module fetches the resolver file only for a page that gives rules (`config.calendar`).
- **Core module budget.** 2.5 KB gzipped, not 2 KB (measured 2.36 KB before the weather client exists). Budgets are in `scripts/bundle-budget.config.json`.
- **Preview.** A preview or pin never sets a signal the author did not enable.
- **Replaced.** `src/lib/environment-manager.js` and the two Environment switches in `<settings-panel>` are gone. They shifted `--hue-primary` itself, on the visitor's clock.

## Tests

- `tests/unit/ambient-resolve.test.js`: resolvers, table-driven, independent of the runner's time zone.
- `tests/components/ambient-pack.spec.js`: head script, module, opt-out, tokens, and AA contrast of body text on the washed surface for four themes, both modes, every season, three dayparts and three weathers.
