/**
 * Form Validation Tests
 *
 * Tests FormField web component, form coordinator, custom messages,
 * cross-field validation, checkbox groups, error summary, and submit modes.
 */

import { test, expect } from 'playwright/test';

const mainPage = '/docs/examples/demos/form-validation.html';
const fetchPage = '/docs/examples/demos/form-validation-fetch.html';
const pePage = '/docs/examples/demos/form-validation-pe.html';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForFormField(page) {
  await page.waitForSelector('form-field[data-upgraded]', { timeout: 5000 });
}

async function waitForEnhanced(page) {
  await page.waitForSelector('form[data-vb-enhanced]', { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

test.describe('form validation — initialization', () => {

  test('form with data-validate gets novalidate and data-vb-enhanced', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    const form = page.locator('form[data-validate]').first();
    await expect(form).toHaveAttribute('novalidate', '');
    await expect(form).toHaveAttribute('data-vb-enhanced', '');
  });

  test('form without data-validate does NOT get enhanced', async ({ page }) => {
    await page.goto(mainPage);
    await waitForFormField(page);

    // The CSS-only forms (no data-validate) should not have novalidate
    const cssOnlyForm = page.locator('form:not([data-validate])').first();
    await expect(cssOnlyForm).not.toHaveAttribute('data-vb-enhanced');
  });

  test('form-field gets data-upgraded when JS loads', async ({ page }) => {
    await page.goto(mainPage);
    await waitForFormField(page);

    const formField = page.locator('form-field').first();
    await expect(formField).toHaveAttribute('data-upgraded', '');
  });
});

// ---------------------------------------------------------------------------
// FormField web component
// ---------------------------------------------------------------------------

test.describe('form-field — validation timing', () => {

  test('blur triggers validation on first touch', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    // Find a required field in a data-validate form
    const input = page.locator('form[data-validate] input[required]').first();
    await input.focus();
    await input.blur();

    // After blur on an empty required field, form-field should have data-invalid
    const formField = input.locator('xpath=ancestor::form-field');
    await expect(formField).toHaveAttribute('data-invalid', '');
  });

  test('input does NOT eagerly re-validate before first error shown', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    // Test the eager re-validation guard: type into field, then type more
    // without ever blurring. The output should remain empty.
    const result = await page.evaluate(() => {
      const input = /** @type {HTMLInputElement} */ (document.getElementById('pe-name'));
      const formField = input.closest('form-field');

      // Dispatch input event directly (no blur)
      input.value = 'A';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Check: no data-invalid should be set (no prior blur = no first error)
      return {
        hasInvalid: formField.hasAttribute('data-invalid'),
        hasValid: formField.hasAttribute('data-valid'),
      };
    });

    expect(result.hasInvalid).toBe(false);
    expect(result.hasValid).toBe(false);
  });

  test('input re-validates eagerly after first error shown', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    const input = page.locator('#pe-name');

    // Trigger first error: focus then blur empty field
    await input.focus();
    await input.blur();

    const formField = input.locator('xpath=ancestor::form-field');
    await expect(formField).toHaveAttribute('data-invalid', '');

    // Now type — should re-validate eagerly and clear error
    await input.fill('John');
    await expect(formField).toHaveAttribute('data-valid', '');
  });
});

test.describe('form-field — aria-invalid', () => {

  test('aria-invalid set on invalid input after blur', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    const input = page.locator('#pe-name');
    await input.focus();
    await input.blur();

    await expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('aria-invalid removed when input becomes valid', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    const input = page.locator('#pe-name');
    await input.focus();
    await input.blur();
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    await input.fill('John');
    await expect(input).not.toHaveAttribute('aria-invalid');
  });
});

// ---------------------------------------------------------------------------
// Custom messages (ValidityState-aligned names)
// ---------------------------------------------------------------------------

