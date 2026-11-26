# Ambient pack

Opt-in styling that follows the season, time of day, weather and calendar occasions at the author's place. State is `data-*` attributes on `<html>`; looks are decorative tokens. The user documentation is `site/src/pages/docs/packs/ambient.html`; the design is `docs/plans/Ambient weather, season and occasion styling for Vanilla Breeze.md`.

## Files

| File | Role |
| --- | --- |
| `ambient.resolve.js` | Pure resolvers, no DOM: season, daypart, occasions, calendar expansion, WMO code mapping. Shared by the browser, the head script and site builds. |
| `ambient.head.js` | Source of the inline head snippet. Built as a classic script; a site inlines it after `#ambient-config`. |
| `ambient.core.js` | Browser module: resolves, writes the attributes, schedules the next boundary, wires the opt-out and the preview. Exports `Ambient`. |
| `ambient.theme.css` | Tokens and the state mapping, in `@layer bundle-theme`. |
| `ambient.effects.css` | Motif icon precedence, the slots and the atmosphere layer, in `@layer bundle-effects`. |
| `ambient.atmosphere.js` | Lazy: plays the effect for a state in `[data-ambient-slot="atmosphere"]` by adding one `<bg-wc>`. Fetched by the core only when it could play. |
| `ambient.icons.css` | Generated: the icons as data-URI tokens. Edit the `ICONS` map in `scripts/generate-ambient-icons.mjs` and run it. |
| `ambient.calendars.js` | Built-in calendars (`markers`, `geek`, `civic-us`) and `calendarFor(config)`. Bundled into `ambient.resolve.js`. |
| `ambient.bundle.js` | Pack manifest. |

The visitor preference (`localStorage` key `vb-ambient`) is in `src/lib/ambient-pref.js`, outside the pack, so `<settings-panel>` can offer the switch without importing the pack.

## Status

Phases 1 to 4 of the plan are built in this repo: resolvers, head script, attribute contract, tint tokens, opt-out, preview, built-in calendars, motif icons and slots, `data-ambient-level` (`tint`, `motif` and `atmosphere`), the weather feed: its schema, the client (fetch, session cache, staleness) and the Open-Meteo producer helpers. The site-side half of phase 2 (settings, front matter and the build-time bake) belongs to Vanilla Press, Cook and the site, and so does the feed producer itself (a Worker or function at the site). Phase 4 is the atmosphere effects, played with the `snow`, `rain`, `leaves`, `fog` and `confetti` presets of `@profpowell/bg-wc` when a page has it; there is no second canvas engine in this pack. Phase 5 (personal details on a site, editor features in Vanilla Press) is not in this repo.

## Deviations from the plan

- **Tint model.** `--ambient-hue` is an absolute oklch hue per season, not an offset from the theme's primary: an offset turns a blue primary purple in autumn. The season colour takes its lightness from the primary, caps the chroma, and keeps `--ambient-blend` (25%) of the primary. Extra tokens: `--ambient-warmth` (dawn and dusk), `--ambient-blend`, `--ambient-season-chroma`.
- **Night surface.** Set with `light-dark()` on `--color-ambient-surface` directly, because a percentage token cannot depend on the colour scheme.
- **Daypart without a feed.** One code path: a fixed sunrise and sunset per season with the same 45-minute window used with a feed (the plan's example table used 30 minutes).
- **Module entry.** `Ambient` is imported from `packs/ambient.core.js`. `ambient.full.js` is a side-effect rollup with no exports, like the other packs.
- **Resolver file.** The rule parser lives in `ambient.resolve.js`. The head script reads only dated windows (`config.occasions`), which a build writes with `expandCalendar()`; the module fetches the resolver file only for a page that gives rules (`config.calendar`).
- **Budgets.** The core module is 3.5 KB gzipped, not 2 KB (measured 3.3 KB with the feed client and the atmosphere gate), and the head script 1.25 KB, not 1 KB (measured 1.15 KB since it applies the cached feed). Budgets are in `scripts/bundle-budget.config.json`.
- **Atmosphere is not `VB.effect()`.** The plan registered five effects through `VB.effect()`. The core module starts them from the state instead, and the slot carries `data-ambient-effect="ambient-snow"` and so on while one plays: importing the effects runtime would cost more than the 3 KB the plan allows per effect, and the trigger here is state, not an attribute an author writes.
- **Atmosphere needs `<bg-wc>`.** There is no CSS-only fallback: without the component on the page nothing plays. The plan's limit of 40 elements does not apply to a canvas; the pack asks for bg-wc's `low` quality and a density of 0.15 to 0.5.
- **Atmosphere sits behind the slot's content**, not over it, so text contrast and pointer targets are untouched while it plays. Fog is a full-frame shader with no transparency, so it paints `--color-background` at half opacity over the slot's own background for its five seconds.
- **`occasionEffect`.** An extra state field: the effect named by an occasion that is on its own day. `activeOccasions()` returns it as `effect` only when there is one.
- **Feed cache.** The session cache is kept for the feed's `ttl` from the time it was fetched, not from `asOf`: a feed served from a CDN is often older than its `ttl` on arrival, and a cache keyed on `asOf` would refetch on every page. Staleness (`asOf + 2 × ttl`) is still judged from `asOf`.
- **Feed and daypart.** The feed is fetched when `weather` or `daypart` is enabled, because its sunrise and sunset serve the daypart.
- **Producer.** The pack ships pure helpers (`openMeteoUrl`, `feedFromOpenMeteo` in `ambient.resolve.js`), not a deployed Worker; the docs show a Cloudflare Pages Function that caches at the edge, with no cron and no KV. The direct browser-to-provider option (`feed: "open-meteo"`) is not offered.
- **Opt-out and weather.** A visitor who opted out gets no feed request, so `Ambient.state.tempC` is null for them and a site's status line shows no conditions.
- **Preview.** A preview or pin never sets a signal the author did not enable.
- **Icons.** Eighteen, taken from the Lucide set already in `src/icons/lucide` by a generator, not hand-drawn files in `icons/`. They are stroke icons of 250 to 500 bytes each, over the plan's 300; the stylesheet as a whole is 2.8 KB gzipped against its 4 KB budget.
- **`data-occasion-icon`.** An extra state attribute. A calendar entry names its icon, and the head script writes that name, so the stylesheet needs one rule per icon and none per occasion id, and a site's own occasions get icons with no CSS.
- **Calendars are a JS module**, not `calendars/*.json`, so the unbundled source loads in a browser without JSON import attributes. Solstices and equinoxes use neutral icons (sun, star) because the season they mark depends on the hemisphere.
- **Default calendar.** With the occasion signal on and no `occasions` in the config, the module fetches the resolver file and applies `markers`. A built site ships `occasions` and makes no such request.
- **Replaced.** `src/lib/environment-manager.js` and the two Environment switches in `<settings-panel>` are gone. They shifted `--hue-primary` itself, on the visitor's clock.

## Tests

- `tests/unit/ambient-resolve.test.js`: resolvers, table-driven, independent of the runner's time zone.
- `tests/unit/ambient-feed.test.js`: the feed reader and the Open-Meteo helpers, against a recorded response.
- `tests/unit/ambient-atmosphere.test.js`: which effect a state plays.
- `tests/components/ambient-pack.spec.js`: atmosphere (the slot, the five seconds, no fetch under reduced motion or data saving, loop and pause), head script, module, opt-out, the feed client (fresh, stale, malformed, slow, missing, cache hit, data saving), tokens, and AA contrast of body text on the washed surface for four themes, both modes, every season, three dayparts and three weathers.
