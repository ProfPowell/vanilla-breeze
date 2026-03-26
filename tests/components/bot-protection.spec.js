/**
 * Bot Protection Tests
 *
 * Tests honeypot exclusion, behavioural signal scoring,
 * vb:beforesubmit event, and bot blocking.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/form-bot-protection.html';

async function waitForEnhanced(page) {
  await page.waitForSelector('form[data-vb-enhanced]', { timeout: 5000 });
  await page.waitForSelector('form[data-bot-enhanced]', { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Honeypot
// ---------------------------------------------------------------------------

test.describe('bot protection — honeypot', () => {

  test('.form-trap is visually hidden', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // The trap div should exist in DOM but not be visible
    const trap = page.locator('.form-trap');
    expect(await trap.count()).toBe(1);

    const box = await trap.boundingBox();
    // clip: rect(0 0 0 0) + 1px dimensions = effectively zero bounding box
    expect(box.width).toBeLessThanOrEqual(1);
    expect(box.height).toBeLessThanOrEqual(1);
  });

  test('honeypot field excluded from validation', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Fill honeypot but leave required fields empty
    await page.evaluate(() => {
      document.getElementById('website').value = 'http://spam.com';
    });

    // Submit — should show validation errors for required fields,
    // NOT for the honeypot field
    await page.locator('#bot-form button[type="submit"]').click();

    // The honeypot should not have aria-invalid or be focused
    const honeypot = page.locator('#website');
    await expect(honeypot).not.toHaveAttribute('aria-invalid');
  });

  test('honeypot field excluded from forceUserInvalid focus cycle', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Track which elements received focus during submit
    const focusedElements = await page.evaluate(() => {
      const focused = [];
      document.addEventListener('focus', (e) => {
        focused.push(e.target.id || e.target.name || e.target.tagName);
      }, { capture: true });

      // Submit empty form to trigger forceUserInvalid
      document.querySelector('#bot-form button[type="submit"]').click();
      return focused;
    });

    // 'website' (honeypot) should NOT be in the focus list
    expect(focusedElements).not.toContain('website');
  });
});

// ---------------------------------------------------------------------------
// Behavioural signals
// ---------------------------------------------------------------------------

test.describe('bot protection — behavioural signals', () => {

  test('normal user interaction produces low score', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Set up listener BEFORE interacting
    const resultPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        const form = document.getElementById('bot-form');
        form.addEventListener('vb:submit', (e) => {
          e.preventDefault();
          const scoreField = document.querySelector('[data-bot-score-field]');
          const decoded = JSON.parse(atob(scoreField.value));
          resolve({ event: 'submit', score: decoded.s });
        });
        form.addEventListener('vb:botblocked', (e) => {
          resolve({ event: 'blocked', score: e.detail.score });
        });
      });
    });

    // Fill form like a human — click, type with pauses
    await page.locator('#bp-name').click();
    await page.locator('#bp-name').pressSequentially('John Doe', { delay: 30 });
    await page.locator('#bp-email').click();
    await page.locator('#bp-email').pressSequentially('john@example.com', { delay: 30 });
    await page.locator('#bp-message').click();
    await page.locator('#bp-message').pressSequentially('Hello, I have a question.', { delay: 30 });

    // Wait to pass the 3s timing threshold
    await page.waitForTimeout(3500);

    await page.locator('#bot-form button[type="submit"]').click();
    const result = await resultPromise;
    expect(result.score).toBeLessThan(30);
  });

  test('programmatic fill produces high score', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Wait for form to be enhanced before simulating
    await page.waitForTimeout(100);

    // Listen for events
    const result = page.evaluate(() => {
      return new Promise((resolve) => {
        const form = document.getElementById('bot-form');

        form.addEventListener('vb:submit', (e) => {
          e.preventDefault();
          const scoreField = document.querySelector('[data-bot-score-field]');
          const decoded = JSON.parse(atob(scoreField.value));
          resolve({ blocked: false, score: decoded.s });
        });

        form.addEventListener('vb:botblocked', (e) => {
          resolve({ blocked: true, score: e.detail.score });
        });
      });
    });

    // Click the simulate button (fills fields without interaction events)
    await page.locator('#sim-programmatic').click();
    const { score } = await result;
    // Should have high score from no focus + no keyboard + instant timing
    expect(score).toBeGreaterThanOrEqual(50);
  });

  test('_vb_score hidden field injected into form on submit', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Set up listener before interacting
    const resultPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        const form = document.getElementById('bot-form');
        form.addEventListener('vb:submit', (e) => {
          e.preventDefault();
          const scoreField = document.querySelector('[data-bot-score-field]');
          resolve(scoreField?.value ?? null);
        });
        form.addEventListener('vb:botblocked', () => {
          const scoreField = document.querySelector('[data-bot-score-field]');
          resolve(scoreField?.value ?? null);
        });
      });
    });

    // Fill with real interaction
    await page.locator('#bp-name').click();
    await page.locator('#bp-name').pressSequentially('Jane', { delay: 30 });
    await page.locator('#bp-email').click();
    await page.locator('#bp-email').pressSequentially('jane@test.com', { delay: 30 });
    await page.locator('#bp-message').click();
    await page.locator('#bp-message').pressSequentially('Testing bot protection.', { delay: 30 });

    await page.locator('#bot-form button[type="submit"]').click();
    const encodedScore = await resultPromise;

    expect(encodedScore).toBeTruthy();
    // Should be valid base64 JSON
    const decoded = JSON.parse(atob(encodedScore));
    expect(decoded).toHaveProperty('s');
    expect(decoded).toHaveProperty('t');
    expect(decoded).toHaveProperty('c');
  });

  test('filling honeypot triggers high bot score', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    const result = page.evaluate(() => {
      return new Promise((resolve) => {
        const form = document.getElementById('bot-form');
        form.addEventListener('vb:botblocked', (e) => {
          resolve({ blocked: true, score: e.detail.score });
        });
        form.addEventListener('vb:submit', (e) => {
          e.preventDefault();
          const scoreField = document.querySelector('[data-bot-score-field]');
          const decoded = JSON.parse(atob(scoreField.value));
          resolve({ blocked: false, score: decoded.s });
        });
      });
    });

    // Click the honeypot simulation button
    await page.locator('#sim-honeypot').click();
    const { score } = await result;
    expect(score).toBeGreaterThanOrEqual(80);
  });
});

// ---------------------------------------------------------------------------
// vb:beforesubmit event
// ---------------------------------------------------------------------------

test.describe('bot protection — vb:beforesubmit event', () => {

  test('vb:beforesubmit fires after validation passes', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Fill all required fields
    await page.locator('#bp-name').click();
    await page.locator('#bp-name').fill('Test User');
    await page.locator('#bp-email').click();
    await page.locator('#bp-email').fill('test@example.com');
    await page.locator('#bp-message').click();
    await page.locator('#bp-message').fill('A message for testing.');

    const beforeSubmitFired = page.evaluate(() => {
      return new Promise((resolve) => {
        document.getElementById('bot-form').addEventListener('vb:beforesubmit', () => {
          resolve(true);
        });
        // Fallback timeout
        setTimeout(() => resolve(false), 2000);
      });
    });

    await page.locator('#bot-form button[type="submit"]').click();
    expect(await beforeSubmitFired).toBe(true);
  });

  test('vb:beforesubmit does NOT fire when validation fails', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Don't fill required fields — submit should fail validation
    const beforeSubmitFired = page.evaluate(() => {
      return new Promise((resolve) => {
        document.getElementById('bot-form').addEventListener('vb:beforesubmit', () => {
          resolve(true);
        });
        setTimeout(() => resolve(false), 500);
      });
    });

    await page.locator('#bot-form button[type="submit"]').click();
    expect(await beforeSubmitFired).toBe(false);
  });

  test('preventing vb:beforesubmit blocks submission', async ({ page }) => {
    await page.goto(demoPage);
    await waitForEnhanced(page);

    // Fill fields normally
    await page.locator('#bp-name').click();
    await page.locator('#bp-name').fill('Test');
    await page.locator('#bp-email').click();
    await page.locator('#bp-email').fill('test@test.com');
    await page.locator('#bp-message').click();
    await page.locator('#bp-message').fill('Testing prevention.');

    const result = page.evaluate(() => {
      return new Promise((resolve) => {
        const form = document.getElementById('bot-form');

        // Manually prevent vb:beforesubmit
        form.addEventListener('vb:beforesubmit', (e) => {
          e.preventDefault();
        }, { once: true });

        // vb:submit should NOT fire
        form.addEventListener('vb:submit', () => {
          resolve('submitted');
        });

        setTimeout(() => resolve('blocked'), 1000);
      });
    });

    await page.locator('#bot-form button[type="submit"]').click();
    expect(await result).toBe('blocked');
  });
});
