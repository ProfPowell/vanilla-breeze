/**
 * Color math helpers for semantic-palette.
 * - hexToOklch / oklchToHex: round-trip sRGB hex ↔ OKLCh. Reference: Björn Ottosson's OKLab paper.
 * - resolveToHex: normalize any CSS color string to #rrggbb via a DOM probe.
 * - relativeLuminance + contrastRatio: WCAG 2.1 contrast for text-vs-background.
 * - pickContrastingHex: black-or-white pick by perceived luminance.
 */
import { hexToRgb, rgbToHex } from '../color-picker/_color-utils.js';

const srgbToLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const linearToSrgb = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Convert a #rrggbb hex string into OKLCh.
 * @param {string} hex
 * @returns {{ l: number, c: number, h: number }} l is 0–1, c ≈ 0–0.4, h in degrees 0–360
 */
export function hexToOklch(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const lcone = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const mcone = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const scone = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lp = Math.cbrt(lcone);
  const mp = Math.cbrt(mcone);
  const sp = Math.cbrt(scone);

  const L = 0.2104542553 * lp + 0.7936177850 * mp - 0.0040720468 * sp;
  const A = 1.9779984951 * lp - 2.4285922050 * mp + 0.4505937099 * sp;
  const B = 0.0259040371 * lp + 0.7827717662 * mp - 0.8086757660 * sp;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c, h };
}

/**
 * Convert OKLCh (l: 0–1, c: 0–~0.4, h: 0–360°) into a #rrggbb hex string.
 * Gamut-clamps out-of-sRGB values to [0,1] before encoding.
 */
export function oklchToHex(l, c, h) {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);

  const lp = l + 0.3963377774 * A + 0.2158037573 * B;
  const mp = l - 0.1055613458 * A - 0.0638541728 * B;
  const sp = l - 0.0894841775 * A - 1.2914855480 * B;

  const lcone = lp * lp * lp;
  const mcone = mp * mp * mp;
  const scone = sp * sp * sp;

  const lr =  4.0767416621 * lcone - 3.3077115913 * mcone + 0.2309699292 * scone;
  const lg = -1.2684380046 * lcone + 2.6097574011 * mcone - 0.3413193965 * scone;
  const lb = -0.0041960863 * lcone - 0.7034186147 * mcone + 1.7076147010 * scone;

  const r = clamp01(linearToSrgb(lr));
  const g = clamp01(linearToSrgb(lg));
  const b = clamp01(linearToSrgb(lb));

  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

/**
 * Resolve any CSS color string (hex, oklch, rgb, named) to a #rrggbb hex.
 * Uses a DOM probe element to let the browser do color-space math.
 * Returns null when the probe is unavailable or the string is invalid.
 *
 * @param {string} input
 * @param {HTMLElement} [probeEl] optional reusable probe (span attached off-screen)
 */
export function resolveToHex(input, probeEl) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return ('#' + s.slice(1).split('').map((c) => c + c).join('')).toLowerCase();
  }
  if (typeof document === 'undefined') return null;

  const probe = probeEl || document.createElement('span');
  if (!probeEl) {
    probe.style.display = 'none';
    document.body.appendChild(probe);
  }
  probe.style.color = '';
  probe.style.color = s;
  const computed = getComputedStyle(probe).color;
  if (!probeEl) probe.remove();

  const m = computed.match(/rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/);
  if (!m) return null;
  return rgbToHex(Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3]));
}

/**
 * Format OKLCh values into a CSS oklch() string.
 * @param {{l:number,c:number,h:number}} v
 */
export function formatOklch({ l, c, h }) {
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`;
}

/** Relative luminance per WCAG 2.1 */
export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG level for a ratio at normal text size.
 * @param {number} ratio
 * @returns {'AAA'|'AA'|'Fail'}
 */
export function wcagLevel(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

/** Pick black or white for contrast against a given hex background. */
export function pickContrastingHex(hex) {
  return relativeLuminance(hex) > 0.4 ? '#000000' : '#ffffff';
}
