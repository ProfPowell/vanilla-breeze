/**
 * Page Tour Behavior Tests
 *
 * Tests initialization, navigation, keyboard, action gating, modes,
 * persistence, triggers, accessibility, multiple tours, and reduced motion.
 */

import { test, expect } from 'playwright/test';

const basicPage = '/docs/examples/demos/page-tour-basic.html';
const activePage = '/docs/examples/demos/page-tour-active.html';
const forcedPage = '/docs/examples/demos/page-tour-forced.html';
const buttonPage = '/docs/examples/demos/page-tour-button.html';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForTour(page, selector = 'page-tour') {
  await page.waitForSelector(`${selector}[data-upgraded]`, { state: 'attached', timeout: 5000 });
}

async function startTour(page) {
  await waitForTour(page);
  // Use the external data-tour button (start button inside <details> is hidden when JS active)
  await page.locator('[data-tour="demo-tour"]').click();
  await page.waitForSelector('.page-tour-card', { timeout: 3000 });
}

async function startTourViaApi(page) {
  await waitForTour(page);
  await page.evaluate(() => document.querySelector('page-tour').start());
  await page.waitForSelector('.page-tour-card', { timeout: 3000 });
}

async function startTourExternal(page) {
  await waitForTour(page);
  await page.locator('[data-tour]').first().click();
  await page.waitForSelector('.page-tour-card', { timeout: 3000 });
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

test.describe('page-tour — initialization', () => {

  test('component gets data-upgraded attribute', async ({ page }) => {
    await page.goto(basicPage);
    await waitForTour(page);
    const tour = page.locator('page-tour');
    await expect(tour).toHaveAttribute('data-upgraded', '');
  });

  test('Layer 3 guide is hidden when JS is active', async ({ page }) => {
    await page.goto(basicPage);
    await waitForTour(page);
    const guide = page.locator('.page-tour-guide');
    await expect(guide).toBeHidden();
  });

  test('manual trigger does not auto-start', async ({ page }) => {
    await page.goto(basicPage);
    await waitForTour(page);
    // Wait a bit to ensure no auto-start
    await page.waitForTimeout(600);
    const card = page.locator('.page-tour-card');
    await expect(card).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe('page-tour — navigation', () => {

  test('start tour shows overlay and first step', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await expect(page.locator('.page-tour-backdrop')).toBeAttached();
    await expect(page.locator('.page-tour-spotlight')).toBeAttached();
    await expect(page.locator('.page-tour-card')).toBeVisible();
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 1 of 4');
  });

  test('next button advances to step 2', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.locator('[data-action="next"]').click();
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 2 of 4');
  });

  test('previous button goes back', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.locator('[data-action="next"]').click();
    await page.locator('[data-action="prev"]').click();
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 1 of 4');
  });

  test('no prev button on first step', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);
    await expect(page.locator('[data-action="prev"]')).toHaveCount(0);
  });

  test('finish button on last step completes tour', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    // Navigate to last step via keyboard (reliable on all viewport sizes)
    await page.keyboard.press('End');
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 4 of 4');
    await expect(page.locator('[data-action="next"]')).toHaveText('Finish');

    // Finish the tour
    await page.keyboard.press('ArrowRight');
    // Tour should be closed
    await expect(page.locator('.page-tour-card')).toHaveCount(0);
    await expect(page.locator('page-tour')).toHaveAttribute('data-complete', '');
  });

  test('skip button closes tour', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.locator('[data-action="skip"]').click();
    await expect(page.locator('.page-tour-card')).toHaveCount(0);
    await expect(page.locator('page-tour')).toHaveAttribute('data-complete', '');
  });

  test('data-step attribute reflects current step', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await expect(page.locator('page-tour')).toHaveAttribute('data-step', '0');
    await page.locator('[data-action="next"]').click();
    await expect(page.locator('page-tour')).toHaveAttribute('data-step', '1');
  });
});

// ---------------------------------------------------------------------------
// Keyboard Navigation
// ---------------------------------------------------------------------------

