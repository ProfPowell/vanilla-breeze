/**
 * GET /go/newsletter/preferences?email=… — list a user's subscriptions.
 */

import { preferences } from '../../_lib/go/newsletter.js';
import { handlePreflight, requireKV } from '../../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestGet({ request, env }) {
  return requireKV(env) ?? preferences(request, env);
}
