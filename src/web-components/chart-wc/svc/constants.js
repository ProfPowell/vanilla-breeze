// Line chart curve parameters
export const CURVE_TENSION = 0.2;
export const CURVE_SMOOTHNESS = 1;

// Tooltip timing (ms)
export const TOOLTIP_DEBOUNCE_MS = 100;
export const TOOLTIP_HIDE_DELAY_MS = 2000;

// Default tick counts
export const DEFAULT_Y_TICKS = 4;
export const DEFAULT_VALUE_TICKS = 6;

// Scale buffer
export const SCALE_BUFFER_PERCENT = 0.10;

// Bubble chart
export const BUBBLE_SIZE_DIVISOR = 5;
export const BUBBLE_DEFAULT_OPACITY = 0.7;

// Theme colours. Each chart token falls back to the Vanilla Breeze theme
// token that plays the same role (these inherit into the chart's shadow
// root and follow light/dark), then to a literal for use outside VB.
export const COLOR_LABEL = 'var(--chart-label-color, var(--color-text-muted, #737373))';
export const COLOR_TITLE = 'var(--chart-title-color, var(--color-text, #444))';
export const COLOR_AXIS = 'var(--chart-axis-color, var(--color-border-strong, #444))';
export const COLOR_BASELINE = 'var(--chart-baseline-color, var(--color-text-muted, #888))';
export const COLOR_TICK = 'var(--chart-tick-color, var(--color-border, #ddd))';
export const COLOR_GRID = 'var(--chart-grid-color, var(--color-border, #e4e4e4))';
