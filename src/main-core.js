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
import { initFormValidation } from './lib/form-validation.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
import './lib/sw-register.js';

// Initialize theme system early to prevent FOUC
await ThemeManager.init();

// Sync external components (browser-window, code-block) with theme
initExternalThemeSync();

// Suppress browser validation bubbles (CSS :user-valid/:user-invalid still work)
initFormValidation();

// Enhance form fields (password toggle, etc.)
initFormFieldEnhancements();

// Lazy-load wizard only when [data-wizard] is present
if (document.querySelector('[data-wizard]')) import('./lib/wizard.js');
