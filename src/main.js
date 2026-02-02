import { ThemeManager } from './lib/theme-manager.js';
import './custom-elements/register.js';
import './web-components/index.js';
import './utils/tooltip-init.js';
import { initExternalThemeSync } from './utils/external-theme-sync.js';
import './lib/debug-content-model.js';
import { initFormValidation } from './lib/form-validation.js';

// Initialize theme system early to prevent FOUC
ThemeManager.init();

// Sync external components (browser-window, code-block) with theme
initExternalThemeSync();

// Suppress browser validation bubbles (CSS :user-valid/:user-invalid still work)
initFormValidation();
