import { ThemeManager } from './lib/theme-manager.js';
import './custom-elements/register.js';
import './web-components/index.js';
import './utils/tooltip-init.js';
import './utils/highlights-init.js';
import './utils/view-transition-init.js';
import { initExternalThemeSync } from './utils/external-theme-sync.js';
// Lazy-load wizard only when [data-wizard] is present (~15 KB deferred)
if (document.querySelector('[data-wizard]')) import('./lib/wizard.js');
// Lazy-load gestures only when [data-gesture] is present
if (document.querySelector('[data-gesture]')) import('./lib/vb-gestures.js');
// Lazy-load markdown-editable only when [data-markdown-editable] is present
if (document.querySelector('[data-markdown-editable]')) import('./utils/markdown-editable-init.js');
// Lazy-load scroll-hide only when [data-scroll-hide] is present
if (document.querySelector('[data-scroll-hide]')) import('./utils/scroll-hide-init.js');
// Lazy-load focus-trap only when [data-focus-trap] is present
if (document.querySelector('[data-focus-trap]')) import('./utils/focus-trap-init.js');
// Lazy-load responsive image enhancement only when [data-responsive] is present
if (document.querySelector('img[data-responsive]')) import('./utils/responsive-init.js');
// Lazy-load pagination upscale only when [data-paged] is present
if (document.querySelector('[data-paged]')) import('./utils/data-paged-init.js');
// Lazy-load sortable upscale when [data-sortable] or [data-sort-target] is present
if (document.querySelector('[data-sortable], [data-sort-target]')) import('./utils/data-sortable-init.js');
// Lazy-load attribute-toggle upscale when [data-toggle] is present
if (document.querySelector('[data-toggle]')) import('./utils/data-toggle-init.js');
// Lazy-load the rel-aware link enhancer only when there's an outbound
// _blank link on the page — the only thing it auto-upgrades. The
// exported helpers (collectLinksByRel, upgradeBlankTargets) are still
// importable on demand from anywhere.
if (document.querySelector('a[target="_blank"]')) import('./utils/links-init.js');
// Lazy-load loading button enhancement only when [data-loading] is on a button
if (document.querySelector('button[data-loading]')) import('./utils/loading-button-init.js');
// Lazy-load floating label only when [data-floating-label] is present
if (document.querySelector('[data-floating-label]')) import('./utils/floating-label-init.js');
// Lazy-load hotkey action binding when [data-hotkey] is on non-kbd elements
if (document.querySelector('[data-hotkey]:not(kbd)')) import('./utils/hotkey-action-init.js');
// Lazy-load page-watch when either a [data-watch-page] trigger or a
// <watch-wc> wrapper is present (the wrapper renders the trigger at setup).
if (document.querySelector('[data-watch-page], watch-wc')) import('./utils/page-watch-init.js');
// Lazy-load email-form enhancement only when a form opts in
if (document.querySelector('form[data-vb-email-form]')) import('./utils/email-form-init.js');
// Lazy-load newsletter-form enhancement only when a form opts in
if (document.querySelector('form[data-vb-newsletter-form]')) import('./utils/newsletter-form-init.js');
// Auto-upgrade mermaid fences inside markdown-viewer or markdown-editor when opted in
if (document.querySelector('markdown-viewer[data-auto-mermaid], markdown-editor[data-auto-mermaid]')) import('./lib/markdown-mermaid-bridge.js');
// Progress ring upscale — static import, self-guards via MutationObserver
import './utils/progress-ring-init.js';
import { initStickyManager } from './lib/sticky-manager.js';
// Lazy-load mobile form utilities only when [data-keyboard-aware] is present
if (document.querySelector('[data-keyboard-aware]')) import('./lib/vb-forms.js');
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
