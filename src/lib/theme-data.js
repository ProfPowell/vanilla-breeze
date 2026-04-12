/**
 * theme-data: Shared theme definitions
 *
 * Single source of truth for all theme metadata used by
 * theme-picker, settings-panel, and any future consumers.
 *
 * Color accents and brand themes are separate axes:
 *   accents   — OKLCH seed overrides (hue, lightness, chroma) applied via
 *               custom properties; composable with any brand theme
 *   core      — bundled in core CSS, instant switching, zero network requests
 *   showcase  — on-demand loading, prominently featured
 *   community — on-demand loading, available but not prominent
 */

export const MODES = [
  { id: 'auto', name: 'Auto', icon: 'monitor' },
  { id: 'light', name: 'Light', icon: 'sun' },
  { id: 'dark', name: 'Dark', icon: 'moon' }
];

// Color accents — OKLCH seed overrides, composable with any brand theme
export const COLOR_ACCENTS = [
  { id: 'default', name: 'Default', swatchBg: '#3b82f6', seeds: {} },
  {
    id: 'ocean', name: 'Ocean', swatchBg: '#0891b2',
    seeds: {
      '--hue-primary': 200, '--hue-secondary': 180, '--hue-accent': 45,
      '--lightness-primary': '50%', '--chroma-primary': 0.15,
      '--lightness-secondary': '45%', '--chroma-secondary': 0.10,
      '--lightness-accent': '70%', '--chroma-accent': 0.15
    },
    seedsDark: { '--lightness-primary': '60%', '--chroma-primary': 0.12 }
  },
  {
    id: 'forest', name: 'Forest', swatchBg: '#059669',
    seeds: {
      '--hue-primary': 145, '--hue-secondary': 90, '--hue-accent': 30,
      '--lightness-primary': '45%', '--chroma-primary': 0.15,
      '--lightness-secondary': '55%', '--chroma-secondary': 0.12,
      '--lightness-accent': '65%', '--chroma-accent': 0.16
    },
    seedsDark: { '--lightness-primary': '55%', '--chroma-primary': 0.12 }
  },
  {
    id: 'sunset', name: 'Sunset', swatchBg: '#ea580c',
    seeds: {
      '--hue-primary': 25, '--hue-secondary': 0, '--hue-accent': 280,
      '--lightness-primary': '60%', '--chroma-primary': 0.20,
      '--lightness-secondary': '55%', '--chroma-secondary': 0.18,
      '--lightness-accent': '55%', '--chroma-accent': 0.18
    },
    seedsDark: { '--lightness-primary': '65%', '--chroma-primary': 0.16 }
  },
  {
    id: 'rose', name: 'Rose', swatchBg: '#e11d48',
    seeds: {
      '--hue-primary': 350, '--hue-secondary': 330, '--hue-accent': 200,
      '--lightness-primary': '55%', '--chroma-primary': 0.18,
      '--lightness-secondary': '50%', '--chroma-secondary': 0.14,
      '--lightness-accent': '60%', '--chroma-accent': 0.12
    },
    seedsDark: { '--lightness-primary': '65%', '--chroma-primary': 0.14 }
  },
  {
    id: 'lavender', name: 'Lavender', swatchBg: '#a855f7',
    seeds: {
      '--hue-primary': 280, '--hue-secondary': 300, '--hue-accent': 60,
      '--lightness-primary': '55%', '--chroma-primary': 0.14,
      '--lightness-secondary': '50%', '--chroma-secondary': 0.12,
      '--lightness-accent': '70%', '--chroma-accent': 0.14
    },
    seedsDark: { '--lightness-primary': '65%', '--chroma-primary': 0.12 }
  },
  {
    id: 'coral', name: 'Coral', swatchBg: '#f97316',
    seeds: {
      '--hue-primary': 15, '--hue-secondary': 25, '--hue-accent': 180,
      '--lightness-primary': '60%', '--chroma-primary': 0.18,
      '--lightness-secondary': '55%', '--chroma-secondary': 0.15,
      '--lightness-accent': '55%', '--chroma-accent': 0.12
    },
    seedsDark: { '--lightness-primary': '65%', '--chroma-primary': 0.15 }
  },
  {
    id: 'slate', name: 'Slate', swatchBg: '#64748b',
    seeds: {
      '--hue-primary': 220, '--hue-secondary': 210, '--hue-accent': 45,
      '--lightness-primary': '48%', '--chroma-primary': 0.10,
      '--lightness-secondary': '45%', '--chroma-secondary': 0.06,
      '--lightness-accent': '68%', '--chroma-accent': 0.15
    },
    seedsDark: { '--lightness-primary': '60%', '--chroma-primary': 0.08 }
  },
  {
    id: 'emerald', name: 'Emerald', swatchBg: '#10b981',
    seeds: {
      '--hue-primary': 160, '--hue-secondary': 140, '--hue-accent': 30,
      '--lightness-primary': '50%', '--chroma-primary': 0.15,
      '--lightness-secondary': '48%', '--chroma-secondary': 0.12,
      '--lightness-accent': '65%', '--chroma-accent': 0.16
    },
    seedsDark: { '--lightness-primary': '60%', '--chroma-primary': 0.12 }
  },
  {
    id: 'amber', name: 'Amber', swatchBg: '#f59e0b',
    seeds: {
      '--hue-primary': 45, '--hue-secondary': 30, '--hue-accent': 240,
      '--lightness-primary': '60%', '--chroma-primary': 0.16,
      '--lightness-secondary': '55%', '--chroma-secondary': 0.15,
      '--lightness-accent': '52%', '--chroma-accent': 0.14
    },
    seedsDark: { '--lightness-primary': '68%', '--chroma-primary': 0.14 }
  },
  {
    id: 'indigo', name: 'Indigo', swatchBg: '#6366f1',
    seeds: {
      '--hue-primary': 250, '--hue-secondary': 270, '--hue-accent': 35,
      '--lightness-primary': '48%', '--chroma-primary': 0.18,
      '--lightness-secondary': '45%', '--chroma-secondary': 0.14,
      '--lightness-accent': '68%', '--chroma-accent': 0.16
    },
    seedsDark: { '--lightness-primary': '62%', '--chroma-primary': 0.14 }
  }
];

