/**
 * /go/feed — read-only changelog/what's-new entries.
 *
 * Two storage modes:
 *  1. KV: write entries with `feed:{id}` keys; this Worker reads them.
 *  2. Static: bundle a feed.json into the Worker via a build step and
 *     read it at the top of the file. (Not done here — KV is the path
 *     this starter implements.)
 *
 * Storage layout (in env.VB_KV):
 *   feed:{id}        Entry record
 *   index:feed       JSON array of feed entry ids
 */

import { json } from './shared.js';

const FEED_INDEX = 'index:feed';

export async function getFeed(request, env) {
  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') ?? 20)));

  const ids = (await env.VB_KV.get(FEED_INDEX, 'json')) || [];
  const records = await Promise.all(ids.map(id => env.VB_KV.get(`feed:${id}`, 'json')));
  let items = records.filter(Boolean);

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
