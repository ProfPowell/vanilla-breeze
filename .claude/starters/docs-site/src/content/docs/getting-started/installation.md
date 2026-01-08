---
title: Installation
description: How to install and set up the project
order: 1
---

This guide will walk you through installing and setting up {{SITE_NAME}}.

## Prerequisites

Before you begin, make sure you have:

- Node.js 18 or higher
- npm or pnpm package manager
- A code editor (VS Code recommended)

## Installation

Install the package using npm:

```bash
npm install {{PROJECT_NAME}}
```

Or with pnpm:

```bash
pnpm add {{PROJECT_NAME}}
```

## Configuration

Create a configuration file in your project root:

```javascript
// config.js
export default {
  // Your configuration here
  siteName: '{{SITE_NAME}}',
  siteUrl: '{{SITE_URL}}'
};
```

## Verify Installation

Run the following command to verify everything is working:

```bash
npm run dev
```

You should see the development server start at `http://localhost:4321`.

## Next Steps

Now that you're set up, continue to:

- [Quick Start](/docs/getting-started/quick-start/) - Build your first project
- [Configuration](/docs/guides/configuration/) - Customize your setup