// Personality themes - comprehensive design systems (core tier)
export const PERSONALITY_THEMES = [
  { id: 'default', name: 'Vanilla Breeze', hue: 210, shape: 'balanced', character: 'The default', swatchBg: '#3b82f6', tier: 'core' },
  { id: 'modern', name: 'Modern', hue: 270, shape: 'rounded', character: 'Vibrant & elevated', swatchBg: '#6366f1', tier: 'core' },
  { id: 'minimal', name: 'Minimal', hue: 240, shape: 'sharp', character: 'Clean & flat', swatchBg: '#71717a', tier: 'core' },
  { id: 'classic', name: 'Classic', hue: 220, shape: 'subtle', character: 'Serif & elegant', swatchBg: '#92400e', tier: 'core' }
];

// Showcase themes — on-demand, prominently featured
export const SHOWCASE_THEMES = [
  // Design
  { id: 'swiss', name: 'Swiss', icon: 'grid-3x3', character: 'Precision grid', swatchBg: '#ff3e00', swatchFg: 'white', tier: 'showcase', category: 'Design' },
  { id: 'brutalist', name: 'Brutalist', icon: 'square', character: 'Raw, industrial', swatchBg: '#1a1a1a', swatchFg: '#f5f5f5', tier: 'showcase', category: 'Design' },
  { id: 'art-deco', name: 'Art Deco', icon: 'crown', character: '1920s luxury', swatchBg: '#1A1A1A', swatchFg: '#C9A84C', tier: 'showcase', category: 'Design' },
  // Content
  { id: 'editorial', name: 'Editorial', icon: 'newspaper', character: 'Magazine elegance', swatchBg: '#1a1a1a', swatchFg: '#c9a227', tier: 'showcase', category: 'Content' },
  // Modern
  { id: 'genai', name: 'GenAI', icon: 'sparkles', character: 'AI aesthetic', swatchBg: '#1a0a2e', swatchFg: '#a855f7', tier: 'showcase', category: 'Modern' },
  { id: 'glassmorphism', name: 'Glass', icon: 'glass-water', character: 'Frosted surfaces', swatchBg: '#667eea', swatchFg: '#ffffff', tier: 'showcase', category: 'Modern' },
  { id: 'startup', name: 'Startup', icon: 'rocket', character: 'SaaS energy', swatchBg: '#4f46e5', swatchFg: '#ffffff', tier: 'showcase', category: 'Modern' },
  // Creative
  { id: 'organic', name: 'Organic', icon: 'leaf', character: 'Natural, handcrafted', swatchBg: '#2d5016', swatchFg: '#faf5e6', tier: 'showcase', category: 'Creative' },
  { id: 'rough', name: 'Rough', icon: 'pencil', character: 'Hand-drawn sketch', swatchBg: '#f5f0e8', swatchFg: '#3a3a3a', tier: 'showcase', category: 'Creative' },
  { id: 'cyber', name: 'Cyber', icon: 'zap', character: 'Neon futuristic', swatchBg: '#0a0a1a', swatchFg: '#00ff88', tier: 'showcase', category: 'Creative' },
  // Aesthetic
  { id: 'vaporwave', name: 'Vaporwave', icon: 'radio', character: 'Neon dreamy', swatchBg: '#2b0040', swatchFg: '#ff6ad5', tier: 'showcase', category: 'Aesthetic' },
  { id: 'neumorphism', name: 'Neumorph', icon: 'circle', character: 'Soft embossed', swatchBg: '#e0e0e0', swatchFg: '#a0a0a0', tier: 'showcase', category: 'Aesthetic' },
  { id: 'bauhaus', name: 'Bauhaus', icon: 'shapes', character: 'Geometric', swatchBg: '#F1FAEE', swatchFg: '#E63946', tier: 'showcase', category: 'Aesthetic' },
  { id: 'claymorphism', name: 'Clay', icon: 'circle-dot', character: 'Puffy 3D', swatchBg: '#f0f0f5', swatchFg: '#FF6B9D', tier: 'showcase', category: 'Aesthetic' },
  // Signature
  { id: 'alpha1999', name: 'Alpha1999', icon: 'orbit', character: 'Space retro-fi', swatchBg: '#0a0a14', swatchFg: '#d4880f', tier: 'showcase', category: 'Signature' },
  { id: 'super2026', name: 'Super2026', icon: 'triangle', character: 'Supergraphic bold', swatchBg: '#f5f0e6', swatchFg: '#c23616', tier: 'showcase', category: 'Signature' },
  { id: 'magna', name: 'Magna', icon: 'orbit', character: 'Odyssey 2 retro', swatchBg: '#0d0b14', swatchFg: '#f97316', tier: 'showcase', category: 'Signature' },
  // OS Styles
  { id: 'win9x', name: 'Win9x', icon: 'monitor', character: 'Classic desktop', swatchBg: '#008080', swatchFg: '#c0c0c0', tier: 'showcase', category: 'OS Styles' },
  { id: 'nes', name: 'NES', icon: 'joystick', character: 'Console pixels', swatchBg: '#bcbcbc', swatchFg: '#e40521', tier: 'showcase', category: 'OS Styles' },
  { id: '8bit', name: '8-Bit', icon: 'gamepad-2', character: 'Retro pixel art', swatchBg: '#000080', swatchFg: '#ffff00', tier: 'showcase', category: 'OS Styles' },
];

