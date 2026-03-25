/**
 * Wizard Form Behavior Tests
 *
 * Tests step navigation, validation, conditional/optional steps,
 * events, hash sync, nav.steps sync, persistence, and dynamic insertion.
 */

import { test, expect } from 'playwright/test';

const basicPage = '/docs/examples/demos/wizard-basic.html';
const historyPage = '/docs/examples/demos/wizard-history.html';
const persistPage = '/docs/examples/demos/wizard-persist.html';
const navStepsPage = '/docs/examples/demos/wizard-nav-steps.html';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForWizard(page, selector = 'form[data-wizard]') {
  await page.waitForSelector(`${selector}[data-wizard-enhanced]`, { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

test.describe('wizard — initialization', () => {

  test('form gets data-wizard-enhanced attribute', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    const form = page.locator('form[data-wizard]');
    await expect(form).toHaveAttribute('data-wizard-enhanced', '');
  });

  test('first step is visible, others hidden', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    const activeStep = page.locator('fieldset[data-wizard-active]');
    await expect(activeStep).toHaveCount(1);

    const legend = activeStep.locator('legend');
    await expect(legend).toHaveText('Account');
  });

  test('form attributes reflect step 1 of N', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    const form = page.locator('form[data-wizard]');
    await expect(form).toHaveAttribute('data-wizard-current', '1');
    // Business Details step is conditional (hidden by default), so 4 visible steps
    const total = await form.getAttribute('data-wizard-total');
    expect(Number(total)).toBeGreaterThanOrEqual(3);
  });

  test('progress element reflects step 1', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    const progress = page.locator('progress[data-wizard-progress]');
    await expect(progress).toHaveAttribute('value', '1');
  });

  test('prev button is hidden on first step', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    const prevBtn = page.locator('[data-wizard-prev]');
    await expect(prevBtn).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe('wizard — navigation', () => {

  test('clicking Next advances to step 2 when current step is valid', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    // Fill required email field
    await page.fill('#email', 'test@example.com');
    await page.click('[data-wizard-next]');

    const form = page.locator('form[data-wizard]');
    await expect(form).toHaveAttribute('data-wizard-current', '2');

    const activeStep = page.locator('fieldset[data-wizard-active]');
    const legend = activeStep.locator('legend');
    await expect(legend).toHaveText('Profile');
  });

  test('clicking Prev goes back to step 1', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    // Advance to step 2
    await page.fill('#email', 'test@example.com');
    await page.click('[data-wizard-next]');
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '2');

    // Go back
    await page.click('[data-wizard-prev]');
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '1');
  });

  test('submit button visible only on last step', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    // Not on last step — submit hidden
    const submitBtn = page.locator('[data-wizard-nav] [type="submit"]');
    await expect(submitBtn).not.toBeVisible();

    // Advance to last step
    await page.click('[data-wizard-next]');
    await page.click('[data-wizard-next]');

    const form = page.locator('form[data-wizard]');
    await expect(form).toHaveAttribute('data-wizard-last', '');
    await expect(submitBtn).toBeVisible();

    // Next button hidden on last step
    const nextBtn = page.locator('[data-wizard-next]');
    await expect(nextBtn).not.toBeVisible();
  });

  test('wizardGoTo() jumps to specified step', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    const result = await page.evaluate(() => {
      const form = /** @type {any} */ (document.querySelector('form[data-wizard]'));
      return form.wizardGoTo(2);
    });

    expect(result).toBe(true);
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '3');
  });

  test('wizardReset() returns to step 1', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    // Advance
    await page.click('[data-wizard-next]');
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '2');

    // Reset
    await page.evaluate(() => {
      const form = /** @type {any} */ (document.querySelector('form[data-wizard]'));
      form.wizardReset();
    });

    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '1');
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test.describe('wizard — validation', () => {

  test('Next blocked when required field is empty', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    // Do NOT fill email, try to advance
    await page.click('[data-wizard-next]');

    // Should still be on step 1
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '1');
  });

  test('Next allowed after filling required field', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    await page.fill('#email', 'user@test.com');
    await page.click('[data-wizard-next]');

    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '2');
  });

  test('optional step can be advanced without filling fields', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    // Navigate to the optional "Preferences" step
    // Step 1: Account, Step 2: Profile, Step 3: Preferences (optional), Step 4: Review
    await page.fill('#email', 'user@test.com');
    await page.click('[data-wizard-next]'); // → Profile

    await page.fill('#fullname', 'Test User');
    await page.click('[data-wizard-next]'); // → Preferences (optional)

    const activeStep = page.locator('fieldset[data-wizard-active]');
    const legend = activeStep.locator('legend');
    await expect(legend).toHaveText('Preferences');

    // Advance without filling anything — should work because it's optional
    await page.click('[data-wizard-next]'); // → Review

    const newLegend = page.locator('fieldset[data-wizard-active] legend');
    await expect(newLegend).toHaveText('Review');
  });
});

