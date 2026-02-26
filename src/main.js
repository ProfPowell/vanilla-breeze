import { ThemeManager } from './lib/theme-manager.js';
import './custom-elements/register.js';
import './web-components/index.js';
import './utils/tooltip-init.js';
import './utils/view-transition-init.js';
import { initExternalThemeSync } from './utils/external-theme-sync.js';
// Lazy-load wizard only when [data-wizard] is present (~15 KB deferred)
if (document.querySelector('[data-wizard]')) import('./lib/wizard.js');
// Lazy-load gestures only when [data-gesture] is present
if (document.querySelector('[data-gesture]')) import('./lib/vb-gestures.js');
import { initFormValidation } from './lib/form-validation.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
import './lib/sw-register.js';

// Initialize theme system early to prevent FOUC
// init() is async — loads saved theme CSS before applying
await ThemeManager.init();

// Sync external components (browser-window, code-block) with theme
initExternalThemeSync();

// Suppress browser validation bubbles (CSS :user-valid/:user-invalid still work)
initFormValidation();

// Enhance form fields (password toggle, etc.)
initFormFieldEnhancements();
