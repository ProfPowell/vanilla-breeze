/**
 * /go/email — transactional email via templates.
 *
 * Two delivery modes (selected by which secrets are configured):
 *  1. Resend  — env.RESEND_API_KEY + env.RESEND_FROM
 *  2. None    — record the message in KV and return 202; useful for staging.
 *
 * Add Postmark, Sendgrid, SES, etc. by following the Resend block as a
 * template. The `template` field is just a string the backend interprets;
 * we ship a tiny built-in renderer with the four templates VB names in
 * /docs/concepts/service-contracts/.
 */

import { json, err, readJson, newId } from './shared.js';

const TEMPLATES = {
  'page-watch-update': (d) =>
    `${d.pageTitle || 'A page you are watching'} was updated.\n\n${d.changeDescription || ''}\n\nVisit: ${d.pageUrl || ''}`,
  'goodurl-digest': (d) =>
    `Daily link stewardship digest.\n\nScore: ${d.score ?? 'n/a'} (${d.trend || ''})\nItems: ${(d.items || []).length}`,
  'contact-form': (d) =>
    `New contact-form submission\n\nFrom: ${d.name} <${d.email}>\nSubject: ${d.subject || '(none)'}\n\n${d.message || ''}`,
  'newsletter-welcome': (d) =>
    `Welcome! You're subscribed to: ${(d.lists || []).join(', ') || '(no lists)'}.`,
};

function renderTemplate(template, data) {
  const fn = TEMPLATES[template];
  if (!fn) return `Template "${template}" is not registered. Data: ${JSON.stringify(data)}`;
  return fn(data || {});
}

async function deliverViaResend(env, to, template, data) {
  const subject = `[${template}] ${(data && (data.subject || data.title)) || 'Notification'}`;
  const text = renderTemplate(template, data);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to,
      subject,
      text,
    }),
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

export async function sendEmail(request, env) {
  const body = await readJson(request);
  if (body === undefined) return err(400, 'invalid_input', 'Body must be valid JSON');
  if (!body?.to || !body?.template) {
    return err(400, 'invalid_input', 'to and template are required');
  }

  const id = newId('msg');
  const record = {
    id,
    to: body.to,
    template: body.template,
    data: body.data ?? {},
    queuedAt: new Date().toISOString(),
    status: 'queued',
  };

  // Persist record so admins can audit. Best-effort.
  await env.VB_KV.put(`email:${id}`, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 30 });

  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    const result = await deliverViaResend(env, body.to, body.template, body.data);
    if (!result.ok) {
      record.status = 'failed';
      record.lastError = result.body;
      await env.VB_KV.put(`email:${id}`, JSON.stringify(record));
      return err(502, 'upstream_error', `Resend returned ${result.status}`);
    }
    record.status = 'sent';
    record.providerId = result.body?.id;
    await env.VB_KV.put(`email:${id}`, JSON.stringify(record));
  } else {
    // No transport configured — log and accept.
    console.log(`[email] no transport configured. Recorded ${id} → ${body.to} (template=${body.template})`);
  }

  return json({ status: 'queued', id }, 202);
}
