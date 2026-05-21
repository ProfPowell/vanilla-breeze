# Vanilla Breeze Design Token Specification

**Version:** 0.1 — Draft  
**Status:** Working Document  
**Scope:** All tokens required to implement the full theme layer including modern OS and classic system themes

---

## Philosophy

Vanilla Breeze components never write raw values. A button does not know it has `border-radius: 6px`. It knows it has `border-radius: var(--vb-radius-md)`. The theme decides what that means. This single rule is what makes the entire theme system possible.

Every token belongs to one of three layers:

**Primitive tokens** are raw values with no semantic meaning. `--vb-blue-500: #3b82f6`. They exist to be referenced, never to be used directly in components.

**Semantic tokens** map meaning onto primitives. `--vb-color-interactive: var(--vb-blue-500)`. Components use only semantic tokens.

**Component tokens** are overrides scoped to a specific component. `--vb-button-radius: var(--vb-radius-md)`. They allow per-component customization without touching the semantic layer.

Themes override semantic tokens and component tokens only. Primitives are the one thing themes do not touch — they provide a shared vocabulary.

---

## 1. Color Tokens

### 1.1 Primitive Palette

These are the raw color values. Themes do not modify these directly.

```css
:root {
  /* Neutrals */
  --vb-neutral-0:   #ffffff;
  --vb-neutral-50:  #f8f9fa;
  --vb-neutral-100: #f1f3f5;
  --vb-neutral-200: #e9ecef;
  --vb-neutral-300: #dee2e6;
  --vb-neutral-400: #ced4da;
  --vb-neutral-500: #adb5bd;
  --vb-neutral-600: #868e96;
  --vb-neutral-700: #495057;
  --vb-neutral-800: #343a40;
  --vb-neutral-900: #212529;
  --vb-neutral-1000: #000000;

  /* Blue */
  --vb-blue-100: #dbe4ff;
  --vb-blue-300: #74c0fc;
  --vb-blue-500: #339af0;
  --vb-blue-700: #1971c2;
  --vb-blue-900: #1864ab;

  /* Green */
  --vb-green-100: #d3f9d8;
  --vb-green-500: #51cf66;
  --vb-green-700: #2f9e44;

  /* Red */
  --vb-red-100:  #ffe3e3;
  --vb-red-500:  #ff6b6b;
  --vb-red-700:  #c92a2a;

  /* Amber */
  --vb-amber-100: #fff3bf;
  --vb-amber-500: #fcc419;
  --vb-amber-700: #e67700;
}
```

### 1.2 Semantic Color Tokens

These are the tokens components use. Themes override these.

```css
:root {
  /* Surfaces */
  --vb-color-bg:           var(--vb-neutral-0);       /* Page background */
  --vb-color-bg-subtle:    var(--vb-neutral-50);      /* Inset, alternate rows */
  --vb-color-bg-overlay:   var(--vb-neutral-100);     /* Popovers, tooltips */
  --vb-color-bg-raised:    var(--vb-neutral-0);       /* Cards above page */
  --vb-color-bg-sunken:    var(--vb-neutral-100);     /* Wells, code blocks */

  /* Text */
  --vb-color-text:         var(--vb-neutral-900);     /* Body copy */
  --vb-color-text-subtle:  var(--vb-neutral-600);     /* Labels, captions */
  --vb-color-text-muted:   var(--vb-neutral-500);     /* Placeholder, disabled */
  --vb-color-text-inverse: var(--vb-neutral-0);       /* Text on dark bg */
  --vb-color-text-link:    var(--vb-blue-700);

  /* Borders */
  --vb-color-border:       var(--vb-neutral-300);     /* Default borders */
  --vb-color-border-focus: var(--vb-blue-500);        /* Focus ring */
  --vb-color-border-strong: var(--vb-neutral-500);    /* Emphasized borders */

  /* Interactive (buttons, links, accents) */
  --vb-color-interactive:        var(--vb-blue-500);
  --vb-color-interactive-hover:  var(--vb-blue-700);
  --vb-color-interactive-active: var(--vb-blue-900);
  --vb-color-interactive-text:   var(--vb-neutral-0);

  /* Secondary interactive */
  --vb-color-secondary:          var(--vb-neutral-200);
  --vb-color-secondary-hover:    var(--vb-neutral-300);
  --vb-color-secondary-text:     var(--vb-neutral-900);

  /* Semantic states */
  --vb-color-success:      var(--vb-green-700);
  --vb-color-success-bg:   var(--vb-green-100);
  --vb-color-warning:      var(--vb-amber-700);
  --vb-color-warning-bg:   var(--vb-amber-100);
  --vb-color-danger:       var(--vb-red-700);
  --vb-color-danger-bg:    var(--vb-red-100);
  --vb-color-info:         var(--vb-blue-700);
  --vb-color-info-bg:      var(--vb-blue-100);

  /* Selection */
  --vb-color-selection-bg:   var(--vb-blue-100);
  --vb-color-selection-text: var(--vb-blue-900);

  /* Scrollbar */
  --vb-color-scrollbar:      var(--vb-neutral-300);
  --vb-color-scrollbar-track: var(--vb-neutral-100);
}
```

