/**
 * Analytics — Web Vitals (LCP, CLS, INP, TTFB).
 *
 * Auto-initialising module. Imported once by main-core.js after
 * Analytics.init() so every call here is safely opt-out gated.
 *
 * Thresholds match web.dev's current Core Web Vitals cutoffs:
 *   LCP  ≤ 2500ms good · ≤ 4000ms needs-improvement · else poor
 *   CLS  ≤ 0.10 good   · ≤ 0.25 needs-improvement   · else poor
 *   INP  ≤ 200ms good  · ≤ 500ms needs-improvement  · else poor
 *   TTFB ≤ 800ms good  · ≤ 1800ms needs-improvement · else poor
 *
 * Each metric fires as a normalised analytics event:
 *   perf.lcp / perf.cls / perf.inp / perf.ttfb
 *
 * See admin/plans/analytics/analytics-spec.md — Tier-3 table and
 * "Web Vitals Module" reference implementation.
 */

import { Analytics } from '../lib/analytics.js';

function rating(value, good, poor) {
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function track(name, value, good, poor, extra = {}) {
  Analytics.track(name, {
    value: Math.round(value * 1000) / 1000,
    rating: rating(value, good, poor),
    ...extra,
  });
}

function observeLCP() {
  let last = null;
  const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    last = entries[entries.length - 1];
  });
  try { obs.observe({ type: 'largest-contentful-paint', buffered: true }); }
  catch { return; }

  // Report on the first hide so we don't miss it if the user navigates away.
  const report = () => {
    if (!last) return;
    track('perf.lcp', last.startTime, 2500, 4000);
    last = null;
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') report();
  });
  window.addEventListener('pagehide', report);
}

function observeCLS() {
  let score = 0;
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const e = /** @type {any} */ (entry);
      if (!e.hadRecentInput) score += e.value;
    }
  });
  try { obs.observe({ type: 'layout-shift', buffered: true }); }
  catch { return; }

  const report = () => {
    track('perf.cls', score, 0.10, 0.25);
    score = 0;
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') report();
  });
  window.addEventListener('pagehide', report);
}

function observeINP() {
  let max = 0;
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > max) max = entry.duration;
    }
  });
  try { obs.observe(/** @type {any} */ ({ type: 'event', durationThreshold: 40, buffered: true })); }
  catch {
    // Older browsers don't support 'event' — fall back silently.
    return;
  }

  const report = () => {
    if (max === 0) return;
    track('perf.inp', max, 200, 500);
    max = 0;
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') report();
  });
  window.addEventListener('pagehide', report);
}

function reportTTFB() {
  // Navigation Timing Level 2 — the single entry type 'navigation' carries
  // responseStart, which is the classic TTFB moment.
  try {
    const [nav] = /** @type {any[]} */ (performance.getEntriesByType('navigation'));
    if (!nav || !nav.responseStart) return;
    track('perf.ttfb', nav.responseStart, 800, 1800, {
      navigationType: nav.type,
    });
  } catch { /* ignore */ }
}

// --- Boot ------------------------------------------------------------

if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  observeLCP();
  observeCLS();
  observeINP();
  // Defer TTFB one tick so Navigation Timing entry is finalised.
  if (document.readyState === 'complete') reportTTFB();
  else window.addEventListener('load', reportTTFB, { once: true });
}
