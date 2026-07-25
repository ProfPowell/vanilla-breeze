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
import './utils/progress-ring-init.js';
import './utils/recently-visited-init.js';
import { initExternalThemeSync } from './utils/external-theme-sync.js';
import { runFullGuards } from './lib/lazy-guards-full.js';
import { initFormCoordinator } from './lib/form-coordinator.js';
import { initFormFieldEnhancements } from './lib/form-field-enhancements.js';
import { initBotProtection } from './lib/bot-protection.js';
import { initAutoloader } from './lib/autoloader.js';
import './lib/sw-register.js';

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

// Initialize theme system
await ThemeManager.init();

// Sync external components with theme
initExternalThemeSync();

// Form validation coordinator
initFormCoordinator();
initFormFieldEnhancements();
initBotProtection();

// Conditional enhancement imports, from the shared table in
// lib/lazy-guards.js. This file becomes /cdn/vanilla-breeze-autoload.js, which
// every built page loads — a guard missing here ships the feature broken on
// built pages while dev (which loads main.js directly) looks fine. Deriving
// from the table instead of hand-copying is what makes that impossible.
runFullGuards();

// Boot unified effects observer
VB.observe();

// Initialize autoloader for extras (geo-map, emoji-picker, etc.)
await initAutoloader();
