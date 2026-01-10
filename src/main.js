import { ThemeManager } from './lib/theme-manager.js';
import './custom-elements/register.js';
import './web-components/index.js';
import './utils/tooltip-init.js';

// Initialize theme system early to prevent FOUC
ThemeManager.init();
