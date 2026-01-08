# Tree View

## Description

Hierarchical data display with expandable/collapsible nodes. Used for file explorers, navigation trees, nested categories, and organizational structures.

## Anatomy

- **container**: The tree wrapper
- **node**: Individual tree item
- **toggle**: Expand/collapse control
- **icon**: Optional file/folder icon
- **label**: Node text
- **children**: Nested child nodes

## States

| State | Description |
|-------|-------------|
| Collapsed | Children hidden |
| Expanded | Children visible |
| Selected | Node is active |
| Disabled | Node not interactive |
| Loading | Children loading |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `lines`, `compact`

### Icons

**Attribute:** `data-icons`
**Values:** `true`, `false`

### Selectable

**Attribute:** `data-selectable`

## Baseline HTML

```html
<ul class="tree-view">
  <li>
    <details open>
      <summary>Folder</summary>
      <ul>
        <li>File 1</li>
        <li>File 2</li>
      </ul>
    </details>
  </li>
</ul>
```

## Enhanced HTML

```html
<tree-view data-style="lines" data-icons data-selectable>
  <ul role="tree">
    <li role="treeitem" aria-expanded="true" data-node>
      <span data-toggle aria-label="Collapse">
        <span data-icon="folder-open"></span>
      </span>
      <span data-label>Documents</span>
      <ul role="group">
        <li role="treeitem" data-node data-leaf>
          <span data-icon="file"></span>
          <span data-label>Report.pdf</span>
        </li>
        <li role="treeitem" aria-expanded="false" data-node>
          <span data-toggle aria-label="Expand">
            <span data-icon="folder"></span>
          </span>
          <span data-label>Images</span>
          <ul role="group" hidden>
            <li role="treeitem" data-node data-leaf>
              <span data-icon="image"></span>
              <span data-label>photo.jpg</span>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</tree-view>
```

## CSS

```css
@layer components {
  tree-view {
    display: block;
    font-size: var(--text-sm);
  }

  tree-view ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  tree-view ul ul {
    padding-inline-start: var(--spacing-lg);
  }

  tree-view [data-node] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    user-select: none;
    transition: background var(--transition-fast);
  }

  tree-view [data-node]:hover {
    background: var(--overlay-light, oklch(0 0 0 / 0.05));
  }

  /* Toggle button */
  tree-view [data-toggle] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-muted);
    transition: transform var(--transition-fast);
  }

  tree-view [data-toggle]:hover {
    background: var(--overlay-light);
    color: var(--text);
  }

  /* Chevron indicator */
  tree-view [data-toggle]::before {
    content: "▶";
    font-size: 0.625rem;
    transition: transform var(--transition-fast);
  }

  tree-view [aria-expanded="true"] > [data-toggle]::before {
    transform: rotate(90deg);
  }

  /* Icons */
  tree-view [data-icon] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--text-muted);
  }

  tree-view [data-icon="folder"]::before {
    content: "📁";
  }

  tree-view [data-icon="folder-open"]::before {
    content: "📂";
  }

  tree-view [data-icon="file"]::before {
    content: "📄";
  }

  tree-view [data-icon="image"]::before {
    content: "🖼️";
  }

  /* Label */
  tree-view [data-label] {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }

  /* Leaf nodes (no children) */
  tree-view [data-leaf] {
    padding-inline-start: calc(1.25rem + var(--spacing-xs) + var(--spacing-sm));
  }

  /* Children container */
  tree-view ul[role="group"] {
    width: 100%;
  }

  tree-view ul[role="group"][hidden] {
    display: none;
  }

  /* Selected state */
  tree-view [data-selected] {
    background: oklch(0.95 0.05 250);
    color: var(--primary);
  }

  tree-view [data-selected] [data-label] {
    font-weight: var(--font-weight-medium);
    color: var(--primary);
  }

  /* Lines style variant */
  tree-view[data-style="lines"] ul ul {
    position: relative;
    margin-inline-start: 0.625rem;
    padding-inline-start: var(--spacing-md);
    border-inline-start: 1px solid var(--border);
  }

  tree-view[data-style="lines"] ul ul [data-node]::before {
    content: "";
    position: absolute;
    left: 0;
    width: var(--spacing-sm);
    height: 1px;
    background: var(--border);
  }

  /* Compact variant */
  tree-view[data-style="compact"] [data-node] {
    padding: var(--spacing-xs) var(--spacing-xs);
  }

  tree-view[data-style="compact"] ul ul {
    padding-inline-start: var(--spacing-md);
  }

  /* Disabled nodes */
  tree-view [data-disabled] {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Loading state */
  tree-view [data-loading] [data-toggle]::before {
    content: "";
    width: 0.75rem;
    height: 0.75rem;
    border: 2px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: tree-spin 0.6s linear infinite;
  }

  @keyframes tree-spin {
    to { transform: rotate(360deg); }
  }

  /* Drag and drop */
  tree-view [data-dragging] {
    opacity: 0.5;
  }

  tree-view [data-drop-target] {
    outline: 2px dashed var(--primary);
    outline-offset: -2px;
  }

  /* Checkbox tree */
  tree-view[data-checkable] [data-checkbox] {
    width: 1rem;
    height: 1rem;
    margin-inline-end: var(--spacing-xs);
  }

  tree-view [data-checkbox]:indeterminate {
    opacity: 0.6;
  }
}
```

