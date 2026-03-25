# Sample Markdown Document

This is a **sample** markdown file used to demonstrate the `<markdown-viewer>` component loading content via the `src` attribute.

## Text Formatting

Regular paragraph with **bold**, *italic*, ~~strikethrough~~, and `inline code`.

## Lists

### Unordered

- First item
- Second item with **bold**
- Third item

### Ordered

1. Step one
2. Step two
3. Step three

### Task List

- [x] Design the component API
- [x] Implement core viewer
- [ ] Add syntax highlighting
- [ ] Write documentation

## Links and Images

Visit [Vanilla Breeze](https://profpowell.github.io/vanilla-breeze/) for more info.

## Blockquote

> Platform-native solutions beat third-party packages every time.
> Keep it simple, keep it fast.

## Table

| Feature | Status | Priority |
|---------|--------|----------|
| Light DOM render | Done | High |
| Theme propagation | Done | High |
| Lazy loading | Phase 3 | Medium |
| Sanitization | Phase 3 | Medium |

## Code Block

```javascript
// Custom parser example
const viewer = document.querySelector('markdown-viewer');
viewer.parser = (md) => myCustomRenderer(md);
```

```css
/* VB design tokens in action */
markdown-viewer {
  display: block;
  padding: var(--size-m);
}
```

## Horizontal Rule

---

That's the end of the sample document.
