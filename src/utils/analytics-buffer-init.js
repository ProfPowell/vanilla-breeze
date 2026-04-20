/**
 * Analytics — engagement buffer (scroll depth + attention time).
 *
 * Auto-initialising module. Tracks two accumulating metrics per page
 * load and reports them as discrete events on the first page-hide:
 *
 *   __scroll     { depth }  — maximum scroll depth (0–100 percent) reached
 *   __attention  { ms }     — total milliseconds the tab was visible
 *
 * Sent via Analytics.track(), which means they share the core opt-out
 * gate, URL masking, transport, and keepalive handling with everything
 * else. No separate ingest endpoint — they land in the hits table via
 * /api/analytics/hit and surface in the dashboard's Engagement panel.
 *
 * Design choice: we deliberately report once per page load rather than
 * re-reporting on every hidden→visible cycle. This keeps analytics
 * volume proportional to page views, not tab-switching behaviour, and
 * matches how LCP/CLS/INP are captured in analytics-vitals-init.js.
 */

import { Analytics } from '../lib/analytics.js';

let maxScrollDepth = 0;
let attentionStart = null;  // Date.now() at the start of the current visible stretch
let attentionTotal = 0;
let reported = false;
let scrollTimer = null;

// --- scroll depth ----------------------------------------------------

function currentDepth() {
  const seen = window.scrollY + window.innerHeight;
  const total = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
  );
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((seen / total) * 100)));
}

function onScroll() {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const depth = currentDepth();
    if (depth > maxScrollDepth) maxScrollDepth = depth;
  }, 500);
}

// --- attention time --------------------------------------------------

function startAttention() {
  if (attentionStart == null) attentionStart = Date.now();
}

function pauseAttention() {
  if (attentionStart != null) {
    attentionTotal += Date.now() - attentionStart;
    attentionStart = null;
  }
}

// --- report ----------------------------------------------------------

function report() {
  if (reported) return;
  reported = true;
  pauseAttention();

  // Final scroll sample in case the debounced timer didn't fire.
  const depth = Math.max(maxScrollDepth, currentDepth());
  if (depth > 0) Analytics.track('__scroll', { depth });
  if (attentionTotal > 0) Analytics.track('__attention', { ms: attentionTotal });
}

// --- boot ------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      startAttention();
    } else {
      pauseAttention();
      // First hidden transition is our report trigger — some mobile
      // browsers (iOS Safari) never fire pagehide, so we can't rely on
      // it alone.
      report();
    }
  });

  window.addEventListener('pagehide', report);

  // Start the attention clock if the page is already visible on boot.
  if (document.visibilityState === 'visible') startAttention();
}
