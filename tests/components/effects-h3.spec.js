/**
 * Effects review fixes, H3: data-transition presets, data-emoji, data-parallax.
 *
 * Covers: slide follows writing direction (slide:back / left / right), the
 * stagger delay ladder (classes + CSS rules, children added later, cleanup
 * of only the named children), names safe for odd ids, `none` freezing the
 * group; emoji tokens that never touch times, skip tags at any depth, name
 * attributes, attribute added later / removed, clones, undo-friendly input
 * replacement; parallax resting transform, group clipping, presets and both
 * reduced-motion switches (also for data-animate).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', modules = [], rootAttrs = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__effects-h3-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" ${rootAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}
      window.__ready = true;</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
}

const VB_MODULES = ['/src/lib/vb.js', '/src/lib/vb-transitions.js'];

/** Every rule's cssText in the page, flattened through @layer/@media/@supports/@import. */
const allRuleText = (page) => page.evaluate(() => {
  const out = [];
  const walk = (rules) => {
    for (const r of rules) {
      if (r.styleSheet) { try { walk(r.styleSheet.cssRules); } catch { /* cross-origin */ } }
      else if (r instanceof CSSGroupingRule && !(r instanceof CSSStyleRule)) walk(r.cssRules);
      else out.push(r.cssText);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules); } catch { /* cross-origin */ }
  }
  return out.join('\n');
});

/* ── data-transition presets ───────────────────────────────────────────── */

