/**
 * POST /go/email — queue a transactional email by template name.
 */

import { sendEmail } from '../_lib/go/email.js';
import { handlePreflight, requireKV } from '../_lib/go/shared.js';

export const onRequestOptions = () => handlePreflight();

export async function onRequestPost({ request, env }) {
  return requireKV(env) ?? sendEmail(request, env);
}
