# File Display Pattern

Render uploaded or downloadable files as accessible rows, links, or cards. Uses [data-file] with icon-wc, native download links, and optional status/actions.

- Documentation: https://vanilla-breeze.com/docs/patterns/data/files/
- Vanilla Breeze 0.7.4

## Overview

Most interfaces that move files around &mdash; attachments, downloads, upload progress, asset galleries &mdash; need the same four ingredients: a type icon, a name, some meta (size, status, extension), and optional actions (download, remove, retry).

Vanilla Breeze ships a CSS-only pattern for this under `[data-file]`. It applies to `<li>`, `<a>`, or any block container, so you can compose it inside a list, use it as a clickable download link, or drop it into a `<layout-grid>`. No web component &mdash; just markup.

Key features:
- Row layout (default) or card layout via `data-file-layout="card"`
- Status colors for upload flows via `data-file-status="uploading|success|error"`
- Works as a pure link (`<a data-file href="…" download>`) with hover and focus states
- Pairs with `icon-wc` for type icons and `<layout-grid>` for galleries
- No JavaScript &mdash; style only

## Basic File Row

The default layout: icon, name, meta, and actions in a single row. Name truncates with an ellipsis, meta is `font-variant-numeric: tabular-nums` so sizes align vertically in a list.

Basic file row list:

```html
<ul class="file-list">
  <li data-file>
    <icon-wc name="file-text"></icon-wc>
    <span class="file-name">quarterly-report.pdf</span>
    <span class="file-meta">2.4 MB</span>
    <span class="file-actions">
      <a href="/files/quarterly-report.pdf" download>Download</a>
    </span>
  </li>
  <li data-file>
    <icon-wc name="image"></icon-wc>
    <span class="file-name">site-screenshot.png</span>
    <span class="file-meta">842 KB</span>
    <span class="file-actions">
      <a href="/files/site-screenshot.png" download>Download</a>
    </span>
  </li>
</ul>
```

## Entire row as a download link

For a quieter list, put `data-file` directly on an `<a>`. The whole row becomes clickable and picks up hover/focus styles automatically. Pair with `download` for same-origin files and `target="_blank" rel="noopener"` for external links.

Row-as-link pattern:

```html
<ul class="file-list">
  <li>
    <a data-file href="/files/quarterly-report.pdf" download>
      <icon-wc name="file-text"></icon-wc>
      <span class="file-name">quarterly-report.pdf</span>
      <span class="file-meta">2.4 MB</span>
    </a>
  </li>
  <li>
    <a data-file href="https://example.com/schedule" target="_blank" rel="noopener">
      <icon-wc name="external-link"></icon-wc>
      <span class="file-name">Event schedule (web)</span>
      <span class="file-meta">example.com</span>
    </a>
  </li>
</ul>
```

## Card Grid

Add `data-file-layout="card"` for a stacked icon-above-name layout that slots into a `<layout-grid>`. Good for asset galleries and download directories.

File cards in a grid:

```html
<layout-grid data-layout-min="s" data-layout-gap="m">
  <a data-file data-file-layout="card" href="/files/quarterly-report.pdf" download>
    <icon-wc name="file-text"></icon-wc>
    <span class="file-name">quarterly-report.pdf</span>
    <span class="file-meta">2.4 MB &middot; PDF</span>
  </a>
  <a data-file data-file-layout="card" href="/files/design-assets.zip" download>
    <icon-wc name="archive"></icon-wc>
    <span class="file-name">design-assets.zip</span>
    <span class="file-meta">18.7 MB &middot; ZIP</span>
  </a>
</layout-grid>
```

## Upload list with status

For upload flows, the meta text is the status. Use `data-file-status` to color it semantically: `uploading` / `processing` map to the interactive color, `success` to green, `error` to red. Put the remove or retry action in `.file-actions`.

Upload list with per-row status:

```html
<section aria-label="Selected files">
<ul class="file-list">
  <li data-file data-file-status="success">
    <icon-wc name="file-text"></icon-wc>
    <span class="file-name">contract.pdf</span>
    <span class="file-meta">1.2 MB &middot; uploaded</span>
    <span class="file-actions">
      <button type="button" class="ghost" aria-label="Remove contract.pdf">
        <icon-wc name="x"></icon-wc>
      </button>
    </span>
  </li>
  <li data-file data-file-status="uploading">
    <icon-wc name="image"></icon-wc>
    <span class="file-name">scan-page-3.jpg</span>
    <span class="file-meta">4.8 MB &middot; uploading 62%</span>
    <span class="file-actions">
      <button type="button" class="ghost" aria-label="Cancel upload">
        <icon-wc name="x"></icon-wc>
      </button>
    </span>
  </li>
  <li data-file data-file-status="error">
    <icon-wc name="file-warning"></icon-wc>
    <span class="file-name">payroll.xlsx</span>
    <span class="file-meta">22 MB &middot; too large (max 10 MB)</span>
    <span class="file-actions">
      <button type="button" class="secondary">Retry</button>
    </span>
  </li>
</ul>
</section>
```

## Accessibility

- Use a real `<a>` for downloads and `<button type="button">` for in-page actions (remove, retry, cancel). No `div role="button"` tricks.
- Icon-only action buttons need an accessible name. Use `aria-label="Remove <filename>"` so screen readers can distinguish one row&rsquo;s remove button from the next.
- If the status message changes during an upload, consider wrapping the meta span in `<output aria-live="polite">` so screen readers hear progress updates.
- Type icons are decorative &mdash; `icon-wc` already sets `aria-hidden="true"` automatically. The filename carries the meaning.
- For external links, pair `target="_blank"` with the &ldquo;opens in new tab&rdquo; hint from Accessibility Utilities.

## Related

Drag-and-drop file input. It renders its own `.upload-file-list` (name and size); use `[data-file]` rows when you show selected or uploaded files elsewhere.

The native `accept` attribute limits the file picker (and `data-upload` drops) to listed types. It is a hint: validate on the server.

Native download semantics and filename hints.

Lucide-backed icon component &mdash; source for the type icons used here.
