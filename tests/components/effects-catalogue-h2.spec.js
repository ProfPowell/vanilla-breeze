/**
 * data-effect catalogue fixes (effects review E1, agent H2).
 *
 * Covers: accessible names for flipboard and glitch; the shared text
 * splitter (inline markup kept, graphemes, text read once, clone repair);
 * real cleanup for the JS effects (no timers after removal, flipboard
 * survives reinsert); reveal class="line"; .slow on loops; marquee and
 * view-progress slide-in in RTL; --vb-flip-ms with or without a unit;
 * quoted --vb-scramble-chars; the stamp filter; the data-paused hook and
 * blink stopping after ~5s.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, head?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__effects-h2-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module" src="/src/main.js"></script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).VB?._effects?.has('flipboard'));
}

test.describe('accessible names', () => {
  test('flipboard: board read once, original case, cells hidden', async ({ page }) => {
    await load(page, '<p id="b" data-effect="flipboard">Gate 42</p>');
    const b = page.locator('#b');
    await expect(b.locator('.vb-flap-char')).toHaveCount(7);
    await expect(b).toMatchAriaSnapshot('- paragraph: Gate 42');
    expect(await b.locator('.vb-split').getAttribute('aria-hidden')).toBe('true');
  });

  test('glitch: heading name is the text once', async ({ page }) => {
    await load(page, '<h2 id="g" data-effect="glitch">Glitch Me</h2>');
    await expect(page.locator('#g[data-effect-glitch-init]')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Glitch Me', exact: true })).toHaveCount(1);
    await expect(page.locator('#g')).toMatchAriaSnapshot('- heading "Glitch Me" [level=2]');
  });
});

test.describe('shared text splitter', () => {
  test('reveal keeps the link and is read once', async ({ page }) => {
    await load(page, '<p id="r" data-effect="reveal" data-trigger="click">Read the <a href="#docs">docs page</a> now.</p>');
    const r = page.locator('#r');
    await expect(r.locator('.vb-reveal-chunk').first()).toBeAttached();
    await expect(r.getByRole('link', { name: 'docs page' })).toHaveCount(1);
    await expect(r).toMatchAriaSnapshot(`
      - paragraph:
        - text: Read the
        - link "docs page"
        - text: now.
    `);
    // Hidden until the armed click trigger fires, then visible.
    const chunk = r.locator('.vb-reveal-chunk').first();
    await expect(chunk).toHaveCSS('opacity', '0');
    await r.click({ position: { x: 2, y: 2 } });
    await expect(chunk).toHaveCSS('opacity', '1');
  });

  test('typewriter types grapheme clusters, and the text is read once', async ({ page }) => {
    await load(page, '<p id="t" data-effect="typewriter" style="--vb-typewriter-speed: 5ms">Hi 👩‍👩‍👧 é</p>');
    const t = page.locator('#t');
    // "H","i"," ","👩‍👩‍👧"," ","é" = 6 graphemes.
    await expect(t.locator('.vb-typewriter-char')).toHaveCount(6);
    await expect(t.locator('.vb-typewriter-char:not([hidden])')).toHaveCount(6);
    await expect(t).toMatchAriaSnapshot('- paragraph: Hi 👩‍👩‍👧 é');
  });

  test('a cloned split element is repaired, not split twice', async ({ page }) => {
    await load(page, '<p id="r" data-effect="reveal">One two three</p>');
    await expect(page.locator('#r .vb-reveal-chunk')).toHaveCount(3);
    const r = await page.evaluate(async () => {
      const clone = /** @type {HTMLElement} */ (document.getElementById('r').cloneNode(true));
      clone.id = 'c';
      document.querySelector('main').append(clone);
      await new Promise((res) => setTimeout(res, 50));
      return {
        sr: clone.querySelectorAll('.vb-split-sr').length,
        chunks: clone.querySelectorAll('.vb-reveal-chunk').length,
        text: [...clone.querySelectorAll('.vb-split-sr')].map((s) => s.textContent).join(''),
      };
    });
    expect(r).toEqual({ sr: 1, chunks: 3, text: 'One two three' });
  });

  test('reveal class="line" staggers by rendered line', async ({ page }) => {
    await load(page, '<p id="l" data-effect="reveal" class="line" style="inline-size: 200px">one two three four five six seven eight nine ten eleven twelve thirteen fourteen</p>');
    const lines = await page.locator('#l .vb-reveal-chunk').evaluateAll((els) => new Set(els.map((e) => e.style.getPropertyValue('--i'))).size);
    expect(lines).toBeGreaterThan(2);
  });

  test('quoted --vb-scramble-chars only fills with those characters', async ({ page }) => {
    await load(page, `<p id="s" data-effect="scramble" data-trigger="click"
      style="--vb-scramble-chars: '01'; --vb-scramble-duration: 3s; --vb-scramble-speed: 40ms">ABCDEFGHIJ</p>`);
    const s = page.locator('#s');
    await s.click();
    await page.waitForTimeout(150);
    const shown = await s.locator('.vb-split').textContent();
    expect(shown).toMatch(/^[A-J01]{10}$/);
    expect(shown).toMatch(/[01]/);
    await expect(s).toMatchAriaSnapshot('- paragraph: ABCDEFGHIJ');
  });
});

