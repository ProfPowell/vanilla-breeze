# <watch-wc>

Drop-in wrapper for the data-watch-page button. Renders an icon, compact, or full-button toggle (aria-pressed) that adds or removes the current page from the user's VBStore('watches') list. The state machine lives in src/utils/page-watch-init.js; the component repaints its label, icon and title from the button's aria-pressed.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/watch-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<watch-wc></watch-wc>                          <!-- icon (default) -->
<watch-wc variant="compact"></watch-wc>        <!-- small icon + text -->
<watch-wc variant="button"></watch-wc>         <!-- full ghost button -->
<watch-wc variant="button" label="Save for later"></watch-wc>  <!-- constant label -->
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `icon`, `compact`, `button` | `icon` | Visual preset. icon is named by aria-label (data-label-action); compact and button are named by their visible text. Changing it after upgrade re-renders. |
| `label` | string |  | Constant visible text for the compact and button variants, used in both states (overrides data-label-watch / data-label-watching). Ignored by the icon variant. |
| `server-sync` | boolean |  | Turns on server-side sync via VBService('notify') for the whole page: sets the page-global window.vbPageWatch.serverSync flag, which every watch button (and the notification panel's unwatch) uses from then on. Equivalent to <meta name="vb-page-watch-server" content="true">. |
| `data-label-watch` | string | `Watch for updates` | Visible text (and accessible name) of the compact/button variants while the page is not watched. Localisation hook. |
| `data-label-watching` | string | `Watching` | Visible text (and accessible name) of the compact/button variants while the page is watched. Localisation hook. |
| `data-label-action` | string | `Watch this page for updates` | Icon variant: the button's aria-label, and its tooltip while not watched. Localisation hook. |
| `data-label-stop` | string | `Stop watching this page` | Icon variant: tooltip while the page is watched. Localisation hook. |

## Structure

| Child | Description |
| --- | --- |
| `button[data-watch-page][data-watch-wc]` | Generated toggle button with aria-pressed; icon variant carries aria-label, text variants a <span> label |
| `icon-wc` | bookmark / bookmark-check icon, aria-hidden |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `page-watch:add` | `[object Object]` | Bubbles from the inner button when the user starts watching |
| `page-watch:remove` | `[object Object]` | Bubbles from the inner button when the user stops watching (also dispatched by notification-wc's Watching tab) |

## Accessibility

- Pattern: Button
- The component manages: `aria-pressed`, `aria-label`, `aria-hidden`, `title`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Start or stop watching the page | Native behaviour of button |
