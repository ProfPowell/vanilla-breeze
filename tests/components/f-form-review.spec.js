/**
 * form coordinator — F-element review fixes (vanilla-breeze-4rtb).
 *
 * Covers: summary text rendered as text (no HTML injection); first invalid
 * control focus (never a fieldset); focus stays on the submitter on a valid
 * submit; data-loading not stuck after an invalid submit; fetch defaults to
 * POST and builds a querystring for GET; the submitter's name/value reaches
 * FormData in every mode; the summary is not rewritten per keystroke and is
 * hidden after clearing; radio groups yield one entry; fetch success/network
 * error status elements; hidden conditional sections never block submit;
 * plural-aware summary heading overrides.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__f-form-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/form-field/logic.js';
        import '/src/utils/loading-button-init.js';
        import '/src/utils/conditional-init.js';
        import { initFormCoordinator } from '/src/lib/form-coordinator.js';
        initFormCoordinator();
        window.__ready = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready);
  await page.waitForSelector('form[data-vb-enhanced]');
}

test.describe('summary rendering', () => {
  test('legacy summary renders labels/messages as text (no injection)', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event">
        <output class="error-summary" role="alert" tabindex="-1"></output>
        <label for="n">&lt;b&gt;Name&lt;/b&gt;</label>
        <input id="n" name="n" required data-message-valuemissing="&lt;img src=x onerror=&quot;window.__xss=1&quot;&gt;">
        <button>Go</button>
      </form>`);
    await page.click('button');
    const summary = page.locator('output.error-summary');
    await expect(summary.locator('li')).toHaveCount(1);
    expect(await summary.locator('img, b').count()).toBe(0);
    await expect(summary.locator('a')).toHaveText('<b>Name</b>: <img src=x onerror="window.__xss=1">');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test('server field errors (setError) render as text in the summary', async ({ page }) => {
    await page.route('**/__srv-errors', (route) => route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ errors: { email: '<img src=x onerror="window.__xss=1">' } }),
    }));
    await load(page, `
      <form data-validate data-submit="fetch" action="/__srv-errors" method="post">
        <output class="error-summary" role="alert" tabindex="-1"></output>
        <form-field>
          <label for="em">Email</label>
          <input id="em" name="email" type="email" value="a@b.co">
          <output class="error" for="em"></output>
        </form-field>
        <button>Go</button>
      </form>`);
    await page.click('button');
    const link = page.locator('output.error-summary a');
    await expect(link).toHaveText('Email: <img src=x onerror="window.__xss=1">');
    await expect(link).toHaveAttribute('href', '#em');
    expect(await page.locator('output.error-summary img').count()).toBe(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test('radio group yields one entry linking its first radio (ids generated)', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event">
        <section data-form-summary role="alert" tabindex="-1" hidden>
          <h2 data-summary-heading>Problems</h2><ul data-summary-list></ul>
        </section>
        <fieldset>
          <legend>Plan</legend>
          <label><input type="radio" name="plan" value="a" required> A</label>
          <label><input type="radio" name="plan" value="b"> B</label>
          <label><input type="radio" name="plan" value="c"> C</label>
        </fieldset>
        <button>Go</button>
      </form>`);
    await page.click('button');
    const links = page.locator('[data-summary-list] a');
    await expect(links).toHaveCount(1);
    await expect(links).toContainText('Plan:');
    const href = await links.getAttribute('href');
    const firstId = await page.locator('input[value="a"]').getAttribute('id');
    expect(firstId).toBeTruthy();
    expect(href).toBe(`#${firstId}`);
    await links.click();
    await expect(page.locator('input[value="a"]')).toBeFocused();
  });

  test('checkbox-group entry targets its first checkbox, message via form override', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event" data-message-min-checked="Pick {min}+">
        <section data-form-summary role="alert" tabindex="-1" hidden><ul data-summary-list></ul></section>
        <fieldset data-min-checked="2">
          <legend>Toppings</legend>
          <label><input type="checkbox" id="t1" name="t" value="1"> One</label>
          <label><input type="checkbox" id="t2" name="t" value="2"> Two</label>
          <output></output>
        </fieldset>
        <button>Go</button>
      </form>`);
    await page.click('button');
    const link = page.locator('[data-summary-list] a');
    await expect(link).toHaveText('Toppings: Pick 2+');
    await expect(link).toHaveAttribute('href', '#t1');
  });

  test('plural-aware heading overrides with {count}', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event"
            data-label-summary-one="Fix {count} thing" data-label-summary-other="Fix {count} things">
        <section data-form-summary role="alert" tabindex="-1" hidden>
          <h2 data-summary-heading>x</h2><ul data-summary-list></ul>
        </section>
        <label for="a">A</label><input id="a" name="a" required>
        <label for="b">B</label><input id="b" name="b" required>
        <button>Go</button>
      </form>`);
    await page.click('button');
    await expect(page.locator('[data-summary-heading]')).toHaveText('Fix 2 things');
    await page.fill('#a', 'x');
    await page.click('button');
    await expect(page.locator('[data-summary-heading]')).toHaveText('Fix 1 thing');
  });

  test('summary is not rewritten per keystroke and is hidden after clearing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, `
      <form data-validate data-submit="event">
        <section data-form-summary role="alert" tabindex="-1" hidden>
          <h2>Problems</h2><ul data-summary-list></ul>
        </section>
        <form-field>
          <label for="nm">Name</label>
          <input id="nm" name="nm" required minlength="5">
          <output class="error" for="nm"></output>
        </form-field>
        <button>Go</button>
      </form>`);
    await page.click('button');
    const summary = page.locator('[data-form-summary]');
    await expect(summary).toBeVisible();
    // Move focus into the field first and let the focusout refresh (from the
    // summary, which took focus on submit) settle — that refresh is the
    // intended blur-time update. Only keystrokes are measured below.
    await page.locator('#nm').focus();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.evaluate(() => {
      window.__mutations = 0;
      new MutationObserver((m) => { window.__mutations += m.length; })
        .observe(document.querySelector('[data-form-summary]'), { childList: true, subtree: true, characterData: true });
    });
    await page.locator('#nm').pressSequentially('abc', { delay: 30 });
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__mutations)).toBe(0);

    await page.locator('#nm').pressSequentially('defg');
    await page.locator('#nm').blur();
    await expect(summary).toHaveAttribute('hidden', '');
    await expect(summary).toBeHidden();
    await expect(summary).not.toHaveAttribute('data-visible');
    await expect(page.locator('[data-summary-list] a')).toHaveCount(0);
  });
});

test.describe('focus', () => {
  test('no summary: focuses the first invalid control, not its fieldset', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event">
        <fieldset><legend>Who</legend>
          <label for="first">First</label><input id="first" name="first" required>
        </fieldset>
        <label for="second">Second</label><input id="second" name="second" required>
        <button>Go</button>
      </form>`);
    await page.click('button');
    await expect(page.locator('#first')).toBeFocused();
    await expect(page.locator('#first')).toHaveAttribute('aria-invalid', 'true');
  });

  test('valid submit leaves focus on the submitter and never blurs fields', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event">
        <form-field>
          <label for="q">Query</label><input id="q" name="q" required value="x">
          <output class="error" for="q"></output>
        </form-field>
        <button id="go">Go</button>
      </form>`);
    await page.evaluate(() => {
      window.__blurs = 0;
      document.getElementById('q').addEventListener('blur', () => window.__blurs++);
    });
    await page.click('#go');
    await expect(page.locator('#go')).toBeFocused();
    expect(await page.evaluate(() => window.__blurs)).toBe(0);
  });
});

test.describe('loading button', () => {
  test('not activated by an invalid submit; activated when the submit proceeds', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event">
        <label for="r">R</label><input id="r" name="r" required>
        <button id="go" data-loading="Saving">Save</button>
      </form>`);
    await page.click('#go');
    await page.waitForTimeout(50);
    await expect(page.locator('#go')).not.toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#go')).toHaveText('Save');

    await page.fill('#r', 'ok');
    await page.click('#go');
    await expect(page.locator('#go')).toHaveAttribute('aria-busy', 'true');
  });

  test('a cancelled vb:beforesubmit does not start the spinner', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event" id="f">
        <button id="go" data-loading>Save</button>
      </form>`);
    await page.evaluate(() => document.getElementById('f')
      .addEventListener('vb:beforesubmit', (e) => e.preventDefault()));
    await page.click('#go');
    await page.waitForTimeout(50);
    await expect(page.locator('#go')).not.toHaveAttribute('aria-busy', 'true');
  });
});

test.describe('submission', () => {
  test('fetch mode without method attribute POSTs', async ({ page }) => {
    let method = '';
    await page.route('**/__ep', (route) => {
      method = route.request().method();
      return route.fulfill({ status: 200, body: '{}', contentType: 'application/json' });
    });
    await load(page, `
      <form data-validate data-submit="fetch" action="/__ep">
        <input name="a" value="1" aria-label="a">
        <button>Go</button>
      </form>`);
    await page.click('button');
    await expect(page.locator('form')).toHaveAttribute('data-success', '');
    expect(method).toBe('POST');
  });

  test('fetch GET builds a querystring including the submitter', async ({ page }) => {
    let url = '';
    await page.route('**/__ep?**', (route) => {
      url = route.request().url();
      return route.fulfill({ status: 200, body: '{}', contentType: 'application/json' });
    });
    await load(page, `
      <form data-validate data-submit="fetch" action="/__ep" method="get">
        <input name="q" value="a b" aria-label="q">
        <button name="op" value="find">Go</button>
      </form>`);
    await page.click('button');
    await expect(page.locator('form')).toHaveAttribute('data-success', '');
    const u = new URL(url);
    expect(u.searchParams.get('q')).toBe('a b');
    expect(u.searchParams.get('op')).toBe('find');
  });

  test('fetch honours the submitter value, formaction and formmethod', async ({ page }) => {
    const seen = [];
    await page.route('**/__alt**', (route) => {
      const r = route.request();
      seen.push({ method: r.method(), url: r.url(), body: r.postData() ?? '' });
      return route.fulfill({ status: 200, body: '{}', contentType: 'application/json' });
    });
    await load(page, `
      <form data-validate data-submit="fetch" action="/__main" method="get">
        <input name="a" value="1" aria-label="a">
        <button name="op" value="save">Save</button>
        <button name="op" value="delete" formaction="/__alt" formmethod="post" id="del">Delete</button>
      </form>`);
    await page.click('#del');
    await expect(page.locator('form')).toHaveAttribute('data-success', '');
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(seen[0].body).toContain('delete');
    expect(seen[0].body).not.toContain('save');
  });

  test('vb:submit FormData carries the submitter', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event" id="f">
        <button name="op" value="save">Save</button>
        <button name="op" value="delete" id="del">Delete</button>
      </form>`);
    await page.evaluate(() => document.getElementById('f').addEventListener('vb:submit',
      (e) => { window.__op = /** @type {CustomEvent} */ (e).detail.get('op'); }));
    await page.click('#del');
    await expect.poll(() => page.evaluate(() => window.__op)).toBe('delete');
  });

  test('native mode submits with the submitter (name/value + formaction)', async ({ page }) => {
    await page.route('**/__native-target**', (route) => route.fulfill({
      status: 200, contentType: 'text/html', body: '<!doctype html><title>done</title>',
    }));
    await load(page, `
      <form data-validate action="/__wrong" method="get">
        <input name="a" value="1" aria-label="a">
        <button name="op" value="save">Save</button>
        <button name="op" value="delete" formaction="/__native-target" id="del">Delete</button>
      </form>`);
    await Promise.all([page.waitForURL('**/__native-target**'), page.click('#del')]);
    const u = new URL(page.url());
    expect(u.searchParams.get('op')).toBe('delete');
    expect(u.searchParams.get('a')).toBe('1');
  });

  test('fetch success focuses the success element (tabindex -1, role status)', async ({ page }) => {
    await page.route('**/__ok', (route) => route.fulfill({ status: 200, body: '{}', contentType: 'application/json' }));
    await load(page, `
      <form data-validate data-submit="fetch" action="/__ok">
        <button>Go</button>
        <section data-form-success hidden><p>Thanks</p></section>
      </form>`);
    const ok = page.locator('[data-form-success]');
    await expect(ok).toBeHidden();
    await page.click('button');
    await expect(ok).toBeFocused();
    await expect(ok).toHaveAttribute('tabindex', '-1');
    await expect(ok).toHaveAttribute('role', 'status');
  });

  test('network error shows a [data-form-error] alert; next submit clears it', async ({ page }) => {
    let fail = true;
    await page.route('**/__flaky', (route) => (fail
      ? route.abort()
      : route.fulfill({ status: 200, body: '{}', contentType: 'application/json' })));
    await load(page, `
      <form data-validate data-submit="fetch" action="/__flaky" data-message-network="Réseau indisponible">
        <button>Go</button>
      </form>`);
    await page.click('button');
    const err = page.locator('[data-form-error]');
    await expect(err).toBeVisible();
    await expect(err).toHaveAttribute('role', 'alert');
    await expect(err).toHaveText('Réseau indisponible');
    await expect(page.locator('form')).toHaveAttribute('data-error', 'network');

    fail = false;
    await page.click('button');
    await expect(page.locator('form')).toHaveAttribute('data-success', '');
    await expect(page.locator('form')).not.toHaveAttribute('data-error');
    await expect(err).toBeHidden();
  });
});

