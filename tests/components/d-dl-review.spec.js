/**
 * dl / dt / dd / dl-item — D-review fixes (vanilla-breeze-8s1z, -rb3n, -8kf7).
 *
 * Covers: horizontal variant keeps every dd in column 2 (multi-dd groups,
 * multi-dt groups); variants apply to spec <div> wrappers; narrow containers
 * stack without overflow; plain wrapped groups keep group spacing + dd
 * indent; striping of wrapped groups and flat multi-dd runs; html-validate
 * flags <dl-item> outside <dl>. Plus smoke tests for the three attribute
 * demos (floating label, hotkey action, loading button).
 *
 * Tests the working tree: /src (and the demo files) are served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { HtmlValidate, FileSystemConfigLoader } from 'html-validate';

const REPO = join(import.meta.dirname, '..', '..');

async function routeSrc(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
}

async function load(page, body, { dir = 'ltr' } = {}) {
  await routeSrc(page);
  const url = `/__d-dl-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

async function loadDemo(page, file) {
  await routeSrc(page);
  const url = `/__d-dl-demo-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: readFileSync(join(REPO, file), 'utf8'),
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Bounding boxes of every dt/dd inside the element matching `sel`. */
function boxes(page, sel) {
  return page.evaluate((s) => {
    const root = document.querySelector(s);
    return [...root.querySelectorAll('dt, dd')].map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.localName, text: el.textContent.trim(), x: r.left, y: r.top, w: r.width, right: r.right };
    });
  }, sel);
}

const MULTI = (wrapper, attrs = 'data-variant="horizontal" data-bordered') => `
  <dl id="t" ${attrs}>
    <${wrapper}><dt>Phone</dt><dd>+1 555 123 4567</dd><dd>+1 555 987 6543</dd><dd>+1 555 000 1111</dd></${wrapper}>
    <${wrapper}><dt>Email</dt><dt>Contact</dt><dd>alex@example.com</dd></${wrapper}>
    <${wrapper}><dt>Role</dt><dd>Engineer</dd></${wrapper}>
  </dl>`;

for (const wrapper of ['dl-item', 'div']) {
  test(`horizontal: every dd in column 2, terms in column 1 (${wrapper})`, async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await load(page, MULTI(wrapper));
    const b = await boxes(page, '#t');
    const dts = b.filter((e) => e.tag === 'dt');
    const dds = b.filter((e) => e.tag === 'dd');
    // All terms share one start edge, all descriptions share another, to the right.
    for (const dt of dts) expect(Math.abs(dt.x - dts[0].x)).toBeLessThan(1);
    for (const dd of dds) expect(Math.abs(dd.x - dds[0].x)).toBeLessThan(1);
    expect(dds[0].x).toBeGreaterThan(dts[0].right);
    // First dd sits on the same row as its term; later dd stack below it.
    const phone = dts.find((e) => e.text === 'Phone');
    const phoneDds = dds.slice(0, 3);
    expect(Math.abs(phoneDds[0].y - phone.y)).toBeLessThan(4);
    expect(phoneDds[1].y).toBeGreaterThan(phoneDds[0].y);
    expect(phoneDds[2].y).toBeGreaterThan(phoneDds[1].y);
    // Two terms stack in column 1; the single dd starts on the first term's row.
    const email = dts.find((e) => e.text === 'Email');
    const contact = dts.find((e) => e.text === 'Contact');
    expect(contact.y).toBeGreaterThan(email.y);
    expect(Math.abs(dds[3].y - email.y)).toBeLessThan(4);
  });

  test(`variants style ${wrapper} wrappers (bordered + padding)`, async ({ page }) => {
    await load(page, MULTI(wrapper));
    const s = await page.evaluate((w) => {
      const items = [...document.querySelectorAll(`#t > ${w}`)];
      const cs = items.map((el) => getComputedStyle(el));
      return {
        display: cs[0].display,
        border0: cs[0].borderBlockEndWidth,
        borderLast: cs[2].borderBlockEndWidth,
        pad: cs[0].paddingBlockStart,
      };
    }, wrapper);
    expect(s.display).toBe('grid');
    expect(parseFloat(s.border0)).toBeGreaterThan(0);
    expect(parseFloat(s.borderLast)).toBe(0);
    expect(parseFloat(s.pad)).toBeGreaterThan(0);
  });

  test(`stacked variant applies to ${wrapper} wrappers`, async ({ page }) => {
    await load(page, MULTI(wrapper, 'data-variant="stacked"'));
    const r = await page.evaluate(() => {
      const dt = document.querySelector('#t dt');
      const dd = document.querySelector('#t dd');
      const second = document.querySelectorAll('#t > *')[1];
      return {
        ddIndent: getComputedStyle(dd).marginInlineStart,
        dtSize: parseFloat(getComputedStyle(dt).fontSize),
        bodySize: parseFloat(getComputedStyle(dd).fontSize),
        dtBelow: dd.getBoundingClientRect().top >= dt.getBoundingClientRect().bottom - 1,
        groupGap: parseFloat(getComputedStyle(second).marginBlockStart),
      };
    });
    expect(r.ddIndent).toBe('0px');
    expect(r.dtSize).toBeLessThan(r.bodySize);
    expect(r.dtBelow).toBe(true);
    expect(r.groupGap).toBeGreaterThan(0);
  });
}

