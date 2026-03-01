# Vanilla Breeze OS Integration & Classic System Emulation

**Version:** 0.1 — Draft  
**Status:** Working Document  
**Scope:** Native OS theme integration for Electron and web, and faithful recreation of classic operating system UI conventions

---

## Overview

A web application that looks like it belongs on the host OS is rarer than it should be. Most Electron apps look like Chrome with a logo. Most web apps ignore the OS entirely. Vanilla Breeze takes a different position: with the token architecture in place, an application can adapt to its environment — automatically matching macOS, Windows, iOS, or Android — while remaining a single codebase of semantic HTML.

This document covers two distinct but related concerns. First, how to detect and integrate with modern operating systems including automatic theming, OS chrome conventions, and system API access from Electron. Second, how to faithfully recreate the visual language of historical operating systems — not as joke skins but as educational artifacts and serious retro aesthetics.

---

## Part 1: Modern OS Integration

### 1.1 Detection Strategy

OS detection lives in JavaScript and writes a single attribute to `<html>`. Everything after that is CSS.

```js
// vb-os-detect.js
function detectOS() {
  const ua = navigator.userAgent;
  const platform = navigator.platform || '';

  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) return 'macos';
  if (/Win32|Win64|Windows|WinCE/.test(ua))          return 'windows';
  if (/iPhone|iPad|iPod/.test(ua))                   return 'ios';
  if (/Android/.test(ua))                             return 'android';
  if (/Linux/.test(platform))                         return 'linux';
  return 'default';
}

function detectColorScheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light';
}

function applyOSTheme() {
  const os = detectOS();
  const scheme = detectColorScheme();
  const root = document.documentElement;

  root.dataset.os = os;
  root.dataset.colorScheme = scheme;

  // Map OS to theme
  const themeMap = {
    macos:   'macos',
    windows: 'windows11',
    ios:     'ios',
    android: 'material',
    linux:   'default',
    default: 'default',
  };

  root.dataset.theme = themeMap[os];
}

// Apply immediately (before paint) and on scheme change
applyOSTheme();
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', applyOSTheme);
```

In Electron, the renderer gets better information via IPC:

```js
// In Electron renderer process
const { ipcRenderer } = require('electron');

async function applyOSTheme() {
  const { platform, nativeTheme } = await ipcRenderer.invoke('get-os-info');
  // platform: 'darwin' | 'win32' | 'linux'
  // nativeTheme: 'dark' | 'light' | 'system'
  
  const themeMap = { darwin: 'macos', win32: 'windows11', linux: 'default' };
  document.documentElement.dataset.theme = themeMap[platform];
  document.documentElement.dataset.colorScheme = nativeTheme;
}
```

```js
// In Electron main process
ipcMain.handle('get-os-info', () => ({
  platform: process.platform,
  nativeTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}));

// Notify renderer when system theme changes
nativeTheme.on('updated', () => {
  win.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
});
```

### 1.2 macOS Theme

**Visual signature:** SF Pro text (system-ui on macOS resolves to this), vibrancy/blur sidebars and toolbars, 14px rounded corners on dialogs, traffic light window controls, subtle separator lines rather than heavy borders, sidebar with translucent frosted glass effect.

**Key token overrides:**

```css
[data-theme="macos"] {
  --vb-font-ui:      system-ui, -apple-system, sans-serif;
  --vb-font-display: system-ui, -apple-system, sans-serif;

  --vb-radius-button:  6px;
  --vb-radius-input:   6px;
  --vb-radius-card:    10px;
  --vb-radius-dialog:  14px;
  --vb-radius-menu:    8px;

  /* Vibrancy sidebar */
  --vb-effect-sidebar-bg:   rgba(255,255,255,0.65);
  --vb-effect-sidebar-blur: blur(20px);

  /* Translucent toolbar */
  --vb-effect-nav-bg:       rgba(246,246,246,0.85);
  --vb-effect-nav-blur:     blur(16px);
  --vb-effect-nav-border:   rgba(0,0,0,0.1);

  /* System blue accent */
  --vb-color-interactive:        #007aff;
  --vb-color-interactive-hover:  #0056d6;
  --vb-color-border-focus:       #007aff;
  --vb-shadow-focus:             0 0 0 3px rgba(0,122,255,0.35);

  /* macOS shadows are very soft */
  --vb-shadow-card:    0 2px 8px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08);
  --vb-shadow-dialog:  0 22px 70px rgba(0,0,0,0.4);
  --vb-shadow-menu:    0 8px 24px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1);

  --vb-height-titlebar: 28px;
  --vb-height-menu-item: 22px;
}

[data-theme="macos"][data-color-scheme="dark"] {
  --vb-effect-sidebar-bg:   rgba(40,40,40,0.75);
  --vb-effect-nav-bg:       rgba(32,32,32,0.85);
  --vb-color-bg:            #1c1c1e;
  --vb-color-bg-subtle:     #2c2c2e;
  --vb-color-bg-raised:     #2c2c2e;
  --vb-color-border:        rgba(255,255,255,0.1);
}
```

