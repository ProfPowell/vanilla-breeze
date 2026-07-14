/**
 * Wireframe Mode Behavior Tests
 *
 * Tests fidelity levels, labeling system, JS API, and visual states
 * for the wireframe prototyping utility.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/wireframe-mode.html';

test.describe('wireframe mode', () => {

  // The demo intentionally scopes wireframe to #demo-content (authored
  // data-wireframe="mid" on the article) rather than <html>; the html-level
  // mode and its fixed indicator badge are exercised via the JS API below.

  test('applies grayscale filter when data-wireframe is set', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const scope = page.locator('#demo-content');
    await expect(scope).toHaveAttribute('data-wireframe', 'mid');
    const filter = await scope.evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain('grayscale');
  });

  test('removes grayscale when wireframe is toggled off', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Uncheck wireframe toggle
    await page.locator('#wireframe-toggle').uncheck();
    const scope = page.locator('#demo-content');
    const hasAttr = await scope.evaluate((el) => el.hasAttribute('data-wireframe'));
    expect(hasAttr).toBe(false);
    const filter = await scope.evaluate((el) => getComputedStyle(el).filter);
    expect(filter).not.toContain('grayscale');
  });

  test('shows SKETCH indicator badge for lo fidelity', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Demo radio drives the scoped attribute (badge is suppressed there)
    await page.locator('input[name="fidelity"][value="lo"]').check();
    await expect(page.locator('#demo-content')).toHaveAttribute('data-wireframe', 'lo');

    // The indicator badge is html-level — drive it via the JS API
    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity('lo'));
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-wireframe', 'lo');

    const badge = await html.evaluate((el) => getComputedStyle(el, '::before').content);
    expect(badge).toContain('SKETCH');
  });

  test('shows WIREFRAME indicator badge for mid fidelity', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity('mid'));

    const html = page.locator('html');
    const badge = await html.evaluate((el) => getComputedStyle(el, '::before').content);
    expect(badge).toContain('WIREFRAME');
  });

  test('shows PREVIEW indicator badge for hi fidelity', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity('hi'));

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-wireframe', 'hi');

    const badge = await html.evaluate((el) => getComputedStyle(el, '::before').content);
    expect(badge).toContain('PREVIEW');
  });

  test('hi-fi uses reduced grayscale', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="hi"]').check();

    const scope = page.locator('#demo-content');
    await expect(scope).toHaveAttribute('data-wireframe', 'hi');
    const filter = await scope.evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain('grayscale(0.3)');
  });

  test('annotate mode shows element labels via ::after', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="annotate"]').check();

    // Labeled elements show their authored data-wf-label, not the tag name
    const headerLabel = await page.locator('header').evaluate(
      (el) => getComputedStyle(el, '::after').content
    );
    expect(headerLabel).toContain('Global Header');

    const footerLabel = await page.locator('footer').evaluate(
      (el) => getComputedStyle(el, '::after').content
    );
    expect(footerLabel).toContain('Global Footer');
  });

  test('annotate shows labels for expanded element list via ::after', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="fidelity"][value="annotate"]').check();

    // form element — labeled, shows its data-wf-label
    const formLabel = await page.locator('form').first().evaluate(
      (el) => getComputedStyle(el, '::after').content
    );
    expect(formLabel).toContain('Lead Capture');

    // main element — unlabeled with no labeled ancestor, falls back to the
    // tag name. (Descendants of labeled elements inherit --wf-label-text, so
    // e.g. the fieldsets inside the labeled form show "Lead Capture".)
    const mainLabel = await page.locator('#demo-content main').evaluate(
      (el) => getComputedStyle(el, '::after').content
    );
    expect(mainLabel).toContain('<main>');

    // table element — labeled
    const tableLabel = await page.locator('table').first().evaluate(
      (el) => getComputedStyle(el, '::after').content
    );
    expect(tableLabel).toContain('Plan Comparison');
  });

  test('labels and annotations coexist — ::before badge + ::after tag name', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Enable overlay annotations with default fidelity
    await page.locator('#annotate-toggle').check();

    // Header has data-wf-label="Site Header" — should show badge on ::before
    const headerBefore = await page.locator('header[data-wf-label]').evaluate(
      (el) => getComputedStyle(el, '::before').content
    );
    expect(headerBefore).not.toBe('none');
    expect(headerBefore).not.toBe('""');

    // And annotation on ::after (labeled element shows its data-wf-label)
    const headerAfter = await page.locator('header').evaluate(
      (el) => getComputedStyle(el, '::after').content
    );
    expect(headerAfter).toContain('Global Header');
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

    // The demo scopes wireframe to #demo-content, so html-level mode is off
    // until enabled through the API
    expect(await page.evaluate(() => VanillaBreeze.wireframe.isActive())).toBe(false);

    await page.evaluate(() => VanillaBreeze.wireframe.setFidelity('mid'));
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

test.describe('wireframe callouts', () => {

  test('renderCallouts() injects numbered markers', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => VanillaBreeze.wireframe.renderCallouts());

    // The demo has 5 elements with data-wf-callout
    const markerCount = await page.locator('[data-wf-callout-marker]').count();
    expect(markerCount).toBe(5);

    // Markers should be <mark> elements
    const tagName = await page.locator('[data-wf-callout-marker]').first().evaluate(
      (el) => el.tagName
    );
    expect(tagName).toBe('MARK');
  });

  test('renderCalloutPanel() creates panel with ordered list', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      VanillaBreeze.wireframe.renderCallouts();
      // Append to the demo scope like the demo's callout toggle does —
      // foot-notes only collects foot-note elements that precede it, and the
      // footer callout sits after <main> (the no-arg default target)
      VanillaBreeze.wireframe.renderCalloutPanel(document.getElementById('demo-content'));
    });

    const panel = page.locator('[data-wf-callout-panel]');
    await expect(panel).toBeVisible();

    // Panel is a <foot-notes> element — the footnotes component collects the
    // generated foot-note entries and handles numbering/back-links
    const tagName = await panel.evaluate((el) => el.tagName);
    expect(tagName).toBe('FOOT-NOTES');

    // Should have an <ol> with 5 items
    const itemCount = await panel.locator('ol li').count();
    expect(itemCount).toBe(5);

    // First item text should match the hero callout
    const firstText = await panel.locator('ol li').first().textContent();
    expect(firstText).toContain('full-bleed layout');
  });

  test('addCallout() and removeCallout() work programmatically', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Add a callout to footer
    await page.evaluate(() => {
      VanillaBreeze.wireframe.addCallout('footer', 'Footer needs social links');
    });

    const calloutAttr = await page.locator('footer').evaluate(
      (el) => el.dataset.wfCallout
    );
    expect(calloutAttr).toBe('Footer needs social links');

    // Remove it
    await page.evaluate(() => {
      VanillaBreeze.wireframe.removeCallout('footer');
    });

    const removed = await page.locator('footer').evaluate(
      (el) => el.hasAttribute('data-wf-callout')
    );
    expect(removed).toBe(false);
  });

});
