# <notification-wc>

Dual-mode notification component: dismissible banner or bell-icon panel with history + read tracking.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/notification-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<notification-wc mode="banner" persist="site-update-v3" variant="info" position="top">
  <strong>v3.0 is out.</strong> <a href="/changelog">See what's new</a>
  <button type="button" value="dismiss" aria-label="Dismiss">
    <icon-wc name="x" size="sm"></icon-wc>
  </button>
</notification-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `mode` | `banner`, `panel` |  | Which presentation mode to render (default: panel) |
| `persist` | string |  | Banner mode: VBStore key used to record dismiss state |
| `variant` | `info`, `success`, `warning`, `error` |  | Banner mode: color variant (reactive) |
| `position` | `top`, `bottom` |  | Banner mode: top = sticky to the viewport top, bottom = fixed to the viewport bottom (reactive) |
| `expires` | number |  | Banner mode: days until the banner re-shows after dismiss |
| `src` | string |  | Panel mode: absolute or root-relative URL, or a VBService role name, for dynamic notifications |
| `poll` | number |  | Panel mode: polling interval in milliseconds |
| `toast-new` | string |  | Panel mode: on each poll after the first, show a toast for every never-seen dynamic notification on the <toast-msg> matched by the value (a selector, e.g. #id); bare, invalid, or no matching <toast-msg> = first <toast-msg> in the document |
| `storage-key` | string |  | Panel mode: VBStore namespace for read state (default: notifications) |
| `data-label-trigger` | string | `Notifications` | Panel mode: Trigger accessible name (minted bell; an authored trigger keeps its own name). |
| `data-label-unread` | string | `{n} unread` | Panel mode: Unread count appended to the trigger name ({n} = count). |
| `data-label-title` | string | `Notifications` | Panel mode: Panel heading and dialog name. |
| `data-label-mark-all` | string | `Mark all read` | Panel mode: Mark-all button text. |
| `data-label-close` | string | `Close notifications` | (panel) Accessible name of the close button shown when the panel opens as a sheet |
| `data-label-tabs` | string | `Notification categories` | Panel mode: Tab list accessible name. |
| `data-label-all` | string | `All` | Panel mode: All tab text. |
| `data-label-watching` | string | `Watching` | Panel mode: Watching tab text. |
| `data-label-empty` | string | `No notifications` | Panel mode: Empty-state text for the All tab. |
| `data-label-watch-empty` | string | `You aren’t watching any pages yet. Use the “Watch” button on a page to start.` | Panel mode: Empty-state text for the Watching tab. |
| `data-label-last-checked` | string | `Last checked: {date}` | Panel mode: Watch row check time ({date} = formatted date). |
| `data-label-never` | string | `—` | Panel mode: Watch row check time when never checked. |
| `data-label-changed` | string | `Changed` | Panel mode: Badge on watched pages whose content changed. |
| `data-label-unwatch` | string | `Unwatch {title}` | Panel mode: Unwatch button accessible name ({title} = page title). |
| `data-label-new` | string | `New notification` | Panel mode: Toast text when a new notification has no title or body. |
| `data-label-added` | string | `New notification: {title}. {n} unread` | Panel mode: Text announced to screen readers when a notification arrives after the page has loaded ({title} = its title, {n} = unread count). |
| `data-label-variant-info` | string | `Information:` | Banner mode: visually hidden prefix announcing the info variant, so it isn't conveyed by colour alone. |
| `data-label-variant-success` | string | `Success:` | Banner mode: visually hidden prefix announcing the success variant, so it isn't conveyed by colour alone. |
| `data-label-variant-warning` | string | `Warning:` | Banner mode: visually hidden prefix announcing the warning variant, so it isn't conveyed by colour alone. |
| `data-label-variant-error` | string | `Error:` | Banner mode: visually hidden prefix announcing the error variant, so it isn't conveyed by colour alone. |
| `data-unread` | number |  | (panel) Set by the element to the unread count while there are unread items, removed at zero. Read-only state for styling from outside (a mobile-menu trigger's unread dot). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-trigger` | button | boolean |  | Panel mode: marks an authored trigger button that replaces the minted bell. An unread badge is appended inside it. |
| `data-id` | article | string |  | Panel mode: notification id (read state and dynamic merge key). |
| `data-type` | article | `update`, `alert`, `watch`, `system`, `message`, `stewardship` |  | Panel mode: row icon (default update). |
| `data-date` | article | string |  | Panel mode: ISO date; sorts rows newest first and is shown formatted in the document language. |
| `value` | button | string |  | Banner mode: value="dismiss" (or data-dismiss) marks the dismiss button. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `notification-wc:new` | `{ notification }` | A never-seen entry arrived in a dynamic fetch |
| `notification-wc:read` | `{ id }` | An entry was marked read |
| `notification-wc:dismiss` | `{ id }` | Banner was dismissed (id = persist key) |
| `notification-wc:open` |  | Panel opened |
| `notification-wc:close` |  | Panel closed |
| `notification-wc:notifications-changed` | `{ notifications, source: 'property' }` | The notifications setter replaced the dynamic list |
| `page-watch:remove` | `{ url, subscriptionId }` | A page was unwatched from the Watching tab |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `notifications` | `Array<{ id, title, body?, date?, type?, url?, dismissed? }>` | Panel mode: dynamic notifications merged over static <article> children by id (same shape as the src feed). The getter returns a copy; the setter re-renders and fires notification-wc:notifications-changed. url renders as a link only when it resolves to http(s). Banner mode ignores the setter. |

## Accessibility

- Pattern: Non-modal dialog with tabs
- You provide: In banner mode, a dismiss button with an accessible name; in panel mode, an accessible name on an authored trigger
- The component manages: `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-label`, `role="dialog"`, `role="status"`, `role="alert"`, `aria-labelledby`, `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `tabindex`, `role="list"`, `aria-hidden`, `hidden`, `popover`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Close the panel and return focus to the trigger | Panel open and focus on the trigger or inside the panel |
| `ArrowRight` | Move to and select the next tab, wrapping (reversed in right-to-left) | Focus on a tab |
| `ArrowLeft` | Move to and select the previous tab, wrapping (reversed in right-to-left) | Focus on a tab |
| `Home` | Move to and select the first tab | Focus on a tab |
| `End` | Move to and select the last tab | Focus on a tab |