test.describe('data-transition presets', () => {
  test('slide follows the writing direction and honours its parameter', async ({ page }) => {
    await load(page, `
      <section id="a" data-transition="slide">A</section>
      <section id="b" data-transition="slide:back">B</section>
      <section id="c" data-transition="slide:right">C</section>
      <section id="d" dir="rtl" data-transition="slide">D</section>
      <section id="e" dir="rtl" data-transition="slide:back">E</section>
      <section id="f" dir="rtl" data-transition="slide:left">F</section>`, { modules: VB_MODULES });
    await page.waitForFunction(() => document.getElementById('f').style.viewTransitionClass !== '');
    const classes = await page.evaluate(() => Object.fromEntries(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => [id, document.getElementById(id).style.viewTransitionClass])));
    expect(classes).toEqual({
      a: 'slide-left', b: 'slide-right', c: 'slide-right',
      d: 'slide-right', e: 'slide-left', f: 'slide-left',
    });
  });

  test('fade, scale and none set their class and a valid name', async ({ page }) => {
    await load(page, `
      <article id="fa" data-transition="fade">x</article>
      <article id="sc" data-transition="scale">x</article>
      <nav id="no" data-transition="none">x</nav>
      <img id="photo.1" alt="" data-transition="morph">`, { modules: VB_MODULES });
    await page.waitForFunction(() => document.getElementById('no').style.viewTransitionClass !== '');
    const r = await page.evaluate(() => ({
      fa: [document.getElementById('fa').style.viewTransitionName, document.getElementById('fa').style.viewTransitionClass],
      sc: document.getElementById('sc').style.viewTransitionClass,
      no: document.getElementById('no').style.viewTransitionClass,
      // An id with a dot still yields a name the browser accepts.
      morph: getComputedStyle(document.getElementById('photo.1')).viewTransitionName,
    }));
    expect(r.fa).toEqual(['fade-fa', 'fade']);
    expect(r.sc).toBe('scale');
    expect(r.no).toBe('vt-none');
    expect(r.morph).not.toBe('none');
    expect(r.morph).toContain('morph-photo');
  });

  test('stagger names each child with a ladder class, follows later children, cleans up', async ({ page }) => {
    const items = Array.from({ length: 14 }, (_, i) => `<li>Item ${i}</li>`).join('');
    await load(page, `<ul id="list" data-transition="stagger">${items}</ul>`, { modules: VB_MODULES });
    await page.waitForFunction(() => document.querySelector('#list > li:last-child').style.viewTransitionClass !== '');
    const first = await page.evaluate(() => Array.from(document.querySelectorAll('#list > li'),
      (li) => li.style.viewTransitionClass));
    expect(first[0]).toBe('fade vt-stagger-0');
    expect(first[3]).toBe('fade vt-stagger-3');
    expect(first[11]).toBe('fade vt-stagger-11');
    expect(first[13]).toBe('fade vt-stagger-11'); // past the 12th: last rung

    const later = await page.evaluate(async () => {
      const list = document.getElementById('list');
      const removed = list.firstElementChild;
      removed.remove();
      const added = document.createElement('li');
      added.textContent = 'New';
      list.append(added);
      await new Promise((r) => setTimeout(r, 0));
      return {
        removedName: removed.style.viewTransitionName,
        addedName: added.style.viewTransitionName,
        firstClass: list.firstElementChild.style.viewTransitionClass,
      };
    });
    expect(later.removedName).toBe('');
    expect(later.addedName).not.toBe('');
    expect(later.firstClass).toBe('fade vt-stagger-0');

    // The ladder exists in CSS and the step is a root token.
    const rules = await allRuleText(page);
    for (let i = 1; i < 12; i++) expect(rules).toContain(`::view-transition-new(*.vt-stagger-${i})`);
    const step = await page.evaluate(() => getComputedStyle(document.documentElement)
      .getPropertyValue('--view-transition-stagger').trim());
    expect(step).toBe('40ms');
  });

  test('none also freezes the group; reduced motion zeroes delays', async ({ page }) => {
    await load(page, '', { modules: VB_MODULES });
    const rules = await allRuleText(page);
    expect(rules).toMatch(/::view-transition-group\(\*\.vt-none\)[^{]*\{[^}]*animation-duration: 0s/);
    expect(rules).toMatch(/:root\[data-motion-reduced\] ::view-transition-group\(\*\)[^{]*\{[^}]*animation-delay: 0s !important/);
  });
});

/* ── data-emoji ─────────────────────────────────────────────────────────── */

const EMOJI_MODULES = ['/src/utils/emoji-init.js'];
const waitEmoji = (page, sel, text) => page.waitForFunction(
  ([s, t]) => document.querySelector(s)?.textContent.includes(t), [sel, text]);

test.describe('data-emoji', () => {
  test('strip removes only shortcode-shaped tokens; times and ratios survive', async ({ page }) => {
    await load(page, `
      <p id="p" data-emoji data-emoji-unknown="strip">Meet at 10:30:45 :wave: ratio a:b:c :nope_code: end :30: :fire::rocket:</p>
      <p id="k" data-emoji>foo:bar:wave: and :x::wave:</p>`, { modules: EMOJI_MODULES });
    await waitEmoji(page, '#p', '👋');
    const r = await page.evaluate(() => ({
      p: document.getElementById('p').textContent,
      k: document.getElementById('k').textContent,
    }));
    expect(r.p).toBe('Meet at 10:30:45 👋 ratio a:b:c  end :30: 🔥🚀');
    expect(r.k).toBe('foo:bar:wave: and ❌👋');
  });

  test('skips code, pre, kbd, samp, var and data-emoji-skip at any depth', async ({ page }) => {
    await load(page, `
      <article id="a" data-emoji>
        <p id="ok">Yes :wave:</p>
        <pre><code><span id="hl">:wave:</span></code></pre>
        <p><kbd><b id="kb">:wave:</b></kbd> <samp id="sa">:wave:</samp> <var id="va">:wave:</var></p>
        <p data-emoji-skip><em id="sk">:wave:</em></p>
      </article>
      <code><span id="inner" data-emoji>:wave:</span></code>`, { modules: EMOJI_MODULES });
    await waitEmoji(page, '#ok', '👋');
    const r = await page.evaluate(() => ['hl', 'kb', 'sa', 'va', 'sk', 'inner']
      .map((id) => document.getElementById(id).textContent));
    // Only the container that is itself inside <code> opted in on purpose.
    expect(r).toEqual([':wave:', ':wave:', ':wave:', ':wave:', ':wave:', '👋']);
  });

  test('converts alt, title and aria-label so the accessible name matches', async ({ page }) => {
    await load(page, `
      <figure id="f" data-emoji aria-label="Launch :rocket:">
        <img id="i" alt="Party :tada:" title="Time 10:30:45" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
        <figcaption>Launch :rocket:</figcaption>
      </figure>`, { modules: EMOJI_MODULES });
    await waitEmoji(page, '#f figcaption', '🚀');
    const r = await page.evaluate(() => ({
      label: document.getElementById('f').getAttribute('aria-label'),
      alt: document.getElementById('i').alt,
      title: document.getElementById('i').title,
    }));
    expect(r).toEqual({ label: 'Launch 🚀', alt: 'Party 🎉', title: 'Time 10:30:45' });
  });

  test('picks up data-emoji added later; removing it stops observe mode', async ({ page }) => {
    await load(page, `<p id="late">Hi :wave:</p>
      <section id="obs" data-emoji data-emoji-scan="observe"><p>Start :fire:</p></section>`,
    { modules: EMOJI_MODULES });
    await waitEmoji(page, '#obs', '🔥');
    await page.evaluate(() => document.getElementById('late').setAttribute('data-emoji', ''));
    await waitEmoji(page, '#late', '👋');

    await page.evaluate(() => {
      const obs = document.getElementById('obs');
      obs.removeAttribute('data-emoji');
      const p = document.createElement('p');
      p.id = 'after';
      p.textContent = 'After :rocket:';
      obs.append(p);
    });
    await page.waitForTimeout(300);
    expect(await page.textContent('#after')).toBe('After :rocket:');
  });

  test('a clone of an enhanced input is enhanced on its own', async ({ page }) => {
    await load(page, '<form id="f"><input id="a" type="text" data-emoji></form>', { modules: EMOJI_MODULES });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const a = document.getElementById('a');
      const b = /** @type {HTMLInputElement} */ (a.cloneNode(true));
      b.id = 'b';
      document.getElementById('f').append(b);
    });
    expect(await page.getAttribute('#b', 'data-emoji-init')).toBeNull();
    await page.waitForTimeout(100);
    await page.locator('#b').pressSequentially('hi :wave: there');
    await expect(page.locator('#b')).toHaveValue('hi 👋 there');
  });

  test('typed replacement keeps the caret and can be undone', async ({ page, browserName }) => {
    await load(page, '<textarea id="t" data-emoji></textarea>', { modules: EMOJI_MODULES });
    await page.waitForTimeout(100);
    const t = page.locator('#t');
    await t.pressSequentially('one :fire:');
    await expect(t).toHaveValue('one 🔥');
    await t.pressSequentially(' two');
    await expect(t).toHaveValue('one 🔥 two');
    // Caret in the middle: replacing an earlier token keeps it put.
    await page.evaluate(() => {
      const el = /** @type {HTMLTextAreaElement} */ (document.getElementById('t'));
      el.setSelectionRange(0, 0);
    });
    await t.pressSequentially(':x:');
    expect(await page.evaluate(() => {
      const el = /** @type {HTMLTextAreaElement} */ (document.getElementById('t'));
      return [el.value, el.selectionStart];
    })).toEqual(['❌one 🔥 two', 1]);

    if (browserName === 'chromium') {
      await page.keyboard.press('ControlOrMeta+z');
      await expect(t).toHaveValue(':x:one 🔥 two');
      // The restored shortcode is not re-replaced by the next keystroke.
      await page.keyboard.press('End');
      await t.pressSequentially('!');
      await expect(t).toHaveValue(':x:one 🔥 two!');
    }
  });

  test('pasted text and a synthetic input event replace every token', async ({ page }) => {
    await load(page, '<textarea id="t" data-emoji></textarea>', { modules: EMOJI_MODULES });
    await page.waitForTimeout(100);
    await page.locator('#t').focus();
    await page.evaluate(() => {
      const el = /** @type {HTMLTextAreaElement} */ (document.getElementById('t'));
      el.value = 'a :fire: b :rocket: c';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('#t')).toHaveValue('a 🔥 b 🚀 c');
  });
});

