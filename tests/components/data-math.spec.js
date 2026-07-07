/**
 * data-math behavior tests
 *
 * Verifies numbered equation linking and copy-to-clipboard behavior.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/data-math-basic.html';

test.describe('data-math', () => {
  test('moves source id to rendered wrapper for hash-link targeting', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const code = document.createElement('code');
      code.id = 'eq-math-test';
      code.dataset.testId = 'eq-math-source';
      code.setAttribute('data-math', 'numbered');
      code.setAttribute('data-mathml', "<math display='block'><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></math>");
      code.textContent = 'E = mc^2';
      document.body.appendChild(code);
    });

    const rendered = page.locator('[data-math-rendered]#eq-math-test');
    await expect(rendered).toHaveCount(1);
    await expect(rendered).toHaveAttribute('data-math-numbered', '');

    const sourceHasId = await page.evaluate(() => {
      return Boolean(document.querySelector('code[data-test-id="eq-math-source"]#eq-math-test'));
    });
    expect(sourceHasId).toBe(false);

    const indexed = await page.evaluate(() => {
      return window.VBMath?.equations?.find((entry) => entry.id === 'eq-math-test') || null;
    });
    expect(indexed).toBeTruthy();

    await page.evaluate(() => {
      window.location.hash = 'eq-math-test';
    });

    const isTarget = await page.evaluate(() => {
      const el = document.getElementById('eq-math-test');
      return el ? el.matches(':target') : false;
    });
    expect(isTarget).toBe(true);
  });

  test('copyable math writes LaTeX source to clipboard', async ({ page }) => {
    await page.addInitScript(() => {
      const clipboard = {
        writeText: async (text) => {
          window.__vbCopiedLatex = text;
        }
      };

      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: clipboard
      });
    });

    await page.goto(demoPage);
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const code = document.createElement('code');
      code.setAttribute('data-math', 'copyable');
      code.setAttribute('data-mathml', "<math display='block'><mi>x</mi></math>");
      code.textContent = 'x';
      document.body.appendChild(code);
    });

    const copyable = page.locator('[data-math-rendered][data-math-copyable]').last();
    await expect(copyable).toHaveCount(1);
    await copyable.click();

    await expect.poll(async () => {
      return page.evaluate(() => window.__vbCopiedLatex || null);
    }).toBe('x');
  });
});
