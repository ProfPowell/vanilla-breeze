# Add Rate Limit Command

Add rate limiting middleware to API endpoints.

## Usage

```
/add-rate-limit [path] [limit]
```

## Arguments

- `$ARGUMENTS` - Path and limit configuration
  - Examples: `/api/auth 10` - 10 requests per minute
  - Examples: `/api 100` - 100 requests per minute
  - Examples: `/api/upload 5 300000` - 5 requests per 5 minutes

## Examples

```
/add-rate-limit /api/auth 10
/add-rate-limit /api 100
/add-rate-limit /api/search 30 60000
```

## Steps to Execute

### 1. Generate Rate Limit Middleware

Create or update `src/api/middleware/rateLimit.js`:

```javascript
// src/api/middleware/rateLimit.js

/**
 * Simple in-memory rate limiter
 * Use Redis for production/multi-instance deployments
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60000,      // 1 minute window
    max = 100,             // Max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = defaultKeyGenerator,
    skip = () => false,
    handler = defaultHandler
  } = options;

  // In-memory storage
  const hits = new Map();

  // Cleanup old entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of hits) {
      if (now - data.resetTime > windowMs) {
        hits.delete(key);
      }
    }
  }, windowMs);

  // Prevent memory leak on server shutdown
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // Skip if configured
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create hit data
    let data = hits.get(key);
    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + windowMs
      };
      hits.set(key, data);
    }

    // Increment count
    data.count++;

    // Set rate limit headers
    const remaining = Math.max(0, max - data.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(data.resetTime / 1000));

    // Check if over limit
    if (data.count > max) {
      res.setHeader('Retry-After', Math.ceil((data.resetTime - now) / 1000));
      return handler(req, res, next, {
        remaining: 0,
        resetTime: data.resetTime,
        message
      });
    }

    next();
  };
}

/**
 * Default key generator - use IP address
 */
function defaultKeyGenerator(req) {
  return req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    'unknown';
}

/**
 * Default handler for rate limit exceeded
 */
function defaultHandler(req, res, next, { message }) {
  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message
    }
  });
}

/**
 * Create key generator that includes user ID (for authenticated routes)
 */
export function userKeyGenerator(req) {
  const ip = defaultKeyGenerator(req);
  const userId = req.user?.sub || 'anonymous';
  return `${ip}:${userId}`;
}

/**
 * Create key generator for specific endpoints
 */
export function endpointKeyGenerator(req) {
  const ip = defaultKeyGenerator(req);
  return `${ip}:${req.method}:${req.path}`;
}

/**
 * Preset: Strict rate limit for auth endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 attempts
  message: 'Too many login attempts, please try again later',
  keyGenerator: endpointKeyGenerator
});

/**
 * Preset: Standard API rate limit
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests
  keyGenerator: userKeyGenerator
});

/**
 * Preset: Strict limit for expensive operations
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 requests
  message: 'Rate limit exceeded for this operation'
});
```

### 2. Apply to Routes

Add to `src/api/routes.js`:

```javascript
import {
  rateLimit,
  authRateLimit,
  apiRateLimit,
  strictRateLimit
} from './middleware/rateLimit.js';

export function setupRoutes(app) {
  // Apply default rate limit to all API routes
  app.use('/api', apiRateLimit);

  // Stricter limit for auth endpoints
  app.use('/api/auth', authRateLimit);

  // Very strict limit for specific expensive operations
  app.post('/api/export', strictRateLimit, exportHandler);
  app.post('/api/upload', strictRateLimit, uploadHandler);

  // Custom rate limit for specific path
  app.use('/api/search', rateLimit({
    windowMs: 60000,
    max: 30,
    message: 'Search rate limit exceeded'
  }));

  // ... other routes
}
```

### 3. Redis-Based Rate Limiter (Production)

For multi-instance deployments, use Redis:

```javascript
// src/api/middleware/rateLimit.js
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

export function redisRateLimit(options = {}) {
  const {
    windowMs = 60000,
    max = 100,
    keyPrefix = 'rl:',
    keyGenerator = defaultKeyGenerator
  } = options;

  return async (req, res, next) => {
    const key = `${keyPrefix}${keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Use Redis sorted set for sliding window
      const multi = redis.multi();

      // Remove old entries
      multi.zRemRangeByScore(key, 0, windowStart);

      // Add current request
      multi.zAdd(key, { score: now, value: `${now}:${Math.random()}` });

      // Count requests in window
      multi.zCard(key);

      // Set expiry
      multi.expire(key, Math.ceil(windowMs / 1000) + 1);

      const results = await multi.exec();
      const count = results[2];

      // Set headers
      const remaining = Math.max(0, max - count);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      if (count > max) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests'
          }
        });
      }

      next();
    } catch (error) {
      // Fail open on Redis error
      console.error('Rate limit error:', error);
      next();
    }
  };
}
```

### 4. Output Summary

```
Rate limiting configured:

File created/updated:
  src/api/middleware/rateLimit.js

Presets available:
  authRateLimit   - 10 req/15min (for login)
  apiRateLimit    - 100 req/min (general API)
  strictRateLimit - 10 req/min (expensive ops)

Custom usage:
  import { rateLimit } from './middleware/rateLimit.js';

  app.use('/api/path', rateLimit({
    windowMs: 60000,   // 1 minute window
    max: 50,           // 50 requests max
    message: 'Custom message'
  }));

Response headers:
  X-RateLimit-Limit     - Max requests allowed
  X-RateLimit-Remaining - Requests left in window
  X-RateLimit-Reset     - Unix timestamp when window resets
  Retry-After           - Seconds until limit resets (on 429)

Rate limit response (429):
  {
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests"
    }
  }
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `windowMs` | number | 60000 | Time window in milliseconds |
| `max` | number | 100 | Max requests per window |
| `message` | string | "Too many requests..." | Error message |
| `keyGenerator` | function | IP-based | Generate rate limit key |
| `skip` | function | `() => false` | Skip rate limiting |
| `handler` | function | 429 response | Custom handler |

## Best Practices

1. **Layer rate limits** - Global + endpoint-specific
2. **Stricter for auth** - Prevent brute force
3. **Use Redis in production** - For multiple instances
4. **Include in API docs** - Document limits in OpenAPI
5. **Monitor rate limit hits** - Log for abuse detection
6. **Fail open** - Allow traffic if rate limiter fails

## Notes

- In-memory limiter is suitable for single-instance
- Use Redis for multi-instance deployments
- Headers follow IETF rate limiting draft
- Consider user ID for authenticated rate limiting
- Skip internal/health check requests
