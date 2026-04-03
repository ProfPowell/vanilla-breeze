/**
 * Palette generation algorithms.
 * All functions accept HSL values and return arrays of hex colors with names.
 * Uses hue rotation in HSL space — same principle as the OKLCH harmonics
 * in color-mix.css but computed in JS for dynamic generation.
 */
import { hexToHsl, hslToHex } from '../color-picker/_color-utils.js';

/** Wrap hue to 0-360 range */
const wrap = (h) => ((h % 360) + 360) % 360;

/**
 * Complementary: seed + opposite on the color wheel
 * @param {number} h - Hue 0-360
 * @param {number} s - Saturation 0-100
 * @param {number} l - Lightness 0-100
 * @returns {{ colors: string[], names: string[] }}
 */
export function complementary(h, s, l) {
  return {
    colors: [hslToHex(h, s, l), hslToHex(wrap(h + 180), s, l)],
    names: ['Base', 'Complement'],
  };
}

/**
 * Analogous: three adjacent hues at ±30°
 */
export function analogous(h, s, l) {
  return {
    colors: [
      hslToHex(wrap(h - 30), s, l),
      hslToHex(h, s, l),
      hslToHex(wrap(h + 30), s, l),
    ],
    names: ['Analog A', 'Base', 'Analog B'],
  };
}

/**
 * Triadic: three hues evenly spaced at 120°
 */
export function triadic(h, s, l) {
  return {
    colors: [
      hslToHex(h, s, l),
      hslToHex(wrap(h + 120), s, l),
      hslToHex(wrap(h + 240), s, l),
    ],
    names: ['Base', 'Triad A', 'Triad B'],
  };
}

/**
 * Split-complementary: seed + two hues flanking the complement at ±30°
 */
export function splitComplementary(h, s, l) {
  return {
    colors: [
      hslToHex(h, s, l),
      hslToHex(wrap(h + 150), s, l),
      hslToHex(wrap(h + 210), s, l),
    ],
    names: ['Base', 'Split A', 'Split B'],
  };
}

/**
 * Tetradic (square): four hues evenly spaced at 90°
 */
export function tetradic(h, s, l) {
  return {
    colors: [
      hslToHex(h, s, l),
      hslToHex(wrap(h + 90), s, l),
      hslToHex(wrap(h + 180), s, l),
      hslToHex(wrap(h + 270), s, l),
    ],
    names: ['Base', 'Tetrad A', 'Tetrad B', 'Tetrad C'],
  };
}

/**
 * Monochromatic: 11-step lightness ramp matching the 50-950 token scale.
 * Preserves hue and adjusts saturation slightly at extremes for natural feel.
 */
const MONO_STEPS = [
  { label: '50',  l: 96 },
  { label: '100', l: 90 },
  { label: '200', l: 80 },
  { label: '300', l: 70 },
  { label: '400', l: 60 },
  { label: '500', l: 50 },
  { label: '600', l: 40 },
  { label: '700', l: 30 },
  { label: '800', l: 22 },
  { label: '900', l: 15 },
  { label: '950', l: 10 },
];

export function monochromatic(h, s, _l) {
  const colors = [];
  const names = [];
  for (const step of MONO_STEPS) {
    // Desaturate slightly at light/dark extremes for a natural scale
    const satAdj = step.l > 85 || step.l < 20 ? Math.max(s * 0.6, 5) : s;
    colors.push(hslToHex(h, Math.round(satAdj), step.l));
    names.push(step.label);
  }
  return { colors, names };
}

/** Algorithm lookup table */
const algorithms = {
  complementary,
  analogous,
  triadic,
  'split-complementary': splitComplementary,
  tetradic,
  monochromatic,
};

/**
 * Generate a palette from a hex seed and harmony name.
 * @param {string} hex - Seed color as hex string
 * @param {string} harmony - Algorithm name
 * @returns {{ colors: string[], names: string[] }}
 */
export function generatePalette(hex, harmony) {
  const { h, s, l } = hexToHsl(hex);
  const fn = algorithms[harmony] || algorithms.complementary;
  return fn(h, s, l);
}