// Community themes — available, not prominent
export const COMMUNITY_THEMES = [
  // Editor palettes
  { id: 'nord', name: 'Nord', icon: 'snowflake', character: 'Arctic calm', swatchBg: '#2E3440', swatchFg: '#81A1C1', tier: 'community', category: 'Editor Palettes' },
  { id: 'solarized', name: 'Solarized', icon: 'sun-dim', character: 'Engineered precision', swatchBg: '#002B36', swatchFg: '#268BD2', tier: 'community', category: 'Editor Palettes' },
  { id: 'dracula', name: 'Dracula', icon: 'moon-star', character: 'Dark elegance', swatchBg: '#282A36', swatchFg: '#BD93F9', tier: 'community', category: 'Editor Palettes' },
  { id: 'catppuccin-mocha', name: 'Catppuccin', icon: 'coffee', character: 'Warm pastels', swatchBg: '#1E1E2E', swatchFg: '#CBA6F7', tier: 'community', category: 'Editor Palettes' },
  { id: 'catppuccin-latte', name: 'Ctp Latte', icon: 'coffee', character: 'Cozy daytime', swatchBg: '#eff1f5', swatchFg: '#8839ef', tier: 'community', category: 'Editor Palettes' },
  { id: 'catppuccin-frappe', name: 'Ctp Frappé', icon: 'coffee', character: 'Cool twilight', swatchBg: '#303446', swatchFg: '#ca9ee6', tier: 'community', category: 'Editor Palettes' },
  { id: 'catppuccin-macchiato', name: 'Ctp Macchiato', icon: 'coffee', character: 'Deep blue', swatchBg: '#24273a', swatchFg: '#c6a0f6', tier: 'community', category: 'Editor Palettes' },
  { id: 'gruvbox', name: 'Gruvbox', icon: 'palette', character: 'Retro warmth', swatchBg: '#282828', swatchFg: '#ebdbb2', tier: 'community', category: 'Editor Palettes' },
  { id: 'tokyo-night', name: 'Tokyo Night', icon: 'moon', character: 'Night-owl vibes', swatchBg: '#1a1b26', swatchFg: '#7aa2f7', tier: 'community', category: 'Editor Palettes' },
  { id: 'rose-pine', name: 'Rosé Pine', icon: 'flower-2', character: 'Muted elegance', swatchBg: '#191724', swatchFg: '#ebbcba', tier: 'community', category: 'Editor Palettes' },
  // Niche
  { id: 'cottagecore', name: 'Cottagecore', icon: 'flower-2', character: 'Pastoral', swatchBg: '#fdf8f0', swatchFg: '#7d8c6d', tier: 'community', category: 'Niche' },
  { id: 'terminal', name: 'Terminal', icon: 'terminal', character: 'Retro CRT', swatchBg: '#0d1117', swatchFg: '#00ff00', tier: 'community', category: 'Niche' },
  // Industry
  { id: 'clinical', name: 'Clinical', icon: 'heart-pulse', character: 'Sterile precision', swatchBg: '#ffffff', swatchFg: '#0077b6', tier: 'community', category: 'Industry' },
  { id: 'financial', name: 'Financial', icon: 'landmark', character: 'Navy + gold', swatchBg: '#1b2a4a', swatchFg: '#c9a84c', tier: 'community', category: 'Industry' },
  { id: 'government', name: 'Government', icon: 'shield', character: 'Official', swatchBg: '#002868', swatchFg: '#bf0a30', tier: 'community', category: 'Industry' },
  // Mood/Time
  { id: 'dawn', name: 'Dawn', icon: 'sunrise', character: 'Golden morning', swatchBg: '#fef3e2', swatchFg: '#d4a574', tier: 'community', category: 'Mood/Time' },
  { id: 'dusk', name: 'Dusk', icon: 'sunset', character: 'Twilight', swatchBg: '#1a1b2e', swatchFg: '#e5a858', tier: 'community', category: 'Mood/Time' },
  { id: 'midnight', name: 'Midnight', icon: 'moon', character: 'Deep night', swatchBg: '#0d1117', swatchFg: '#58a6ff', tier: 'community', category: 'Mood/Time' },
  { id: 'high-noon', name: 'High Noon', icon: 'sun', character: 'Maximum bright', swatchBg: '#ffffff', swatchFg: '#e63946', tier: 'community', category: 'Mood/Time' },
];

