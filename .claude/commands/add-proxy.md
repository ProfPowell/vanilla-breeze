# Add Proxy Command

Scaffold a proxy endpoint for third-party API integration with secret handling.

## Usage

```
/add-proxy [name] [target-url]
```

## Arguments

- `$ARGUMENTS` - Proxy name and target URL
  - Examples: `geocode https://api.geocoder.example/v1`
  - Examples: `weather https://api.weather.io`

## Examples

```
/add-proxy geocode https://api.geocoder.example/v1
/add-proxy weather https://api.openweathermap.org/data/2.5
/add-proxy stripe https://api.stripe.com/v1
```

## Steps to Execute

### 1. Parse Arguments

Extract:
- Proxy name (e.g., `geocode`)
- Target base URL (e.g., `https://api.geocoder.example/v1`)

### 2. Generate Proxy Handler

Create `src/api/handlers/{name}-proxy.js`:

```javascript
// src/api/handlers/{name}-proxy.js
import { config } from '../../config/index.js';

const TARGET_URL = '{target_url}';
const API_KEY = config.{name}ApiKey;

// Simple in-memory cache (use Redis in production)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/proxy/{name}/*
 * Proxy requests to {target_url}
 */
export async function proxy(req, res) {
  const path = req.params[0] || '';
  const queryString = new URLSearchParams(req.query).toString();

  // Build target URL
  const targetUrl = `${TARGET_URL}/${path}${queryString ? '?' + queryString : ''}`;

  // Check cache for GET requests
  const cacheKey = `${req.method}:${targetUrl}`;
  if (req.method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }
  }

  try {
    // Make request to third-party API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(req.method !== 'GET' && req.body && {
        body: JSON.stringify(req.body)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`{Name} API error: ${response.status}`, error);

      return res.status(response.status >= 500 ? 502 : response.status).json({
        error: {
          code: 'UPSTREAM_ERROR',
          message: response.status >= 500
            ? '{Name} service temporarily unavailable'
            : 'Request failed',
          ...(config.env === 'development' && { details: error })
        }
      });
    }

    const data = await response.json();

    // Transform response (customize as needed)
    const transformed = transform{Name}Response(data);

    // Cache successful GET responses
    if (req.method === 'GET') {
      cache.set(cacheKey, { data: transformed, timestamp: Date.now() });
      res.setHeader('X-Cache', 'MISS');

      // Clean old cache entries periodically
      if (cache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of cache) {
          if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
          }
        }
      }
    }

    res.json(transformed);
  } catch (error) {
    console.error('{Name} proxy error:', error);
    res.status(502).json({
      error: {
        code: 'UPSTREAM_ERROR',
        message: '{Name} service temporarily unavailable'
      }
    });
  }
}

/**
 * Transform third-party response to our format
 * (Allows changing providers without frontend changes)
 */
function transform{Name}Response(data) {
  // Customize transformation based on API
  return data;
}
```

### 3. Example Transformations

**Geocoding API:**

```javascript
function transformGeocodeResponse(data) {
  // Transform to consistent format
  return {
    results: data.features?.map(f => ({
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      address: f.properties.formatted,
      city: f.properties.city,
      country: f.properties.country
    })) || []
  };
}
```

**Weather API:**

```javascript
function transformWeatherResponse(data) {
  return {
    temperature: data.main.temp,
    humidity: data.main.humidity,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    wind: {
      speed: data.wind.speed,
      direction: data.wind.deg
    }
  };
}
```

### 4. Add Routes

Add to `src/api/routes.js`:

```javascript
import { authenticate } from './middleware/auth.js';
import { proxy as {name}Proxy } from './handlers/{name}-proxy.js';

// Proxy routes (auth optional - customize as needed)
app.all('/api/proxy/{name}/*', authenticate, {name}Proxy);
app.all('/api/proxy/{name}', authenticate, {name}Proxy);
```

### 5. Update Configuration

Add to `src/config/index.js`:

```javascript
{name}ApiKey: requireEnv('{NAME}_API_KEY'),
```

### 6. Update .env.example

```bash
# {Name} API
{NAME}_API_KEY=your-api-key-here
```

### 7. Add Rate Limiting (Recommended)

```javascript
import { rateLimit } from '../middleware/rateLimit.js';

// Limit proxy requests
app.all(
  '/api/proxy/{name}/*',
  authenticate,
  rateLimit({ max: 100, windowMs: 60000 }),
  {name}Proxy
);
```

### 8. Output Summary

```
Proxy endpoint created: /api/proxy/{name}/*

Files created:
  src/api/handlers/{name}-proxy.js

Configuration:
  Add to .env: {NAME}_API_KEY=your-key

Features:
  - Hides API key from frontend
  - Caches GET requests (5 min TTL)
  - Transforms responses (customize as needed)
  - Error handling with 502 for upstream failures
  - Development mode shows error details

Routes:
  ALL /api/proxy/{name}/*  → {target_url}/*

Example usage:
  // Frontend calls your proxy
  fetch('/api/proxy/{name}/search?q=query')

  // Proxy calls third-party with your API key
  → {target_url}/search?q=query + Authorization header

Next steps:
1. Add {NAME}_API_KEY to .env
2. Customize response transformation
3. Adjust caching TTL if needed
4. Add authentication if required
```

## Advanced Features

### Custom Headers

```javascript
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'X-Custom-Header': 'value',
  // Forward specific headers from client
  ...(req.headers['accept-language'] && {
    'Accept-Language': req.headers['accept-language']
  })
};
```

### Request Transformation

```javascript
// Transform request body before forwarding
const transformedBody = {
  ...req.body,
  api_key: API_KEY,  // Some APIs want key in body
  format: 'json'
};
```

### Streaming Response

```javascript
// For large responses, stream instead of buffering
const response = await fetch(targetUrl, options);
response.body.pipe(res);
```

## Notes

- API keys stay server-side (never exposed to frontend)
- Transformations allow swapping providers without frontend changes
- Cache reduces third-party API calls and costs
- Rate limiting prevents abuse
- Use Redis for cache in production/multi-instance
- Log errors but don't expose details to clients
