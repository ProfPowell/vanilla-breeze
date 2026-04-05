# Scaffold Component

Generate a complete web component directory with all required files.

## Arguments
- `$ARGUMENTS` - The component name in kebab-case (e.g., `my-widget`, `date-range`)

## Instructions

### 1. Validate the component name

The name must be a valid custom element name:
- All lowercase
- Contains at least one hyphen
- Starts with a letter (not a digit)
- Matches: `/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/`

If invalid, refuse with a clear error explaining the naming rules.

### 2. Check for existing component

Check if `src/web-components/$ARGUMENTS/` already exists. If it does, list the existing files and refuse:
> Component `$ARGUMENTS` already exists at `src/web-components/$ARGUMENTS/` with files: [list]. Use the existing directory instead.

**This check MUST happen before any file modifications.**

### 3. Create the component directory and files

Create `src/web-components/$ARGUMENTS/` with these four files:

#### logic.js

```javascript
/**
 * $ARGUMENTS: [Brief description — fill in]
 *
 * @example
 * <$ARGUMENTS>
 *   <!-- content -->
 * </$ARGUMENTS>
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

class ${PascalCase}Wc extends VBElement {
  setup() {
    // TODO: Initialize component
  }

  teardown() {
    // TODO: Cleanup beyond event listeners (if needed)
  }
}

registerComponent('$ARGUMENTS', ${PascalCase}Wc);
export { ${PascalCase}Wc };
```

Where `${PascalCase}` converts the kebab-case name to PascalCase (e.g., `my-widget` → `MyWidget`).

#### styles.css

```css
/* $ARGUMENTS component styles */
```

#### api.json

```json
{
  "$schema": "../../../schemas/api.schema.json",
  "element": "$ARGUMENTS",
  "type": "web-component",
  "description": "",
  "attributes": []
}
```

#### static.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$ARGUMENTS (Static Fallback)</title>
  <style>
    /*
      Static fallback for $ARGUMENTS.
      This file demonstrates the component's zero-JS baseline.
      A production page would load the project stylesheet instead.
    */
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: system-ui, sans-serif;
      line-height: 1.5;
      max-inline-size: 40rem;
      margin-inline: auto;
      padding: 2rem 1rem;
    }
  </style>
</head>
<body>
  <h1>$ARGUMENTS</h1>

  <!--
    Static HTML Form
    ================
    This is the zero-JS fallback for <$ARGUMENTS>.
    The enhanced web component adds: [describe JS enhancements here].

    TODO: Replace this placeholder with meaningful static markup
    that provides a degraded but functional experience.
  -->
  <noscript>
    <p>This component requires JavaScript for full functionality.</p>
  </noscript>

  <p>TODO: Add static fallback markup for <code>&lt;$ARGUMENTS&gt;</code>.</p>
</body>
</html>
```

### 4. Create the demo file

Create `demos/examples/demos/$ARGUMENTS-basic.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$ARGUMENTS Demo</title>
  <link rel="stylesheet" href="/src/main.css">
  <style>
    body {
      padding: var(--size-m);
      background: var(--color-surface);
    }
  </style>
</head>
<body>
  <$ARGUMENTS>
    <!-- TODO: Add component content -->
  </$ARGUMENTS>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### 5. Register in index.js

Append this line at the end of `src/web-components/index.js`:

```javascript
import './$ARGUMENTS/logic.js';
```

### 6. Add to elements.json

Read `.claude/schemas/elements.json` and add a new entry for the component:

```json
"$ARGUMENTS": {
  "flow": true,
  "permittedContent": ["@flow"],
  "attributes": {}
}
```

Insert it in alphabetical order within the JSON object.

### 7. Summary

Print what was created:

```
✓ Created src/web-components/$ARGUMENTS/logic.js
✓ Created src/web-components/$ARGUMENTS/styles.css
✓ Created src/web-components/$ARGUMENTS/api.json
✓ Created src/web-components/$ARGUMENTS/static.html
✓ Created demos/examples/demos/$ARGUMENTS-basic.html
✓ Registered in src/web-components/index.js
✓ Added to .claude/schemas/elements.json

Component $ARGUMENTS is ready. Next steps:
- Fill in the description in api.json
- Implement logic in logic.js
- Add meaningful static fallback in static.html
- Create a doc page at site/src/pages/docs/elements/web-components/$ARGUMENTS.html
```
