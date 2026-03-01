/**
 * Global type declarations for Vanilla Breeze
 * Augments Window with VB-specific properties and build-time globals.
 */

interface Window {
  VanillaBreeze?: {
    charts?: typeof import('./lib/charts.js').charts;
    mockImage?: typeof import('./lib/mock-image.js');
    [key: string]: unknown;
  };
  VBLabs?: Record<string, unknown>;
  __VB_COMPONENT_BASE?: string;
  __VB_THEME_BASE?: string;
  __VB_SERVICE_WORKER?: string;
  __commandRegistry?: Map<string, { name: string; handler: () => void; shortcut?: string; description?: string }>;
  webkitAudioContext?: typeof AudioContext;
}

/** Build-time version injected by Vite */
declare const __VB_VERSION__: string;

/**
 * Theme preferences stored in localStorage
 */
interface VBThemePrefs {
  mode: string;
  brand: string;
  borderStyle: string;
  iconSet: string;
  fluid: string;
}

/**
 * Theme state including computed effective mode
 */
interface VBThemeState extends VBThemePrefs {
  effectiveMode: string;
}
