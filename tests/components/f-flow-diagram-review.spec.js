/**
 * flow-diagram — F-element review fixes (vanilla-breeze-4rtb).
 *
 * Covers: the documented JSON shape renders (and legacy/malformed input does
 * not throw); .steps survives attribute re-renders and keeps select wired;
 * src assigned before connect loads; the accessibility tree exposes node text
 * in order with branches; roving-tabindex keyboard select; dark-mode AA
 * contrast of node text; forced-colors connectors; RTL horizontal arrows;
 * data-title / data-heading-level / data-label-* i18n.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', lang = 'en', scheme = 'light', wait = true } = {}) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__fd-fixture.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      title: 'Fetched flow',
      steps: [
        { type: 'start', text: 'Open app' },
        { type: 'decision', text: 'Signed in?', branches: [
          { label: 'Yes', steps: [{ type: 'end', text: 'Home' }] },
          { label: 'No', steps: [{ type: 'end', text: 'Login' }] },
        ] },
      ],
    }),
  }));
  const url = `/__flow-diagram-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/flow-diagram/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('flow-diagram'));
  if (wait) await page.waitForSelector('flow-diagram[data-upgraded]');
}

const LOGIN = `
  <flow-diagram id="fd" data-title="Login">
    <ol>
      <li data-type="start">Visit login</li>
      <li data-type="decision" data-annotation="Checked against the DB">Valid?
        <ol>
          <li data-branch="Yes"><ol><li data-type="end">Dashboard</li></ol></li>
          <li data-branch="No"><ol><li data-type="action">Show error</li><li data-type="end">Retry</li></ol></li>
        </ol>
      </li>
    </ol>
  </flow-diagram>`;

const PLAIN = `<flow-diagram id="fd"><ol><li data-type="start">Begin</li><li data-type="end">Done</li></ol></flow-diagram>`;

test('documented JSON shape renders branches; legacy branch key does not throw', async ({ page }) => {
  await load(page, PLAIN);
  const r = await page.evaluate(() => {
    const fd = /** @type {any} */ (document.getElementById('fd'));
    const errors = [];
    try {
      fd.steps = [
        { type: 'start', text: 'Visitor lands' },
        { type: 'decision', text: 'Logged in?', annotation: 'Cookie check', branches: [
          { label: 'Yes', steps: [{ type: 'end', text: 'Account' }] },
          { label: 'No', steps: [{ type: 'action', text: 'Sign up' }] },
        ] },
        { type: 'end', text: 'Conversion', branch: ['yes', 'no'] },
        null, 42, 'Plain string step',
      ];
    } catch (e) { errors.push(String(e)); }
    return {
      errors,
      upgraded: fd.hasAttribute('data-upgraded'),
      nodes: [...fd.querySelectorAll('.fd-node-shape')].map((b) => b.dataset.text),
      labels: [...fd.querySelectorAll('.fd-branch-label')].map((l) => l.textContent),
      annotation: fd.querySelector('.fd-annotation')?.textContent,
      getter: fd.steps.map((s) => [s.text, s.branches.length]),
    };
  });
  expect(r.errors).toEqual([]);
  expect(r.upgraded).toBe(true);
  expect(r.nodes).toEqual(['Visitor lands', 'Logged in?', 'Account', 'Sign up', 'Conversion', 'Plain string step']);
  expect(r.labels).toEqual(['Yes', 'No']);
  expect(r.annotation).toBe('Cookie check');
  expect(r.getter).toEqual([['Visitor lands', 0], ['Logged in?', 2], ['Conversion', 0], ['Plain string step', 0]]);
});

