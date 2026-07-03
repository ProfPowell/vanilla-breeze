/**
 * Unit tests for the DTCG serializer used by <theme-export format="dtcg">.
 *
 * The serializer is a pure function over `Array<[name, value]>` entries.
 * No DOM. Tests cover prefix → group mapping, type inference, color/dimension/
 * duration/cubic-bezier/shadow parsing, light-dark variant emission, and
 * extension-based round-trip preservation for VB-specific syntax.
 *
 * Targets DTCG stable spec 2025.10.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { serializeDTCG } from '../../src/lib/dtcg/dtcg-serialize.js';

const VB_NS = 'com.vanilla-breeze';

describe('serializeDTCG — top-level metadata', () => {
  it('emits a $extensions block with VB metadata + spec version', () => {
    const out = serializeDTCG([], { vbVersion: '0.99.0' });
    const ext = out.$extensions[VB_NS];
    assert.equal(out.$extensions[VB_NS].spec, '2025.10');
    assert.equal(ext.vbVersion, '0.99.0');
  });

  it('omits vbVersion field when not provided', () => {
    const out = serializeDTCG([]);
    assert.equal(out.$extensions[VB_NS].vbVersion, undefined);
  });

  it('flags seedDerivation when seed tokens (--hue-, --lightness-, --chroma-) are present', () => {
    const out = serializeDTCG([['--hue-primary', '260']]);
    assert.equal(out.$extensions[VB_NS].seedDerivation, true);
  });

  it('returns an empty token tree for an empty input', () => {
    const out = serializeDTCG([]);
    assert.equal(Object.keys(out).filter(k => !k.startsWith('$')).length, 0);
  });
});

describe('serializeDTCG — color tokens', () => {
  it('parses an OKLCH literal into structured DTCG color', () => {
    const out = serializeDTCG([['--color-primary', 'oklch(55% 0.22 270)']]);
    const tok = out.color.primary;
    assert.equal(tok.$type, 'color');
    assert.equal(tok.$value.colorSpace, 'oklch');
    assert.deepEqual(tok.$value.components, [0.55, 0.22, 270]);
    assert.equal(tok.$value.alpha, undefined);
  });

  it('captures alpha from oklch(L C H / A)', () => {
    const out = serializeDTCG([['--color-overlay', 'oklch(0% 0 0 / 0.5)']]);
    assert.equal(out.color.overlay.$value.alpha, 0.5);
  });

  it('parses hex colors as srgb', () => {
    const out = serializeDTCG([['--color-brand', '#DB0007']]);
    const tok = out.color.brand;
    assert.equal(tok.$value.colorSpace, 'srgb');
    assert.deepEqual(
      tok.$value.components.map(n => Math.round(n * 255)),
      [0xDB, 0x00, 0x07],
    );
    assert.equal(tok.$value.hex.toLowerCase(), '#db0007');
  });

  it('parses 3-digit hex shorthand', () => {
    const out = serializeDTCG([['--color-brand', '#f00']]);
    assert.deepEqual(
      out.color.brand.$value.components.map(n => Math.round(n * 255)),
      [255, 0, 0],
    );
  });

  it('parses rgb()/rgba() literals', () => {
    const out = serializeDTCG([
      ['--color-rgb', 'rgb(255, 128, 0)'],
      ['--color-rgba', 'rgba(255, 128, 0, 0.25)'],
    ]);
    assert.deepEqual(
      out.color.rgb.$value.components.map(n => Math.round(n * 255)),
      [255, 128, 0],
    );
    assert.equal(out.color.rgba.$value.alpha, 0.25);
  });

  it('preserves an unparseable color literal in $extensions', () => {
    const out = serializeDTCG([['--color-weird', 'color(display-p3 1 0 0)']]);
    const tok = out.color.weird;
    assert.equal(tok.$extensions[VB_NS].literal, 'color(display-p3 1 0 0)');
  });
});

describe('serializeDTCG — color seeds', () => {
  it('routes --hue/--lightness/--chroma to color/seeds/*', () => {
    const out = serializeDTCG([
      ['--hue-primary', '260'],
      ['--lightness-primary', '50%'],
      ['--chroma-primary', '0.22'],
    ]);
    assert.equal(out.color.seeds['hue-primary'].$type, 'number');
    assert.equal(out.color.seeds['hue-primary'].$value, 260);
    assert.equal(out.color.seeds['lightness-primary'].$value, 50);
    assert.equal(
      out.color.seeds['lightness-primary'].$extensions[VB_NS].unit,
      '%',
    );
    assert.equal(out.color.seeds['chroma-primary'].$value, 0.22);
  });
});

describe('serializeDTCG — typography', () => {
  it('emits font-family as DTCG fontFamily array', () => {
    const out = serializeDTCG([
      ['--font-sans', '"Inter", system-ui, -apple-system, sans-serif'],
    ]);
    const tok = out.typography.family.sans;
    assert.equal(tok.$type, 'fontFamily');
    assert.deepEqual(tok.$value, ['Inter', 'system-ui', '-apple-system', 'sans-serif']);
  });

  it('emits font sizes as DTCG dimensions', () => {
    const out = serializeDTCG([
      ['--font-size-md', '1rem'],
      ['--font-size-xs', '0.75rem'],
    ]);
    assert.deepEqual(out.typography.size.md.$value, { value: 1, unit: 'rem' });
    assert.equal(out.typography.size.md.$type, 'dimension');
    assert.deepEqual(out.typography.size.xs.$value, { value: 0.75, unit: 'rem' });
  });

  it('emits font weights as DTCG fontWeight numbers', () => {
    const out = serializeDTCG([['--font-weight-bold', '700']]);
    const tok = out.typography.weight.bold;
    assert.equal(tok.$type, 'fontWeight');
    assert.equal(tok.$value, 700);
  });

  it('emits unitless line heights as DTCG number', () => {
    const out = serializeDTCG([['--line-height-normal', '1.5']]);
    const tok = out.typography.lineHeight.normal;
    assert.equal(tok.$type, 'number');
    assert.equal(tok.$value, 1.5);
  });

  it('emits em-based letter-spacing with the em unit preserved in $extensions', () => {
    const out = serializeDTCG([['--letter-spacing-tight', '-0.025em']]);
    const tok = out.typography.letterSpacing.tight;
    assert.equal(tok.$type, 'dimension');
    // DTCG only specs px and rem; em is a VB extension.
    assert.equal(tok.$extensions[VB_NS].unit, 'em');
    assert.equal(tok.$value.value, -0.025);
  });
});

describe('serializeDTCG — spacing, border, motion', () => {
  it('routes --size-* to spacing/*', () => {
    const out = serializeDTCG([['--size-m', '1rem']]);
    const tok = out.spacing.m;
    assert.equal(tok.$type, 'dimension');
    assert.deepEqual(tok.$value, { value: 1, unit: 'rem' });
  });

  it('routes --radius-* to border/radius/*', () => {
    const out = serializeDTCG([['--radius-m', '0.5rem']]);
    assert.equal(out.border.radius.m.$type, 'dimension');
  });

  it('routes --border-width-* to border/width/*', () => {
    const out = serializeDTCG([['--border-width-thin', '1px']]);
    const tok = out.border.width.thin;
    assert.deepEqual(tok.$value, { value: 1, unit: 'px' });
  });

  it('routes --duration-* to motion/duration/*', () => {
    const out = serializeDTCG([['--duration-fast', '150ms']]);
    const tok = out.motion.duration.fast;
    assert.equal(tok.$type, 'duration');
    assert.deepEqual(tok.$value, { value: 150, unit: 'ms' });
  });

  it('parses second-based durations', () => {
    const out = serializeDTCG([['--duration-slow', '0.4s']]);
    assert.deepEqual(out.motion.duration.slow.$value, { value: 0.4, unit: 's' });
  });

  it('parses cubic-bezier easing into DTCG cubicBezier array', () => {
    const out = serializeDTCG([
      ['--ease-default', 'cubic-bezier(0.2, 0, 0.1, 1)'],
    ]);
    const tok = out.motion.easing.default;
    assert.equal(tok.$type, 'cubicBezier');
    assert.deepEqual(tok.$value, [0.2, 0, 0.1, 1]);
  });
});

describe('serializeDTCG — shadows', () => {
  it('parses a single-stop shadow into DTCG shadow object', () => {
    const out = serializeDTCG([
      ['--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.08)'],
    ]);
    const tok = out.effect.shadow.sm;
    assert.equal(tok.$type, 'shadow');
    assert.deepEqual(tok.$value.offsetX, { value: 0, unit: 'px' });
    assert.deepEqual(tok.$value.offsetY, { value: 1, unit: 'px' });
    assert.deepEqual(tok.$value.blur, { value: 2, unit: 'px' });
    assert.equal(tok.$value.color.colorSpace, 'srgb');
    assert.equal(tok.$value.color.alpha, 0.08);
  });

  it('parses multi-stop shadows into a DTCG shadow array', () => {
    const out = serializeDTCG([
      ['--shadow-md', '0 4px 6px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)'],
    ]);
    const tok = out.effect.shadow.md;
    assert.ok(Array.isArray(tok.$value));
    assert.equal(tok.$value.length, 2);
  });

  it('falls back to literal under $extensions when a shadow cannot be parsed', () => {
    const out = serializeDTCG([
      ['--shadow-weird', 'inset 0 0 0 9999px var(--color-overlay)'],
    ]);
    const tok = out.effect.shadow.weird;
    assert.equal(tok.$extensions[VB_NS].literal, 'inset 0 0 0 9999px var(--color-overlay)');
  });
});

describe('serializeDTCG — light-dark variants', () => {
  it('emits $root + light + dark for a light-dark() value', () => {
    const out = serializeDTCG([
      ['--color-surface', 'light-dark(#ffffff, #111111)'],
    ]);
    const tok = out.color.surface;
    // Per stable spec: $root holds the base, light/dark hold the variants.
    assert.ok(tok.$root, 'expected $root');
    assert.ok(tok.light && tok.dark, 'expected light and dark variants');
    assert.equal(tok.light.$value.hex.toLowerCase(), '#ffffff');
    assert.equal(tok.dark.$value.hex.toLowerCase(), '#111111');
  });

  it('preserves the original light-dark() literal under $extensions', () => {
    const out = serializeDTCG([
      ['--color-surface', 'light-dark(#ffffff, #111111)'],
    ]);
    assert.equal(
      out.color.surface.$extensions[VB_NS].lightDark,
      'light-dark(#ffffff, #111111)',
    );
  });
});

describe('serializeDTCG — relative-color expressions', () => {
  it('preserves an oklch(from …) expression under $extensions when value is opaque', () => {
    const out = serializeDTCG([
      ['--color-primary-hover', 'oklch(from var(--color-primary) calc(l - 0.08) c h)'],
    ]);
    const tok = out.color['primary-hover'];
    assert.equal(
      tok.$extensions[VB_NS].expression,
      'oklch(from var(--color-primary) calc(l - 0.08) c h)',
    );
  });
});

describe('serializeDTCG — unknown prefixes', () => {
  it('drops tokens that match no known prefix and reports them under $extensions.unmapped', () => {
    const out = serializeDTCG([
      ['--color-primary', '#dd0007'],
      ['--mystery-token', 'value'],
    ]);
    assert.ok(out.color.primary, 'known prefix is mapped');
    assert.deepEqual(
      out.$extensions[VB_NS].unmapped,
      ['--mystery-token'],
      'unmapped tokens are listed',
    );
  });
});
