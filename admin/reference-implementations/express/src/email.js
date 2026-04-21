/**
 * /go/email — transactional email via templates.
 *
 * Two delivery modes (selected by env.EMAIL_TRANSPORT):
 *   nodemailer  — uses EMAIL_SMTP_URL + EMAIL_FROM (default if SMTP url present)
 *   stub        — record-only mode, returns 202 without sending (default
 *                 when no SMTP url is configured; useful for staging)
 *
 * Add other providers (Resend, Postmark, SES) by following the
 * sendViaNodemailer block as a template.
 */

import { Router } from 'express';
import { err, newId, wrap } from './shared.js';

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

let cachedTransport = null;

async function getTransport() {
  if (cachedTransport) return cachedTransport;
  if (!process.env.EMAIL_SMTP_URL) return null;
  // Lazy-load nodemailer so the dev path doesn't require it
  const { createTransport } = await import('nodemailer');
  cachedTransport = createTransport(process.env.EMAIL_SMTP_URL);
  return cachedTransport;
}

export function emailRouter(store) {
  const r = Router();

  r.post('/', wrap(async (req, res) => {
    if (!req.body?.to || !req.body?.template) {
      return err(res, 400, 'invalid_input', 'to and template are required');
    }
    const id = newId('msg');
    const record = {
      id,
      to: req.body.to,
      template: req.body.template,
      data: req.body.data ?? {},
      queuedAt: new Date().toISOString(),
      status: 'queued',
    };
    store.putEmail(record);

    const transport = await getTransport();
    if (transport) {
      try {
        const subject = `[${req.body.template}] ${(req.body.data && (req.body.data.subject || req.body.data.title)) || 'Notification'}`;
        const text = renderTemplate(req.body.template, req.body.data);
        const info = await transport.sendMail({
          from: process.env.EMAIL_FROM,
          to: req.body.to,
          subject,
          text,
        });
        record.status = 'sent';
        record.providerId = info.messageId;
        store.putEmail(record);
      } catch (e) {
        record.status = 'failed';
        record.lastError = e instanceof Error ? e.message : String(e);
        store.putEmail(record);
        return err(res, 502, 'upstream_error', record.lastError);
      }
    } else {
      // stub mode — record kept, nothing sent
      console.log(`[email] no transport configured. Recorded ${id} → ${req.body.to} (template=${req.body.template})`);
    }

    res.status(202).json({ status: 'queued', id });
  }));

  return r;
}
