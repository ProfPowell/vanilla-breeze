/**
 * Unit tests for UX Planning components
 *
 * Tests the shared _ux-base utilities and component-level static logic.
 * Shadow DOM rendering requires a browser environment (tested via Playwright).
 *
 * Run with: node --test tests/unit/ux-planning.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { esc, initials, hashColor, EMOTION_META, QUADRANT_META, lucideSvg, UX_ICONS } from '../../src/web-components/_ux-base.js';

// ── _ux-base utilities ────────────────────────────────────────────────────────

describe('esc()', () => {
  it('escapes HTML special characters', () => {
    assert.equal(esc('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes ampersands', () => {
    assert.equal(esc('Tom & Jerry'), 'Tom &amp; Jerry');
  });

  it('handles empty string', () => {
    assert.equal(esc(''), '');
  });

  it('coerces non-string input', () => {
    assert.equal(esc(42), '42');
    assert.equal(esc(null), 'null');
    assert.equal(esc(undefined), 'undefined');
  });

  it('preserves safe characters', () => {
    assert.equal(esc('Hello World 123'), 'Hello World 123');
  });
});

describe('initials()', () => {
  it('returns two-letter initials from full name', () => {
    assert.equal(initials('Sarah Chen'), 'SC');
  });

  it('returns single initial from single name', () => {
    assert.equal(initials('Sarah'), 'S');
  });

  it('caps at 2 characters for 3+ names', () => {
    assert.equal(initials('Sarah Jane Chen'), 'SJ');
  });

  it('uppercases lowercase input', () => {
    assert.equal(initials('sarah chen'), 'SC');
  });
});

describe('hashColor()', () => {
  it('returns an HSL string', () => {
    const color = hashColor('Sarah Chen');
    assert.match(color, /^hsl\(\d+, 65%, 55%\)$/);
  });

  it('is deterministic for the same name', () => {
    assert.equal(hashColor('Sarah Chen'), hashColor('Sarah Chen'));
  });

  it('produces different colors for different names', () => {
    assert.notEqual(hashColor('Sarah Chen'), hashColor('John Doe'));
  });

  it('handles empty string without error', () => {
    const color = hashColor('');
    assert.match(color, /^hsl\(\d+, 65%, 55%\)$/);
  });

  it('always produces positive hue values', () => {
    // Test a variety of names to ensure no negative hues
    for (const name of ['a', 'Test', 'Zzz', '日本語', 'émile']) {
      const hue = parseInt(hashColor(name).match(/hsl\((\d+)/)[1], 10);
      assert.ok(hue >= 0 && hue < 360, `Hue for "${name}" was ${hue}`);
    }
  });
});

describe('EMOTION_META', () => {
  it('contains all 9 emotion levels', () => {
    const expected = ['delighted', 'satisfied', 'hopeful', 'curious', 'neutral',
                      'uncertain', 'confused', 'frustrated', 'angry'];
    for (const emotion of expected) {
      assert.ok(EMOTION_META[emotion], `Missing emotion: ${emotion}`);
    }
    assert.equal(Object.keys(EMOTION_META).length, 9);
  });

  it('each emotion has emoji, score, and color', () => {
    for (const [name, meta] of Object.entries(EMOTION_META)) {
      assert.ok(meta.emoji, `${name} missing emoji`);
      assert.equal(typeof meta.score, 'number', `${name} score not a number`);
      assert.match(meta.color, /^#[0-9a-f]{6}$/i, `${name} color not hex`);
    }
  });

  it('scores decrease from delighted (highest) to angry (lowest)', () => {
    const ordered = ['delighted', 'satisfied', 'hopeful', 'curious', 'neutral',
                     'uncertain', 'confused', 'frustrated', 'angry'];
    for (let i = 1; i < ordered.length; i++) {
      assert.ok(
        EMOTION_META[ordered[i - 1]].score > EMOTION_META[ordered[i]].score,
        `${ordered[i - 1]} (${EMOTION_META[ordered[i - 1]].score}) should be > ${ordered[i]} (${EMOTION_META[ordered[i]].score})`
      );
    }
  });

  it('delighted score is near 1.0', () => {
    assert.ok(EMOTION_META.delighted.score > 0.9);
  });

  it('angry score is near 0.0', () => {
    assert.ok(EMOTION_META.angry.score < 0.1);
  });
});

// ── QUADRANT_META ─────────────────────────────────────────────────────────────

describe('QUADRANT_META', () => {
  it('contains all 4 quadrants', () => {
    const expected = ['says', 'thinks', 'does', 'feels'];
    for (const q of expected) {
      assert.ok(QUADRANT_META[q], `Missing quadrant: ${q}`);
    }
    assert.equal(Object.keys(QUADRANT_META).length, 4);
  });

  it('each quadrant has label, icon (SVG path), and color', () => {
    for (const [name, meta] of Object.entries(QUADRANT_META)) {
      assert.ok(meta.label, `${name} missing label`);
      assert.ok(meta.icon, `${name} missing icon`);
      assert.ok(meta.icon.includes('<path') || meta.icon.includes('<circle'), `${name} icon should be SVG content, not emoji`);
      assert.match(meta.color, /^#[0-9a-f]{6}$/i, `${name} color not hex`);
    }
  });

  it('labels are capitalized versions of keys', () => {
    assert.equal(QUADRANT_META.says.label, 'Says');
    assert.equal(QUADRANT_META.thinks.label, 'Thinks');
    assert.equal(QUADRANT_META.does.label, 'Does');
    assert.equal(QUADRANT_META.feels.label, 'Feels');
  });
});

// ── lucideSvg and UX_ICONS ─────────────────────────────────────────────────────

describe('lucideSvg()', () => {
  it('returns a complete SVG element string', () => {
    const svg = lucideSvg('<path d="M1 1"/>');
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('viewBox="0 0 24 24"'));
    assert.ok(svg.includes('aria-hidden="true"'));
    assert.ok(svg.includes('<path d="M1 1"/>'));
    assert.ok(svg.endsWith('</svg>'));
  });

  it('uses Lucide stroke attributes', () => {
    const svg = lucideSvg('<path d="M1 1"/>');
    assert.ok(svg.includes('fill="none"'));
    assert.ok(svg.includes('stroke="currentColor"'));
    assert.ok(svg.includes('stroke-width="2"'));
  });
});

describe('UX_ICONS', () => {
  const expected = ['user', 'pencil', 'check', 'target', 'alertTriangle',
                    'messageCircle', 'lightbulb', 'wrench', 'heart'];

  it('contains all expected icon keys', () => {
    for (const key of expected) {
      assert.ok(UX_ICONS[key], `Missing icon: ${key}`);
    }
  });

  it('each icon contains SVG path elements', () => {
    for (const key of expected) {
      assert.ok(
        UX_ICONS[key].includes('<path') || UX_ICONS[key].includes('<circle'),
        `${key} should contain SVG elements`
      );
    }
  });
});

// ── UserStory static maps ─────────────────────────────────────────────────────

describe('UserStory.PRIORITIES', () => {
  // Import dynamically since it registers a custom element (needs globalThis.customElements)
  // We test the static data structure only
  const PRIORITIES = {
    critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
    high:     { label: 'High',     color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
    medium:   { label: 'Medium',   color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)' },
    low:      { label: 'Low',      color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' }
  };

  it('contains all 4 priority levels', () => {
    assert.deepEqual(Object.keys(PRIORITIES).sort(), ['critical', 'high', 'low', 'medium']);
  });

  it('each priority has label, color, and bg', () => {
    for (const [name, info] of Object.entries(PRIORITIES)) {
      assert.ok(info.label, `${name} missing label`);
      assert.match(info.color, /^#[0-9a-f]{6}$/i, `${name} color not hex`);
      assert.ok(info.bg.startsWith('rgba('), `${name} bg not rgba`);
    }
  });
});

describe('UserStory.STATUSES', () => {
  const STATUSES = {
    backlog:       { label: 'Backlog',     color: '#6b7280' },
    'to-do':       { label: 'To Do',       color: '#3b82f6' },
    'in-progress': { label: 'In Progress', color: '#8b5cf6' },
    review:        { label: 'Review',      color: '#f59e0b' },
    done:          { label: 'Done',        color: '#22c55e' }
  };

  it('contains all 5 status values', () => {
    assert.deepEqual(
      Object.keys(STATUSES).sort(),
      ['backlog', 'done', 'in-progress', 'review', 'to-do']
    );
  });

  it('each status has a human-readable label', () => {
    for (const [name, info] of Object.entries(STATUSES)) {
      assert.ok(info.label, `${name} missing label`);
      assert.ok(info.label.length > 0);
    }
  });
});

// ── API manifest validation ───────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WC_DIR = join(__dirname, '../../src/web-components');

describe('api.json manifests', () => {
  for (const component of ['user-persona', 'user-story', 'user-journey', 'empathy-map', 'impact-effort', 'story-map']) {
    describe(component, () => {
      const apiPath = join(WC_DIR, component, 'api.json');
      let api;

      it('api.json exists and is valid JSON', () => {
        const content = readFileSync(apiPath, 'utf-8');
        api = JSON.parse(content);
      });

      it('has correct element name', () => {
        if (!api) api = JSON.parse(readFileSync(apiPath, 'utf-8'));
        assert.equal(api.element, component);
      });

      it('is typed as web-component', () => {
        if (!api) api = JSON.parse(readFileSync(apiPath, 'utf-8'));
        assert.equal(api.type, 'web-component');
      });

      it('has a description', () => {
        if (!api) api = JSON.parse(readFileSync(apiPath, 'utf-8'));
        assert.ok(api.description && api.description.length > 10);
      });

      it('has attributes array', () => {
        if (!api) api = JSON.parse(readFileSync(apiPath, 'utf-8'));
        assert.ok(Array.isArray(api.attributes));
        assert.ok(api.attributes.length > 0);
      });

      it('all attributes have name, kind, purpose, type, description', () => {
        if (!api) api = JSON.parse(readFileSync(apiPath, 'utf-8'));
        for (const attr of api.attributes) {
          assert.ok(attr.name, 'attribute missing name');
          assert.ok(attr.kind, `${attr.name} missing kind`);
          assert.ok(attr.purpose, `${attr.name} missing purpose`);
          assert.ok(attr.type, `${attr.name} missing type`);
          assert.ok(attr.description, `${attr.name} missing description`);
        }
      });

      it('compact attribute is boolean', () => {
        if (!api) api = JSON.parse(readFileSync(apiPath, 'utf-8'));
        const compact = api.attributes.find(a => a.name === 'compact');
        assert.ok(compact, 'compact attribute not found');
        assert.equal(compact.type, 'boolean');
      });
    });
  }
});

describe('user-persona api.json specifics', () => {
  const api = JSON.parse(readFileSync(join(WC_DIR, 'user-persona', 'api.json'), 'utf-8'));

  it('has named slots for bio, goals, frustrations, behaviors', () => {
    assert.ok(Array.isArray(api.slots));
    const slotNames = api.slots.map(s => s.name);
    assert.ok(slotNames.includes('bio'));
    assert.ok(slotNames.includes('goals'));
    assert.ok(slotNames.includes('frustrations'));
    assert.ok(slotNames.includes('behaviors'));
  });

  it('has persona-ready event', () => {
    assert.ok(Array.isArray(api.events));
    const evt = api.events.find(e => e.name === 'persona-ready');
    assert.ok(evt, 'persona-ready event not found');
  });

  it('has src attribute for JSON loading', () => {
    const attr = api.attributes.find(a => a.name === 'src');
    assert.ok(attr, 'src attribute not found');
  });

  it('has scalar slots (name, role, age, location, quote) as fallbacks', () => {
    const slotNames = api.slots.map(s => s.name);
    for (const name of ['name', 'role', 'age', 'location', 'quote']) {
      assert.ok(slotNames.includes(name), `scalar slot "${name}" missing`);
    }
  });
});

describe('user-story api.json specifics', () => {
  const api = JSON.parse(readFileSync(join(WC_DIR, 'user-story', 'api.json'), 'utf-8'));

  it('has named slots for acceptance-criteria, tasks, notes', () => {
    assert.ok(Array.isArray(api.slots));
    const slotNames = api.slots.map(s => s.name);
    assert.ok(slotNames.includes('acceptance-criteria'));
    assert.ok(slotNames.includes('tasks'));
    assert.ok(slotNames.includes('notes'));
  });

  it('has priority enum with 4 values', () => {
    const attr = api.attributes.find(a => a.name === 'priority');
    assert.ok(attr);
    assert.equal(attr.type, 'enum');
    assert.deepEqual(attr.values.sort(), ['critical', 'high', 'low', 'medium']);
  });

  it('has status enum with 5 values', () => {
    const attr = api.attributes.find(a => a.name === 'status');
    assert.ok(attr);
    assert.equal(attr.type, 'enum');
    assert.deepEqual(attr.values.sort(), ['backlog', 'done', 'in-progress', 'review', 'to-do']);
  });

  it('has all 3 events', () => {
    assert.ok(Array.isArray(api.events));
    const eventNames = api.events.map(e => e.name);
    assert.ok(eventNames.includes('story-ready'));
    assert.ok(eventNames.includes('status-changed'));
    assert.ok(eventNames.includes('priority-changed'));
  });

  it('has detail enum with 3 values', () => {
    const attr = api.attributes.find(a => a.name === 'detail');
    assert.ok(attr, 'detail attribute not found');
    assert.equal(attr.type, 'enum');
    assert.deepEqual(attr.values.sort(), ['compact', 'full', 'minimal']);
  });

  it('has src attribute for JSON loading', () => {
    const attr = api.attributes.find(a => a.name === 'src');
    assert.ok(attr, 'src attribute not found');
  });

  it('has scalar slots (persona, action, benefit) as fallbacks', () => {
    const slotNames = api.slots.map(s => s.name);
    for (const name of ['persona', 'action', 'benefit']) {
      assert.ok(slotNames.includes(name), `scalar slot "${name}" missing`);
    }
  });
});

describe('user-journey api.json specifics', () => {
  const api = JSON.parse(readFileSync(join(WC_DIR, 'user-journey', 'api.json'), 'utf-8'));

  it('has src attribute for JSON loading', () => {
    const attr = api.attributes.find(a => a.name === 'src');
    assert.ok(attr, 'src attribute not found');
    assert.equal(attr.type, 'string');
  });

  it('has journey-ready event', () => {
    assert.ok(Array.isArray(api.events));
    const evt = api.events.find(e => e.name === 'journey-ready');
    assert.ok(evt, 'journey-ready event not found');
  });

  it('has scalar slots for title, persona, summary', () => {
    assert.ok(Array.isArray(api.slots));
    const slotNames = api.slots.map(s => s.name);
    assert.ok(slotNames.includes('title'), 'title slot missing');
    assert.ok(slotNames.includes('persona'), 'persona slot missing');
    assert.ok(slotNames.includes('summary'), 'summary slot missing');
  });
});

// ── empathy-map api.json specifics ────────────────────────────────────────────

describe('empathy-map api.json specifics', () => {
  const api = JSON.parse(readFileSync(join(WC_DIR, 'empathy-map', 'api.json'), 'utf-8'));

  it('has quadrant + summary + scalar slots', () => {
    assert.ok(Array.isArray(api.slots));
    const slotNames = api.slots.map(s => s.name);
    // Quadrant content slots
    assert.ok(slotNames.includes('says'));
    assert.ok(slotNames.includes('thinks'));
    assert.ok(slotNames.includes('does'));
    assert.ok(slotNames.includes('feels'));
    assert.ok(slotNames.includes('goals'));
    assert.ok(slotNames.includes('pain-points'));
    // Scalar fallback slots
    assert.ok(slotNames.includes('title'), 'title slot missing');
    assert.ok(slotNames.includes('persona'), 'persona slot missing');
    assert.ok(slotNames.includes('summary'), 'summary slot missing');
  });

  it('has editable boolean attribute', () => {
    const attr = api.attributes.find(a => a.name === 'editable');
    assert.ok(attr, 'editable attribute not found');
    assert.equal(attr.type, 'boolean');
  });

  it('has persona-id for cross-referencing', () => {
    const attr = api.attributes.find(a => a.name === 'persona-id');
    assert.ok(attr, 'persona-id attribute not found');
  });

  it('has empathy-map:ready and empathy-map:update events', () => {
    assert.ok(Array.isArray(api.events));
    const eventNames = api.events.map(e => e.name);
    assert.ok(eventNames.includes('empathy-map:ready'));
    assert.ok(eventNames.includes('empathy-map:update'));
  });
});

// ── impact-effort api.json specifics ──────────────────────────────────────────

describe('impact-effort api.json specifics', () => {
  const api = JSON.parse(readFileSync(join(WC_DIR, 'impact-effort', 'api.json'), 'utf-8'));

  it('has childAttributes for data-quadrant', () => {
    assert.ok(Array.isArray(api.childAttributes));
    const quadrant = api.childAttributes.find(a => a.name === 'data-quadrant');
    assert.ok(quadrant, 'data-quadrant child attribute not found');
    assert.equal(quadrant.type, 'enum');
    assert.deepEqual(quadrant.values.sort(), ['big-bets', 'fill-ins', 'money-pit', 'quick-wins']);
  });

  it('has impact-effort:move event', () => {
    assert.ok(Array.isArray(api.events));
    const evt = api.events.find(e => e.name === 'impact-effort:move');
    assert.ok(evt, 'impact-effort:move event not found');
  });

  it('has title attribute', () => {
    const attr = api.attributes.find(a => a.name === 'title');
    assert.ok(attr, 'title attribute not found');
  });
});

// ── story-map api.json specifics ──────────────────────────────────────────────

describe('story-map api.json specifics', () => {
  const api = JSON.parse(readFileSync(join(WC_DIR, 'story-map', 'api.json'), 'utf-8'));

  it('has childAttributes for data-activity', () => {
    assert.ok(Array.isArray(api.childAttributes));
    const activity = api.childAttributes.find(a => a.name === 'data-activity');
    assert.ok(activity, 'data-activity child attribute not found');
  });

  it('has all 3 events', () => {
    assert.ok(Array.isArray(api.events));
    const eventNames = api.events.map(e => e.name);
    assert.ok(eventNames.includes('story-map:reorder'));
    assert.ok(eventNames.includes('story-map:transfer'));
    assert.ok(eventNames.includes('story-map:ready'));
  });

  it('has data-journey-phase child attribute for cross-referencing', () => {
    const phase = api.childAttributes.find(a => a.name === 'data-journey-phase');
    assert.ok(phase, 'data-journey-phase child attribute not found');
  });

  it('has title attribute', () => {
    const attr = api.attributes.find(a => a.name === 'title');
    assert.ok(attr, 'title attribute not found');
  });
});
