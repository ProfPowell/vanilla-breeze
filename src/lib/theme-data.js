/**
 * theme-data: Shared theme definitions
 *
 * Single source of truth for all theme metadata used by
 * theme-picker, settings-panel, and any future consumers.
 *
 * Themes are organized into three tiers:
 *   core      — bundled in core CSS, instant switching, zero network requests
 *   showcase  — on-demand loading, prominently featured
 *   community — on-demand loading, available but not prominent
 */

export const MODES = [
  { id: 'auto', name: 'Auto', icon: 'monitor' },
  { id: 'light', name: 'Light', icon: 'sun' },
  { id: 'dark', name: 'Dark', icon: 'moon' }
];

// Color themes - override hue values only (core tier)
export const COLOR_THEMES = [
  { id: 'default', name: 'Default', hue: 260, swatchBg: '#3b82f6', tier: 'core' },
  { id: 'ocean', name: 'Ocean', hue: 200, swatchBg: '#0891b2', tier: 'core' },
  { id: 'forest', name: 'Forest', hue: 145, swatchBg: '#059669', tier: 'core' },
  { id: 'sunset', name: 'Sunset', hue: 25, swatchBg: '#ea580c', tier: 'core' },
  { id: 'rose', name: 'Rose', hue: 350, swatchBg: '#e11d48', tier: 'core' },
  { id: 'lavender', name: 'Lavender', hue: 280, swatchBg: '#a855f7', tier: 'core' },
  { id: 'coral', name: 'Coral', hue: 15, swatchBg: '#f97316', tier: 'core' },
  { id: 'slate', name: 'Slate', hue: 220, swatchBg: '#64748b', tier: 'core' },
  { id: 'emerald', name: 'Emerald', hue: 160, swatchBg: '#10b981', tier: 'core' },
  { id: 'amber', name: 'Amber', hue: 45, swatchBg: '#f59e0b', tier: 'core' },
  { id: 'indigo', name: 'Indigo', hue: 250, swatchBg: '#6366f1', tier: 'core' }
];

// Personality themes - comprehensive design systems (core tier)
export const PERSONALITY_THEMES = [
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
  // OS Styles
  { id: 'win9x', name: 'Win9x', icon: 'monitor', character: 'Classic desktop', swatchBg: '#008080', swatchFg: '#c0c0c0', tier: 'showcase', category: 'OS Styles' },
  { id: 'nes', name: 'NES', icon: 'joystick', character: 'Console pixels', swatchBg: '#bcbcbc', swatchFg: '#e40521', tier: 'showcase', category: 'OS Styles' },
  { id: '8bit', name: '8-Bit', icon: 'gamepad-2', character: 'Retro pixel art', swatchBg: '#000080', swatchFg: '#ffff00', tier: 'showcase', category: 'OS Styles' },
  { id: 'magna', name: 'Magna', icon: 'orbit', character: 'Odyssey 2 retro', swatchBg: '#0d0b14', swatchFg: '#f97316', tier: 'showcase', category: 'OS Styles' },
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
  { id: 'retro', name: 'Retro', icon: 'tv', character: 'CRT terminal', swatchBg: '#0a0a14', swatchFg: '#00ff66', tier: 'showcase', category: 'Packs' },
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
  ...COLOR_THEMES,
  ...PERSONALITY_THEMES,
  ...SHOWCASE_THEMES,
  ...COMMUNITY_THEMES,
  ...BUNDLE_THEMES
];

// Helper to filter showcase themes by category
const showcaseByCategory = (cat) => SHOWCASE_THEMES.filter(t => t.category === cat);

// Grouped structure for <select>/<optgroup> rendering and tiered UI
export const THEME_GROUPS = [
  { label: 'Colors', themes: COLOR_THEMES, tier: 'core' },
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
