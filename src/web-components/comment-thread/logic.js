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
 * @fires comment-thread:reply          - { parentId, value } when reply form submits
 * @fires comment-thread:edit-request   - { commentId, value } when Edit clicked
 * @fires comment-thread:delete-request - { commentId } when Delete clicked
 *
 * Per-comment <article data-comment> attributes:
 *   id, data-author, data-author-href, data-author-avatar,
 *   data-time (ISO-8601), data-mine, data-parent, data-edited
 *
 * Comment body lives in <div data-comment-body> with rendered HTML.
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { formatRelative } from '../../lib/time-relative.js';
// Compose the reply-form (when the author's <template data-reply-form> uses it).
import '../comment-box/logic.js';

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

    // Decorate every authored comment.
    this.#scanComments().forEach((c) => this.#decorateComment(c));

    // Refresh relative-time badges every 60s (own ticker so we don't depend on
    // time-relative auto-init having seen these articles before our setup).
    this.#refreshTimer = setInterval(() => this.#refreshTimes(), 60_000);
  }

  teardown() {
    clearInterval(this.#refreshTimer);
  }

  #scanComments() {
    return /** @type {HTMLElement[]} */ ([...this.querySelectorAll(':scope > article[data-comment]')]);
  }

  // ── Decoration ─────────────────────────────────────────────────────

  #decorateComment(comment) {
    if (comment.dataset.decorated === '') return;
    comment.dataset.decorated = '';

    // Threaded depth: walk up via data-parent chain.
    const depth = this.#computeDepth(comment);
    comment.style.setProperty('--comment-depth', String(depth));
    if (depth > 0) comment.setAttribute('aria-level', String(depth + 1));

    // Header: author + time. Insert before the body if no header authored.
    const header = this.#buildHeader(comment);
    const body = comment.querySelector(':scope > [data-comment-body]');
    if (body) comment.insertBefore(header, body);
    else comment.prepend(header);

    // Footer: action buttons.
    const footer = this.#buildFooter(comment);
    comment.appendChild(footer);
  }

  #computeDepth(comment) {
    let depth = 0;
    let parentId = comment.dataset.parent;
    const seen = new Set();
    while (parentId) {
      if (seen.has(parentId)) break; // guard against cycles
      seen.add(parentId);
      const parent = /** @type {HTMLElement | null} */ (this.querySelector(`:scope > article[data-comment][id="${CSS.escape(parentId)}"]`));
      if (!parent) break;
      depth += 1;
      parentId = parent.dataset.parent;
    }
    return depth;
  }

  #buildHeader(comment) {
    const header = document.createElement('header');
    header.className = 'comment-header';

    const author = comment.dataset.author || 'Unknown';
    const authorHref = comment.dataset.authorHref;
    const avatar = comment.dataset.authorAvatar;

    if (avatar) {
      const av = document.createElement('user-avatar');
      av.setAttribute('src', avatar);
      av.setAttribute('name', author);
      header.appendChild(av);
    }

    const authorEl = document.createElement(authorHref ? 'a' : 'span');
    authorEl.className = 'comment-author';
    authorEl.textContent = author;
    if (authorHref) /** @type {HTMLAnchorElement} */ (authorEl).href = authorHref;
    header.appendChild(authorEl);

    const time = comment.dataset.time;
    if (time) {
      const timeEl = document.createElement('time');
      timeEl.className = 'comment-time';
      timeEl.setAttribute('datetime', time);
      timeEl.setAttribute('title', this.#formatAbsolute(time));
      timeEl.textContent = formatRelative(new Date(time)) || time;
      header.appendChild(timeEl);
    }

    if (comment.dataset.edited) {
      const edited = document.createElement('span');
      edited.className = 'comment-edited';
      edited.title = `Edited ${this.#formatAbsolute(comment.dataset.edited)}`;
      edited.textContent = '(edited)';
      header.appendChild(edited);
    }

    return header;
  }

  #buildFooter(comment) {
    const footer = document.createElement('footer');
    footer.className = 'comment-footer';
    footer.setAttribute('role', 'toolbar');

    if (this.hasAttribute('data-disabled')) return footer;

    const replyBtn = document.createElement('button');
    replyBtn.type = 'button';
    replyBtn.className = 'comment-action comment-reply';
    replyBtn.textContent = 'Reply';
    replyBtn.setAttribute('aria-label', `Reply to ${comment.dataset.author || 'comment'}`);
    this.listen(replyBtn, 'click', () => this.#onReplyClick(comment));
    footer.appendChild(replyBtn);

    if (comment.hasAttribute('data-mine')) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'comment-action comment-edit';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit your comment');
      this.listen(editBtn, 'click', () => this.#onEditClick(comment));
      footer.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'comment-action comment-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete your comment');
      this.listen(deleteBtn, 'click', () => this.#onDeleteClick(comment));
      footer.appendChild(deleteBtn);
    }

    return footer;
  }

  // ── Action handlers ────────────────────────────────────────────────

  #onReplyClick(comment) {
    if (this.#activeReplyForm) this.#dismissReplyForm();
    if (!this.#replyTemplate) return;

    const fragment = /** @type {DocumentFragment} */ (this.#replyTemplate.content.cloneNode(true));
    const form = /** @type {HTMLElement} */ (fragment.firstElementChild?.cloneNode
      ? fragment.firstElementChild
      : document.createElement('comment-box'));
    if (!form.hasAttribute('data-show-cancel')) form.setAttribute('data-show-cancel', '');

    const wrapper = document.createElement('div');
    wrapper.className = 'comment-reply-form';
    wrapper.setAttribute('data-parent', comment.id || '');
    wrapper.appendChild(form);
    comment.appendChild(wrapper);
    this.#activeReplyForm = wrapper;

    // Focus the form's editor for keyboard users.
    requestAnimationFrame(() => form.focus?.());

    // Wire the form events to thread events.
    form.addEventListener('comment-box:submit', (e) => {
      this.dispatchEvent(new CustomEvent('comment-thread:reply', {
        bubbles: true,
        detail: { parentId: comment.id, value: /** @type {CustomEvent} */ (e).detail.value },
      }));
      this.#dismissReplyForm();
    });
    form.addEventListener('comment-box:cancel', () => this.#dismissReplyForm());
  }

  #dismissReplyForm() {
    if (!this.#activeReplyForm) return;
    this.#activeReplyForm.remove();
    this.#activeReplyForm = null;
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

  #refreshTimes() {
    for (const t of this.querySelectorAll(':scope > article[data-comment] > .comment-header > time')) {
      const dt = t.getAttribute('datetime');
      if (!dt) continue;
      const rel = formatRelative(new Date(dt));
      if (rel) t.textContent = rel;
    }
  }

  #formatAbsolute(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Append (or insert at parent) a new comment from server data.
   *
   * @param {{
   *   id: string,
   *   author: string,
   *   authorHref?: string,
   *   authorAvatar?: string,
   *   time: string,        // ISO-8601
   *   body: string,        // rendered HTML
   *   parentId?: string,
   *   mine?: boolean,
   *   edited?: string,
   * }} data
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
    body.innerHTML = data.body;
    article.appendChild(body);

    // Insert before the reply-form template (which always sits at end).
    if (this.#replyTemplate) this.insertBefore(article, this.#replyTemplate);
    else this.appendChild(article);

    this.#decorateComment(article);
    return article;
  }

  /**
   * Patch a comment's data after the server confirms an edit.
   *
   * @param {string} id
   * @param {{ body?: string, edited?: string, author?: string }} patch
   */
  updateComment(id, patch = {}) {
    const c = /** @type {HTMLElement | null} */ (this.querySelector(`:scope > article[data-comment][id="${CSS.escape(id)}"]`));
    if (!c) return;
    if (patch.body != null) {
      const body = c.querySelector(':scope > [data-comment-body]');
      if (body) body.innerHTML = patch.body;
    }
    if (patch.author != null) c.dataset.author = patch.author;
    if (patch.edited != null) c.dataset.edited = patch.edited;
    // Re-decorate the header to pick up edited/author changes.
    c.querySelector(':scope > .comment-header')?.remove();
    const body = c.querySelector(':scope > [data-comment-body]');
    const header = this.#buildHeader(c);
    if (body) c.insertBefore(header, body);
    else c.prepend(header);
  }

  /** Remove a comment from the thread. */
  removeComment(id) {
    const c = this.querySelector(`:scope > article[data-comment][id="${CSS.escape(id)}"]`);
    if (c) c.remove();
  }
}

registerComponent('comment-thread', CommentThread);

export { CommentThread };
