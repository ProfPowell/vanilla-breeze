import { ThemeManager } from './lib/theme-manager.js';
import './custom-elements/register.js';
import './web-components/index.js';
import './utils/tooltip-init.js';
import './utils/highlights-init.js';
import './utils/view-transition-init.js';
import { initExternalThemeSync } from './utils/external-theme-sync.js';
import { runFullGuards } from './lib/lazy-guards-full.js';
// Every conditional enhancement import lives in lib/lazy-guards.js so the
// three entry points cannot drift apart. 'full' runs the extras-tier guards
// (markdown editing, emoji, highlights) on top of the core set.
runFullGuards();
// Progress ring upscale — static import, self-guards via MutationObserver
import './utils/progress-ring-init.js';
import { initStickyManager } from './lib/sticky-manager.js';
import { initFormCoordinator } from './lib/form-coordinator.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
import { initBotProtection } from './lib/bot-protection.js';
import './lib/sw-register.js';
import { Analytics } from './lib/analytics.js';
import { wireAnalyticsEvents } from './utils/analytics-init.js';
export { registerEffect, registerComponent, activateBundle } from './lib/bundle-registry.js';
export { Analytics } from './lib/analytics.js';

// VB effects system — unified data-effect API
import { VB } from './lib/vb.js';
import './lib/vb-triggers.js';
import './lib/vb-transitions.js';
import './effects/glitch.js';
import './effects/reveal.js';
import './effects/blur-reveal.js';
import './effects/highlight.js';
import './effects/typewriter.js';
import './effects/scramble.js';
import './effects/ticker.js';
import './effects/animate-image.js';
import './effects/flipboard.js';
import './effects/rating.js';
export { VB } from './lib/vb.js';

// Initialize theme system early to prevent FOUC
// init() is async — loads saved theme CSS before applying
await ThemeManager.init();

// Initialize sticky system if enabled (must run before layout settles)
if (document.documentElement.hasAttribute('data-sticky')) initStickyManager();

// Boot unified effects observer
VB.observe();

// Sync external components (browser-window, code-block) with theme
initExternalThemeSync();

// Form validation coordinator (CSS :user-valid/:user-invalid still work without JS)
initFormCoordinator();

// Enhance form fields (password toggle, etc.)
initFormFieldEnhancements();

// Bot protection (honeypot + behavioural scoring)
initBotProtection();

// Analytics (first-cut, Phase 1). Transport defaults to 'console' so events
// are visible in devtools without a backend. Sites that want real ingest
// call Analytics.init({ transport: 'beacon', endpoint: '/api/analytics' })
// from their own entry after this module loads, or set the override via
// window.vbAnalyticsConfig before main.js runs.
Analytics.init({
  siteId:    globalThis.vbAnalyticsConfig?.siteId    ?? 'vb-docs',
  transport: globalThis.vbAnalyticsConfig?.transport ?? 'console',
  endpoint:  globalThis.vbAnalyticsConfig?.endpoint  ?? '/api/analytics',
});
wireAnalyticsEvents();

// Optional observability modules — Web Vitals + runtime errors + engagement.
import('./utils/analytics-vitals-init.js');
import('./utils/analytics-errors-init.js');
import('./utils/analytics-buffer-init.js');
