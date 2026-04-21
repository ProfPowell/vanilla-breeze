/**
 * /go/feed — read-only changelog/what's-new entries.
 *
 * Two storage layers:
 *  1. KV (preferred): write entries with `feed:{id}` keys; this handler
 *     reads them when the index is non-empty.
 *  2. Bundled fallback: scripts/build-feed.js parses CHANGELOG.md and
 *     emits feed-data.js (an ESM module). When KV is empty (or never
 *     provisioned) we serve from the bundle so /go/feed is responsive
 *     on day one without a separate KV upload step.
 *
 * Storage layout (in env.VB_KV):
 *   feed:{id}        Entry record
 *   index:feed       JSON array of feed entry ids
 */

import { json } from './shared.js';
import bundledFeed from './feed-data.js';

const FEED_INDEX = 'index:feed';

export async function getFeed(request, env) {
  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') ?? 20)));

  const ids = env?.VB_KV ? (await env.VB_KV.get(FEED_INDEX, 'json')) || [] : [];
  let items;
  if (ids.length === 0) {
    items = Array.isArray(bundledFeed?.items) ? [...bundledFeed.items] : [];
  } else {
    const records = await Promise.all(ids.map(id => env.VB_KV.get(`feed:${id}`, 'json')));
    items = records.filter(Boolean);
  }

  if (since) {
    const cutoff = Date.parse(since);
    if (!Number.isNaN(cutoff)) items = items.filter(n => Date.parse(n.date) > cutoff);
  }

  return json({ items: items.slice(0, limit) });
}

/** Helper for build pipelines to seed feed entries programmatically. */
export async function pushFeedEntry(env, entry) {
  const id = entry.id;
  if (!id) throw new Error('feed entry requires id');
  await env.VB_KV.put(`feed:${id}`, JSON.stringify(entry));
  const ids = (await env.VB_KV.get(FEED_INDEX, 'json')) || [];
  if (!ids.includes(id)) {
    ids.push(id);
    await env.VB_KV.put(FEED_INDEX, JSON.stringify(ids));
  }
}
