# <mobile-menu>

Breakpoint observer for a header menu. Sets [data-mobile] at or below the breakpoint, which shows the author's trigger and hides sibling nav, nav-bar and site-tools in the parent header; a sibling marked data-mobile-menu is moved into the panel instead. The author supplies the trigger and the native popover panel.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/mobile-menu/
- Vanilla Breeze 0.7.4

## Example

```html
<header class="site" data-sticky>
  <a href="/"><brand-mark>Acme Inc</brand-mark></a>

  <nav class="horizontal pills" aria-label="Main navigation">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/docs">Docs</a></li>
      <li><a href="/blog">Blog</a></li>
    </ul>
  </nav>

  <site-tools>
    <site-search>
      <button type="button" data-trigger class="ghost">Search</button>
    </site-search>
  </site-tools>

  <mobile-menu breakpoint="52rem">
    <button type="button" data-trigger
            popovertarget="main-menu" aria-label="Menu">
      <icon-wc name="menu"></icon-wc>
    </button>

    <!-- Panel lives inside mobile-menu so its styles apply -->
    <nav popover id="main-menu" class="mobile-menu-panel"
         aria-label="Site menu">
      <button type="button" class="mobile-menu-close"
              popovertarget="main-menu"
              popovertargetaction="hide" aria-label="Close menu">
        <icon-wc name="x"></icon-wc>
      </button>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/docs" aria-current="page">Docs</a></li>
        <li><a href="/blog">Blog</a></li>
      </ul>
    </nav>
  </mobile-menu>
</header>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `breakpoint` | string | `52rem` | Viewport max-width (CSS length) at or below which mobile mode activates. Observed: changing it re-evaluates. The default 52rem also applies via a CSS media query before upgrade. |
| `data-mobile` | boolean |  | Set by the element while mobile mode is active. Read-only state for styling. |

## Structure

| Child | Description |
| --- | --- |
| `<button data-trigger popovertarget>` | Author-supplied menu toggle; popovertarget names the panel's id. Give it an aria-label. |
| `<nav popover class="mobile-menu-panel">` | Author-supplied native popover panel, placed inside <mobile-menu> so the link styles apply. Label it (aria-label). Esc closes and focus returns to the trigger; it is not modal (no focus trap or scroll lock). |
| `<button class="mobile-menu-close" popovertargetaction="hide">` | Optional author-supplied close button inside the panel. |
| `<… data-mobile-menu>` | A sibling of <mobile-menu> in the header that should exist once (a notification bell). Moved into the panel in mobile mode and back on leaving it. If it carries data-unread, the trigger shows a dot. |
| `<… data-mobile-menu-slot>` | Optional element inside the panel that receives the moved data-mobile-menu siblings (default: the end of the panel). |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--mobile-menu-bg` | Panel background color |
| `--mobile-menu-radius` | Panel border radius |
| `--mobile-menu-shadow` | Panel box shadow |
| `--mobile-menu-padding` | Panel padding |
| `--mobile-menu-max-width` | Panel maximum width |
| `--mobile-menu-backdrop` | Backdrop overlay color |