**Electron-specific — traffic light buttons:**

In Electron on macOS, `titleBarStyle: 'hiddenInset'` exposes the traffic lights inside the web content area. The window chrome must accommodate this:

```css
/* Only applies in Electron on macOS */
[data-platform="darwin"] .app-titlebar {
  -webkit-app-region: drag;
  padding-left: 80px;  /* Clear the traffic light buttons */
  height: var(--vb-height-titlebar);
}

[data-platform="darwin"] .app-titlebar button,
[data-platform="darwin"] .app-titlebar input {
  -webkit-app-region: no-drag;  /* Buttons must opt out of draggable region */
}
```

**macOS sidebar conventions:**

The macOS sidebar uses `NSVisualEffectView` for vibrancy. In a web context this is approximated with `backdrop-filter: blur()` on a semi-transparent background. Items are 22px tall, have 4px inset radius, and the selected item uses the system accent color at about 15% opacity with the full-opacity label.

```css
[data-theme="macos"] .sidebar-item {
  height: 22px;
  padding-inline: var(--vb-space-2);
  border-radius: 5px;
  font-size: 13px;
}

[data-theme="macos"] .sidebar-item[aria-current] {
  background: rgba(0,122,255,0.15);
  color: #007aff;
}
```

**macOS menu conventions:**

Menus appear on the same layer as the content (not elevated with heavy shadows), have a very subtle border, and use blur. Keyboard shortcut glyphs (`⌘⇧⌥⌃`) appear right-aligned.

---

### 1.3 Windows 11 Theme

**Visual signature:** Segoe UI Variable (the new Fluent font), Mica/Acrylic material on title bar and sidebar, 8px rounded corners universally, subtle depth through shadow rather than borders, Fluent icons. Windows 11 uses a more saturated accent color and has a more prominent focus indicator than macOS.

```css
[data-theme="windows11"] {
  --vb-font-ui:      'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;

  --vb-radius-button:  4px;
  --vb-radius-input:   4px;
  --vb-radius-card:    8px;
  --vb-radius-dialog:  8px;
  --vb-radius-menu:    8px;

  /* Acrylic titlebar effect */
  --vb-effect-nav-bg:    rgba(243,243,243,0.8);
  --vb-effect-nav-blur:  blur(40px);   /* Mica uses stronger blur */
  --vb-effect-nav-border: rgba(0,0,0,0.07);

  /* Fluent accent — Windows default is a mid blue */
  --vb-color-interactive:       #0067c0;
  --vb-color-interactive-hover: #003e92;
  --vb-shadow-focus:            0 0 0 2px #0067c0;  /* Win11 uses 2px, not 3px */

  --vb-height-titlebar:  32px;
  --vb-height-menu-item: 36px;   /* Fluent targets are larger than macOS */
}
```

**Electron — Windows title bar:**

Windows does not natively expose its title bar controls into web content. The standard approach is `titleBarStyle: 'hidden'` with custom controls:

```html
<!-- Windows custom titlebar -->
<div class="win-titlebar" data-platform="win32">
  <img class="win-app-icon" src="icon.png" alt="">
  <span class="win-app-name">My App</span>
  <nav class="win-menubar">
    <button>File</button>
    <button>Edit</button>
    <button>View</button>
  </nav>
  <div class="win-controls">
    <button class="win-btn-minimize" aria-label="Minimize">&#x2012;</button>
    <button class="win-btn-maximize" aria-label="Maximize">&#x25A1;</button>
    <button class="win-btn-close" aria-label="Close">&#x2715;</button>
  </div>
</div>
```

