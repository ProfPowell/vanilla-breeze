# Server-Side Service Facade

A first-party endpoint that proxies third-party services, keeping external dependencies behind your own API surface.

## Problem

Direct client-to-third-party calls create several issues:

- **Privacy** — user IP addresses, referrers, and cookies are sent directly to third parties. Tile providers, font CDNs, and analytics services all see your users.
- **Switching cost** — changing providers means updating every client. Tile URLs, CDN hostnames, and API endpoints are scattered across frontend code.
- **No caching control** — you're at the mercy of upstream `Cache-Control` headers. Can't cache more aggressively for your use case.
- **No rate limiting** — can't enforce per-user or per-page limits on upstream API calls.
- **No offline/SSR** — client-side fetches fail during SSR and can't be pre-cached server-side.

## Pattern

Route third-party requests through a first-party endpoint:

```
Client → /api/tiles/{z}/{x}/{y} → Your Edge → tile.openstreetmap.org/{z}/{x}/{y}
```

The client never contacts the third party directly. Your server fetches upstream, caches the response, and serves it as a first-party resource.

### Characteristics

- **Same-origin** — no CORS, no third-party cookies, no mixed-content issues
- **Swappable backend** — change provider server-side without touching frontend
- **Cacheable** — apply your own cache headers, edge cache, or KV store
- **Observable** — log usage, latency, errors at your proxy layer
- **Rate-limited** — enforce fair-use policies before hitting upstream

## Benefits

| Concern | Direct call | Service facade |
|:--------|:-----------|:---------------|
| User privacy | IP/referrer sent to third party | Only your server contacts upstream |
| Provider lock-in | URLs hardcoded in client | Swap backend transparently |
| Caching | Upstream headers only | Your cache policy + edge/KV |
| Rate limiting | None | Per-user, per-page, global |
| Offline/SSR | Client-only | Pre-fetch, pre-cache server-side |
| Monitoring | No visibility | Full request/response logging |

## Applications Beyond Maps

This pattern applies to any third-party asset or service:

- **Icon CDNs** — proxy icon sprite sheets, swap from Lucide to Heroicons server-side
- **Font services** — proxy Google Fonts, cache aggressively, avoid font-display issues
- **Analytics** — first-party analytics endpoint avoids ad blockers and third-party tracking
- **Payment SDKs** — proxy tokenization endpoints for PCI isolation
- **Social embeds** — render social content server-side, avoid tracking scripts
- **Image CDNs** — proxy and transform images through your own endpoint
- **AI/LLM APIs** — keep API keys server-side, add rate limiting per user

## Geo-Map Integration

Future `<geo-map>` support via a `tile-url` attribute pointing to the first-party proxy:

```html
<!-- Direct (current behavior) -->
<geo-map lat="40.7484" lng="-73.9857" provider="osm"></geo-map>

<!-- Via service facade (future) -->
<geo-map lat="40.7484" lng="-73.9857" tile-url="/api/tiles/{z}/{x}/{y}"></geo-map>
```

The component doesn't care where tiles come from — it just needs a URL template with `{z}`, `{x}`, `{y}` placeholders.

## Implementation Sketch

### Cloudflare Worker

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/tiles\/(\d+)\/(\d+)\/(\d+)$/);
    if (!match) return new Response('Not found', { status: 404 });

    const [, z, x, y] = match;
    const cacheKey = `tile:${z}:${x}:${y}`;

    // Check KV cache
    const cached = await env.TILE_CACHE.get(cacheKey, 'arrayBuffer');
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch upstream
    const upstream = await fetch(
      `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
      { headers: { 'User-Agent': 'MyApp/1.0 (contact@example.com)' } }
    );

    if (!upstream.ok) {
      return new Response('Upstream error', { status: 502 });
    }

    const body = await upstream.arrayBuffer();

    // Cache in KV (24h TTL)
    await env.TILE_CACHE.put(cacheKey, body, { expirationTtl: 86400 });

    return new Response(body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'X-Cache': 'MISS',
      },
    });
  },
};
```

### Edge Function (generic)

The same pattern works with any edge runtime — Vercel Edge Functions, Deno Deploy, Netlify Edge Functions. The key pieces:

1. Parse the tile coordinates from the URL
2. Check a cache layer (KV, R2, Redis, filesystem)
3. Fetch upstream on cache miss
4. Store in cache with appropriate TTL
5. Return with first-party headers

## Trade-offs

- **Infrastructure** — requires an edge function or server deployment
- **Origin bandwidth** — cache misses fetch from upstream through your infra
- **Cache invalidation** — OSM tiles update; need a TTL strategy (24h is reasonable for most tiles)
- **Tile usage policies** — OSM requires a valid User-Agent and prohibits bulk scraping. A caching proxy that reduces upstream load is generally welcome; read the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) carefully.
- **Cold start latency** — first request for an uncached tile adds one hop. Mitigated by aggressive prefetching and long TTLs.
- **Cost** — KV/R2 storage and edge function invocations have costs, though typically low for map tile volumes on a normal website.

## When to Use This Pattern

**Use it when:**
- Privacy matters (GDPR, user expectations)
- You might switch providers
- You want caching control
- You need usage monitoring or rate limiting

**Skip it when:**
- Prototyping or internal tools
- The third party is already same-origin (self-hosted tile server)
- The service requires client-side auth (OAuth redirect flows)
