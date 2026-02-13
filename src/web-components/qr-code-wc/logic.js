/**
 * qr-code-wc: QR code generator web component
 *
 * Generates a QR code from text content or a URL. Progressive enhancement:
 * the text content is visible before JS loads, then replaced with a QR code.
 *
 * @attr {string} data-value - The text/URL to encode (or uses textContent)
 * @attr {number} data-size - Canvas size in pixels (default: 200)
 * @attr {string} data-color - Foreground color (default: currentColor resolved)
 * @attr {string} data-background - Background color (default: transparent)
 * @attr {number} data-error-correction - Error correction level 0-3 (L/M/Q/H, default: 1/M)
 *
 * @example
 * <qr-code-wc data-value="https://example.com">https://example.com</qr-code-wc>
 */

class QrCodeWc extends HTMLElement {
  #canvas;

  connectedCallback() {
    const value = this.dataset.value || this.textContent.trim();
    if (!value) return;

    const size = parseInt(this.dataset.size, 10) || 200;
    const ecl = parseInt(this.dataset.errorCorrection, 10) || 1;

    this.#canvas = document.createElement('canvas');
    this.#canvas.width = size;
    this.#canvas.height = size;
    this.#canvas.setAttribute('role', 'img');
    this.#canvas.setAttribute('aria-label', `QR code: ${value}`);

    this.#render(value, size, ecl);
  }

  static get observedAttributes() {
    return ['data-value', 'data-size'];
  }

  attributeChangedCallback() {
    if (!this.#canvas) return;
    const value = this.dataset.value || this.textContent.trim();
    if (!value) return;
    const size = parseInt(this.dataset.size, 10) || 200;
    const ecl = parseInt(this.dataset.errorCorrection, 10) || 1;
    this.#canvas.width = size;
    this.#canvas.height = size;
    this.#canvas.setAttribute('aria-label', `QR code: ${value}`);
    this.#render(value, size, ecl);
  }

  #render(text, size, ecl) {
    const modules = generateQR(text, ecl);
    const ctx = this.#canvas.getContext('2d');
    const moduleCount = modules.length;
    const cellSize = size / moduleCount;

    // Resolve colors
    const style = getComputedStyle(this);
    const fg = this.dataset.color || style.color || '#000';
    const bg = this.dataset.background || 'transparent';

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Background
    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    }

    // Draw modules
    ctx.fillStyle = fg;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules[row][col]) {
          ctx.fillRect(
            Math.round(col * cellSize),
            Math.round(row * cellSize),
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          );
        }
      }
    }

    // Replace content with canvas
    this.textContent = '';
    this.appendChild(this.#canvas);
  }

  /** Get the QR code as a data URL */
  toDataURL(type = 'image/png') {
    return this.#canvas?.toDataURL(type) ?? '';
  }
}

// ==================== QR Code Generator ====================
// Minimal QR code encoder — supports byte mode, versions 1-10

const ECL_CODEWORDS = [
  // [total, ec] per version (1-10) for L, M, Q, H
  // L
  [[26,7],[44,10],[70,15],[100,20],[134,26],[172,18],[196,20],[242,24],[292,30],[346,18]],
  // M
  [[26,10],[44,16],[70,26],[100,18],[134,24],[172,16],[196,18],[242,22],[292,22],[346,26]],
  // Q
  [[26,13],[44,22],[70,18],[100,26],[134,18],[172,24],[196,18],[242,22],[292,20],[346,28]],
  // H
  [[26,17],[44,28],[70,22],[100,16],[134,22],[172,28],[196,26],[242,26],[292,24],[346,28]],
];

const ALIGNMENT_PATTERNS = [
  [], // v1 — none
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 52],
];

