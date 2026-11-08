/**
 * VB effects runtime — review fixes (effects review e1 runtime/trigger/stagger,
 * e2 data-transition runtime items).
 *
 * Covers: trigger + transition registrations in every runtime-carrying entry;
 * the hidden entrance pre-state gated on [data-effect-armed] (no JS, unknown
 * trigger, clone → visible); WeakSet processed state (clones, real
 * remove + reinsert); data-transition clone / reinsert / attribute change /
 * fallback ident / [data-swap] skip; data-stagger time shorthand, late
 * children, auto-placed grid; hover-on-focus and click toggle; reduced motion
 * through BOTH prefers-reduced-motion and :root[data-motion-reduced] across
 * entrance, exit and looping effects.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const TRIGGERS = ['scroll', 'hover', 'click', 'time', 'intersect', 'media', 'event', 'vt', 'view-progress', 'scroll-progress'];
const TRANSITIONS = ['morph', 'slide', 'fade', 'scale', 'stagger', 'none', 'effect'];

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ entry?: string | null, css?: string, html?: string }} [opts]
 */
async function load(page, body, { entry = '/src/main.js', css = '/src/main.css', html = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__effects-h1-${Math.random().toString(36).slice(2)}.html`;
  const script = entry ? `<script type="module" src="${entry}"></script>` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${html}><head><meta charset="utf-8">
      <link rel="stylesheet" href="${css}">${script}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (entry) await page.waitForFunction(() => Boolean(window.VB?._triggers?.has('scroll')));
}

const opacity = (page, sel) => page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));
/** Running (not finished/idle) animations on the element itself, not pseudo/descendants. */
const runningOnHost = (page, sel) => page.locator(sel).evaluate((el) => document.getAnimations()
  .filter((a) => a.effect?.target === el && !a.effect.pseudoElement && a.playState === 'running')
  .map((a) => a.animationName));

/* ── Bundle parity (source entries) ──────────────────────────────────────── */

for (const entry of ['/src/main-core.js', '/src/web-components/extras.js', '/src/packs/effects/effects.js', '/src/packs/kawaii/kawaii.effects.js']) {
  test(`${entry} registers every built-in trigger and transition preset`, async ({ page }) => {
    await load(page, '<p>x</p>', { entry });
    const got = await page.evaluate(() => ({
      triggers: [...window.VB._triggers.keys()],
      transitions: [...window.VB._transitions.keys()],
    }));
    expect(got.triggers).toEqual(expect.arrayContaining(TRIGGERS));
    expect(got.transitions).toEqual(expect.arrayContaining(TRANSITIONS));
  });
}

/* ── Pre-state gating ────────────────────────────────────────────────────── */

test('without JS a triggered entrance effect is visible', async ({ page }) => {
  await load(page, `
    <h2 id="a" data-effect="fade-in" data-trigger="scroll">A</h2>
    <h2 id="b" data-effect="fade-in slide-up" data-trigger="click">B</h2>
    <h2 id="c" data-effect="pop" data-trigger="time:99999">C</h2>
    <h2 id="d" data-effect="slide-in" data-trigger="hover">D</h2>`, { entry: null });
  for (const id of ['a', 'b', 'c', 'd']) expect(await opacity(page, `#${id}`)).toBe(1);
});

test('a wired trigger arms the hidden pre-state; activation reveals it', async ({ page }) => {
  await load(page, `
    <p style="block-size: 150vh">spacer</p>
    <h2 id="s" data-effect="fade-in" data-trigger="scroll">Scrolled</h2>`);
  const s = page.locator('#s');
  await expect(s).toHaveAttribute('data-effect-armed', '');
  expect(await opacity(page, '#s')).toBe(0);
  await s.scrollIntoViewIfNeeded();
  await expect(s).toHaveAttribute('data-effect-active', '');
  await expect.poll(() => opacity(page, '#s')).toBe(1);
});

test('an unknown trigger leaves content visible, warns once and activates after load', async ({ page }) => {
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await load(page, `
    <h2 id="u1" data-effect="fade-in" data-trigger="scrol">typo</h2>
    <h2 id="u2" data-effect="pop" data-trigger="scrol">typo</h2>`);
  await expect(page.locator('#u1')).toHaveAttribute('data-effect-active', '');
  await expect(page.locator('#u1')).not.toHaveAttribute('data-effect-armed', '');
  await expect.poll(() => opacity(page, '#u1')).toBe(1);
  await expect.poll(() => opacity(page, '#u2')).toBe(1);
  expect(warnings.filter((w) => w.includes('"scrol"'))).toHaveLength(1);
});

