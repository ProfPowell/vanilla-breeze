/**
 * version-switcher: surface and switch between versions of a page over time.
 *
 * Data sources (first match wins): inline `data-versions` JSON, a
 * `<script type="application/json" data-versions>` child, a `data-src`
 * manifest URL, or the `<meta name="vb:versions-manifest">` fallback.
 * Actions: navigate (default), swap (same-origin region replace) and diff
 * (line diff rendered into a <change-set>). Can mount inside a <page-info>
 * panel and show an archived-version banner.
 *
 * URL safety: every entry `url` / `versionUrl` is checked with
 * `isDangerousUrl` (javascript:, vbscript:, data: …). An entry whose `url` is
 * unsafe is dropped; an unsafe `versionUrl` drops only the changelog link.
 * swap / diff only fetch same-origin URLs, and swapped markup is inserted
 * through `sanitizeToFragment` so no inline `on*` handler goes live.
 *
 * @attr {string} data-versions  - Inline JSON array of version entries
 * @attr {string} data-src       - URL of a JSON manifest
 * @attr {string} data-mode      - "releases" | "history" (default: derived)
 * @attr {string} data-action    - "navigate" (default) | "swap" | "diff"
 * @attr {string} aria-label     - What the switcher picks (default "Version");
 *                                 names the trigger, picker and panel section
 * @attr {string} data-label-*   - English string overrides, see LABELS
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
import { getLocale } from '../../lib/i18n.js';
import { isDangerousUrl, sanitizeToFragment } from '../../lib/sanitize-html.js';
// Compose pop-over for the picker surface (mirrors reaction-bar / selection-menu).
import '../pop-over/logic.js';
// The diff action composes <change-set> as the diff renderer, fed by the
// shared text-diff utility (see /docs/content-management/diff-display/).
import '../change-set/logic.js';
import { diffLines, renderDiffFragment } from '../../utils/text-diff.js';

/** Default English strings; each is overridable with data-label-<key>. */
const LABELS = {
  trigger: 'Version',
  loading: 'Loading…',
  'loading-versions': 'Loading versions…',
  empty: 'No versions available.',
  'heading-releases': 'Versions',
  'heading-history': 'History',
  archived: 'archived',
  draft: 'draft',
  current: 'current',
  by: 'by {author}',
  changelog: 'Changelog',
  'changelog-for': '{version} changelog',
  'banner-label': 'Archived version notice',
  banner: 'You’re viewing {version} (archived).',
  'banner-latest': 'Latest: {version}',
  diff: 'Diff: {from} → {to}',
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

let switcherSeq = 0;

class VersionSwitcher extends VBElement {
  static observedAttributes = ['data-versions', 'data-src', 'data-mode', 'aria-label'];

  #versions = [];        // resolved entries
  #currentId = null;
  /** @type {HTMLButtonElement} */
  #trigger;
  #popover;
  /** @type {HTMLElement} */
  #pickerHeading;
  /** @type {HTMLUListElement} */
  #pickerList;
  /** @type {HTMLElement | null} */
  #panelSection = null;  // set when mounted inside a <page-info> panel
  /** @type {MutationObserver | null} */
  #panelObserver = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #panelTimer = null;
  /** @type {HTMLElement | null} */
  #banner = null;        // set when data-banner is on AND current is archived
  /** @type {string | null} */
  #pendingFetch = null;  // tracks the in-flight data-src / meta-fallback fetch

  setup() {
    this.#resolveVersions();

    this.#buildTrigger();
    this.#buildPopover();
    this.#wirePopover();
    this.#renderTrigger();
    this.#renderPicker();
    this.#updateBanner();

    // page-info mount target: render as a section inside the targeted
    // page-info's expandable panel instead of the standalone trigger.
    if (this.hasAttribute('data-page-info-target')) {
      this.#mountInPageInfo();
    }

    // No inline data: fetch from data-src or the meta-tag fallback. The
    // trigger renders a disabled "Loading…" state until the fetch resolves.
    if (this.#versions.length === 0 && (this.getAttribute('data-src') || this.#metaManifestUrl())) {
      this.#fetchManifest();
    }
  }

  teardown() {
    // The panel section lives outside the host (inside <page-info>), so it
    // does not move with the switcher: remove it and stop watching for it.
    // setup() re-mounts on reconnect.
    this.#panelObserver?.disconnect();
    this.#panelObserver = null;
    if (this.#panelTimer != null) clearTimeout(this.#panelTimer);
    this.#panelTimer = null;
    this.#panelSection?.remove();
    this.#panelSection = null;
    this.#pendingFetch = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal || !this.#trigger) return;
    if (name === 'data-versions') this.refresh();
    if (name === 'data-src') this.#fetchManifest();
    if (name === 'data-mode' || name === 'aria-label') this.#renderAll();
  }

  #label(key, vars = {}) {
    let text = this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? key;
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  }

  /** What this switcher picks: the author's aria-label, else data-label-trigger. */
  #name() {
    return this.getAttribute('aria-label') || this.#label('trigger');
  }

  #heading() {
    return this.#label(this.#mode() === 'history' ? 'heading-history' : 'heading-releases');
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

    // Priority 3: data-src / meta fallback — fetched asynchronously in setup().
    this.#versions = this.#normalise(raw);
    this.#currentId = this.#deriveCurrentId();
  }

  /**
   * Keep well-formed entries with safe URLs. An entry whose `url` is a
   * script / data URL is dropped (it could only ever navigate there); an
   * unsafe `versionUrl` loses just the changelog link.
   * @param {unknown} raw
   */
  #normalise(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const e of raw) {
      if (!e || typeof e.id !== 'string') continue;
      const entry = { ...e };
      if (entry.url != null && !isSafeUrl(entry.url)) {
        this.#emitError(`Dropped version "${entry.id}": unsafe url.`, { entry });
        continue;
      }
      if (entry.versionUrl != null && !isSafeUrl(entry.versionUrl)) delete entry.versionUrl;
      out.push(entry);
    }
    return out;
  }

  #deriveCurrentId() {
    if (this.#versions.length === 0) return null;
    // 1. explicit current: true
    const explicit = this.#versions.find((e) => e.current === true);
    if (explicit) return explicit.id;
    // 2. matches <meta itemprop="version"> — the standards-aligned tag the
    //    provenance system already emits (per meta-tag-contract-v1).
    const metaVersion = document.querySelector('meta[itemprop="version"]')?.getAttribute('content');
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

  // ── data-src + meta-tag fallback fetch ─────────────────────────────

  #metaManifestUrl() {
    return document.querySelector('meta[name="vb:versions-manifest"]')?.getAttribute('content');
  }

  async #fetchManifest() {
    const url = this.getAttribute('data-src') || this.#metaManifestUrl();
    if (!url) return;

    this.#pendingFetch = url;
    this.#renderTrigger(); // shows Loading… while a fetch is in flight

    let raw;
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
      raw = await res.json();
    } catch (err) {
      if (this.#pendingFetch !== url) return;
      this.#pendingFetch = null;
      this.#emitError(`Failed to load versions manifest: ${err.message}`, { error: err });
      this.#renderTrigger();
      return;
    }

    // Bail if a newer fetch (or a disconnect) superseded us mid-request.
    if (this.#pendingFetch !== url) return;
    this.#pendingFetch = null;

    if (!Array.isArray(raw)) {
      this.#emitError(`Manifest is not a JSON array: ${url}`);
      this.#renderTrigger();
      return;
    }

    this.#versions = this.#normalise(raw);
    this.#currentId = this.#deriveCurrentId();
    this.#renderAll();
  }

  #renderAll() {
    this.#renderTrigger();
    this.#renderPicker();
    this.#updateBanner();
    if (this.#panelSection) this.#renderPanelSection();
  }

  // ── Archived-version banner ────────────────────────────────────────

  #updateBanner() {
    // Tear down any prior banner first so a re-render doesn't duplicate.
    this.#banner?.remove();
    this.#banner = null;
    if (!this.hasAttribute('data-banner')) return;

    const current = this.#versions.find((e) => e.id === this.#currentId);
    const latest = this.#versions.find((e) => !e.archived && !e.draft);

    // Banner only renders when current is archived AND a non-archived
    // "latest" exists to point at.
    if (!current?.archived || !latest || latest.id === current.id) return;

    const banner = document.createElement('aside');
    banner.className = 'version-switcher-banner';
    banner.setAttribute('aria-label', this.#label('banner-label'));

    // A polite status region, inserted EMPTY: live regions only announce
    // changes made after the region is in the accessibility tree, so the
    // notice text is filled in a couple of frames later.
    const status = document.createElement('p');
    status.className = 'version-switcher-banner-text';
    status.setAttribute('role', 'status');
    banner.append(status);
    this.prepend(banner);
    this.#banner = banner;

    const fill = () => {
      if (this.#banner !== banner) return;
      status.textContent = this.#label('banner', { version: current.label || current.id });
      const latestText = this.#label('banner-latest', { version: latest.label || latest.id });
      // Only a real, safe URL becomes a link; otherwise plain text (an <a>
      // without href is not focusable and reads as nothing useful).
      if (latest.url && isSafeUrl(latest.url)) {
        const link = document.createElement('a');
        link.className = 'version-switcher-banner-link';
        link.href = latest.url;
        link.textContent = latestText;
        banner.append(link);
      } else {
        const text = document.createElement('span');
        text.className = 'version-switcher-banner-latest';
        text.textContent = latestText;
        banner.append(text);
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(fill));
  }

  // ── Mount inside <page-info>'s expandable panel ────────────────────

  #mountInPageInfo() {
    const id = this.getAttribute('data-page-info-target');
    if (!id) return;
    const target = document.getElementById(id);
    if (!target || target.localName !== 'page-info') {
      this.#emitError(`data-page-info-target: no <page-info id="${id}"> found.`);
      return;
    }

    // Hide the standalone trigger when mounted in a page-info panel — the
    // version list lives inside the panel as a section instead.
    this.#trigger.hidden = true;

    const tryMount = () => {
      const panel = target.querySelector('.page-info-panel');
      if (!panel) return false;
      this.#renderPanelSection(panel);
      return true;
    };

    if (tryMount()) return;

    // page-info hasn't rendered its panel yet (auto mode upgrade pending).
    const obs = new MutationObserver(() => {
      if (tryMount()) this.#stopPanelWatch();
    });
    obs.observe(target, { childList: true, subtree: true });
    this.#panelObserver = obs;

    // Safety timeout — give up after 5s and report the miss.
    this.#panelTimer = setTimeout(() => {
      this.#panelTimer = null;
      if (this.#panelSection) return;
      this.#stopPanelWatch();
      this.#emitError(`<page-info id="${id}"> never rendered .page-info-panel within 5s.`);
    }, 5000);
  }

  #stopPanelWatch() {
    this.#panelObserver?.disconnect();
    this.#panelObserver = null;
    if (this.#panelTimer != null) clearTimeout(this.#panelTimer);
    this.#panelTimer = null;
  }

  /** @param {ParentNode} [panel] */
  #renderPanelSection(panel) {
    const host = /** @type {ParentNode | null | undefined} */ (panel || this.#panelSection?.parentNode);
    if (!host) return;

    let section = this.#panelSection;
    if (!section) {
      section = document.createElement('section');
      section.className = 'version-switcher-panel-section';
      const heading = document.createElement('h3');
      heading.className = 'version-switcher-panel-heading';
      heading.id = `version-switcher-panel-${++switcherSeq}`;
      section.setAttribute('aria-labelledby', heading.id);
      const list = document.createElement('ul');
      list.className = 'version-switcher-panel-list';
      section.append(heading, list);
      host.appendChild(section);
      this.#panelSection = section;
      // The section is outside the host, so wire it here; listen() releases
      // it on disconnect and teardown() removes the section.
      this.listen(list, 'click', this.#onListClick);
    }

    /** @type {HTMLElement} */ (section.querySelector('.version-switcher-panel-heading')).textContent = this.#heading();
    const list = /** @type {HTMLUListElement} */ (section.querySelector('ul.version-switcher-panel-list'));
    this.#fillList(list, this.#pendingFetch ? 'loading-versions' : 'empty');
  }

  // ── DOM build ──────────────────────────────────────────────────────

  #buildTrigger() {
    // Reconnect guard: on disconnect the base class clears data-upgraded and
    // re-runs setup() on the next connect, but the owned DOM moved back with
    // the host, so rebuilding would append a duplicate trigger. Skip if it is
    // already our child.
    if (this.#trigger?.parentNode === this) return;

    this.#trigger = document.createElement('button');
    this.#trigger.type = 'button';
    this.#trigger.className = 'version-switcher-trigger';
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    // Label set in #renderTrigger.
    this.appendChild(this.#trigger);
  }

  #buildPopover() {
    // Reconnect guard — see #buildTrigger.
    if (this.#popover?.parentNode === this) return;

    const popoverId = `version-switcher-${++switcherSeq}`;
    this.#trigger.setAttribute('popovertarget', popoverId);

    this.#popover = document.createElement('pop-over');
    this.#popover.id = popoverId;
    this.#popover.className = 'version-switcher-popover';
    this.#popover.dataset.position = 'bottom-end';
    this.#popover.setAttribute('role', 'dialog');

    this.#pickerHeading = document.createElement('h3');
    this.#pickerHeading.className = 'version-switcher-heading';

    this.#pickerList = document.createElement('ul');
    this.#pickerList.className = 'version-switcher-list';
    this.#pickerList.setAttribute('role', 'list');

    this.#popover.append(this.#pickerHeading, this.#pickerList);
    this.appendChild(this.#popover);
  }

  /**
   * Wire the popover + picker listeners. Runs on every setup(), outside the
   * #buildPopover reconnect guard: listen() drops them on disconnect, so a
   * guarded wiring would leave a moved switcher inert.
   */
  #wirePopover() {
    if (!this.#popover || !this.#pickerList) return;
    // Bridge open/close events to friendly names + aria-expanded.
    this.listen(this.#popover, 'pop-over:show', () => {
      this.#trigger.setAttribute('aria-expanded', 'true');
      this.dispatchEvent(new CustomEvent('version-switcher:open', { bubbles: true }));
      // Focus the current entry's row for keyboard users.
      const current = this.#pickerList.querySelector('[data-current="true"] button')
                  || this.#pickerList.querySelector('button');
      requestAnimationFrame(() => /** @type {HTMLElement|null} */ (current)?.focus());
    });
    this.listen(this.#popover, 'pop-over:hide', () => {
      this.#trigger.setAttribute('aria-expanded', 'false');
      this.dispatchEvent(new CustomEvent('version-switcher:close', { bubbles: true }));
    });

    this.listen(this.#pickerList, 'keydown', this.#onPickerKeydown);
    this.listen(this.#pickerList, 'click', this.#onListClick);
  }

  #renderTrigger() {
    if (!this.#trigger) return;
    const current = this.#versions.find((e) => e.id === this.#currentId);
    const loading = !!this.#pendingFetch && this.#versions.length === 0;
    const value = loading ? this.#label('loading') : (current?.label || current?.id || this.#label('trigger'));
    const text = document.createElement('span');
    text.className = 'version-switcher-trigger-label';
    text.textContent = value;
    const chevron = document.createElement('span');
    chevron.className = 'version-switcher-trigger-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';
    this.#trigger.replaceChildren(text, chevron);

    // The visible text is only the version ("v2.1"); the accessible name says
    // what is being picked too ("API version: v2.1"). The author's aria-label
    // names the switcher; the host itself has no role, so it is applied here.
    const name = this.#name();
    this.#trigger.setAttribute('aria-label', value === name ? name : `${name}: ${value}`);
    this.#popover?.setAttribute('aria-label', name);

    if (this.#versions.length === 0) {
      this.#trigger.disabled = true;
      this.#trigger.setAttribute('title', this.#label(loading ? 'loading-versions' : 'empty'));
    } else {
      this.#trigger.disabled = false;
      this.#trigger.removeAttribute('title');
    }
  }

  #renderPicker() {
    if (!this.#pickerList) return;
    // Heading is derived from the mode, which depends on the (possibly
    // fetched) data and data-mode — so it is re-rendered with the list.
    this.#pickerHeading.textContent = this.#heading();
    this.#fillList(this.#pickerList, 'empty');
  }

  /**
   * @param {HTMLUListElement} list
   * @param {string} emptyKey label key for the empty-state row
   */
  #fillList(list, emptyKey) {
    list.replaceChildren();
    if (this.#versions.length === 0) {
      const li = document.createElement('li');
      li.className = 'version-switcher-empty';
      li.textContent = this.#label(emptyKey);
      list.appendChild(li);
      return;
    }
    for (const entry of this.#versions) list.appendChild(this.#renderEntry(entry));
  }

  #renderEntry(entry) {
    const isCurrent = entry.id === this.#currentId;
    const name = entry.label || entry.id;
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');
    li.className = 'version-switcher-item';
    li.dataset.versionId = entry.id;
    if (isCurrent) li.dataset.current = 'true';
    if (entry.archived) li.dataset.archived = '';
    if (entry.draft) li.dataset.draft = '';

    // The button holds the label, badges and date: its accessible name is
    // its own visible text. Author and summary sit beside it (described by),
    // and the changelog link is a sibling — never interactive content
    // nested inside a button.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'version-switcher-entry';
    button.setAttribute('aria-current', isCurrent ? 'true' : 'false');

    const labelLine = document.createElement('span');
    labelLine.className = 'version-switcher-entry-label';
    labelLine.append(name);
    const badge = (kind) => {
      const tag = document.createElement('span');
      tag.className = `version-switcher-badge version-switcher-badge-${kind}`;
      tag.textContent = this.#label(kind);
      labelLine.append(' ', tag);
    };
    if (entry.archived) badge('archived');
    if (entry.draft) badge('draft');
    if (isCurrent) badge('current');
    button.appendChild(labelLine);

    if (entry.date) {
      const date = document.createElement('time');
      date.className = 'version-switcher-entry-date';
      date.setAttribute('datetime', entry.date);
      const locale = getLocale(this);
      const absolute = formatAbsolute(entry.date, locale);
      if (absolute) date.title = absolute;
      date.textContent = formatRelative(entry.date, locale) || absolute || entry.date;
      button.append(' ', date);
    }
    li.appendChild(button);

    const described = [];
    const uid = `${this.#popover?.id || 'version-switcher'}-${cssSafe(entry.id)}-${++switcherSeq}`;
    if (entry.author) {
      const author = document.createElement('span');
      author.className = 'version-switcher-entry-author';
      author.id = `${uid}-author`;
      author.textContent = this.#label('by', { author: entry.author });
      li.appendChild(author);
      described.push(author.id);
    }
    if (entry.summary) {
      const summary = document.createElement('span');
      summary.className = 'version-switcher-entry-summary';
      summary.id = `${uid}-summary`;
      summary.textContent = entry.summary;
      li.appendChild(summary);
      described.push(summary.id);
    }
    if (described.length) button.setAttribute('aria-describedby', described.join(' '));

    if (entry.versionUrl && isSafeUrl(entry.versionUrl)) {
      const link = document.createElement('a');
      link.className = 'version-switcher-entry-changelog';
      link.href = entry.versionUrl;
      link.setAttribute('aria-label', this.#label('changelog-for', { version: name }));
      link.append(this.#label('changelog'));
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = ' →';
      link.append(arrow);
      li.appendChild(link);
    }

    return li;
  }

  // ── Picker interaction ─────────────────────────────────────────────

  /** Delegated click on a picker / panel list. */
  #onListClick = (e) => {
    const button = /** @type {Element} */ (e.target).closest?.('button.version-switcher-entry');
    if (!button) return;
    const id = /** @type {HTMLElement} */ (button.closest('[data-version-id]'))?.dataset.versionId;
    const entry = this.#versions.find((v) => v.id === id);
    if (entry) this.#onEntryClick(entry);
  };

  #onPickerKeydown = (e) => {
    const entries = [...this.#pickerList.querySelectorAll('button.version-switcher-entry')];
    const i = entries.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
    if (i === -1) return;
    let next = i;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); next = Math.min(entries.length - 1, i + 1); break;
      case 'ArrowUp':   e.preventDefault(); next = Math.max(0, i - 1); break;
      case 'Home':      e.preventDefault(); next = 0; break;
      case 'End':       e.preventDefault(); next = entries.length - 1; break;
      default: return;
    }
    /** @type {HTMLElement} */ (entries[next])?.focus();
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
    if (!entry?.url || !isSafeUrl(entry.url)) {
      this.#emitError('Cannot navigate: entry has no safe url.', { entry });
      return;
    }
    const target = new URL(entry.url, location.href);
    // History-mode entries usually share the page URL. Navigating there
    // would only reload the page you are on, so it is a no-op: give each
    // revision its own URL (e.g. ?rev=…) or use data-action="swap" / "diff".
    if (target.href === location.href) {
      this.#emitError('Cannot navigate: entry url is the current page.', { entry });
      return;
    }
    const evt = new CustomEvent('version-switcher:before-navigate', {
      bubbles: true, cancelable: true, detail: { entry },
    });
    const proceed = this.dispatchEvent(evt);
    if (!proceed) return;
    this.closePicker();
    location.href = target.href;
  }

  /** Selector that locates the swappable / diffable region in the page
   *  AND inside the fetched response document. */
  #versionedSelector() {
    return this.getAttribute('data-versioned-region') || '[data-versioned], main';
  }

  #findVersionedRegion(root) {
    return root.querySelector(this.#versionedSelector());
  }

  /**
   * swap / diff fetch the entry URL and read markup from it, so only
   * same-origin, non-script URLs are allowed.
   * @param {object} entry
   * @param {string} verb
   * @returns {URL | null}
   */
  #sameOriginUrl(entry, verb) {
    if (!entry?.url || !isSafeUrl(entry.url)) {
      this.#emitError(`Cannot ${verb}: entry has no safe url.`, { entry });
      return null;
    }
    const url = new URL(entry.url, location.href);
    if (url.origin !== location.origin) {
      this.#emitError(`Cannot ${verb}: ${url.href} is not same-origin.`, { entry });
      return null;
    }
    return url;
  }

  /** @param {URL} url */
  async #fetchVersionedRegion(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url.href}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const region = this.#findVersionedRegion(doc);
    if (!region) {
      throw new Error(`No versioned region (${this.#versionedSelector()}) found in ${url.href}`);
    }
    return region;
  }

  async #actionSwap(entry) {
    const url = this.#sameOriginUrl(entry, 'swap');
    if (!url) return;

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
        const incoming = await this.#fetchVersionedRegion(url);
        // Same-origin author content, but still sanitized: DOMParser keeps
        // scripts inert, yet adopted on* handlers (<img onerror>) would fire
        // once inserted. Fragment profile = include-file's (ids kept).
        target.replaceChildren(sanitizeToFragment(incoming.innerHTML, { keepIds: true, keepStyle: true }));
      } catch (err) {
        this.#emitError(err.message, { entry, error: err });
        throw err;
      }
    };

    try {
      if ('startViewTransition' in document) {
        // Typed transition so the crossfade timing in styles.css applies to
        // this swap only, not to every view transition on the site. Older
        // engines take only the callback form.
        let vt;
        try { vt = document.startViewTransition({ update: apply, types: ['version-swap'] }); }
        catch { vt = document.startViewTransition(apply); }
        // updateCallbackDone resolves as soon as apply() finishes; .finished
        // would wait for the crossfade animation.
        await vt.updateCallbackDone;
      } else {
        await apply();
      }
    } catch {
      return; // error already emitted
    }

    // Reflect the swapped state via the provenance meta tag.
    let meta = document.querySelector('meta[itemprop="version"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('itemprop', 'version');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', entry.id);

    this.#currentId = entry.id;
    this.#renderAll();

    this.dispatchEvent(new CustomEvent('version-switcher:swap', {
      bubbles: true, detail: { entry, previousId },
    }));
  }

  async #actionDiff(entry) {
    const url = this.#sameOriginUrl(entry, 'diff');
    if (!url) return;
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
      other = await this.#fetchVersionedRegion(url);
    } catch (err) {
      this.#emitError(err.message, { entry, error: err });
      return;
    }

    // Drop any existing diff render before producing a new one.
    document.querySelectorAll('.version-switcher-diff-host').forEach((el) => el.remove());

    // Line-level diff over textContent (markup-aware diffing is out of scope).
    const ops = diffLines(current.textContent.trim(), other.textContent.trim());

    const host = document.createElement('change-set');
    host.classList.add('version-switcher-diff-host');
    host.dataset.versionFrom = this.#currentId ?? '';
    host.dataset.versionTo = entry.id;
    host.dataset.diffLabel = this.#label('diff', { from: this.#currentId ?? '', to: entry.id });
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
    // setup() builds the trigger and picker DOM. The upcoming setup() call
    // will pick up the resolved data.
    if (!this.#trigger || !this.#pickerList) return;
    this.#renderAll();
  }

  // ── Errors ─────────────────────────────────────────────────────────

  #emitError(message, detail = {}) {
    this.dispatchEvent(new CustomEvent('version-switcher:error', {
      bubbles: true, detail: { message, ...detail },
    }));
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/** @param {unknown} url */
function isSafeUrl(url) {
  return typeof url === 'string' && url.trim() !== '' && !isDangerousUrl(url, false);
}

