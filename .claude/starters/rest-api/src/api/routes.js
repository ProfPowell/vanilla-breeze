/**
 * API Routes
 * Route definitions and middleware composition
 */

import { Router } from 'express';
import { healthHandler, readyHandler } from './handlers/health.js';
{{#IF_ENABLE_AUTH}}
import { authenticate, authorize } from './middleware/auth.js';
import * as authHandlers from './handlers/auth.js';
import * as userHandlers from './handlers/users.js';
import * as itemHandlers from './handlers/items.js';
{{/IF_ENABLE_AUTH}}

const router = Router();

// Health checks
router.get('/health', healthHandler);
router.get('/ready', readyHandler);

// API v1
const v1 = Router();

// API info
v1.get('/', (req, res) => {
  res.json({
    name: '{{PROJECT_NAME}}',
    version: '1.0.0',
    docs: '/openapi.yaml'
  });
});

{{#IF_ENABLE_AUTH}}
// Auth routes (public)
v1.post('/auth/register', authHandlers.register);
v1.post('/auth/login', authHandlers.login);
v1.post('/auth/refresh', authHandlers.refresh);

// Protected routes
v1.use(authenticate);

// Auth (authenticated)
v1.post('/auth/logout', authHandlers.logout);
v1.get('/auth/me', authHandlers.me);

// User profile
v1.get('/users/me', userHandlers.getMe);
v1.patch('/users/me', userHandlers.updateMe);
v1.put('/users/me/password', userHandlers.updatePassword);

// Items CRUD
v1.get('/items', itemHandlers.list);
v1.post('/items', itemHandlers.create);
v1.get('/items/:id', itemHandlers.get);
v1.patch('/items/:id', itemHandlers.update);
v1.delete('/items/:id', itemHandlers.remove);
{{/IF_ENABLE_AUTH}}

// Mount v1
router.use('/api/v1', v1);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`
    }
  });
});

export { router as routes };
