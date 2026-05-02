/**
 * data-autosave behavior tests
 *
 * Covers the enhancements landed for vanilla-breeze-8iah:
 *   - Multi-select round-trip (correctness fix)
 *   - data-autosave-retain allowlist
 *   - Boolean data-autosave with auto-derived storage key
 */

import { test, expect } from 'playwright/test';

const basicPage = '/docs/examples/demos/autosave-basic.html';
const advancedPage = '/docs/examples/demos/autosave-advanced.html';

async function waitForInit(page) {
  await page.waitForSelector('form[data-autosave-init]', { timeout: 5000 });
}

async function clearVbStore(page) {
  await page.evaluate(() => {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vb:autosave:')) localStorage.removeItem(key);
    }
  });
}

test.describe('data-autosave — multi-select round-trip', () => {

  test('persists every selected option in <select multiple>', async ({ page }) => {
    await page.goto(basicPage);
    await waitForInit(page);
    await clearVbStore(page);

    await page.evaluate(() => {
      const select = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="topics"]'));
      ['css', 'a11y', 'performance'].forEach(value => {
        const opt = Array.from(select.options).find(o => o.value === value);
        if (opt) opt.selected = true;
      });
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Wait past the 500ms debounce
    await page.waitForTimeout(700);

    await page.reload();
    await waitForInit(page);

    const selected = await page.evaluate(() => {
      const select = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="topics"]'));
      return Array.from(select.selectedOptions).map(o => o.value).sort();
    });

    expect(selected).toEqual(['a11y', 'css', 'performance']);

    await clearVbStore(page);
  });
});

test.describe('data-autosave — selective retention', () => {

  test('only fields in data-autosave-retain are persisted', async ({ page }) => {
    await page.goto(advancedPage);
    await waitForInit(page);
    await clearVbStore(page);

    await page.fill('input[name="name"][id="ret-name"]', 'Ada Lovelace');
    await page.fill('input[name="email"][id="ret-email"]', 'ada@example.com');
    await page.fill('textarea[name="message"][id="ret-message"]', 'this should not be saved');

    await page.waitForTimeout(700);

    // Inspect the stored envelope directly — message must not appear.
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('vb:autosave:advanced-contact');
      if (!raw) return null;
      const env = JSON.parse(raw);
      return env.data;
    });

    expect(stored).not.toBeNull();
    expect(stored.name).toBe('Ada Lovelace');
    expect(stored.email).toBe('ada@example.com');
    expect(stored).not.toHaveProperty('message');

    await clearVbStore(page);
  });

  test('non-retained field is not restored even if previously stored', async ({ page }) => {
    await page.goto(advancedPage);
    await waitForInit(page);
    await clearVbStore(page);

    // Pre-seed the store with an extra field that is NOT in the retain list.
    await page.evaluate(() => {
      const env = {
        data: { name: 'Grace', email: 'grace@example.com', message: 'leaked' },
        timestamp: Date.now(),
      };
      localStorage.setItem('vb:autosave:advanced-contact', JSON.stringify(env));
    });

    await page.reload();
    await waitForInit(page);

    const messageValue = await page.locator('textarea[name="message"][id="ret-message"]').inputValue();
    const nameValue = await page.locator('input[name="name"][id="ret-name"]').inputValue();

    expect(nameValue).toBe('Grace');
    expect(messageValue).toBe('');

    await clearVbStore(page);
  });
});

test.describe('data-autosave — auto-derived storage key', () => {

  test('boolean data-autosave generates a stable key from method + action', async ({ page }) => {
    await page.goto(advancedPage);
    await waitForInit(page);
    await clearVbStore(page);

    // Form with action="/contact" method="post" data-autosave
    await page.fill('input[name="name"][id="adv-name"]', 'Linus');

    await page.waitForTimeout(700);

    const keys = await page.evaluate(() => {
      const out = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith('vb:autosave:')) out.push(k);
      }
      return out;
    });

    // Exactly one autosave entry, keyed by "post <resolved-action-url>"
    const matching = keys.filter(k => k.startsWith('vb:autosave:post '));
    expect(matching.length).toBe(1);
    expect(matching[0]).toContain('/contact');

    await clearVbStore(page);
  });
});