/** @param {string} s */
function cssSafe(s) {
  return String(s).replace(/[^\w-]/g, '_');
}

/**
 * Parse an entry date; date-only ISO strings are calendar dates (UTC midnight
 * by spec), so they are formatted in UTC to avoid an off-by-one day.
 * @param {string} iso
 */
function parseDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {string} iso
 * @param {string} locale
 */
function formatAbsolute(iso, locale) {
  const d = parseDate(iso);
  if (!d) return null;
  const opts = DATE_ONLY.test(iso)
    ? { dateStyle: 'long', timeZone: 'UTC' }
    : { dateStyle: 'long', timeStyle: 'short' };
  try { return new Intl.DateTimeFormat(locale, /** @type {Intl.DateTimeFormatOptions} */ (opts)).format(d); }
  catch { return d.toISOString(); }
}

/**
 * @param {string} iso
 * @param {string} locale
 */
function formatRelative(iso, locale) {
  const d = parseDate(iso);
  if (!d) return null;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 0) return null;
  let rtf;
  try { rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }); }
  catch { rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }); }
  const MIN = 60, HOUR = 3600, DAY = 86400, MONTH = 2592000, YEAR = 31536000;
  if (diff < MIN)   return rtf.format(0, 'second');
  if (diff < HOUR)  return rtf.format(-Math.floor(diff / MIN), 'minute');
  if (diff < DAY)   return rtf.format(-Math.floor(diff / HOUR), 'hour');
  if (diff < MONTH) return rtf.format(-Math.floor(diff / DAY), 'day');
  if (diff < YEAR)  return rtf.format(-Math.floor(diff / MONTH), 'month');
  return rtf.format(-Math.floor(diff / YEAR), 'year');
}

registerComponent('version-switcher', VersionSwitcher);

export { VersionSwitcher };
