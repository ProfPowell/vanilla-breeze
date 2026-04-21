/**
 * POST /go/newsletter/unsubscribe — remove an email from one or more lists.
 */

import { unsubscribe } from '../../_lib/go/newsletter.js';
import { handlePreflight, requireKV } from '../../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestPost({ request, env }) {
  return requireKV(env) ?? unsubscribe(request, env);
}