## JavaScript Enhancement

```javascript
class TreeView extends HTMLElement {
  connectedCallback() {
    this.tree = this.querySelector('[role="tree"]');

    // Toggle expand/collapse
    this.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        const node = toggle.closest('[data-node]');
        this.toggleNode(node);
        return;
      }

      // Selection
      if (this.hasAttribute('data-selectable')) {
        const node = e.target.closest('[data-node]');
        if (node && !e.target.closest('[data-toggle]')) {
          this.selectNode(node);
        }
      }
    });

    // Keyboard navigation
    this.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  toggleNode(node) {
    const expanded = node.getAttribute('aria-expanded') === 'true';
    const children = node.querySelector('[role="group"]');

    if (children) {
      node.setAttribute('aria-expanded', !expanded);
      children.hidden = expanded;

      // Update folder icon
      const icon = node.querySelector('[data-icon]');
      if (icon) {
        icon.dataset.icon = expanded ? 'folder' : 'folder-open';
      }

      this.dispatchEvent(new CustomEvent('toggle', {
        detail: { node, expanded: !expanded }
      }));
    }
  }

  selectNode(node) {
    // Clear previous selection
    this.querySelectorAll('[data-selected]').forEach((n) => {
      n.removeAttribute('data-selected');
    });

    node.setAttribute('data-selected', '');

    this.dispatchEvent(new CustomEvent('select', {
      detail: { node, label: node.querySelector('[data-label]')?.textContent }
    }));
  }

  handleKeyboard(e) {
    const focused = document.activeElement.closest('[data-node]');
    if (!focused) return;

    switch (e.key) {
      case 'ArrowRight':
        if (focused.getAttribute('aria-expanded') === 'false') {
          this.toggleNode(focused);
        } else {
          // Focus first child
          const firstChild = focused.querySelector('[data-node]');
          firstChild?.focus();
        }
        e.preventDefault();
        break;

      case 'ArrowLeft':
        if (focused.getAttribute('aria-expanded') === 'true') {
          this.toggleNode(focused);
        } else {
          // Focus parent
          const parent = focused.parentElement.closest('[data-node]');
          parent?.focus();
        }
        e.preventDefault();
        break;

      case 'ArrowDown':
        this.focusNext(focused);
        e.preventDefault();
        break;

      case 'ArrowUp':
        this.focusPrevious(focused);
        e.preventDefault();
        break;

      case 'Enter':
      case ' ':
        if (this.hasAttribute('data-selectable')) {
          this.selectNode(focused);
        }
        e.preventDefault();
        break;
    }
  }

  focusNext(current) {
    const all = Array.from(this.querySelectorAll('[data-node]:not([hidden] [data-node])'));
    const index = all.indexOf(current);
    if (index < all.length - 1) {
      all[index + 1].focus();
    }
  }

  focusPrevious(current) {
    const all = Array.from(this.querySelectorAll('[data-node]:not([hidden] [data-node])'));
    const index = all.indexOf(current);
    if (index > 0) {
      all[index - 1].focus();
    }
  }
}

customElements.define('tree-view', TreeView);
```

## Accessibility

- **ARIA Tree**: Proper `role="tree"`, `role="treeitem"`, `role="group"`
- **Expanded State**: `aria-expanded` indicates open/closed
- **Keyboard Navigation**: Arrow keys, Enter, Space
- **Focus Management**: Tab into tree, arrows to navigate

## Examples

### File Browser

```html
<tree-view data-icons data-selectable>
  <ul role="tree">
    <li role="treeitem" aria-expanded="true" data-node tabindex="0">
      <span data-toggle></span>
      <span data-icon="folder-open"></span>
      <span data-label>src</span>
      <ul role="group">
        <li role="treeitem" data-node data-leaf tabindex="-1">
          <span data-icon="file"></span>
          <span data-label>index.js</span>
        </li>
        <li role="treeitem" data-node data-leaf tabindex="-1">
          <span data-icon="file"></span>
          <span data-label>styles.css</span>
        </li>
      </ul>
    </li>
  </ul>
</tree-view>
```

### Category Tree

```html
<tree-view data-style="lines" data-selectable>
  <ul role="tree">
    <li role="treeitem" aria-expanded="true" data-node>
      <span data-toggle></span>
      <span data-label>Electronics</span>
      <ul role="group">
        <li role="treeitem" aria-expanded="false" data-node>
          <span data-toggle></span>
          <span data-label>Computers</span>
          <ul role="group" hidden>
            <li role="treeitem" data-node data-leaf>
              <span data-label>Laptops</span>
            </li>
            <li role="treeitem" data-node data-leaf>
              <span data-label>Desktops</span>
            </li>
          </ul>
        </li>
        <li role="treeitem" data-node data-leaf>
          <span data-label>Phones</span>
        </li>
      </ul>
    </li>
  </ul>
</tree-view>
```

## Related Patterns

- [nav-menu](../navigation/nav-menu.md)
- [sidebar-layout](../layout/sidebar-layout.md)
- [data-list](./data-list.md)
