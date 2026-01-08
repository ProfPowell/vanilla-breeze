# Popover

## Description

Contextual overlay triggered by user action. Uses the native Popover API for lightweight, accessible overlays. Ideal for menus, tooltips, and non-modal information.

## Anatomy

- **trigger**: Element that opens the popover
- **popover**: Content container with `popover` attribute
- **content**: Popover body content
- **arrow**: Optional pointing arrow

## States

| State | Description |
|-------|-------------|
| Closed | Hidden |
| Open | Visible and positioned |

## Variants

### Type

**Attribute:** `popover`
**Values:** `auto` (default, light-dismiss), `manual` (requires explicit close)

### Position

**Attribute:** `data-position`
**Values:** `top`, `bottom`, `left`, `right`

## Baseline HTML

```html
<button popovertarget="my-popover">Open Menu</button>

<div id="my-popover" popover>
  <p>Popover content here</p>
</div>
```

## Enhanced HTML

```html
<popover-menu>
  <button popovertarget="user-menu" aria-expanded="false">
    <img src="avatar.jpg" alt="" />
    <span>John Doe</span>
    <x-icon name="chevron-down"></x-icon>
  </button>

  <div id="user-menu" popover data-position="bottom">
    <nav aria-label="User menu">
      <a href="/profile">
        <x-icon name="user"></x-icon>
        Profile
      </a>
      <a href="/settings">
        <x-icon name="settings"></x-icon>
        Settings
      </a>
      <hr />
      <button type="button" data-action="logout">
        <x-icon name="log-out"></x-icon>
        Sign out
      </button>
    </nav>
  </div>
</popover-menu>
```

## CSS

```css
@layer components {
  /* Popover base styles */
  [popover] {
    margin: 0;
    padding: var(--spacing-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    min-width: 10rem;

    /* Reset default popover styles */
    &:popover-open {
      display: block;
    }
  }

  /* Popover menu component */
  popover-menu {
    display: inline-block;
    position: relative;
  }

  popover-menu [popover] {
    position: absolute;
    inset: unset;

    /* Position variants */
    &[data-position="bottom"] {
      top: 100%;
      left: 0;
      margin-block-start: var(--spacing-xs);
    }

    &[data-position="top"] {
      bottom: 100%;
      left: 0;
      margin-block-end: var(--spacing-xs);
    }

    &[data-position="left"] {
      right: 100%;
      top: 0;
      margin-inline-end: var(--spacing-xs);
    }

    &[data-position="right"] {
      left: 100%;
      top: 0;
      margin-inline-start: var(--spacing-xs);
    }
  }

  /* Navigation menu styling */
  popover-menu nav {
    display: flex;
    flex-direction: column;
  }

  popover-menu nav a,
  popover-menu nav button {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--text);
    text-decoration: none;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--text-sm);
    text-align: start;
    width: 100%;
    transition: background var(--transition-fast);

    &:hover {
      background: var(--overlay-light);
    }

    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }

  popover-menu nav hr {
    margin: var(--spacing-xs) 0;
    border: none;
    border-top: 1px solid var(--border);
  }

  popover-menu nav x-icon {
    color: var(--text-muted);
  }

  /* Trigger button styling */
  popover-menu > button {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--text-sm);
    transition: background var(--transition-fast);

    &:hover {
      background: var(--overlay-light);
    }

    & img {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--radius-full);
    }
  }

  /* Tooltip variant */
  [popover].tooltip {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--text-sm);
    background: var(--surface-dark, oklch(0.2 0 0));
    color: white;
    border: none;
    max-width: 20rem;
  }

  /* Animation */
  @keyframes popover-show {
    from {
      opacity: 0;
      transform: translateY(-0.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  [popover]:popover-open {
    animation: popover-show 0.15s ease-out;
  }

  /* With arrow */
  [popover][data-arrow]::before {
    content: "";
    position: absolute;
    width: 0.5rem;
    height: 0.5rem;
    background: inherit;
    border: inherit;
    border-right: none;
    border-bottom: none;
    transform: rotate(45deg);
  }

  [popover][data-arrow][data-position="bottom"]::before {
    top: -0.3rem;
    left: 1rem;
  }

  [popover][data-arrow][data-position="top"]::before {
    bottom: -0.3rem;
    left: 1rem;
    transform: rotate(-135deg);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    [popover]:popover-open {
      animation: none;
    }
  }
}
```

## JavaScript Enhancement

```javascript
class PopoverMenu extends HTMLElement {
  connectedCallback() {
    const trigger = this.querySelector('[popovertarget]');
    const popover = this.querySelector('[popover]');

    if (!trigger || !popover) return;

    // Update aria-expanded on toggle
    popover.addEventListener('toggle', (e) => {
      trigger.setAttribute('aria-expanded', e.newState === 'open');
    });

    // Keyboard navigation in menu
    const items = popover.querySelectorAll('a, button');

    popover.addEventListener('keydown', (e) => {
      const currentIndex = [...items].indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(currentIndex + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    });

    // Focus first item when opened
    popover.addEventListener('toggle', (e) => {
      if (e.newState === 'open') {
        items[0]?.focus();
      }
    });
  }
}

customElements.define('popover-menu', PopoverMenu);
```

## Accessibility

- **Trigger**: Uses `popovertarget` for native association
- **Aria Expanded**: Indicates open state
- **Keyboard**: Arrow keys navigate, Escape closes
- **Focus Management**: Focus moves to popover on open
- **Light Dismiss**: Auto-closes on outside click

## Examples

### Dropdown Menu

```html
<popover-menu>
  <button popovertarget="actions-menu">
    Actions
    <x-icon name="chevron-down"></x-icon>
  </button>

  <div id="actions-menu" popover data-position="bottom">
    <nav>
      <a href="#edit"><x-icon name="edit"></x-icon> Edit</a>
      <a href="#duplicate"><x-icon name="copy"></x-icon> Duplicate</a>
      <hr />
      <button data-action="delete"><x-icon name="trash"></x-icon> Delete</button>
    </nav>
  </div>
</popover-menu>
```

### Tooltip

```html
<button popovertarget="help-tip" popovertargetaction="toggle">
  <x-icon name="help-circle"></x-icon>
</button>

<div id="help-tip" popover="manual" class="tooltip" data-position="top" data-arrow>
  This action cannot be undone.
</div>
```

### Info Popover

```html
<button popovertarget="more-info">
  Learn more
  <x-icon name="info"></x-icon>
</button>

<div id="more-info" popover data-position="right">
  <h3>Feature Details</h3>
  <p>Extended information about this feature goes here.</p>
  <a href="/docs">Read documentation</a>
</div>
```

### Command Palette Trigger

```html
<button popovertarget="cmd-palette">
  <x-icon name="command"></x-icon>
  Commands
  <kbd>⌘K</kbd>
</button>

<div id="cmd-palette" popover="manual" data-position="bottom">
  <input type="search" placeholder="Type a command..." />
  <nav>
    <!-- Command list -->
  </nav>
</div>
```

## Related Patterns

- [modal](./modal.md)
- [toast](./toast.md)
- [site-header](../navigation/site-header.md)