### 1.3 Dark Mode Semantic Overrides

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme-color-scheme="light"]) {
    --vb-color-bg:            #1a1a1a;
    --vb-color-bg-subtle:     #242424;
    --vb-color-bg-overlay:    #2e2e2e;
    --vb-color-bg-raised:     #242424;
    --vb-color-bg-sunken:     #111111;

    --vb-color-text:          var(--vb-neutral-100);
    --vb-color-text-subtle:   var(--vb-neutral-400);
    --vb-color-text-muted:    var(--vb-neutral-500);

    --vb-color-border:        rgba(255,255,255,0.12);
    --vb-color-border-strong: rgba(255,255,255,0.25);

    --vb-color-secondary:     rgba(255,255,255,0.1);
    --vb-color-secondary-hover: rgba(255,255,255,0.15);
    --vb-color-secondary-text: var(--vb-neutral-100);
  }
}
```

---

## 2. Typography Tokens

### 2.1 Font Families

```css
:root {
  /* Stacks — themes override these */
  --vb-font-ui:      system-ui, sans-serif;
  --vb-font-display: system-ui, sans-serif;
  --vb-font-body:    system-ui, sans-serif;
  --vb-font-mono:    ui-monospace, 'Cascadia Code', 'Fira Code', monospace;

  /* Special stacks used by retro themes */
  --vb-font-bitmap:  'Px437 IBM VGA 8x16', 'Perfect DOS VGA 437', monospace;
}
```

> **Note on retro fonts:** Classic themes use web-safe fallbacks and embed pixel fonts via `@font-face`. The `--vb-font-bitmap` token exists specifically for ASCII and DOS themes. Chicago, Charcoal, and MS Sans Serif approximate with Georgia and Tahoma fallbacks since the originals are not freely licensable.

### 2.2 Type Scale

Uses a modular scale (ratio: 1.25). All sizes in `rem` so they respect user font-size preferences.

```css
:root {
  --vb-text-xs:   0.75rem;    /*  12px */
  --vb-text-sm:   0.875rem;   /*  14px */
  --vb-text-md:   1rem;       /*  16px — base */
  --vb-text-lg:   1.125rem;   /*  18px */
  --vb-text-xl:   1.25rem;    /*  20px */
  --vb-text-2xl:  1.5rem;     /*  24px */
  --vb-text-3xl:  1.875rem;   /*  30px */
  --vb-text-4xl:  2.25rem;    /*  36px */
  --vb-text-5xl:  3rem;       /*  48px */
}
```

Retro themes may collapse this scale. Win 3.1 effectively uses two sizes: `--vb-text-sm` for everything and `--vb-text-md` for dialog titles.

### 2.3 Font Weight

```css
:root {
  --vb-weight-light:    300;
  --vb-weight-regular:  400;
  --vb-weight-medium:   500;
  --vb-weight-semibold: 600;
  --vb-weight-bold:     700;
}
```

Bitmap fonts used in retro themes have no weight variants. Those themes override component weight tokens to `400` universally.

### 2.4 Line Height

```css
:root {
  --vb-leading-tight:   1.2;
  --vb-leading-snug:    1.375;
  --vb-leading-normal:  1.5;
  --vb-leading-relaxed: 1.625;
  --vb-leading-loose:   2;
}
```

### 2.5 Letter Spacing

```css
:root {
  --vb-tracking-tight:  -0.02em;
  --vb-tracking-normal:  0;
  --vb-tracking-wide:    0.05em;
  --vb-tracking-wider:   0.1em;
  --vb-tracking-widest:  0.2em;
}
```

---

## 3. Spacing Tokens

A single geometric scale. All spacing in the framework derives from this.

```css
:root {
  --vb-space-0:    0;
  --vb-space-px:   1px;
  --vb-space-0-5:  0.125rem;  /*  2px */
  --vb-space-1:    0.25rem;   /*  4px */
  --vb-space-1-5:  0.375rem;  /*  6px */
  --vb-space-2:    0.5rem;    /*  8px */
  --vb-space-3:    0.75rem;   /* 12px */
  --vb-space-4:    1rem;      /* 16px */
  --vb-space-5:    1.25rem;   /* 20px */
  --vb-space-6:    1.5rem;    /* 24px */
  --vb-space-8:    2rem;      /* 32px */
  --vb-space-10:   2.5rem;    /* 40px */
  --vb-space-12:   3rem;      /* 48px */
  --vb-space-16:   4rem;      /* 64px */
  --vb-space-20:   5rem;      /* 80px */
  --vb-space-24:   6rem;      /* 96px */
}
```

---

## 4. Border & Shape Tokens

### 4.1 Border Radius

This is one of the most expressive theming axes. macOS is softly rounded. Win 3.1 is zero. iOS pills are full.

```css
:root {
  --vb-radius-none:  0;
  --vb-radius-sm:    2px;
  --vb-radius-md:    6px;
  --vb-radius-lg:    10px;
  --vb-radius-xl:    16px;
  --vb-radius-2xl:   24px;
  --vb-radius-full:  9999px;

  /* Semantic aliases — what components use */
  --vb-radius-button:   var(--vb-radius-md);
  --vb-radius-input:    var(--vb-radius-md);
  --vb-radius-card:     var(--vb-radius-lg);
  --vb-radius-dialog:   var(--vb-radius-xl);
  --vb-radius-badge:    var(--vb-radius-full);
  --vb-radius-tooltip:  var(--vb-radius-sm);
  --vb-radius-menu:     var(--vb-radius-lg);
}
```

### 4.2 Border Width

```css
:root {
  --vb-border-0:  0;
  --vb-border-1:  1px;
  --vb-border-2:  2px;
  --vb-border-4:  4px;

  /* Semantic */
  --vb-border-input:    var(--vb-border-1);
  --vb-border-button:   var(--vb-border-1);
  --vb-border-focus:    var(--vb-border-2);
  --vb-border-divider:  var(--vb-border-1);
}
```

### 4.3 Border Style

```css
:root {
  --vb-border-style: solid;

  /* Retro themes use these */
  --vb-border-style-raised-light: #ffffff;   /* 3D bevel highlight */
  --vb-border-style-raised-dark:  #808080;   /* 3D bevel shadow */
  --vb-border-style-sunken-light: #808080;   /* Inset highlight */
  --vb-border-style-sunken-dark:  #000000;   /* Inset shadow */
}
```

The 3D bevel effect used in Win 95/98/3.1 requires four border colors (outer-light, outer-dark, inner-light, inner-dark). These tokens provide the vocabulary. Components in retro mode use `border-color` shorthand with these values.

---

## 5. Shadow Tokens

```css
:root {
  --vb-shadow-none: none;
  --vb-shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
  --vb-shadow-md:   0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --vb-shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  --vb-shadow-xl:   0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);
  --vb-shadow-2xl:  0 25px 50px -12px rgba(0,0,0,0.25);
  --vb-shadow-inset: inset 0 2px 4px rgba(0,0,0,0.05);

  /* Semantic */
  --vb-shadow-card:    var(--vb-shadow-md);
  --vb-shadow-dialog:  var(--vb-shadow-xl);
  --vb-shadow-menu:    var(--vb-shadow-lg);
  --vb-shadow-tooltip: var(--vb-shadow-sm);
  --vb-shadow-button:  var(--vb-shadow-sm);
  --vb-shadow-focus:   0 0 0 3px rgba(59,130,246,0.35);

  /* Elevation — for Material Design theme */
  --vb-elevation-0: none;
  --vb-elevation-1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14);
  --vb-elevation-2: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12);
  --vb-elevation-3: 0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10);
  --vb-elevation-4: 0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05);
}
```

Retro themes set all shadow tokens to `none`. The visual depth in those themes comes entirely from bevel borders, not drop shadows.

---

## 6. Motion Tokens

```css
:root {
  /* Duration */
  --vb-duration-instant:  50ms;
  --vb-duration-fast:     100ms;
  --vb-duration-normal:   200ms;
  --vb-duration-slow:     350ms;
  --vb-duration-slower:   500ms;

  /* Easing */
  --vb-ease-linear:       linear;
  --vb-ease-default:      cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --vb-ease-in:           cubic-bezier(0.4, 0, 1, 1);
  --vb-ease-out:          cubic-bezier(0, 0, 0.2, 1);
  --vb-ease-in-out:       cubic-bezier(0.4, 0, 0.2, 1);
  --vb-ease-spring:       cubic-bezier(0.34, 1.56, 0.64, 1);
  --vb-ease-bounce:       cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Semantic */
  --vb-transition-button:    background var(--vb-duration-fast) var(--vb-ease-default),
                             box-shadow var(--vb-duration-fast) var(--vb-ease-default),
                             transform var(--vb-duration-fast) var(--vb-ease-default);
  --vb-transition-input:     border-color var(--vb-duration-fast) var(--vb-ease-default),
                             box-shadow var(--vb-duration-fast) var(--vb-ease-default);
  --vb-transition-menu:      opacity var(--vb-duration-fast) var(--vb-ease-out),
                             transform var(--vb-duration-fast) var(--vb-ease-out);
}
```

Retro themes collapse all duration tokens to `0ms` and all easing to `linear`. Windows 3.1 had no transitions. The `prefers-reduced-motion` media query must also collapse everything — the framework handles this globally.

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --vb-duration-instant:  0ms;
    --vb-duration-fast:     0ms;
    --vb-duration-normal:   0ms;
    --vb-duration-slow:     0ms;
    --vb-duration-slower:   0ms;
  }
}
```

