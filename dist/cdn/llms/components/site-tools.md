# <site-tools>

Site-wide utility container for header and footer actions like search, theme picker, and settings

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/site-tools/
- Vanilla Breeze 0.7.4

## Example

```html
<header class="site">
  <a href="/"><brand-mark>Acme Inc</brand-mark></a>
  <nav class="horizontal pills" aria-label="Main navigation">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/docs">Docs</a></li>
    </ul>
  </nav>
  <site-tools>
    <site-search>
      <button type="button" data-trigger class="ghost">Search</button>
    </site-search>
    <theme-picker>
      <button type="button" data-trigger class="ghost">Theme</button>
    </theme-picker>
  </site-tools>
</header>
```

## Structure

| Child | Description |
| --- | --- |
| `<site-search>` | Search trigger and dialog |
| `<theme-picker>` | Theme selection panel |
| `<settings-panel>` | Full settings panel |
| `<notification-wc>` | Notification bell (keep it outside site-tools, or repeat it, if it must stay reachable on mobile) |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--site-tools-gap` | Space between tools (default var(--size-s)) |
