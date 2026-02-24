/**
 * Core Web Components — essential components loaded eagerly
 *
 * ~19 components that most sites will use. This is the slim JS entry point.
 * For niche/heavy components, add extras.js separately.
 */

// Core components
import './tab-set/logic.js';
import './foot-notes/logic.js';
import './accordion-wc/logic.js';
import './toast-msg/logic.js';
import './tool-tip/logic.js';
import './drop-down/logic.js';
import './icon-wc/icon-wc.js';
import './theme-picker/logic.js';
import './heading-links/logic.js';
import './page-toc/logic.js';
import './data-table/logic.js';
import './site-search/logic.js';
import './card-list/logic.js';
import './content-swap/logic.js';
import './carousel-wc/logic.js';
import './star-rating/logic.js';
import './combo-box/logic.js';
import './context-menu/logic.js';
import './include-file/logic.js';
import './settings-panel/logic.js';

// Core utility inits
import '../utils/interest-polyfill.js';
import '../utils/copy-init.js';
import '../utils/hotkey-init.js';
import '../utils/format-number-init.js';
import '../utils/format-date-init.js';
import '../utils/format-bytes-init.js';
import '../utils/ticker-init.js';
import '../utils/spoiler-init.js';
import '../utils/splitter-init.js';
import '../utils/rating-init.js';
import '../utils/switch-init.js';
import '../utils/textarea-count-init.js';
import '../utils/textarea-grow-init.js';
import '../utils/conditional-init.js';
import '../utils/range-init.js';
import '../utils/upload-init.js';
import '../utils/autosave-init.js';
import '../utils/mask-init.js';
import '../utils/toggle-tags-init.js';
import '../utils/number-init.js';
import '../utils/color-init.js';
import '../utils/reveal-init.js';
import '../utils/highlight-init.js';
import '../utils/select-all-init.js';
import '../utils/math-init.js';