test('processed state is not an attribute: clones wire their own trigger', async ({ page }) => {
  await load(page, '<button id="orig" data-effect="fade-in" data-trigger="click">Original</button>');
  const r = await page.evaluate(async () => {
    const orig = document.getElementById('orig');
    const clone = /** @type {HTMLElement} */ (orig.cloneNode(true));
    clone.id = 'clone';
    // A stale flag from older markup must not block processing either.
    clone.setAttribute('data-effect-processed', '');
    orig.after(clone);
    await new Promise((res) => setTimeout(res, 50));
    const before = { armed: clone.hasAttribute('data-effect-armed'), legacy: clone.hasAttribute('data-effect-processed') };
    clone.click();
    await new Promise((res) => setTimeout(res, 600));
    return { ...before, active: clone.hasAttribute('data-effect-active'), opacity: getComputedStyle(clone).opacity, attrOnOrig: orig.hasAttribute('data-effect-processed') };
  });
  expect(r).toEqual({ armed: true, legacy: false, active: true, opacity: '1', attrOnOrig: false });
});

test('a real remove + reinsert re-wires the trigger', async ({ page }) => {
  await load(page, '<section id="host"><button id="b" data-effect="pop" data-trigger="click">Pop</button></section>');
  const r = await page.evaluate(async () => {
    const b = document.getElementById('b');
    const host = document.getElementById('host');
    const frames = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    b.remove();
    await frames();
    const removedArmed = b.hasAttribute('data-effect-armed');
    host.append(b);
    await frames();
    b.click();
    return { removedArmed, armed: b.hasAttribute('data-effect-armed'), active: b.hasAttribute('data-effect-active') };
  });
  expect(r).toEqual({ removedArmed: false, armed: true, active: true });
});

/* ── Triggers ────────────────────────────────────────────────────────────── */

test('hover also fires on keyboard focus (focus-within for containers)', async ({ page }) => {
  await load(page, `
    <article id="card" data-effect="shadow" data-trigger="hover"><a href="#x" id="link">Read</a> <a href="#y" id="link2">More</a></article>
    <button id="other">Other</button>`);
  const card = page.locator('#card');
  await page.focus('#link');
  await expect(card).toHaveAttribute('data-effect-active', '');
  await page.keyboard.press('Tab'); // focus moves inside the card
  await expect(page.locator('#link2')).toBeFocused();
  await expect(card).toHaveAttribute('data-effect-active', '');
  await page.focus('#other');
  await expect(card).not.toHaveAttribute('data-effect-active', '');
});

test('click toggles; click:replay replays and emits the reset', async ({ page }) => {
  await load(page, `
    <button id="t" data-effect="pulse" data-trigger="click">Toggle</button>
    <button id="r" data-effect="shake" data-trigger="click:replay">Replay</button>`);
  // pulse loops, so the element is never "stable" for page.click().
  await page.locator('#t').dispatchEvent('click');
  await expect(page.locator('#t')).toHaveAttribute('data-effect-active', '');
  await page.locator('#t').dispatchEvent('click');
  await expect(page.locator('#t')).not.toHaveAttribute('data-effect-active', '');
  const phases = await page.evaluate(() => {
    const r = document.getElementById('r');
    const out = [];
    r.addEventListener('vb:phase-change', (e) => out.push(/** @type {CustomEvent} */ (e).detail.active));
    r.click(); r.click();
    return out;
  });
  expect(phases).toEqual([true, false, true]);
});

test('view-progress arms (timeline drives it) and is never stuck hidden under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page, '<h2 id="v" data-effect="fade-in" data-trigger="view-progress">Timeline</h2>');
  await expect(page.locator('#v')).toHaveAttribute('data-effect-armed', '');
  await expect.poll(() => opacity(page, '#v')).toBe(1);
});

/* ── Stagger ─────────────────────────────────────────────────────────────── */

