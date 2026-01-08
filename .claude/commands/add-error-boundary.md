# Add Error Boundary Command

Add an error boundary component to catch and handle errors in JavaScript applications.

## Usage

```
/add-error-boundary [component-name]
```

## Arguments

- `$ARGUMENTS` - Optional component name to wrap (default: creates reusable boundary)

## Examples

```
/add-error-boundary
/add-error-boundary user-profile
/add-error-boundary checkout-form
```

## Steps to Execute

### 1. Parse Arguments

Extract the component name if provided:
- If no name: create reusable `<error-boundary>` component
- If name provided: wrap specific component

### 2. Generate Error Boundary Component

Create the error boundary custom element:

```javascript
/**
 * Error boundary custom element
 * Catches errors in child components and displays fallback
 */
class ErrorBoundary extends HTMLElement {
  connectedCallback() {
    this.originalContent = this.innerHTML;
    this.addEventListener('error', this.handleError.bind(this), true);
  }

  handleError(event) {
    event.stopPropagation();
    const error = event.error || event;

    console.error('ErrorBoundary caught:', error);

    // Report to observability system if available
    if (typeof reportError === 'function') {
      reportError({
        type: 'component-error',
        message: error.message,
        stack: error.stack,
        component: this.getAttribute('name') || 'unknown',
        timestamp: Date.now()
      });
    }

    this.showFallback(error);
  }

  showFallback(error) {
    const fallback = this.querySelector('[slot="fallback"]');

    if (fallback) {
      this.innerHTML = '';
      this.appendChild(fallback.cloneNode(true));
    } else {
      this.innerHTML = `
        <div class="error-fallback" role="alert">
          <p>Something went wrong.</p>
          <button type="button" onclick="this.closest('error-boundary').retry()">
            Try again
          </button>
        </div>
      `;
    }
  }

  retry() {
    this.innerHTML = this.originalContent;
  }
}

customElements.define('error-boundary', ErrorBoundary);
```

### 3. Add to elements.json

Register the custom element:

```json
{
  "error-boundary": {
    "flow": true,
    "permittedContent": ["@flow"],
    "attributes": {
      "name": { "type": "string" }
    }
  }
}
```

### 4. Example Usage

Show example of wrapping a component:

```html
<error-boundary name="user-profile">
  <user-profile user-id="123"></user-profile>
  <template slot="fallback">
    <div class="error-message">
      <p>Could not load user profile.</p>
      <a href="/support">Contact support</a>
    </div>
  </template>
</error-boundary>
```

## Default Fallback Styles

Add basic styles for the error fallback:

```css
.error-fallback {
  padding: var(--space-4, 1rem);
  border: 1px solid var(--color-error, #dc2626);
  border-radius: var(--radius-md, 0.375rem);
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error-text, #991b1b);
  text-align: center;
}

.error-fallback button {
  margin-top: var(--space-2, 0.5rem);
  padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
  background: var(--color-error, #dc2626);
  color: white;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  cursor: pointer;
}

.error-fallback button:hover {
  opacity: 0.9;
}
```

## Async Error Boundary

For async operations, use this pattern:

```javascript
class AsyncErrorBoundary extends ErrorBoundary {
  async loadContent(fn) {
    try {
      this.innerHTML = '<div class="loading">Loading...</div>';
      const content = await fn();
      this.innerHTML = content;
    } catch (error) {
      this.handleError({ error });
    }
  }
}

customElements.define('async-error-boundary', AsyncErrorBoundary);
```

## Notes

- Error boundaries catch synchronous errors in child components
- For async errors, wrap with try/catch or use AsyncErrorBoundary
- Always provide meaningful fallback UI
- Report errors to observability system for monitoring
- Use `name` attribute to identify which boundary caught the error
