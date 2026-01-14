# Modal

## Description

Dialog overlay for focused interactions requiring user attention. Uses the native `<dialog>` element for built-in accessibility and focus management.

## Anatomy

- **backdrop**: Semi-transparent overlay
- **dialog**: Content container
- **header**: Title and close button
- **body**: Main content area
- **footer**: Action buttons

## States

| State | Description |
|-------|-------------|
| Closed | Hidden from view |
| Opening | Fade-in animation |
| Open | Visible and interactive |
| Closing | Fade-out animation |

## Variants

### Size

**Attribute:** `data-size`
**Values:** `small`, `medium`, `large`, `full`

### Type

**Attribute:** `data-type`
**Values:** `default`, `alert`, `confirm`

## Baseline HTML

```html
<dialog>
  <h2>Modal Title</h2>
  <p>Modal content goes here.</p>
  <form method="dialog">
    <button>Close</button>
  </form>
</dialog>
```

## Enhanced HTML

```html
<modal-dialog data-size="medium">
  <dialog>
    <header data-header>
      <h2 id="modal-title">Edit Profile</h2>
      <button data-close aria-label="Close">
        <x-icon name="x"></x-icon>
      </button>
    </header>

    <div data-body>
      <form>
        <label>
          Name
          <input type="text" name="name" />
        </label>
        <label>
          Email
          <input type="email" name="email" />
        </label>
      </form>
    </div>

    <footer data-footer>
      <button data-action="cancel">Cancel</button>
      <button data-action="confirm" data-button="primary">Save Changes</button>
    </footer>
  </dialog>
</modal-dialog>
```

## CSS

```css
@layer components {
  modal-dialog {
    display: contents;
  }

  modal-dialog dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    padding: 0;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow-xl);
    max-height: calc(100vh - var(--size-2xl) * 2);
    max-width: calc(100vw - var(--size-l) * 2);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    /* Backdrop */
    &::backdrop {
      background: oklch(0 0 0 / 0.5);
      backdrop-filter: blur(4px);
    }

    /* Header */
    & [data-header] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--size-m);
      padding: var(--size-l);
      border-block-end: 1px solid var(--border);

      & h2 {
        margin: 0;
        font-size: var(--text-xl);
        font-weight: var(--font-weight-semibold);
      }
    }

    & [data-close] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      color: var(--text-muted);
      transition: background var(--transition-fast), color var(--transition-fast);

      &:hover {
        background: var(--overlay-light);
        color: var(--text);
      }
    }

    /* Body */
    & [data-body] {
      flex: 1;
      overflow-y: auto;
      padding: var(--size-l);
    }

    /* Footer */
    & [data-footer] {
      display: flex;
      justify-content: flex-end;
      gap: var(--size-xs);
      padding: var(--size-l);
      border-block-start: 1px solid var(--border);
      background: var(--surface-alt);
    }

    & [data-footer] button {
      padding: var(--size-xs) var(--size-l);
      font-weight: var(--font-weight-medium);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    & [data-action="cancel"] {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);

      &:hover {
        background: var(--overlay-light);
      }
    }

    & [data-button="primary"] {
      background: var(--primary);
      color: var(--primary-contrast);
      border: none;

      &:hover {
        background: var(--primary-hover);
      }
    }

    /* Size variants */
    &[data-size="small"],
    modal-dialog[data-size="small"] & {
      width: 24rem;
    }

    &[data-size="medium"],
    modal-dialog[data-size="medium"] & {
      width: 32rem;
    }

    &[data-size="large"],
    modal-dialog[data-size="large"] & {
      width: 48rem;
    }

    &[data-size="full"],
    modal-dialog[data-size="full"] & {
      width: calc(100vw - var(--size-l) * 2);
      height: calc(100vh - var(--size-l) * 2);
      max-height: none;
      border-radius: var(--radius-md);
    }
  }

  /* Animation */
  @keyframes modal-open {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes backdrop-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  modal-dialog dialog[open] {
    animation: modal-open 0.2s ease-out;
  }

  modal-dialog dialog[open]::backdrop {
    animation: backdrop-fade 0.2s ease-out;
  }

  /* Closing animation */
  modal-dialog dialog[data-closing] {
    animation: modal-open 0.15s ease-in reverse;
  }

  modal-dialog dialog[data-closing]::backdrop {
    animation: backdrop-fade 0.15s ease-in reverse;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    modal-dialog dialog[open],
    modal-dialog dialog[open]::backdrop {
      animation: none;
    }
  }
}

/* Form styling inside modals */
@layer components {
  modal-dialog form {
    display: flex;
    flex-direction: column;
    gap: var(--size-m);
  }

  modal-dialog label {
    display: flex;
    flex-direction: column;
    gap: var(--size-2xs);
    font-weight: var(--font-weight-medium);
  }

  modal-dialog input,
  modal-dialog textarea,
  modal-dialog select {
    padding: var(--size-xs) var(--size-m);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--text-base);

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }
}
```

