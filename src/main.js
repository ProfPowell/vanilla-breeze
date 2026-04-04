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
// Lazy-load loading button enhancement only when [data-loading] is on a button
if (document.querySelector('button[data-loading]')) import('./utils/loading-button-init.js');
import { initStickyManager } from './lib/sticky-manager.js';
// Lazy-load mobile form utilities only when [data-keyboard-aware] is present
if (document.querySelector('[data-keyboard-aware]')) import('./lib/vb-forms.js');
import { initFormCoordinator } from './lib/form-coordinator.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
import { initBotProtection } from './lib/bot-protection.js';
import './lib/sw-register.js';
export { registerEffect, registerComponent, activateBundle } from './lib/bundle-registry.js';

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
