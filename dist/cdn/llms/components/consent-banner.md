# <consent-banner>

Cookie consent banner with granular category controls and persistence

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/consent-banner/
- Vanilla Breeze 0.7.4

## Example

```html
<consent-banner>
  <dialog>
    <p>We use cookies to improve your experience.
      <a href="/privacy">Privacy Policy</a></p>
    <footer>
      <button value="reject">Reject All</button>
      <button value="accept">Accept All</button>
    </footer>
  </dialog>
</consent-banner>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `persist` | string | `banner` | VBStore key under namespace 'consent'. Stored in localStorage as vb:consent:<persist>. |
| `position` | `bottom`, `top`, `center` | `bottom` | Banner position. Center uses modal dialog. |
| `trigger` | string |  | CSS selector for a re-open button (e.g. #manage-cookies) |
| `expires` | string | `365` | Days until stored consent expires (banner and getConsent). 0 or 'never' disables expiry. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | button | `accept`, `reject`, `save` |  | Action button type — accept all, reject all, or save granular preferences |
| `name` | input[type=checkbox] | string |  | Preference category name; becomes a key in the stored and emitted preferences object |

## Structure

| Child | Description |
| --- | --- |
| `<dialog>` | Banner container — shown until consent is given. Named from its first heading (aria-labelledby) or aria-label="Cookie consent" unless the author names it. |
| `<button value="accept">` | Accept-all action button |
| `<button value="reject">` | Reject-all action button (optional) |
| `<input type="checkbox">` | Granular preference toggles (optional, for save mode) |
| `<button value="save">` | Save granular preferences button (optional, used with checkboxes) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `consent-banner:change` | `{ preferences: Record<string, boolean>, action: 'accept' \| 'reject' \| 'save' }` | Fired when the user clicks an accept, reject, or save button. preferences maps checkbox names to booleans; action is the button's value. |

## Methods

| Method | Description |
| --- | --- |
| `ConsentBanner.getConsent(key?, options?)` | Static. Read stored consent for key (default 'banner'). Honours expiry: options.expires (days), else the expires attribute of an in-document banner with the same persist key, else 365. Resolves null when missing, expired, or storage is unavailable. |
| `ConsentBanner.reset(key?)` | Static. Clear stored consent for key (default 'banner') so the banner reappears on the next load. |

## Accessibility

- Pattern: Native dialog
- You provide: A <dialog> containing a heading (used as its name) and buttons with value="accept", "reject" or "save"
- The component manages: `aria-labelledby`, `aria-label`, `hidden`
