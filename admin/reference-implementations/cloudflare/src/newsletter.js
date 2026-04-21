/**
 * /go/newsletter/* — list-based subscription management.
 *
 * Storage layout (in env.VB_KV):
 *   newsletter:{email}    JSON array of list ids the email is subscribed to
 *
 * Available lists are configured via env.NEWSLETTER_LISTS (comma-separated).
 * Default: weekly-digest, release-notes, security-alerts.
 */

import { json, err, readJson } from './shared.js';

function getAvailableLists(env) {
  const raw = env.NEWSLETTER_LISTS || 'weekly-digest,release-notes,security-alerts';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function key(email) {
  return `newsletter:${email.toLowerCase()}`;
}

async function readSubs(env, email) {
  const list = await env.VB_KV.get(key(email), 'json');
  return new Set(Array.isArray(list) ? list : []);
}

async function writeSubs(env, email, set) {
  if (set.size === 0) {
    await env.VB_KV.delete(key(email));
  } else {
    await env.VB_KV.put(key(email), JSON.stringify([...set]));
  }
}

// ── POST /go/newsletter/subscribe ──────────────────────────────────

export async function subscribe(request, env) {
  const body = await readJson(request);
  if (body === undefined) return err(400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.email || !Array.isArray(body?.lists)) {
    return err(400, 'invalid_input', 'email (string) and lists (array) are required');
  }
  const available = getAvailableLists(env);
  const set = await readSubs(env, body.email);
  for (const list of body.lists) {
    if (available.includes(list)) set.add(list);
  }
  await writeSubs(env, body.email, set);
  return json({ status: 'subscribed', lists: [...set] }, 201);
}

// ── POST /go/newsletter/unsubscribe ────────────────────────────────

export async function unsubscribe(request, env) {
  const body = await readJson(request);
  if (body === undefined) return err(400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.email || !Array.isArray(body?.lists)) {
    return err(400, 'invalid_input', 'email (string) and lists (array) are required');
  }
  const set = await readSubs(env, body.email);
  for (const list of body.lists) set.delete(list);
  await writeSubs(env, body.email, set);
  return json({ status: 'unsubscribed', lists: body.lists });
}

// ── GET /go/newsletter/preferences?email=… ─────────────────────────

export async function preferences(request, env) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) return err(400, 'invalid_input', 'email query param required');
  const set = await readSubs(env, email);
  return json({ subscriptions: [...set], available: getAvailableLists(env) });
}
