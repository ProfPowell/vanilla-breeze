/**
 * /go/notify/* — notification delivery and subscriptions.
 */

import { Router } from 'express';
import { err, newId, wrap } from './shared.js';

export function notifyRouter(store) {
  const r = Router();

  // GET /go/notify/messages
  r.get('/messages', wrap(async (req, res) => {
    const { since, type, unread, limit } = req.query;
    const all = store.listMessages();
    let items = all.filter(m => !m.dismissed);
    if (since) {
      const cutoff = Date.parse(String(since));
      if (!Number.isNaN(cutoff)) items = items.filter(m => Date.parse(m.date) > cutoff);
    }
    if (type) items = items.filter(m => m.type === type);
    if (String(unread) === 'true') items = items.filter(m => !m.read);
    const cap = Math.max(1, Math.min(500, Number(limit ?? 50)));
    const total = all.filter(m => !m.dismissed).length;
    const unreadCount = all.filter(m => !m.dismissed && !m.read).length;
    res.json({ items: items.slice(0, cap), total, unread: unreadCount });
  }));

  // PATCH /go/notify/messages/:id
  r.patch('/messages/:id', wrap(async (req, res) => {
    const msg = store.getMessage(req.params.id);
    if (!msg) return err(res, 404, 'not_found', `Notification ${req.params.id} not found`);
    if (typeof req.body?.read === 'boolean') msg.read = req.body.read;
    if (typeof req.body?.dismissed === 'boolean') msg.dismissed = req.body.dismissed;
    store.putMessage(msg);
    res.json({ id: msg.id, read: msg.read, dismissed: msg.dismissed });
  }));

  // POST /go/notify/subscribe
  r.post('/subscribe', wrap(async (req, res) => {
    if (!req.body?.url || !req.body?.type) {
      return err(res, 400, 'invalid_input', 'url and type are required');
    }
    const id = newId('sub');
    const sub = {
      id,
      url: req.body.url,
      type: req.body.type,
      notify: Array.isArray(req.body.notify) ? req.body.notify : ['panel'],
      email: typeof req.body.email === 'string' ? req.body.email : null,
      createdAt: new Date().toISOString(),
    };
    store.putSubscription(sub);
    res.status(201).json({ id, status: 'active' });
  }));

  // DELETE /go/notify/subscribe/:id
  r.delete('/subscribe/:id', wrap(async (req, res) => {
    const removed = store.deleteSubscription(req.params.id);
    if (!removed) return err(res, 404, 'not_found', `Subscription ${req.params.id} not found`);
    res.json({ status: 'removed' });
  }));

  // GET /go/notify/subscribe
  r.get('/subscribe', wrap(async (_req, res) => {
    res.json({ subscriptions: store.listSubscriptions() });
  }));

  return r;
}
