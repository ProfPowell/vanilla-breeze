# Progress Bar

## Description

Visual indicator of operation progress. Uses the native `<progress>` element with enhancements for styling and accessibility.

## Anatomy

- **container**: Progress wrapper
- **bar**: The native `<progress>` element
- **label**: Optional text describing the progress
- **value**: Optional percentage or step indicator

## States

| State | Description |
|-------|-------------|
| Determinate | Known progress (0-100%) |
| Indeterminate | Unknown duration (loading) |
| Complete | 100% filled |

## Variants

### Size

**Attribute:** `data-size`
**Values:** `small`, `medium`, `large`

### Color

**Attribute:** `data-color`
**Values:** `default`, `success`, `warning`, `error`

## Baseline HTML

```html
<div class="progress">
  <label for="upload">Uploading file...</label>
  <progress id="upload" value="75" max="100">75%</progress>
</div>
```

## Enhanced HTML

```html
<progress-bar data-size="medium" data-color="default">
  <label id="progress-label">Uploading document.pdf</label>
  <progress aria-labelledby="progress-label" value="75" max="100">75%</progress>
  <span data-value>75%</span>
</progress-bar>
```

## CSS

```css
@layer components {
  progress-bar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);

    /* Label */
    & label {
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text);
    }

    /* Progress element reset */
    & progress {
      appearance: none;
      width: 100%;
      height: 0.5rem;
      border: none;
      border-radius: var(--radius-full);
      background: var(--progress-bg, oklch(0.9 0 0));
      overflow: hidden;
    }

    /* WebKit */
    & progress::-webkit-progress-bar {
      background: var(--progress-bg, oklch(0.9 0 0));
      border-radius: var(--radius-full);
    }

    & progress::-webkit-progress-value {
      background: var(--progress-fill, var(--primary));
      border-radius: var(--radius-full);
      transition: width 0.3s ease-out;
    }

    /* Firefox */
    & progress::-moz-progress-bar {
      background: var(--progress-fill, var(--primary));
      border-radius: var(--radius-full);
    }

    /* Value display */
    & [data-value] {
      font-size: var(--text-sm);
      color: var(--text-muted);
      text-align: right;
    }

    /* With label and value inline */
    &[data-inline] {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-sm);

      & label {
        flex: 1;
      }

      & progress {
        width: 100%;
        order: 3;
      }
    }

    /* Size variants */
    &[data-size="small"] progress {
      height: 0.25rem;
    }

    &[data-size="large"] progress {
      height: 1rem;
    }

    /* Color variants */
    &[data-color="success"] {
      --progress-fill: var(--success, oklch(0.55 0.15 145));
    }

    &[data-color="warning"] {
      --progress-fill: var(--warning, oklch(0.7 0.15 85));
    }

    &[data-color="error"] {
      --progress-fill: var(--error, oklch(0.55 0.2 25));
    }

    /* Indeterminate state */
    & progress:indeterminate {
      animation: progress-indeterminate 1.5s ease-in-out infinite;
    }

    & progress:indeterminate::-webkit-progress-bar {
      background: linear-gradient(
        90deg,
        var(--progress-bg) 0%,
        var(--progress-fill) 50%,
        var(--progress-bg) 100%
      );
      background-size: 200% 100%;
      animation: progress-shimmer 1.5s ease-in-out infinite;
    }

    /* Striped variant */
    &[data-striped] progress::-webkit-progress-value {
      background-image: linear-gradient(
        45deg,
        oklch(1 0 0 / 0.15) 25%,
        transparent 25%,
        transparent 50%,
        oklch(1 0 0 / 0.15) 50%,
        oklch(1 0 0 / 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 1rem 1rem;
    }

    &[data-striped][data-animated] progress::-webkit-progress-value {
      animation: progress-stripes 1s linear infinite;
    }
  }

  @keyframes progress-shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  @keyframes progress-stripes {
    from { background-position: 1rem 0; }
    to { background-position: 0 0; }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    progress-bar progress,
    progress-bar progress::-webkit-progress-value {
      animation: none;
      transition: none;
    }
  }
}

/* Step progress */
@layer components {
  step-progress {
    display: flex;
    justify-content: space-between;
    position: relative;

    /* Track line */
    &::before {
      content: "";
      position: absolute;
      top: 1rem;
      left: 2rem;
      right: 2rem;
      height: 2px;
      background: var(--border);
      z-index: 0;
    }

    /* Filled track */
    &::after {
      content: "";
      position: absolute;
      top: 1rem;
      left: 2rem;
      height: 2px;
      background: var(--primary);
      z-index: 1;
      width: var(--progress-width, 0%);
      transition: width 0.3s ease-out;
    }

    /* Steps */
    & [data-step] {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      position: relative;
      z-index: 2;
    }

    & [data-step-indicator] {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-full);
      background: var(--surface);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-medium);
      font-size: var(--text-sm);
    }

    & [data-step-label] {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    /* Active step */
    & [data-step="active"] [data-step-indicator] {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--primary-contrast);
    }

    & [data-step="active"] [data-step-label] {
      color: var(--text);
      font-weight: var(--font-weight-medium);
    }

    /* Completed step */
    & [data-step="complete"] [data-step-indicator] {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--primary-contrast);
    }
  }
}
```