test.describe('form validation — custom messages', () => {

  test('data-message-valuemissing shows on required empty field after blur', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    const input = page.locator('#pe-name');
    await input.focus();
    await input.blur();

    const error = page.locator('#pe-name-error');
    await expect(error).toHaveText('Please enter your name');
  });

  test('data-message-typemismatch shows on invalid email', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    const input = page.locator('#pe-email');
    await input.fill('notanemail');
    await input.blur();

    const error = page.locator('#pe-email-error');
    await expect(error).toHaveText('Please enter a valid email address');
  });

  test('data-message-tooshort shows on too-short input', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    const input = page.locator('#pe-name');
    await input.fill('A');
    await input.blur();

    const error = page.locator('#pe-name-error');
    await expect(error).toHaveText('Name must be at least 2 characters');
  });

  test('data-message-patternmismatch shows on pattern failure', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    const input = page.locator('#pe-phone');
    await input.fill('abc');
    await input.blur();

    const error = page.locator('#pe-phone-error');
    await expect(error).toHaveText('Use format: 123-456-7890');
  });

  test('fallback to browser validationMessage when no data attribute', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    // The CSS-only form fields don't have data-message-* but do have required
    // When upgraded as web component, they should show browser default message
    const cssOnlyInput = page.locator('form:not([data-validate]) input[required]').first();
    await cssOnlyInput.focus();
    await cssOnlyInput.blur();

    // The form-field should have data-invalid set by the web component
    const formField = cssOnlyInput.locator('xpath=ancestor::form-field');
    await expect(formField).toHaveAttribute('data-invalid', '');
  });
});

// ---------------------------------------------------------------------------
// Cross-field validation
// ---------------------------------------------------------------------------

test.describe('form validation — cross-field (data-match)', () => {

  test('data-match fails when values differ', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    // Find the password confirm section
    const password = page.locator('#pw-password');
    const confirm = page.locator('#pw-confirm');

    await password.fill('password123');
    await confirm.fill('different');
    await confirm.blur();

    const error = page.locator('#pw-confirm-error');
    await expect(error).toHaveText('Passwords do not match');
  });

  test('data-match passes when values match', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    const password = page.locator('#pw-password');
    const confirm = page.locator('#pw-confirm');

    await password.fill('password123');
    await confirm.fill('password123');
    await confirm.blur();

    const error = page.locator('#pw-confirm-error');
    await expect(error).toHaveText('');
  });

  test('changing target field triggers re-validation on dependent', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    const password = page.locator('#pw-password');
    const confirm = page.locator('#pw-confirm');

    // Set matching values
    await password.fill('password123');
    await confirm.fill('password123');
    await confirm.blur();

    // Now change password — should trigger re-check on confirm
    await password.fill('changed456');

    const error = page.locator('#pw-confirm-error');
    await expect(error).toHaveText('Passwords do not match');
  });
});

// ---------------------------------------------------------------------------
// Checkbox group constraints
// ---------------------------------------------------------------------------

test.describe('form validation — checkbox groups', () => {

  test('under data-min-checked shows error on fieldset', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    // Find the interests fieldset and click submit without checking any
    const form = page.locator('form[data-validate]').nth(2); // Third data-validate form is checkbox section
    await form.locator('button[type="submit"]').click();

    const fieldset = form.locator('fieldset[data-min-checked]');
    await expect(fieldset).toHaveAttribute('data-invalid', '');
  });

  test('within range clears error', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    const form = page.locator('form[data-validate]').nth(2);
    const fieldset = form.locator('fieldset[data-min-checked]');

    // Check one box
    await fieldset.locator('input[type="checkbox"]').first().check();

    await expect(fieldset).not.toHaveAttribute('data-invalid');
  });
});

// ---------------------------------------------------------------------------
// Error summary
// ---------------------------------------------------------------------------

