# OS Integration — Corrected Implementation Plan

**Version:** 1.0
**Status:** Go-Forward Plan
**Source:** Corrected from `os-integration.md` draft
**Date:** 2026-03-03

---

## 1. Syntax Corrections

The original spec uses `--vb-*` prefixed tokens and incorrect selectors throughout. This section maps every occurrence to the correct VB syntax.

### 1.1 Token Name Corrections

| Spec Token | Correct VB Token | Notes |
|---|---|---|
| `--vb-font-ui` | `--font-sans` | Or `--font-body` / `--font-heading` for extension slots |
| `--vb-font-display` | `--font-display` | Extension slot from `_theme-template.css` |
| `--vb-font-mono` | `--font-mono` | Direct match, just drop prefix |
| `--vb-radius-button` | `--radius-s` | Buttons use `--radius-s` (0.25rem default) |
| `--vb-radius-input` | `--radius-s` | Inputs share button radius |
| `--vb-radius-card` | `--radius-m` | Cards use `--radius-m` (0.5rem default) |
| `--vb-radius-dialog` | `--radius-l` | Dialogs use `--radius-l` (0.75rem default) |
| `--vb-radius-menu` | `--radius-m` | Menus share card radius |
| `--vb-radius-badge` | `--radius-full` | Pills use `--radius-full` (9999px) |
| `--vb-color-interactive` | `--color-interactive` | Direct match |
| `--vb-color-interactive-hover` | `--color-interactive-hover` | Direct match |
| `--vb-color-interactive-text` | `--color-text-on-primary` | Semantic inversion token |
| `--vb-color-bg` | `--color-background` | Full name, no abbreviation |
| `--vb-color-bg-subtle` | `--color-surface` | Surface is the standard subtle bg |
| `--vb-color-bg-raised` | `--color-surface-raised` | Elevated surfaces |
| `--vb-color-text` | `--color-text` | Direct match |
| `--vb-color-text-subtle` | `--color-text-subtle` | Direct match |
| `--vb-color-border` | `--color-border` | Direct match |
| `--vb-color-border-focus` | `--color-border-focus` | Direct match |
| `--vb-color-danger` | `--color-error` | VB uses "error" not "danger" |
| `--vb-shadow-card` | `--shadow-md` | Mid-elevation |
| `--vb-shadow-dialog` | `--shadow-xl` | High elevation |
| `--vb-shadow-menu` | `--shadow-lg` | Between card and dialog |
| `--vb-shadow-focus` | `--color-focus-ring` + `--focus-ring-width` | Two tokens, not a shadow composite |
| `--vb-effect-sidebar-bg` | Theme composite (e.g. `--macos-sidebar-bg`) | No `--vb-effect-*` tokens exist |
| `--vb-effect-sidebar-blur` | Theme composite (e.g. `--macos-sidebar-blur`) | Use `--glass-blur` if reusing extension |
| `--vb-effect-nav-bg` | Theme composite (e.g. `--macos-nav-bg`) | Per-theme |
| `--vb-effect-nav-blur` | `--glass-blur` or theme composite | Reuse glass extension where applicable |
| `--vb-effect-dialog-bg` | Theme composite (e.g. `--ios-dialog-bg`) | Per-theme |
| `--vb-height-titlebar` | Theme composite (e.g. `--macos-titlebar-h`) | No global `--height-*` tokens |
| `--vb-height-menu-item` | Theme composite (e.g. `--macos-menu-item-h`) | Per-theme |
| `--vb-nav-height` | Theme composite (e.g. `--ios-nav-h`) | Per-theme |
| `--vb-size-touch-target` | `--size-touch-min` | Exists in sizing.css (2.75rem) |
| `--vb-space-2` | `--size-2xs` | T-shirt size scale |
| `--vb-space-3` | `--size-xs` | T-shirt size scale |
| `--vb-space-4` | `--size-s` | T-shirt size scale |
| `--vb-duration-fast` | `--duration-fast` | Direct match (100ms) |
| `--vb-duration-normal` | `--duration-normal` | Direct match (200ms) |
| `--vb-duration-slow` | `--duration-slow` | Direct match (300ms) |
| `--vb-ease-out` | `--ease-out` | Semantic alias exists |
| `--vb-button-border` | `--border-width-thin` + `--color-border` | No compound `--button-border` token |

### 1.2 Selector Corrections