// ---------------------------------------------------------------------------
// Conditional Steps
// ---------------------------------------------------------------------------

test.describe('wizard — conditional steps', () => {

  test('conditional step hidden when condition not met', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    // Business Details step should be hidden (account-type defaults to "personal")
    const bizStep = page.locator('fieldset[data-wizard-if="account-type:business"]');
    await expect(bizStep).toHaveAttribute('data-wizard-hidden', '');
  });

  test('conditional step appears when field value matches', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    // Navigate to step 2 where the account-type select is
    await page.fill('#email', 'user@test.com');
    await page.click('[data-wizard-next]');

    // Change account type to business
    await page.selectOption('#account-type', 'business');

    // Wait for condition evaluation (RAF debounced)
    await page.waitForTimeout(100);

    // Business Details step should now be visible (no data-wizard-hidden)
    const bizStep = page.locator('fieldset[data-wizard-if="account-type:business"]');
    await expect(bizStep).not.toHaveAttribute('data-wizard-hidden');
  });

  test('total step count adjusts for hidden conditional steps', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    // With personal account type, Business Details is hidden
    const totalBefore = await page.locator('form[data-wizard]').getAttribute('data-wizard-total');

    // Navigate and change to business
    await page.fill('#email', 'user@test.com');
    await page.click('[data-wizard-next]');
    await page.selectOption('#account-type', 'business');
    await page.waitForTimeout(100);

    const totalAfter = await page.locator('form[data-wizard]').getAttribute('data-wizard-total');

    expect(Number(totalAfter)).toBe(Number(totalBefore) + 1);
  });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

test.describe('wizard — events', () => {

  test('wizard:step-change fires with correct from/to', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    const detail = await page.evaluate(() => {
      return new Promise(resolve => {
        const form = document.querySelector('form[data-wizard]');
        form.addEventListener('wizard:step-change', (e) => {
          resolve(/** @type {CustomEvent} */ (e).detail);
        }, { once: true });

        /** @type {any} */ (form).wizardNext();
      });
    });

    expect(detail.from).toBe(0);
    expect(detail.to).toBe(1);
  });

  test('wizard:complete fires on form submit from last step, not on next()', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    // Track events
    await page.evaluate(() => {
      window._wizardEvents = [];
      const form = document.querySelector('form[data-wizard]');
      form.addEventListener('wizard:complete', () => {
        window._wizardEvents.push('complete');
      });
    });

    // Navigate to last step
    await page.click('[data-wizard-next]');
    await page.click('[data-wizard-next]');

    // Calling next() on last step should NOT fire wizard:complete
    await page.evaluate(() => {
      /** @type {any} */ (document.querySelector('form[data-wizard]')).wizardNext();
    });

    let events = await page.evaluate(() => window._wizardEvents);
    expect(events).toEqual([]);

    // Submit the form — should fire wizard:complete
    await page.evaluate(() => {
      const form = document.querySelector('form[data-wizard]');
      // Prevent actual navigation
      form.addEventListener('submit', (e) => e.preventDefault(), { once: true });
      form.requestSubmit();
    });

    events = await page.evaluate(() => window._wizardEvents);
    expect(events).toEqual(['complete']);
  });

  test('wizard:reset fires on wizardReset()', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    const fired = await page.evaluate(() => {
      return new Promise(resolve => {
        const form = document.querySelector('form[data-wizard]');
        form.addEventListener('wizard:reset', () => resolve(true), { once: true });
        /** @type {any} */ (form).wizardReset();
      });
    });

    expect(fired).toBe(true);
  });

  test('native form.reset() triggers wizard reset', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    // Advance to step 2
    await page.click('[data-wizard-next]');
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '2');

    // Call native reset
    await page.evaluate(() => {
      document.querySelector('form[data-wizard]').reset();
    });

    // Wait for RAF
    await page.waitForTimeout(100);

    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '1');
  });
});

// ---------------------------------------------------------------------------
// Hash Sync
// ---------------------------------------------------------------------------

test.describe('wizard — hash sync', () => {

  test('hash NOT updated when data-wizard-history is absent', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    await page.fill('#email', 'user@test.com');
    await page.click('[data-wizard-next]');

    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('');
  });

  test('hash updated when data-wizard-history is present', async ({ page }) => {
    await page.goto(historyPage);
    await waitForWizard(page);

    await page.click('[data-wizard-next]');

    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#step=2');
  });

  test('navigating to URL with #step=2 starts on step 2', async ({ page }) => {
    await page.goto(historyPage + '#step=2');
    await waitForWizard(page);

    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '2');
  });
});

// ---------------------------------------------------------------------------
// Nav.Steps Sync
// ---------------------------------------------------------------------------