---

## 7. Effect Tokens

Tokens for visual effects that are OS-specific — blur, vibrancy, backdrop. Themes that cannot use these degrade gracefully.

```css
:root {
  /* Backdrop blur — macOS and Windows 11 use these heavily */
  --vb-blur-sm:   blur(4px);
  --vb-blur-md:   blur(12px);
  --vb-blur-lg:   blur(24px);
  --vb-blur-xl:   blur(48px);

  /* Vibrancy / acrylic — the chromatic tint over blur */
  --vb-vibrancy-bg:        rgba(255,255,255,0.72);
  --vb-vibrancy-bg-dark:   rgba(30,30,30,0.8);
  --vb-vibrancy-border:    rgba(255,255,255,0.2);

  /* Semantic effect assignments */
  --vb-effect-nav-bg:       var(--vb-color-bg);
  --vb-effect-nav-blur:     none;
  --vb-effect-nav-border:   var(--vb-color-border);

  --vb-effect-sidebar-bg:   var(--vb-color-bg-subtle);
  --vb-effect-sidebar-blur: none;

  --vb-effect-dialog-bg:    var(--vb-color-bg);
  --vb-effect-dialog-blur:  none;

  --vb-effect-menu-bg:      var(--vb-color-bg);
  --vb-effect-menu-blur:    none;
}
```

