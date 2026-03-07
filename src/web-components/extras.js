/**
 * Extra Web Components — niche/heavy components loaded separately
 *
 * ~11 components for specialized use cases (maps, emoji, drag-n-drop, etc.).
 * Load alongside core.js for full functionality:
 *   <script type="module" src="/cdn/vanilla-breeze-extras.js"></script>
 */

// Niche/heavy components
import './audio-player/logic.js';
import './audio-visualizer/logic.js';
import './geo-map/logic.js';
import './emoji-picker/logic.js';
import './drag-surface/logic.js';
import './command-palette/logic.js';
import './short-cuts/logic.js';
import './compare-surface/logic.js';
import './split-surface/logic.js';
import './qr-code/logic.js';
import './slide-accept/logic.js';
import './color-palette/logic.js';
import './type-specimen/logic.js';

// Specialty utility inits
import '../utils/command-init.js';
import '../effects/glitch.js';
import '../effects/blur-reveal.js';
import '../effects/typewriter.js';
import '../effects/scramble.js';
import '../effects/animate-image.js';
import '../utils/emoji-init.js';
