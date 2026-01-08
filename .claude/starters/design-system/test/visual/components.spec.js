/**
 * Visual Regression Tests
 * Using Playwright for component screenshot comparison
 */

import { test, expect } from '@playwright/test';

test.describe('Button Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/index.html');
  });

  test('button variants', async ({ page }) => {
    const buttonSection = page.locator('h3:has-text("Button") + .example .example-preview');
    await expect(buttonSection).toHaveScreenshot('button-variants.png');
  });

  test('button hover state', async ({ page }) => {
    const primaryButton = page.locator('{{COMPONENT_PREFIX}}-button[variant="primary"]').first();
    await primaryButton.hover();
    await expect(primaryButton).toHaveScreenshot('button-hover.png');
  });
});

test.describe('Input Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/index.html');
  });

  test('input states', async ({ page }) => {
    const inputSection = page.locator('h3:has-text("Input") + .example .example-preview');
    await expect(inputSection).toHaveScreenshot('input-states.png');
  });

  test('input focus state', async ({ page }) => {
    const input = page.locator('{{COMPONENT_PREFIX}}-input').first();
    await input.locator('input').focus();
    await expect(input).toHaveScreenshot('input-focus.png');
  });
});

test.describe('Card Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/index.html');
  });

  test('card appearance', async ({ page }) => {
    const cardSection = page.locator('h3:has-text("Card") + .example .example-preview');
    await expect(cardSection).toHaveScreenshot('card-default.png');
  });
});

test.describe('Badge Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/index.html');
  });

  test('badge variants', async ({ page }) => {
    const badgeSection = page.locator('h3:has-text("Badge") + .example .example-preview');
    await expect(badgeSection).toHaveScreenshot('badge-variants.png');
  });
});

test.describe('Icon Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/index.html');
  });

  test('icon set', async ({ page }) => {
    const iconSection = page.locator('h3:has-text("Icon") + .example .example-preview');
    await expect(iconSection).toHaveScreenshot('icons.png');
  });
});

test.describe('Dialog Component', () => {
  test('dialog open state', async ({ page }) => {
    await page.goto('/docs/index.html');

    // Open the dialog
    await page.click('#open-dialog');
    await page.waitForTimeout(300); // Wait for animation

    const dialog = page.locator('{{COMPONENT_PREFIX}}-dialog[open]');
    await expect(dialog).toHaveScreenshot('dialog-open.png');
  });
});

test.describe('Dropdown Component', () => {
  test('dropdown open state', async ({ page }) => {
    await page.goto('/docs/index.html');

    // Open the dropdown
    await page.locator('{{COMPONENT_PREFIX}}-dropdown {{COMPONENT_PREFIX}}-button').click();
    await page.waitForTimeout(200); // Wait for animation

    const dropdown = page.locator('{{COMPONENT_PREFIX}}-dropdown[open]');
    await expect(dropdown).toHaveScreenshot('dropdown-open.png');
  });
});

test.describe('Dark Mode', () => {
  test('components in dark mode', async ({ page }) => {
    await page.goto('/docs/index.html');
    await page.emulateMedia({ colorScheme: 'dark' });

    const buttonSection = page.locator('h3:has-text("Button") + .example .example-preview');
    await expect(buttonSection).toHaveScreenshot('button-dark.png');
  });
});