The macOS theme sets `--vb-effect-nav-blur: var(--vb-blur-md)` and `--vb-effect-nav-bg: var(--vb-vibrancy-bg)`. Components just consume `--vb-effect-nav-bg` and `--vb-effect-nav-blur` — they never know if it's vibrancy or a solid color.

---

## 8. Layout Tokens

```css
:root {
  /* Sizing */
  --vb-size-touch-target: 44px;   /* Minimum tappable size — iOS HIG, WCAG */
  --vb-size-icon-sm:      16px;
  --vb-size-icon-md:      20px;
  --vb-size-icon-lg:      24px;

  /* Semantic heights — key for OS integration */
  --vb-height-titlebar:   28px;   /* macOS compact, Windows classic */
  --vb-height-menubar:    24px;   /* Classic Mac, Win 3.1 */
  --vb-height-toolbar:    36px;
  --vb-height-statusbar:  22px;
  --vb-height-scrollbar:  12px;   /* Varies drastically by OS theme */
  --vb-height-input:      var(--vb-size-touch-target);
  --vb-height-button:     var(--vb-size-touch-target);
  --vb-height-menu-item:  28px;

  /* Z-index scale */
  --vb-z-below:    -1;
  --vb-z-base:      0;
  --vb-z-raised:    10;
  --vb-z-dropdown:  100;
  --vb-z-sticky:    200;
  --vb-z-overlay:   300;
  --vb-z-modal:     400;
  --vb-z-toast:     500;
  --vb-z-tooltip:   600;
  --vb-z-titlebar:  700;   /* Always on top in windowed/Electron mode */
}
```