| Spec Pattern | Correct VB Pattern |
|---|---|
| `[data-theme="x"]` | `:root[data-theme~="x"], [data-theme~="x"]` |
| `[data-theme="x"][data-color-scheme="dark"]` | `:root[data-theme~="x"][data-mode="dark"], [data-theme~="x"][data-mode="dark"]` |
| `[data-platform="darwin"]` | `[data-os="macos"]` (for detection) or within theme selector |
| `[data-ascii-variant="amber"]` | Composition via `data-theme~=` multi-value |

### 1.3 Component Targeting Corrections

| Spec Pattern | Correct VB Pattern | Why |
|---|---|---|
| `.sidebar-item` | `aside a`, `aside [aria-current]` | Native elements, no classes |
| `.btn` | `button` | Native element |
| `.card` | `article`, `section`, or `[data-layout]` | Semantic elements |
| `.list-group` | `section` or `ul` | Native list/section elements |
| `.list-group-item` | `li` or child of section | Native list items |
| `.win-titlebar` | `header[role="banner"]` | Semantic element |
| `.win-controls` | `nav[aria-label="Window controls"]` | Semantic nav |
| `.menubar` | `nav[role="menubar"]` | ARIA menu pattern |
| `.menubar-item` | `[role="menuitem"]` | ARIA menu item |
| `.program-group` | `section` with `data-layout="grid"` | VB layout attribute |
| `.program-icon` | `figure` / `figcaption` | Native figure |
| `.window-titlebar` | `header` within `dialog` or `article` | Semantic heading area |

### 1.4 Composite Token Naming Convention

Following `_extreme-win9x.css` patterns:

```
--{theme-slug}-{purpose}
```

Examples from existing themes:
- `--win9x-raised`, `--win9x-pressed`, `--win9x-sunken` (box-shadow composites)
- `--win9x-bg`, `--win9x-highlight`, `--win9x-shadow` (foundation colors)
- `--glow-green`, `--glow-amber` (terminal phosphor colors)
- `--glass-blur`, `--glass-opacity` (glassmorphism extension)

New themes follow the same pattern:
- `--macos-accent`, `--macos-sidebar-bg`, `--macos-sidebar-blur`
- `--win11-accent`, `--win11-mica-bg`, `--win11-mica-blur`
- `--ios-accent`, `--ios-grouped-bg`, `--ios-nav-bg`
- `--m3-seed`, `--m3-on-primary`, `--m3-surface-tint`
- `--win31-bg`, `--win31-titlebar`
- `--classic-mac-platinum`, `--classic-mac-stripe-light`, `--classic-mac-stripe-dark`

---

## 2. What Already Exists (Skip or Extend)

### 2.1 Complete — Skip Implementation

| Theme | File | Lines | Coverage |
|---|---|---|---|
| Win95/98 | `_extreme-win9x.css` | 886 | Full 3D bevel system, all native elements, dark mode |
| Terminal/ASCII | `_extreme-terminal.css` | 403 | Green phosphor, VT323, scanlines, box-drawing |
| 8-bit | `_extreme-8bit.css` | 468 | Press Start 2P, pixel borders, CRT glow |
| NES | `_extreme-nes.css` | 645 | NES.css-inspired chunky pixel borders |

### 2.2 Infrastructure — Minor Extension Only

| Component | File | Status | Extension Needed |
|---|---|---|---|
| Theme Manager | `src/lib/theme-manager.js` | Complete | Optional `autoTheme()` method |
| Theme Loader | `src/lib/theme-loader.js` | Complete | No changes needed |
| Theme Template | `src/tokens/themes/_theme-template.css` | Complete | Reference only |
| Glass Extension | `src/tokens/extensions/surfaces.css` | Complete | Reuse `--glass-*` tokens |

### 2.3 ASCII/Terminal — Extend, Don't Duplicate

The spec's ASCII theme is almost entirely covered by `_extreme-terminal.css`. Rather than create a new theme, consider adding ANSI palette and amber/white phosphor as composition variants to the existing terminal theme:

```css
/* Already exists in _extreme-terminal.css — extend with: */
:root[data-theme~="terminal"][data-theme~="amber"],
[data-theme~="terminal"][data-theme~="amber"] {
  --glow-green: oklch(75% 0.15 75);  /* Amber phosphor */
  /* ... */
}
```

---

## 3. Implementation Phases

### Phase 1: OS Detection — `src/lib/os-detect.js`

**Effort:** Low (~30 lines)
**Impact:** Medium — enables auto-theming

Sets `data-os` on `<html>` as informational attribute. Does NOT auto-set `data-theme` — that remains opt-in via `ThemeManager`.

