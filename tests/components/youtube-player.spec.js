// @ts-check
import { test, expect } from 'playwright/test';

const DEMO = '/docs/examples/demos/youtube-player-basic.html';

test.describe('youtube-player', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('youtube-player[state]');
  });

  test('renders facade state with thumbnail and play button', async ({ page }) => {
    const player = page.locator('youtube-player').first();
    await expect(player).toHaveAttribute('state', 'ready');
    await expect(player.locator('img')).toBeVisible();
    await expect(player.locator('button')).toBeVisible();
  });

  test('thumbnail loads from ytimg.com', async ({ page }) => {
    const img = page.locator('youtube-player').first().locator('img');
    const src = await img.getAttribute('src');
    expect(src).toContain('i.ytimg.com');
    expect(src).toContain('hqdefault.jpg');
  });

  test('play button has accessible label', async ({ page }) => {
    const button = page.locator('youtube-player').first().locator('button');
    const label = await button.getAttribute('aria-label');
    expect(label).toContain('Play');
  });

  test('host has tabindex and role in facade state', async ({ page }) => {
    const player = page.locator('youtube-player').first();
    await expect(player).toHaveAttribute('tabindex', '0');
    await expect(player).toHaveAttribute('role', 'button');
  });

  test('click activates iframe with youtube-nocookie.com', async ({ page }) => {
    const player = page.locator('youtube-player').first();
    await player.click();
    await expect(player).toHaveAttribute('state', 'active');

    const iframe = player.locator('iframe');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('youtube-nocookie.com');
    expect(src).toContain('autoplay=1');
  });

  test('iframe has accessible title', async ({ page }) => {
    const player = page.locator('youtube-player').first();
    await player.click();
    const iframe = player.locator('iframe');
    const title = await iframe.getAttribute('title');
    expect(title).toBeTruthy();
  });

  test('host removes tabindex and role after activation', async ({ page }) => {
    const player = page.locator('youtube-player').first();
    await player.click();
    await expect(player).not.toHaveAttribute('tabindex');
    await expect(player).not.toHaveAttribute('role');
  });

  test('keyboard activation with Enter', async ({ page }) => {
    const player = page.locator('youtube-player').first();
    await player.focus();
    await page.keyboard.press('Enter');
    await expect(player).toHaveAttribute('state', 'active');
    await expect(player.locator('iframe')).toBeVisible();
  });

  test('keyboard activation with Space', async ({ page }) => {
    // Use the second player to avoid the first already being activated
    const player = page.locator('youtube-player').nth(1);
    await player.focus();
    await page.keyboard.press(' ');
    await expect(player).toHaveAttribute('state', 'active');
    await expect(player.locator('iframe')).toBeVisible();
  });

  test('start passes through to embed URL', async ({ page }) => {
    // The "Start at Timestamp" player has start="30"
    const player = page.locator('youtube-player[start="30"]');
    await player.click();
    const src = await player.locator('iframe').getAttribute('src');
    expect(src).toContain('start=30');
  });

  test('list passes through to embed URL', async ({ page }) => {
    const player = page.locator('youtube-player[list]');
    await player.click();
    const src = await player.locator('iframe').getAttribute('src');
    expect(src).toContain('list=');
  });

  test('rounded class applies border-radius', async ({ page }) => {
    const player = page.locator('youtube-player.rounded').first();
    const radius = await player.evaluate(el => getComputedStyle(el).borderRadius);
    expect(radius).not.toBe('0px');
  });

  test('no iframe present before click (privacy)', async ({ page }) => {
    const iframes = await page.locator('youtube-player[state="ready"] iframe').count();
    expect(iframes).toBe(0);
  });
});
