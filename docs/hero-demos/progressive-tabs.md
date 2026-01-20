# Progressive Enhancement Tabs

**Tagline:** "Works before JavaScript loads."

## The Wow Factor

`tabs-wc` wraps native `<details>` elements, providing full tab functionality AFTER JavaScript loads while working as native disclosure widgets BEFORE JavaScript. True progressive enhancement.

## How It Works

### Before JavaScript
- `<details>` elements work as native browser accordions
- The `name` attribute creates exclusive behavior (only one open at a time)
- Users can access all content immediately

### After JavaScript
- `tabs-wc` enhances to horizontal tab interface
- ARIA roles added (tablist, tab, tabpanel)
- Full keyboard navigation (arrow keys, Home, End)
- Tab change events dispatched

## Usage

```html
<tabs-wc aria-label="Feature tabs">
  <details name="tabs" open>
    <summary>Tab 1</summary>
    <p>Content for tab 1</p>
  </details>
  <details name="tabs">
    <summary>Tab 2</summary>
    <p>Content for tab 2</p>
  </details>
</tabs-wc>
```

## Key Points

- The `name` attribute on details is crucial - creates accordion behavior
- The `open` attribute on one details sets the default tab
- `aria-label` on tabs-wc provides accessible name for tab group

## Benefits

- No flash of unstyled content (FOUC)
- Works on slow connections before JS loads
- Accessible even if JavaScript fails
- SEO-friendly (content in HTML)

## See Also

Link to demo: [View Demo](./progressive-tabs.html)
