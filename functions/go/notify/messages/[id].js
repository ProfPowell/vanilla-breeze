/**
 * PATCH /go/notify/messages/:id — mark a message read or dismissed.
 */

import { patchMessage } from '../../../_lib/go/notify.js';
import { handlePreflight, requireKV } from '../../../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestPatch({ request, env, params }) {
  return requireKV(env) ?? patchMessage(request, env, params.id);
}
