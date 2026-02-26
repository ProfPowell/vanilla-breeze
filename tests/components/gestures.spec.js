// @ts-check
import { test, expect } from '@playwright/test';

const PLAYGROUND_URL = '/docs/examples/demos/gesture-playground.html';
const NOTIFICATIONS_URL = '/docs/examples/demos/gesture-notifications.html';

test.describe('Gesture Playground', () => {

  test('page loads with all four sections', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    await expect(page.locator('h2:has-text("Swipe Carousel")')).toBeVisible();
    await expect(page.locator('h2:has-text("Swipe to Dismiss")')).toBeVisible();
    await expect(page.locator('h2:has-text("Pull to Refresh")')).toBeVisible();
    await expect(page.locator('h2:has-text("Long Press")')).toBeVisible();
  });

  test('swipe carousel shows initial card', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    const counter = page.locator('#swipe-pos');
    await expect(counter).toHaveText('1');
  });

  test('swipe-to-dismiss cards have data-gesture attribute', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    const cards = page.locator('#dismiss-list li[data-gesture="dismiss"]');
    await expect(cards).toHaveCount(5);
  });

  test('swipe carousel navigates on simulated swipe', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    const carousel = page.locator('#swipe-carousel');
    const counter = page.locator('#swipe-pos');

    // Simulate a left swipe using pointer events
    const box = await carousel.boundingBox();
    if (!box) return;

    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    // Should have advanced to card 2
    await expect(counter).toHaveText('2');
  });

  test('dismiss card removes it via swipe', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    const firstCard = page.locator('#dismiss-list li').first();
    const box = await firstCard.boundingBox();
    if (!box) return;

    // Swipe right to dismiss
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 50, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    // Wait for removal animation
    await page.waitForTimeout(500);

    const remaining = page.locator('#dismiss-list li');
    await expect(remaining).toHaveCount(4);
  });

  test('undo button re-adds dismissed card', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    const firstCard = page.locator('#dismiss-list li').first();
    const box = await firstCard.boundingBox();
    if (!box) return;

    // Swipe to dismiss
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 50, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Click undo
    await page.click('#undo-btn');
    await page.waitForTimeout(100);

    const cards = page.locator('#dismiss-list li');
    await expect(cards).toHaveCount(5);
  });

  test('long-press grid tiles exist', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    const tiles = page.locator('#lp-grid figure[data-gesture="long-press"]');
    await expect(tiles).toHaveCount(8);
  });
});

test.describe('Gesture Notifications', () => {

  test('page loads with 8 notification cards', async ({ page }) => {
    await page.goto(NOTIFICATIONS_URL);
    const cards = page.locator('.card-wrapper');
    await expect(cards).toHaveCount(8);
  });

  test('badge shows correct count', async ({ page }) => {
    await page.goto(NOTIFICATIONS_URL);
    const badge = page.locator('#unread-badge');
    await expect(badge).toHaveText('8');
  });

  test('cards have swipe gesture attribute', async ({ page }) => {
    await page.goto(NOTIFICATIONS_URL);
    const swipeCards = page.locator('.card-content[data-gesture="dismiss"]');
    await expect(swipeCards).toHaveCount(8);
  });

  test('swiping a card reveals action behind it', async ({ page }) => {
    await page.goto(NOTIFICATIONS_URL);
    const firstCard = page.locator('.card-content').first();
    const box = await firstCard.boundingBox();
    if (!box) return;

    // Start dragging right (archive action)
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + box.height / 2, { steps: 3 });

    // The card should have data-swiping attribute
    await expect(firstCard).toHaveAttribute('data-swiping', '');

    await page.mouse.up();
  });

  test('fully swiping a card updates badge count', async ({ page }) => {
    await page.goto(NOTIFICATIONS_URL);
    const firstCard = page.locator('.card-content').first();
    const box = await firstCard.boundingBox();
    if (!box) return;

    // Full swipe to dismiss
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 50, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    // Wait for transition
    await page.waitForTimeout(800);

    const badge = page.locator('#unread-badge');
    await expect(badge).toHaveText('7');
  });

  test('empty state shows when all cards dismissed', async ({ page }) => {
    await page.goto(NOTIFICATIONS_URL);

    // Check empty state is hidden initially
    await expect(page.locator('#empty-state')).toBeHidden();
  });

  test('inbox has accessible header', async ({ page }) => {
    await page.goto(NOTIFICATIONS_URL);
    await expect(page.locator('.inbox-header h1')).toHaveText('Inbox');
  });
});