test('horizontal: narrow container stacks and nothing overflows', async ({ page }) => {
  await load(page, `
    <section id="wrap">
      <dl id="t" data-variant="horizontal" data-bordered>
        <dl-item><dt>Full Name</dt><dd>Alexandra Chen</dd></dl-item>
        <dl-item><dt>Email</dt><dd>alexandra.chen.with.a.very.long.address@example-company.com</dd></dl-item>
      </dl>
    </section>
    <style>#wrap { inline-size: 240px; }</style>`); // under the 16rem stack point
  const r = await page.evaluate(() => {
    const dl = document.getElementById('t');
    const dlBox = dl.getBoundingClientRect();
    const els = [...dl.querySelectorAll('dt, dd')];
    const [dt, dd] = [els[2], els[3]];
    return {
      dlRight: dlBox.right,
      maxRight: Math.max(...els.map((e) => e.getBoundingClientRect().right)),
      scrollOverflow: dl.scrollWidth - dl.clientWidth,
      ddBelowDt: dd.getBoundingClientRect().top >= dt.getBoundingClientRect().bottom - 1,
      sameStart: Math.abs(dd.getBoundingClientRect().left - dt.getBoundingClientRect().left) < 1,
    };
  });
  expect(r.maxRight).toBeLessThanOrEqual(r.dlRight + 0.5);
  expect(r.scrollOverflow).toBeLessThanOrEqual(0);
  expect(r.ddBelowDt).toBe(true);
  expect(r.sameStart).toBe(true);
});

test('horizontal: wide container keeps long values inside the description column', async ({ page }) => {
  await load(page, `
    <section id="wrap">
      <dl id="t" data-variant="horizontal">
        <dl-item><dt>Email</dt><dd>alexandra.chen.with.a.very.long.address.that.keeps.going@example-company.com</dd></dl-item>
      </dl>
    </section>
    <style>#wrap { inline-size: 480px; }</style>`);
  const r = await page.evaluate(() => {
    const dl = document.getElementById('t');
    const dt = dl.querySelector('dt').getBoundingClientRect();
    const dd = dl.querySelector('dd').getBoundingClientRect();
    return { dlRight: dl.getBoundingClientRect().right, ddRight: dd.right, sideBySide: dd.left > dt.right };
  });
  expect(r.sideBySide).toBe(true);
  expect(r.ddRight).toBeLessThanOrEqual(r.dlRight + 0.5);
});