test.describe('conditional sections', () => {
  test('a hidden required field does not block submit; author-disabled stays disabled', async ({ page }) => {
    await load(page, `
      <form data-validate data-submit="event" id="f">
        <label for="t">Type</label>
        <select id="t" name="type"><option value="personal">Personal</option><option value="business">Business</option></select>
        <fieldset data-show-when="type=business" id="biz">
          <legend>Business</legend>
          <label for="co">Company</label><input id="co" name="company" required>
          <label for="vat">VAT</label><input id="vat" name="vat" disabled>
        </fieldset>
        <button>Go</button>
      </form>`);
    await page.evaluate(() => document.getElementById('f').addEventListener('vb:submit',
      (e) => { window.__data = [.../** @type {CustomEvent} */ (e).detail.keys()]; }));
    await expect(page.locator('#biz')).toBeHidden();
    await page.click('button');
    await expect.poll(() => page.evaluate(() => window.__data)).toEqual(['type']);

    await page.selectOption('#t', 'business');
    await expect(page.locator('#biz')).toBeVisible();
    await expect(page.locator('#co')).toBeEnabled();
    await expect(page.locator('#vat')).toBeDisabled();

    await page.selectOption('#t', 'personal');
    await page.selectOption('#t', 'business');
    await expect(page.locator('#vat')).toBeDisabled();
  });
});