test.describe('cleanup and reinsert', () => {
  test('a removed looping typewriter stops its timers and restores the text', async ({ page }) => {
    await load(page, '<p id="t" data-effect="typewriter" class="loop" style="--vb-typewriter-speed: 5ms">Looping text</p>');
    await expect(page.locator('#t .vb-typewriter-char').first()).toBeAttached();
    const r = await page.evaluate(async () => {
      const el = document.getElementById('t');
      el.remove();
      await new Promise((res) => setTimeout(res, 50));
      let mutations = 0;
      new MutationObserver((m) => { mutations += m.length; }).observe(el, { subtree: true, childList: true, attributes: true, characterData: true });
      await new Promise((res) => setTimeout(res, 400));
      return { mutations, html: el.innerHTML };
    });
    expect(r.mutations).toBe(0);
    expect(r.html).toBe('Looping text');
  });

  test('flipboard survives remove + reinsert', async ({ page }) => {
    await load(page, '<p id="b" data-effect="flipboard" style="--vb-flip-ms: 10">Gate 42</p>');
    await expect(page.locator('#b .vb-flap-char')).toHaveCount(7);
    await page.evaluate(async () => {
      const el = document.getElementById('b');
      const main = document.querySelector('main');
      el.remove();
      await new Promise((res) => setTimeout(res, 50));
      main.append(el);
    });
    await expect(page.locator('#b .vb-flap-char')).toHaveCount(7);
    await expect(page.locator('#b')).toMatchAriaSnapshot('- paragraph: Gate 42');
  });

  test('re-activating scramble runs one decode, not two', async ({ page }) => {
    await load(page, '<p id="s" data-effect="scramble" data-trigger="click:replay" style="--vb-scramble-duration: 200ms">Decode</p>');
    const s = page.locator('#s');
    await s.click();
    await s.click();
    await expect(s.locator('.vb-split')).toHaveText('Decode', { timeout: 2000 });
    // Stays settled: a second concurrent loop would keep scrambling.
    await page.waitForTimeout(300);
    await expect(s.locator('.vb-split')).toHaveText('Decode');
  });
});

