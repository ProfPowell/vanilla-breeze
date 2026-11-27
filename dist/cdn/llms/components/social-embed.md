# <social-embed>

Privacy-first social post embed. Renders the authored fallback link plus a "Load … post" button; on activation it builds a sandboxed iframe from the validated post URL (Bluesky, Mastodon, X, Instagram) or a <youtube-player> (YouTube).

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/social-embed/
- Vanilla Breeze 0.7.4

## Example

```html
<social-embed url="https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l">
  <a href="https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l">View post on Bluesky</a>
</social-embed>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `url` | string |  | Post or video URL. Must be https on the provider's own host (Mastodon: any https host with a /@user/<id> path); anything else is unsupported. |
| `provider` | string |  | Provider key (x, instagram, bluesky, youtube, mastodon or a registered custom key). Skips auto-detection; the provider must still accept the URL. |
| `poster` | string |  | YouTube only: local image passed to <youtube-player poster>, so no thumbnail is fetched from i.ytimg.com. |
| `theme` | `light`, `dark`, `auto` | `auto` | Colour hint for themeable providers (X, Bluesky). auto: the host's computed color-scheme, then the page's data-mode, then prefers-color-scheme. |
| `activate` | `click`, `visible`, `eager` | `click` | click: load when the reader presses the Load button; visible: when scrolled within 200px of the viewport; eager: at once. YouTube always renders its own facade at once. |
| `data-title` | string |  | Accessible name of the embedded frame (YouTube: the player title). Default: "{provider} post" / "YouTube video". |
| `data-label-load` | string | `Load {provider} {noun}` | Load button text; {provider} is the platform name, {noun} is post (video for YouTube). |
| `data-label-loading` | string | `Loading {provider} {noun}…` | Button text and live-region announcement while loading. |
| `data-label-error` | string | `{provider} {noun} failed to load.` | Visible note and announcement when loading fails (the button stays for a retry). |
| `data-label-note` | string | `Loads content from {host}` | Consent note beside the Load button; {host} is the host the embed loads from. |
| `state` | `idle`, `loading`, `loaded`, `error`, `unsupported` |  | Lifecycle state, set by the component. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `social-embed:upgraded` |  | Fired (bubbles) after the element upgrades. |

## Methods

| Method | Description |
| --- | --- |
| `SocialEmbed.register(name, provider)` | Static. Add a provider { canHandle(url), render(host, url, { theme, title }) → Promise<Node \| void>, label?, noun?, themeable?, delegatesActivation?, frameHost(url)? }. A returned Node replaces the fallback. Instances left unsupported re-initialise. |
| `createEmbedFrame(options)` | Module export. Build a sandboxed, lazy https iframe ({ src: URL, title, sandbox: string[], allow?, height?, measure?(data), onload?(frame) }); measure reads a height from the frame's postMessage (origin and source are checked). |
| `loadScript(src)` | Module export. Idempotent script loader for custom providers; a failed load is evicted so it can be retried. Built-in providers never inject script. |
| `fetchOEmbed(endpoint, url, params?)` | Module export. Fetch oEmbed JSON. Never insert its html with innerHTML. |

## Accessibility

- Pattern: Button
- You provide: A fallback link to the post as content, and data-title when the default frame title does not fit
- The component manages: `role="status"`, `aria-disabled`, `tabindex`, `title`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Load the embed and move focus into it | Native behaviour of button |