test('horizontal: RTL puts the term column on the right', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await load(page, MULTI('dl-item'), { dir: 'rtl' });
  const b = await boxes(page, '#t');
  const dt = b.find((e) => e.tag === 'dt');
  const dd = b.find((e) => e.tag === 'dd');
  expect(dt.x).toBeGreaterThan(dd.right);
});

test('plain dl-item / div wrappers keep group spacing and dd indent', async ({ page }) => {
  await load(page, `
    <dl id="a"><dl-item><dt>A</dt><dd>One</dd></dl-item><dl-item><dt>B</dt><dd>Two</dd></dl-item></dl>
    <dl id="b"><div><dt>A</dt><dd>One</dd></div><div><dt>B</dt><dd>Two</dd></div></dl>
    <dl id="c"><dt>A</dt><dd>One</dd><dt>B</dt><dd>Two</dd></dl>`);
  const r = await page.evaluate(() => ['a', 'b', 'c'].map((id) => {
    const dl = document.getElementById(id);
    const dd = dl.querySelector('dd');
    const dts = dl.querySelectorAll('dt');
    return {
      indent: dd.getBoundingClientRect().left - dts[0].getBoundingClientRect().left,
      gap: dts[1].getBoundingClientRect().top - dd.getBoundingClientRect().bottom,
    };
  }));
  // Wrapped groups render exactly like flat pairs.
  for (const v of r) {
    expect(v.indent).toBeGreaterThan(8);
    expect(v.gap).toBeGreaterThan(8);
    expect(Math.abs(v.indent - r[2].indent)).toBeLessThan(1);
    expect(Math.abs(v.gap - r[2].gap)).toBeLessThan(1);
  }
});

test('dl with a class or data-layout manages its own wrapper spacing', async ({ page }) => {
  await load(page, `
    <dl id="a" class="custom"><div><dt>A</dt><dd>1</dd></div><div><dt>B</dt><dd>2</dd></div></dl>
    <dl id="b" data-layout="stack"><dl-item><dt>A</dt><dd>1</dd></dl-item><dl-item><dt>B</dt><dd>2</dd></dl-item></dl>`);
  const m = await page.evaluate(() => ['#a', '#b'].map((s) =>
    getComputedStyle(document.querySelectorAll(`${s} > *`)[1]).marginBlockStart));
  expect(m).toEqual(['0px', '0px']);
});

test('--dl-term-min sets the horizontal term column minimum', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await load(page, `
    <dl id="t" data-variant="horizontal"><dl-item><dt>A</dt><dd>One</dd></dl-item></dl>
    <style>#t { --dl-term-min: 200px; }</style>`);
  const w = await page.evaluate(() => document.querySelector('#t dt').getBoundingClientRect().width);
  expect(w).toBeGreaterThanOrEqual(199);
});

test('data-density="compact" tightens wrapper padding', async ({ page }) => {
  await load(page, `${MULTI('dl-item')}${MULTI('dl-item', 'data-variant="horizontal" data-bordered data-density="compact"').replace('id="t"', 'id="c"')}`);
  const [normal, compact] = await page.evaluate(() => ['#t', '#c'].map((s) =>
    parseFloat(getComputedStyle(document.querySelector(`${s} > dl-item`)).paddingBlockStart)));
  expect(compact).toBeLessThan(normal);
});

