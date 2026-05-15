/**
 * version-switcher: surface and switch between versions of a page over time.
 *
 * Phase 1 of the plan at admin/r-n-d/version-switcher.md:
 *   - Inline data source (data-versions JSON OR <script type="application/json" data-versions>)
 *   - Trigger button + picker popover (composes <pop-over>)
 *   - 'navigate' action only (default; sets location.href)
 *   - Mode auto-detection (releases vs history; data-mode override)
 *   - A11y: aria-haspopup=dialog on trigger, role=dialog on picker
 *
 * Phase 2 (swap / diff actions) and Phase 3 (page-info integration,
 * banner, meta-fallback) ship as separate beads (c42e, j6uo, smb8).
 *
 * @attr {string} data-versions  - Inline JSON array of version entries
 * @attr {string} data-mode      - "releases" | "history" (default: derived)
 * @attr {string} data-action    - "navigate" (Phase 1 only; "swap"/"diff" in Phase 2)
 * @attr {string} aria-label     - Trigger label (default "Version")
 *
 * Version entry shape:
 *   { id (required), label?, url?, date?, author?, summary?,
 *     archived?, draft?, current?, versionUrl? }
 *
 * @fires version-switcher:open
 * @fires version-switcher:close
 * @fires version-switcher:select        - { entry } user picked an entry
 * @fires version-switcher:before-navigate - { entry } cancellable
 * @fires version-switcher:error         - { message, entry?, error? }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
// Compose pop-over for the picker surface (mirrors reaction-bar / selection-menu).
import '../pop-over/logic.js';
// Phase 2: diff action composes <change-set> as the diff renderer.
import '../change-set/logic.js';
import { diffLines, renderDiffFragment } from './_diff.js';

let switcherSeq = 0;

class VersionSwitcher extends VBElement {
  static observedAttributes = ['data-versions'];

  #versions = [];        // resolved entries
  #currentId = null;
  #trigger;
  #popover;
  #pickerList;

  setup() {
    this.#resolveVersions();

    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Version');
    }

    this.#buildTrigger();
    this.#buildPopover();
    this.#renderTrigger();
    this.#renderPicker();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;
    if (name === 'data-versions') this.refresh();
  }

  // ── Data resolution ────────────────────────────────────────────────

  #resolveVersions() {
    let raw = null;

    // Priority 1: inline data-versions attribute
    const attrJson = this.getAttribute('data-versions');
    if (attrJson) {
      try { raw = JSON.parse(attrJson); }
      catch (err) {
        this.#emitError('Failed to parse data-versions JSON', { error: err });
      }
    }

    // Priority 2: <script type="application/json" data-versions> child
    if (!raw) {
      const script = this.querySelector(':scope > script[type="application/json"][data-versions]');
      if (script?.textContent.trim()) {
        try { raw = JSON.parse(script.textContent); }
        catch (err) {
          this.#emitError('Failed to parse <script data-versions> JSON', { error: err });
        }
      }
    }

    // Priority 3 (Phase 3): data-src + meta-tag fallback — out of scope here.

    if (!Array.isArray(raw)) raw = [];
    this.#versions = raw.filter((e) => e && typeof e.id === 'string');
    this.#currentId = this.#deriveCurrentId();
  }

  #deriveCurrentId() {
    if (this.#versions.length === 0) return null;
    // 1. explicit current: true
    const explicit = this.#versions.find((e) => e.current === true);
    if (explicit) return explicit.id;
    // 2. matches <meta name="vb:version">
    const metaVersion = document.querySelector('meta[name="vb:version"]')?.getAttribute('content');
    if (metaVersion) {
      const match = this.#versions.find((e) => e.id === metaVersion);
      if (match) return match.id;
    }
    // 3. first entry
    return this.#versions[0].id;
  }

  /** Releases (distinct URLs) vs history (shared URL + per-entry date/author). */
  #mode() {
    const override = this.getAttribute('data-mode');
    if (override === 'releases' || override === 'history') return override;
    const urls = new Set(this.#versions.map((e) => e.url).filter(Boolean));
    return urls.size > 1 ? 'releases' : 'history';
  }

  // ── DOM build ──────────────────────────────────────────────────────

  #buildTrigger() {
    this.#trigger = document.createElement('button');
    this.#trigger.type = 'button';
    this.#trigger.className = 'version-switcher-trigger';
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    // Initial label set in #renderTrigger.
    this.appendChild(this.#trigger);
  }

  #buildPopover() {
    const popoverId = `version-switcher-${++switcherSeq}`;
    this.#trigger.setAttribute('popovertarget', popoverId);

    this.#popover = document.createElement('pop-over');
    this.#popover.id = popoverId;
    this.#popover.className = 'version-switcher-popover';
    this.#popover.dataset.position = 'bottom-end';
    this.#popover.setAttribute('role', 'dialog');
    this.#popover.setAttribute('aria-label', this.getAttribute('aria-label') || 'Version');

    const heading = document.createElement('h3');
    heading.className = 'version-switcher-heading';
    heading.textContent = this.#mode() === 'history' ? 'History' : 'Versions';

    this.#pickerList = document.createElement('ul');
    this.#pickerList.className = 'version-switcher-list';
    this.#pickerList.setAttribute('role', 'list');

    this.#popover.append(heading, this.#pickerList);
    this.appendChild(this.#popover);

    // Bridge open/close events to friendly names + aria-expanded.
    this.listen(this.#popover, 'pop-over:show', () => {
      this.#trigger.setAttribute('aria-expanded', 'true');
      this.dispatchEvent(new CustomEvent('version-switcher:open', { bubbles: true }));
      // Focus the current entry's row for keyboard users.
      const current = this.#pickerList.querySelector('[data-current="true"] button')
                  || this.#pickerList.querySelector('button');
      requestAnimationFrame(() => current?.focus());
    });
    this.listen(this.#popover, 'pop-over:hide', () => {
      this.#trigger.setAttribute('aria-expanded', 'false');
      this.dispatchEvent(new CustomEvent('version-switcher:close', { bubbles: true }));
    });

    this.listen(this.#pickerList, 'keydown', this.#onPickerKeydown);
  }

  #renderTrigger() {
    const current = this.#versions.find((e) => e.id === this.#currentId);
    const label = current?.label || current?.id || 'Version';
    this.#trigger.replaceChildren();
    const text = document.createElement('span');
    text.className = 'version-switcher-trigger-label';
    text.textContent = label;
    const chevron = document.createElement('span');
    chevron.className = 'version-switcher-trigger-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';
    this.#trigger.append(text, chevron);

    if (this.#versions.length === 0) {
      this.#trigger.disabled = true;
      this.#trigger.setAttribute('title', 'No versions available');
    } else {
      this.#trigger.disabled = false;
      this.#trigger.removeAttribute('title');
    }
  }

  #renderPicker() {
    if (!this.#pickerList) return;
    this.#pickerList.replaceChildren();

    if (this.#versions.length === 0) {
      const li = document.createElement('li');
      li.className = 'version-switcher-empty';
      li.textContent = 'No versions available.';
      this.#pickerList.appendChild(li);
      return;
    }

    for (const entry of this.#versions) {
      this.#pickerList.appendChild(this.#renderEntry(entry));
    }
  }

  #renderEntry(entry) {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');
    li.dataset.versionId = entry.id;
    if (entry.id === this.#currentId) li.dataset.current = 'true';
    if (entry.archived) li.dataset.archived = '';
    if (entry.draft) li.dataset.draft = '';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'version-switcher-entry';
    button.setAttribute('aria-current', entry.id === this.#currentId ? 'true' : 'false');

    const labelLine = document.createElement('span');
    labelLine.className = 'version-switcher-entry-label';
    labelLine.textContent = entry.label || entry.id;
    if (entry.archived) {
      const tag = document.createElement('span');
      tag.className = 'version-switcher-badge version-switcher-badge-archived';
      tag.textContent = 'archived';
      labelLine.appendChild(tag);
    }
    if (entry.draft) {
      const tag = document.createElement('span');
      tag.className = 'version-switcher-badge version-switcher-badge-draft';
      tag.textContent = 'draft';
      labelLine.appendChild(tag);
    }
    if (entry.id === this.#currentId) {
      const tag = document.createElement('span');
      tag.className = 'version-switcher-badge version-switcher-badge-current';
      tag.textContent = 'current';
      labelLine.appendChild(tag);
    }
    button.appendChild(labelLine);

    if (entry.date) {
      const date = document.createElement('time');
      date.className = 'version-switcher-entry-date';
      date.setAttribute('datetime', entry.date);
      try { date.title = new Date(entry.date).toLocaleString(); } catch { /* ignore */ }
      date.textContent = relativeTime(entry.date) || entry.date;
      button.appendChild(date);
    }

    if (entry.author) {
      const author = document.createElement('span');
      author.className = 'version-switcher-entry-author';
      author.textContent = `by ${entry.author}`;
      button.appendChild(author);
    }

    if (entry.summary) {
      const summary = document.createElement('span');
      summary.className = 'version-switcher-entry-summary';
      summary.textContent = entry.summary;
      button.appendChild(summary);
    }

    if (entry.versionUrl) {
      const link = document.createElement('a');
      link.className = 'version-switcher-entry-changelog';
      link.href = entry.versionUrl;
      link.textContent = 'Changelog →';
      // Stop click on the link from also triggering the entry button.
      this.listen(link, 'click', (e) => e.stopPropagation());
      button.appendChild(link);
    }

    // Derived aria-label so AT users hear the whole picture in one announcement.
    const parts = [entry.label || entry.id];
    if (entry.date) parts.push(`released ${relativeTime(entry.date) || entry.date}`);
    if (entry.archived) parts.push('archived');
    if (entry.draft) parts.push('draft');
    if (entry.id === this.#currentId) parts.push('current');
    button.setAttribute('aria-label', parts.join(', '));

    this.listen(button, 'click', () => this.#onEntryClick(entry));
    li.appendChild(button);
    return li;
  }

  // ── Picker keyboard nav ────────────────────────────────────────────

  #onPickerKeydown = (e) => {
    const entries = [...this.#pickerList.querySelectorAll('button.version-switcher-entry')];
    const i = entries.indexOf(document.activeElement);
    if (i === -1) return;
    let next = i;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); next = Math.min(entries.length - 1, i + 1); break;
      case 'ArrowUp':   e.preventDefault(); next = Math.max(0, i - 1); break;
      case 'Home':      e.preventDefault(); next = 0; break;
      case 'End':       e.preventDefault(); next = entries.length - 1; break;
      default: return;
    }
    entries[next]?.focus();
  };

  // ── Selection / action ────────────────────────────────────────────

  #onEntryClick(entry) {
    this.dispatchEvent(new CustomEvent('version-switcher:select', {
      bubbles: true, detail: { entry },
    }));
    this.#performAction(entry);
  }

  #performAction(entry) {
    const action = this.getAttribute('data-action') || 'navigate';
    if (action === 'navigate') return this.#actionNavigate(entry);
    if (action === 'swap')     return this.#actionSwap(entry);
    if (action === 'diff')     return this.#actionDiff(entry);
    this.#emitError(`Unknown action "${action}"; falling back to navigate.`);
    this.#actionNavigate(entry);
  }

  #actionNavigate(entry) {
    if (!entry?.url) {
      this.#emitError('Cannot navigate: entry has no url.', { entry });
      return;
    }
    const evt = new CustomEvent('version-switcher:before-navigate', {
      bubbles: true, cancelable: true, detail: { entry },
    });
    const proceed = this.dispatchEvent(evt);
    if (!proceed) return;
    this.closePicker();
    location.href = entry.url;
  }

  // ── Phase 2: swap action ──────────────────────────────────────────

  /** Selector that locates the swappable / diffable region in the page
   *  AND inside the fetched response document. */
  #versionedSelector() {
    return this.getAttribute('data-versioned-region') || '[data-versioned], main';
  }

  #findVersionedRegion(root) {
    return root.querySelector(this.#versionedSelector());
  }

  async #fetchVersionedRegion(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const region = this.#findVersionedRegion(doc);
    if (!region) {
      throw new Error(`No versioned region (${this.#versionedSelector()}) found in ${url}`);
    }
    return region;
  }

  async #actionSwap(entry) {
    if (!entry?.url) {
      this.#emitError('Cannot swap: entry has no url.', { entry });
      return;
    }

    const target = this.#findVersionedRegion(document);
    if (!target) {
      this.#emitError(`No versioned region (${this.#versionedSelector()}) on this page to swap.`, { entry });
      return;
    }

    const evt = new CustomEvent('version-switcher:before-swap', {
      bubbles: true, cancelable: true, detail: { entry },
    });
    if (!this.dispatchEvent(evt)) return;

    this.closePicker();
    const previousId = this.#currentId;

    const apply = async () => {
      try {
        const incoming = await this.#fetchVersionedRegion(entry.url);
        target.replaceChildren(...incoming.childNodes);
      } catch (err) {
        this.#emitError(err.message, { entry, error: err });
        throw err;
      }
    };

    try {
      if ('startViewTransition' in document) {
        // updateCallbackDone resolves as soon as apply() finishes (after the
        // DOM swap). We do NOT await .finished — that would block until the
        // crossfade animation completes (potentially seconds), delaying the
        // swap event + post-swap meta/render work. The animation runs in
        // the background unaffected.
        await document.startViewTransition(apply).updateCallbackDone;
      } else {
        await apply();
      }
    } catch {
      return; // error already emitted
    }

    // Reflect the swapped state via the existing provenance meta tag.
    let meta = document.querySelector('meta[name="vb:version"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'vb:version');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', entry.id);

    this.#currentId = entry.id;
    this.#renderTrigger();
    this.#renderPicker();

    this.dispatchEvent(new CustomEvent('version-switcher:swap', {
      bubbles: true, detail: { entry, previousId },
    }));
  }

  // ── Phase 2: diff action ──────────────────────────────────────────

  async #actionDiff(entry) {
    if (!entry?.url) {
      this.#emitError('Cannot diff: entry has no url.', { entry });
      return;
    }
    const current = this.#findVersionedRegion(document);
    if (!current) {
      this.#emitError(`No versioned region (${this.#versionedSelector()}) on this page to diff against.`, { entry });
      return;
    }
    if (entry.id === this.#currentId) {
      this.#emitError('Cannot diff against the current version.', { entry });
      return;
    }

    const evt = new CustomEvent('version-switcher:before-diff', {
      bubbles: true, cancelable: true, detail: { entry },
    });
    if (!this.dispatchEvent(evt)) return;
    this.closePicker();

    let other;
    try {
      other = await this.#fetchVersionedRegion(entry.url);
    } catch (err) {
      this.#emitError(err.message, { entry, error: err });
      return;
    }

    // Drop any existing diff render before producing a new one.
    document.querySelectorAll('.version-switcher-diff-host').forEach((el) => el.remove());

    // Line-level diff over textContent (markup-aware deferred per the plan).
    const ops = diffLines(current.textContent.trim(), other.textContent.trim());

    const host = document.createElement('change-set');
    host.classList.add('version-switcher-diff-host');
    host.dataset.versionFrom = this.#currentId ?? '';
    host.dataset.versionTo = entry.id;
    host.appendChild(renderDiffFragment(ops));

    const position = this.getAttribute('data-diff-position') || 'before';
    if (position === 'after') current.parentNode.insertBefore(host, current.nextSibling);
    else current.parentNode.insertBefore(host, current);

    // Move focus to the diff so AT users notice the new region.
    host.setAttribute('tabindex', '-1');
    host.focus({ preventScroll: false });

    this.dispatchEvent(new CustomEvent('version-switcher:diff', {
      bubbles: true,
      detail: {
        entry,
        previousId: this.#currentId,
        diffElement: host,
        opCount: ops.length,
      },
    }));
  }

  // ── Public API ─────────────────────────────────────────────────────

  get versions() { return this.#versions.slice(); }
  get currentId() { return this.#currentId; }

  openPicker() { this.#popover?.show(); }
  closePicker() { this.#popover?.hide(); }

  /** Programmatic switch — honors data-action via #performAction. */
  switchTo(id) {
    const entry = this.#versions.find((e) => e.id === id);
    if (!entry) {
      this.#emitError(`switchTo: no entry with id "${id}"`);
      return;
    }
    this.dispatchEvent(new CustomEvent('version-switcher:select', {
      bubbles: true, detail: { entry },
    }));
    this.#performAction(entry);
  }

  /** Re-resolve from the current data source and re-render. */
  refresh() {
    this.#resolveVersions();
    // Guard: attributeChangedCallback can fire for initial attributes before
    // setup() builds the trigger and picker DOM. In that case there's nothing
    // to re-render — the upcoming setup() call will pick up the resolved data.
    if (!this.#trigger || !this.#pickerList) return;
    this.#renderTrigger();
    this.#renderPicker();
  }

  // ── Errors ─────────────────────────────────────────────────────────

  #emitError(message, detail = {}) {
    this.dispatchEvent(new CustomEvent('version-switcher:error', {
      bubbles: true, detail: { message, ...detail },
    }));
  }
}

// ── Local relative-time helper (keeps Phase 1 dependency-free) ─────────

function relativeTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 0) return null;
  const MIN = 60, HOUR = 3600, DAY = 86400, MONTH = 2592000, YEAR = 31536000;
  if (diff < MIN)   return 'just now';
  if (diff < HOUR)  { const n = Math.floor(diff / MIN);   return `${n} minute${n!==1?'s':''} ago`; }
  if (diff < DAY)   { const n = Math.floor(diff / HOUR);  return `${n} hour${n!==1?'s':''} ago`; }
  if (diff < MONTH) { const n = Math.floor(diff / DAY);   return `${n} day${n!==1?'s':''} ago`; }
  if (diff < YEAR)  { const n = Math.floor(diff / MONTH); return `${n} month${n!==1?'s':''} ago`; }
  const y = Math.floor(diff / YEAR); return `${y} year${y!==1?'s':''} ago`;
}

registerComponent('version-switcher', VersionSwitcher);

export { VersionSwitcher };
