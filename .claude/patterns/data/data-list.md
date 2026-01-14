# Data List

## Description

Flexible list layout for displaying collections of records. More adaptable than tables for varied content types, cards, or when horizontal space is limited.

## Anatomy

- **container**: List wrapper
- **item**: Individual record
- **media**: Optional image/icon
- **content**: Primary content area
- **meta**: Secondary information
- **actions**: Item actions

## States

| State | Description |
|-------|-------------|
| Default | Static list |
| Loading | Skeleton items |
| Empty | No items message |
| Selected | Item selection |

## Variants

### Layout

**Attribute:** `data-layout`
**Values:** `list`, `grid`, `compact`

### Dividers

**Attribute:** `data-dividers`
**Values:** `true`, `false`

## Baseline HTML

```html
<ul class="data-list">
  <li>
    <h3>Item Title</h3>
    <p>Item description</p>
  </li>
</ul>
```

## Enhanced HTML

```html
<data-list data-layout="list" data-dividers>
  <article data-item>
    <img data-media src="avatar.jpg" alt="" />
    <div data-content>
      <h3 data-title>John Doe</h3>
      <p data-description>Software Engineer at Acme Inc.</p>
      <div data-meta>
        <span>San Francisco, CA</span>
        <span>Joined Jan 2024</span>
      </div>
    </div>
    <div data-actions>
      <button data-action="view">View</button>
      <button data-action="message">Message</button>
    </div>
  </article>
</data-list>
```

## CSS

```css
@layer components {
  data-list {
    display: flex;
    flex-direction: column;
  }

  data-list[data-layout="grid"] {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: var(--size-l);
  }

  /* List item */
  data-list [data-item] {
    display: flex;
    gap: var(--size-m);
    padding: var(--size-m);
    align-items: flex-start;
    transition: background var(--transition-fast);
  }

  data-list[data-layout="list"] [data-item]:hover {
    background: var(--overlay-light, oklch(0 0 0 / 0.02));
  }

  /* Dividers */
  data-list[data-dividers] [data-item] {
    border-block-end: 1px solid var(--border, oklch(0.9 0 0));
  }

  data-list[data-dividers] [data-item]:last-child {
    border-block-end: none;
  }

  /* Grid layout items */
  data-list[data-layout="grid"] [data-item] {
    flex-direction: column;
    background: var(--surface, white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--size-l);
  }

  /* Compact layout */
  data-list[data-layout="compact"] [data-item] {
    padding: var(--size-xs) var(--size-m);
  }

  data-list[data-layout="compact"] [data-media] {
    width: 2rem;
    height: 2rem;
  }

  /* Media */
  data-list [data-media] {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-full);
    object-fit: cover;
  }

  data-list[data-layout="grid"] [data-media] {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-md);
    margin-block-end: var(--size-xs);
  }

  /* Icon media */
  data-list [data-media-icon] {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-alt, oklch(0.95 0 0));
    border-radius: var(--radius-md);
    color: var(--primary, oklch(0.55 0.2 250));
  }

  /* Content */
  data-list [data-content] {
    flex: 1;
    min-width: 0;
  }

  data-list [data-title] {
    margin: 0;
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    color: var(--text, oklch(0.2 0 0));
  }

  data-list [data-description] {
    margin: var(--size-2xs) 0 0;
    font-size: var(--text-sm);
    color: var(--text-muted, oklch(0.5 0 0));
    line-height: 1.5;
  }

  data-list [data-meta] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-xs);
    margin-block-start: var(--size-xs);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  data-list [data-meta] > * {
    display: flex;
    align-items: center;
    gap: var(--size-2xs);
  }

  /* Actions */
  data-list [data-actions] {
    display: flex;
    gap: var(--size-2xs);
    flex-shrink: 0;
  }

  data-list[data-layout="grid"] [data-actions] {
    margin-block-start: var(--size-m);
    width: 100%;
  }

  data-list [data-action] {
    padding: var(--size-2xs) var(--size-xs);
    font-size: var(--text-sm);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  data-list [data-action]:hover {
    background: var(--overlay-light);
  }

  data-list [data-action="primary"] {
    background: var(--primary);
    color: var(--primary-contrast);
    border-color: var(--primary);
  }

  /* Selectable items */
  data-list[data-selectable] [data-item] {
    cursor: pointer;
  }

  data-list[data-selectable] [data-item][data-selected] {
    background: oklch(0.95 0.05 250);
    border-color: var(--primary);
  }

  /* Empty state */
  data-list [data-empty] {
    padding: var(--size-2xl);
    text-align: center;
    color: var(--text-muted);
  }

  /* Loading skeleton */
  data-list [data-skeleton] {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
}
```

## JavaScript Enhancement

```javascript
class DataList extends HTMLElement {
  connectedCallback() {
    if (this.hasAttribute('data-selectable')) {
      this.initSelection();
    }

    if (this.hasAttribute('data-lazy')) {
      this.initLazyLoading();
    }
  }

  initSelection() {
    this.addEventListener('click', (e) => {
      const item = e.target.closest('[data-item]');
      if (!item || e.target.closest('[data-action]')) return;

      const wasSelected = item.hasAttribute('data-selected');

      // Single select
      this.querySelectorAll('[data-selected]').forEach((i) => {
        i.removeAttribute('data-selected');
      });

      if (!wasSelected) {
        item.setAttribute('data-selected', '');
        this.dispatchEvent(new CustomEvent('select', {
          detail: { itemId: item.dataset.id }
        }));
      }
    });
  }

  initLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    this.querySelectorAll('img[data-src]').forEach((img) => {
      observer.observe(img);
    });
  }
}

customElements.define('data-list', DataList);
```

## Accessibility

- **Semantic Structure**: Uses `<article>` for items
- **Focus Management**: Interactive items are focusable
- **Screen Reader**: Proper heading structure

## Examples

### User List

```html
<data-list data-layout="list" data-dividers>
  <article data-item>
    <img data-media src="user1.jpg" alt="" />
    <div data-content>
      <h3 data-title>Alice Johnson</h3>
      <p data-description>Product Designer</p>
      <div data-meta>
        <span>Design Team</span>
      </div>
    </div>
    <div data-actions>
      <button data-action>View Profile</button>
    </div>
  </article>
</data-list>
```

### Card Grid

```html
<data-list data-layout="grid">
  <article data-item>
    <img data-media src="project.jpg" alt="Project preview" />
    <div data-content>
      <h3 data-title>Project Alpha</h3>
      <p data-description>A brief description of the project.</p>
    </div>
    <div data-actions>
      <button data-action="primary">Open</button>
      <button data-action>Details</button>
    </div>
  </article>
</data-list>
```

### Compact File List

```html
<data-list data-layout="compact" data-dividers>
  <article data-item>
    <span data-media-icon>📄</span>
    <div data-content>
      <h3 data-title>document.pdf</h3>
      <div data-meta>
        <span>2.4 MB</span>
        <span>Modified today</span>
      </div>
    </div>
    <div data-actions>
      <button data-action>Download</button>
    </div>
  </article>
</data-list>
```

## Related Patterns

- [data-table](./data-table.md)
- [card-grid](../layout/card-grid.md)
- [empty-state](../feedback/empty-state.md)
