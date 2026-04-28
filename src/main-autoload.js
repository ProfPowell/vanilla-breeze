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

// Lazy-load wizard only when [data-wizard] is present
if (document.querySelector('[data-wizard]')) import('./lib/wizard.js');

// Lazy-load data-attribute utilities only when matching elements are present
if (document.querySelector('[data-emoji]')) import('./utils/emoji-init.js');
if (document.querySelector('input[data-mask]')) import('./utils/mask-init.js');
if (document.querySelector('textarea[data-grow]')) import('./utils/textarea-grow-init.js');
if (document.querySelector('textarea[data-count]')) import('./utils/textarea-count-init.js');
if (document.querySelector('input[data-accept]')) import('./utils/accept-init.js');
if (document.querySelector('[data-highlights]')) import('./utils/highlights-init.js');
if (document.querySelector('[data-copy], [data-copy-target]')) import('./utils/copy-init.js');
if (document.querySelector('[data-hotkey]:not(kbd)')) import('./utils/hotkey-action-init.js');
if (document.querySelector('[data-watch-page], watch-wc')) import('./utils/page-watch-init.js');
if (document.querySelector('form[data-vb-email-form]')) import('./utils/email-form-init.js');
if (document.querySelector('form[data-vb-newsletter-form]')) import('./utils/newsletter-form-init.js');
if (document.querySelector('[data-select-all]')) import('./utils/select-all-init.js');
if (document.querySelector('[data-show-when], [data-hide-when]')) import('./utils/conditional-init.js');
if (document.querySelector('button[data-loading]')) import('./utils/loading-button-init.js');
if (document.querySelector('input[type="checkbox"][data-switch]')) import('./utils/switch-init.js');
if (document.querySelector('[data-spoiler]')) import('./utils/spoiler-init.js');
if (document.querySelector('time[data-format-date]')) import('./utils/format-date-init.js');
if (document.querySelector('[data-command], [commandfor]')) import('./utils/command-init.js');
if (document.querySelector('[data-focus-trap]')) import('./utils/focus-trap-init.js');
if (document.querySelector('form[data-autosave]')) import('./utils/autosave-init.js');
if (document.querySelector('[data-math], code.language-math')) import('./utils/math-init.js');
if (document.querySelector('input[type="range"][data-range]')) import('./utils/range-init.js');
if (document.querySelector('input[type="number"][data-stepper]')) import('./utils/number-init.js');
if (document.querySelector('form-field[data-floating-label]')) import('./utils/floating-label-init.js');
if (document.querySelector('[data-markdown-editable]')) import('./utils/markdown-editable-init.js');
if (document.querySelector('input[type="file"][data-upload]')) import('./utils/upload-init.js');
if (document.querySelector('img[data-responsive]')) import('./utils/responsive-init.js');
if (document.querySelector('data[data-format-number]')) import('./utils/format-number-init.js');
if (document.querySelector('data[data-format-bytes]')) import('./utils/format-bytes-init.js');
if (document.querySelector('[data-splitter]')) import('./utils/splitter-init.js');
if (document.querySelector('fieldset[data-toggle-tags][data-max]')) import('./utils/toggle-tags-init.js');
if (document.querySelector(':is(img, video, iframe, canvas)[data-mock]')) import('./utils/mock-init.js');
if (document.querySelector('[data-lorem]')) import('./utils/lorem-init.js');

// Boot unified effects observer
VB.observe();

// Initialize autoloader for extras (geo-map, emoji-picker, etc.)
await initAutoloader();
