/**
 * /go/notify/subscribe — list (GET) and create (POST) subscriptions.
 */

import { createSubscription, listSubscriptions } from '../../../_lib/go/notify.js';
import { handlePreflight, requireKV } from '../../../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestGet({ request, env }) {
  return requireKV(env) ?? listSubscriptions(request, env);
}

export async function onRequestPost({ request, env }) {
  return requireKV(env) ?? createSubscription(request, env);
}
