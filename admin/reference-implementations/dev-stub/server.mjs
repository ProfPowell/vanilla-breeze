#!/usr/bin/env node
/**
 * VB /go/* dev stub — single-file Node.js server with in-memory storage.
 *
 * Implements every endpoint from /docs/concepts/service-contracts/ so you
 * can develop notification-wc, page-watch, contact forms, newsletter UI,
 * etc. against a real responding backend without provisioning anything.
 *
 * No persistence. State resets on restart. Seeded with a handful of
 * sample notifications and feed items.
 *
 * Usage:
 *   node admin/reference-implementations/dev-stub/server.mjs
 *   PORT=3010 node admin/reference-implementations/dev-stub/server.mjs
 *
 * Then point VBService at it from your page:
 *   VBService.configure({ baseUrl: 'http://localhost:3010/go' });
 *
 * CORS is wide open (Access-Control-Allow-Origin: *) so a page served at
 * https://vb.test can reach this stub at http://localhost:3010. Dev-only.
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 3010);

// ── In-memory state ─────────────────────────────────────────────────

/** @type {Array<{id: string, type: string, title: string, body: string, url: string|null, date: string, read: boolean, dismissed: boolean, priority: string, expires: string|null}>} */
const notifications = [
  {
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
  {
    id: 'maintenance-2026-04-21',
    type: 'alert',
    title: 'Scheduled Maintenance',
    body: 'Brief downtime Sunday 2am-4am UTC.',
    url: null,
    date: '2026-04-18T00:00:00Z',
    read: false,
    dismissed: false,
    priority: 'high',
    expires: null,
  },
  {
    id: 'docs-getting-started-updated',
    type: 'watch',
    title: 'Docs: Getting Started updated',
    body: 'The Quick Start page was rewritten with progressive-enhancement demos.',
    url: '/docs/quick-start/',
    date: '2026-04-20T16:40:00Z',
    read: false,
    dismissed: false,
    priority: 'normal',
    expires: null,
  },
];

/** @type {Map<string, {id: string, url: string, type: string, notify: string[], email: string|null, createdAt: string}>} */
const subscriptions = new Map();

/** @type {Array<{id: string, type: string, title: string, body: string, url: string, date: string}>} */
const feed = [
  {
    id: 'v3.0',
    type: 'update',
    title: 'v3.0 — Notification System',
    body: 'New notification panel and service layer.',
    url: '/changelog#v3.0',
    date: '2026-04-10',
  },
  {
    id: 'v2.4',
    type: 'update',
    title: 'v2.4 — VBStore migration',
    body: 'Every component now persists state through VBStore.',
    url: '/changelog#v2.4',
    date: '2026-04-15',
  },
];

/** @type {Map<string, Set<string>>} email → set of list ids */
const newsletterSubs = new Map();
const NEWSLETTER_LISTS = ['weekly-digest', 'release-notes', 'security-alerts'];

/** @type {Array<{id: string, to: string, template: string, data: object, queuedAt: string}>} */
const sentEmails = [];

// ── HTTP plumbing ───────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function send(res, status, body) {
  const payload = body == null ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    ...CORS_HEADERS,
  });
  res.end(payload);
}

function err(res, status, code, message) {
  send(res, status, { error: code, message, status });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined; // signal parse failure
  }
}

// ── Routes ──────────────────────────────────────────────────────────

/** @type {Array<{method: string, pattern: RegExp, handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, params: Record<string, string>, url: URL) => Promise<void> | void}>} */
const routes = [];

function route(method, pattern, handler) {
  // Convert /go/notify/messages/:id → regex with named groups
  const regex = new RegExp(
    '^' + pattern.replace(/:([a-zA-Z_]+)/g, (_, name) => `(?<${name}>[^/]+)`) + '$'
  );
  routes.push({ method, pattern: regex, handler });
}

// /go/notify ─────────────────────────────────────────────────────────

route('GET', '/go/notify/messages', (_req, res, _params, url) => {
  const since = url.searchParams.get('since');
  const type = url.searchParams.get('type');
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') ?? 50)));

  let items = notifications.filter(n => !n.dismissed);
  if (since) {
    const cutoff = Date.parse(since);
    if (!Number.isNaN(cutoff)) items = items.filter(n => Date.parse(n.date) > cutoff);
  }
  if (type) items = items.filter(n => n.type === type);
  if (unreadOnly) items = items.filter(n => !n.read);

  const total = notifications.filter(n => !n.dismissed).length;
  const unread = notifications.filter(n => !n.dismissed && !n.read).length;

  send(res, 200, { items: items.slice(0, limit), total, unread });
});

route('PATCH', '/go/notify/messages/:id', async (req, res, params) => {
  const body = await readJson(req);
  if (body === undefined) return err(res, 400, 'invalid_input', 'Body must be valid JSON');
  const n = notifications.find(x => x.id === params.id);
  if (!n) return err(res, 404, 'not_found', `Notification ${params.id} not found`);
  if (typeof body?.read === 'boolean') n.read = body.read;
  if (typeof body?.dismissed === 'boolean') n.dismissed = body.dismissed;
  send(res, 200, { id: n.id, read: n.read, dismissed: n.dismissed });
});

route('POST', '/go/notify/subscribe', async (req, res) => {
  const body = await readJson(req);
  if (body === undefined) return err(res, 400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.url || !body?.type) {
    return err(res, 400, 'invalid_input', 'url and type are required');
  }
  const id = `sub_${randomUUID().slice(0, 8)}`;
  const sub = {
    id,
    url: body.url,
    type: body.type,
    notify: Array.isArray(body.notify) ? body.notify : ['panel'],
    email: typeof body.email === 'string' ? body.email : null,
    createdAt: new Date().toISOString(),
  };
  subscriptions.set(id, sub);
  send(res, 201, { id, status: 'active' });
});

