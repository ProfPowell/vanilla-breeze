/**
 * Wireframe Mode Behavior Tests
 *
 * Tests fidelity levels, labeling system, JS API, and visual states
 * for the wireframe prototyping utility.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/wireframe-mode.html';

test.describe('wireframe mode', () => {

  test('applies grayscale filter when data-wireframe is set', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const filter = await html.evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain('grayscale');
  });

  test('removes grayscale when wireframe is toggled off', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Uncheck wireframe toggle
    await page.locator('#wireframe-toggle').uncheck();
    const html = page.locator('html');
    const hasAttr = await html.evaluate((el) => el.hasAttribute('data-wireframe'));
    expect(hasAttr).toBe(false);
  });

  test('shows SKETCH indicator badge for lo fidelity', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="lo"]').check();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-wireframe', 'lo');

    const badge = await html.evaluate((el) => getComputedStyle(el, '::before').content);
    expect(badge).toContain('SKETCH');
  });

  test('shows WIREFRAME indicator badge for mid fidelity', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="mid"]').check();

    const html = page.locator('html');
    const badge = await html.evaluate((el) => getComputedStyle(el, '::before').content);
    expect(badge).toContain('WIREFRAME');
  });

  test('shows PREVIEW indicator badge for hi fidelity', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="hi"]').check();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-wireframe', 'hi');

    const badge = await html.evaluate((el) => getComputedStyle(el, '::before').content);
    expect(badge).toContain('PREVIEW');
  });

  test('hi-fi uses reduced grayscale', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="hi"]').check();

    const html = page.locator('html');
    const filter = await html.evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain('grayscale(0.3)');
  });

  test('annotate mode shows element labels for semantic elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="annotate"]').check();

    const headerLabel = await page.locator('header').evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    expect(headerLabel).toContain('<header>');

    const footerLabel = await page.locator('footer').evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    expect(footerLabel).toContain('<footer>');
  });

  test('annotate shows labels for expanded element list', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="annotate"]').check();

    // form element
    const formLabel = await page.locator('form').first().evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    expect(formLabel).toContain('<form>');

    // fieldset element
    const fieldsetLabel = await page.locator('fieldset').first().evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    expect(fieldsetLabel).toContain('<fieldset>');

    // blockquote element
    const bqLabel = await page.locator('blockquote').first().evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    expect(bqLabel).toContain('<blockquote>');

    // table element
    const tableLabel = await page.locator('table').first().evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    expect(tableLabel).toContain('<table>');
  });

  test('data-wf-label renders badge on elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const headerBadge = await page.locator('header[data-wf-label]').evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    // Should contain the label text set by labelElements() or the attribute
    expect(headerBadge).not.toBe('none');
    expect(headerBadge).not.toBe('""');
  });

});

test.describe('wireframe JS API', () => {

  test('toggle() enables and disables wireframe', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // First remove wireframe to test toggle on
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-wireframe');
    });

    const enabled = await page.evaluate(() => VanillaBreeze.wireframe.toggle());
    expect(enabled).toBe(true);
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-wireframe'))).toBe(true);

    const disabled = await page.evaluate(() => VanillaBreeze.wireframe.toggle());
    expect(disabled).toBe(false);
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-wireframe'))).toBe(false);
  });

  test('setFidelity() changes the fidelity level', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity('lo'));
    expect(await page.evaluate(() => document.documentElement.dataset.wireframe)).toBe('lo');

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity('hi'));
    expect(await page.evaluate(() => document.documentElement.dataset.wireframe)).toBe('hi');
  });

  test('setFidelity("") removes wireframe', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity(''));
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-wireframe'))).toBe(false);
  });

  test('isActive() returns correct state', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    expect(await page.evaluate(() => VanillaBreeze.wireframe.isActive())).toBe(true);

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity(''));
    expect(await page.evaluate(() => VanillaBreeze.wireframe.isActive())).toBe(false);
  });

  test('getFidelity() returns current level', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity('lo'));
    expect(await page.evaluate(() => VanillaBreeze.wireframe.getFidelity())).toBe('lo');

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity(''));
    expect(await page.evaluate(() => VanillaBreeze.wireframe.getFidelity())).toBeNull();
  });

  test('labelElements() labels images with alt text', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => VanillaBreeze.wireframe.labelElements());

    // Check that the first figure got a label from image alt text
    const figureLabel = await page.locator('figure').first().evaluate(
      (el) => el.getAttribute('data-wf-img-label')
    );
    expect(figureLabel).toBeTruthy();
    expect(figureLabel.length).toBeGreaterThan(0);
  });

  test('scoped wireframe does not apply html-level grayscale', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Remove html wireframe, add scoped wireframe to a section
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-wireframe');
      document.querySelector('main section').setAttribute('data-wireframe', 'mid');
    });

    const htmlFilter = await page.locator('html').evaluate(
      (el) => getComputedStyle(el).filter
    );
    // html should NOT have grayscale when wireframe is scoped
    expect(htmlFilter).not.toContain('grayscale');
  });

});
