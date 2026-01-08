# Add Theme

Create a new brand theme variant with hue-based color generation.

## Arguments
- `$ARGUMENTS` - Theme name and optional hue value (e.g., "coral" or "midnight hue:280")

## Instructions

1. Parse theme name from arguments (lowercase, hyphenated)
2. Extract hue if provided, otherwise ask user for primary hue (0-360)
3. Create `/.claude/styles/tokens/themes/_brand-{name}.css`
4. Add theme to `tokens.json`

## Hue Reference

| Hue | Color |
|-----|-------|
| 0 | Red |
| 30 | Orange |
| 60 | Yellow |
| 90 | Lime |
| 120 | Green |
| 150 | Teal |
| 180 | Cyan |
| 210 | Sky |
| 240 | Blue |
| 270 | Purple |
| 300 | Magenta |
| 330 | Pink |

## Template

```css
/**
 * Brand Theme: {Name}
 * {Description}
 */

@layer tokens.theme {
  :root[data-theme="{name}"],
  [data-theme="{name}"] {
    --hue-primary: {hue};
    --hue-secondary: calc({hue} + 30);
    --hue-accent: calc({hue} + 180);

    --primary: oklch(0.55 0.18 var(--hue-primary));
    --primary-hover: oklch(from var(--primary) calc(l - 0.08) calc(c + 0.02) h);
    --primary-active: oklch(from var(--primary) calc(l - 0.12) c h);
    --primary-subtle: oklch(from var(--primary) 0.95 0.03 h);

    --secondary: oklch(0.50 0.10 var(--hue-secondary));
    --secondary-hover: oklch(from var(--secondary) calc(l - 0.08) c h);

    --accent: oklch(0.60 0.15 var(--hue-accent));
    --accent-hover: oklch(from var(--accent) calc(l - 0.08) c h);
  }

  /* {Name} + Dark mode */
  :root[data-theme="{name}"][data-mode="dark"],
  [data-theme="{name}"][data-mode="dark"] {
    color-scheme: dark;

    --primary: oklch(0.60 0.14 var(--hue-primary));

    --background: oklch(0.12 0.02 var(--hue-primary));
    --surface: oklch(0.16 0.02 var(--hue-primary));
    --surface-alt: oklch(0.20 0.02 var(--hue-primary));
  }
}
```

## Example Usage

```
/add-theme coral
/add-theme midnight hue:280
/add-theme seafoam hue:165
```
