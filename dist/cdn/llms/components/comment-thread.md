# <comment-thread>

Persistent threaded-discussion container. Author renders <article data-comment> children with metadata; component decorates each with author header, relative timestamp, action row (Reply / Edit / Delete) + threaded indentation. Composes <comment-box> (reply form template) and bubbles <reaction-bar> events naturally. Bodies added through the API are text or sanitized HTML.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/comment-thread/
- Vanilla Breeze 0.7.4

## Example

```html
<comment-thread aria-label="Comments on issue 482">
  <article data-comment id="c1" data-author="Ada Lovelace" data-time="2026-05-14T10:00:00Z" data-mine>
    <div data-comment-body>Looks great — ship it.</div>
    <reaction-bar>
      <button data-reaction="thumbsup" data-count="3" data-mine>👍</button>
      <template data-palette>
        <button data-reaction="thumbsup">👍</button>
        <button data-reaction="heart">❤️</button>
        <button data-reaction="rocket">🚀</button>
      </template>
    </reaction-bar>
  </article>

  <article data-comment id="c2" data-author="Bob" data-time="2026-05-14T11:00:00Z" data-parent="c1">
    <div data-comment-body>Agreed!</div>
  </article>

  <template data-reply-form>
    <comment-box submit-label="Reply" data-show-cancel></comment-box>
  </template>
</comment-thread>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | string |  | Region label for the thread (default "Comments") |
| `data-disabled` | boolean |  | Read-only mode — no Reply / Edit / Delete actions |
| `role` |  |  | Set to "region" when absent |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-comment` | article | boolean |  | Marks an article as a thread comment |
| `data-author` | article | string |  | Display name |
| `data-author-href` | article | string |  | Optional link to the author's profile. Only http(s) and relative URLs become a link; anything else renders as text |
| `data-author-avatar` | article | string |  | Optional avatar URL (renders <user-avatar>) |
| `data-time` | article | string |  | ISO-8601 timestamp; rendered relative (Intl.RelativeTimeFormat in the element's lang) with the absolute time in title. Unparseable values render as-is |
| `data-mine` | article | boolean |  | Current user authored this comment — enables Edit / Delete |
| `data-parent` | article | string |  | Id of parent comment for nested replies |
| `data-edited` | article | string |  | ISO timestamp of last edit; renders "(edited)" badge |
| `data-comment-body` | * | boolean |  | Marks the comment body (any element, e.g. <section> or <div>) |
| `data-reply-form` | template | boolean |  | Marks the template whose content is cloned for the reply form |
| `aria-labelledby` | article | string |  | Set by the component: names each comment from its author and time |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `comment-thread:reply` | `{ parentId, value, waitUntil(promise) }` | Reply form submitted. Cancelable, same contract as comment-box:submit: do nothing and the form closes; waitUntil(promise) keeps it busy, closing on resolve and keeping the text on reject; preventDefault() during the handler keeps it open. Focus returns to the comment's Reply button when it closes. |
| `comment-thread:edit-request` | `{ commentId, value }` | Edit clicked; value is the body's text. Author renders an editor and calls updateComment |
| `comment-thread:delete-request` | `{ commentId }` | Delete clicked; author confirms + calls removeComment |

## Methods

| Method | Description |
| --- | --- |
| `addComment(data)` | Insert a comment: data { id, author, time, bodyText? \| bodyHtml?, parentId?, mine?, authorHref?, authorAvatar?, edited? }. bodyText is set as text; bodyHtml is sanitized. A reply goes after its parent's last descendant. Returns the <article> |
| `updateComment(id, patch)` | Patch a comment: patch { bodyText? \| bodyHtml?, author?, edited? } |
| `removeComment(id)` | Remove a comment from the thread |

## Accessibility

- Pattern: Landmark region
- You provide: An <article data-comment> for each comment, and an aria-label on the thread when the default "Comments" does not describe it
- The component manages: `role="region"`, `role="group"`, `aria-label`, `aria-labelledby`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Reply to, edit or delete the comment | Native behaviour of <button> |
