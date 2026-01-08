# Wrap Dependency Command

Generate a wrapper module for a third-party library with testable interface.

## Usage

```
/wrap-dependency [library] [wrapper-name]
```

## Arguments

- `$ARGUMENTS` - Library name and optional wrapper name
  - Examples: `axios`, `date-fns dateUtils`, `stripe payments`

## Examples

```
/wrap-dependency axios
/wrap-dependency date-fns dateUtils
/wrap-dependency stripe payments
/wrap-dependency @sendgrid/mail email
```

## Generated Structure

For `/wrap-dependency axios http`:

```
src/lib/
├── http.js          # Wrapper module
└── http.test.js     # Test file with mock

.claude/test/mocks/
└── http.js          # Mock factory
```

## Generated Code

### Wrapper Module

```javascript
// src/lib/http.js
// Wrapper for axios

import axios from 'axios';

/**
 * Create configured HTTP client
 * @param {object} config - Client configuration
 * @returns {HttpClient}
 */
export function createHttpClient(config = {}) {
  const {
    baseURL = '',
    timeout = 10000,
    headers = {}
  } = config;

  const client = axios.create({
    baseURL,
    timeout,
    headers
  });

  return {
    /**
     * GET request
     * @param {string} url
     * @param {object} [config]
     * @returns {Promise<any>}
     */
    async get(url, config) {
      const response = await client.get(url, config);
      return response.data;
    },

    /**
     * POST request
     * @param {string} url
     * @param {object} data
     * @param {object} [config]
     * @returns {Promise<any>}
     */
    async post(url, data, config) {
      const response = await client.post(url, data, config);
      return response.data;
    },

    // ... other methods
  };
}
```

### Mock Factory

```javascript
// .claude/test/mocks/http.js

/**
 * Create mock HTTP client for testing
 * @param {object} responses - Path to response mapping
 * @returns {HttpClient}
 */
export function createMockHttpClient(responses = {}) {
  const calls = [];

  return {
    async get(url) {
      calls.push({ method: 'GET', url });
      const response = responses[`GET ${url}`] ?? responses[url];
      if (response instanceof Error) throw response;
      return response;
    },

    async post(url, data) {
      calls.push({ method: 'POST', url, data });
      const response = responses[`POST ${url}`] ?? responses[url];
      if (response instanceof Error) throw response;
      return response;
    },

    getCalls: () => calls,
    wasCalledWith: (method, url) =>
      calls.some(c => c.method === method && c.url === url)
  };
}
```

### Test File

```javascript
// src/lib/http.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMockHttpClient } from '../../.claude/test/mocks/http.js';

describe('HttpClient', () => {
  it('returns response data', async () => {
    const client = createMockHttpClient({
      'GET /users': [{ id: 1, name: 'John' }]
    });

    const users = await client.get('/users');
    assert.equal(users.length, 1);
    assert.ok(client.wasCalledWith('GET', '/users'));
  });
});
```

## Steps to Execute

### 1. Parse Arguments

Extract library name and wrapper name:
- Default wrapper name = library name (without scope)
- e.g., `@sendgrid/mail` → `mail`

### 2. Check for Existing Wrapper

Look for existing file at `src/lib/[name].js`.

### 3. Analyze Library

Determine common patterns for the library type:
- HTTP clients (axios, got, node-fetch)
- Date libraries (date-fns, dayjs, luxon)
- Payment (stripe, braintree)
- Email (sendgrid, mailgun, nodemailer)
- Storage (aws-sdk/s3, gcs)

### 4. Generate Wrapper

Create wrapper with:
- Factory function pattern
- Configuration options
- JSDoc types
- Error handling

### 5. Generate Mock

Create mock factory in `.claude/test/mocks/` with:
- Same interface as wrapper
- Call tracking
- Response stubbing
- Error simulation

### 6. Output Summary

```
Created wrapper for [library]:
  - src/lib/[name].js (wrapper)
  - .claude/test/mocks/[name].js (mock factory)

Usage:
  import { create[Name] } from './lib/[name].js';

  const client = create[Name]({ /* config */ });

Testing:
  import { createMock[Name] } from '../.claude/test/mocks/[name].js';

  const mock = createMock[Name]({ 'GET /users': [...] });
```

## Common Library Templates

### HTTP (axios, got, node-fetch)

Factory returning `{ get, post, put, delete }` methods.

### Date (date-fns, dayjs)

Object with `format`, `parse`, `add`, `diff` methods.

### Email (sendgrid, nodemailer)

Factory returning `{ send, sendBatch }` methods.

### Payment (stripe)

Factory returning `{ createPayment, refund, getPayment }` methods.

### Storage (S3, GCS)

Factory returning `{ upload, download, delete, list }` methods.

## Notes

- Wrappers go in `src/lib/` or `src/adapters/`
- Mocks go in `.claude/test/mocks/`
- Follow dependency-wrapper skill patterns
- Always include mock factory for testing
- Use factory pattern for configuration
