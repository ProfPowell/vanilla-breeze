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

// Bot protection (honeypot + behavioural scoring)
initBotProtection();

// Lazy-load wizard only when [data-wizard] is present
if (document.querySelector('[data-wizard]')) import('./lib/wizard.js');
