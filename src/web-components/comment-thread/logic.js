/**
 * comment-thread: Persistent threaded-discussion container.
 *
 * Author renders comments as `<article data-comment>` children with metadata
 * attributes; component decorates each with author header, relative timestamp,
 * action row (Reply / Edit / Delete) and threaded indentation via data-parent.
 *
 * Distinct from:
 *   - <comment-wc>     (single inline action used by selection-menu — kept as-is)
 *   - <chat-thread>    (real-time chat, sender-grouped)
 *   - <comment-box>    (the FORM — composed here as the reply-form template)
 *
 * Presentational with respect to persistence: the component emits events and
 * lets authors mutate the DOM (or call addComment / updateComment / removeComment).
 *
 * @attr {string}  aria-label     - Region label for the thread
 * @attr {boolean} data-disabled  - Read-only mode (no Reply / Edit / Delete actions)
 *
 * @fires comment-thread:reply          - { parentId, value, waitUntil(promise) }
 *        when the reply form submits. Cancelable, same contract as
 *        comment-box:submit: do nothing → the form closes; waitUntil(promise)
 *        → the form stays busy, closes on resolve, keeps the text on reject;
 *        preventDefault() (synchronously) → the form stays open with its text.
 * @fires comment-thread:edit-request   - { commentId, value } when Edit clicked
 * @fires comment-thread:delete-request - { commentId } when Delete clicked
 *
 * Per-comment <article data-comment> attributes:
 *   id, data-author, data-author-href, data-author-avatar,
 *   data-time (ISO-8601), data-mine, data-parent, data-edited
 *
 * Comment body lives in a `[data-comment-body]` child (any element).
 *
 * Trust: addComment / updateComment take `bodyText` (set as text) or
 * `bodyHtml` (passed through VB's sanitizeHTML). data-author-href only
 * renders as a link for http(s) and relative URLs.
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { sanitizeHTML } from '../../lib/sanitize-html.js';
// Compose the reply-form (when the author's <template data-reply-form> uses it).
import '../comment-box/logic.js';

/** @type {[Intl.RelativeTimeFormatUnit, number][]} */
const UNITS = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3600],
  ['minute', 60],
];

/** Only http(s) and relative URLs may become a profile link. */
function safeHref(href) {
  if (!href) return null;
  try {
    const url = new URL(href, document.baseURI);
    return url.protocol === 'http:' || url.protocol === 'https:' ? href : null;
  } catch {
    return null;
  }
}

let uid = 0;

class CommentThread extends VBElement {
  /** @type {HTMLTemplateElement | null} */
  #replyTemplate = null;     // <template data-reply-form>
  /** @type {HTMLElement | null} */
  #activeReplyForm = null;  // live reply form mounted under a comment
  /** @type {ReturnType<typeof setInterval> | 0} */
  #refreshTimer = 0;  // periodic time-relative refresh

  setup() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Comments');

    this.#replyTemplate = /** @type {HTMLTemplateElement | null} */ (this.querySelector(':scope > template[data-reply-form]'));

    // Decorate every authored comment (idempotent: decoration survives a move).
    this.#scanComments().forEach((c) => this.#decorateComment(c));

    // One delegated listener per concern, on the host. Buttons and reply
    // forms keep working after the thread is moved, because the decorated
    // DOM persists and these are re-added by setup() on every connect.
    this.listen(this, 'click', this.#onClick);
    this.listen(this, 'comment-box:submit', this.#onBoxSubmit);
    this.listen(this, 'comment-box:cancel', this.#onBoxCancel);

    // Refresh relative-time badges every 60s (own ticker so we don't depend on
    // time-relative auto-init having seen these articles before our setup).
    this.#refreshTimes();
    this.#refreshTimer = setInterval(() => this.#refreshTimes(), 60_000);
  }

  teardown() {
    clearInterval(this.#refreshTimer);
  }

  #scanComments() {
    return /** @type {HTMLElement[]} */ ([...this.querySelectorAll(':scope > article[data-comment]')]);
  }

  #findComment(id) {
    return /** @type {HTMLElement | null} */ (this.querySelector(`:scope > article[data-comment][id="${CSS.escape(id)}"]`));
  }

  // ── Decoration ─────────────────────────────────────────────────────

  #decorateComment(comment) {
    if (comment.dataset.decorated === '') return;
    comment.dataset.decorated = '';

    // Threaded depth: walk up via data-parent chain. Visual only — the
    // article role does not expose a level to assistive tech.
    const depth = this.#computeDepth(comment);
    comment.style.setProperty('--comment-depth', String(depth));

    // Header: author + time. Insert before the body if no header authored.
    this.#mountHeader(comment);

    // Footer: action buttons.
    comment.appendChild(this.#buildFooter(comment));
  }

  #computeDepth(comment) {
    let depth = 0;
    let parentId = comment.dataset.parent;
    const seen = new Set();
    while (parentId) {
      if (seen.has(parentId)) break; // guard against cycles
      seen.add(parentId);
      const parent = this.#findComment(parentId);
      if (!parent) break;
      depth += 1;
      parentId = parent.dataset.parent;
    }
    return depth;
  }

