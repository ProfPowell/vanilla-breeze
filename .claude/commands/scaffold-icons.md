# Scaffold Icons Command

Set up the Lucide icon system in a project.

## What This Command Does

1. **Install lucide-static** (if not already installed)
2. **Sync icons** to `.assets/icons/lucide/`
3. **Create custom directory** at `.assets/icons/custom/`
4. **Copy icon-wc component** to project (if needed)
5. **Add to elements.json** for HTML validation

## Usage

```
/scaffold-icons
```

## Steps to Execute

### 1. Check if lucide-static is installed

```bash
npm list lucide-static 2>/dev/null || npm install lucide-static --save-dev
```

### 2. Run icon sync

```bash
npm run icons:sync
```

If `icons:sync` script doesn't exist, add it to package.json:

```json
{
  "scripts": {
    "icons:sync": "node .claude/scripts/sync-icons.js"
  }
}
```

### 3. Copy icon-wc component

Copy the component to your site's assets:

```bash
mkdir -p .assets/js/components/icon-wc
cp .claude/skills/icons/templates/icon-wc/*.js .assets/js/components/icon-wc/
```

The component files are:
- `icon-wc.js` - Web Component class
- `x-icon-styles.js` - Component styles

### 4. Update elements.json

Add icon-wc element definition if not present:

```json
{
  "icon-wc": {
    "flow": true,
    "phrasing": true,
    "void": true,
    "attributes": {
      "name": { "required": true },
      "set": {},
      "size": { "enum": ["xs", "sm", "md", "lg", "xl", "2xl"] },
      "label": {},
      "base-path": {}
    }
  }
}
```

### 5. Verify setup

```bash
# Check icon count
ls .assets/icons/lucide/*.svg | wc -l

# Check manifest exists
cat .assets/icons/lucide/index.json | head -5
```

## Expected Output

```
Icon Sync
Syncing Lucide icons to .assets/icons/lucide/

Found 1912 icons in lucide-static
Copied 1912 icons to .assets/icons/lucide
Generated index.json manifest

Done! Icons are ready in .assets/icons/lucide/
Add custom icons to .assets/icons/custom/
```

## After Running

1. Include icon-wc component in your HTML:

```html
<script type="module" src="/.assets/js/components/icon-wc/icon-wc.js"></script>
```

2. Use icons:

```html
<icon-wc name="menu"></icon-wc>
<icon-wc name="home" size="lg"></icon-wc>
```

## Troubleshooting

**Icons not loading:**
- Check base path matches your asset structure
- Verify icons exist in `.assets/icons/lucide/`
- Check browser console for fetch errors

**Component not defined:**
- Ensure icon-wc.js is imported with `type="module"`
- Check for JavaScript errors in console

**Icon not found:**
- Search https://lucide.dev/icons for correct name
- Check `.assets/icons/lucide/index.json` for available icons
