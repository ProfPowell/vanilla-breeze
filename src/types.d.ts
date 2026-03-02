/**
 * Global type declarations for Vanilla Breeze
 * Augments Window with VB-specific properties and build-time globals.
 */

// ---------------------------------------------------------------------------
// Window augmentations
// ---------------------------------------------------------------------------

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
  __commandRegistry?: VBCommandRegistry;
  webkitAudioContext?: typeof AudioContext;
  VBMath?: VBMathGlobal;
  clipboardData?: DataTransfer;
}

/** Build-time version injected by Vite */
declare const __VB_VERSION__: string;

// ---------------------------------------------------------------------------
// CSS API extensions (emerging specs not yet in lib.dom.d.ts)
// ---------------------------------------------------------------------------

interface CSSStyleDeclaration {
  anchorName: string;
  positionAnchor: string;
  fieldSizing: string;
}

// ---------------------------------------------------------------------------
// Command system
// ---------------------------------------------------------------------------

/** A registered command entry in the palette/shortcut system */
interface VBCommandEntry {
  element: Element;
  label: string;
  group: string;
  icon: string | null;
  shortcut: string | null;
  unbind: Function | null;
}

/** The command registry exposed on window.__commandRegistry */
interface VBCommandRegistry {
  getRegisteredCommands?: () => Map<string, VBCommandEntry[]>;
  scanAutoDiscoverable?: () => VBAutoDiscoverEntry[];
}

/** An auto-discovered command entry (nav links, headings) */
interface VBAutoDiscoverEntry {
  element: Element;
  label: string;
  group: string;
  icon: string | null;
  shortcut: string | null;
  auto: boolean;
  action: Function | null;
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

/** A single data point for chart creation */
interface VBChartDataItem {
  label: string;
  value: number;
  displayValue?: string;
  series?: string;
}

/** Modifier flags for chart appearance */
interface VBChartModifiers {
  labels?: boolean;
  legend?: boolean;
  tooltip?: boolean;
  gap?: string;
  size?: string;
}

/** Options for charts.create() and charts.createPie() */
interface VBChartOptions {
  container: string | Element;
  type?: string;
  caption: string;
  data: VBChartDataItem[];
  modifiers?: VBChartModifiers;
}

/** Options for charts.animate() */
interface VBChartAnimationOptions {
  duration?: number;
  delay?: number;
  stagger?: number;
}

// ---------------------------------------------------------------------------
// Gestures
// ---------------------------------------------------------------------------

/** Options for addSwipeListener() */
interface VBSwipeOptions {
  threshold?: number;
  restraint?: number;
  timeout?: number;
}

/** Options for makeSwipeable() */
interface VBSwipeableOptions {
  threshold?: number;
  direction?: 'horizontal' | 'vertical';
  removeOnDismiss?: boolean;
}

/** Options for addPullToRefresh() */
interface VBPullToRefreshOptions {
  threshold?: number;
  maxPull?: number;
}

/** Options for addLongPress() */
interface VBLongPressOptions {
  duration?: number;
  hapticFeedback?: boolean;
  blockContextMenu?: boolean;
}

// ---------------------------------------------------------------------------
// Form field enhancements
// ---------------------------------------------------------------------------

/** A parsed password-strength rule */
interface VBPasswordRule {
  type: string;
  param?: number;
  label: string;
}

// ---------------------------------------------------------------------------
// Geo-map custom properties on images
// ---------------------------------------------------------------------------

/** An HTMLImageElement with world-pixel coordinates for map tiles */
interface VBMapImage extends HTMLImageElement {
  _wx: number;
  _wy: number;
}

// ---------------------------------------------------------------------------
// Wizard form augmentation
// ---------------------------------------------------------------------------

/** A form element augmented with wizard controller methods */
interface VBWizardForm extends HTMLFormElement {
  wizardController: {
    goTo: (index: number) => void;
    next: () => void;
    prev: () => void;
    reset: () => void;
  };
  wizardGoTo: (index: number) => void;
  wizardNext: () => void;
  wizardPrev: () => void;
  wizardReset: () => void;
}

// ---------------------------------------------------------------------------
// VBMath global
// ---------------------------------------------------------------------------

/** Global math equation registry */
interface VBMathGlobal {
  equations: Array<{ id: string; number: number; latex: string }>;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/** Theme preferences stored in localStorage */
interface VBThemePrefs {
  mode: string;
  brand: string;
  borderStyle: string;
  iconSet: string;
  fluid: string;
}

/** Theme state including computed effective mode */
interface VBThemeState extends VBThemePrefs {
  effectiveMode: string;
}