  /** Build the header, mount it before the body, and name the article from it. */
  #mountHeader(comment) {
    comment.querySelector(':scope > .comment-header')?.remove();
    const header = this.#buildHeader(comment);
    const body = comment.querySelector(':scope > [data-comment-body]');
    if (body) comment.insertBefore(header, body);
    else comment.prepend(header);

    // Name each article "Author, time" so article navigation is meaningful.
    const ids = [...header.querySelectorAll('.comment-author, .comment-time')].map((el) => el.id);
    comment.setAttribute('aria-labelledby', ids.join(' '));
  }

  #buildHeader(comment) {
    const header = document.createElement('header');
    header.className = 'comment-header';
    const base = comment.id || `comment-thread-${++uid}`;

    const author = comment.dataset.author || 'Unknown';
    const authorHref = safeHref(comment.dataset.authorHref);
    const avatar = comment.dataset.authorAvatar;

    if (avatar) {
      // <user-avatar> is CSS-only: the picture is a child <img>. It is
      // decorative — the author is named in the text right after it.
      const av = document.createElement('user-avatar');
      av.setAttribute('name', author);
      const img = document.createElement('img');
      img.src = avatar;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      av.appendChild(img);
      header.appendChild(av);
    }

    const authorEl = document.createElement(authorHref ? 'a' : 'span');
    authorEl.className = 'comment-author';
    authorEl.id = `${base}-author`;
    authorEl.textContent = author;
    if (authorHref) /** @type {HTMLAnchorElement} */ (authorEl).href = authorHref;
    header.appendChild(authorEl);

    const time = comment.dataset.time;
    if (time) {
      const timeEl = document.createElement('time');
      timeEl.className = 'comment-time';
      timeEl.id = `${base}-time`;
      timeEl.setAttribute('datetime', time);
      const abs = this.#formatAbsolute(time);
      if (abs) timeEl.setAttribute('title', abs);
      timeEl.textContent = this.#formatRelative(time) || time;
      header.appendChild(timeEl);
    }

    if (comment.dataset.edited) {
      const edited = document.createElement('span');
      edited.className = 'comment-edited';
      const abs = this.#formatAbsolute(comment.dataset.edited);
      if (abs) edited.title = `Edited ${abs}`;
      edited.textContent = '(edited)';
      header.appendChild(edited);
    }

    return header;
  }

  #buildFooter(comment) {
    const footer = document.createElement('footer');
    footer.className = 'comment-footer';

    if (this.hasAttribute('data-disabled')) return footer;

    // No arrow-key roving, so this is a labelled group, not a toolbar.
    footer.setAttribute('role', 'group');
    footer.setAttribute('aria-label', 'Comment actions');

    const replyBtn = document.createElement('button');
    replyBtn.type = 'button';
    replyBtn.className = 'comment-action comment-reply';
    replyBtn.textContent = 'Reply';
    footer.appendChild(replyBtn);

    if (comment.hasAttribute('data-mine')) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'comment-action comment-edit';
      editBtn.textContent = 'Edit';
      footer.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'comment-action comment-delete';
      deleteBtn.textContent = 'Delete';
      footer.appendChild(deleteBtn);
    }

    this.#labelActions(comment, footer);
    return footer;
  }

  /** Per-comment action names: author + absolute time keep them distinct. */
  #labelActions(comment, footer = comment.querySelector(':scope > .comment-footer')) {
    if (!footer) return;
    const author = comment.dataset.author || 'Unknown';
    const abs = comment.dataset.time ? this.#formatAbsolute(comment.dataset.time) : '';
    const when = abs ? ` from ${abs}` : '';
    footer.querySelector('.comment-reply')?.setAttribute('aria-label', `Reply to ${author}${when}`);
    footer.querySelector('.comment-edit')?.setAttribute('aria-label', `Edit your comment${when}`);
    footer.querySelector('.comment-delete')?.setAttribute('aria-label', `Delete your comment${when}`);
  }

  // ── Action handlers ────────────────────────────────────────────────

  /** @param {MouseEvent} e */
  #onClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('button.comment-action'));
    if (!btn) return;
    const comment = /** @type {HTMLElement | null} */ (btn.closest('article[data-comment]'));
    if (!comment || comment.parentElement !== this) return;
    if (btn.classList.contains('comment-reply')) this.#onReplyClick(comment);
    else if (btn.classList.contains('comment-edit')) this.#onEditClick(comment);
    else if (btn.classList.contains('comment-delete')) this.#onDeleteClick(comment);
  };

  #onReplyClick(comment) {
    if (this.#activeReplyForm) this.#dismissReplyForm(false);
    if (!this.#replyTemplate) return;

    const fragment = /** @type {DocumentFragment} */ (this.#replyTemplate.content.cloneNode(true));
    const form = /** @type {HTMLElement} */ (fragment.firstElementChild ?? document.createElement('comment-box'));
    if (!form.hasAttribute('data-show-cancel')) form.setAttribute('data-show-cancel', '');
    if (form.localName === 'comment-box' && !form.hasAttribute('label')) {
      form.setAttribute('label', `Reply to ${comment.dataset.author || 'comment'}`);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'comment-reply-form';
    wrapper.setAttribute('data-parent', comment.id || '');
    wrapper.appendChild(form);
    comment.appendChild(wrapper);
    this.#activeReplyForm = wrapper;

    // Focus the form's editor for keyboard users.
    requestAnimationFrame(() => form.focus?.());
  }

  /** The reply-form wrapper an event came from, if it is ours. */
  #replyWrapperFor(e) {
    const wrapper = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('.comment-reply-form'));
    return wrapper && wrapper === this.#activeReplyForm ? wrapper : null;
  }

  /** @param {Event} e */
  #onBoxSubmit = (e) => {
    const wrapper = this.#replyWrapperFor(e);
    if (!wrapper) return;
    const boxEvent = /** @type {CustomEvent} */ (e);
    const comment = /** @type {HTMLElement} */ (wrapper.parentElement);

    /** @type {Promise<unknown>[]} */
    const pending = [];
    let dispatching = true;
    const proceed = this.dispatchEvent(new CustomEvent('comment-thread:reply', {
      bubbles: true,
      cancelable: true,
      detail: {
        parentId: comment.id,
        value: boxEvent.detail.value,
        /** @param {Promise<unknown>} promise */
        waitUntil(promise) {
          if (!dispatching) throw new DOMException('waitUntil() must be called while comment-thread:reply is dispatching', 'InvalidStateError');
          pending.push(Promise.resolve(promise));
        },
      },
    }));
    dispatching = false;

    if (!proceed) {
      // Keep the form and its text (the box keeps its value too).
      boxEvent.preventDefault();
      return;
    }
    if (!pending.length) {
      this.#dismissReplyForm(true);
      return;
    }
    const all = Promise.all(pending);
    boxEvent.detail.waitUntil?.(all);
    all.then(() => {
      if (this.#activeReplyForm === wrapper) this.#dismissReplyForm(true);
    }, () => { /* rejected: comment-box keeps the text for a retry */ });
  };

  /** @param {Event} e */
  #onBoxCancel = (e) => {
    if (this.#replyWrapperFor(e)) this.#dismissReplyForm(true);
  };

  /** @param {boolean} restoreFocus - move focus back to the comment's Reply button */
  #dismissReplyForm(restoreFocus) {
    const wrapper = this.#activeReplyForm;
    if (!wrapper) return;
    const comment = wrapper.parentElement;
    const hadFocus = wrapper.contains(document.activeElement);
    wrapper.remove();
    this.#activeReplyForm = null;
    if (restoreFocus || hadFocus) {
      /** @type {HTMLElement | null | undefined} */ (comment?.querySelector(':scope > .comment-footer > .comment-reply'))?.focus();
    }
  }

  #onEditClick(comment) {
    const body = comment.querySelector(':scope > [data-comment-body]');
    const value = body?.textContent.trim() ?? '';
    this.dispatchEvent(new CustomEvent('comment-thread:edit-request', {
      bubbles: true,
      detail: { commentId: comment.id, value },
    }));
  }

  #onDeleteClick(comment) {
    this.dispatchEvent(new CustomEvent('comment-thread:delete-request', {
      bubbles: true,
      detail: { commentId: comment.id },
    }));
  }

  // ── Time helpers ───────────────────────────────────────────────────

  #lang() {
    return /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || undefined;
  }

  /** Localized relative time ("2 hours ago"), or '' for an unparseable date. */
  #formatRelative(iso) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = (t - Date.now()) / 1000; // negative = past
    const rtf = new Intl.RelativeTimeFormat(this.#lang(), { numeric: 'auto' });
    for (const [unit, secs] of UNITS) {
      if (Math.abs(diff) >= secs) return rtf.format(Math.trunc(diff / secs), unit);
    }
    return rtf.format(0, 'second');
  }

  #refreshTimes() {
    for (const t of this.querySelectorAll(':scope > article[data-comment] > .comment-header > time')) {
      const dt = t.getAttribute('datetime');
      if (!dt) continue;
      const rel = this.#formatRelative(dt);
      if (rel) t.textContent = rel;
    }
  }

  /** Localized absolute time, or '' for an unparseable date. */
  #formatAbsolute(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(this.#lang(), { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }

  /** Fill a body element from `bodyText` (as text) or `bodyHtml` (sanitized). */
  #fillBody(body, data) {
    if (data.bodyText != null) body.textContent = String(data.bodyText);
    else if (data.bodyHtml != null) body.innerHTML = sanitizeHTML(String(data.bodyHtml));
    if ('body' in data) console.warn('[VB] comment-thread: `body` was removed — pass `bodyText` (plain text) or `bodyHtml` (sanitized HTML).');
  }

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Add a new comment from server data. A reply (parentId) is inserted after
   * the parent's last descendant; a top-level comment goes at the end.
   *
   * @param {{
   *   id: string,
   *   author: string,
   *   authorHref?: string,   // http(s) or relative only; others render as text
   *   authorAvatar?: string,
   *   time: string,          // ISO-8601
   *   bodyText?: string,     // plain text — set via textContent
   *   bodyHtml?: string,     // HTML — passed through sanitizeHTML
   *   parentId?: string,
   *   mine?: boolean,
   *   edited?: string,
   * }} data
   * @returns {HTMLElement} The created comment <article>.
   */
  addComment(data) {
    const article = document.createElement('article');
    article.setAttribute('data-comment', '');
    article.id = data.id;
    article.dataset.author = data.author;
    if (data.authorHref) article.dataset.authorHref = data.authorHref;
    if (data.authorAvatar) article.dataset.authorAvatar = data.authorAvatar;
    article.dataset.time = data.time;
    if (data.parentId) article.dataset.parent = data.parentId;
    if (data.mine) article.setAttribute('data-mine', '');
    if (data.edited) article.dataset.edited = data.edited;

    const body = document.createElement('div');
    body.setAttribute('data-comment-body', '');
    this.#fillBody(body, data);
    article.appendChild(body);

    const anchor = data.parentId ? this.#lastInSubtree(data.parentId) : null;
    if (anchor) anchor.after(article);
    else if (this.#replyTemplate?.parentNode === this) this.insertBefore(article, this.#replyTemplate);
    else {
      const comments = this.#scanComments();
      const last = comments[comments.length - 1];
      if (last) last.after(article);
      else this.appendChild(article);
    }

    this.#decorateComment(article);
    return article;
  }

  /** The parent comment, or the last of its consecutive descendants. */
  #lastInSubtree(parentId) {
    const parent = this.#findComment(parentId);
    if (!parent) return null;
    const ids = new Set([parentId]);
    let last = parent;
    let next = parent.nextElementSibling;
    while (next instanceof HTMLElement && next.matches('article[data-comment]') && ids.has(next.dataset.parent ?? '')) {
      if (next.id) ids.add(next.id);
      last = next;
      next = next.nextElementSibling;
    }
    return last;
  }

  /**
   * Patch a comment's data after the server confirms an edit.
   *
   * @param {string} id
   * @param {{ bodyText?: string, bodyHtml?: string, edited?: string, author?: string }} patch
   */
  updateComment(id, patch = {}) {
    const c = this.#findComment(id);
    if (!c) return;
    const body = c.querySelector(':scope > [data-comment-body]');
    if (body) this.#fillBody(body, patch);
    if (patch.author != null) c.dataset.author = patch.author;
    if (patch.edited != null) c.dataset.edited = patch.edited;
    // Re-build the header (and action names) to pick up edited/author changes.
    this.#mountHeader(c);
    this.#labelActions(c);
  }

  /** Remove a comment from the thread. */
  removeComment(id) {
    this.#findComment(id)?.remove();
  }
}

registerComponent('comment-thread', CommentThread);

export { CommentThread };
