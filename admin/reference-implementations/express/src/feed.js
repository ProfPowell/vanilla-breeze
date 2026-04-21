/**
 * /go/feed — read-only changelog/what's-new entries.
 */

import { Router } from 'express';
import { wrap } from './shared.js';

export function feedRouter(store) {
  const r = Router();

  r.get('/', wrap(async (req, res) => {
    const { since, limit } = req.query;
    let items = store.listFeed();
    if (since) {
      const cutoff = Date.parse(String(since));
      if (!Number.isNaN(cutoff)) items = items.filter(n => Date.parse(n.date) > cutoff);
    }
    const cap = Math.max(1, Math.min(200, Number(limit ?? 20)));
    res.json({ items: items.slice(0, cap) });
  }));

  return r;
}
