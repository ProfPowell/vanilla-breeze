# Add CSS Design Tokens

Generate a starter design token system using CSS custom properties.

## Arguments
- `$ARGUMENTS` - Optional: specific token categories to include (colors, spacing, typography, effects)

## Instructions

1. If a `_tokens.css` or tokens layer already exists, extend it
2. Otherwise, create a new tokens section
3. Ask which categories to include if not specified
4. Generate the token structure with sensible defaults
5. Include both light and dark theme tokens if requested

## Output Template

```css
@layer tokens {
  :root {
    /* Colors */
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-secondary: #64748b;
    --color-success: #22c55e;
    --color-warning: #f59e0b;
    --color-error: #ef4444;

    --color-text: #1f2937;
    --color-text-muted: #6b7280;
    --color-background: #ffffff;
    --color-surface: #f9fafb;
    --color-border: #e5e7eb;

    /* Spacing Scale */
    --spacing-xs: 0.25rem;   /* 4px */
    --spacing-sm: 0.5rem;    /* 8px */
    --spacing-md: 1rem;      /* 16px */
    --spacing-lg: 1.5rem;    /* 24px */
    --spacing-xl: 2rem;      /* 32px */
    --spacing-2xl: 3rem;     /* 48px */

    /* Typography */
    --font-family-base: system-ui, -apple-system, sans-serif;
    --font-family-mono: ui-monospace, 'Cascadia Code', monospace;

    --font-size-xs: 0.75rem;   /* 12px */
    --font-size-sm: 0.875rem;  /* 14px */
    --font-size-base: 1rem;    /* 16px */
    --font-size-lg: 1.125rem;  /* 18px */
    --font-size-xl: 1.25rem;   /* 20px */
    --font-size-2xl: 1.5rem;   /* 24px */
    --font-size-3xl: 2rem;     /* 32px */

    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    --line-height-tight: 1.25;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;

    /* Effects */
    --shadow-sm: 0 1px 2px rgb(0 0 0 / 5%);
    --shadow-md: 0 4px 6px rgb(0 0 0 / 10%);
    --shadow-lg: 0 10px 15px rgb(0 0 0 / 10%);

    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-full: 9999px;

    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;

    /* Layout */
    --content-width: 65ch;
    --page-width: 1200px;
    --header-height: 4rem;
  }

  /* Dark theme override */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-text: #f9fafb;
      --color-text-muted: #9ca3af;
      --color-background: #111827;
      --color-surface: #1f2937;
      --color-border: #374151;
    }
  }
}
```

## Usage Examples

```
/add-css-tokens
/add-css-tokens colors spacing
/add-css-tokens with dark theme support
```

## Notes

- Tokens should be defined in a `tokens` layer for proper cascade order
- Use semantic names (--color-primary) not literal names (--color-blue)
- Include comments for px values next to rem values
- Consider using `light-dark()` for modern theme switching
