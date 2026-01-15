# PWA/SPA Starter

A progressive web application with client-side routing, Web Components, and offline support.

## Features

- Vanilla JavaScript (no framework)
- Web Components for views
- Client-side router with history API
- Service worker for offline support
- State management
- API client with caching
- Design tokens integration

## Structure

```
project/
├── index.html              # SPA shell
├── offline.html            # Offline fallback
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── package.json
├── src/
│   ├── app/
│   │   ├── main.js         # App entry point
│   │   ├── router.js       # Client-side router
│   │   ├── store.js        # State management
│   │   └── api.js          # API client
│   ├── views/
│   │   ├── base-view.js    # Base view class
│   │   ├── home-view.js
│   │   ├── about-view.js
│   │   └── not-found-view.js
│   ├── components/
│   │   ├── app-shell.js
│   │   ├── nav-bar.js
│   │   └── icon-wc/
│   └── styles/
│       ├── main.css
│       ├── _reset.css
│       └── _tokens.css
└── images/
    └── icons/
```

## Usage

### Create with command

```bash
/scaffold-spa my-app
```

### Development

```bash
npm install
npm run dev
```

## Router

The vanilla router uses the History API:

```javascript
import { router } from './app/router.js';

// Navigate programmatically
router.navigate('/about');

// Link with data-link attribute
<a href="/about" data-link>About</a>
```

## Views

Views are Web Components extending BaseView:

```javascript
import { BaseView } from './base-view.js';

class MyView extends BaseView {
  static get tag() { return 'my-view'; }

  render() {
    return `
      <h1>My View</h1>
      <p>Content here</p>
    `;
  }
}

customElements.define(MyView.tag, MyView);
```

## State Management

Simple reactive store:

```javascript
import { store } from './app/store.js';

// Subscribe to changes
store.subscribe('user', (user) => {
  console.log('User changed:', user);
});

// Update state
store.set('user', { name: 'John' });
```

## API Client

Fetch wrapper with error handling:

```javascript
import { api } from './app/api.js';

const users = await api.get('/users');
const newUser = await api.post('/users', { name: 'Jane' });
```

## Skills Invoked

- `javascript-author` - JS patterns
- `custom-elements` - Web Components
- `service-worker` - Offline support
- `state-management` - Reactive state
- `api-client` - API patterns
