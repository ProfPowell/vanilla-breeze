# Placeholder Image Command

Generate SVG placeholder images for prototypes and layouts.

## Usage

```
/placeholder-image <type> <size> [label]
```

## Arguments

- `$ARGUMENTS` - Type, size, and optional label

## Examples

```
/placeholder-image simple 400x400
/placeholder-image labeled 1200x400 "Hero Banner"
/placeholder-image product
/placeholder-image hero "Welcome"
```

## Steps to Execute

### 1. Parse Arguments

Extract type, size, and label from arguments:

- **Presets**: avatar-sm, avatar-lg, thumbnail, product, card, hero, og, logo, icon, banner, gallery
- **Types**: simple, labeled, brand
- **Size format**: WxH (e.g., 800x600)

### 2. Generate Placeholder

Run the generator script:

```bash
# Simple placeholder
node .claude/scripts/generate-placeholder.js --type simple --size 400x400 --output .assets/images/placeholder/

# Labeled placeholder
node .claude/scripts/generate-placeholder.js --type labeled --label "Hero Image" --size 1200x400 --output .assets/images/placeholder/

# Using preset
node .claude/scripts/generate-placeholder.js --preset hero --output .assets/images/placeholder/

# Preset with custom label
node .claude/scripts/generate-placeholder.js --preset product --label "Product Shot" --output .assets/images/placeholder/
```

### 3. Return HTML

After generating, provide the HTML to use:

```html
<img src="/.assets/images/placeholder/hero-image-1200x400.svg"
     alt="Hero banner placeholder"
     width="1200"
     height="400"/>
```

## Quick Reference

| Preset | Size | Default Label |
|--------|------|---------------|
| avatar-sm | 48x48 | Avatar |
| avatar-lg | 128x128 | Avatar |
| thumbnail | 150x150 | Thumbnail |
| product | 400x400 | Product |
| card | 400x225 | Card Image |
| hero | 1200x400 | Hero Image |
| og | 1200x630 | OG Image |

## Notes

- All placeholders are accessible with proper ARIA labels
- Files saved to `.assets/images/placeholder/` directory
- Use consistent naming: `{label}-{width}x{height}.svg`
