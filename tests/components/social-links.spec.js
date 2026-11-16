/**
 * social-links: layout, variants and names, measured in the built demo.
 * The element renders nothing itself (Cook writes the list), so these
 * tests cover what the stylesheet promises.
 */
import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/social-links-basic.html';

test.describe('social-links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPage);
    await expect(page.locator('social-links').first()).toBeVisible();
  });

  test('items in a row share one baseline and carry no external-link arrow', async ({ page }) => {
    const row = page.locator('social-links').first();
    const tops = await row.locator('li').evaluateAll((items) => {
      const first = items[0].getBoundingClientRect().top;
      // Only items on the first line: the row wraps on a narrow screen.
      return items.map((li) => li.getBoundingClientRect().top).filter((t) => Math.abs(t - first) < 12);
    });
    expect(tops.length).toBeGreaterThan(1);
    expect(new Set(tops).size).toBe(1);

    const arrows = await row.locator('a').evaluateAll((links) => links.map((a) => getComputedStyle(a, '::after').content));
    expect(new Set(arrows)).toEqual(new Set(['none']));
  });

  test('each service draws its icon from a mask in the text colour', async ({ page }) => {
    const icons = page.locator('social-links').first().locator('.social-icon');
    const styles = await icons.evaluateAll((els) => els.map((el) => {
      const cs = getComputedStyle(el);
      return { mask: cs.maskImage || cs.webkitMaskImage, width: el.getBoundingClientRect().width, hidden: el.getAttribute('aria-hidden') };
    }));
    expect(styles.length).toBeGreaterThan(0);
    for (const s of styles) {
      expect(s.mask).toMatch(/^url\("data:image\/svg\+xml/);
      expect(s.width).toBeGreaterThan(0);
      expect(s.hidden).toBe('true');
    }
  });

  test('variant="icon" hides the label visually and keeps it as the link name', async ({ page }) => {
    const iconOnly = page.locator('social-links[variant="icon"]').first();
    const link = iconOnly.locator('a').first();
    const label = link.locator('span:not(.social-icon)');
    const text = (await label.textContent()).trim();
    expect(text.length).toBeGreaterThan(0);
    const box = await label.boundingBox();
    expect(box.width).toBeLessThanOrEqual(1);
    await expect(iconOnly.getByRole('link', { name: text })).toHaveCount(1);
  });

  test('variant="label" shows no icons', async ({ page }) => {
    const labelOnly = page.locator('social-links[variant="label"]').first();
    await expect(labelOnly.locator('.social-icon').first()).toBeHidden();
    await expect(labelOnly.locator('a').first()).toBeVisible();
  });

  test('color paints brand colours on the icons only', async ({ page }) => {
    const colored = page.locator('social-links[color]').first();
    const { icon, link } = await colored.locator('a').first().evaluate((a) => ({
      icon: getComputedStyle(a.querySelector('.social-icon')).backgroundColor,
      link: getComputedStyle(a).color,
    }));
    expect(icon).not.toBe(link);
  });

  test('an element with no list items takes no space', async ({ page }) => {
    const display = await page.evaluate(() => {
      const el = document.body.appendChild(document.createElement('social-links'));
      el.innerHTML = '<ul></ul>';
      return getComputedStyle(el).display;
    });
    expect(display).toBe('none');
  });
});
