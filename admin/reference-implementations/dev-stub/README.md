# /go/* dev stub

Single-file Node.js server that implements every endpoint from
[`/docs/concepts/service-contracts/`](../../../site/src/pages/docs/concepts/service-contracts.html).
In-memory storage, no dependencies, seeded with sample data so
`<notification-wc>` and friends have something to render the moment
you point them at it.

This is a **development convenience**, not a production reference. For
real backends use the upcoming Cloudflare Worker or Express
implementations (see the related beads in the April-13 plan).

## Run it

```bash
node admin/reference-implementations/dev-stub/server.mjs
# or pick a port
PORT=3010 node admin/reference-implementations/dev-stub/server.mjs
```

Default port: **3010**.

## Wire it up from the browser

The stub sends `Access-Control-Allow-Origin: *` on every response so a
page served at `https://vb.test` can reach `http://localhost:3010`
without proxy gymnastics.

```html
<script>
  window.vbServiceConfig = { baseUrl: 'http://localhost:3010/go' };
</script>
<script type="module">
  import { VBService } from '/src/lib/vb-service.js';
  if (window.vbServiceConfig) VBService.configure(window.vbServiceConfig);
</script>
```

Or hand the URL directly to a component:

```html
<notification-wc src="http://localhost:3010/go/notify/messages" toast-new>
  <!-- static fallback children -->
</notification-wc>
```

## Endpoints

Mirror [`/docs/concepts/service-contracts/`](../../../site/src/pages/docs/concepts/service-contracts.html)
verbatim. Quick curl tour:

```bash
# Notifications — seeded with three sample entries
curl -s http://localhost:3010/go/notify/messages | jq

# Mark one read
curl -s -X PATCH http://localhost:3010/go/notify/messages/release-3.0 \
  -H 'content-type: application/json' \
  -d '{"read": true}'

# Subscribe to page-watch
curl -s -X POST http://localhost:3010/go/notify/subscribe \
  -H 'content-type: application/json' \
  -d '{"url":"/docs/getting-started","type":"page-watch","notify":["panel"]}'

# List subscriptions
curl -s http://localhost:3010/go/notify/subscribe | jq

# Feed (changelog)
curl -s http://localhost:3010/go/feed | jq

# Newsletter
curl -s -X POST http://localhost:3010/go/newsletter/subscribe \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","lists":["weekly-digest"]}'
curl -s 'http://localhost:3010/go/newsletter/preferences?email=a@example.com' | jq

# Email — the stub logs to stdout instead of sending
curl -s -X POST http://localhost:3010/go/email \
  -H 'content-type: application/json' \
  -d '{"to":"user@example.com","template":"contact-form","data":{"name":"Ada","email":"ada@example.com","message":"hi"}}'
```

## Inspecting state

`GET /go/__debug/state` returns every in-memory collection (notifications,
subscriptions, feed, newsletter subs, sent emails). Useful when debugging
why a UI is showing stale data — restart the script to wipe.

## Limitations

- **No persistence.** State resets on every restart.
- **No auth.** Pretend whatever sits in front of this in production
  rejects unauthenticated requests; the stub does not.
- **No rate limiting.**
- **No email actually sent.** `/go/email` logs to stdout and queues an
  in-memory record. Use the Cloudflare or Express ref implementation for
  real Sendgrid/Postmark/SES delivery.
- **Single seed user.** `/go/notify/*` doesn't model multiple users —
  notifications are global.

## When to graduate

Move off the stub once you need any of:

- Persistence across restarts → Cloudflare Worker (KV) or Express + Postgres
- Real email delivery → either ref implementation
- Multi-tenancy / per-user notifications → roll your own
- Rate limiting / auth → either ref implementation