test.describe('wizard — nav.steps sync', () => {

  test('active step gets aria-current="step"', async ({ page }) => {
    await page.goto(navStepsPage);
    await waitForWizard(page);

    const firstItem = page.locator('#step-nav ol > li').first();
    await expect(firstItem).toHaveAttribute('aria-current', 'step');
  });

  test('completed steps get data-completed after advancing', async ({ page }) => {
    await page.goto(navStepsPage);
    await waitForWizard(page);

    await page.click('[data-wizard-next]');

    const firstItem = page.locator('#step-nav ol > li').first();
    await expect(firstItem).toHaveAttribute('data-completed', '');

    const secondItem = page.locator('#step-nav ol > li').nth(1);
    await expect(secondItem).toHaveAttribute('aria-current', 'step');
  });

  test('future steps have aria-disabled', async ({ page }) => {
    await page.goto(navStepsPage);
    await waitForWizard(page);

    const lastItem = page.locator('#step-nav ol > li').last();
    await expect(lastItem).toHaveAttribute('aria-disabled', 'true');
  });

  test('clicking completed step navigates back', async ({ page }) => {
    await page.goto(navStepsPage);
    await waitForWizard(page);

    // Advance to step 3
    await page.click('[data-wizard-next]');
    await page.click('[data-wizard-next]');
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '3');

    // Click the first nav item (completed) to go back
    const firstLink = page.locator('#step-nav ol > li').first().locator('a');
    await firstLink.click();

    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '1');
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

test.describe('wizard — persistence', () => {

  test('form data saved to sessionStorage on step change', async ({ page }) => {
    await page.goto(persistPage);
    await waitForWizard(page);

    // Fill a field and advance
    await page.fill('#p-name', 'Alice');
    await page.click('[data-wizard-next]');

    // Wait for RAF-debounced save
    await page.waitForTimeout(100);

    const saved = await page.evaluate(() => {
      const raw = sessionStorage.getItem('vb-wizard:persist-wizard');
      return raw ? JSON.parse(raw) : null;
    });

    expect(saved).not.toBeNull();
    expect(saved.step).toBe(1);
    expect(saved.data['p-name']).toBe('Alice');
  });

  test('page reload restores step and field values', async ({ page }) => {
    await page.goto(persistPage);
    await waitForWizard(page);

    // Fill and advance
    await page.fill('#p-name', 'Bob');
    await page.click('[data-wizard-next]');
    await page.fill('#p-color', 'Blue');

    // Force a save (input triggers debounced save)
    await page.waitForTimeout(100);

    // Reload
    await page.reload();
    await waitForWizard(page);

    // Should be on step 2
    await expect(page.locator('form[data-wizard]')).toHaveAttribute('data-wizard-current', '2');

    // Field value should be restored
    const nameValue = await page.inputValue('#p-name');
    expect(nameValue).toBe('Bob');
  });

  test('wizardReset() clears storage', async ({ page }) => {
    await page.goto(persistPage);
    await waitForWizard(page);

    await page.fill('#p-name', 'Charlie');
    await page.click('[data-wizard-next]');

    // Reset
    await page.evaluate(() => {
      /** @type {any} */ (document.querySelector('form[data-wizard]')).wizardReset();
    });

    const saved = await page.evaluate(() => {
      return sessionStorage.getItem('vb-wizard:persist-wizard');
    });

    expect(saved).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Dynamic Insertion
// ---------------------------------------------------------------------------

test.describe('wizard — dynamic insertion', () => {

  test('wizard form added to DOM after page load gets enhanced', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    const enhanced = await page.evaluate(() => {
      return new Promise(resolve => {
        const form = document.createElement('form');
        form.setAttribute('data-wizard', '');
        form.id = 'dynamic-wizard';
        form.innerHTML = `
          <fieldset data-wizard-step><legend>A</legend><p>Step A</p></fieldset>
          <fieldset data-wizard-step><legend>B</legend><p>Step B</p></fieldset>
          <nav data-wizard-nav>
            <button type="button" data-wizard-prev>Back</button>
            <button type="button" data-wizard-next>Next</button>
            <button type="submit">Submit</button>
          </nav>
        `;
        document.body.appendChild(form);

        // MutationObserver fires asynchronously
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(form.hasAttribute('data-wizard-enhanced'));
          });
        });
      });
    });

    expect(enhanced).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Progressive Enhancement
// ---------------------------------------------------------------------------

test.describe('wizard — progressive enhancement', () => {

  test('all fieldsets exist in DOM regardless of wizard state', async ({ page }) => {
    await page.goto(basicPage);
    await waitForWizard(page);

    const stepCount = await page.locator('fieldset[data-wizard-step]').count();
    expect(stepCount).toBeGreaterThanOrEqual(4);
  });
});
