# Reference implementations

Starter backends for the [`/go/*` service contracts](../../site/src/pages/docs/concepts/service-contracts.html).
Each lives in its own subdirectory and follows the JSON shapes defined
in the contract docs verbatim.

| Directory | Purpose | Status |
|-----------|---------|--------|
| [`dev-stub/`](./dev-stub/) | Single-file Node.js script with in-memory storage. Develop against it locally. | shipped |
| [`cloudflare/`](./cloudflare/) | One Cloudflare Worker, single KV namespace, optional Resend transport for email. Deploy with `wrangler deploy`. | shipped |
| [`express/`](./express/) | One Express app, four routers, pluggable storage adapter (in-memory default, Postgres example), optional Nodemailer SMTP transport. `npm start`. | shipped |

These are not the only ways to implement the contracts — they are
starter kits. A backend in any language that respects the JSON shapes
will work with the `VBService` client.