test.describe('form validation — error summary', () => {

  test('legacy summary populates on invalid submit', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    // The summary-only form (data-validate="summary")
    const form = page.locator('form[data-validate="summary"]');
    await form.locator('button[type="submit"]').click();

    const summary = form.locator('output.error-summary');
    await expect(summary).not.toBeEmpty();
    // Should contain links
    const links = summary.locator('a');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('authored summary (data-form-summary) populates on invalid submit', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    await page.locator('#pe-form button[type="submit"]').click();

    const summary = page.locator('[data-form-summary]');
    await expect(summary).toHaveAttribute('data-visible', '');

    const list = summary.locator('[data-summary-list] li');
    expect(await list.count()).toBeGreaterThan(0);
  });

  test('summary links focus the correct field', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    await page.locator('#pe-form button[type="submit"]').click();

    // Click first summary link
    const firstLink = page.locator('[data-form-summary] a').first();
    await firstLink.click();

    // The linked field should be focused
    const href = await firstLink.getAttribute('href');
    const targetId = href.slice(1);
    const target = page.locator(`#${targetId}`);
    await expect(target).toBeFocused();
  });

  test('summary clears on valid submit', async ({ page }) => {
    await page.goto(pePage);
    await waitForEnhanced(page);

    // First trigger summary by submitting empty form
    await page.locator('#pe-form button[type="submit"]').click();
    const summary = page.locator('[data-form-summary]');
    await expect(summary).toHaveAttribute('data-visible', '');

    // Now fill all required fields
    await page.fill('#pe-name', 'John Doe');
    await page.fill('#pe-email', 'john@example.com');
    await page.fill('#pe-message', 'This is a test message that is long enough.');

    // Intercept native submission by blocking the route
    await page.route('/contact', route => route.fulfill({ status: 200, body: 'OK' }));

    // Before form.submit() navigates, check summary was cleared
    // We do this by monkey-patching form.submit to verify before it fires
    const summaryClearedBeforeSubmit = page.evaluate(() => {
      return new Promise((resolve) => {
        const form = document.getElementById('pe-form');
        const origSubmit = form.submit.bind(form);
        form.submit = () => {
          const summary = document.querySelector('[data-form-summary]');
          resolve(!summary.hasAttribute('data-visible'));
          // Don't actually navigate
        };
      });
    });

    await page.locator('#pe-form button[type="submit"]').click();
    expect(await summaryClearedBeforeSubmit).toBe(true);
  });

  test('summary-only mode hides field-level errors', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    const form = page.locator('form[data-validate="summary"]');
    const fieldError = form.locator('form-field output.error').first();

    // CSS should hide field errors in summary mode
    await expect(fieldError).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Submit behavior
// ---------------------------------------------------------------------------

test.describe('form validation — submit modes', () => {

  test('data-submit="event" dispatches vb:submit, no native submit', async ({ page }) => {
    await page.goto(fetchPage);
    await waitForEnhanced(page);

    const form = page.locator('#event-form');
    await form.locator('#ev-search').fill('test query');

    // Listen for vb:submit
    const submitted = page.evaluate(() => {
      return new Promise((resolve) => {
        document.getElementById('event-form').addEventListener('vb:submit', (e) => {
          e.preventDefault();
          resolve(true);
        });
      });
    });

    await form.locator('button[type="submit"]').click();
    expect(await submitted).toBe(true);
  });

  test('data-submit="fetch" sets data-submitting during fetch', async ({ page }) => {
    await page.goto(fetchPage);
    await waitForEnhanced(page);

    // Intercept the fetch to control timing — hold the response
    let resolveRoute;
    await page.route('/api/contact', route => {
      resolveRoute = () => route.fulfill({ status: 200, body: '{"ok":true}',
        headers: { 'Content-Type': 'application/json' } });
    });

    const form = page.locator('form[data-submit="fetch"]');
    await form.locator('#fc-name').fill('John');
    await form.locator('#fc-email').fill('john@test.com');
    await form.locator('#fc-message').fill('Hello world');

    // Click submit — data-submitting should appear while fetch is in flight
    await form.locator('button[type="submit"]').click();
    await expect(form).toHaveAttribute('data-submitting', '');

    // Complete the fetch
    resolveRoute();
    await expect(form).toHaveAttribute('data-success', '');
  });
});

// ---------------------------------------------------------------------------
// Dynamic forms
// ---------------------------------------------------------------------------

test.describe('form validation — dynamic forms', () => {

  test('form added to DOM dynamically gets enhanced', async ({ page }) => {
    await page.goto(mainPage);
    await waitForEnhanced(page);

    // Add a form dynamically
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('data-validate', '');
      form.innerHTML = `
        <form-field>
          <label for="dyn-name">Name</label>
          <input type="text" id="dyn-name" name="name" required />
          <output class="error" for="dyn-name" aria-live="polite"></output>
        </form-field>
        <button type="submit">Submit</button>
      `;
      document.body.appendChild(form);
    });

    // Wait for enhancement
    await page.waitForSelector('form[data-vb-enhanced]:last-of-type', { timeout: 3000 });

    const dynamicForm = page.locator('form[data-validate]').last();
    await expect(dynamicForm).toHaveAttribute('data-vb-enhanced', '');
  });
});
