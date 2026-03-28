/**
 * Design System Pack
 *
 * Components for documenting brand guidelines, design tokens,
 * and visual standards. Includes specimen components for color,
 * type, spacing, shadows, radii, plus a component sampler.
 *
 * Load via CDN:
 *   <link rel="stylesheet" href="/cdn/packs/design-system.full.css">
 *   <script type="module" src="/cdn/packs/design-system.full.js"></script>
 *
 * Or via runtime activation:
 *   await activateBundle('design-system');
 */

// Existing specimen components (safe duplicate — registerComponent first-wins)
import '../../web-components/color-palette/logic.js';
import '../../web-components/type-specimen/logic.js';
import '../../web-components/spacing-specimen/logic.js';

// New components
import '../../web-components/token-specimen/logic.js';
import '../../web-components/component-sampler/logic.js';
