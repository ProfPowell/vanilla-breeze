/**
 * Vanilla Breeze — Core JS Bundle (slim)
 *
 * Includes ThemeManager, core web components, and essential utility inits.
 * For niche/heavy components, add vanilla-breeze-extras.js separately.
 *
 * Usage:
 *   <script type="module" src="/cdn/vanilla-breeze-core.js"></script>
 *   <!-- Optional: -->
 *   <script type="module" src="/cdn/vanilla-breeze-extras.js"></script>
 */

import { ThemeManager } from './lib/theme-manager.js';
import './custom-elements/register.js';
import './web-components/core.js';
import './utils/tooltip-init.js';
import './utils/view-transition-init.js';
// Progress ring upscale — static in every entry, self-guards via
// MutationObserver so it also catches rings rendered after boot.
import './utils/progress-ring-init.js';
import { initExternalThemeSync } from './utils/external-theme-sync.js';
import { runCoreGuards } from './lib/lazy-guards.js';
import { initStickyManager } from './lib/sticky-manager.js';
import { initFormCoordinator } from './lib/form-coordinator.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
import { initBotProtection } from './lib/bot-protection.js';
import './lib/sw-register.js';
import { Analytics } from './lib/analytics.js';
import { wireAnalyticsEvents } from './utils/analytics-init.js';
export { Analytics } from './lib/analytics.js';

// Initialize theme system early to prevent FOUC
await ThemeManager.init();

// Initialize sticky system if enabled (must run before layout settles)
if (document.documentElement.hasAttribute('data-sticky')) initStickyManager();

// Sync external components (browser-window, code-block) with theme
initExternalThemeSync();

// Form validation coordinator (CSS :user-valid/:user-invalid still work without JS)
initFormCoordinator();

// Enhance form fields (password toggle, etc.)
initFormFieldEnhancements();

// Bot protection (honeypot + behavioral scoring)
initBotProtection();

// Analytics (first-cut, Phase 1). Transport defaults to 'console' so events
// are visible in devtools without a backend. Override before this script
// runs via <script>window.vbAnalyticsConfig = { transport: 'beacon' }</script>.
Analytics.init({
  siteId:    globalThis.vbAnalyticsConfig?.siteId    ?? 'vb-docs',
  transport: globalThis.vbAnalyticsConfig?.transport ?? 'console',
  endpoint:  globalThis.vbAnalyticsConfig?.endpoint  ?? '/api/analytics',
});
wireAnalyticsEvents();

// Optional observability modules. Imports with side effects — they
// attach PerformanceObservers / error handlers / scroll listeners and
// report via Analytics.track(), which is safely opt-out gated above.
import('./utils/analytics-vitals-init.js');
import('./utils/analytics-errors-init.js');
import('./utils/analytics-buffer-init.js');

// Conditional enhancement imports, from the shared table in
// lib/lazy-guards.js. This entry gets the 'core' tier: every guard except
// the heavy extras-tier ones (markdown editing, emoji data, annotation
// highlights, prototyping fillers), which a core-only page cannot use.
//
// This file used to carry two hand-copied guards while main.js carried
// nineteen, so seventeen enhancements — gestures, focus-trap, loading
// buttons, floating labels, hotkeys, the email/newsletter forms, paged and
// sortable collections — were dead on every page loading the core bundle,
// which is what the production docs site ships. Same failure mode as the
// page-watch button that shipped broken on vanilla-breeze.com.
runCoreGuards();
