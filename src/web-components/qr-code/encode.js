/**
 * qr-code encoder helpers: a thin, DOM-free layer over the vendored
 * Project Nayuki qrcodegen library (src/vendor/qrcodegen/, MIT).
 *
 * Kept separate from logic.js so tests/unit/qr-code-decode.test.js can
 * round-trip the exact matrices the component draws through a decoder.
 */
import { QrCode, QrSegment } from '../../vendor/qrcodegen/qrcodegen.js';

/** Light margin around the symbol, in modules (ISO/IEC 18004 minimum). */
export const QUIET_ZONE = 4;

/** Error-correction levels in qrcodegen order: index 0-3 = L, M, Q, H. */
export const EC_LEVELS = ['L', 'M', 'Q', 'H'];
const ECC = [QrCode.Ecc.LOW, QrCode.Ecc.MEDIUM, QrCode.Ecc.QUARTILE, QrCode.Ecc.HIGH];

/**
 * Byte-mode capacity per level at version 40 (the largest symbol). Numeric
 * and alphanumeric input packs denser, so these are a floor for any text.
 */
export const BYTE_CAPACITY = { L: 2953, M: 2331, Q: 1663, H: 1273 };

/**
 * Parse an `error-correction` attribute: 0-3 or L|M|Q|H (case-insensitive).
 *
 * @param {string | null | undefined} raw
 * @returns {number | null} 0-3, or null when the value is not recognised.
 */
export function parseErrorCorrection(raw) {
  if (raw == null || raw.trim() === '') return 1;
  const v = raw.trim().toUpperCase();
  const letter = EC_LEVELS.indexOf(v);
  if (letter !== -1) return letter;
  if (/^[0-3]$/.test(v)) return Number(v);
  return null;
}

/**
 * @typedef {object} QrMatrix
 * @property {number} version - Symbol version, 1-40.
 * @property {number} size - Modules per side, without the quiet zone.
 * @property {number} ecl - Error-correction level used, 0-3.
 * @property {boolean[][]} modules - [row][col], true = dark.
 */

/**
 * Encode text as a QR symbol at exactly the requested error-correction
 * level (no automatic boost, so `error-correction` means what it says).
 * Picks the smallest version that fits and the best mask.
 *
 * @param {string} text
 * @param {number} [ecl=1] - 0-3 (L, M, Q, H).
 * @returns {QrMatrix}
 * @throws {RangeError} with `reason = 'capacity'` when the text does not fit
 *   in a version 40 symbol at this level.
 */
export function encodeQR(text, ecl = 1) {
  const level = ECC[ecl] ?? ECC[1];
  let qr;
  try {
    qr = QrCode.encodeSegments(QrSegment.makeSegments(text), level, 1, 40, -1, false);
  } catch (err) {
    const e = new RangeError(err instanceof Error ? err.message : String(err));
    /** @type {any} */ (e).reason = /too long/i.test(e.message) ? 'capacity' : 'encoding';
    throw e;
  }
  const modules = [];
  for (let y = 0; y < qr.size; y++) {
    const row = [];
    for (let x = 0; x < qr.size; x++) row.push(qr.getModule(x, y));
    modules.push(row);
  }
  return { version: qr.version, size: qr.size, ecl: ECC.indexOf(level), modules };
}

/**
 * Integer device-pixel geometry for drawing a symbol plus quiet zone into
 * a square box of `boxPx` device pixels. The module size is a whole number
 * of pixels; any remainder is split around the code as extra light margin.
 *
 * @param {number} symbolSize - Modules per side, without the quiet zone.
 * @param {number} boxPx - Target edge in device pixels.
 * @returns {{ cell: number, offset: number, edge: number }} cell size, the
 *   offset of the first module, and the canvas edge (>= boxPx only when the
 *   box is smaller than one pixel per module).
 */
export function layout(symbolSize, boxPx) {
  const total = symbolSize + QUIET_ZONE * 2;
  const cell = Math.max(1, Math.floor(boxPx / total));
  const edge = Math.max(boxPx, cell * total);
  const offset = Math.floor((edge - cell * symbolSize) / 2);
  return { cell, offset, edge };
}

/**
 * Relative luminance (WCAG) of an sRGB colour given as 0-255 channels.
 * @param {number[]} rgb
 * @returns {number}
 */
export function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Check a foreground/background pair for scanability.
 *
 * @param {number[]} fg - [r, g, b, a] 0-255 (alpha 0-1).
 * @param {number[]} bg - [r, g, b, a] 0-255 (alpha 0-1).
 * @returns {string[]} Human-readable problems; empty when the pair is fine.
 */
export function colorProblems(fg, bg) {
  const problems = [];
  if ((bg[3] ?? 1) < 1) problems.push('the background is not opaque, so the code takes on whatever is behind it');
  if ((fg[3] ?? 1) < 1) problems.push('the module colour is not opaque');
  const lf = luminance(fg);
  const lb = luminance(bg);
  if (lf > lb) problems.push('modules are lighter than the background (inverted codes are rejected by many scanners)');
  const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
  if (ratio < 4) problems.push(`contrast is ${ratio.toFixed(2)}:1 (aim for at least 4:1)`);
  return problems;
}
