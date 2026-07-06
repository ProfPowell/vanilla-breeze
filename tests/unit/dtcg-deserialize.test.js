/**
 * Unit tests for the DTCG deserializer used by <theme-import>.
 *
 * Pure function: takes a parsed DTCG object → returns
 * { tokens: [[name, value], …], ignored: [...], stats: {...} }
 *
 * Tests cover: reverse prefix mapping, color rebuild from components,
 * dimension rebuild with extension-preserved units, light-dark variant
 * folding, $extensions round-trip preference, foreign DTCG tolerance.
 *
 * Targets DTCG stable spec 2025.10.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { deserializeDTCG } from '../../src/lib/dtcg/dtcg-deserialize.js';

const VB_NS = 'com.vanilla-breeze';

const wrap = (tree) => ({
  ...tree,
  $extensions: { [VB_NS]: { spec: '2025.10' } },
});

describe('deserializeDTCG — top-level', () => {
  it('returns an empty token list for an empty document', () => {
    const out = deserializeDTCG({});
    assert.deepEqual(out.tokens, []);
    assert.deepEqual(out.ignored, []);
  });

  it('counts applied vs ignored', () => {
    const out = deserializeDTCG(wrap({
      color: { primary: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' } } },
      mystery: { unknown: { $value: 'x' } },
    }));
    assert.equal(out.stats.applied, 1);
    assert.equal(out.stats.ignored, 1);
  });
});

describe('deserializeDTCG — colors', () => {
  it('rebuilds an OKLCH color back to oklch() CSS', () => {
    const out = deserializeDTCG(wrap({
      color: {
        primary: {
          $type: 'color',
          $value: { colorSpace: 'oklch', components: [0.55, 0.22, 270] },
        },
      },
    }));
    const [name, value] = out.tokens[0];
    assert.equal(name, '--color-primary');
    assert.match(value, /^oklch\(/);
    assert.ok(value.includes('0.55'));
  });

  it('preserves alpha on OKLCH colors', () => {
    const out = deserializeDTCG(wrap({
      color: {
        overlay: {
          $type: 'color',
          $value: { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0.5 },
        },
      },
    }));
    const [, value] = out.tokens[0];
    assert.match(value, /\/\s*0?\.5/);
  });

  it('rebuilds an sRGB color preferring the hex string when present', () => {
    const out = deserializeDTCG(wrap({
      color: {
        brand: {
          $type: 'color',
          $value: {
            colorSpace: 'srgb',
            components: [0.85882, 0, 0.02745],
            hex: '#db0007',
          },
        },
      },
    }));
    const [, value] = out.tokens[0];
    assert.equal(value, '#db0007');
  });

  it('synthesizes hex when only sRGB components are provided', () => {
    const out = deserializeDTCG(wrap({
      color: {
        brand: {
          $type: 'color',
          $value: { colorSpace: 'srgb', components: [1, 0, 0] },
        },
      },
    }));
    const [, value] = out.tokens[0];
    assert.equal(value.toLowerCase(), '#ff0000');
  });

  it('prefers $extensions[com.vanilla-breeze].expression over $value (round-trip)', () => {
    const out = deserializeDTCG(wrap({
      color: {
        'primary-hover': {
          $type: 'color',
          $value: { colorSpace: 'srgb', components: [0, 0, 0] },
          $extensions: {
            [VB_NS]: { expression: 'oklch(from var(--color-primary) calc(l - 0.08) c h)' },
          },
        },
      },
    }));
    const [name, value] = out.tokens[0];
    assert.equal(name, '--color-primary-hover');
    assert.equal(value, 'oklch(from var(--color-primary) calc(l - 0.08) c h)');
  });
});

describe('deserializeDTCG — light-dark variants', () => {
  it('prefers the preserved light-dark literal when present', () => {
    const out = deserializeDTCG(wrap({
      color: {
        surface: {
          $root: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' } },
          light: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' } },
          dark:  { $type: 'color', $value: { colorSpace: 'srgb', components: [0.07, 0.07, 0.07], hex: '#111111' } },
          $extensions: { [VB_NS]: { lightDark: 'light-dark(#ffffff, #111111)' } },
        },
      },
    }));
    const [name, value] = out.tokens[0];
    assert.equal(name, '--color-surface');
    assert.equal(value, 'light-dark(#ffffff, #111111)');
  });

  it('folds light/dark variants back into light-dark() when no literal is present', () => {
    const out = deserializeDTCG(wrap({
      color: {
        surface: {
          light: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' } },
          dark:  { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' } },
        },
      },
    }));
    const [, value] = out.tokens[0];
    assert.equal(value, 'light-dark(#ffffff, #000000)');
  });
});

describe('deserializeDTCG — color seeds', () => {
  it('reverses color/seeds tokens back to top-level --hue-/--lightness-/--chroma-', () => {
    const out = deserializeDTCG(wrap({
      color: {
        seeds: {
          'hue-primary': { $type: 'number', $value: 260 },
          'lightness-primary': {
            $type: 'number', $value: 50,
            $extensions: { [VB_NS]: { unit: '%' } },
          },
          'chroma-primary': { $type: 'number', $value: 0.22 },
        },
      },
    }));
    const map = Object.fromEntries(out.tokens);
    assert.equal(map['--hue-primary'], '260');
    assert.equal(map['--lightness-primary'], '50%');
    assert.equal(map['--chroma-primary'], '0.22');
  });
});

describe('deserializeDTCG — typography', () => {
  it('reverses typography/family back to --font-*', () => {
    const out = deserializeDTCG(wrap({
      typography: {
        family: {
          sans: { $type: 'fontFamily', $value: ['Inter', 'system-ui', 'sans-serif'] },
        },
      },
    }));
    const [name, value] = out.tokens[0];
    assert.equal(name, '--font-sans');
    assert.equal(value, '"Inter", system-ui, sans-serif');
  });

  it('reverses typography/size back to --font-size-* with unit', () => {
    const out = deserializeDTCG(wrap({
      typography: {
        size: { md: { $type: 'dimension', $value: { value: 1, unit: 'rem' } } },
      },
    }));
    const [name, value] = out.tokens[0];
    assert.equal(name, '--font-size-md');
    assert.equal(value, '1rem');
  });

  it('honors $extensions unit hint when DTCG only allows px/rem', () => {
    const out = deserializeDTCG(wrap({
      typography: {
        letterSpacing: {
          tight: {
            $type: 'dimension',
            $value: { value: -0.025, unit: 'rem' },
            $extensions: { [VB_NS]: { unit: 'em' } },
          },
        },
      },
    }));
    const [, value] = out.tokens[0];
    assert.equal(value, '-0.025em');
  });

  it('reverses typography/weight back to --font-weight-* number', () => {
    const out = deserializeDTCG(wrap({
      typography: { weight: { bold: { $type: 'fontWeight', $value: 700 } } },
    }));
    const [name, value] = out.tokens[0];
    assert.equal(name, '--font-weight-bold');
    assert.equal(value, '700');
  });

  it('reverses typography/lineHeight back to --line-height-* number', () => {
    const out = deserializeDTCG(wrap({
      typography: { lineHeight: { normal: { $type: 'number', $value: 1.5 } } },
    }));
    assert.equal(out.tokens[0][0], '--line-height-normal');
    assert.equal(out.tokens[0][1], '1.5');
  });
});

describe('deserializeDTCG — composite typography unpacks to scalars', () => {
  it('expands a typography composite into family/size/weight/lineHeight scalars', () => {
    const out = deserializeDTCG(wrap({
      typography: {
        heading: {
          $type: 'typography',
          $value: {
            fontFamily: ['Inter', 'sans-serif'],
            fontSize: { value: 1.5, unit: 'rem' },
            fontWeight: 600,
            lineHeight: 1.2,
          },
        },
      },
    }));
    const map = Object.fromEntries(out.tokens);
    assert.equal(map['--font-heading'], '"Inter", sans-serif');
    assert.equal(map['--font-size-heading'], '1.5rem');
    assert.equal(map['--font-weight-heading'], '600');
    assert.equal(map['--line-height-heading'], '1.2');
  });
});

describe('deserializeDTCG — spacing, border, motion', () => {
  it('reverses spacing/* back to --size-*', () => {
    const out = deserializeDTCG(wrap({
      spacing: { m: { $type: 'dimension', $value: { value: 1, unit: 'rem' } } },
    }));
    assert.equal(out.tokens[0][0], '--size-m');
  });

  it('reverses border/radius/* and border/width/* correctly', () => {
    const out = deserializeDTCG(wrap({
      border: {
        radius: { m: { $type: 'dimension', $value: { value: 0.5, unit: 'rem' } } },
        width:  { thin: { $type: 'dimension', $value: { value: 1, unit: 'px' } } },
      },
    }));
    const map = Object.fromEntries(out.tokens);
    assert.equal(map['--radius-m'], '0.5rem');
    assert.equal(map['--border-width-thin'], '1px');
  });

  it('reverses motion/duration/* back to --duration-* with unit', () => {
    const out = deserializeDTCG(wrap({
      motion: { duration: {
        fast: { $type: 'duration', $value: { value: 150, unit: 'ms' } },
        slow: { $type: 'duration', $value: { value: 0.4, unit: 's' } },
      } },
    }));
    const map = Object.fromEntries(out.tokens);
    assert.equal(map['--duration-fast'], '150ms');
    assert.equal(map['--duration-slow'], '0.4s');
  });

  it('reverses motion/easing/* cubicBezier back to cubic-bezier()', () => {
    const out = deserializeDTCG(wrap({
      motion: { easing: { default: { $type: 'cubicBezier', $value: [0.2, 0, 0.1, 1] } } },
    }));
    const [, value] = out.tokens[0];
    assert.equal(value, 'cubic-bezier(0.2, 0, 0.1, 1)');
  });
});

describe('deserializeDTCG — shadows', () => {
  it('reverses a single-stop shadow back to CSS', () => {
    const out = deserializeDTCG(wrap({
      effect: {
        shadow: {
          sm: {
            $type: 'shadow',
            $value: {
              offsetX: { value: 0, unit: 'px' },
              offsetY: { value: 1, unit: 'px' },
              blur:    { value: 2, unit: 'px' },
              color:   { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.08 },
            },
          },
        },
      },
    }));
    const [name, value] = out.tokens[0];
    assert.equal(name, '--shadow-sm');
    assert.match(value, /^0px 1px 2px /);
  });

  it('reverses a multi-stop shadow array back to comma-separated CSS', () => {
    const out = deserializeDTCG(wrap({
      effect: {
        shadow: {
          md: {
            $type: 'shadow',
            $value: [
              { offsetX: { value: 0, unit: 'px' }, offsetY: { value: 4, unit: 'px' }, blur: { value: 6, unit: 'px' }, color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.12 } },
              { offsetX: { value: 0, unit: 'px' }, offsetY: { value: 2, unit: 'px' }, blur: { value: 4, unit: 'px' }, color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.08 } },
            ],
          },
        },
      },
    }));
    const [, value] = out.tokens[0];
    // Two stops should both be present (4px 6px and 2px 4px).
    assert.match(value, /4px 6px/);
    assert.match(value, /2px 4px/);
  });
});

describe('deserializeDTCG — aliases', () => {
  it('resolves a {curly.brace} alias to its target value', () => {
    const out = deserializeDTCG(wrap({
      color: {
        brand: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' } },
        primary: { $type: 'color', $value: '{color.brand}' },
      },
    }));
    const map = Object.fromEntries(out.tokens);
    assert.equal(map['--color-brand'], '#ff0000');
    // Aliases reference back through CSS var(...) — the cleanest cross-tool round-trip.
    assert.equal(map['--color-primary'], 'var(--color-brand)');
  });
});

describe('deserializeDTCG — group $type inheritance', () => {
  it('inherits $type from a group when tokens omit it', () => {
    const out = deserializeDTCG(wrap({
      color: {
        $type: 'color',
        primary: { $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' } },
      },
    }));
    const map = Object.fromEntries(out.tokens);
    assert.equal(map['--color-primary'], '#ff0000');
  });
});

describe('deserializeDTCG — foreign tolerance', () => {
  it('lists tokens it cannot map under .ignored', () => {
    const out = deserializeDTCG(wrap({
      branding: { logo: { $value: 'https://example.com/logo.svg' } },
    }));
    assert.equal(out.tokens.length, 0);
    assert.ok(out.ignored.length > 0, 'expected ignored entries');
    assert.match(out.ignored[0], /branding/);
  });

  it('does not throw on missing $extensions or unknown types', () => {
    const out = deserializeDTCG({
      color: { primary: { $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
    });
    assert.equal(out.tokens.length, 1);
  });
});