## JavaScript Enhancement

```javascript
class ModalDialog extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');

    // Close button
    this.querySelector('[data-close]')?.addEventListener('click', () => {
      this.close();
    });

    // Cancel button
    this.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this.close();
    });

    // Backdrop click
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });

    // ESC key handled natively by dialog

    // Confirm button
    this.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('confirm'));
      this.close();
    });
  }

  open() {
    this.dialog.showModal();
  }

  close() {
    this.dialog.setAttribute('data-closing', '');
    this.dialog.addEventListener('animationend', () => {
      this.dialog.close();
      this.dialog.removeAttribute('data-closing');
    }, { once: true });
  }
}

customElements.define('modal-dialog', ModalDialog);
```

## Accessibility

- **Native Dialog**: Uses `<dialog>` for built-in a11y
- **Focus Trap**: Focus stays within modal while open
- **ESC to Close**: Native keyboard dismissal
- **Focus Restoration**: Focus returns to trigger on close
- **ARIA**: `aria-labelledby` points to title

## Examples

### Basic Modal

```html
<button onclick="document.querySelector('#basic-modal dialog').showModal()">
  Open Modal
</button>

<modal-dialog id="basic-modal" data-size="small">
  <dialog aria-labelledby="basic-title">
    <header data-header>
      <h2 id="basic-title">Modal Title</h2>
      <button data-close aria-label="Close">
        <x-icon name="x"></x-icon>
      </button>
    </header>
    <div data-body>
      <p>This is the modal content.</p>
    </div>
    <footer data-footer>
      <button data-action="cancel">Close</button>
    </footer>
  </dialog>
</modal-dialog>
```

### Confirmation Modal

```html
<modal-dialog data-size="small" data-type="confirm">
  <dialog>
    <header data-header>
      <h2>Delete Item?</h2>
    </header>
    <div data-body>
      <p>Are you sure you want to delete this item? This action cannot be undone.</p>
    </div>
    <footer data-footer>
      <button data-action="cancel">Cancel</button>
      <button data-action="confirm" data-button="danger">Delete</button>
    </footer>
  </dialog>
</modal-dialog>
```

### Form Modal

```html
<modal-dialog data-size="medium">
  <dialog aria-labelledby="form-title">
    <header data-header>
      <h2 id="form-title">Edit Profile</h2>
      <button data-close aria-label="Close">
        <x-icon name="x"></x-icon>
      </button>
    </header>
    <div data-body>
      <form id="profile-form">
        <label>
          Name
          <input type="text" name="name" required />
        </label>
        <label>
          Bio
          <textarea name="bio" rows="3"></textarea>
        </label>
      </form>
    </div>
    <footer data-footer>
      <button data-action="cancel">Cancel</button>
      <button type="submit" form="profile-form" data-button="primary">Save</button>
    </footer>
  </dialog>
</modal-dialog>
```

## Related Patterns

- [popover](./popover.md)
- [alert](./alert.md)
- [toast](./toast.md)