function generateQR(text, ecl = 1) {
  const data = new TextEncoder().encode(text);
  const version = selectVersion(data.length, ecl);
  const totalCodewords = ECL_CODEWORDS[ecl][version - 1][0];
  const ecCodewords = ECL_CODEWORDS[ecl][version - 1][1];
  const dataCodewords = totalCodewords - ecCodewords;

  // Encode data
  const bits = encodeData(data, version, dataCodewords);

  // Generate error correction
  const allCodewords = addErrorCorrection(bits, dataCodewords, ecCodewords);

  // Create matrix
  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => new Uint8Array(size));
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  // Place patterns
  placeFinders(matrix, reserved, size);
  placeAlignment(matrix, reserved, version);
  placeTiming(matrix, reserved, size);

  // Reserve format + version info areas
  reserveFormatArea(reserved, size);

  // Place data
  placeData(matrix, reserved, allCodewords, size);

  // Apply best mask
  const masked = applyBestMask(matrix, reserved, size, ecl);

  return masked;
}

function selectVersion(dataLen, ecl) {
  for (let v = 1; v <= 10; v++) {
    const total = ECL_CODEWORDS[ecl][v - 1][0];
    const ec = ECL_CODEWORDS[ecl][v - 1][1];
    const dataCap = total - ec;
    // Byte mode: 4 bits mode + char count bits + data + terminator
    const charCountBits = v <= 9 ? 8 : 16;
    const overhead = Math.ceil((4 + charCountBits) / 8);
    if (dataLen <= dataCap - overhead) return v;
  }
  return 10; // fallback, may truncate
}

function encodeData(data, version, dataCodewords) {
  const bits = [];
  const push = (val, len) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode indicator (byte mode = 0100)
  push(4, 4);

  // Character count
  const charCountBits = version <= 9 ? 8 : 16;
  push(data.length, charCountBits);

  // Data
  for (const byte of data) {
    push(byte, 8);
  }

  // Terminator (up to 4 zero bits)
  const maxBits = dataCodewords * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  push(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad codewords
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    push(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert to bytes
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
    bytes.push(byte);
  }

  return bytes;
}

function addErrorCorrection(dataBytes, dataCount, ecCount) {
  const generator = gfPolyGenerator(ecCount);
  const msgPoly = new Uint8Array(dataCount + ecCount);
  for (let i = 0; i < dataCount; i++) msgPoly[i] = dataBytes[i];

  for (let i = 0; i < dataCount; i++) {
    const coef = msgPoly[i];
    if (coef === 0) continue;
    const logCoef = GF_LOG[coef];
    for (let j = 0; j < generator.length; j++) {
      msgPoly[i + j] ^= GF_EXP[(logCoef + GF_LOG[generator[j]]) % 255];
    }
  }

  const result = [...dataBytes.slice(0, dataCount)];
  for (let i = 0; i < ecCount; i++) {
    result.push(msgPoly[dataCount + i]);
  }
  return result;
}

// GF(256) tables
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11D;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfPolyGenerator(degree) {
  let gen = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(gen.length + 1);
    const rootLog = i; // alpha^i
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= GF_EXP[(GF_LOG[gen[j]] + rootLog) % 255];
    }
    gen = next;
  }
  return gen;
}

function placeFinders(m, r, s) {
  const positions = [[0, 0], [s - 7, 0], [0, s - 7]];
  for (const [row, col] of positions) {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const on = dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
                   (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        m[row + dr][col + dc] = on ? 1 : 0;
        r[row + dr][col + dc] = 1;
      }
    }
    // Separators
    for (let i = -1; i <= 7; i++) {
      for (const [dr, dc] of [[i, -1], [i, 7], [-1, i], [7, i]]) {
        const rr = row + dr, cc = col + dc;
        if (rr >= 0 && rr < s && cc >= 0 && cc < s) {
          m[rr][cc] = 0;
          r[rr][cc] = 1;
        }
      }
    }
  }
}

function placeAlignment(m, r, version) {
  if (version < 2) return;
  const coords = ALIGNMENT_PATTERNS[version - 1];
  for (const row of coords) {
    for (const col of coords) {
      // Skip if overlapping with finder
      if (r[row][col]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const on = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          m[row + dr][col + dc] = on ? 1 : 0;
          r[row + dr][col + dc] = 1;
        }
      }
    }
  }
}

