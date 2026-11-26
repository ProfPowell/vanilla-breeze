/**
 * Wait for the CSS transitions running on a page to finish.
 *
 * Chromium 159 can resolve style before every stylesheet in <head> has
 * arrived when the machine is busy, so a later sheet (a theme, a forced
 * colours block) starts colour transitions that are still in flight when
 * `load` fires. A test that reads a computed colour straight after
 * navigation then sees a value part-way between two themes. Call this after
 * `page.goto()` in any loader whose tests read colours.
 *
 * Only transitions are awaited: animations may be infinite.
 *
 * @param {import('playwright/test').Page} page
 */
export async function settle(page) {
  await page.evaluate(async () => {
    for (let pass = 0; pass < 5; pass++) {
      const running = document.getAnimations().filter((a) => a instanceof CSSTransition);
      if (!running.length) return;
      await Promise.allSettled(running.map((a) => a.finished));
    }
  });
}
