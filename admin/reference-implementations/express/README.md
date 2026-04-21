# Express middleware — VB /go/* reference implementation

Single Express app that mounts every endpoint from
[`/docs/concepts/service-contracts/`](../../../site/src/pages/docs/concepts/service-contracts.html).
One pluggable storage adapter (in-memory by default), Nodemailer for
email, zero hidden dependencies.

This is **a starter kit**, not VB's own production deployment. The
contract is the source of truth — any backend that respects the JSON
shapes will work with the `VBService` client.

## What's here

```
express/
├── README.md
├── package.json       ← express + cors; nodemailer is optional
└── src/
    ├── index.js       ← app entry: mounts the four routers + 404 + error handler
    ├── shared.js      ← err() / wrap() / newId() helpers
    ├── store.js       ← createInMemoryStore({ seed }) — swap for a real adapter
    ├── notify.js      ← notifyRouter(store) — list/patch messages, subscribe CRUD
    ├── feed.js        ← feedRouter(store) — GET /go/feed
    ├── newsletter.js  ← newsletterRouter(store) — subscribe/unsubscribe/preferences
    └── email.js       ← emailRouter(store) — POST with templates, Nodemailer transport
```

## Setup

```bash
cd admin/reference-implementations/express
npm install
npm start                       # default port 3020
PORT=3020 npm start             # explicit port
npm run dev                     # node --watch for hot reload
```

The server seeds one notification (`release-3.0`) and one feed entry
(`v3.0`) so `<notification-wc>` renders content out of the box.

## Wire up `VBService`

```html
<script>
  window.vbServiceConfig = { baseUrl: 'http://localhost:3020/go' };
</script>
<script type="module">
  import { VBService } from '/src/lib/vb-service.js';
  if (window.vbServiceConfig) VBService.configure(window.vbServiceConfig);
</script>
```

CORS is wide-open (`Access-Control-Allow-Origin: *`) so the server
can be reached from any origin during development. Lock that down via
the `cors` middleware options before deploying.

## Email transport

Out of the box the server runs in **stub mode** — every `POST /go/email`
returns 202 and stores the request in the in-memory audit log without
sending. To deliver real email via SMTP:

```bash
npm install nodemailer
EMAIL_SMTP_URL='smtps://user:pass@smtp.example.com:465' \
EMAIL_FROM='noreply@example.com' \
  npm start
```

The handler lazy-loads `nodemailer` so the dev path stays zero-dependency
when stub mode is enough.

Switch to Resend/Postmark/SES by replacing the Nodemailer block in
`src/email.js` — same shape, different client. The four built-in template
renderers (`page-watch-update`, `goodurl-digest`, `contact-form`,
`newsletter-welcome`) live in the same file.

## Storage swap (Postgres / Redis / KV / …)

`src/store.js` defines the adapter contract:

```js
{
  listMessages(),
  getMessage(id), putMessage(msg),
  listSubscriptions(), getSubscription(id), putSubscription(sub),
  deleteSubscription(id),
  listFeed(), putFeedEntry(entry),
  getNewsletterSubs(email), putNewsletterSubs(email, set),
  putEmail(record), getEmail(id),
  dump(),
}
```

Implement the same shape against your store of choice and pass it to the
routers in `src/index.js`. Example sketch for `pg`:

```js
import { Pool } from 'pg';
import { createInMemoryStore } from './store.js';

export function createPostgresStore() {
  const pool = new Pool();
  return {
    async listMessages() {
      const { rows } = await pool.query('select * from notifications where dismissed = false');
      return rows;
    },
    async getMessage(id) {
      const { rows } = await pool.query('select * from notifications where id = $1', [id]);
      return rows[0] ?? null;
    },
    // … rest of the contract
  };
}
```

The handlers already `await` every store call, so async adapters are
the natural fit.

## Curl tour

```bash
# List the seeded notification
curl -s http://localhost:3020/go/notify/messages | jq

# Mark one as read
curl -s -X PATCH http://localhost:3020/go/notify/messages/release-3.0 \
  -H 'content-type: application/json' \
  -d '{"read": true}'

# Subscribe to page-watch
curl -s -X POST http://localhost:3020/go/notify/subscribe \
  -H 'content-type: application/json' \
  -d '{"url":"/docs/getting-started","type":"page-watch","notify":["panel"]}'

# Newsletter
curl -s -X POST http://localhost:3020/go/newsletter/subscribe \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","lists":["weekly-digest"]}'
curl -s 'http://localhost:3020/go/newsletter/preferences?email=a@example.com' | jq

# Email — returns 202 in stub mode, logs to stdout
curl -s -X POST http://localhost:3020/go/email \
  -H 'content-type: application/json' \
  -d '{"to":"x@y.com","template":"contact-form","data":{"name":"Ada","email":"ada@example.com","message":"hi"}}'

# Inspect everything
curl -s http://localhost:3020/go/__debug/state | jq
```

## Limitations

- **In-memory by default.** State resets on restart. Swap the store
  for a real backend before relying on persistence.
- **No auth.** Add an Express middleware in front of the routers if
  the contracts need authentication.
- **No rate limiting.** Use `express-rate-limit` (or whatever your
  ingress provides) before hitting these handlers in production.
- **Single-tenant.** `notify` and `feed` use a single global namespace.
  Add per-user keys in your storage adapter if you need isolation.
