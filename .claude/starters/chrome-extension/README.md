# Chrome Extension Starter

Browser extension using Manifest V3 with popup, options page, content scripts, and background service worker.

## Features

- Manifest V3 compliant
- Popup interface
- Options page
- Content scripts
- Background service worker
- Chrome storage wrapper
- Message passing utilities
- i18n support

## Structure

```
[project]/
├── manifest.json           # Chrome Manifest V3
├── README.md
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   ├── content/
│   │   └── content.js
│   ├── background/
│   │   └── service-worker.js
│   └── lib/
│       ├── storage.js
│       └── messaging.js
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── _locales/
│   └── en/
│       └── messages.json
└── styles/
    └── shared.css
```

## Prompts

| Key | Description | Default |
|-----|-------------|---------|
| `PROJECT_NAME` | Folder name | (required) |
| `DISPLAY_NAME` | Extension name | (required) |
| `DESCRIPTION` | Description (max 132 chars) | (required) |
| `VERSION` | Version number | `1.0.0` |
| `FEATURES` | Components to include | `popup, background` |
| `PERMISSIONS` | Chrome permissions | `storage, activeTab` |
| `HOST_PERMISSIONS` | URL patterns for access | (empty) |

## Usage

1. Run `/scaffold-extension` command
2. Answer prompts
3. Files are generated in your project
4. Load unpacked extension in Chrome at `chrome://extensions`

## Development

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your extension directory

### Making Changes

- Edit source files
- Click the refresh icon on your extension in `chrome://extensions`
- For background changes, click "Service Worker" to view logs

## Components

### Popup (`src/popup/`)

The popup UI shown when clicking the extension icon.

```javascript
// popup.js
import { storage } from '../lib/storage.js';

// Get/set options
const settings = await storage.get('settings');
await storage.set('settings', { ...settings, enabled: true });
```

### Options (`src/options/`)

Full-page options/settings interface.

### Content Script (`src/content/`)

Scripts injected into web pages matching host permissions.

```javascript
// content.js
// Runs in the context of web pages

// Send message to background
chrome.runtime.sendMessage({ type: 'PAGE_DATA', data: {...} });
```

### Background (`src/background/`)

Service worker for handling events and background tasks.

```javascript
// service-worker.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_DATA') {
    // Process data
    sendResponse({ success: true });
  }
  return true; // Keep channel open for async response
});
```

## Utilities

### Storage (`src/lib/storage.js`)

Wrapper for `chrome.storage.local` with async/await.

```javascript
import { storage } from './lib/storage.js';

// Get value (with default)
const value = await storage.get('key', defaultValue);

// Set value
await storage.set('key', value);

// Remove value
await storage.remove('key');

// Clear all
await storage.clear();
```

### Messaging (`src/lib/messaging.js`)

Helpers for message passing between components.

```javascript
import { messaging } from './lib/messaging.js';

// Send to background
const response = await messaging.sendToBackground({ type: 'GET_DATA' });

// Send to tab
await messaging.sendToTab(tabId, { type: 'UPDATE' });

// Listen for messages
messaging.onMessage((message, sender) => {
  console.log('Received:', message);
});
```

## i18n

Localized strings are in `_locales/[lang]/messages.json`.

```javascript
// Get localized string
const name = chrome.i18n.getMessage('extensionName');
```

In HTML:
```html
<span data-i18n="extensionName"></span>
```

## Permissions

- `storage` - Store extension data
- `activeTab` - Access current tab when user invokes extension
- `tabs` - Query and manage tabs
- `scripting` - Inject scripts into pages
- `alarms` - Schedule background tasks
