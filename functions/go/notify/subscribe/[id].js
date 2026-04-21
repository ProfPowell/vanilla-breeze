/**
 * DELETE /go/notify/subscribe/:id — remove a subscription.
 */

import { deleteSubscription } from '../../../_lib/go/notify.js';
import { handlePreflight, requireKV } from '../../../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestDelete({ request, env, params }) {
  return requireKV(env) ?? deleteSubscription(request, env, params.id);
}
