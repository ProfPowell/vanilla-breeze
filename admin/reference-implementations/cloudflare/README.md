# Cloudflare Worker — VB /go/* reference implementation

Single-file Worker that implements every endpoint from
[`/docs/concepts/service-contracts/`](../../../site/src/pages/docs/concepts/service-contracts.html)
on top of one KV namespace. Deploy as-is, then iterate.

This is **a starter kit**, not VB's own production deployment. The
contract is the source of truth — any backend that respects the JSON
shapes will work with the `VBService` client.

## What's here

```
cloudflare/
├── README.md          ← this file
├── wrangler.toml      ← Worker + KV binding template
├── package.json       ← wrangler devDependency
└── src/
    ├── index.js       ← router (regex-based, ~50 lines)
    ├── shared.js      ← JSON / error / CORS / id helpers
    ├── notify.js      ← /go/notify/messages, /subscribe
    ├── feed.js        ← /go/feed
    ├── newsletter.js  ← /go/newsletter/{subscribe,unsubscribe,preferences}
    └── email.js       ← /go/email — Resend transport (configurable)
```

## Setup

```bash
# 1. Install wrangler (local devDependency or globally)
npm install

# 2. Create the KV namespace and copy the id into wrangler.toml
npx wrangler kv namespace create VB_KV
# → "id": "abc123…"

# 3. (Optional) configure email delivery via Resend
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM   # e.g. "noreply@yourdomain.com"

# 4. Run locally
npx wrangler dev
# Worker comes up at http://localhost:8787 — same paths as production

# 5. Deploy
npx wrangler deploy
```

## Storage layout (single KV namespace, prefix-keyed)

| Prefix | Contents |
|--------|----------|
| `msg:{id}` | Notification record (per `/go/notify/messages`) |
| `index:msgs` | JSON array of all notification ids |
| `sub:{id}` | Page-watch / topic subscription record |
| `index:subs` | JSON array of all subscription ids |
| `feed:{id}` | Changelog entry (write via the helper exported from `feed.js`) |
| `index:feed` | JSON array of feed entry ids |
| `newsletter:{email}` | JSON array of list ids the email is subscribed to |
| `email:{id}` | 30-day TTL audit log of `/go/email` requests (status, provider id, errors) |

For multi-user scenarios you'd want per-user index keys (e.g.
`index:msgs:{userId}`) and an auth layer in front of the Worker. This
starter intentionally keeps a single global namespace so you can stand
it up in five minutes.

## Wire up `VBService`

```html
<script>
  window.vbServiceConfig = { baseUrl: 'https://yourdomain.com/go' };
</script>
```

```js
import { VBService } from '/src/lib/vb-service.js';
if (window.vbServiceConfig) VBService.configure(window.vbServiceConfig);

const notify = new VBService('notify');
await notify.get('/messages');                 // list
await notify.patch('/messages/release-3.0', { read: true });
```

## Email transport

Out of the box the Worker uses **[Resend](https://resend.com)** if both
`RESEND_API_KEY` and `RESEND_FROM` are set; otherwise `/go/email`
returns 202 and writes the request to KV under `email:{id}` for
auditing without sending. Swap to Postmark/Sendgrid/SES by editing
`src/email.js#deliverViaResend` — same shape, different fetch.

## Built-in templates

`src/email.js` ships a tiny renderer for the four templates VB names
in the contracts:

- `page-watch-update`
- `goodurl-digest`
- `contact-form`
- `newsletter-welcome`

Replace the renderers (or the whole template registry) with your own
HTML/markdown/MJML pipeline as needed.

## Adding endpoints

`src/index.js` is a regex route table:

```js
['POST', /^\/go\/yours\/something$/, (req, env) => yourHandler(req, env)],
```

Add the handler in a new module, import it in `index.js`, push a row
to `routes`. CORS, JSON, and the error envelope come from `shared.js`.

## How VB uses this on its own docs site

The vanilla-breeze docs site (Cloudflare Pages) ships these contracts as
**Pages Functions** under `functions/go/*`, with the route handlers
copied verbatim into `functions/_lib/go/*`. That keeps the source files
short — each `functions/go/*.js` is a thin wrapper that delegates to
the same handler this Worker uses.

To stand it up on a new Pages project:

```bash
# 1. KV
wrangler kv namespace create VB_GO_KV          # copy id into wrangler.toml
# 2. Optional email transport
wrangler pages secret put RESEND_API_KEY
wrangler pages secret put RESEND_FROM
# 3. Bind VB_GO_KV in Pages dashboard → Settings → Functions

# 4. Seed an initial notification so the bell shows something
wrangler kv key put --binding=VB_GO_KV "msg:welcome" \
  '{"id":"welcome","type":"update","title":"Welcome","body":"Hi.","date":"2026-04-21T00:00:00Z","read":false,"dismissed":false,"priority":"normal"}'
wrangler kv key put --binding=VB_GO_KV "index:msgs" '["welcome"]'
```

Until the binding is provisioned, every `/go/*` endpoint returns a
clean 503 (`service_unavailable`) instead of a 500 — the runtime guard
lives in `functions/_lib/go/shared.js#requireKV`.

## Limitations

- Single KV namespace shared across all services. Hot keys can hit KV
  write limits (1/sec/key). Split namespaces if you need throughput.
- No auth. Add `Authorization` header validation in `index.js#fetch`
  before the route lookup.
- No rate limiting. Use Cloudflare Workers' built-in rate limit binding
  or a Durable Object if you need per-user/per-IP caps.
- No background workers. Page-watch server-side polling (re-checking
  watched pages and writing change notifications) needs a Cron Trigger
  — out of scope for this starter; see `src/notify.js#pushNotification`
  for the helper a cron handler would call.