route('DELETE', '/go/notify/subscribe/:id', (_req, res, params) => {
  if (!subscriptions.has(params.id)) {
    return err(res, 404, 'not_found', `Subscription ${params.id} not found`);
  }
  subscriptions.delete(params.id);
  send(res, 200, { status: 'removed' });
});

route('GET', '/go/notify/subscribe', (_req, res) => {
  send(res, 200, { subscriptions: [...subscriptions.values()] });
});

// /go/feed ───────────────────────────────────────────────────────────

route('GET', '/go/feed', (_req, res, _params, url) => {
  const since = url.searchParams.get('since');
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') ?? 20)));
  let items = [...feed];
  if (since) {
    const cutoff = Date.parse(since);
    if (!Number.isNaN(cutoff)) items = items.filter(n => Date.parse(n.date) > cutoff);
  }
  send(res, 200, { items: items.slice(0, limit) });
});

// /go/newsletter ─────────────────────────────────────────────────────

route('POST', '/go/newsletter/subscribe', async (req, res) => {
  const body = await readJson(req);
  if (body === undefined) return err(res, 400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.email || !Array.isArray(body?.lists)) {
    return err(res, 400, 'invalid_input', 'email (string) and lists (array) are required');
  }
  const set = newsletterSubs.get(body.email) ?? new Set();
  for (const list of body.lists) {
    if (NEWSLETTER_LISTS.includes(list)) set.add(list);
  }
  newsletterSubs.set(body.email, set);
  send(res, 201, { status: 'subscribed', lists: [...set] });
});

route('POST', '/go/newsletter/unsubscribe', async (req, res) => {
  const body = await readJson(req);
  if (body === undefined) return err(res, 400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.email || !Array.isArray(body?.lists)) {
    return err(res, 400, 'invalid_input', 'email (string) and lists (array) are required');
  }
  const set = newsletterSubs.get(body.email) ?? new Set();
  for (const list of body.lists) set.delete(list);
  if (set.size === 0) newsletterSubs.delete(body.email);
  else newsletterSubs.set(body.email, set);
  send(res, 200, { status: 'unsubscribed', lists: body.lists });
});

route('GET', '/go/newsletter/preferences', (_req, res, _params, url) => {
  const email = url.searchParams.get('email');
  if (!email) return err(res, 400, 'invalid_input', 'email query param required');
  const set = newsletterSubs.get(email) ?? new Set();
  send(res, 200, { subscriptions: [...set], available: NEWSLETTER_LISTS });
});

// /go/email ──────────────────────────────────────────────────────────

route('POST', '/go/email', async (req, res) => {
  const body = await readJson(req);
  if (body === undefined) return err(res, 400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.to || !body?.template) {
    return err(res, 400, 'invalid_input', 'to and template are required');
  }
  const id = `msg_${randomUUID().slice(0, 8)}`;
  const record = {
    id,
    to: body.to,
    template: body.template,
    data: body.data ?? {},
    queuedAt: new Date().toISOString(),
  };
  sentEmails.push(record);
  // Echo to stdout so devs can see what their app would have sent
  console.log(`[email] queued ${id} → ${body.to} (template=${body.template})`);
  send(res, 202, { status: 'queued', id });
});

// Inspector endpoints (dev convenience, not in the contract) ─────────

route('GET', '/go/__debug/state', (_req, res) => {
  send(res, 200, {
    notifications,
    subscriptions: [...subscriptions.values()],
    feed,
    newsletterSubs: Object.fromEntries([...newsletterSubs].map(([k, v]) => [k, [...v]])),
    sentEmails,
  });
});

// ── Server ──────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  for (const r of routes) {
    if (r.method !== req.method) continue;
    const match = r.pattern.exec(url.pathname);
    if (!match) continue;
    try {
      await r.handler(req, res, match.groups ?? {}, url);
    } catch (e) {
      console.error('[handler error]', e);
      err(res, 500, 'internal', e instanceof Error ? e.message : String(e));
    }
    return;
  }

  err(res, 404, 'not_found', `${req.method} ${url.pathname} has no handler`);
});

server.listen(PORT, () => {
  const lines = [
    '',
    '🌬️  Vanilla Breeze /go/* dev stub',
    `    listening on http://localhost:${PORT}`,
    '',
    '    Endpoints:',
    '      GET    /go/notify/messages           list notifications',
    '      PATCH  /go/notify/messages/:id       mark read/dismissed',
    '      POST   /go/notify/subscribe          create page-watch subscription',
    '      DELETE /go/notify/subscribe/:id      remove subscription',
    '      GET    /go/notify/subscribe          list subscriptions',
    '      GET    /go/feed                      changelog feed (JSON)',
    '      POST   /go/newsletter/subscribe      add to lists',
    '      POST   /go/newsletter/unsubscribe    remove from lists',
    '      GET    /go/newsletter/preferences    email-keyed preferences',
    '      POST   /go/email                     queue templated email',
    '      GET    /go/__debug/state             dump in-memory state',
    '',
    '    Wire it up:',
    `      VBService.configure({ baseUrl: 'http://localhost:${PORT}/go' });`,
    '',
  ];
  console.log(lines.join('\n'));
});

// Graceful shutdown so Ctrl+C exits cleanly without "address in use" on restart
for (const sig of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
  process.on(sig, () => {
    console.log(`\nReceived ${sig}, shutting down.`);
    server.close(() => process.exit(0));
  });
}
