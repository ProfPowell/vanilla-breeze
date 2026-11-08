/**
 * <qr-code> must draw codes a real decoder reads. The previous hand-rolled
 * encoder shipped unscannable output for every input because nothing
 * checked this; now each matrix the component would draw is rasterised
 * (quiet zone included, same layout() as the canvas) and decoded by jsQR.
 *
 * Also keeps the vendored qrcodegen honest: the .ts is the pinned upstream
 * file and the .js is exactly what scripts/vendor-qrcodegen.mjs produces.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import jsQRModule from 'jsqr';
import { encodeQR, parseErrorCorrection, layout, colorProblems, QUIET_ZONE, BYTE_CAPACITY, EC_LEVELS } from '../../src/web-components/qr-code/encode.js';
import { COMMIT, SHA256, TS_PATH, JS_PATH, toModule } from '../../scripts/vendor-qrcodegen.mjs';

/** jsqr is CommonJS; its typings don't describe the default-import interop. */
const jsQR = /** @type {any} */ (jsQRModule);

/** Rasterise a matrix the way logic.js draws it: white box, black modules. */
function rasterise(qr, boxPx) {
  const { cell, offset, edge } = layout(qr.size, boxPx);
  const data = new Uint8ClampedArray(edge * edge * 4).fill(255);
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.modules[y][x]) continue;
      for (let py = 0; py < cell; py++) {
        for (let px = 0; px < cell; px++) {
          const i = ((offset + y * cell + py) * edge + offset + x * cell + px) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
  }
  return { data, edge };
}

function decode(text, ecl) {
  const qr = encodeQR(text, ecl);
  const { data, edge } = rasterise(qr, (qr.size + QUIET_ZONE * 2) * 4);
  const res = jsQR(data, edge, edge, { inversionAttempts: 'dontInvert' });
  return { qr, res };
}

const ascii = (n) => 'https://example.com/path?q=' + 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(20).slice(0, Math.max(0, n - 27));
const utf8 = (n) => {
  const unit = 'Grüße, 東京 — ñandú 🎉 ';
  let s = '';
  while (new TextEncoder().encode(s + unit).length <= n) s += unit;
  return s || unit;
};
const lengths = { short: 20, medium: 130, long: 420 };

for (const [ecl, letter] of EC_LEVELS.entries()) {
  for (const [label, n] of Object.entries(lengths)) {
    for (const [script, make] of Object.entries({ ascii, 'utf-8': utf8 })) {
      const text = make(n);
      test(`round-trips ${letter} / ${label} / ${script}`, () => {
        const { qr, res } = decode(text, ecl);
        assert.equal(qr.ecl, ecl, 'encoded at the requested level, not boosted');
        assert.ok(res, `jsQR could not find a code (version ${qr.version})`);
        assert.equal(res.data, text);
      });
    }
  }
}

test('the matrix covers multi-block versions and version 7+ (version info)', () => {
  const versions = new Set();
  for (const ecl of [0, 1, 2, 3]) {
    for (const n of Object.values(lengths)) versions.add(encodeQR(ascii(n), ecl).version);
  }
  assert.ok([...versions].some((v) => v >= 7), `expected a version >= 7, got ${[...versions]}`);
  assert.ok([...versions].some((v) => v >= 3 && v <= 6), 'expected a mid version');
  // M from v4, Q/H from v3 split into several RS blocks; v1/v2 are single-block.
  assert.ok(encodeQR(ascii(130), 2).version >= 3);
});

test('numeric and alphanumeric segments round-trip', () => {
  for (const text of ['0123456789012345678901234567890', 'HELLO WORLD $%*+-./:']) {
    const { res } = decode(text, 1);
    assert.equal(res?.data, text);
  }
});

test('documented byte capacity fits exactly; one byte more is a capacity error', () => {
  for (const [ecl, letter] of EC_LEVELS.entries()) {
    const max = BYTE_CAPACITY[letter];
    const fits = encodeQR('é'.repeat(Math.floor(max / 2)) + (max % 2 ? 'a' : ''), ecl);
    assert.equal(fits.version, 40);
    assert.throws(() => encodeQR('a'.repeat(max + 1), ecl), (err) => /** @type {any} */ (err).reason === 'capacity');
  }
});

test('parseErrorCorrection accepts 0-3 and L/M/Q/H, defaults to M, rejects the rest', () => {
  assert.equal(parseErrorCorrection(null), 1);
  assert.equal(parseErrorCorrection(''), 1);
  assert.equal(parseErrorCorrection('0'), 0);
  assert.equal(parseErrorCorrection('3'), 3);
  assert.equal(parseErrorCorrection('l'), 0);
  assert.equal(parseErrorCorrection(' Q '), 2);
  assert.equal(parseErrorCorrection('H'), 3);
  assert.equal(parseErrorCorrection('4'), null);
  assert.equal(parseErrorCorrection('-1'), null);
  assert.equal(parseErrorCorrection('high'), null);
});

test('layout uses whole-pixel modules and keeps at least a 4-module quiet zone', () => {
  for (const [n, box] of [[21, 200], [29, 200], [57, 300], [21, 10], [177, 400]]) {
    const { cell, offset, edge } = layout(n, box);
    assert.ok(Number.isInteger(cell) && cell >= 1);
    assert.ok(offset >= QUIET_ZONE * cell, `${n}@${box}: offset ${offset} < ${QUIET_ZONE * cell}`);
    assert.ok(edge - offset - n * cell >= QUIET_ZONE * cell);
    assert.equal(edge, Math.max(box, cell * (n + QUIET_ZONE * 2)));
  }
});

test('colorProblems flags inverted, low-contrast and translucent pairs only', () => {
  assert.deepEqual(colorProblems([0, 0, 0, 1], [255, 255, 255, 1]), []);
  assert.deepEqual(colorProblems([0, 102, 204, 1], [240, 248, 255, 1]), []);
  assert.ok(colorProblems([255, 255, 255, 1], [0, 0, 0, 1]).some((p) => /lighter/.test(p)));
  assert.ok(colorProblems([120, 120, 120, 1], [160, 160, 160, 1]).some((p) => /contrast/.test(p)));
  assert.ok(colorProblems([0, 0, 0, 1], [0, 0, 0, 0]).some((p) => /opaque/.test(p)));
});

test(`vendored qrcodegen.ts is upstream ${COMMIT.slice(0, 7)} verbatim`, () => {
  const ts = readFileSync(TS_PATH, 'utf8');
  assert.equal(createHash('sha256').update(ts).digest('hex'), SHA256);
  assert.match(ts, /Copyright \(c\) Project Nayuki\. \(MIT License\)/);
});

test('vendored qrcodegen.js matches the vendor script output', () => {
  assert.equal(readFileSync(JS_PATH, 'utf8'), toModule(readFileSync(TS_PATH, 'utf8')),
    'src/vendor/qrcodegen/qrcodegen.js drifted — run: npm run vendor:qrcodegen');
});
