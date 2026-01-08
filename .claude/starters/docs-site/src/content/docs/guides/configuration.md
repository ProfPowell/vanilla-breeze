---
title: Configuration
description: Configure {{SITE_NAME}} for your needs
order: 1
---

{{SITE_NAME}} can be configured to match your project requirements.

## Configuration File

Create a `config.js` file in your project root:

```javascript
export default {
  // Site information
  site: {
    name: '{{SITE_NAME}}',
    url: '{{SITE_URL}}',
    description: '{{DESCRIPTION}}'
  },

  // Build options
  build: {
    outDir: 'dist',
    minify: true,
    sourceMaps: false
  },

  // Development options
  dev: {
    port: 4321,
    open: true
  }
};
```

## Environment Variables

You can also use environment variables:

```bash
# .env
SITE_NAME={{SITE_NAME}}
SITE_URL={{SITE_URL}}
```

Access them in your code:

```javascript
const siteName = process.env.SITE_NAME;
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `site.name` | string | - | Your site's display name |
| `site.url` | string | - | Production URL |
| `build.outDir` | string | `dist` | Output directory |
| `build.minify` | boolean | `true` | Minify output |
| `dev.port` | number | `4321` | Dev server port |

## Extending Configuration

You can extend the base configuration for different environments:

```javascript
// config.production.js
import baseConfig from './config.js';

export default {
  ...baseConfig,
  build: {
    ...baseConfig.build,
    sourceMaps: false
  }
};
```