// Pack themes - loaded on demand from /cdn/packs/ (showcase tier)
export const BUNDLE_THEMES = [
  { id: 'kawaii', name: 'Kawaii', icon: 'heart', character: 'Cute aesthetic', swatchBg: '#ffb7c5', swatchFg: '#ff69b4', tier: 'showcase', category: 'Packs' },
  { id: 'memphis', name: 'Memphis', icon: 'star', character: 'Bold patterns', swatchBg: '#FFF8F0', swatchFg: '#d03040', tier: 'showcase', category: 'Packs' },
];

// Fluid scaling presets
export const FLUID_PRESETS = [
  { id: '', name: 'Fixed', icon: 'ruler', description: 'Static token values' },
  { id: 'default', name: 'Fluid', icon: 'move-diagonal-2', description: 'Smooth viewport scaling' },
  { id: 'compact', name: 'Compact', icon: 'minimize-2', description: 'Tighter fluid range' },
  { id: 'spacious', name: 'Spacious', icon: 'maximize-2', description: 'Generous fluid range' }
];

// Accessibility themes - composable with other themes
export const ACCESSIBILITY_THEMES = [
  { id: 'a11y-high-contrast', name: 'High Contrast', icon: 'contrast', description: 'AAA contrast (7:1+)' },
  { id: 'a11y-large-text', name: 'Large Text', icon: 'type', description: '25% larger fonts' },
  { id: 'a11y-dyslexia', name: 'Dyslexia', icon: 'book-open', description: 'Readable typography' }
];

