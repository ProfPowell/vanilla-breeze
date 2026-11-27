# <settings-panel>

Compact, non-modal site settings panel (Appearance, Accessibility, Layout, Effects, Environment, System) opened from a gear trigger; shares state with theme-picker through ThemeManager, VBStore and window events

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/settings-panel/
- Vanilla Breeze 0.7.4

## Example

```html
<settings-panel></settings-panel>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean |  | Reflected state only — set by open()/close()/toggle(), not intended as initial markup |
| `data-label-trigger` | string | `Site settings` | Accessible name of the minted gear trigger (an authored trigger keeps its own name). |
| `data-label-dialog` | string | `Site settings` | Panel dialog accessible name. |
| `data-label-title` | string | `Settings` | Panel heading text. |
| `data-label-close` | string | `Close settings` | Close button accessible name. |
| `data-label-appearance` | string | `Appearance` | Text for the "Appearance" string. |
| `data-label-color-mode` | string | `Color mode` | Text for the "Color mode" string. |
| `data-label-mode-auto` | string | `Auto` | Text for the "Auto" string. |
| `data-label-mode-light` | string | `Light` | Text for the "Light" string. |
| `data-label-mode-dark` | string | `Dark` | Text for the "Dark" string. |
| `data-label-theme` | string | `Theme` | Text for the "Theme" string. |
| `data-label-accessibility` | string | `Accessibility` | Text for the "Accessibility" string. |
| `data-label-high-contrast` | string | `High Contrast` | Text for the "High Contrast" string. |
| `data-label-large-text` | string | `Large Text` | Text for the "Large Text" string. |
| `data-label-dyslexia` | string | `Dyslexia-Friendly` | Text for the "Dyslexia-Friendly" string. |
| `data-label-char-shortcuts` | string | `Single-Key Shortcuts` | Text for the "Single-Key Shortcuts" toggle (WCAG 2.1.4: turns off every unscoped single-character shortcut, stored as extensions.charShortcuts). |
| `data-label-layout` | string | `Layout` | Text for the "Layout" string. |
| `data-label-fluid` | string | `Fluid Scaling` | Text for the "Fluid Scaling" string. |
| `data-label-density` | string | `Density` | Text for the "Density" string. |
| `data-label-density-compact` | string | `Compact` | Text for the "Compact" string. |
| `data-label-density-default` | string | `Default` | Text for the "Default" string. |
| `data-label-density-spacious` | string | `Spacious` | Text for the "Spacious" string. |
| `data-label-backdrop` | string | `Canvas Backdrop` | Text for the "Canvas Backdrop" string. |
| `data-label-backdrop-style` | string | `Style` | Text for the "Style" string. |
| `data-label-backdrop-default` | string | `Default` | Text for the "Default" string. |
| `data-label-backdrop-flush` | string | `Flush` | Text for the "Flush" string. |
| `data-label-backdrop-elevated` | string | `Elevated` | Text for the "Elevated" string. |
| `data-label-chrome` | string | `Chrome` | Text for the "Chrome" string. |
| `data-label-chrome-card` | string | `Card` | Text for the "Card" string. |
| `data-label-chrome-stretch` | string | `Stretch` | Text for the "Stretch" string. |
| `data-label-chrome-integrated` | string | `Integrated` | Text for the "Integrated" string. |
| `data-label-fixed-header` | string | `Fixed Header` | Text for the "Fixed Header" string. |
| `data-label-page-bg` | string | `Page Background` | Text for the "Page Background" string. |
| `data-label-page-bg-default` | string | `Theme Default` | Text for the "Theme Default" string. |
| `data-label-page-bg-color` | string | `Solid Color` | Text for the "Solid Color" string. |
| `data-label-page-bg-gradient` | string | `Gradient` | Text for the "Gradient" string. |
| `data-label-bg-color` | string | `Color` | Text for the "Color" string. |
| `data-label-grad-start` | string | `Start` | Text for the "Start" string. |
| `data-label-grad-end` | string | `End` | Text for the "End" string. |
| `data-label-grad-direction` | string | `Direction` | Text for the "Direction" string. |
| `data-label-dir-to-bottom` | string | `Top → Bottom` | Text for the "Top → Bottom" string. |
| `data-label-dir-to-right` | string | `Left → Right` | Text for the "Left → Right" string. |
| `data-label-dir-135deg` | string | `Diagonal ↘` | Text for the "Diagonal ↘" string. |
| `data-label-dir-45deg` | string | `Diagonal ↗` | Text for the "Diagonal ↗" string. |
| `data-label-sticky` | string | `Sticky Navigation` | Text for the "Sticky Navigation" string. |
| `data-label-effects` | string | `Effects` | Text for the "Effects" string. |
| `data-label-motion` | string | `Motion Effects` | Text for the "Motion Effects" string. |
| `data-label-sounds` | string | `Sound Effects` | Text for the "Sound Effects" string. |
| `data-label-environment` | string | `Environment` | Text for the "Environment" string. |
| `data-label-ambient` | string | `Ambient Styling` | Text for the "Ambient Styling" string, the switch in the Environment section. The section appears only when the page opts in to the ambient pack. |
| `data-label-system` | string | `System` | Text for the "System" string. |
| `data-label-sw-label` | string | `Service Worker:` | Text for the "Service Worker:" string. |
| `data-label-sw-checking` | string | `checking…` | Text for the "checking…" string. |
| `data-label-sw-unsupported` | string | `Not supported` | Text for the "Not supported" string. |
| `data-label-sw-active` | string | `Active ({n} cached files)` | Service-worker status ({n} = cached file count). |
| `data-label-sw-unregistered` | string | `Not registered` | Text for the "Not registered" string. |
| `data-label-clear-cache` | string | `Clear Cache` | Text for the "Clear Cache" string. |
| `data-label-clearing` | string | `Clearing…` | Text for the "Clearing…" string. |
| `data-label-cleared` | string | `Cache cleared` | Text for the "Cache cleared" string. |
| `data-label-check-update` | string | `Check for Updates` | Text for the "Check for Updates" string. |
| `data-label-checking` | string | `Checking…` | Text for the "Checking…" string. |
| `data-label-update-available` | string | `Update available` | Text for the "Update available" string. |
| `data-label-up-to-date` | string | `Up to date` | Text for the "Up to date" string. |
| `data-label-failed` | string | `Failed` | Text for the "Failed" string. |
| `data-label-reset` | string | `Reset to Defaults` | Text for the "Reset to Defaults" string. |
| `data-label-reset-confirm` | string | `Reset all settings to defaults?` | In-panel reset confirmation question. |
| `data-label-reset-yes` | string | `Reset` | Text for the "Reset" string. |
| `data-label-reset-cancel` | string | `Cancel` | Text for the "Cancel" string. |
| `data-label-reset-done` | string | `Settings reset to defaults` | Live announcement after a reset. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-trigger` | button | boolean |  | Marks an authored trigger button (else the first child <button>, else a minted gear button). The runtime sets aria-haspopup, aria-expanded and aria-controls on it. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `settings-panel:upgraded` |  | Fired on the host (bubbles) once the element has upgraded and rendered. |
| `settings-panel:data-changed` | `{ data, source: 'property' }` | Fired on the host (bubbles) after a data setter's VBStore writes finish. |
| `vb:a11y-themes-change` | `string[]` | Dispatched on window (not the host) when the accessibility themes change; also listened for, so other components can push changes in. |
| `vb:extensions-change` | `{ motionFx, sounds, charShortcuts }` | Dispatched on window (not the host) when the effects preferences change; also listened for (theme-picker dispatches it too). |

## Methods

| Method | Description |
| --- | --- |
| `open` | Open the panel and move focus into it. Queued if called before the element has rendered. |
| `close` | Close the panel. When focus is inside the panel it returns to the trigger; focus elsewhere is not moved. |
| `toggle` | Toggle the panel open/closed. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `data` | `{ a11yThemes: string[], extensions: { motionFx: boolean, sounds: boolean, charShortcuts: boolean }, sticky: boolean }` | Settings snapshot. The setter applies each provided field to the page at once (a11y themes on <html data-theme>, extensions incl. <html data-motion-reduced> and <html data-char-shortcuts="off">, <html data-sticky>), writes it through to VBStore (vb:settings:a11y / extensions / sticky), updates the controls, and fires settings-panel:data-changed when the writes finish. Safe before the panel renders. |

## Accessibility

- Pattern: Dialog (non-modal)
- The component manages: `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-label`, `role="dialog"`, `tabindex`, `role="status"`, `role="group"`, `aria-labelledby`, `aria-hidden`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Close the panel; focus returns to the trigger when it was inside the panel | Panel open and focus on the trigger or inside the panel |
| `Enter` / `Space` | Open or close a settings section | Native behaviour of summary |
