/**
 * GET /go/feed — changelog / what's-new entries.
 */

import { getFeed } from '../../_lib/go/feed.js';
import { handlePreflight, requireKV } from '../../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestGet({ request, env }) {
  return requireKV(env) ?? getFeed(request, env);
}