test('.steps survives an attribute re-render and a move; select still fires once', async ({ page }) => {
  await load(page, PLAIN);
  await page.evaluate(() => {
    const fd = /** @type {any} */ (document.getElementById('fd'));
    /** @type {any} */ (window).fired = [];
    fd.addEventListener('flow-diagram:select', (e) => /** @type {any} */ (window).fired.push(e.detail));
    fd.steps = [{ type: 'start', text: 'New A' }, { type: 'end', text: 'New B' }];
    fd.setAttribute('data-title', 'Retitled');
  });
  await page.waitForFunction(() => document.querySelector('#fd .fd-title')?.textContent === 'Retitled');
  const r = await page.evaluate(() => {
    const fd = /** @type {any} */ (document.getElementById('fd'));
    const main = /** @type {HTMLElement} */ (document.querySelector('main'));
    fd.remove(); main.append(fd);
    /** @type {HTMLElement} */ (fd.querySelector('.fd-node-shape')).click();
    return {
      nodes: [...fd.querySelectorAll('.fd-node-shape')].map((b) => b.dataset.text),
      containers: fd.querySelectorAll('.fd-container').length,
      sourceItems: fd.querySelectorAll(':scope > ol > li').length,
      fired: /** @type {any} */ (window).fired,
    };
  });
  expect(r.nodes).toEqual(['New A', 'New B']);
  expect(r.containers).toBe(1);
  expect(r.sourceItems).toBe(2);
  expect(r.fired).toEqual([{ type: 'start', text: 'New A' }]);
});

test('.steps fires ready then steps-changed', async ({ page }) => {
  await load(page, PLAIN);
  const order = await page.evaluate(() => {
    const fd = /** @type {any} */ (document.getElementById('fd'));
    const seen = [];
    fd.addEventListener('flow-diagram:ready', (e) => seen.push(`ready:${e.detail.nodeCount}`));
    fd.addEventListener('flow-diagram:steps-changed', (e) => seen.push(`changed:${e.detail.source}:${e.detail.steps.length}`));
    fd.steps = [{ type: 'start', text: 'A' }, { text: 'B' }, { type: 'end', text: 'C' }];
    return seen;
  });
  expect(order).toEqual(['ready:3', 'changed:property:3']);
});

test('src set before connect loads the JSON', async ({ page }) => {
  await load(page, '<p>host</p>', { wait: false });
  await page.evaluate(() => {
    const fd = document.createElement('flow-diagram');
    fd.id = 'fd';
    fd.setAttribute('src', '/__fd-fixture.json');
    document.querySelector('main')?.append(fd);
  });
  await page.waitForSelector('#fd[data-upgraded]');
  const r = await page.evaluate(() => ({
    title: document.querySelector('#fd .fd-title')?.textContent,
    nodes: [...document.querySelectorAll('#fd .fd-node-shape')].map((b) => /** @type {HTMLElement} */ (b).dataset.text),
  }));
  expect(r).toEqual({ title: 'Fetched flow', nodes: ['Open app', 'Signed in?', 'Home', 'Login'] });
});

test('accessibility tree exposes the flow as a labelled nested list, in order', async ({ page }) => {
  await load(page, LOGIN);
  const fd = page.locator('#fd');
  await expect(fd).toMatchAriaSnapshot(`
    - heading "Login" [level=2]
    - figure "Login":
      - list:
        - listitem:
          - 'button "Start: Visit login"'
        - listitem:
          - 'button "Decision: Valid?"'
          - text: Checked against the DB
          - list:
            - listitem:
              - text: "Yes"
              - list:
                - listitem:
                  - 'button "End: Dashboard"'
            - listitem:
              - text: "No"
              - list:
                - listitem:
                  - 'button "Action: Show error"'
                - listitem:
                  - 'button "End: Retry"'
      - paragraph: 5 steps
  `);
  // The hidden source list is not read twice.
  const hidden = await page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.querySelector('#fd > ol'))).display);
  expect(hidden).toBe('none');
});

