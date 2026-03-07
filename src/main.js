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
import { initFormValidation } from './lib/form-validation.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
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

// Boot unified effects observer
VB.observe();

// Sync external components (browser-window, code-block) with theme
initExternalThemeSync();

// Suppress browser validation bubbles (CSS :user-valid/:user-invalid still work)
initFormValidation();

// Enhance form fields (password toggle, etc.)
initFormFieldEnhancements();