test('data-stagger time shorthand, both-fill delay, and late children', async ({ page }) => {
  await load(page, `
    <ul id="list" data-stagger="200ms">
      <li data-effect="fade-in" data-trigger="click">One</li>
      <li data-effect="fade-in" data-trigger="click">Two</li>
      <li id="third" data-effect="fade-in" data-trigger="click">Three</li>
    </ul>`);
  const list = page.locator('#list');
  await expect.poll(() => list.evaluate((el) => el.style.getPropertyValue('--vb-stagger'))).toBe('200ms');
  // During its 400ms delay the third item must stay hidden (fill-mode both),
  // not flash visible before the animation starts.
  const during = await page.evaluate(async () => {
    const li = document.getElementById('third');
    li.click();
    await new Promise((r) => setTimeout(r, 120));
    return { delay: getComputedStyle(li).animationDelay.split(',')[0].trim(), opacity: getComputedStyle(li).opacity };
  });
  expect(during).toEqual({ delay: '0.4s', opacity: '0' });
  await expect.poll(() => opacity(page, '#third')).toBe(1);

  const late = await page.evaluate(async () => {
    const ul = document.getElementById('list');
    const li = document.createElement('li');
    li.textContent = 'Four';
    ul.append(li);
    await new Promise((r) => setTimeout(r, 50));
    ul.firstElementChild.remove();
    await new Promise((r) => setTimeout(r, 50));
    return [...ul.children].map((c) => /** @type {HTMLElement} */ (c).style.getPropertyValue('--vb-stagger-index'));
  });
  expect(late).toEqual(['0', '1', '2']);
});

test('data-stagger="grid" handles auto-placed items (diagonal wave)', async ({ page }) => {
  await load(page, `
    <ul id="g" data-stagger="grid" style="display: grid; grid-template-columns: repeat(3, 5rem); list-style: none">
      <li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li>
    </ul>`);
  const idx = await page.locator('#g').evaluate((el) => [...el.children].map((c) => Number(/** @type {HTMLElement} */ (c).style.getPropertyValue('--vb-stagger-index'))));
  expect(idx).toEqual([0, 1, 2, 1, 2, 3]);
});

/* ── data-transition runtime ─────────────────────────────────────────────── */

test('a cloned [data-transition] gets its own name; view transitions still run', async ({ page }) => {
  await load(page, '<section id="a" data-transition="fade">A</section>');
  const r = await page.evaluate(async () => {
    const a = document.getElementById('a');
    const b = /** @type {HTMLElement} */ (a.cloneNode(true));
    b.removeAttribute('id');
    a.after(b);
    await new Promise((res) => setTimeout(res, 50));
    let error = null;
    if (document.startViewTransition) {
      try { await window.VB.swap(() => { a.textContent = 'A2'; }).finished; } catch (e) { error = String(e); }
    }
    return { a: a.style.viewTransitionName, b: b.style.viewTransitionName, error };
  });
  expect(r.a).not.toBe('');
  expect(r.b).not.toBe('');
  expect(r.b).not.toBe(r.a);
  expect(r.error).toBeNull();
});

test('reinsert after a real removal names the element again', async ({ page }) => {
  await load(page, '<section id="host"><p id="p" data-transition="scale">P</p></section>');
  const r = await page.evaluate(async () => {
    const p = document.getElementById('p');
    const frames = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    p.remove();
    await frames();
    const removed = p.style.viewTransitionName;
    document.getElementById('host').append(p);
    await frames();
    return { removed, after: p.style.viewTransitionName, cls: p.style.viewTransitionClass };
  });
  expect(r.removed).toBe('');
  expect(r.after).toBe('scale-p');
  expect(r.cls).toBe('scale');
});

test('changing or removing data-transition re-applies / clears', async ({ page }) => {
  await load(page, '<section id="s" data-transition="slide">S</section>');
  const s = page.locator('#s');
  await expect.poll(() => s.evaluate((el) => el.style.viewTransitionName)).not.toBe('');
  await s.evaluate((el) => el.setAttribute('data-transition', 'fade'));
  await expect.poll(() => s.evaluate((el) => el.style.viewTransitionClass)).toBe('fade');
  await s.evaluate((el) => el.removeAttribute('data-transition'));
  await expect.poll(() => s.evaluate((el) => [el.style.viewTransitionName, el.style.viewTransitionClass].join('|'))).toBe('|');
});