## JavaScript Enhancement

```javascript
class ProgressBar extends HTMLElement {
  static observedAttributes = ['value', 'max'];

  connectedCallback() {
    this.progress = this.querySelector('progress');
    this.valueDisplay = this.querySelector('[data-value]');
    this.updateDisplay();
  }

  attributeChangedCallback() {
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.progress || !this.valueDisplay) return;

    const value = this.progress.value;
    const max = this.progress.max || 100;
    const percentage = Math.round((value / max) * 100);

    this.valueDisplay.textContent = `${percentage}%`;

    // Update color based on progress
    if (percentage === 100) {
      this.setAttribute('data-color', 'success');
    }
  }

  // Animate to value
  animateTo(targetValue, duration = 500) {
    const start = this.progress.value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.progress.value = start + (targetValue - start) * progress;
      this.updateDisplay();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}

customElements.define('progress-bar', ProgressBar);
```

## Accessibility

- **Native Element**: Uses `<progress>` for built-in semantics
- **Label**: Associated label describes the progress
- **Fallback**: Text content inside `<progress>` for older browsers
- **ARIA**: `aria-labelledby` connects to label

## Examples

### Basic Progress Bar

```html
<progress-bar data-size="medium">
  <label>Download progress</label>
  <progress value="45" max="100">45%</progress>
  <span data-value>45%</span>
</progress-bar>
```

### Indeterminate Loading

```html
<progress-bar data-size="small">
  <label>Loading...</label>
  <progress></progress>
</progress-bar>
```

### Upload Progress with Color Change

```html
<progress-bar data-size="large" data-color="default" id="upload-progress">
  <label>Uploading files (3 of 5)</label>
  <progress value="60" max="100">60%</progress>
  <span data-value>60%</span>
</progress-bar>
```

### Striped Animated

```html
<progress-bar data-size="large" data-striped data-animated>
  <label>Processing...</label>
  <progress value="75" max="100">75%</progress>
</progress-bar>
```

### Step Progress

```html
<step-progress style="--progress-width: 50%">
  <div data-step="complete">
    <span data-step-indicator>✓</span>
    <span data-step-label>Cart</span>
  </div>
  <div data-step="complete">
    <span data-step-indicator>✓</span>
    <span data-step-label>Shipping</span>
  </div>
  <div data-step="active">
    <span data-step-indicator>3</span>
    <span data-step-label>Payment</span>
  </div>
  <div data-step>
    <span data-step-indicator>4</span>
    <span data-step-label>Confirm</span>
  </div>
</step-progress>
```

## Related Patterns

- [skeleton](./skeleton.md)
- [toast](./toast.md)
- [empty-state](./empty-state.md)
