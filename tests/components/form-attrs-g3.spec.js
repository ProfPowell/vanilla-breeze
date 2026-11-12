/**
 * data-show-when / data-hide-when and data-wizard — review fixes (G3).
 *
 * show-when: reset re-sync, late forms, conditions outside forms, checkbox
 * groups + multi-select, shared condition language, form-associated
 * custom elements, clone safety, hidden values not submitted.
 * wizard: Enter = Next, hidden conditional steps disabled, submit routes to
 * the invalid step (validate="none"), focus on step change, FACE validation
 * + conditions, labels + Intl, persistence via filter + VBStore expiry,
 * history entries, clone-safe init, progress-tracker sync, reset.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/** A minimal form-associated custom element with required validity. */
const FACE = `
  class XFace extends HTMLElement {
    static formAssociated = true;
    #v = '';
    constructor() { super(); this.internals = this.attachInternals(); }
    connectedCallback() { this.tabIndex = 0; this.#sync(); }
    get value() { return this.#v; }
    set value(v) { this.#v = String(v ?? ''); this.#sync(); }
    get name() { return this.getAttribute('name') || ''; }
    checkValidity() { return this.internals.checkValidity(); }
    reportValidity() { return this.internals.reportValidity(); }
    #sync() {
      this.internals.setFormValue(this.#v || null);
      if (this.hasAttribute('required') && !this.#v) this.internals.setValidity({ valueMissing: true }, 'Pick one', this);
      else this.internals.setValidity({});
    }
  }
  customElements.define('x-face', XFace);`;

