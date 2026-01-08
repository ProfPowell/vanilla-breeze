# Empty State

## Description

Placeholder content shown when there's no data to display. Provides context about why the area is empty and guidance on next steps.

## Anatomy

- **container**: Empty state wrapper
- **illustration**: Optional visual (icon or image)
- **title**: Brief description of empty state
- **description**: Helpful context or instructions
- **action**: Primary CTA to resolve empty state

## States

| State | Description |
|-------|-------------|
| No Data | First-time or cleared state |
| No Results | Search/filter returned nothing |
| Error | Failed to load data |

## Variants

### Size

**Attribute:** `data-size`
**Values:** `small`, `medium`, `large`

### Type

**Attribute:** `data-type`
**Values:** `default`, `no-results`, `error`, `success`

## Baseline HTML

```html
<div class="empty-state">
  <p>No items yet</p>
  <p>Create your first item to get started.</p>
  <a href="/create">Create Item</a>
</div>
```

## Enhanced HTML

```html
<empty-state data-size="medium" data-type="default">
  <x-icon name="inbox" data-illustration></x-icon>
  <h3 data-title>No messages yet</h3>
  <p data-description>When you receive messages, they'll appear here.</p>
  <div data-actions>
    <a href="/compose" data-button="primary">Compose Message</a>
  </div>
</empty-state>
```

## CSS

```css
@layer components {
  empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--spacing-2xl);
    min-height: 20rem;

    /* Illustration */
    & [data-illustration] {
      font-size: 4rem;
      color: var(--text-muted);
      opacity: 0.5;
      margin-block-end: var(--spacing-lg);
    }

    & [data-illustration] img {
      max-width: 12rem;
      height: auto;
      opacity: 0.7;
    }

    /* Title */
    & [data-title] {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--text);
      margin: 0 0 var(--spacing-sm);
    }

    /* Description */
    & [data-description] {
      font-size: var(--text-base);
      color: var(--text-muted);
      max-width: 24rem;
      margin: 0 0 var(--spacing-lg);
      line-height: 1.6;
    }

    /* Actions */
    & [data-actions] {
      display: flex;
      gap: var(--spacing-sm);
    }

    & [data-button] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: transform var(--transition-fast);

      &:hover {
        transform: translateY(-1px);
      }
    }

    & [data-button="primary"] {
      background: var(--primary);
      color: var(--primary-contrast);
    }

    & [data-button="secondary"] {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }

    /* Size variants */
    &[data-size="small"] {
      padding: var(--spacing-lg);
      min-height: 10rem;

      & [data-illustration] {
        font-size: 2.5rem;
        margin-block-end: var(--spacing-md);
      }

      & [data-title] {
        font-size: var(--text-base);
      }

      & [data-description] {
        font-size: var(--text-sm);
      }
    }

    &[data-size="large"] {
      padding: var(--spacing-2xl) var(--spacing-xl);
      min-height: 30rem;

      & [data-illustration] {
        font-size: 6rem;
      }

      & [data-title] {
        font-size: var(--text-2xl);
      }
    }

    /* Type variants */
    &[data-type="no-results"] {
      & [data-illustration] {
        color: var(--text-muted);
      }
    }

    &[data-type="error"] {
      & [data-illustration] {
        color: var(--error);
      }
    }

    &[data-type="success"] {
      & [data-illustration] {
        color: var(--success);
      }
    }
  }
}
```

## Accessibility

- **Semantic Structure**: Uses appropriate headings
- **Action Labels**: CTAs are descriptive
- **Icon/Image Alt**: Illustrations are decorative (empty alt)

## Examples

### First-Time Empty State

```html
<empty-state data-size="large">
  <x-icon name="folder" data-illustration></x-icon>
  <h3 data-title>No projects yet</h3>
  <p data-description>Projects help you organize your work. Create your first project to get started.</p>
  <div data-actions>
    <a href="/projects/new" data-button="primary">
      <x-icon name="plus"></x-icon>
      Create Project
    </a>
  </div>
</empty-state>
```

### Search No Results

```html
<empty-state data-size="medium" data-type="no-results">
  <x-icon name="search" data-illustration></x-icon>
  <h3 data-title>No results found</h3>
  <p data-description>We couldn't find anything matching "{{ query }}". Try different keywords or check your filters.</p>
  <div data-actions>
    <button data-button="secondary" onclick="clearSearch()">Clear Search</button>
  </div>
</empty-state>
```

### Error State

```html
<empty-state data-size="medium" data-type="error">
  <x-icon name="alert-circle" data-illustration></x-icon>
  <h3 data-title>Unable to load data</h3>
  <p data-description>Something went wrong while loading your data. Please try again.</p>
  <div data-actions>
    <button data-button="primary" onclick="retry()">Try Again</button>
    <a href="/support" data-button="secondary">Contact Support</a>
  </div>
</empty-state>
```

### Compact Empty State (Table/List)

```html
<empty-state data-size="small">
  <x-icon name="users" data-illustration></x-icon>
  <h3 data-title>No team members</h3>
  <p data-description>Invite people to collaborate on this project.</p>
  <div data-actions>
    <button data-button="primary">Invite Members</button>
  </div>
</empty-state>
```

### Success/Completion State

```html
<empty-state data-size="medium" data-type="success">
  <x-icon name="check-circle" data-illustration></x-icon>
  <h3 data-title>All caught up!</h3>
  <p data-description>You've completed all your tasks. Great job!</p>
</empty-state>
```

## Related Patterns

- [skeleton](./skeleton.md)
- [alert](./alert.md)
- [progress-bar](./progress-bar.md)
