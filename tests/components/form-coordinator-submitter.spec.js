/**
 * form[data-validate] and the submit button's own overrides.
 *
 * - formnovalidate on the submitter skips VB validation in native, event
 *   and fetch modes, exactly as the browser would for a plain form.
 * - data-submit="fetch" honours formenctype / enctype (urlencoded,
 *   text/plain, multipart; multipart when neither is authored).
 * - data-wizard + data-validate still routes a submit to the step holding
 *   the first invalid control (the coordinator sets novalidate, which the
 *   wizard used to read as "validation off"), and fires wizard:complete
 *   once, only for a submission the coordinator lets through.
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
  await page.route('**/__landed.html*', (route) => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8',
    body: '<!doctype html><title>landed</title><p id="landed">landed</p>',
  }));
  const url = `/__form-submitter-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/main.js"></script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('form[data-vb-enhanced]');
}

const FIELDS = `
  <label for="title">Title</label>
  <input id="title" name="title" required>
  <label for="note">Note</label>
  <input id="note" name="note" value="a b&amp;c">`;

test.describe('formnovalidate in a data-validate form', () => {
  test('native mode: the formnovalidate button submits past an empty required field', async ({ page }) => {
    await load(page, `<form data-validate action="/__landed.html" method="get">${FIELDS}
      <button type="submit" id="publish">Publish</button>
      <button type="submit" id="draft" name="intent" value="draft" formnovalidate>Save draft</button>
    </form>`);
    await Promise.all([page.waitForURL('**/__landed.html?**'), page.click('#draft')]);
    const url = new URL(page.url());
    expect(url.searchParams.get('intent')).toBe('draft');
    expect(url.searchParams.get('title')).toBe('');
  });

  test('native mode: a plain submit button is still blocked', async ({ page }) => {
    await load(page, `<form data-validate action="/__landed.html" method="get">${FIELDS}
      <button type="submit" id="publish">Publish</button>
      <button type="submit" id="draft" formnovalidate>Save draft</button>
    </form>`);
    await page.click('#publish');
    await expect(page.locator('#title')).toHaveAttribute('aria-invalid', 'true');
    await page.waitForTimeout(200);
    expect(page.url()).not.toContain('__landed');
  });

  test('native mode: input type=submit with formnovalidate also skips', async ({ page }) => {
    await load(page, `<form data-validate action="/__landed.html" method="get">${FIELDS}
      <input type="submit" id="draft" name="intent" value="draft" formnovalidate>
    </form>`);
    await Promise.all([page.waitForURL('**/__landed.html?**'), page.click('#draft')]);
    expect(new URL(page.url()).searchParams.get('intent')).toBe('draft');
  });

  test('a formnovalidate submit clears an open error summary', async ({ page }) => {
    await load(page, `<form data-validate data-submit="event" action="/x">
      <section data-form-summary role="alert" tabindex="-1" hidden>
        <h2 data-summary-heading>Fix</h2><ul data-summary-list></ul>
      </section>${FIELDS}
      <button type="submit" id="publish">Publish</button>
      <button type="submit" id="draft" formnovalidate>Save draft</button>
    </form>`);
    await page.click('#publish');
    await expect(page.locator('[data-form-summary]')).toBeVisible();
    await page.click('#draft');
    await expect(page.locator('[data-form-summary]')).toBeHidden();
  });

  test('event mode: vb:submit fires for formnovalidate, with the button value', async ({ page }) => {
    await load(page, `<form data-validate data-submit="event" action="/x">${FIELDS}
      <button type="submit" id="publish">Publish</button>
      <button type="submit" id="draft" name="intent" value="draft" formnovalidate>Save draft</button>
    </form>`);
    await page.evaluate(() => {
      window.__events = [];
      document.querySelector('form').addEventListener('vb:submit', (e) => {
        window.__events.push(Object.fromEntries(e.detail));
      });
    });
    await page.click('#publish');
    await page.click('#draft');
    await page.waitForFunction(() => window.__events.length > 0);
    const events = await page.evaluate(() => window.__events);
    expect(events).toEqual([{ title: '', note: 'a b&c', intent: 'draft' }]);
  });

  test('fetch mode: formnovalidate sends to formaction', async ({ page }) => {
    const hits = [];
    await page.route('**/api/**', (route) => {
      hits.push(new URL(route.request().url()).pathname);
      return route.fulfill({ status: 200, body: 'ok' });
    });
    await load(page, `<form data-validate data-submit="fetch" action="/api/publish" method="post">${FIELDS}
      <button type="submit" id="publish">Publish</button>
      <button type="submit" id="draft" formaction="/api/draft" formnovalidate>Save draft</button>
    </form>`);
    await page.click('#publish');
    await page.click('#draft');
    await expect.poll(() => hits).toEqual(['/api/draft']);
  });
});

test.describe('data-submit="fetch" encoding', () => {
  async function captureBody(page, enctypeAttrs, buttonAttrs = '') {
    let req;
    await page.route('**/api/**', (route) => {
      req = route.request();
      return route.fulfill({ status: 200, body: 'ok' });
    });
    await load(page, `<form data-validate data-submit="fetch" action="/api/save" method="post" ${enctypeAttrs}>
      <input name="title" value="Hello">${FIELDS.replace(' required', '')}
      <button type="submit" id="go" ${buttonAttrs}>Go</button>
    </form>`);
    await page.click('#go');
    await expect.poll(() => req).toBeTruthy();
    return { type: (await req.allHeaders())['content-type'], body: req.postData() };
  }

  test('no enctype authored: multipart', async ({ page }) => {
    const { type } = await captureBody(page, '');
    expect(type).toMatch(/^multipart\/form-data; boundary=/);
  });

  test('form enctype urlencoded', async ({ page }) => {
    const { type, body } = await captureBody(page, 'enctype="application/x-www-form-urlencoded"');
    expect(type).toMatch(/^application\/x-www-form-urlencoded/);
    expect(body).toBe('title=Hello&title=&note=a+b%26c');
  });

  test('formenctype on the button overrides the form', async ({ page }) => {
    const { type, body } = await captureBody(page, 'enctype="multipart/form-data"', 'formenctype="text/plain"');
    expect(type).toMatch(/^text\/plain/);
    expect(body).toBe('title=Hello\r\ntitle=\r\nnote=a b&c\r\n');
  });
});

test.describe('data-wizard + data-validate', () => {
  const WIZARD = `<form data-wizard data-validate action="/__landed.html" method="get">
    <fieldset data-wizard-step>
      <legend>Account</legend>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required>
    </fieldset>
    <fieldset data-wizard-step>
      <legend>Profile</legend>
      <label for="name">Name</label>
      <input id="name" name="name" value="Ada">
    </fieldset>
  </form>`;

  test('submit on the last step routes back to the step with the first invalid control', async ({ page }) => {
    await load(page, WIZARD);
    await page.waitForSelector('form[data-wizard-enhanced]');
    await page.fill('#email', 'a@b.co');
    await page.evaluate(() => document.querySelector('form').wizardNext());
    await expect(page.locator('form')).toHaveAttribute('data-wizard-current', '2');
    // The earlier answer goes bad after the step was left.
    await page.evaluate(() => { document.getElementById('email').value = ''; });
    await page.locator('form [type="submit"]').filter({ visible: true }).click();
    await expect(page.locator('form')).toHaveAttribute('data-wizard-current', '1');
    await expect(page.locator('#email')).toBeFocused();
    expect(page.url()).not.toContain('__landed');
  });

  test('a valid wizard still submits through the coordinator', async ({ page }) => {
    await load(page, WIZARD);
    await page.waitForSelector('form[data-wizard-enhanced]');
    await page.fill('#email', 'a@b.co');
    await page.evaluate(() => document.querySelector('form').wizardNext());
    await Promise.all([
      page.waitForURL('**/__landed.html?**'),
      page.locator('form [type="submit"]').filter({ visible: true }).click(),
    ]);
    expect(new URL(page.url()).searchParams.get('email')).toBe('a@b.co');
  });

  test('wizard:complete fires once, and not for a blocked submit', async ({ page }) => {
    await load(page, `<form data-wizard data-validate action="/__landed.html" method="get">
      <fieldset data-wizard-step><legend>A</legend><label for="a">A</label><input id="a" name="a" value="x"></fieldset>
      <fieldset data-wizard-step><legend>B</legend><label for="b">B</label><input id="b" name="b" required></fieldset>
    </form>`);
    await page.waitForSelector('form[data-wizard-enhanced]');
    await page.evaluate(() => {
      sessionStorage.setItem('completes', '0');
      document.querySelector('form').addEventListener('wizard:complete', () => {
        sessionStorage.setItem('completes', String(Number(sessionStorage.getItem('completes')) + 1));
      });
      document.querySelector('form').wizardNext();
    });
    const submit = page.locator('form [type="submit"]').filter({ visible: true });
    await submit.click();
    await expect(page.locator('#b')).toHaveAttribute('aria-invalid', 'true');
    expect(await page.evaluate(() => sessionStorage.getItem('completes'))).toBe('0');
    await page.fill('#b', 'y');
    await Promise.all([page.waitForURL('**/__landed.html?**'), submit.click()]);
    expect(await page.evaluate(() => sessionStorage.getItem('completes'))).toBe('1');
  });

  test('wizard:complete waits for a cancelled vb:beforesubmit', async ({ page }) => {
    await load(page, `<form data-wizard data-validate data-submit="event" action="/x">
      <fieldset data-wizard-step><legend>A</legend><label for="a">A</label><input id="a" name="a" value="x"></fieldset>
    </form>`);
    await page.waitForSelector('form[data-wizard-enhanced]');
    await page.evaluate(() => {
      window.__n = 0;
      const form = document.querySelector('form');
      form.addEventListener('wizard:complete', () => { window.__n++; });
      form.addEventListener('vb:beforesubmit', (e) => { if (!window.__let) e.preventDefault(); });
    });
    const submit = page.locator('form [type="submit"]').filter({ visible: true });
    await submit.click();
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__n)).toBe(0);
    await page.evaluate(() => { window.__let = true; });
    await submit.click();
    await expect.poll(() => page.evaluate(() => window.__n)).toBe(1);
  });
});