```js
// src/lib/os-detect.js
export function detectOS() {
  const ua = navigator.userAgent;
  const platform = navigator.platform || '';

  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Macintosh|MacIntel/.test(ua)) return 'macos';
  if (/Win32|Win64|Windows/.test(ua)) return 'windows';
  if (/Android/.test(ua)) return 'android';
  if (/Linux/.test(platform)) return 'linux';
  return 'unknown';
}

export function getOS() {
  return document.documentElement.dataset.os || detectOS();
}

// Set attribute on load — informational only
document.documentElement.dataset.os = detectOS();
```

**Optional `autoTheme()` in theme-manager.js:**

```js
async autoTheme() {
  const os = getOS();
  const themeMap = {
    macos: 'macos',
    windows: 'windows11',
    ios: 'ios',
    android: 'material',
  };
  const brand = themeMap[os];
  if (brand) await this.setBrand(brand);
}
```

This is opt-in — called by the developer, never automatic.

---

### Phase 2: Windows 3.1 — `src/tokens/themes/_extreme-win31.css`

**Effort:** Low
**Impact:** Medium — gap-filler, educational contrast with win9x

Windows 3.1 is simpler than Win9x (no bevel system), making it a good warm-up.

**Selector:**
```css
:root[data-theme~="win31"],
[data-theme~="win31"] {
```

**Composite tokens:**
```css
--win31-bg: oklch(78% 0 0);           /* #c0c0c0 — button face gray */
--win31-titlebar: oklch(25% 0.15 250); /* Navy — #000080 */
--win31-white: oklch(100% 0 0);
--win31-desktop: oklch(30% 0.08 195);  /* Teal desktop */
```

**Key overrides:**
- Font: `Arial, Helvetica, sans-serif` at small sizes
- All radii: `0` (everything square)
- All shadows: `none`
- All motion durations: `0ms`
- Borders: 1px black (not beveled like Win9x)
- Buttons: `box-shadow: inset 1px 1px 0 white` for highlight
- Focus: `outline: 1px dotted #000`
- Color scheme: VGA 16-color palette only

**Dark mode:** None — Win 3.1 had no dark mode. Skip `[data-mode="dark"]` variant.

**Component targeting (native elements only):**
```css
:root[data-theme~="win31"] button,
[data-theme~="win31"] button {
  background: var(--win31-bg);
  border: 1px solid var(--color-border);
  box-shadow: inset 1px 1px 0 var(--win31-white);
  /* ... */
}

:root[data-theme~="win31"] button:active,
[data-theme~="win31"] button:active {
  box-shadow: inset 1px 1px 0 var(--win9x-shadow, oklch(50% 0 0));
}
```

---

### Phase 3: macOS — `src/tokens/themes/_extreme-macos.css`

**Effort:** Medium
**Impact:** High — most-requested modern OS theme

**Selector:**
```css
:root[data-theme~="macos"],
[data-theme~="macos"] {
```

**Composite tokens:**
```css
--macos-accent: oklch(55% 0.25 260);      /* System blue #007aff */
--macos-sidebar-bg: oklch(100% 0 0 / 0.65);
--macos-sidebar-blur: 20px;
--macos-nav-bg: oklch(97% 0 0 / 0.85);
--macos-titlebar-h: 28px;
--macos-menu-item-h: 22px;
```

**Key overrides:**
- Font: `system-ui, -apple-system, sans-serif`
- Radii: 6px buttons, 10px cards, 14px dialogs (graduated scale)
  - `--radius-s: 6px`, `--radius-m: 10px`, `--radius-l: 14px`, `--radius-xl: 16px`
- Shadows: Very soft, diffuse — macOS avoids hard edges
  - `--shadow-md: 0 2px 8px oklch(0% 0 0 / 0.12), 0 0 1px oklch(0% 0 0 / 0.08)`
  - `--shadow-xl: 0 22px 70px oklch(0% 0 0 / 0.4)`
- Sidebar vibrancy: `backdrop-filter: blur(var(--macos-sidebar-blur))` on `aside`
- Reuse `--glass-blur` from surfaces.css extension where applicable

**Dark mode variant:**
```css
:root[data-theme~="macos"][data-mode="dark"],
[data-theme~="macos"][data-mode="dark"] {
  color-scheme: dark;
  --macos-sidebar-bg: oklch(20% 0 0 / 0.75);
  --macos-nav-bg: oklch(15% 0 0 / 0.85);
  --color-background: oklch(12% 0 0);   /* #1c1c1e */
  --color-surface: oklch(16% 0 0);      /* #2c2c2e */
  --color-surface-raised: oklch(16% 0 0);
  --color-border: oklch(100% 0 0 / 0.1);
  /* ... complete override per template requirements */
}
```