---

## 9. Component Tokens

Component tokens are the last override layer. They map semantic tokens to specific components and can be overridden without touching the semantic layer.

```css
:root {
  /* Button */
  --vb-button-radius:           var(--vb-radius-button);
  --vb-button-height:           var(--vb-height-button);
  --vb-button-padding-x:        var(--vb-space-4);
  --vb-button-font-size:        var(--vb-text-sm);
  --vb-button-font-weight:      var(--vb-weight-semibold);
  --vb-button-letter-spacing:   var(--vb-tracking-normal);
  --vb-button-transition:       var(--vb-transition-button);
  --vb-button-focus-shadow:     var(--vb-shadow-focus);

  /* Input */
  --vb-input-radius:            var(--vb-radius-input);
  --vb-input-height:            var(--vb-height-input);
  --vb-input-padding-x:         var(--vb-space-3);
  --vb-input-font-size:         var(--vb-text-md);
  --vb-input-border:            var(--vb-border-1) solid var(--vb-color-border);
  --vb-input-border-focus:      var(--vb-border-1) solid var(--vb-color-border-focus);
  --vb-input-bg:                var(--vb-color-bg);
  --vb-input-bg-disabled:       var(--vb-color-bg-subtle);
  --vb-input-transition:        var(--vb-transition-input);

  /* Card */
  --vb-card-radius:             var(--vb-radius-card);
  --vb-card-padding:            var(--vb-space-6);
  --vb-card-bg:                 var(--vb-color-bg-raised);
  --vb-card-border:             var(--vb-border-1) solid var(--vb-color-border);
  --vb-card-shadow:             var(--vb-shadow-card);

  /* Dialog */
  --vb-dialog-radius:           var(--vb-radius-dialog);
  --vb-dialog-padding:          var(--vb-space-8);
  --vb-dialog-max-width:        560px;
  --vb-dialog-shadow:           var(--vb-shadow-dialog);
  --vb-dialog-bg:               var(--vb-effect-dialog-bg);
  --vb-dialog-backdrop:         rgba(0,0,0,0.4);
  --vb-dialog-title-size:       var(--vb-text-xl);
  --vb-dialog-title-weight:     var(--vb-weight-semibold);

  /* Menu / Dropdown */
  --vb-menu-radius:             var(--vb-radius-menu);
  --vb-menu-padding:            var(--vb-space-1);
  --vb-menu-item-height:        var(--vb-height-menu-item);
  --vb-menu-item-padding-x:     var(--vb-space-3);
  --vb-menu-item-radius:        var(--vb-radius-sm);
  --vb-menu-bg:                 var(--vb-effect-menu-bg);
  --vb-menu-shadow:             var(--vb-shadow-menu);
  --vb-menu-separator-color:    var(--vb-color-border);

  /* Badge / Tag */
  --vb-badge-radius:            var(--vb-radius-badge);
  --vb-badge-padding-x:         var(--vb-space-2);
  --vb-badge-padding-y:         var(--vb-space-0-5);
  --vb-badge-font-size:         var(--vb-text-xs);
  --vb-badge-font-weight:       var(--vb-weight-semibold);

  /* Tooltip */
  --vb-tooltip-radius:          var(--vb-radius-tooltip);
  --vb-tooltip-padding-x:       var(--vb-space-2);
  --vb-tooltip-padding-y:       var(--vb-space-1);
  --vb-tooltip-font-size:       var(--vb-text-xs);
  --vb-tooltip-bg:              var(--vb-neutral-900);
  --vb-tooltip-color:           var(--vb-neutral-0);
  --vb-tooltip-shadow:          var(--vb-shadow-tooltip);

  /* Navigation */
  --vb-nav-height:              56px;
  --vb-nav-bg:                  var(--vb-effect-nav-bg);
  --vb-nav-border:              var(--vb-border-1) solid var(--vb-effect-nav-border);
  --vb-nav-blur:                var(--vb-effect-nav-blur);
  --vb-nav-item-radius:         var(--vb-radius-sm);
  --vb-nav-item-font-size:      var(--vb-text-sm);
  --vb-nav-item-font-weight:    var(--vb-weight-medium);

  /* Sidebar */
  --vb-sidebar-width:           240px;
  --vb-sidebar-bg:              var(--vb-effect-sidebar-bg);
  --vb-sidebar-blur:            var(--vb-effect-sidebar-blur);
  --vb-sidebar-item-height:     32px;
  --vb-sidebar-item-radius:     var(--vb-radius-sm);
  --vb-sidebar-item-font-size:  var(--vb-text-sm);

  /* Table */
  --vb-table-border:            var(--vb-border-1) solid var(--vb-color-border);
  --vb-table-header-bg:         var(--vb-color-bg-subtle);
  --vb-table-row-hover:         var(--vb-color-bg-subtle);
  --vb-table-stripe:            var(--vb-color-bg-subtle);

  /* Scrollbar */
  --vb-scrollbar-width:         var(--vb-height-scrollbar);
  --vb-scrollbar-color:         var(--vb-color-scrollbar);
  --vb-scrollbar-track:         var(--vb-color-scrollbar-track);
  --vb-scrollbar-radius:        var(--vb-radius-full);

  /* Code */
  --vb-code-font:               var(--vb-font-mono);
  --vb-code-font-size:          0.875em;
  --vb-code-bg:                 var(--vb-color-bg-sunken);
  --vb-code-border:             var(--vb-border-1) solid var(--vb-color-border);
  --vb-code-radius:             var(--vb-radius-sm);
  --vb-code-padding-x:          var(--vb-space-1-5);
  --vb-code-padding-y:          var(--vb-space-0-5);
}
```

