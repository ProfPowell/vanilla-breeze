/**
 * VB /go/* — Express reference implementation entry point.
 *
 * One Express app mounts every reserved /go/ endpoint against a single
 * pluggable storage adapter (in-memory by default).
 *
 *   node src/index.js
 *   PORT=3020 node src/index.js
 *
 * See ../README.md for setup and Postgres swap notes.
 */

import express from 'express';
import cors from 'cors';

import { createInMemoryStore } from './store.js';
import { notifyRouter } from './notify.js';
import { feedRouter } from './feed.js';
import { newsletterRouter } from './newsletter.js';
import { emailRouter } from './email.js';

const PORT = Number(process.env.PORT ?? 3020);

const seed = {
  notifications: {
    'release-3.0': {
      id: 'release-3.0',
      type: 'update',
      title: 'v3.0 Released',
      body: 'New notification system and service layer.',
      url: '/changelog#v3',
      date: '2026-04-10T00:00:00Z',
      read: false,
      dismissed: false,
      priority: 'normal',
      expires: null,
    },
  },
  feed: {
    'v3.0': {
      id: 'v3.0',
      type: 'update',
      title: 'v3.0 — Notification System',
      body: 'New notification panel and service layer.',
      url: '/changelog#v3.0',
      date: '2026-04-10',
    },
  },
};

const store = createInMemoryStore(seed);

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '64kb' }));

// Mount the four service routers under /go/*
app.use('/go/notify', notifyRouter(store));
app.use('/go/feed', feedRouter(store));
app.use('/go/newsletter', newsletterRouter(store));
app.use('/go/email', emailRouter(store));

// Inspector endpoint (dev convenience, not in the contract)
app.get('/go/__debug/state', (_req, res) => res.json(store.dump()));

// 404 envelope for everything else
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `${req.method} ${req.originalUrl} has no handler`,
    status: 404,
  });
});

// Final error middleware — wraps anything wrap() forwarded.
// eslint-disable-next-line no-unused-vars
app.use((errObj, req, res, _next) => {
  console.error('[handler error]', errObj);
  res.status(500).json({
    error: 'internal',
    message: errObj instanceof Error ? errObj.message : String(errObj),
    status: 500,
  });
});

const server = app.listen(PORT, () => {
  console.log(`\n🌬️  Vanilla Breeze /go/* Express reference`);
  console.log(`    listening on http://localhost:${PORT}\n`);
  console.log(`    Endpoints:`);
  console.log(`      GET    /go/notify/messages           list notifications`);
  console.log(`      PATCH  /go/notify/messages/:id       mark read/dismissed`);
  console.log(`      POST   /go/notify/subscribe          create subscription`);
  console.log(`      DELETE /go/notify/subscribe/:id      remove subscription`);
  console.log(`      GET    /go/notify/subscribe          list subscriptions`);
  console.log(`      GET    /go/feed                      changelog feed (JSON)`);
  console.log(`      POST   /go/newsletter/subscribe      add to lists`);
  console.log(`      POST   /go/newsletter/unsubscribe    remove from lists`);
  console.log(`      GET    /go/newsletter/preferences    email-keyed preferences`);
  console.log(`      POST   /go/email                     queue templated email`);
  console.log(`      GET    /go/__debug/state             dump in-memory state`);
  console.log(`\n    Wire up:`);
  console.log(`      VBService.configure({ baseUrl: 'http://localhost:${PORT}/go' });\n`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`\nReceived ${sig}, shutting down.`);
    server.close(() => process.exit(0));
  });
}