**Component targeting (native elements):**
- `aside` — sidebar vibrancy via `backdrop-filter`
- `aside a[aria-current]` — selected sidebar item highlight
- `dialog` — macOS-style centered sheet with large radius
- `nav` — translucent toolbar
- `button` — system blue accent, small radius

---

### Phase 4: Windows 11 — `src/tokens/themes/_extreme-windows11.css`

**Effort:** Medium
**Impact:** High — second most-requested

**Selector:**
```css
:root[data-theme~="windows11"],
[data-theme~="windows11"] {
```

**Composite tokens:**
```css
--win11-accent: oklch(48% 0.2 250);        /* Fluent blue #0067c0 */
--win11-mica-bg: oklch(96% 0 0 / 0.8);
--win11-mica-blur: 40px;                     /* Mica uses stronger blur than macOS */
--win11-close-red: oklch(50% 0.2 25);       /* #c42b1c — exact Win11 close button */
```

**Key overrides:**
- Font: `'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif`
- Radii: Uniform 8px everywhere — `--radius-s: 4px`, `--radius-m: 8px`, `--radius-l: 8px`
- Shadows: Subtle depth, not diffuse like macOS
- Focus ring: 2px (not 3px like macOS) — `--focus-ring-width: 2px`
- Motion: Fluent easing — `--ease-default: cubic-bezier(0, 0, 0, 1)`

**Dark mode variant:**
```css
:root[data-theme~="windows11"][data-mode="dark"],
[data-theme~="windows11"][data-mode="dark"] {
  color-scheme: dark;
  --win11-mica-bg: oklch(12% 0 0 / 0.8);
  /* ... complete override per template requirements */
}
```

**Component targeting (native elements):**
- `nav` — Mica-style `backdrop-filter: blur(var(--win11-mica-blur))`
- `button` — Fluent accent, 4px radius
- `dialog` — 8px radius, subtle shadow depth
- `button[aria-label="Close"]` — `--win11-close-red` on hover (contextual within theme)

---

### Phase 5: iOS — `src/tokens/themes/_extreme-ios.css`

**Effort:** Medium
**Impact:** Medium — mobile patterns

**Selector:**
```css
:root[data-theme~="ios"],
[data-theme~="ios"] {
```

**Composite tokens:**
```css
--ios-accent: oklch(55% 0.25 260);         /* iOS blue #007aff */
--ios-grouped-bg: oklch(96% 0 0);          /* Grouped table background #f2f2f7 */
--ios-nav-bg: oklch(98% 0 0 / 0.92);
--ios-nav-h: 44px;
--ios-dialog-bg: oklch(96% 0 0 / 0.94);
```

**Key overrides:**
- Font: `system-ui, -apple-system, sans-serif`
- Radii: Pill buttons (`--radius-full`), large cards (16px), sheet dialogs (20px)
  - `--radius-s: 9999px` (pill), `--radius-m: 16px`, `--radius-l: 20px`
- Touch targets: `--size-touch-min: 44px` (iOS HIG minimum)
- Dialogs: Bottom sheet with slide-up animation + `env(safe-area-inset-bottom)`

