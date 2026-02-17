# 11ty Port Validation Plan

Status: **Pending** — Tier 1 fixes complete, Tiers 2-3 remain.

## Completed (Tier 1)

- [x] Backfilled front matter on 7 pages (accordion, geo-map, form-field, data-format-bytes, data-format-number, data-hotkey, data-ticker)
- [x] Fixed grid-composer `<script>` tag (added `type="module"`)
- [x] Ported 20 missing pages (concepts, examples, extensions, integrations, themes, patterns/index, r-n-d/index, tools/theme-builder)
- [x] Build passes: 285 pages, 0 errors

---

## Tier 2: Visual Comparison — Labs Pages

Compare 11ty output against Astro output for layout correctness.

### Target pages (highest risk)

| Page | Risk | Why |
|------|------|-----|
| `/lab/experiments/charts/` | High | 55 JSX style conversions, `{% set %}` blocks for reusable chart data |
| `/lab/experiments/grid-composer/` | High | Interactive composer with script imports, canvas/inspector layout |
| `/lab/experiments/retro-themes/` | Medium | 11K of themed demos, entity-encoded braces in code blocks |
| `/lab/experiments/wireframe-mode/` | Medium | 10K of wireframe demos, entity-encoded braces |
| `/lab/experiments/dashboard/` | Low | Simple layout demo, no template logic |
| `/lab/theme-picker/variants/` | Medium | 13K of theme picker patterns with inline CSS custom properties |

### Method

1. Start both dev servers:
   - Astro: `cd site && npm run dev` (port 4321)
   - 11ty: `cd 11ty-site && npm run dev` (port 4322 — change port temporarily)
2. For each target page, open side-by-side in browser
3. Check:
   - Layout structure matches (sidebar, header, content area)
   - All demo components render (charts display bars/lines, grid-composer shows canvas)
   - Inline styles applied correctly (CSS custom properties, grid placement)
   - Code blocks render with syntax highlighting and copy buttons
   - Browser-window components show chrome + content
4. Document any visual regressions

### Newly ported pages to also check

| Page | Risk | Why |
|------|------|-----|
| `/docs/examples/kitchen-sink/` | High | Large page with many interactive components, inline script+style |
| `/docs/examples/table-interactive/` | High | Script with event listeners, TypeScript casts removed |
| `/docs/examples/extensions/backgrounds/` | Medium | Interactive controls with script logic |
| `/docs/examples/extensions/rough-borders/` | Medium | SVG filters + interactive picker |
| `/docs/examples/extensions/sound-effects/` | Medium | Audio API, TypeScript annotations removed |
| `/docs/examples/extensions/motion-tokens/` | Medium | Animation demos with script |
| `/tools/theme-builder/` | High | Full interactive app with ThemeBuilder class, filter().map() converted to static HTML |
| `/patterns/` | Medium | JS object iteration converted to Nunjucks data loop |

---

## Tier 3: Functional Smoke Tests

Verify interactive components work correctly in the 11ty build.

### Interactive components to test

| Component | Test | Pages |
|-----------|------|-------|
| `<accordion-wc>` | Click summary → panel opens/closes, single-open mode | accordion page, kitchen-sink |
| `<carousel-wc>` | Next/prev buttons cycle slides | carousel page, kitchen-sink |
| `<tabs-wc>` | Click tabs → panels switch, keyboard navigation | tabs page, kitchen-sink |
| `<command-palette>` | Hotkey opens palette, typing filters | command-palette page |
| `<dropdown-wc>` | Click trigger → dropdown opens | dropdown page |
| `vb-composer` (grid-composer) | Add blocks to canvas, drag to resize, export HTML/CSS | grid-composer lab page |
| Theme picker | Color swatches update theme variables | theme-picker/variants |
| Theme builder | Sliders/inputs generate CSS custom properties | tools/theme-builder |
| `<code-block>` | Syntax highlighting renders, copy button works | Any element doc page |
| `<browser-window>` | Chrome renders around demo content | Any element doc page with demos |
| `data-hotkey` | `<kbd>` elements show platform-appropriate symbols | data-hotkey page |
| `data-ticker` | Numbers animate on scroll | data-ticker page |
| `data-format-*` | Numbers/bytes/dates format correctly | format-number, format-bytes, format-date pages |
| Search (Pagefind) | Typing in search box returns results | Any page header |
| Theme toggle | Light/dark/brand switching works, persists | Any page |
| Mobile menu | Hamburger opens nav on narrow viewport | Any page |

### Method

1. Start 11ty dev server
2. Walk through each component manually
3. Open browser console — check for JS errors
4. Test on narrow viewport (mobile menu, responsive layouts)

---

## Notes

- The conversion script handled 264 pages mechanically; edge cases cluster in pages with: inline `<script>` blocks, TypeScript annotations, JSX-style iteration, and Astro slot directives
- Labs pages are mostly static HTML demos — the risk is in inline styles and entity encoding, not template logic
- The 20 newly ported pages had more complex conversion needs (JS objects → Nunjucks data, TypeScript removal, slot→block conversion) and deserve extra scrutiny
