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
import { initExternalThemeSync } from './utils/external-theme-sync.js';
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

// Lazy-load wizard only when [data-wizard] is present
if (document.querySelector('[data-wizard]')) import('./lib/wizard.js');

// Lazy-load page-watch when either a [data-watch-page] trigger or a
// <watch-wc> wrapper is on the page. The wrapper renders the trigger
// at setup() time, so match either. Previously the trigger only lived
// in main.js + main-autoload.js, which dev loads directly — production
// loads this core bundle and was missing the enhancement entirely,
// which is why clicking the watch button did nothing on vanilla-breeze.com.
if (document.querySelector('[data-watch-page], watch-wc')) import('./utils/page-watch-init.js');
