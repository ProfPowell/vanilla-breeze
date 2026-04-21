/**
 * GET /go/notify/messages — list notifications.
 *
 * Pages Function wrapper around the shared handler in
 * functions/_lib/go/notify.js. Same signature as the reference Worker
 * (admin/reference-implementations/cloudflare/) — only the dispatch
 * shape differs because Pages Functions use file-system routing.
 */

import { listMessages } from '../../../_lib/go/notify.js';
import { handlePreflight, requireKV } from '../../../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestGet({ request, env }) {
  return requireKV(env) ?? listMessages(request, env);
}