**Bottom sheet dialog:**
```css
:root[data-theme~="ios"] dialog[open],
[data-theme~="ios"] dialog[open] {
  position: fixed;
  bottom: 0;
  inset-inline: 0;
  top: auto;
  margin: 0;
  border-radius: var(--radius-l) var(--radius-l) 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  animation: ios-slide-up var(--duration-slow) var(--ease-out);
}

@keyframes ios-slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

**Grouped list styling (on native `section` elements):**
```css
:root[data-theme~="ios"] section,
[data-theme~="ios"] section {
  /* Grouped table view: rounded sections with inset separators */
}
```

**Dark mode variant:**
```css
:root[data-theme~="ios"][data-mode="dark"],
[data-theme~="ios"][data-mode="dark"] {
  color-scheme: dark;
  --ios-grouped-bg: oklch(12% 0 0);
  --ios-nav-bg: oklch(15% 0 0 / 0.92);
  /* ... complete override per template requirements */
}
```

---

### Phase 6: Classic Mac — `src/tokens/themes/_extreme-classic-mac.css`

**Effort:** Medium
**Impact:** Medium — educational, retro complement

Covers the Platinum appearance (System 7.5 through Mac OS 9).

**Selector:**
```css
:root[data-theme~="classic-mac"],
[data-theme~="classic-mac"] {
```

**Composite tokens:**
```css
--classic-mac-platinum: oklch(67% 0 0);       /* #ababab — Platinum gray */
--classic-mac-stripe-light: oklch(80% 0 0);   /* Title bar light stripe */
--classic-mac-stripe-dark: oklch(55% 0 0);    /* Title bar dark stripe */
--classic-mac-desktop: oklch(30% 0.08 195);   /* Desktop blue-green */
```

**Key overrides:**
- Font: `'Charcoal', 'Chicago', Arial, sans-serif` (approximation)
- Radii: 3px slight rounding on buttons/dialogs, 0 elsewhere
  - `--radius-s: 3px`, `--radius-m: 0`, `--radius-l: 3px`
- Shadows: Flat black drop shadow on dialogs only
  - `--shadow-xl: 2px 2px 0 oklch(0% 0 0)` (no blur, offset only)
  - `--shadow-md: none`, `--shadow-lg: none` (most things have no shadow)
- Motion: None — `--duration-fast: 0ms`, etc.

**Striped title bar (on `header` within dialog/article):**
```css
:root[data-theme~="classic-mac"] dialog header,
[data-theme~="classic-mac"] dialog header {
  background: repeating-linear-gradient(
    to bottom,
    var(--classic-mac-stripe-light) 0px,
    var(--classic-mac-stripe-light) 1px,
    var(--classic-mac-stripe-dark) 1px,
    var(--classic-mac-stripe-dark) 2px
  );
}
```

**Menu bar (on `nav[role="menubar"]`):**
```css
:root[data-theme~="classic-mac"] nav[role="menubar"],
[data-theme~="classic-mac"] nav[role="menubar"] {
  background: oklch(100% 0 0);
  border-bottom: 1px solid oklch(0% 0 0);
}
```

**Dark mode:** None — Classic Mac had no dark mode. Skip variant.

---

### Phase 7: Material 3 — `src/tokens/themes/_extreme-material.css`

**Effort:** Medium-High
**Impact:** Medium — complex M3 spec

**Selector:**
```css
:root[data-theme~="material"],
[data-theme~="material"] {
```

**Composite tokens:**
```css
--m3-seed: oklch(55% 0.25 260);              /* Seed color for dynamic color */
--m3-on-primary: oklch(100% 0 0);
--m3-surface-tint: oklch(from var(--m3-seed) l 0.02 h);
--m3-ripple: currentColor;                    /* Ripple uses currentColor at 12% */
```

**M3 → VB token mapping:**

| M3 Role | VB Token |
|---|---|
| `primary` | `--color-interactive` |
| `on-primary` | `--color-text-on-primary` |
| `surface` | `--color-background` |
| `surface-variant` | `--color-surface` |
| `on-surface` | `--color-text` |
| `outline` | `--color-border` |
| `error` | `--color-error` |

**Key overrides:**
- Font: `'Google Sans', 'Roboto', system-ui, sans-serif`
- Radii: Pill buttons (`--radius-full`), 28px dialog, 16px card
  - `--radius-s: 9999px`, `--radius-m: 16px`, `--radius-l: 28px`
- Shadows: Gentle, colored — elevation via tonal surfaces, not heavy shadows
- Touch targets: `--size-touch-min: 48px` (Material minimum, larger than iOS)

**CSS-only ripple approximation:**
```css
:root[data-theme~="material"] button,
[data-theme~="material"] button {
  position: relative;
  overflow: hidden;
}

:root[data-theme~="material"] button::after,
[data-theme~="material"] button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--m3-ripple, currentColor);
  opacity: 0;
  border-radius: inherit;
  transform: scale(0);
  transition: transform var(--duration-slow) var(--ease-out), opacity var(--duration-slow);
}