---

## 10. Theme Override Reference

The following table documents which tokens each theme category primarily modifies. A theme only needs to set what it changes — all other tokens inherit from the base.

| Token Category | Modern (macOS/Win11) | iOS/Material | Win 95/98 | Win 3.1/Classic Mac | ASCII/Terminal |
|---|---|---|---|---|---|
| `--vb-font-ui` | `system-ui` or variant | `system-ui` | `Tahoma`, `Arial` | `Arial`, monospace fallback | monospace |
| `--vb-radius-button` | `6px` or `4px` | `9999px` | `0` | `0` | `0` |
| `--vb-radius-card` | `10px`–`14px` | `16px` | `0` | `0` | `0` |
| `--vb-radius-dialog` | `14px` | `20px` | `0` | `0` | `0` |
| `--vb-shadow-*` | Soft box-shadows | Elevation | `none` | `none` | `none` |
| `--vb-effect-nav-blur` | `blur(12px)` | `blur(20px)` | `none` | `none` | `none` |
| All `--vb-duration-*` | Normal | Normal | `0ms` | `0ms` | `0ms` |
| `--vb-border-style` | `solid` | `solid` | `solid` (bevel via 4 colors) | `solid` (heavy) | `solid` (ASCII box chars) |
| `--vb-color-bg` | White/near-white | White | `#c0c0c0` | `#c0c0c0` | `#000000` |
| `--vb-color-interactive` | System blue | System blue | `#000080` | `#000080` | `#00ff00` |
| `--vb-color-text` | Near-black | Near-black | `#000000` | `#000000` | `#00ff00` |

---

## 11. Token Naming Conventions

Tokens follow a strict naming pattern:

```
--vb-{category}-{variant}-{modifier}
```