test('one tab stop; arrows move focus; Enter and Space select', async ({ page }) => {
  await load(page, `<button id="before">before</button>${LOGIN}<button id="after">after</button>`);
  await page.evaluate(() => {
    /** @type {any} */ (window).fired = [];
    document.getElementById('fd')?.addEventListener('flow-diagram:select', (e) => /** @type {any} */ (window).fired.push(/** @type {CustomEvent} */ (e).detail.text));
  });
  const stops = await page.locator('#fd .fd-node-shape[tabindex="0"]').count();
  expect(stops).toBe(1);
  await page.focus('#before');
  await page.keyboard.press('Tab');
  await expect(page.locator('#fd .fd-node-shape').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('End');
  await page.keyboard.press(' ');
  await page.keyboard.press('Home');
  await expect(page.locator('#fd .fd-node-shape').first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after')).toBeFocused();
  expect(await page.evaluate(() => /** @type {any} */ (window).fired)).toEqual(['Dashboard', 'Retry']);
  await expect(page.locator('#fd .fd-live')).toHaveText('Selected: Retry');
});

for (const scheme of /** @type {const} */ (['light', 'dark'])) {
  test(`node and branch label text meets AA in ${scheme} mode`, async ({ page }) => {
    await load(page, `
      <flow-diagram id="fd"><ol>
        <li data-type="start">S</li><li data-type="action">A</li><li data-type="process">P</li>
        <li data-type="wait">W</li>
        <li data-type="decision">D<ol>
          <li data-branch="Yes"><ol><li data-type="end">E</li></ol></li>
          <li data-branch="No"><ol><li data-type="end">E2</li></ol></li>
        </ol></li>
      </ol></flow-diagram>`, { scheme });
    const ratios = await page.evaluate(() => {
      const toRgb = (c) => {
        const cv = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
        cv.fillStyle = c; cv.fillRect(0, 0, 1, 1);
        return [...cv.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const lum = ([r, g, b]) => {
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      return [...document.querySelectorAll('#fd .fd-node-shape, #fd .fd-branch-label')].map((el) => {
        const cs = getComputedStyle(el);
        const a = lum(toRgb(cs.color)); const b = lum(toRgb(cs.backgroundColor));
        return { what: /** @type {HTMLElement} */ (el).dataset.type || el.textContent, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
    });
    expect(ratios).toHaveLength(9);
    for (const r of ratios) expect(r.ratio, r.what).toBeGreaterThanOrEqual(4.5);
  });
}

test('forced colors: connector lines stay painted', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, LOGIN);
  await page.emulateMedia({ forcedColors: 'active' });
  const r = await page.evaluate(() => {
    const line = getComputedStyle(/** @type {Element} */ (document.querySelector('#fd .fd-connector-line')));
    const bar = getComputedStyle(/** @type {Element} */ (document.querySelector('#fd .fd-branch')), '::before');
    const canvas = getComputedStyle(/** @type {Element} */ (document.querySelector('#fd .fd-container'))).backgroundColor;
    return { line: line.backgroundColor, bar: bar.backgroundColor, canvas, adjust: line.forcedColorAdjust };
  });
  expect(r.adjust).toBe('none');
  expect(r.line).not.toBe(r.canvas);
  expect(r.line).not.toBe('rgba(0, 0, 0, 0)');
  expect(r.bar).toBe(r.line);
});

for (const dir of /** @type {const} */ (['ltr', 'rtl'])) {
  test(`horizontal arrow points toward inline-end in ${dir}`, async ({ page }) => {
    await load(page, PLAIN.replace('id="fd"', 'id="fd" data-direction="horizontal"'), { dir });
    const r = await page.evaluate(() => {
      const arrow = /** @type {Element} */ (document.querySelector('#fd .fd-connector-arrow'));
      const cs = getComputedStyle(arrow);
      const shapes = [...document.querySelectorAll('#fd .fd-node-shape')].map((s) => s.getBoundingClientRect().left);
      return {
        left: cs.borderLeftWidth, right: cs.borderRightWidth,
        leftColor: cs.borderLeftColor, rightColor: cs.borderRightColor,
        secondIsRightOfFirst: shapes[1] > shapes[0],
      };
    });
    if (dir === 'ltr') {
      // Coloured left border, no right border → triangle points right
      expect(r.left).toBe('6px');
      expect(r.right).toBe('0px');
      expect(r.leftColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(r.secondIsRightOfFirst).toBe(true);
    } else {
      expect(r.right).toBe('6px');
      expect(r.left).toBe('0px');
      expect(r.rightColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(r.secondIsRightOfFirst).toBe(false);
    }
  });
}

test('RTL horizontal: ArrowLeft moves to the next node', async ({ page }) => {
  await load(page, PLAIN.replace('id="fd"', 'id="fd" data-direction="horizontal"'), { dir: 'rtl' });
  await page.locator('#fd .fd-node-shape').first().focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#fd .fd-node-shape').nth(1)).toBeFocused();
});

test('data-title is a heading (no tooltip), level and labels are configurable', async ({ page }) => {
  await load(page, `
    <flow-diagram id="fd" data-title="Ablauf" data-heading-level="3"
      data-label-type-start="Beginn" data-label-type-end="Ende"
      data-label-steps-one="{count} Schritt" data-label-steps-other="{count} Schritte"
      data-label-selected="Gewählt: {text}">
      <ol><li data-type="start">Los</li><li data-type="end">Fertig</li></ol>
    </flow-diagram>
    <flow-diagram id="fd2" data-label="Kurzer Ablauf"><ol><li data-type="start">Nur</li></ol></flow-diagram>`, { lang: 'de' });
  const r = await page.evaluate(() => {
    const fd = /** @type {HTMLElement} */ (document.getElementById('fd'));
    return {
      hasTitleAttr: fd.hasAttribute('title') || !!fd.querySelector('[title]'),
      heading: fd.querySelector('h3.fd-title')?.textContent,
      summary: fd.querySelector('.fd-summary')?.textContent,
      summary2: document.querySelector('#fd2 .fd-summary')?.textContent,
      label2: document.querySelector('#fd2 .fd-container')?.getAttribute('aria-label'),
    };
  });
  expect(r).toEqual({ hasTitleAttr: false, heading: 'Ablauf', summary: '2 Schritte', summary2: '1 step', label2: 'Kurzer Ablauf' });
  await expect(page.getByRole('button', { name: 'Beginn: Los' })).toBeVisible();
  await page.getByRole('button', { name: 'Ende: Fertig' }).click();
  await expect(page.locator('#fd .fd-live')).toHaveText('Gewählt: Fertig');
});

test('toggling compact does not rebuild the diagram', async ({ page }) => {
  await load(page, LOGIN);
  const same = await page.evaluate(async () => {
    const fd = /** @type {HTMLElement} */ (document.getElementById('fd'));
    const before = fd.querySelector('.fd-container');
    fd.setAttribute('compact', '');
    await new Promise((r) => setTimeout(r, 300));
    return fd.querySelector('.fd-container') === before;
  });
  expect(same).toBe(true);
});

test.describe('new demos render from the working tree', () => {
  for (const name of ['basic', 'horizontal', 'compact', 'rtl', 'src', 'steps']) {
    test(`flow-diagram-${name}.html`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.route('**/src/**', (route) => route.fulfill({
        path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
      }));
      await page.route('**/__fd-demos/**', (route) => route.fulfill({
        path: join(REPO, 'demos/examples/demos', new URL(route.request().url()).pathname.split('/__fd-demos/')[1]),
      }));
      await page.goto(`/__fd-demos/flow-diagram-${name}.html`);
      await page.waitForSelector('flow-diagram[data-upgraded]');
      expect(await page.locator('flow-diagram .fd-node-shape').count()).toBeGreaterThan(1);
      if (name === 'steps') {
        await page.click('#fd-signup');
        await expect(page.locator('#fd-live .fd-node-shape')).toHaveCount(6);
        await page.locator('#fd-live .fd-node-shape').first().click();
        await expect(page.locator('#fd-log')).toContainText('select — start: Visitor lands');
      }
      expect(errors).toEqual([]);
    });
  }
});