:root[data-theme~="material"] button:active::after,
[data-theme~="material"] button:active::after {
  transform: scale(1);
  opacity: 0.12;
  transition: transform 0s, opacity 0s;
}
```

**Dark mode variant:**
```css
:root[data-theme~="material"][data-mode="dark"],
[data-theme~="material"][data-mode="dark"] {
  color-scheme: dark;
  /* Tonal elevation: surfaces shift lighter instead of using shadows */
  --color-background: oklch(10% 0.01 var(--hue-primary));
  --color-surface: oklch(14% 0.01 var(--hue-primary));
  --color-surface-raised: oklch(18% 0.01 var(--hue-primary));
  /* ... complete override per template requirements */
}
```

---

### Phase 8: System 6 — `src/tokens/themes/_extreme-system6.css`

**Effort:** Low
**Impact:** Low — niche, educational

**Selector:**
```css
:root[data-theme~="system6"],
[data-theme~="system6"] {
```

**Key characteristics:**
- Strictly monochrome: black on white, nothing else
- All radii: `0`
- All shadows: `none`
- All motion: `0ms`
- Checkerboard patterns via `repeating-linear-gradient` for selections and desktop
- Font: monospace fallback

**Dark mode:** None — System 6 was monochrome.

---

### Phase 9: Electron Guide — `site/src/pages/docs/guides/electron.njk`

**Effort:** Low
**Impact:** Low — documentation only, no runtime code

Covers:
- Using `data-os` detection in Electron via `process.platform`
- `titleBarStyle` configuration per platform
- Forwarding `nativeTheme` changes to renderer
- Traffic light accommodation on macOS
- Custom window controls on Windows
- Safe area insets

---

## 4. Priority Order

| # | Phase | File | Effort | Impact |
|---|---|---|---|---|
| 1 | OS Detection | `src/lib/os-detect.js` | Low | Medium |
| 2 | Win 3.1 | `src/tokens/themes/_extreme-win31.css` | Low | Medium |
| 3 | macOS | `src/tokens/themes/_extreme-macos.css` | Medium | High |
| 4 | Windows 11 | `src/tokens/themes/_extreme-windows11.css` | Medium | High |
| 5 | iOS | `src/tokens/themes/_extreme-ios.css` | Medium | Medium |
| 6 | Classic Mac | `src/tokens/themes/_extreme-classic-mac.css` | Medium | Medium |
| 7 | Material 3 | `src/tokens/themes/_extreme-material.css` | Medium-High | Medium |
| 8 | System 6 | `src/tokens/themes/_extreme-system6.css` | Low | Low |
| 9 | Electron docs | `site/src/pages/docs/guides/electron.njk` | Low | Low |

---

## 5. Files Reference

### New Files

| File | Phase | Purpose |
|---|---|---|
| `src/lib/os-detect.js` | 1 | OS detection, sets `data-os` |
| `src/tokens/themes/_extreme-win31.css` | 2 | Windows 3.1 flat theme |
| `src/tokens/themes/_extreme-macos.css` | 3 | macOS Sonoma/Sequoia theme |
| `src/tokens/themes/_extreme-windows11.css` | 4 | Windows 11 Fluent theme |
| `src/tokens/themes/_extreme-ios.css` | 5 | iOS 17+ theme |
| `src/tokens/themes/_extreme-classic-mac.css` | 6 | Classic Mac Platinum |
| `src/tokens/themes/_extreme-material.css` | 7 | Material Design 3 |
| `src/tokens/themes/_extreme-system6.css` | 8 | Mac System 6 monochrome |
| `site/src/pages/docs/guides/electron.njk` | 9 | Electron integration guide |

### Modified Files

| File | Change |
|---|---|
| `src/lib/theme-manager.js` | Optional `autoTheme()` method import + delegation |

### Reference Patterns (Read, Don't Modify)

| File | Pattern to Follow |
|---|---|
| `src/tokens/themes/_extreme-win9x.css` | Composite token pattern (`--win9x-raised`, etc.) |
| `src/tokens/themes/_theme-template.css` | Full token override surface, dark mode requirements |
| `src/tokens/themes/_extreme-glassmorphism.css` | `--glass-*` extension reuse |
| `src/tokens/themes/_extreme-terminal.css` | CRT/phosphor effects, box-drawing |

---

## 6. Verification Checklist

Before merging any theme:

- [ ] No `--vb-*` prefixed tokens appear anywhere
- [ ] Selectors use `:root[data-theme~="x"], [data-theme~="x"]` dual pattern
- [ ] Dark mode uses `[data-mode="dark"]`, never `[data-color-scheme="dark"]`
- [ ] Component targeting uses native elements, never CSS classes
- [ ] Composite tokens follow `--{theme-slug}-{purpose}` naming
- [ ] Dark mode variants include complete surface/text/border overrides per template
- [ ] `npm run lint:theme-tokens` passes
- [ ] Color values use `oklch()` (not hex/rgb) for consistency with existing themes
- [ ] All token names verified against source files in `src/tokens/`