**Categories:** `color`, `font`, `text` (size), `weight`, `leading`, `tracking`, `space`, `radius`, `border`, `shadow`, `duration`, `ease`, `transition`, `blur`, `size`, `height`, `z`

**Variants:** descriptive names (`bg`, `text`, `border`) or scale steps (`sm`, `md`, `lg`) or numeric steps (`100`, `200`, `500`)

**Modifiers (optional):** `hover`, `active`, `focus`, `disabled`, `dark`, `inverse`

Component tokens follow:

```
--vb-{component}-{property}
```

Where `component` is the element name (`button`, `input`, `card`, `dialog`, `menu`, `nav`, `sidebar`) and `property` is what it controls (`radius`, `bg`, `shadow`, `height`, `padding-x`).

---

## 12. Implementing a Theme

A complete minimal theme override file looks like this:

```css
/* themes/retro/win98.css */
[data-theme="win98"] {
  /* Typography */
  --vb-font-ui:      'Tahoma', 'Arial', sans-serif;
  --vb-font-display: 'Tahoma', 'Arial', sans-serif;
  --vb-font-body:    'Tahoma', 'Arial', sans-serif;

  /* Colors */
  --vb-color-bg:            #d4d0c8;
  --vb-color-bg-subtle:     #d4d0c8;
  --vb-color-bg-raised:     #d4d0c8;
  --vb-color-bg-sunken:     #808080;
  --vb-color-text:          #000000;
  --vb-color-text-subtle:   #444444;
  --vb-color-border:        #808080;
  --vb-color-interactive:   #000080;
  --vb-color-interactive-text: #ffffff;
  --vb-color-secondary:     #d4d0c8;

  /* Shape — everything square */
  --vb-radius-button:   0;
  --vb-radius-input:    0;
  --vb-radius-card:     0;
  --vb-radius-dialog:   0;
  --vb-radius-menu:     0;
  --vb-radius-badge:    0;
  --vb-radius-tooltip:  0;
  --vb-radius-scrollbar: 0;

  /* No shadows, no blur, no motion */
  --vb-shadow-card:   none;
  --vb-shadow-dialog: none;
  --vb-shadow-menu:   none;
  --vb-shadow-button: none;
  --vb-effect-nav-blur: none;

  --vb-duration-instant:  0ms;
  --vb-duration-fast:     0ms;
  --vb-duration-normal:   0ms;
  --vb-duration-slow:     0ms;

  /* Bevel border vocabulary */
  --vb-border-style-raised-light: #ffffff;
  --vb-border-style-raised-dark:  #808080;
  --vb-border-style-sunken-light: #808080;
  --vb-border-style-sunken-dark:  #000000;
}
```

That is the complete token override for Win 98. The bevel effect itself is handled in `win98.css` via `border-color` on individual components — the tokens provide the four colors, the component CSS applies them.

---

## Appendix A — Token Count Summary

| Layer | Token Count |
|---|---|
| Color primitives | 28 |
| Color semantic | 34 |
| Typography | 22 |
| Spacing | 17 |
| Border & Shape | 16 |
| Shadow | 14 |
| Motion | 14 |
| Effects | 12 |
| Layout | 18 |
| Component | 68 |
| **Total** | **243** |

243 tokens. Enough to skin anything, few enough to understand in an afternoon.

---

## Appendix B — Token File Organization

```
vanilla-breeze/
  tokens/
    _primitives.css      ← Color palette, never imported by themes
    _semantic.css        ← The 243 tokens, references primitives
    _dark.css            ← Dark mode overrides for semantic layer
    _reduced-motion.css  ← Collapses all duration tokens
  themes/
    modern/
      macos.css          ← Overrides ~40 tokens
      windows11.css      ← Overrides ~35 tokens
      ios.css            ← Overrides ~30 tokens
      material.css       ← Overrides ~45 tokens
    retro/
      win98.css          ← Overrides ~60 tokens + adds bevel CSS
      win95.css          ← Variant of win98.css
      win31.css          ← Overrides ~70 tokens + adds heavy border CSS
      classic-mac.css    ← Overrides ~65 tokens + adds platinum CSS
      ascii.css          ← Overrides ~80 tokens + adds box-drawing CSS
```

---

*Vanilla Breeze Design Token Specification v0.1 — Working Draft*