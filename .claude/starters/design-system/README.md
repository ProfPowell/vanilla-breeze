# {{DISPLAY_NAME}}

{{DESCRIPTION}}

## Installation

```bash
npm install {{LIBRARY_NAME}}
```

## Quick Start

Import the library to register all components:

```javascript
import '{{LIBRARY_NAME}}';
```

Or import specific components:

```javascript
import { DsButton, DsInput } from '{{LIBRARY_NAME}}';
```

## Usage

```html
<!-- Button -->
<{{COMPONENT_PREFIX}}-button variant="primary">Click me</{{COMPONENT_PREFIX}}-button>

<!-- Input -->
<{{COMPONENT_PREFIX}}-input label="Email" type="email"></{{COMPONENT_PREFIX}}-input>

<!-- Card -->
<{{COMPONENT_PREFIX}}-card>
  <div slot="header">Card Title</div>
  <p>Card content goes here.</p>
</{{COMPONENT_PREFIX}}-card>

<!-- Badge -->
<{{COMPONENT_PREFIX}}-badge variant="success">Active</{{COMPONENT_PREFIX}}-badge>

<!-- Icon -->
<{{COMPONENT_PREFIX}}-icon name="check"></{{COMPONENT_PREFIX}}-icon>

<!-- Dialog -->
<{{COMPONENT_PREFIX}}-dialog id="my-dialog" label="Confirm">
  <div slot="header">Confirm Action</div>
  <p>Are you sure?</p>
  <div slot="footer">
    <{{COMPONENT_PREFIX}}-button variant="secondary">Cancel</{{COMPONENT_PREFIX}}-button>
    <{{COMPONENT_PREFIX}}-button variant="primary">Confirm</{{COMPONENT_PREFIX}}-button>
  </div>
</{{COMPONENT_PREFIX}}-dialog>

<!-- Dropdown -->
<{{COMPONENT_PREFIX}}-dropdown>
  <{{COMPONENT_PREFIX}}-button slot="trigger">Menu</{{COMPONENT_PREFIX}}-button>
  <button>Option 1</button>
  <button>Option 2</button>
</{{COMPONENT_PREFIX}}-dropdown>
```

## Components

| Component | Description |
|-----------|-------------|
| `{{COMPONENT_PREFIX}}-button` | Button with variants (primary, secondary, outline, ghost, danger) |
| `{{COMPONENT_PREFIX}}-input` | Text input with label, validation, and error states |
| `{{COMPONENT_PREFIX}}-card` | Container with header, body, and footer slots |
| `{{COMPONENT_PREFIX}}-badge` | Status indicators and labels |
| `{{COMPONENT_PREFIX}}-icon` | SVG icon display (Lucide icons included) |
| `{{COMPONENT_PREFIX}}-dialog` | Modal dialog with focus trap |
| `{{COMPONENT_PREFIX}}-dropdown` | Trigger-activated menu |

## Design Tokens

Import tokens separately for CSS-only usage:

```css
@import '{{LIBRARY_NAME}}/tokens';
```

Available token categories:
- **Colors** - Primary palette, neutrals, semantic colors
- **Spacing** - Consistent spacing scale (4px base)
- **Typography** - Font families, sizes, weights
- **Effects** - Shadows, borders, transitions

## Development

```bash
# Install dependencies
npm install

# Start dev server with docs
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Visual regression tests
npm run test:visual
```

## Documentation

Open the docs site locally:

```bash
npm run docs
```

Then open http://localhost:3000/docs/

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## License

MIT