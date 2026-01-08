---
title: Quick Start
description: Build your first project in minutes
order: 2
---

Get up and running with {{SITE_NAME}} in just a few minutes.

## Create a New Project

Start by creating a new project directory:

```bash
mkdir my-project
cd my-project
npm init -y
```

## Basic Usage

Here's a minimal example to get started:

```javascript
import { init } from '{{PROJECT_NAME}}';

// Initialize with default options
const app = init({
  name: 'My Project'
});

// Start the application
app.start();
```

## Project Structure

A typical project looks like this:

```
my-project/
├── src/
│   ├── index.js
│   └── components/
├── public/
│   └── assets/
├── config.js
└── package.json
```

## Running in Development

Start the development server with hot reload:

```bash
npm run dev
```

## Building for Production

Create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## What's Next?

- Explore the [Guides](/docs/guides/) for in-depth tutorials
- Check the [API Reference](/docs/api-reference/) for all available options