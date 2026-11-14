// The Accessibility and Internationalization sections: the shipped skip link,
// the tables generated from each component's a11y block, the public helper
// exports the pages document, and the demos that carry the explanations.
import { test, expect } from 'playwright/test';

const DEMO = '/docs/snippets/demos';

test.describe('skip link (core CSS)', () => {
  test('is off screen until focused, then moves focus to main', async ({ page }) => {
    await page.goto(`${DEMO}/a11y-skip-link.html`);
    const link = page.locator('a.skip-link');
    await expect.poll(() => link.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThan(0);

    await page.locator('#restart').click();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await expect.poll(() => link.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);

    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });
});

test.describe('generated accessibility tables', () => {
  test('keyboard page lists keys per component from the manifests', async ({ page }) => {
    await page.goto('/docs/accessibility/keyboard/');
    const blocks = page.locator('#component-keys details[id^="keys-"]');
    expect(await blocks.count()).toBeGreaterThan(50);

    const tabs = page.locator('#keys-tab-set');
    await tabs.locator('summary').click();
    await expect(tabs.locator('tbody tr').first()).toBeVisible();
    await expect(tabs.locator('kbd').first()).toBeVisible();
    await expect(page.locator('#doc-article')).not.toContainText('generated:a11y');
  });

  test('names page has the roles table and the announcements table', async ({ page }) => {
    await page.goto('/docs/accessibility/names-and-announcements/');
    expect(await page.locator('#roles data-table tbody tr').count()).toBeGreaterThan(80);
    expect(await page.locator('#announcements table tbody tr').count()).toBeGreaterThan(10);
    // A pattern that follows the Authoring Practices links to it.
    await expect(page.locator('#roles a[href*="w3.org/WAI/ARIA/apg/patterns/"]').first()).toBeVisible();
  });
});

test.describe('public helpers', () => {
  test('the bundle exports the documented i18n and announce functions', async ({ page }) => {
    await page.goto(`${DEMO}/a11y-names.html`);
    const types = await page.evaluate(async () => {
      const m = await import('/cdn/vanilla-breeze.js');
      return ['VbI18n', 'getLocale', 'usableLocale', 'isRTL', 'announce'].map((k) => typeof m[k]);
    });
    expect(types).toEqual(['function', 'function', 'function', 'function', 'function']);
  });
});

test.describe('utilities added after load', () => {
  test('a guarded attribute that first appears later still loads its module', async ({ page }) => {
    // Nothing on this page has data-focus-trap at boot.
    await page.goto(`${DEMO}/a11y-names.html`);
    expect(await page.locator('[data-focus-trap]').count()).toBe(0);
    await page.evaluate(() => {
      const panel = document.createElement('section');
      panel.id = 'late';
      panel.setAttribute('data-focus-trap', '');
      panel.innerHTML = '<button type="button" id="late-a">A</button><button type="button" id="late-b">B</button>';
      document.body.append(panel);
    });
    // The trap moves focus in once its module has loaded...
    await expect(page.locator('#late-a')).toBeFocused();
    // ...and Tab from the last control wraps to the first.
    await page.keyboard.press('Tab');
    await expect(page.locator('#late-b')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#late-a')).toBeFocused();
  });
});

test.describe('demos', () => {
  test('focus trap keeps Tab inside the open panel and returns focus on close', async ({ page }) => {
    await page.goto(`${DEMO}/a11y-focus-trap.html`);
    await page.locator('#edit').click();
    await expect(page.locator('#name')).toBeFocused();
    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#panel'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#edit')).toBeFocused();
  });

  test('the language switch changes formats, quotation marks and direction', async ({ page }) => {
    await page.goto(`${DEMO}/i18n-switcher.html`);
    const story = page.locator('#story');
    await page.locator('label:has(input[value="de"])').click();
    await expect(story.locator('time')).toHaveText('9. März 2026');
    await expect(story.locator('data').first()).toContainText('1.249,50');

    await page.locator('label:has(input[value="ar"])').click();
    await expect(story).toHaveAttribute('dir', 'rtl');
    expect(await story.locator('h1').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
  });

  test('component strings take data-label-* translations', async ({ page }) => {
    await page.goto(`${DEMO}/i18n-labels.html`);
    const german = page.locator('section[lang="de"]');
    await expect(german.locator('date-picker button[aria-label="Kalender öffnen"]')).toHaveCount(1);
    await expect(german.locator('star-rating input[aria-label="1 Stern"]')).toHaveCount(1);
    await expect(german.locator('star-rating input[aria-label="2 Sterne"]')).toHaveCount(1);
  });
});
