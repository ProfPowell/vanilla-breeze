# Reference implementations

Starter backends for the [`/go/*` service contracts](../../site/src/pages/docs/concepts/service-contracts.html).
Each lives in its own subdirectory and follows the JSON shapes defined
in the contract docs verbatim.

| Directory | Purpose | Status |
|-----------|---------|--------|
| [`dev-stub/`](./dev-stub/) | Single-file Node.js script with in-memory storage. Develop against it locally. | shipped |
| `cloudflare/` | Cloudflare Workers — one Worker per service, KV for storage, Email Workers for sending. | bead `vanilla-breeze-4nav` |
| `express/` | Express middleware — one router per service, pluggable storage, Nodemailer for email. | bead `vanilla-breeze-v1fl` |

These are not the only ways to implement the contracts — they are
starter kits. A backend in any language that respects the JSON shapes
will work with the `VBService` client.
