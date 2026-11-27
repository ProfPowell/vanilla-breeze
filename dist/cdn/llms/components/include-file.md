# <include-file>

Fetch a same-origin HTML fragment, sanitize it, and insert it into the page

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/include-file/
- Vanilla Breeze 0.7.4

## Example

```html
<include-file src="/partials/header.html">
  <p><a href="/">Home</a></p>
</include-file>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | string |  | URL of the HTML fragment, resolved against the page (document.baseURI). Only same-origin http(s) URLs load; blob:, data:, javascript: and other schemes are always refused; other origins need allow-cross-origin. A same-origin URL that redirects off-origin is refused. Observed: changing it re-fetches (honouring lazy); a change made while detached loads on reconnect. |
| `mode` | `replace`, `append`, `prepend` | `replace` | How fetched content is inserted. append/prepend leave existing children (including author scripts) untouched. Unknown values behave as replace and log a warning. |
| `lazy` | boolean |  | Defer loading until the element is within 200px of the viewport (also for later src changes) |
| `trusted` | boolean |  | Author vouches for the source: insert the fetched HTML without sanitizing. Without it the fragment goes through VB's sanitizer (no scripts, on* handlers, javascript: URLs, iframes, forms…). Never set it for URLs that serve user-generated content. |
| `allow-scripts` | boolean |  | Run the fragment's scripts (each once per load). Requires trusted; ignored with a console warning otherwise. |
| `allow-cross-origin` | boolean |  | Permit fetching from another origin (the server must allow it via CORS). Content is still sanitized unless trusted is also set. |
| `data-label-error` | string | `Failed to load content` | Text of the role="alert" error message shown when a load fails and no fallback content remains |
| `data-loading` | boolean |  | Present while content is loading (aria-busy="true" is set alongside) |
| `data-loaded` | boolean |  | Present after successful load |
| `data-error` | boolean |  | Present if the fetch fails or the URL is refused (origin, scheme, include cycle, nesting deeper than 10) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `include-file:loaded` | `{ src, url, html }` | After the fragment is inserted. src is the attribute value, url the resolved absolute URL, html the markup as inserted (sanitized unless trusted). |
| `include-file:error` | `{ src, error }` | When the fetch fails or the load is refused; error is a message string. The original fallback is restored on a first-load failure in replace mode. |
| `include-file:src-changed` | `{ src, source: 'property' }` | After .src is assigned a new value from script (not for direct attribute changes) |

## Methods

| Method | Description |
| --- | --- |
| `reload()` | Re-fetch the current src (same policy checks as a normal load). |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `src` | `string` | Mirror of the src attribute. Setting it updates the attribute (which loads the new URL) and fires include-file:src-changed. |

## Accessibility

- Pattern: Live region
- The component manages: `aria-busy`, `role="alert"`
