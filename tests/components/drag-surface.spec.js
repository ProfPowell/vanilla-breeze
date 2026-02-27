/**
 * Drag Surface Web Component Behavior Tests
 *
 * Tests keyboard reorder, visual state attributes, event dispatch,
 * and accessibility for the drag-surface component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/drag-surface-basic.html';
const kanbanPage = '/demos/examples/demos/drag-surface-kanban.html';

/** Wait for drag-surface WC to initialize */
async function waitForSurface(page) {
  await page.waitForSelector('drag-surface[role="list"]', { timeout: 5000 });
}

test.describe('drag-surface', () => {

  test('renders with role="list" and children as listitems', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const result = await page.evaluate(() => {
      const surface = document.querySelector('drag-surface');
      const items = surface.querySelectorAll(':scope > [draggable="true"]');
      return {
        role: surface.getAttribute('role'),
        itemCount: items.length,
        allHaveRole: [...items].every(el => el.getAttribute('role') === 'listitem'),
        allHaveTabindex: [...items].every(el => el.getAttribute('tabindex') === '0'),
        allHaveGrabbed: [...items].every(el => el.getAttribute('aria-grabbed') === 'false'),
      };
    });

    expect(result.role).toBe('list');
    expect(result.itemCount).toBeGreaterThan(1);
    expect(result.allHaveRole).toBe(true);
    expect(result.allHaveTabindex).toBe(true);
    expect(result.allHaveGrabbed).toBe(true);
  });

  test('has a live region for screen reader announcements', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const hasLiveRegion = await page.evaluate(() => {
      return document.querySelector('drag-surface [aria-live="polite"]') !== null;
    });
    expect(hasLiveRegion).toBe(true);
  });

  test('keyboard: Space grabs and drops an item', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const firstItem = page.locator('drag-surface [draggable="true"]').first();
    await firstItem.focus();
    await page.keyboard.press('Space');

    // Item should be grabbed
    const grabbed = await firstItem.getAttribute('aria-grabbed');
    expect(grabbed).toBe('true');

    const reorderMode = await page.evaluate(() =>
      document.querySelector('drag-surface').hasAttribute('data-reorder-mode')
    );
    expect(reorderMode).toBe(true);

    // Drop it
    await page.keyboard.press('Space');

    const grabbedAfter = await firstItem.getAttribute('aria-grabbed');
    expect(grabbedAfter).toBe('false');
  });

  test('keyboard: arrow keys reorder grabbed item', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const items = page.locator('drag-surface [draggable="true"]');
    const firstId = await items.first().getAttribute('data-id');

    // Grab first item
    await items.first().focus();
    await page.keyboard.press('Space');

    // Move down
    await page.keyboard.press('ArrowDown');

    // Drop
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // First item should now be second
    const newFirstId = await items.first().getAttribute('data-id');
    expect(newFirstId).not.toBe(firstId);
  });

  test('keyboard: Escape cancels reorder', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const items = page.locator('drag-surface [draggable="true"]');
    const firstId = await items.first().getAttribute('data-id');

    // Grab and move
    await items.first().focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');

    // Cancel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Should be back to original position
    const restoredFirstId = await items.first().getAttribute('data-id');
    expect(restoredFirstId).toBe(firstId);
  });

  test('keyboard: fires drag-surface:reorder event', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    await page.evaluate(() => {
      window.__reorderEvent = null;
      document.querySelector('drag-surface').addEventListener('drag-surface:reorder', (e) => {
        window.__reorderEvent = {
          itemId: e.detail.itemId,
          oldIndex: e.detail.oldIndex,
          newIndex: e.detail.newIndex,
          order: e.detail.order,
        };
      });
    });

    const firstItem = page.locator('drag-surface [draggable="true"]').first();
    await firstItem.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    const event = await page.evaluate(() => window.__reorderEvent);
    expect(event).toBeTruthy();
    expect(event.oldIndex).toBe(0);
    expect(event.newIndex).toBe(1);
    expect(Array.isArray(event.order)).toBe(true);
  });

  test('keyboard: arrow navigation between items without grab', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const items = page.locator('drag-surface [draggable="true"]');
    const secondId = await items.nth(1).getAttribute('data-id');

    await items.first().focus();
    await page.keyboard.press('ArrowDown');

    const focusedId = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-id')
    );
    expect(focusedId).toBe(secondId);
  });

  test('flash animation on drop', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    const firstItem = page.locator('drag-surface [draggable="true"]').first();

    await firstItem.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    // data-just-dropped should appear briefly
    const hasFlash = await page.evaluate(() => {
      return [...document.querySelectorAll('drag-surface [draggable="true"]')]
        .some(el => el.hasAttribute('data-just-dropped'));
    });
    expect(hasFlash).toBe(true);
  });

  test('disabled state prevents keyboard grab', async ({ page }) => {
    await page.goto(demoPage);
    await waitForSurface(page);

    await page.evaluate(() => {
      document.querySelector('drag-surface').setAttribute('data-drag-disabled', '');
    });

    const firstItem = page.locator('drag-surface [draggable="true"]').first();
    await firstItem.focus();
    await page.keyboard.press('Space');

    const isGrabbed = await firstItem.getAttribute('aria-grabbed');
    expect(isGrabbed).toBe('false');
  });

});

test.describe('drag-surface cross-surface transfer', () => {

  test('keyboard: transfer item between grouped surfaces', async ({ page }) => {
    await page.goto(kanbanPage);
    await page.waitForSelector('drag-surface[role="list"]', { timeout: 5000 });

    const surfaceCount = await page.locator('drag-surface[data-group]').count();
    if (surfaceCount < 2) return;

    const result = await page.evaluate(() => {
      const surfaces = document.querySelectorAll('drag-surface[data-group]');
      const firstSurface = surfaces[0];
      const firstItem = firstSurface.querySelector('[draggable="true"]');
      return { itemId: firstItem?.dataset.id, surfaceCount: surfaces.length };
    });

    if (!result.itemId) return;

    const firstItem = page.locator(`drag-surface[data-group] [data-id="${result.itemId}"]`);
    await firstItem.focus();
    await page.keyboard.press('Space');

    // Transfer to next surface (perpendicular arrow)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Item should now be in a different surface
    const newParent = await page.evaluate((id) => {
      const item = document.querySelector(`[data-id="${id}"]`);
      const surfaces = document.querySelectorAll('drag-surface[data-group]');
      for (let i = 0; i < surfaces.length; i++) {
        if (surfaces[i].contains(item)) return i;
      }
      return -1;
    }, result.itemId);

    // Should have moved from surface 0 to surface 1
    expect(newParent).toBe(1);
  });

});
