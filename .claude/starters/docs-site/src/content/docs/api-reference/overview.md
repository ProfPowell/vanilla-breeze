---
title: API Overview
description: Complete API reference for {{SITE_NAME}}
order: 1
---

This section provides complete API documentation for {{SITE_NAME}}.

## Core Functions

### `init(options)`

Initialize the application with the given options.

```javascript
import { init } from '{{PROJECT_NAME}}';

const app = init({
  name: 'My App',
  debug: false
});
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options.name` | string | Yes | Application name |
| `options.debug` | boolean | No | Enable debug mode |

**Returns:** `Application` instance

---

### `configure(settings)`

Update configuration at runtime.

```javascript
app.configure({
  theme: 'dark',
  language: 'en'
});
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `settings` | object | Configuration object |

---

### `start()`

Start the application.

```javascript
await app.start();
```

**Returns:** `Promise<void>`

---

## Events

The application emits the following events:

| Event | Description |
|-------|-------------|
| `ready` | Application is initialized |
| `error` | An error occurred |
| `shutdown` | Application is shutting down |

```javascript
app.on('ready', () => {
  console.log('Application ready!');
});
```

## Types

TypeScript definitions are included:

```typescript
interface Options {
  name: string;
  debug?: boolean;
}

interface Application {
  init(options: Options): Application;
  start(): Promise<void>;
  configure(settings: object): void;
}
```