// Extension toggles
export const EXTENSIONS = [
  { id: 'motionFx', name: 'Motion Effects', icon: 'sparkles', description: 'Hover & enter animations' },
  { id: 'sounds', name: 'Sound Effects', icon: 'volume-2', description: 'Audio feedback' }
];

// Backwards-compatible: all extreme/decorative themes (showcase + community combined)
export const EXTREME_THEMES = [...SHOWCASE_THEMES, ...COMMUNITY_THEMES];

// All brand themes combined
export const ALL_THEMES = [
  ...PERSONALITY_THEMES,
  ...SHOWCASE_THEMES,
  ...COMMUNITY_THEMES,
  ...BUNDLE_THEMES
];

// Helper to filter showcase themes by category
const showcaseByCategory = (cat) => SHOWCASE_THEMES.filter(t => t.category === cat);

// Grouped structure for <select>/<optgroup> rendering and tiered UI
export const THEME_GROUPS = [
  { label: 'Style', themes: PERSONALITY_THEMES, tier: 'core' },
  { label: 'Design', themes: showcaseByCategory('Design'), tier: 'showcase' },
  { label: 'Content', themes: showcaseByCategory('Content'), tier: 'showcase' },
  { label: 'Modern', themes: showcaseByCategory('Modern'), tier: 'showcase' },
  { label: 'Creative', themes: showcaseByCategory('Creative'), tier: 'showcase' },
  { label: 'Aesthetic', themes: showcaseByCategory('Aesthetic'), tier: 'showcase' },
  { label: 'Signature', themes: showcaseByCategory('Signature'), tier: 'showcase' },
  { label: 'OS Styles', themes: showcaseByCategory('OS Styles'), tier: 'showcase' },
  { label: 'Packs', themes: BUNDLE_THEMES, tier: 'showcase' },
  { label: 'More Themes', themes: COMMUNITY_THEMES, tier: 'community' }
];