async function load(page, body, { lang = 'en', modules = [], path } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = path ?? `/__g3-${Math.random().toString(36).slice(2)}.html`;
  const imports = ['/src/utils/conditional-init.js', '/src/lib/wizard.js', ...modules]
    .map((m) => `import '${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script>${FACE}</script>
      <script type="module">${imports}\nwindow.__ready = true;</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
  return url;
}

// ---------------------------------------------------------------------------
// data-show-when / data-hide-when
// ---------------------------------------------------------------------------

test.describe('data-show-when', () => {
  test('form reset re-evaluates sections and re-disables their controls', async ({ page }) => {
    await load(page, `
      <form id="f">
        <select id="t" name="type"><option value="personal">Personal</option><option value="business">Business</option></select>
        <fieldset data-show-when="type=business" id="biz"><legend>Biz</legend><input id="co" name="company" required></fieldset>
      </form>`);
    await page.selectOption('#t', 'business');
    await expect(page.locator('#biz')).toBeVisible();
    await expect(page.locator('#co')).toBeEnabled();
    await page.evaluate(() => document.getElementById('f').reset());
    await expect(page.locator('#biz')).toBeHidden();
    await expect(page.locator('#co')).toBeDisabled();
    await expect(page.locator('#co')).toHaveAttribute('data-conditional-disabled', '');
  });

  test('a cancelled reset changes nothing', async ({ page }) => {
    await load(page, `
      <form id="f">
        <select id="t" name="type"><option value="personal">Personal</option><option value="business">Business</option></select>
        <fieldset data-show-when="type=business" id="biz"><legend>Biz</legend><input name="company"></fieldset>
      </form>`);
    await page.selectOption('#t', 'business');
    await page.evaluate(() => {
      const f = document.getElementById('f');
      f.addEventListener('reset', (e) => e.preventDefault(), { once: true });
      f.reset();
    });
    await page.waitForTimeout(50);
    await expect(page.locator('#biz')).toBeVisible();
  });

  test('forms added after load update on change', async ({ page }) => {
    await load(page, '<p>start</p>');
    await page.evaluate(() => {
      const f = document.createElement('form');
      f.innerHTML = `<select id="t" name="plan"><option value="free">Free</option><option value="pro">Pro</option></select>
        <section data-show-when="plan=pro" id="pro"><input name="key"></section>`;
      document.querySelector('main').append(f);
    });
    await expect(page.locator('#pro')).toBeHidden();
    await page.selectOption('#t', 'pro');
    await expect(page.locator('#pro')).toBeVisible();
  });

  test('conditions outside any form work alongside ones inside a form', async ({ page }) => {
    await load(page, `
      <form><label><input type="checkbox" id="in" name="inside"> In</label>
        <p data-show-when="inside" id="a">A</p></form>
      <label><input type="checkbox" id="out" name="outside"> Out</label>
      <p data-show-when="outside" id="b">B</p>`);
    await expect(page.locator('#a')).toBeHidden();
    await expect(page.locator('#b')).toBeHidden();
    await page.check('#out');
    await expect(page.locator('#b')).toBeVisible();
    await page.check('#in');
    await expect(page.locator('#a')).toBeVisible();
  });

  test('checkbox groups match any checked value; select[multiple] any selected', async ({ page }) => {
    await load(page, `
      <form>
        <label><input type="checkbox" name="topics" value="news"> News</label>
        <label><input type="checkbox" id="sports" name="topics" value="sports"> Sports</label>
        <p data-show-when="topics=sports" id="s">Sports prefs</p>
        <select multiple id="m" name="langs"><option value="en">EN</option><option value="fr">FR</option><option value="de">DE</option></select>
        <p data-show-when="langs=fr" id="fr">French</p>
      </form>`);
    await expect(page.locator('#s')).toBeHidden();
    await page.check('#sports');
    await expect(page.locator('#s')).toBeVisible();
    await page.selectOption('#m', ['en', 'fr']);
    await expect(page.locator('#fr')).toBeVisible();
    await page.selectOption('#m', ['de']);
    await expect(page.locator('#fr')).toBeHidden();
  });

  test('shared condition language: &&, ||, !=, ":" separator, !name', async ({ page }) => {
    await load(page, `
      <form>
        <select id="r" name="role"><option value="user">User</option><option value="admin">Admin</option><option value="editor">Editor</option></select>
        <label><input type="checkbox" id="agree" name="agree"> Agree</label>
        <p data-show-when="role=admin && agree" id="and">and</p>
        <p data-show-when="role:admin || role:editor" id="or">or</p>
        <p data-show-when="role!=user" id="ne">ne</p>
        <p data-show-when="!agree" id="not">not</p>
      </form>`);
    await expect(page.locator('#and')).toBeHidden();
    await expect(page.locator('#or')).toBeHidden();
    await expect(page.locator('#ne')).toBeHidden();
    await expect(page.locator('#not')).toBeVisible();
    await page.selectOption('#r', 'editor');
    await expect(page.locator('#or')).toBeVisible();
    await expect(page.locator('#ne')).toBeVisible();
    await page.selectOption('#r', 'admin');
    await page.check('#agree');
    await expect(page.locator('#and')).toBeVisible();
    await expect(page.locator('#not')).toBeHidden();
  });

  test('form-associated custom elements drive conditions', async ({ page }) => {
    await load(page, `
      <form><x-face id="x" name="pick"></x-face><p data-show-when="pick=b" id="p">B chosen</p></form>`);
    await expect(page.locator('#p')).toBeHidden();
    await page.evaluate(() => {
      const x = /** @type {any} */ (document.getElementById('x'));
      x.value = 'b';
      x.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#p')).toBeVisible();
  });

  test('a cloned section (carrying data-conditional-init) is wired', async ({ page }) => {
    await load(page, `
      <form id="f"><label><input type="checkbox" id="c" name="more"> More</label>
        <p data-show-when="more" id="orig">More</p></form>`);
    await page.evaluate(() => {
      const clone = /** @type {Element} */ (document.getElementById('orig').cloneNode(true));
      clone.id = 'clone';
      clone.removeAttribute('hidden');
      clone.removeAttribute('inert');
      document.getElementById('f').append(clone);
    });
    await expect(page.locator('#clone')).toBeHidden();
    await page.check('#c');
    await expect(page.locator('#clone')).toBeVisible();
  });

  test('hidden section values are not submitted', async ({ page }) => {
    await load(page, `
      <form id="f"><select id="t" name="type"><option value="a">A</option><option value="b">B</option></select>
        <fieldset data-show-when="type=b"><legend>B</legend><input name="extra" value="x"></fieldset></form>`);
    const keys = () => page.evaluate(() => [...new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f'))).keys()]);
    expect(await keys()).toEqual(['type']);
    await page.selectOption('#t', 'b');
    expect(await keys()).toEqual(['type', 'extra']);
  });
});

// ---------------------------------------------------------------------------
// data-wizard
// ---------------------------------------------------------------------------

const WIZ = (attrs = '', extra = '') => `
  <form id="w" data-wizard ${attrs}>
    <fieldset data-wizard-step id="s1"><legend>Account</legend>
      <label for="email">Email</label><input type="email" id="email" name="email" required>
      <label for="pw">Password</label><input type="password" id="pw" name="pw">
      <input type="hidden" name="csrf" value="server-token">
    </fieldset>
    <fieldset data-wizard-step id="s2"><legend>Profile</legend>
      <label for="type">Type</label>
      <select id="type" name="type"><option value="personal">Personal</option><option value="business">Business</option></select>
    </fieldset>
    <fieldset data-wizard-step data-wizard-if="type:business" id="s3"><legend>Business</legend>
      <label for="co">Company</label><input id="co" name="company" required>
    </fieldset>
    <fieldset data-wizard-step id="s4"><legend>Review</legend><p>Done?</p></fieldset>
    ${extra}
  </form>`;

async function readyWizard(page) {
  await page.waitForSelector('#w[data-wizard-enhanced]');
}

test.describe('data-wizard', () => {
  test('Enter in a field before the last step goes Next and does not submit', async ({ page }) => {
    await load(page, WIZ());
    await readyWizard(page);
    await page.evaluate(() => {
      window.__submits = 0;
      document.getElementById('w').addEventListener('submit', (e) => { e.preventDefault(); window.__submits++; });
    });
    await page.fill('#email', 'a@b.co');
    await page.press('#email', 'Enter');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '2');
    expect(await page.evaluate(() => window.__submits)).toBe(0);
  });

  test('Enter with an invalid field stays on the step and reports it', async ({ page }) => {
    await load(page, WIZ());
    await readyWizard(page);
    await page.press('#email', 'Enter');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '1');
    await expect(page.locator('#email')).toBeFocused();
  });

  test('hidden conditional step: controls disabled, submit works, values not sent', async ({ page }) => {
    await load(page, WIZ());
    await readyWizard(page);
    await expect(page.locator('#co')).toBeDisabled();
    await expect(page.locator('#s3')).toHaveAttribute('data-wizard-hidden', '');
    await page.evaluate(() => {
      window.__sent = null;
      document.getElementById('w').addEventListener('submit', (e) => {
        e.preventDefault();
        window.__sent = [...new FormData(/** @type {HTMLFormElement} */ (e.target)).keys()];
      });
    });
    await page.fill('#email', 'a@b.co');
    await page.click('[data-wizard-next]');
    await page.click('[data-wizard-next]');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-last', '');
    await page.click('[data-wizard-nav] [type="submit"]');
    await expect.poll(() => page.evaluate(() => window.__sent)).not.toBeNull();
    expect(await page.evaluate(() => window.__sent)).not.toContain('company');

    // Condition met: the step and its control come back.
    await page.click('[data-wizard-prev]');
    await page.selectOption('#type', 'business');
    await expect(page.locator('#s3')).not.toHaveAttribute('data-wizard-hidden', '');
    await expect(page.locator('#co')).toBeEnabled();
  });

  test('data-wizard-validate="none": submit jumps to the first invalid step', async ({ page }) => {
    await load(page, WIZ('data-wizard-validate="none"'));
    await readyWizard(page);
    await page.evaluate(() => {
      window.__submits = 0;
      document.getElementById('w').addEventListener('submit', (e) => { e.preventDefault(); window.__submits++; });
    });
    await page.click('[data-wizard-next]');
    await page.click('[data-wizard-next]');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-last', '');
    await page.click('[data-wizard-nav] [type="submit"]');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '1');
    await expect(page.locator('#s1')).toHaveAttribute('data-wizard-active', '');
    await expect(page.locator('#email')).toBeFocused();
    expect(await page.evaluate(() => window.__submits)).toBe(0);
  });

  test('focus moves to the new step legend on Next and Back', async ({ page }) => {
    await load(page, WIZ());
    await readyWizard(page);
    await page.fill('#email', 'a@b.co');
    await page.click('[data-wizard-next]');
    await expect(page.locator('#s2 > legend')).toBeFocused();
    await page.click('[data-wizard-prev]');
    await expect(page.locator('#s1 > legend')).toBeFocused();
  });

  test('form-associated custom elements: validated per step and read by data-wizard-if', async ({ page }) => {
    await load(page, `
      <form id="w" data-wizard>
        <fieldset data-wizard-step id="s1"><legend>Pick</legend><x-face id="x" name="plan" required></x-face></fieldset>
        <fieldset data-wizard-step data-wizard-if="plan:pro" id="s2"><legend>Pro</legend><input name="seats"></fieldset>
        <fieldset data-wizard-step id="s3"><legend>Done</legend></fieldset>
      </form>`);
    await readyWizard(page);
    await page.evaluate(() => /** @type {any} */ (document.getElementById('w')).wizardNext());
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '1');
    await page.evaluate(() => {
      const x = /** @type {any} */ (document.getElementById('x'));
      x.value = 'pro';
      x.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#s2')).not.toHaveAttribute('data-wizard-hidden', '');
    await page.evaluate(() => /** @type {any} */ (document.getElementById('w')).wizardNext());
    await expect(page.locator('#s2')).toHaveAttribute('data-wizard-active', '');
  });

  test('data-label-* overrides and Intl numbers in the announcement', async ({ page }) => {
    await load(page, `
      <form id="w" data-wizard lang="ar-EG" data-label-back="رجوع" data-label-next="التالي" data-label-submit="إرسال"
        data-label-status="الخطوة {current} من {total}: {name}">
        <fieldset data-wizard-step><legend>أ</legend></fieldset>
        <fieldset data-wizard-step><legend>ب</legend></fieldset>
      </form>`);
    await readyWizard(page);
    await expect(page.locator('[data-wizard-prev]')).toHaveText('رجوع');
    await expect(page.locator('[data-wizard-next]')).toHaveText('التالي');
    await expect(page.locator('[data-wizard-nav] [type="submit"]')).toHaveText('إرسال');
    await expect(page.locator('[data-wizard-status]')).toHaveText('الخطوة ١ من ٢: أ');
  });

  test('persist: filtered fields, VBStore envelope, restore skips hidden/password', async ({ page }) => {
    await load(page, WIZ('data-wizard-persist="local"'), { path: '/__g3-persist.html' });
    await readyWizard(page);
    await page.fill('#email', 'a@b.co');
    await page.fill('#pw', 'secret');
    await page.click('[data-wizard-next]');
    // Typing already stores step 0, so wait for the entry written by the
    // step change and not just for any entry.
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('vb:wizard:w') ?? 'null')?.data?.step)).toBe(1);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vb:wizard:w')));
    expect(typeof stored.timestamp).toBe('number');
    expect(stored.data.step).toBe(1);
    expect(stored.data.data.email).toEqual(['a@b.co']);
    expect(stored.data.data).not.toHaveProperty('pw');
    expect(stored.data.data).not.toHaveProperty('csrf');

    // A tampered hidden value in storage is never restored.
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('vb:wizard:w'));
      raw.data.data.csrf = ['stale'];
      localStorage.setItem('vb:wizard:w', JSON.stringify(raw));
    });
    await page.reload();
    await readyWizard(page);
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '2');
    await expect(page.locator('#email')).toHaveValue('a@b.co');
    await expect(page.locator('input[name="csrf"]')).toHaveValue('server-token');
    await expect(page.locator('#pw')).toHaveValue('');
  });

  test('persist: expired entries are ignored', async ({ page }) => {
    await load(page, '<p>seed</p>', { path: '/__g3-expire.html' });
    await page.evaluate(() => localStorage.setItem('vb:wizard:w', JSON.stringify({
      data: { step: 1, data: { email: ['old@x.co'] }, session: null },
      timestamp: Date.now() - 2 * 86400_000,
    })));
    await page.evaluate((html) => { document.querySelector('main').innerHTML = html; }, WIZ('data-wizard-persist="local"'));
    await readyWizard(page);
    await page.waitForTimeout(50);
    await expect(page.locator('#email')).toHaveValue('');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '1');
  });

  test('persist="session": an entry from another session is discarded', async ({ page }) => {
    await load(page, '<p>seed</p>');
    await page.evaluate(() => localStorage.setItem('vb:wizard:w', JSON.stringify({
      data: { step: 1, data: { email: ['other@x.co'] }, session: 'another-tab' },
      timestamp: Date.now(),
    })));
    await page.evaluate((html) => { document.querySelector('main').innerHTML = html; }, WIZ('data-wizard-persist="session"'));
    await readyWizard(page);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vb:wizard:w'))).toBeNull();
    await expect(page.locator('#email')).toHaveValue('');
  });

  test('history: each step pushes an entry, browser Back steps back', async ({ page }) => {
    await load(page, WIZ('data-wizard-history'));
    await readyWizard(page);
    await page.fill('#email', 'a@b.co');
    await page.click('[data-wizard-next]');
    await page.click('[data-wizard-next]');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '3');
    expect(new URL(page.url()).hash).toBe('#step=3');
    await page.goBack();
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '2');
  });

  test('a cloned wizard is wired once (one status region, working nav)', async ({ page }) => {
    await load(page, WIZ());
    await readyWizard(page);
    await page.evaluate(() => {
      const clone = /** @type {HTMLFormElement} */ (document.getElementById('w').cloneNode(true));
      clone.id = 'w2';
      clone.querySelectorAll('[id]').forEach((n) => { n.id = `c-${n.id}`; });
      document.querySelector('main').append(clone);
    });
    await page.waitForFunction(() => /** @type {any} */ (document.getElementById('w2')).wizardController);
    await expect(page.locator('#w2 > [data-wizard-status]')).toHaveCount(1);
    await page.fill('#c-email', 'a@b.co');
    await page.click('#w2 [data-wizard-next]');
    await expect(page.locator('#w2')).toHaveAttribute('data-wizard-current', '2');
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '1');
  });

  test('data-wizard-steps drives a <progress-tracker> and its clicks navigate back', async ({ page }) => {
    await load(page, `
      <progress-tracker id="pt" data-clickable><ol>
        <li data-step="account">Account</li><li data-step="profile">Profile</li>
        <li data-step="business">Business</li><li data-step="review">Review</li>
      </ol></progress-tracker>
      ${WIZ('data-wizard-steps="#pt"')}`, { modules: ['/src/web-components/progress-tracker/logic.js'] });
    await readyWizard(page);
    await page.waitForSelector('progress-tracker[data-upgraded]');
    await expect(page.locator('#pt')).toHaveAttribute('data-current', 'account');
    await expect(page.locator('#pt li[data-step="business"]')).toHaveAttribute('hidden', '');
    await page.fill('#email', 'a@b.co');
    await page.click('#w [data-wizard-next]');
    await page.click('#w [data-wizard-next]');
    await expect(page.locator('#pt')).toHaveAttribute('data-current', 'review');
    await page.locator('#pt li[data-step="account"]').click();
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '1');
  });

  test('native reset returns to step 1 and re-evaluates conditions', async ({ page }) => {
    await load(page, WIZ());
    await readyWizard(page);
    await page.fill('#email', 'a@b.co');
    await page.click('[data-wizard-next]');
    await page.selectOption('#type', 'business');
    await expect(page.locator('#co')).toBeEnabled();
    await page.evaluate(() => /** @type {HTMLFormElement} */ (document.getElementById('w')).reset());
    await expect(page.locator('#w')).toHaveAttribute('data-wizard-current', '1');
    await expect(page.locator('#s3')).toHaveAttribute('data-wizard-hidden', '');
    await expect(page.locator('#co')).toBeDisabled();
  });

  test('auto summary lists checkbox groups by label and skips hidden/password inputs', async ({ page }) => {
    await load(page, `
      <form id="w" data-wizard>
        <fieldset data-wizard-step><legend>Prefs</legend>
          <input type="hidden" name="csrf" value="t"><label for="pw">PW</label><input type="password" id="pw" name="pw" value="s">
          <fieldset><legend>Topics</legend>
            <label><input type="checkbox" name="topics" value="news" checked> News</label>
            <label><input type="checkbox" name="topics" value="sports" checked> Sports</label>
          </fieldset>
        </fieldset>
        <fieldset data-wizard-step data-wizard-summary id="sum"><legend>Review</legend></fieldset>
      </form>`);
    await readyWizard(page);
    await page.evaluate(() => /** @type {any} */ (document.getElementById('w')).wizardNext());
    await expect(page.locator('#sum dt')).toHaveText(['Topics']);
    await expect(page.locator('#sum dd')).toHaveText(['News, Sports']);
  });
});
