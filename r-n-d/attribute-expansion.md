# Attribute Documentation Expansion — Triage & Upscale Analysis

## Status: In Progress (Feb 2026)

## Inventory

The HTML Living Standard defines ~270 attributes (excluding `on*` event handlers and `aria-*`). VB documented 16 native attributes before this expansion. After triaging out:

- **Event handlers** (`onclick`, `onfocus`, etc.) — 70+ attrs, DOM API territory
- **ARIA attributes** (`aria-*`, `role`) — 35+ attrs, covered by accessibility guide
- **Element-specific layout attrs** (`colspan`, `rowspan`, `headers`, `scope`, `span`) — covered in element pages
- **Deprecated/obsolete** (`manifest`, `charset` on non-meta, `code`, `codebase`, `coords`, `shape`) — not worth documenting
- **Micro-level/trivial** (`id`, `style`, `slot`, `part`, `name`, `value`, `type`, `src`, `href`, `alt`, `action`, `method`, etc.) — too fundamental for standalone pages; covered inline on element pages
- **Niche/low-value** (`itemid`, `itemprop`, `itemref`, `itemscope`, `itemtype` — Microdata; `exportparts`, `shadowroot*` — Shadow DOM internals)

**35 attributes** remain as high-value documentation candidates.

---

## New Pages (35)

### Forms (8)
| Attribute | Why | Upscale? |
|-----------|-----|----------|
| `disabled` | Fieldset cascade, a11y contrast, submission exclusion | Yes → `data-loading` |
| `readonly` | Contrast with disabled, still submitted | No |
| `required` | Constraint validation, CSS pseudo-classes | No |
| `placeholder` | Anti-patterns, accessibility problems | Yes → `data-floating-label` |
| `novalidate` | Custom validation, progressive enhancement | No |
| `multiple` | Three different behaviors (select, email, file) | No |
| `list` | Datalist connection, cross-browser rendering | No |
| `form` (attr) | Associate controls outside form ancestor | No |

### Links & Security (5)
| Attribute | Why | Upscale? |
|-----------|-----|----------|
| `crossorigin` | CORS for fonts/scripts/images, font requirement | No |
| `sandbox` | iframe security tokens, debugging | Yes → `data-sandbox-report` |
| `download` | Trigger download, filename override, cross-origin limits | No |
| `target` | `_blank` security, named targets | No |
| `nonce` | CSP inline allowlisting | No |

### Performance (2)
| Attribute | Why | Upscale? |
|-----------|-----|----------|
| `async` / `defer` | Script loading strategies (combined page) | No |
| `blocking` | New render-blocking control | No |

### Global (6)
| Attribute | Why | Upscale? |
|-----------|-----|----------|
| `autofocus` | One-per-page rule, dialog interaction | Yes → `data-focus-trap` |
| `spellcheck` | Editable elements, code/token disabling | Yes → `data-spellcheck` |
| `autocapitalize` | Mobile UX, pairs with inputmode | No |
| `title` (attr) | Tooltip a11y pitfalls, alternatives | No |
| `accesskey` | Platform differences, discoverability | Yes → extend `data-hotkey` |
| `autocorrect` | Mobile autocorrect, when to disable | No |

### Media (5)
| Attribute | Why | Upscale? |
|-----------|-----|----------|
| `srcset` + `sizes` | Responsive images, resolution switching | Yes → `data-responsive` |
| `poster` | Video placeholder, UX impact | No |
| `preload` | Media loading: none/metadata/auto | No |
| `controls` + `controlslist` | Native media controls, button removal | Yes → `<media-controls>` |
| `allow` | iframe permissions policy | No |

### Structure (9)
| Attribute | Why | Upscale? |
|-----------|-----|----------|
| `open` | details/dialog state, accordion pattern | Yes → `data-accordion` |
| `datetime` | Machine-readable dates on time/del/ins | No |
| `cite` (attr) | Source URL, semantic but invisible | No |
| `reversed` + `start` | Countdown lists, arbitrary numbering | No |
| `wrap` | textarea wrapping: soft vs hard | No |
| `dirname` | Directionality submission, almost unknown | No |
| `is` | Customized built-in elements | No |
| `ping` | Link tracking, privacy | No |
| `srcdoc` | Inline iframe HTML | No |

---

## Upscale Candidates (10)

These native attributes have clear enhancement opportunities where VB could add real value.

### Priority 2 (High Impact)

1. **`contenteditable` → `<editor-wc>`**
   - Toolbar with formatting buttons, markdown output, paste sanitization
   - Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
   - Content already documented; this is the component build

2. **`autofocus` → `data-focus-trap`**
   - Dynamic content focus management (modals, drawers, dynamic sections)
   - Focus restoration on close
   - Trap boundaries to prevent tabbing out

3. **`disabled` → `data-loading`**
   - Button loading state with spinner, aria-busy, auto-revert on completion
   - Prevents double-submit without custom JS
   - Pairs with form submission

### Priority 3 (Medium Impact)

4. **`spellcheck` → `data-spellcheck`**
   - Custom dictionary support, domain vocabulary
   - Visual correction UI beyond browser red underlines
   - Language-specific dictionaries

5. **`placeholder` → `data-floating-label`**
   - Animated floating label that moves above the input on focus
   - Preserves context (label always visible)
   - Material Design pattern, widely expected

6. **`srcset`/`sizes` → `data-responsive`**
   - Simplified responsive image API
   - Dev overlay showing which source was chosen
   - Automatic sizes calculation

7. **`controls` → `<media-controls>`**
   - Fully styled, keyboard-accessible media controls
   - Theme-consistent with VB design tokens
   - Chapter navigation, speed control, PiP button

8. **`accesskey` → extend `data-hotkey`**
   - Already have `data-hotkey` for display; extend to bind actions
   - Conflict detection across the page
   - Discoverable shortcuts dialog (Ctrl+/)

9. **`open` → `data-accordion`**
   - Smooth open/close animation for `<details>`
   - Polyfill `name` attribute exclusivity for older browsers
   - Nested accordion support

### Priority 4 (Low Impact)

10. **`sandbox` → `data-sandbox-report`**
    - Dev-mode only: reports blocked actions to console
    - Helps debug silent sandbox failures
    - No production impact

---

## Excluded from Expansion (Notable)

| Attribute | Reason |
|-----------|--------|
| `role` | ARIA spec, not HTML attribute per se — covered in accessibility guide |
| `data-*` | Generic pattern, not a specific attribute — covered in data-attributes philosophy page |
| `autoplay` | Covered adequately by media element pages + preload page |
| `loop`, `muted`, `playsinline` | Simple boolean attrs covered on element pages |
| `checked`, `selected`, `default` | State attrs covered on form element pages |
| `max`, `min`, `step`, `size`, `maxlength`, `minlength` | Constraint attrs covered by pattern + element pages |
| `enctype`, `formaction`, `formmethod`, `formtarget` | Form submission variants — covered on form element page |
| `fetchpriority`, `decoding` | Already covered in the `loading` attribute page |