function placeTiming(m, r, s) {
  for (let i = 8; i < s - 8; i++) {
    const on = i % 2 === 0 ? 1 : 0;
    if (!r[6][i]) { m[6][i] = on; r[6][i] = 1; }
    if (!r[i][6]) { m[i][6] = on; r[i][6] = 1; }
  }
}

function reserveFormatArea(r, s) {
  // Format info near finders
  for (let i = 0; i <= 8; i++) {
    if (i < s) r[8][i] = 1;
    if (i < s) r[i][8] = 1;
  }
  for (let i = 0; i <= 7; i++) {
    r[8][s - 1 - i] = 1;
    r[s - 1 - i][8] = 1;
  }
  // Dark module
  r[s - 8][8] = 1;
}

function placeData(m, r, codewords, s) {
  const bits = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  }

  let bitIdx = 0;
  let upward = true;

  for (let right = s - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip timing column

    const rows = upward
      ? Array.from({ length: s }, (_, i) => s - 1 - i)
      : Array.from({ length: s }, (_, i) => i);

    for (const row of rows) {
      for (const col of [right, right - 1]) {
        if (col < 0 || col >= s) continue;
        if (r[row][col]) continue;
        m[row][col] = bitIdx < bits.length ? bits[bitIdx] : 0;
        bitIdx++;
      }
    }
    upward = !upward;
  }
}

const FORMAT_INFO = [
  0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976,
  0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0,
  0x355F, 0x3068, 0x3F31, 0x3A06, 0x24B4, 0x2183, 0x2EDA, 0x2BED,
  0x1689, 0x13BE, 0x1CE7, 0x19D0, 0x0762, 0x0255, 0x0D0C, 0x083B,
];

function getFormatInfo(ecl, mask) {
  const eclMap = [1, 0, 3, 2]; // L=01,M=00,Q=11,H=10
  const idx = eclMap[ecl] * 8 + mask;
  return FORMAT_INFO[idx];
}

const MASK_FNS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
  (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
];

function applyMask(matrix, reserved, size, maskIdx) {
  const result = matrix.map(row => new Uint8Array(row));
  const fn = MASK_FNS[maskIdx];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && fn(r, c)) {
        result[r][c] ^= 1;
      }
    }
  }
  return result;
}

function placeFormatInfo(m, size, ecl, mask) {
  const info = getFormatInfo(ecl, mask);

  // Place around top-left finder
  const positions1 = [
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
    [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = positions1[i];
    m[r][c] = (info >> (14 - i)) & 1;
  }

  // Place around bottom-left and top-right finders
  const positions2 = [
    [8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4],
    [8, size - 5], [8, size - 6], [8, size - 7], [8, size - 8],
    [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8],
    [size - 3, 8], [size - 2, 8], [size - 1, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = positions2[i];
    m[r][c] = (info >> (14 - i)) & 1;
  }

  // Dark module
  m[size - 8][8] = 1;
}

function scoreMask(m, s) {
  let score = 0;

  // Rule 1: runs of same color
  for (let r = 0; r < s; r++) {
    let run = 1;
    for (let c = 1; c < s; c++) {
      if (m[r][c] === m[r][c - 1]) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else {
        run = 1;
      }
    }
  }
  for (let c = 0; c < s; c++) {
    let run = 1;
    for (let r = 1; r < s; r++) {
      if (m[r][c] === m[r - 1][c]) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else {
        run = 1;
      }
    }
  }

  // Rule 2: 2x2 blocks
  for (let r = 0; r < s - 1; r++) {
    for (let c = 0; c < s - 1; c++) {
      const val = m[r][c];
      if (val === m[r][c + 1] && val === m[r + 1][c] && val === m[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  return score;
}

function applyBestMask(matrix, reserved, size, ecl) {
  let bestScore = Infinity;
  let bestResult = null;

  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(matrix, reserved, size, mask);
    placeFormatInfo(masked, size, ecl, mask);
    const score = scoreMask(masked, size);
    if (score < bestScore) {
      bestScore = score;
      bestResult = masked;
    }
  }

  return bestResult;
}

customElements.define('qr-code-wc', QrCodeWc);

export { QrCodeWc };
