/**
 * Vanilla Breeze — Autoloading Entry Point
 *
 * Loads core components eagerly and initializes the autoloader
 * for extras. Alternative to manually loading core.js + extras.js.
 *
 * Usage:
 *   <script type="module" src="/cdn/vanilla-breeze-autoload.js"></script>
 */

import { ThemeManager } from './lib/theme-manager.js';
import './custom-elements/register.js';
import './web-components/core.js';
import './utils/tooltip-init.js';
import './utils/view-transition-init.js';
import { initExternalThemeSync } from './utils/external-theme-sync.js';
import { initFormValidation } from './lib/form-validation.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
import { initAutoloader } from './lib/autoloader.js';
import './lib/sw-register.js';

// Initialize theme system
await ThemeManager.init();

// Sync external components with theme
initExternalThemeSync();

// Form enhancements
initFormValidation();
initFormFieldEnhancements();

// Lazy-load wizard only when [data-wizard] is present
if (document.querySelector('[data-wizard]')) import('./lib/wizard.js');

// Initialize autoloader for extras (geo-map, emoji-picker, etc.)
await initAutoloader();