test.describe('timing, direction and pause', () => {
  test('.slow makes loops slower, .fast faster', async ({ page }) => {
    await load(page, `
      <span id="p" data-effect="pulse">p</span><span id="ps" data-effect="pulse" class="slow">p</span>
      <span id="f" data-effect="float">f</span><span id="fs" data-effect="float" class="slow">f</span><span id="ff" data-effect="float" class="fast">f</span>`);
    const dur = (/** @type {string} */ id) => page.locator(id).evaluate((el) => getComputedStyle(el).getPropertyValue('--vb-duration').trim());
    expect(await dur('#ps')).toBe('3s');
    expect(await dur('#fs')).toBe('6s');
    expect(await dur('#ff')).toBe('1.5s');
    expect(await dur('#p')).toBe('');
  });

  test('marquee and view-progress slide-in mirror in RTL', async ({ page }) => {
    await load(page, `
      <section id="m" data-effect="marquee"><span>One</span><span>Two</span></section>
      <p id="v" data-effect="slide-in" data-trigger="view-progress">Slides</p>`, { dir: 'rtl' });
    await expect(page.locator('#m > span').first()).toHaveCSS('animation-name', 'vb-marquee-rtl');
    const supports = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
    test.skip(!supports, 'no scroll-driven animations');
    const slot = await page.locator('#v').evaluate((el) => getComputedStyle(el).getPropertyValue('--vb-anim-entrance'));
    expect(slot).toContain('vb-slide-in-rtl');
  });

  test('marquee pauses while keyboard focus is inside', async ({ page }) => {
    await load(page, '<section id="m" data-effect="marquee"><a href="#a">One</a><span>Two</span></section>');
    const first = page.locator('#m > a');
    await expect(first).toHaveCSS('animation-play-state', 'running');
    await first.focus();
    await expect(first).toHaveCSS('animation-play-state', 'paused');
  });

  test('data-paused on an ancestor pauses slot loops and the glitch layers', async ({ page }) => {
    await load(page, `<section id="wrap" data-paused>
      <span id="p" data-effect="pulse">p</span>
      <h2 id="g" data-effect="glitch">G</h2></section>`);
    await expect(page.locator('#p')).toHaveCSS('animation-play-state', /paused/);
    await expect(page.locator('#g[data-effect-glitch-init]')).toHaveCount(1);
    const pseudo = await page.locator('#g').evaluate((el) => getComputedStyle(el, '::before').animationPlayState);
    expect(pseudo).toBe('paused');
  });

  test('typewriter .loop holds while paused', async ({ page }) => {
    await load(page, '<p id="t" data-effect="typewriter" class="loop" data-paused style="--vb-typewriter-speed: 5ms">Paused text</p>');
    await page.waitForTimeout(300);
    await expect(page.locator('#t .vb-typewriter-char:not([hidden])')).toHaveCount(0);
    await page.locator('#t').evaluate((el) => el.removeAttribute('data-paused'));
    await expect(page.locator('#t .vb-typewriter-char:not([hidden])')).not.toHaveCount(0);
  });

  test('blink stops after about five seconds', async ({ page }) => {
    await load(page, '<span id="b" data-effect="blink">Blink</span><span id="f" data-effect="blink" class="fast">Fast</span>');
    const count = (/** @type {string} */ id) => page.locator(id).evaluate((el) => getComputedStyle(el).animationIterationCount);
    expect(await count('#b')).toContain('5');
    expect(await count('#f')).toContain('12');
  });

  test('--vb-flip-ms accepts a number or a time', async ({ page }) => {
    await load(page, `<p id="a" data-effect="flipboard" style="--vb-flip-ms: 90">AB</p>
      <p id="b" data-effect="flipboard" style="--vb-flip-ms: 0.12s">AB</p>`);
    const d = (/** @type {string} */ id) => page.locator(id).evaluate((el) => el.style.getPropertyValue('--_vb-flip-duration'));
    await expect.poll(() => d('#a')).toBe('90ms');
    await expect.poll(() => d('#b')).toBe('120ms');
  });

  test('stamp injects its noise filter once', async ({ page }) => {
    await load(page, '<span data-effect="stamp">Paid</span><span data-effect="stamp">Void</span>');
    await expect(page.locator('#vb-stamp-noise')).toHaveCount(1);
  });
});

test.describe('reduced motion', () => {
  test('text effects leave the text as authored', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, `<p id="r" data-effect="reveal" data-trigger="scroll">Calm text</p>
      <p id="t" data-effect="typewriter">Typed text</p>`);
    await page.waitForTimeout(100);
    expect(await page.locator('#r').innerHTML()).toBe('Calm text');
    expect(await page.locator('#t').innerHTML()).toBe('Typed text');
  });
});