test('fallback name for an unregistered value is a valid ident', async ({ page }) => {
  await load(page, '<section data-transition="custom:thing">F</section><p id="g" data-transition="other:x" >G</p>');
  const r = await page.locator('section[data-transition]').evaluate((el) => ({ inline: el.style.viewTransitionName, computed: getComputedStyle(el).viewTransitionName }));
  expect(r.inline).toMatch(/^custom-vb-\d+$/);
  expect(r.computed).toBe(r.inline);
  // With an id the uid is the id: still an ident, built from the name only.
  expect(await page.locator('#g').evaluate((el) => el.style.viewTransitionName)).toBe('other-g');
});

test('[data-swap] and <content-swap> keep their own data-transition meaning', async ({ page }) => {
  await load(page, '<article id="w" data-swap data-transition="fade"><p>front</p></article>');
  const name = await page.locator('#w').evaluate((el) => el.style.viewTransitionName + '|' + el.style.viewTransitionClass);
  expect(name).toBe('|');
});

/* ── Reduced motion: both switches, entrance + exit + loops ──────────────── */

const LOOPS = [
  ['pulse', 'pulse'], ['bounce', 'bounce'], ['float', 'float'], ['glow', 'glow'],
  ['neon', 'neon'], ['rainbow', 'rainbow'], ['shimmer', 'shimmer'], ['blink', 'blink'],
  ['gradient', 'gradient-text" class="animate'], ['t3d', 'text-3d" class="animate'],
  ['outline', 'outline" class="glow'],
];
const RM_BODY = `
  ${LOOPS.map(([id, fx]) => `<p id="loop-${id}" data-effect="${fx}">Loop ${id}</p>`).join('\n')}
  <button id="fade" data-effect="fade-in" data-trigger="click">fade</button>
  <button id="slide" data-effect="slide-up" data-trigger="click">slide</button>
  <button id="pop" data-effect="pop" data-trigger="click">pop</button>
  <button id="slin" data-effect="slide-in" data-trigger="hover">slide-in</button>
  <button id="combo" data-effect="fade-in slide-up" data-trigger="time:50">combo</button>
  <button id="out" data-effect="fade-out" data-trigger="click">gone</button>`;

test('control: without reduced motion the loops do run (so the RM checks are not vacuous)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await load(page, RM_BODY);
  for (const [id] of LOOPS) {
    expect((await runningOnHost(page, `#loop-${id}`)).length, id).toBeGreaterThan(0);
  }
});

for (const mode of ['prefers-reduced-motion', 'data-motion-reduced']) {
  test(`reduced motion (${mode}): entrances visible, exits final, loops stopped`, async ({ page }) => {
    if (mode === 'prefers-reduced-motion') await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, RM_BODY, { html: mode === 'data-motion-reduced' ? 'data-motion-reduced' : '' });

    // Armed but never activated: still visible.
    for (const id of ['fade', 'slide', 'pop', 'slin']) {
      await expect(page.locator(`#${id}`)).toHaveAttribute('data-effect-armed', '');
      expect(await opacity(page, `#${id}`), id).toBe(1);
    }
    // Activated: lands on the final state immediately.
    await page.evaluate(() => ['fade', 'slide', 'pop', 'out'].forEach((id) => document.getElementById(id).click()));
    await page.waitForTimeout(150);
    for (const id of ['fade', 'slide', 'pop', 'combo']) {
      expect(await opacity(page, `#${id}`), id).toBe(1);
      expect(await page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).transform), id).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    }
    expect(await opacity(page, '#out')).toBe(0);
    // Loops: nothing still running on the host.
    for (const [id] of LOOPS) {
      expect(await runningOnHost(page, `#loop-${id}`), id).toEqual([]);
    }
  });
}

test('reduced motion: animationend still fires so phase-end chains work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page, '<button id="e" data-effect="pop" data-trigger="click">pop</button>');
  const phase = await page.evaluate(() => new Promise((resolve) => {
    const el = document.getElementById('e');
    el.addEventListener('vb:effect-phase-end', (e) => resolve(/** @type {CustomEvent} */ (e).detail.phase));
    el.click();
    setTimeout(() => resolve('timeout'), 1000);
  }));
  expect(phase).toBe('entrance');
});