The close button gets `background: #c42b1c` on hover — that red is the exact Windows 11 close button color and users will notice if it is wrong.

---

### 1.4 iOS Theme

**Visual signature:** SF Rounded feel via `system-ui` on iOS, full-radius pill buttons, grouped table-view style lists, sheet dialogs that slide up from the bottom, large tap targets (44px minimum), bottom sheet drawer as the primary modal, blur cards.

```css
[data-theme="ios"] {
  --vb-font-ui:     system-ui, -apple-system, sans-serif;

  --vb-radius-button:  9999px;   /* Pill */
  --vb-radius-input:   10px;
  --vb-radius-card:    16px;
  --vb-radius-dialog:  20px;     /* iOS sheets */
  --vb-radius-menu:    14px;
  --vb-radius-badge:   9999px;

  --vb-size-touch-target: 44px;  /* iOS HIG minimum */

  /* iOS sheet blur */
  --vb-effect-dialog-bg:    rgba(242,242,247,0.94);
  --vb-effect-dialog-blur:  blur(40px);

  /* Navigation bar blur */
  --vb-effect-nav-bg:    rgba(249,249,249,0.92);
  --vb-effect-nav-blur:  blur(20px);
  --vb-nav-height:       44px;   /* iOS nav bar height */

  /* iOS blue */
  --vb-color-interactive: #007aff;

  /* Grouped list style */
  --vb-color-bg-subtle: #f2f2f7;
}
```

**Bottom sheet as `<dialog>`:**

```css
[data-theme="ios"] dialog {
  position: fixed;
  bottom: 0;
  inset-inline: 0;
  top: auto;
  margin: 0;
  border-radius: var(--vb-radius-dialog) var(--vb-radius-dialog) 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  animation: slide-up var(--vb-duration-slow) var(--vb-ease-out);
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

**Grouped table view pattern:**

iOS's table view style — rounded grouped sections with chevrons — is achievable entirely with existing HTML elements:

```css
[data-theme="ios"] .list-group {
  background: var(--vb-color-bg-raised);
  border-radius: var(--vb-radius-card);
  overflow: hidden;
  margin-block: var(--vb-space-4);
}

[data-theme="ios"] .list-group-item {
  display: flex;
  align-items: center;
  gap: var(--vb-space-3);
  padding: var(--vb-space-3) var(--vb-space-4);
  min-height: 44px;
  border-bottom: 1px solid var(--vb-color-border);
}

[data-theme="ios"] .list-group-item:last-child { border-bottom: none; }
```

---

### 1.5 Material Design 3 Theme

**Visual signature:** Dynamic color derived from a seed color, M3 type scale (Display/Headline/Body/Label), 16px rounded corners by default, FAB (Floating Action Button), ripple on interaction, elevation expressed as tone-on-tone rather than heavy shadows, bottom navigation bar.

Material differs from the other themes in that it has a formal design token system of its own. The strategy is to map M3 roles onto VB tokens:

| M3 Role | VB Token |
|---|---|
| `primary` | `--vb-color-interactive` |
| `on-primary` | `--vb-color-interactive-text` |
| `surface` | `--vb-color-bg` |
| `surface-variant` | `--vb-color-bg-subtle` |
| `on-surface` | `--vb-color-text` |
| `outline` | `--vb-color-border` |
| `error` | `--vb-color-danger` |

```css
[data-theme="material"] {
  --vb-font-ui:      'Google Sans', 'Roboto', system-ui, sans-serif;
  --vb-font-display: 'Google Sans Display', 'Google Sans', system-ui, sans-serif;

  --vb-radius-button:  9999px;   /* M3 filled button is full pill */
  --vb-radius-input:   4px;      /* M3 text field has bottom-border style, not full border */
  --vb-radius-card:    16px;
  --vb-radius-dialog:  28px;
  --vb-radius-menu:    8px;

  --vb-height-menu-item: 48px;   /* M3 list items are 48px */
  --vb-size-touch-target: 48px;  /* Material minimum */

  /* No blurs — elevation via tonal color */
  --vb-effect-nav-blur: none;

  /* Elevation shadows are gentle and colored */
  --vb-shadow-card:   0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14);
  --vb-shadow-dialog: 0 11px 15px rgba(0,0,0,0.2), 0 9px 46px rgba(0,0,0,0.12);
}
```

**Ripple effect** — Material's most distinctive interaction. Requires a small JS utility to add the expanding circle on click. Pure CSS with `:active` and `clip-path` animation can approximate it without JS.

```css
[data-theme="material"] .btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  border-radius: inherit;
  transform: scale(0);
  transition: transform 0.3s var(--vb-ease-out), opacity 0.3s;
}

