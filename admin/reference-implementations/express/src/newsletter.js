/**
 * /go/newsletter/* — list-based subscription management.
 *
 * Available lists are configured via env.NEWSLETTER_LISTS (comma-separated).
 * Default: weekly-digest, release-notes, security-alerts.
 */

import { Router } from 'express';
import { err, wrap } from './shared.js';

function getAvailableLists() {
  const raw = process.env.NEWSLETTER_LISTS || 'weekly-digest,release-notes,security-alerts';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function newsletterRouter(store) {
  const r = Router();

  r.post('/subscribe', wrap(async (req, res) => {
    if (!req.body?.email || !Array.isArray(req.body?.lists)) {
      return err(res, 400, 'invalid_input', 'email (string) and lists (array) are required');
    }
    const available = getAvailableLists();
    const set = store.getNewsletterSubs(req.body.email);
    for (const list of req.body.lists) {
      if (available.includes(list)) set.add(list);
    }
    store.putNewsletterSubs(req.body.email, set);
    res.status(201).json({ status: 'subscribed', lists: [...set] });
  }));

  r.post('/unsubscribe', wrap(async (req, res) => {
    if (!req.body?.email || !Array.isArray(req.body?.lists)) {
      return err(res, 400, 'invalid_input', 'email (string) and lists (array) are required');
    }
    const set = store.getNewsletterSubs(req.body.email);
    for (const list of req.body.lists) set.delete(list);
    store.putNewsletterSubs(req.body.email, set);
    res.json({ status: 'unsubscribed', lists: req.body.lists });
  }));

  r.get('/preferences', wrap(async (req, res) => {
    const email = req.query.email;
    if (!email) return err(res, 400, 'invalid_input', 'email query param required');
    const set = store.getNewsletterSubs(String(email));
    res.json({ subscriptions: [...set], available: getAvailableLists() });
  }));

  return r;
}