test.describe('page-tour — keyboard', () => {

  test('Escape closes passive tour', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.keyboard.press('Escape');
    await expect(page.locator('.page-tour-card')).toHaveCount(0);
  });

  test('ArrowRight advances step', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 2 of 4');
  });

  test('ArrowLeft goes back', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 1 of 4');
  });

  test('Home goes to first step', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 2 of 4');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 3 of 4');
    await page.keyboard.press('Home');
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 1 of 4');
  });

  test('End goes to last step', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await page.keyboard.press('End');
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 4 of 4');
  });

  test('Tab traps focus within card', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    // Tab through all focusables, should stay in card
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    const activeEl = await page.evaluate(() => document.activeElement?.closest('.page-tour-card') !== null);
    expect(activeEl).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Action Gating
// ---------------------------------------------------------------------------

test.describe('page-tour — action gating', () => {

  test('next button disabled until action completes', async ({ page }) => {
    await page.goto(activePage);
    // Auto-trigger tour starts after 400ms
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    const nextBtn = page.locator('[data-action="next"]');
    await expect(nextBtn).toHaveAttribute('data-waiting', '');

    // Perform the required action (input into the name field)
    await page.locator('#profile-name').fill('Test');
    await expect(nextBtn).not.toHaveAttribute('data-waiting');
  });

  test('action hint is visible while waiting', async ({ page }) => {
    await page.goto(activePage);
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    const hint = page.locator('.page-tour-action-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Type your name');
  });

  test('arrow keys blocked while action-gated', async ({ page }) => {
    await page.goto(activePage);
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    await page.keyboard.press('ArrowRight');
    // Should still be on step 1
    await expect(page.locator('.page-tour-step-count')).toHaveText('Step 1 of 3');
  });
});

// ---------------------------------------------------------------------------
// Forced Mode
// ---------------------------------------------------------------------------

test.describe('page-tour — forced mode', () => {

  test('no skip button in forced mode', async ({ page }) => {
    await page.goto(forcedPage);
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    await expect(page.locator('[data-action="skip"]')).toHaveCount(0);
  });

  test('Escape does not close forced tour', async ({ page }) => {
    await page.goto(forcedPage);
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('.page-tour-card')).toBeVisible();
  });

  test('backdrop click does not close forced tour', async ({ page }) => {
    await page.goto(forcedPage);
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    await page.locator('.page-tour-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('.page-tour-card')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Button Trigger
// ---------------------------------------------------------------------------

test.describe('page-tour — button trigger', () => {

  test('data-tour button starts tour', async ({ page }) => {
    await page.goto(buttonPage);
    await waitForTour(page);

    // Tour should not be active initially
    await expect(page.locator('.page-tour-card')).toHaveCount(0);

    // Click external trigger button
    await startTourExternal(page);
    await expect(page.locator('.page-tour-card')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

test.describe('page-tour — persistence', () => {

  test('auto-trigger does not restart completed tour', async ({ page }) => {
    await page.goto(activePage);
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    // Complete the tour by performing actions and advancing via keyboard
    // Step 1: input action on profile-name
    await page.locator('#profile-name').fill('Test');
    await page.keyboard.press('ArrowRight');

    // Step 2: click action on notification-toggle
    await page.locator('#notification-toggle').click({ force: true });
    await page.keyboard.press('ArrowRight');

    // Step 3: click action on save-btn
    await page.locator('#save-btn').click({ force: true });
    await page.keyboard.press('ArrowRight'); // Finish

    // Tour should be complete
    await expect(page.locator('.page-tour-card')).toHaveCount(0);

    // Reload — tour should NOT auto-start
    await page.reload();
    await waitForTour(page);
    await page.waitForTimeout(600);
    await expect(page.locator('.page-tour-card')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

test.describe('page-tour — accessibility', () => {

  test('card has dialog role and aria-modal', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    const card = page.locator('.page-tour-card');
    await expect(card).toHaveAttribute('role', 'dialog');
    await expect(card).toHaveAttribute('aria-modal', 'true');
  });

  test('card has aria-label from data-title', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    const card = page.locator('.page-tour-card');
    await expect(card).toHaveAttribute('aria-label', 'Getting Started');
  });

  test('announcer updates on step change', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    const announcer = page.locator('[id^="page-tour-announcer"]');
    await expect(announcer).toContainText('Step 1 of 4');

    await page.locator('[data-action="next"]').click();
    await expect(announcer).toContainText('Step 2 of 4');
  });

  test('focus returns to trigger after tour ends', async ({ page }) => {
    await page.goto(basicPage);
    await waitForTour(page);

    // Focus the external trigger button, then start tour via it
    const trigger = page.locator('[data-tour="demo-tour"]');
    await trigger.focus();
    await trigger.click();
    await page.waitForSelector('.page-tour-card', { timeout: 3000 });

    // Skip the tour
    await page.locator('[data-action="skip"]').click();

    // Focus should return to the trigger button
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-tour'));
    expect(focused).toBe('demo-tour');
  });
});

// ---------------------------------------------------------------------------
// Progress Pips
// ---------------------------------------------------------------------------

test.describe('page-tour — progress', () => {

  test('progress pips render for each step', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    const pips = page.locator('.page-tour-pip');
    await expect(pips).toHaveCount(4);
  });

  test('active pip updates on navigation', async ({ page }) => {
    await page.goto(basicPage);
    await startTour(page);

    await expect(page.locator('.page-tour-pip[data-active]')).toHaveCount(1);

    await page.locator('[data-action="next"]').click();
    // First pip should now be visited, second active
    await expect(page.locator('.page-tour-pip[data-visited]')).toHaveCount(1);
    await expect(page.locator('.page-tour-pip[data-active]')).toHaveCount(1);
  });
});
