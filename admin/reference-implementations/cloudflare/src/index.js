/**
 * VB /go/* — Cloudflare Worker entry point.
 *
 * One Worker handles every reserved /go/ endpoint. Storage goes through
 * a single KV binding (env.VB_KV); email through env.RESEND_API_KEY +
 * env.RESEND_FROM if configured (otherwise records-only).
 *
 * See ../README.md for setup and deployment.
 */

import { err, handlePreflight } from './shared.js';
import {
  listMessages,
  patchMessage,
  createSubscription,
  deleteSubscription,
  listSubscriptions,
} from './notify.js';
import { getFeed } from './feed.js';
import { subscribe, unsubscribe, preferences } from './newsletter.js';
import { sendEmail } from './email.js';

/** Tiny route table. */
const routes = [
  ['GET',    /^\/go\/notify\/messages$/,           (req, env) => listMessages(req, env)],
  ['PATCH',  /^\/go\/notify\/messages\/([^/]+)$/,  (req, env, m) => patchMessage(req, env, m[1])],
  ['POST',   /^\/go\/notify\/subscribe$/,          (req, env) => createSubscription(req, env)],
  ['DELETE', /^\/go\/notify\/subscribe\/([^/]+)$/, (req, env, m) => deleteSubscription(req, env, m[1])],
  ['GET',    /^\/go\/notify\/subscribe$/,          (req, env) => listSubscriptions(req, env)],

  ['GET',    /^\/go\/feed$/,                       (req, env) => getFeed(req, env)],

  ['POST',   /^\/go\/newsletter\/subscribe$/,      (req, env) => subscribe(req, env)],
  ['POST',   /^\/go\/newsletter\/unsubscribe$/,    (req, env) => unsubscribe(req, env)],
  ['GET',    /^\/go\/newsletter\/preferences$/,    (req, env) => preferences(req, env)],

  ['POST',   /^\/go\/email$/,                      (req, env) => sendEmail(req, env)],
];

export default {
  /**
   * @param {Request} request
   * @param {{ VB_KV: KVNamespace, RESEND_API_KEY?: string, RESEND_FROM?: string, NEWSLETTER_LISTS?: string }} env
   */
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return handlePreflight();

    const url = new URL(request.url);
    for (const [method, pattern, handler] of routes) {
      if (method !== request.method) continue;
      const match = pattern.exec(url.pathname);
      if (!match) continue;
      try {
        return await handler(request, env, match);
      } catch (e) {
        console.error('[handler error]', e);
        return err(500, 'internal', e instanceof Error ? e.message : String(e));
      }
    }

    return err(404, 'not_found', `${request.method} ${url.pathname} has no handler`);
  },
};
