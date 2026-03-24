/**
 * Split Surface Web Component Behavior Tests
 *
 * Tests rendering, keyboard navigation, reconnect lifecycle,
 * and edge-case attribute handling for the split-surface component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/split-surface-basic.html';

/** Wait for split-surface WC to initialize */
async function waitForSurface(page) {
  await page.waitForSelector('split-surface[data-upgraded]', { timeout: 5000 });
}

test.describe('split-surface', () => {

  test('renders with data-upgraded and a divider', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const result = await page.evaluate(() => {
      const surface = document.querySelector('split-surface');
      const divider = surface.querySelector('.split-divider');
      return {
        upgraded: surface.hasAttribute('data-upgraded'),
        hasDivider: divider !== null,
        dividerRole: divider?.getAttribute('role'),
      };
    });

    expect(result.upgraded).toBe(true);
    expect(result.hasDivider).toBe(true);
    expect(result.dividerRole).toBe('separator');
  });

  test('divider has role=separator with ARIA attributes', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const result = await page.evaluate(() => {
      const divider = document.querySelector('split-surface .split-divider');
      return {
        role: divider.getAttribute('role'),
        orientation: divider.getAttribute('aria-orientation'),
        valuenow: divider.getAttribute('aria-valuenow'),
        valuemin: divider.getAttribute('aria-valuemin'),
        valuemax: divider.getAttribute('aria-valuemax'),
        label: divider.getAttribute('aria-label'),
        tabindex: divider.getAttribute('tabindex'),
      };
    });

    expect(result.role).toBe('separator');
    expect(result.orientation).toBeTruthy();
    expect(result.valuenow).toBeTruthy();
    expect(result.valuemin).toBeTruthy();
    expect(result.valuemax).toBeTruthy();
    expect(result.label).toBe('Resize panels');
    expect(result.tabindex).toBe('0');
  });

  test('keyboard: ArrowRight moves the divider position', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const before = await page.evaluate(() => {
      const divider = document.querySelector('split-surface .split-divider');
      return Number(divider.getAttribute('aria-valuenow'));
    });

    const divider = page.locator('split-surface .split-divider').first();
    await divider.focus();
    await page.keyboard.press('ArrowRight');

    const after = await page.evaluate(() => {
      const divider = document.querySelector('split-surface .split-divider');
      return Number(divider.getAttribute('aria-valuenow'));
    });

    expect(after).toBe(before + 1);
  });

  test('reconnect does not duplicate the divider', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const dividerCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const surface = document.querySelector('split-surface');
        const parent = surface.parentElement;

        parent.removeChild(surface);
        parent.appendChild(surface);

        requestAnimationFrame(() => {
          // Wait for connectedCallback to run
          requestAnimationFrame(() => {
            const count = surface.querySelectorAll('.split-divider').length;
            resolve(count);
          });
        });
      });
    });

    expect(dividerCount).toBe(1);
  });

  test('position=0 is honored', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const position = await page.evaluate(() => {
      const surface = document.createElement('split-surface');
      surface.setAttribute('position', '0');
      surface.setAttribute('min', '0');

      const panelA = document.createElement('div');
      panelA.textContent = 'A';
      const panelB = document.createElement('div');
      panelB.textContent = 'B';

      surface.appendChild(panelA);
      surface.appendChild(panelB);
      document.body.appendChild(surface);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const divider = surface.querySelector('.split-divider');
          const valuenow = divider?.getAttribute('aria-valuenow');
          resolve(Number(valuenow));
        });
      });
    });

    expect(position).toBe(0);
  });

});
