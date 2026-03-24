/**
 * Carousel Web Component Behavior Tests
 *
 * Tests navigation, indicators, keyboard controls, lifecycle safety,
 * and autoplay behavior for the carousel-wc component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/carousel-basic.html';

test.describe('carousel-wc — baseline', () => {

  test('renders carousel with slides and controls', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const carousel = page.locator('carousel-wc').first();
    await expect(carousel).toBeVisible();
    await expect(carousel).toHaveAttribute('role', 'region');
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
  });

  test('has prev and next buttons', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const prev = page.locator('carousel-wc .carousel-prev').first();
    const next = page.locator('carousel-wc .carousel-next').first();

    await expect(prev).toHaveAttribute('aria-label', 'Previous slide');
    await expect(next).toHaveAttribute('aria-label', 'Next slide');
  });

  test('track is keyboard accessible', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const track = page.locator('carousel-wc .carousel-track').first();
    await track.focus();
    await expect(track).toBeFocused();
  });

  test('slides have proper ARIA roles', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const slides = page.locator('carousel-wc .carousel-track > [role="group"]');
    const count = await slides.count();
    expect(count).toBeGreaterThan(0);

    await expect(slides.first()).toHaveAttribute('aria-roledescription', 'slide');
  });
});

test.describe('carousel-wc — navigation', () => {

  test('next button advances to next slide', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const next = page.locator('carousel-wc .carousel-next').first();
    const liveRegion = page.locator('carousel-wc .carousel-live').first();

    await next.click();
    await expect(liveRegion).toContainText('Slide 2');
  });

  test('prev button goes back', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const next = page.locator('carousel-wc .carousel-next').first();
    const prev = page.locator('carousel-wc .carousel-prev').first();
    const liveRegion = page.locator('carousel-wc .carousel-live').first();

    await next.click();
    await expect(liveRegion).toContainText('Slide 2');

    await prev.click();
    await expect(liveRegion).toContainText('Slide 1');
  });

  test('prev button is disabled at start (non-loop)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const carousel = page.locator('carousel-wc').first();
    const hasLoop = await carousel.getAttribute('loop');
    if (hasLoop !== null) return;

    const prev = carousel.locator('.carousel-prev');
    await expect(prev).toBeDisabled();
  });
});

test.describe('carousel-wc — keyboard', () => {

  test('ArrowRight advances slide', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const track = page.locator('carousel-wc .carousel-track').first();
    const liveRegion = page.locator('carousel-wc .carousel-live').first();

    await track.focus();
    await page.keyboard.press('ArrowRight');
    await expect(liveRegion).toContainText('Slide 2');
  });

  test('ArrowLeft goes back', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const track = page.locator('carousel-wc .carousel-track').first();
    const liveRegion = page.locator('carousel-wc .carousel-live').first();

    await track.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await expect(liveRegion).toContainText('Slide 1');
  });

  test('Home goes to first slide', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const track = page.locator('carousel-wc .carousel-track').first();
    const liveRegion = page.locator('carousel-wc .carousel-live').first();

    await track.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Home');
    await expect(liveRegion).toContainText('Slide 1');
  });

  test('End goes to last slide', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const track = page.locator('carousel-wc .carousel-track').first();
    const liveRegion = page.locator('carousel-wc .carousel-live').first();

    await track.focus();
    await page.keyboard.press('End');

    const text = await liveRegion.textContent();
    expect(text).toMatch(/Slide \d+ of \d+/);
    // Should be the last slide
    const match = text.match(/Slide (\d+) of (\d+)/);
    expect(match[1]).toBe(match[2]);
  });
});

test.describe('carousel-wc — indicators', () => {

  test('indicators use aria-current instead of tab semantics', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const indicators = page.locator('carousel-wc .carousel-indicators').first();
    if (await indicators.count() === 0) return;

    // Should NOT have tablist role
    const role = await indicators.getAttribute('role');
    expect(role).not.toBe('tablist');

    // Dots should NOT have tab role
    const firstDot = indicators.locator('button').first();
    const dotRole = await firstDot.getAttribute('role');
    expect(dotRole).not.toBe('tab');

    // Active dot uses aria-current
    await expect(firstDot).toHaveAttribute('aria-current', 'true');
  });

  test('clicking indicator navigates to that slide', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const indicators = page.locator('carousel-wc .carousel-indicators').first();
    if (await indicators.count() === 0) return;

    const dots = indicators.locator('button');
    const liveRegion = page.locator('carousel-wc .carousel-live').first();

    await dots.nth(2).click();
    await expect(liveRegion).toContainText('Slide 3');
    await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
    await expect(dots.first()).toHaveAttribute('aria-current', 'false');
  });
});

test.describe('carousel-wc — lifecycle', () => {

  test('reconnect does not duplicate controls', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const controlCount = await page.evaluate(() => {
      const carousel = document.querySelector('carousel-wc');
      const parent = carousel.parentElement;

      // Count controls before reconnect
      const beforePrev = carousel.querySelectorAll('.carousel-prev').length;
      const beforeNext = carousel.querySelectorAll('.carousel-next').length;

      // Disconnect and reconnect
      parent.removeChild(carousel);
      parent.appendChild(carousel);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          resolve({
            beforePrev,
            beforeNext,
            afterPrev: carousel.querySelectorAll('.carousel-prev').length,
            afterNext: carousel.querySelectorAll('.carousel-next').length,
          });
        });
      });
    });

    // Controls should not have doubled
    expect(controlCount.afterPrev).toBe(controlCount.beforePrev);
    expect(controlCount.afterNext).toBe(controlCount.beforeNext);
  });

  test('reconnect does not duplicate change events', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('carousel-wc[data-upgraded]');

    const eventCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const carousel = document.querySelector('carousel-wc');
        const parent = carousel.parentElement;

        // Disconnect and reconnect
        parent.removeChild(carousel);
        parent.appendChild(carousel);

        requestAnimationFrame(() => {
          let count = 0;
          carousel.addEventListener('carousel-wc:change', () => count++);

          // Click next
          carousel.querySelector('.carousel-next').click();

          setTimeout(() => resolve(count), 200);
        });
      });
    });

    expect(eventCount).toBe(1);
  });
});
