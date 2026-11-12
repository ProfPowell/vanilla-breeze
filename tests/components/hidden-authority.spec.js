/**
 * [hidden] is authoritative (vanilla-breeze-yvec).
 *
 * Components hide author-provided children with the hidden attribute
 * (carousel slides, filtered changelog entries, table rows…). The UA rule
 * is a plain display:none, so any author/theme/component rule that sets
 * display used to un-hide them. src/base/reset.css now locks
 * [hidden]:not([hidden="until-found"]) with !important in the reset layer.
 */
import { test, expect } from 'playwright/test';

// Any built page that loads the VB stylesheet
const page404 = '/docs/examples/demos/accordion-basic.html';

test.describe('[hidden] authority', () => {
  test('hidden beats an unlayered author display rule', async ({ page }) => {
    await page.goto(page404);
    const display = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '.author-grid { display: grid; } #theme-flex { display: flex; }';
      document.head.append(style);
      const a = Object.assign(document.createElement('section'), { className: 'author-grid', hidden: true });
      const b = Object.assign(document.createElement('article'), { id: 'theme-flex', hidden: true });
      document.body.append(a, b);
      return [getComputedStyle(a).display, getComputedStyle(b).display];
    });
    expect(display).toEqual(['none', 'none']);
  });

  test('removing hidden restores the author display', async ({ page }) => {
    await page.goto(page404);
    const display = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '.author-grid { display: grid; }';
      document.head.append(style);
      const el = Object.assign(document.createElement('section'), { className: 'author-grid', hidden: true });
      document.body.append(el);
      el.hidden = false;
      return getComputedStyle(el).display;
    });
    expect(display).toBe('grid');
  });

  test('hidden="until-found" stays rendered for find-in-page', async ({ page }) => {
    await page.goto(page404);
    const display = await page.evaluate(() => {
      const el = document.createElement('section');
      el.setAttribute('hidden', 'until-found');
      el.textContent = 'findable';
      document.body.append(el);
      return getComputedStyle(el).display;
    });
    expect(display).not.toBe('none');
  });

  test('changelog version filter hides the other releases', async ({ page }) => {
    await page.goto('/changelog/');
    const select = page.locator('time-index [data-timeline-controls] select[data-timeline-version]');
    await expect(select).toBeVisible();
    await select.selectOption('v0.3.0');
    await expect(page.locator('section#v0-3-0')).toBeVisible();
    await expect(page.locator('section#v0-4-1')).toBeHidden();
    await select.selectOption('');
    await expect(page.locator('section#v0-4-1')).toBeVisible();
  });
});
