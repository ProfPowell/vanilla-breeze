/**
 * /go/notify/* — notification delivery and subscriptions.
 *
 * Storage layout (in env.VB_KV):
 *   msg:{id}                       Notification record
 *   sub:{id}                       Subscription record
 *   index:msgs                     JSON array of all message ids (for list)
 *   index:subs                     JSON array of all subscription ids
 *
 * For a real product you'd want an index per-user. This starter uses
 * a single global namespace for simplicity.
 */

import { json, err, readJson, newId } from './shared.js';

const MSG_INDEX = 'index:msgs';
const SUB_INDEX = 'index:subs';

async function readIndex(env, key) {
  const raw = await env.VB_KV.get(key, 'json');
  return Array.isArray(raw) ? raw : [];
}

async function writeIndex(env, key, ids) {
  await env.VB_KV.put(key, JSON.stringify(ids));
}

async function readMessages(env) {
  const ids = await readIndex(env, MSG_INDEX);
  const records = await Promise.all(ids.map(id => env.VB_KV.get(`msg:${id}`, 'json')));
  return records.filter(Boolean);
}

async function writeMessage(env, msg) {
  await env.VB_KV.put(`msg:${msg.id}`, JSON.stringify(msg));
  const ids = await readIndex(env, MSG_INDEX);
  if (!ids.includes(msg.id)) {
    ids.push(msg.id);
    await writeIndex(env, MSG_INDEX, ids);
  }
}

async function readSubscriptions(env) {
  const ids = await readIndex(env, SUB_INDEX);
  const records = await Promise.all(ids.map(id => env.VB_KV.get(`sub:${id}`, 'json')));
  return records.filter(Boolean);
}

// ── GET /go/notify/messages ────────────────────────────────────────

export async function listMessages(request, env) {
  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const type = url.searchParams.get('type');
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') ?? 50)));

  const all = await readMessages(env);
  let items = all.filter(m => !m.dismissed);
  if (since) {
    const cutoff = Date.parse(since);
    if (!Number.isNaN(cutoff)) items = items.filter(m => Date.parse(m.date) > cutoff);
  }
  if (type) items = items.filter(m => m.type === type);
  if (unreadOnly) items = items.filter(m => !m.read);

  const total = all.filter(m => !m.dismissed).length;
  const unread = all.filter(m => !m.dismissed && !m.read).length;
  return json({ items: items.slice(0, limit), total, unread });
}

// ── PATCH /go/notify/messages/:id ──────────────────────────────────

export async function patchMessage(request, env, id) {
  const body = await readJson(request);
  if (body === undefined) return err(400, 'invalid_input', 'Body must be valid JSON');

  const msg = await env.VB_KV.get(`msg:${id}`, 'json');
  if (!msg) return err(404, 'not_found', `Notification ${id} not found`);

  if (typeof body?.read === 'boolean') msg.read = body.read;
  if (typeof body?.dismissed === 'boolean') msg.dismissed = body.dismissed;
  await writeMessage(env, msg);
  return json({ id: msg.id, read: msg.read, dismissed: msg.dismissed });
}

// ── POST /go/notify/subscribe ──────────────────────────────────────

export async function createSubscription(request, env) {
  const body = await readJson(request);
  if (body === undefined) return err(400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.url || !body?.type) {
    return err(400, 'invalid_input', 'url and type are required');
  }

  const id = newId('sub');
  const sub = {
    id,
    url: body.url,
    type: body.type,
    notify: Array.isArray(body.notify) ? body.notify : ['panel'],
    email: typeof body.email === 'string' ? body.email : null,
    createdAt: new Date().toISOString(),
  };
  await env.VB_KV.put(`sub:${id}`, JSON.stringify(sub));
  const ids = await readIndex(env, SUB_INDEX);
  ids.push(id);
  await writeIndex(env, SUB_INDEX, ids);
  return json({ id, status: 'active' }, 201);
}

// ── DELETE /go/notify/subscribe/:id ────────────────────────────────

export async function deleteSubscription(_request, env, id) {
  const sub = await env.VB_KV.get(`sub:${id}`, 'json');
  if (!sub) return err(404, 'not_found', `Subscription ${id} not found`);
  await env.VB_KV.delete(`sub:${id}`);
  const ids = (await readIndex(env, SUB_INDEX)).filter(x => x !== id);
  await writeIndex(env, SUB_INDEX, ids);
  return json({ status: 'removed' });
}

// ── GET /go/notify/subscribe ───────────────────────────────────────

export async function listSubscriptions(_request, env) {
  const subs = await readSubscriptions(env);
  return json({ subscriptions: subs });
}

/**
 * Helper for cron jobs / admin scripts to seed a notification programmatically.
 * Not part of the contract; useful for hooking page-watch server-side checks
 * up to the message index.
 */
export async function pushNotification(env, partial) {
  const id = partial.id || newId('msg');
  const msg = {
    id,
    type: partial.type || 'update',
    title: partial.title || '',
    body: partial.body || '',
    url: partial.url || null,
    date: partial.date || new Date().toISOString(),
    read: false,
    dismissed: false,
    priority: partial.priority || 'normal',
    expires: partial.expires || null,
  };
  await writeMessage(env, msg);
  return msg;
}
