/**
 * Video Player Web Component Behavior Tests
 *
 * Tests interactive behavior, keyboard navigation, overlay controls,
 * and ARIA state for the video-player component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/video-player-basic.html';

test.describe('video-player', () => {

  test('renders video-player with shadow DOM controls', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const player = page.locator('video-player').first();
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute('data-upgraded', '');
    await expect(player).toHaveAttribute('state', 'idle');
  });

  test('video element is visible in light DOM', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const video = page.locator('video-player video').first();
    await expect(video).toBeVisible();
  });

  test('native controls are removed after upgrade', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const hasControls = await page.locator('video-player video').first()
      .evaluate(el => el.hasAttribute('controls'));
    expect(hasControls).toBe(false);
  });

  test('play overlay is visible before first play', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const overlay = page.locator('video-player').first()
      .locator('css=.play-overlay >> nth=0');
    // The overlay is in shadow DOM — check via evaluate
    const visible = await page.locator('video-player').first().evaluate(el => {
      const overlay = el.shadowRoot.querySelector('.play-overlay');
      const style = getComputedStyle(overlay);
      return style.opacity !== '0' && style.pointerEvents !== 'none';
    });
    expect(visible).toBe(true);
  });

  test('shadow DOM has controls group with aria-label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const hasGroup = await page.locator('video-player').first().evaluate(el => {
      const controls = el.shadowRoot.querySelector('.controls');
      return controls?.getAttribute('role') === 'group' &&
             controls?.getAttribute('aria-label') === 'Video controls';
    });
    expect(hasGroup).toBe(true);
  });

  test('play button has correct aria-label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const label = await page.locator('video-player').first().evaluate(el => {
      return el.shadowRoot.querySelector('.play-btn')?.getAttribute('aria-label');
    });
    expect(label).toBe('Play');
  });

  test('captions button is hidden when no tracks exist', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // First player has no captions track
    const hidden = await page.locator('video-player').first().evaluate(el => {
      return el.shadowRoot.querySelector('.captions-btn')?.hidden;
    });
    expect(hidden).toBe(true);
  });

  test('speed button starts at 1x', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const text = await page.locator('video-player').first().evaluate(el => {
      return el.shadowRoot.querySelector('.speed-btn span')?.textContent;
    });
    expect(text).toBe('1x');
  });

  test('keyboard Space toggles play state', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const player = page.locator('video-player').first();
    await player.focus();
    await page.keyboard.press('Space');

    // Should attempt to play — retry while the media element spins up
    // (a one-shot read races the async play()/buffering transition)
    await expect(player).toHaveAttribute('state', /^(playing|buffering)$/);
  });

  test('keyboard M toggles mute', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const player = page.locator('video-player').first();
    await player.focus();

    // Mute
    await page.keyboard.press('m');
    await expect(player).toHaveAttribute('muted', '');

    // Unmute
    await page.keyboard.press('m');
    const hasMuted = await player.evaluate(el => el.hasAttribute('muted'));
    expect(hasMuted).toBe(false);
  });

  test('has tabindex for keyboard focus', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const player = page.locator('video-player').first();
    await expect(player).toHaveAttribute('tabindex', '0');
  });

  test('playlist renders track list items', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Third video-player has the playlist
    const tracks = page.locator('video-player').nth(2).locator('.track-list li');
    await expect(tracks).toHaveCount(2);
  });

  test('playlist has active track marked', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const activeTrack = page.locator('video-player').nth(2)
      .locator('li[data-video-active]');
    await expect(activeTrack).toHaveCount(1);
  });

  test('fullscreen button has correct aria-label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const label = await page.locator('video-player').first().evaluate(el => {
      return el.shadowRoot.querySelector('.fullscreen-btn')?.getAttribute('aria-label');
    });
    expect(label).toBe('Fullscreen');
  });

  test('status region exists for screen reader announcements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const hasStatus = await page.locator('video-player').first().evaluate(el => {
      const status = el.shadowRoot.querySelector('[role="status"]');
      return status !== null;
    });
    expect(hasStatus).toBe(true);
  });

});
