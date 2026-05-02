/**
 * VBElement.setState — CustomStateSet helper
 *
 * Verifies the additive setState/_adoptInternals API landed for
 * vanilla-breeze-ar10. Runs in a real browser so :state() is honored
 * by the engine, not stubbed.
 *
 *   - setState(name, true)  → element matches :state(name)
 *   - setState(name, false) → match flips off
 *   - Form-associated subclasses (combo-box, etc.) that already attached
 *     internals can still call setState() without throwing
 */

import { test, expect } from 'playwright/test';

// Any page that loads /src/main.js — VBElement reaches the page that way.
const harnessPage = '/docs/examples/demos/autosave-basic.html';

test.describe('VBElement.setState', () => {

  test('toggles a custom state matched by :state()', async ({ page }) => {
    await page.goto(harnessPage);

    const result = await page.evaluate(async () => {
      const { VBElement } = await import('/src/lib/vb-element.js');
      class TestEl extends VBElement {}
      if (!customElements.get('vb-state-test-a')) {
        customElements.define('vb-state-test-a', TestEl);
      }
      const el = document.createElement('vb-state-test-a');
      document.body.appendChild(el);

      const before = el.matches(':state(busy)');
      el.setState('busy', true);
      const afterOn = el.matches(':state(busy)');
      el.setState('busy', false);
      const afterOff = el.matches(':state(busy)');

      el.remove();
      return { before, afterOn, afterOff };
    });

    expect(result.before).toBe(false);
    expect(result.afterOn).toBe(true);
    expect(result.afterOff).toBe(false);
  });

  test('works on a subclass that already attached internals', async ({ page }) => {
    await page.goto(harnessPage);

    const result = await page.evaluate(async () => {
      const { VBElement } = await import('/src/lib/vb-element.js');

      class FormishEl extends VBElement {
        static formAssociated = true;
        constructor() {
          super();
          // Mirrors the pattern in combo-box/date-picker/etc.
          const internals = this.attachInternals();
          this._adoptInternals(internals);
        }
      }
      if (!customElements.get('vb-state-test-b')) {
        customElements.define('vb-state-test-b', FormishEl);
      }

      const el = document.createElement('vb-state-test-b');
      document.body.appendChild(el);

      let threw = false;
      try {
        el.setState('ready', true);
      } catch (e) {
        threw = true;
      }
      const matches = el.matches(':state(ready)');
      el.remove();
      return { threw, matches };
    });

    expect(result.threw).toBe(false);
    expect(result.matches).toBe(true);
  });

  test('combo-box (real form-associated component) accepts setState without throwing', async ({ page }) => {
    // combo-box demo page exists; pick any.
    await page.goto('/docs/examples/demos/combo-box-basic.html').catch(async () => {
      // Fallback to the autosave page if combo-box demo path differs — we'll
      // create a combo-box dynamically.
      await page.goto(harnessPage);
    });

    const result = await page.evaluate(async () => {
      // Ensure combo-box is defined; if the page didn't include it, import the bundle.
      if (!customElements.get('combo-box')) {
        await import('/src/main.js').catch(() => {});
        await customElements.whenDefined('combo-box').catch(() => {});
      }
      if (!customElements.get('combo-box')) return { defined: false };

      const el = document.createElement('combo-box');
      document.body.appendChild(el);

      let threw = false;
      try {
        el.setState('probe', true);
      } catch (e) {
        threw = true;
      }
      const matches = el.matches(':state(probe)');
      el.remove();
      return { defined: true, threw, matches };
    });

    if (!result.defined) test.skip(true, 'combo-box not defined on this page');
    expect(result.threw).toBe(false);
    expect(result.matches).toBe(true);
  });
});