/* ── data-parallax / data-animate ──────────────────────────────────────── */

test.describe('data-parallax', () => {
  const HERO = `
    <section id="g" data-parallax-group>
      <figure id="layer" data-parallax="medium"></figure>
      <h2>Copy</h2>
    </section>
    <p id="anim" data-animate="fade-up">Reveal</p>`;

  test('group clips and isolates; presets set the custom properties', async ({ page }) => {
    await load(page, HERO);
    const r = await page.evaluate(() => {
      const g = getComputedStyle(document.getElementById('g'));
      const l = getComputedStyle(document.getElementById('layer'));
      return {
        overflow: g.overflowY, isolation: g.isolation,
        to: l.getPropertyValue('--vb-parallax-to').trim(),
        scale: l.getPropertyValue('--vb-parallax-scale').trim(),
      };
    });
    expect(r).toEqual({ overflow: 'clip', isolation: 'isolate', to: '-12%', scale: '1.08' });
  });

  test('animates and promotes the layer only while motion is allowed', async ({ page }) => {
    await load(page, HERO);
    const supported = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
    test.skip(!supported, 'scroll-driven animations unsupported in this engine');
    const r = await page.evaluate(() => {
      const l = getComputedStyle(document.getElementById('layer'));
      return { name: l.animationName, willChange: l.willChange };
    });
    expect(r).toEqual({ name: 'vb-parallax', willChange: 'transform' });
  });

  for (const mode of ['media', 'switch']) {
    test(`reduced motion (${mode}) stops parallax and data-animate at the resting state`, async ({ page }) => {
      if (mode === 'media') await page.emulateMedia({ reducedMotion: 'reduce' });
      await load(page, HERO, { rootAttrs: mode === 'switch' ? 'data-motion-reduced' : '' });
      const r = await page.evaluate(() => {
        const l = getComputedStyle(document.getElementById('layer'));
        const a = getComputedStyle(document.getElementById('anim'));
        return {
          name: l.animationName, willChange: l.willChange, transform: l.transform,
          animName: a.animationName, animOpacity: a.opacity,
        };
      });
      expect(r.name).toBe('none');
      expect(r.willChange).toBe('auto');
      // translateY(0%) scale(1.08): the scale stays so the edges stay hidden.
      expect(r.transform).toMatch(/^matrix\(1\.08, 0, 0, 1\.08, 0, 0\)$/);
      expect(r.animName).toBe('none');
      expect(r.animOpacity).toBe('1');
    });
  }
});