[data-theme="material"] .btn:active::after {
  transform: scale(1);
  opacity: 0.12;
  transition: transform 0s, opacity 0s;
}
```

---

### 1.6 User Override and Persistence

Users should be able to override the auto-detected theme. This preference persists via `localStorage`:

```js
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('vb-theme', theme);
}

function loadSavedTheme() {
  const saved = localStorage.getItem('vb-theme');
  if (saved) {
    document.documentElement.dataset.theme = saved;
  } else {
    applyOSTheme();  // Fall back to auto-detect
  }
}
```

The theme switcher UI is itself unstyled — it uses `<select>` or radio buttons. The themes apply to everything including the theme switcher, which means each theme styles its own controls. Worth testing.

---

## Part 2: Classic System Emulation

### 2.1 Philosophy of Retro UI

These are not joke themes. They are historically accurate recreations of operating system UI conventions from specific eras. Each one teaches something about how interface design evolved, why certain patterns emerged, and what was lost and gained with each generation.

For the Vanilla Breeze project, the retro themes serve three purposes:

**Educational.** Students see that the web has had drop shadows for twenty years but Windows 3.1 never did. They see that the bevel effect is four border colors, not a CSS property. They see that you can build any visual language on top of semantic HTML — the elements stay the same, the presentation changes entirely.

**Demonstration.** Nothing makes the token system's power more obvious than loading `data-theme="ascii"` on the same HTML that was showing `data-theme="macos"` two seconds ago.

**Aesthetic.** Retro UI is genuinely fashionable among developers and designers who grew up with these systems. A well-executed Win 98 theme on a modern web app is not ironic — it is nostalgic and delightful.

---

### 2.2 The 3D Bevel System (Windows 3.1 through 98)

The single most important technique in Windows UI from 3.1 through 98 is the 3D bevel effect. It uses no gradients, no shadows, no transparency. It uses four border colors on a flat gray surface to create the illusion of depth.

**Raised element (button at rest, panel, frame):**

```
Top:    bright white (#ffffff)
Left:   bright white (#ffffff)
Bottom: dark gray (#808080) with black outer edge (#000000)
Right:  dark gray (#808080) with black outer edge (#000000)
```

**Sunken element (pressed button, input field, list box):**

```
Top:    dark gray (#808080) with black outer edge (#000000)
Left:   dark gray (#808080) with black outer edge (#000000)
Bottom: bright white (#ffffff)
Right:  bright white (#ffffff)
```

In CSS, this is two or three nested `border` declarations, or an `outline` in combination with `border`. The full Windows 98 look requires two sets of borders — the outer border and an inner border — totaling 4 pixels of chrome on each raised element.

```css
/* Raised button — Win95/98 style */
.win9x-raised {
  border-top:    2px solid #ffffff;
  border-left:   2px solid #ffffff;
  border-bottom: 2px solid #000000;
  border-right:  2px solid #000000;
  outline: 2px solid #808080;
  outline-offset: -4px;
  /* Gives: white outer, gray inner on top/left; black outer, gray inner on bottom/right */
}

.win9x-raised:active {
  border-top:    2px solid #000000;
  border-left:   2px solid #000000;
  border-bottom: 2px solid #ffffff;
  border-right:  2px solid #ffffff;
}
```

The background color for all Win95/98 UI elements is `#c0c0c0` — "button face gray." This is one of the sixteen standard VGA colors and was the default across nearly all Windows installations until themes became mainstream in XP.

**Title bar gradients (Win98 only, not 95 or 3.1):**

```css
/* Win98 active titlebar */
.win98-titlebar-active {
  background: linear-gradient(to right, #000080, #1084d0);
  color: #ffffff;
}

/* Win98 inactive titlebar */
.win98-titlebar-inactive {
  background: linear-gradient(to right, #808080, #b0b0b0);
  color: #c0c0c0;
}
```

Win95 uses flat `#000080` (navy) for the active title bar and `#808080` for inactive. Win98 adds the gradient. Windows 3.1 uses flat `#000080` for active and a different pattern entirely.

---

### 2.3 Windows 3.1

Windows 3.1 predates the bevel. It uses a simpler border system: black 1px borders on everything, no depth illusion, very flat. The UI is closer to a drawing on graph paper than a physical metaphor.

**Key characteristics:**

The default font is `MS Sans Serif` at 8pt — a bitmap font that does not exist on modern systems. The closest web-safe approximation is `Arial` at 11px or `Tahoma` at 11px. For maximum accuracy, a pixel font web font can be loaded (`@font-face` pointing to a preserved copy of MS Sans Serif or a legally clear substitute).

Colors are strictly from the 16-color VGA palette: `#000000`, `#800000`, `#008000`, `#808000`, `#000080`, `#800080`, `#008080`, `#c0c0c0`, `#808080`, `#ff0000`, `#00ff00`, `#ffff00`, `#0000ff`, `#ff00ff`, `#00ffff`, `#ffffff`. The OS could display more colors but the UI itself used only these.

Dialog boxes have a thick black border (2px), a gray background (`#c0c0c0`), and a title bar of flat `#000080`. There are no drop shadows. There is no transparency. Buttons are flat gray with a 1px black border and a 1px white inset highlight on top/left.

```css
[data-theme="win31"] {
  --vb-font-ui:            'Arial', 'Helvetica', sans-serif;
  --vb-color-bg:           #c0c0c0;
  --vb-color-text:         #000000;
  --vb-color-interactive:  #000080;
  --vb-color-border:       #000000;

  /* Everything square */
  --vb-radius-button:  0;
  --vb-radius-card:    0;
  --vb-radius-dialog:  0;
  --vb-radius-input:   0;
  --vb-radius-menu:    0;

  /* No motion, no shadow, no blur */
  --vb-shadow-card:   none;
  --vb-shadow-dialog: none;
  --vb-shadow-menu:   none;

  /* Flat button border */
  --vb-button-border: 1px solid #000000;
}

[data-theme="win31"] button {
  background: #c0c0c0;
  border: 1px solid #000000;
  /* Simple inner highlight */
  box-shadow: inset 1px 1px 0 #ffffff;
  padding: 2px 8px;
  font-size: 11px;
  min-height: 24px;
}

[data-theme="win31"] button:active {
  box-shadow: inset 1px 1px 0 #808080;
}
```

**Program Manager / File Manager grid:**

The iconic Win 3.1 program group window uses an icon grid. This maps directly to CSS Grid with `<figure>` and `<figcaption>`:

```css
[data-theme="win31"] .program-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, 64px);
  gap: 8px;
  padding: 4px;
}

[data-theme="win31"] .program-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 4px;
  width: 64px;
}

[data-theme="win31"] .program-icon:focus {
  outline: 1px dotted #000000;
}

[data-theme="win31"] .program-icon figcaption {
  font-size: 11px;
  text-align: center;
  color: #000000;
  word-break: break-word;
}
```

---

### 2.4 Classic Mac (System 6 through Mac OS 9)

Apple's classic Mac OS had a distinct visual language that it maintained — with gradual evolution — from 1984 through 2001. The Macintosh Human Interface Guidelines were the gold standard for UI documentation in the industry for most of this period.

**The Platinum appearance (System 7.5 through OS 9):**

The Platinum appearance, introduced in System 7.5, is the canonical "classic Mac" look. Background is a medium gray (`#ababab`) rather than Windows' `#c0c0c0`. Scroll bars use a distinctive pattern of directional arrows at both ends of the bar (not just at opposite ends, as in Windows). The menu bar is white with a thin 1px black bottom border. Active windows have a striped title bar.

```css
[data-theme="classic-mac"] {
  --vb-font-ui:    'Charcoal', 'Chicago', 'Arial', sans-serif;
  --vb-color-bg:   #ababab;    /* Platinum gray — slightly darker than Win9x */
  --vb-color-text: #000000;

  --vb-radius-button:  3px;   /* Mac had slightly rounded buttons even then */
  --vb-radius-card:    0;
  --vb-radius-dialog:  3px;

  --vb-shadow-dialog:  2px 2px 0 #000000;  /* Flat black drop shadow on dialogs */
  --vb-shadow-card:    none;
}

/* Striped title bar — the classic Mac hallmark */
[data-theme="classic-mac"] .window-titlebar {
  background:
    repeating-linear-gradient(
      to bottom,
      #c8c8c8 0px, #c8c8c8 1px,
      #888888 1px, #888888 2px
    );
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1px solid #000000;
}

/* Small close box — top left */
[data-theme="classic-mac"] .window-close {
  position: absolute;
  left: 4px;
  width: 12px;
  height: 12px;
  border: 1px solid #000000;
  background: var(--vb-color-bg);
}

/* Window title — centered in striped bar */
[data-theme="classic-mac"] .window-title {
  font-size: 12px;
  font-weight: bold;
  background: var(--vb-color-bg);
  padding: 0 4px;
  z-index: 1;
}
```

**The Mac menu bar:**

Classic Mac menus appear only on the top menu bar, never contextually on the element. The menu bar is always white. Menu items use a distinctive selection style: full-width dark blue/black highlight with white inverted text.

```css
[data-theme="classic-mac"] .menubar {
  background: #ffffff;
  border-bottom: 1px solid #000000;
  display: flex;
  height: 20px;
  align-items: stretch;
  padding-inline: 4px;
}

[data-theme="classic-mac"] .menubar-item {
  padding: 0 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  cursor: default;
}

[data-theme="classic-mac"] .menubar-item:hover,
[data-theme="classic-mac"] .menubar-item[aria-expanded="true"] {
  background: #000080;
  color: #ffffff;
}
```

**System 6 and earlier (monochrome):**

System 6 and earlier were primarily monochrome. The entire UI is `#000000` on `#ffffff` with no gray whatsoever. The pattern fills used for selections and window chrome are CSS-repeating checkerboard patterns:

```css
[data-theme="system6"] {
  --vb-color-bg:         #ffffff;
  --vb-color-text:       #000000;
  --vb-color-interactive: #000000;
  --vb-color-interactive-text: #ffffff;
}

/* Mac 1-bit checkerboard selection pattern */
[data-theme="system6"] ::selection {
  background-image:
    repeating-linear-gradient(
      45deg,
      #000 0, #000 1px,
      transparent 0, transparent 50%
    );
  background-size: 2px 2px;
  color: #000000;
}

/* Desktop pattern */
[data-theme="system6"] body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image:
    repeating-linear-gradient(
      45deg,
      #808080 25%, transparent 25%, transparent 75%, #808080 75%, #808080
    ),
    repeating-linear-gradient(
      45deg,
      #808080 25%, #ffffff 25%, #ffffff 75%, #808080 75%, #808080
    );
  background-size: 2px 2px;
  background-position: 0 0, 1px 1px;
}
```

---

### 2.5 ASCII / Terminal Theme

The ASCII theme is not a recreation of a specific OS. It is the aesthetic of text-mode interfaces — DOS, Unix terminals, BBS systems, and contemporary developer tooling that embraces monospace culture. It is arguably the most usable of the retro themes in a real application context.

**Core constraints:**

Every element is monospace. Every interaction is keyboard-first. Color is restricted to the ANSI 16-color palette (or a subset). Borders use box-drawing characters, not CSS `border`. The cursor blinks.

**Box-drawing characters as borders:**

The key insight is that box-drawing characters are Unicode text and can be placed with CSS `content` in pseudo-elements. This means the CSS `border` property is set to `none` on all elements, and the visual border comes from generated content.

```css
[data-theme="ascii"] {
  --vb-font-ui:      'Courier New', 'Lucida Console', monospace;
  --vb-font-mono:    'Courier New', 'Lucida Console', monospace;

  --vb-color-bg:            #000000;
  --vb-color-text:          #00ff00;   /* Classic green phosphor */
  --vb-color-text-subtle:   #008000;
  --vb-color-interactive:   #00ff00;
  --vb-color-interactive-text: #000000;
  --vb-color-border:        #00ff00;
  --vb-color-bg-raised:     #001a00;

  /* No shadows, no blur, no radius */
  --vb-radius-button:  0;
  --vb-radius-card:    0;
  --vb-radius-dialog:  0;

  --vb-shadow-card:    none;
  --vb-shadow-dialog:  none;
  --vb-shadow-menu:    none;
  --vb-effect-nav-blur: none;

  /* No motion */
  --vb-duration-fast:   0ms;
  --vb-duration-normal: 0ms;
  --vb-duration-slow:   0ms;
}
```

**Box-drawing via pseudo-elements:**

The box-drawing set in Unicode is `U+2500–U+257F`. The key characters:

```
─   U+2500   BOX DRAWINGS LIGHT HORIZONTAL
│   U+2502   BOX DRAWINGS LIGHT VERTICAL
┌   U+250C   BOX DRAWINGS LIGHT DOWN AND RIGHT
┐   U+2510   BOX DRAWINGS LIGHT DOWN AND LEFT
└   U+2514   BOX DRAWINGS LIGHT UP AND RIGHT
┘   U+2518   BOX DRAWINGS LIGHT UP AND LEFT
├   U+251C   BOX DRAWINGS LIGHT VERTICAL AND RIGHT
┤   U+2524   BOX DRAWINGS LIGHT VERTICAL AND LEFT
┬   U+252C   BOX DRAWINGS LIGHT DOWN AND HORIZONTAL
┴   U+2534   BOX DRAWINGS LIGHT UP AND HORIZONTAL
┼   U+253C   BOX DRAWINGS LIGHT VERTICAL AND HORIZONTAL
═   U+2550   BOX DRAWINGS DOUBLE HORIZONTAL
║   U+2551   BOX DRAWINGS DOUBLE VERTICAL
╔   U+2554   BOX DRAWINGS DOUBLE DOWN AND RIGHT
╗   U+2557   BOX DRAWINGS DOUBLE DOWN AND LEFT
╚   U+255A   BOX DRAWINGS DOUBLE UP AND RIGHT
╝   U+255D   BOX DRAWINGS DOUBLE UP AND LEFT
╠   U+2560   BOX DRAWINGS DOUBLE VERTICAL AND RIGHT
╣   U+2563   BOX DRAWINGS DOUBLE VERTICAL AND LEFT
```

For CSS-based box drawing, the practical approach is `outline` with a monospace-matched gap, combined with a custom border utility:

```css
[data-theme="ascii"] .card {
  border: 1px solid var(--vb-color-border);
  position: relative;
  padding: 1ch 2ch;
  font-family: var(--vb-font-mono);
}

/* Replace CSS border with actual box-drawing character header */
[data-theme="ascii"] .card-title::before {
  content: '┌';
  position: absolute;
  top: -0.6em;
  left: -1ch;
}
```

The more robust approach for actual box-drawing is a JavaScript utility that wraps content in a text-mode box using `<pre>` with the corner and edge characters generated programmatically. This is worth building as a Vanilla Breeze component specifically for the ASCII theme.

**ANSI color palette:**

```css
[data-theme="ascii"] {
  /* ANSI 16 colors as custom properties */
  --ansi-black:          #000000;
  --ansi-red:            #aa0000;
  --ansi-green:          #00aa00;
  --ansi-yellow:         #aa5500;
  --ansi-blue:           #0000aa;
  --ansi-magenta:        #aa00aa;
  --ansi-cyan:           #00aaaa;
  --ansi-white:          #aaaaaa;
  --ansi-bright-black:   #555555;
  --ansi-bright-red:     #ff5555;
  --ansi-bright-green:   #55ff55;
  --ansi-bright-yellow:  #ffff55;
  --ansi-bright-blue:    #5555ff;
  --ansi-bright-magenta: #ff55ff;
  --ansi-bright-cyan:    #55ffff;
  --ansi-bright-white:   #ffffff;
}
```

**Amber and green phosphor variants:**

```css
[data-theme="ascii"][data-ascii-variant="amber"] {
  --vb-color-bg:   #1a0f00;
  --vb-color-text: #ffb000;
  --vb-color-border: #cc8800;
}

[data-theme="ascii"][data-ascii-variant="white"] {
  --vb-color-bg:   #000000;
  --vb-color-text: #dddddd;
  --vb-color-border: #aaaaaa;
}
```

**The blinking cursor:**

```css
[data-theme="ascii"] :focus {
  outline: none;
  caret-color: var(--vb-color-text);
}

/* Blinking block cursor on focused text inputs */
[data-theme="ascii"] input:focus,
[data-theme="ascii"] textarea:focus {
  caret-shape: block;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { caret-color: var(--vb-color-text); }
  50%       { caret-color: transparent; }
}

/* Fake cursor on non-input focused elements */
[data-theme="ascii"] [tabindex]:focus::after {
  content: '█';
  animation: blink 1s step-end infinite;
  color: var(--vb-color-text);
}
```

**Scanline effect (optional):**

A subtle CRT scanline overlay can be applied to the whole screen. This is purely cosmetic and should respect `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: no-preference) {
  [data-theme="ascii"] body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      rgba(0,0,0,0.15) 2px,
      rgba(0,0,0,0.15) 4px
    );
  }
}
```

---

### 2.6 Theme Comparison Summary

| Theme | Era | Key Visual | Font Strategy | Depth Model | Motion |
|---|---|---|---|---|---|
| macOS | 2023+ | Vibrancy, blur, SF Pro | `system-ui` on macOS | Blur + soft shadow | `200ms` ease |
| Windows 11 | 2021+ | Mica acrylic, Fluent | Segoe UI Variable | Blur + subtle shadow | `200ms` ease |
| iOS | 2023+ | Blur sheets, pill buttons | `system-ui` on iOS | Blur + elevation | `350ms` spring |
| Material 3 | 2021+ | Dynamic color, tonal | Google Sans / Roboto | Tonal surface + shadow | `200ms` M3 curve |
| Win 98 | 1998 | 3D bevel, `#c0c0c0` | Tahoma / Arial | 4-color bevel border | None |
| Win 95 | 1995 | Same as 98, flat titlebar | Arial | 4-color bevel border | None |
| Win 3.1 | 1992 | Flat, VGA palette | Arial small | 1px black border | None |
| Classic Mac | 1990–2001 | Platinum gray, striped titlebar | Charcoal / Arial | Flat + black drop shadow | None |
| System 6 | 1988 | Monochrome only | Monospace fallback | None — 1-bit | None |
| ASCII | Timeless | Box-drawing, phosphor | Monospace only | Text-mode box chars | None |

---

## Part 3: Implementation Notes

### 3.1 Theme Switching Without Flash

The biggest UX problem with CSS theming is flash-of-wrong-theme (FOWT) on page load. The solution is the same one dark mode uses: a blocking `<script>` before any `<link>` tags.

```html
<head>
  <!-- This script must run before CSS loads -->
  <script>
    (function() {
      const saved = localStorage.getItem('vb-theme');
      const os = (function() {
        const ua = navigator.userAgent;
        if (/Macintosh/.test(ua)) return 'macos';
        if (/Win/.test(ua)) return 'windows11';
        if (/iPhone|iPad/.test(ua)) return 'ios';
        if (/Android/.test(ua)) return 'material';
        return 'default';
      })();
      document.documentElement.dataset.theme = saved || os;
    })();
  </script>
  <link rel="stylesheet" href="vanilla-breeze.css">
```

The script is synchronous and tiny — under 200 bytes minified. By the time the CSS parses, the theme attribute is already set.

### 3.2 Lazy Loading Theme CSS

Each theme file is loaded on demand. The base `vanilla-breeze.css` includes only the token layer. Themes load when applied:

```js
function loadTheme(theme) {
  const existing = document.querySelector('[data-vb-theme-stylesheet]');
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/themes/${theme}.css`;
  link.dataset.vbThemeStylesheet = '';
  document.head.appendChild(link);
}
```

For Electron, all themes can be bundled and loaded from the app package without network requests.

### 3.3 Electron Window Integration Checklist

When building an Electron app with OS-native appearance:

- Detect `process.platform` in main process, send to renderer via IPC
- Use `titleBarStyle: 'hiddenInset'` on macOS, `titleBarStyle: 'hidden'` on Windows
- Apply `--vb-height-titlebar` as padding-top on the draggable region
- Mark draggable regions with `-webkit-app-region: drag`
- Mark all interactive elements within draggable regions with `-webkit-app-region: no-drag`
- Subscribe to `nativeTheme` updates and forward to renderer for dark/light changes
- On macOS, forward the traffic light button positions via `getTrafficLightPosition()`
- On Windows, implement custom minimize/maximize/close with correct hover colors (close is `#c42b1c`)
- Test window resize handle areas — they conflict with edge-to-edge content

---

*Vanilla Breeze OS Integration & Classic System Emulation v0.1 — Working Draft*