test('striped: wrapped groups stripe as a whole; flat multi-dd runs share the stripe', async ({ page }) => {
  await load(page, `
    <dl id="w" data-striped>
      <div><dt>A</dt><dt>A2</dt><dd>1</dd><dd>2</dd></div>
      <div><dt>B</dt><dd>3</dd></div>
      <dl-item><dt>C</dt><dd>4</dd></dl-item>
    </dl>
    <dl id="f" data-striped>
      <dt>A</dt><dd>1</dd><dd>2</dd><dd>3</dd>
      <dt>B</dt><dd>4</dd>
    </dl>`);
  const r = await page.evaluate(() => {
    const bg = (el) => getComputedStyle(el).backgroundColor;
    const clear = (c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
    const w = document.querySelectorAll('#w > *');
    const f = [...document.querySelectorAll('#f > *')];
    return {
      w0: !clear(bg(w[0])), w1: !clear(bg(w[1])),
      flatStriped: f.slice(0, 4).every((el) => !clear(bg(el))),
      flatSecond: f.slice(4).every((el) => clear(bg(el))),
      wrapperGap: parseFloat(getComputedStyle(w[1]).marginBlockStart),
    };
  });
  expect(r.w0).toBe(true);
  expect(r.w1).toBe(false);
  expect(r.flatStriped).toBe(true);
  expect(r.flatSecond).toBe(true);
  expect(r.wrapperGap).toBe(0);
});

test('Chrome a11y tree keeps term/definition roles inside dl-item', async ({ page }) => {
  await load(page, '<dl id="t"><dl-item><dt>Term</dt><dd>Definition</dd></dl-item></dl>');
  const snap = await page.locator('#t').ariaSnapshot();
  expect(snap).toMatch(/term: Term/);
  expect(snap).toMatch(/definition: Definition/);
});

test.describe('html-validate dl-item rules', () => {
  async function lint(markup) {
    const hv = new HtmlValidate(new FileSystemConfigLoader());
    const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>t</title></head><body><main>${markup}</main></body></html>`;
    const report = await hv.validateString(doc, join(REPO, 'demos', '__d-dl-lint.html'));
    return report.results.flatMap((r) => r.messages).filter((m) => m.ruleId === 'element-required-ancestor');
  }

  test('dl-item outside dl is flagged (with its dt/dd)', async () => {
    const msgs = await lint('<dl-item><dt>A</dt><dd>B</dd></dl-item>');
    expect(msgs.map((m) => m.selector || m.message).join('\n')).toMatch(/dl-item/);
    expect(msgs.length).toBe(3);
  });

  test('dl > dl-item and dl > div are accepted', async () => {
    expect(await lint('<dl><dl-item><dt>A</dt><dd>B</dd></dl-item><div><dt>C</dt><dd>D</dd></div></dl>')).toEqual([]);
  });

  test('dl-item nested in another wrapper is flagged', async () => {
    const msgs = await lint('<dl><div><dl-item><dt>A</dt><dd>B</dd></dl-item></div></dl>');
    expect(msgs.length).toBeGreaterThan(0);
  });
});

test.describe('attribute demos', () => {
  test('floating-label-basic enhances its fields', async ({ page }) => {
    await loadDemo(page, 'demos/examples/demos/floating-label-basic.html');
    await expect(page.locator('form-field[data-floating-label-ready]')).toHaveCount(4);
    await expect(page.locator('#email')).toHaveAttribute('placeholder', ' ');
  });

  test('loading-button-basic shows and reverts the loading state', async ({ page }) => {
    await loadDemo(page, 'demos/examples/demos/loading-button-basic.html');
    const btn = page.locator('button[data-loading="Saving..."]');
    await expect.poll(async () => {
      await btn.click();
      return btn.getAttribute('aria-busy');
    }, { timeout: 5000 }).toBe('true');
    await expect(btn).toContainText('Saving...');
    await expect(btn).not.toHaveAttribute('aria-busy', 'true', { timeout: 4000 });
    await expect(btn).toHaveText(/Save Changes/);
  });

  test('hotkey-action-basic binds / to focus search', async ({ page }) => {
    await loadDemo(page, 'demos/examples/demos/hotkey-action-basic.html');
    await page.locator('main > p').first().click();
    await expect.poll(async () => {
      await page.keyboard.press('/');
      return page.evaluate(() => document.activeElement?.id);
    }, { timeout: 5000 }).toBe('search');
    // meta+s is global: it fires while typing in the search field.
    await page.keyboard.press('ControlOrMeta+s');
    await expect(page.locator('#save-status')).toHaveText('Saved (1)');
  });
});
