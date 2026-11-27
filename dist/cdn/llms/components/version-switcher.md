# <version-switcher>

Surface and switch between versions of a page over time. Data from inline JSON, a data-src manifest or the vb:versions-manifest meta tag; a trigger + picker popover; three actions (navigate / swap / diff). Mode (releases vs history) is derived from the data. Entry URLs are scheme-checked (javascript:/data: entries dropped); swap and diff fetch same-origin URLs only and swapped markup is sanitized.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/version-switcher/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- in <head>: -->
<meta itemprop="version" content="v2.1">
<meta name="vb:versions-manifest" content="/data/versions/api.json">

<!-- in <body>: just drop the element — it fetches the manifest -->
<version-switcher aria-label="API version"></version-switcher>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-versions` | string |  | Inline JSON array of version entries: { id, label?, url?, date?, author?, summary?, archived?, draft?, current?, versionUrl? }. Alternative: a <script type="application/json" data-versions> child. Entries whose url is a script/data URL are dropped; an unsafe versionUrl drops only the changelog link. Stripped by the untrusted sanitizer profile. |
| `data-src` | string |  | URL of a JSON manifest (same entry shape) fetched when no inline data is provided. Falls back to <meta name="vb:versions-manifest"> if neither is set. Stripped by the untrusted sanitizer profile. |
| `data-mode` | `releases`, `history` |  | Override the derived mode: releases (entries have distinct URLs) or history (entries share one URL). Sets the picker heading; observed. |
| `data-action` | `navigate`, `swap`, `diff` | `navigate` | navigate sets location.href to the entry url (skipped, with an error event, when that url is the current page); swap fetches the same-origin entry url and replaces the versioned region in place (sanitized, view-transition crossfade); diff mounts a <change-set> line diff beside the versioned region. |
| `data-versioned-region` | string |  | CSS selector for the swappable / diffable region. Without it, the region is the first [data-versioned] element, or main when the page has none. |
| `data-diff-position` | `before`, `after` | `before` | Where to mount the diff render relative to the versioned region. |
| `data-banner` | boolean |  | Render an archived-version notice (an <aside> with a polite status line, filled after insertion so it is announced) when the current entry is archived AND a non-archived latest exists; the latest is a link only when it has a safe url. |
| `data-page-info-target` | string |  | ID of a <page-info> to mount inside as a section in its expandable panel; the standalone trigger is hidden in this mode. The section is removed when the switcher disconnects. |
| `aria-label` | string | `Version` | What the switcher picks (e.g. "API version"). Not applied to the host (it has no role): it names the trigger ("API version: v2.1") and the picker dialog. Falls back to data-label-trigger. |
| `data-label-trigger` | string | `Version` | Fallback name for the trigger / picker when no aria-label is set, and trigger text with no current entry. |
| `data-label-loading` | string | `Loading…` | Trigger text while the manifest is fetched. |
| `data-label-loading-versions` | string | `Loading versions…` | Trigger title and panel row while the manifest is fetched. |
| `data-label-empty` | string | `No versions available.` | Empty-state row and disabled-trigger title. |
| `data-label-heading-releases` | string | `Versions` | Picker / panel heading in releases mode. |
| `data-label-heading-history` | string | `History` | Picker / panel heading in history mode. |
| `data-label-archived` | string | `archived` | Archived badge. |
| `data-label-draft` | string | `draft` | Draft badge. |
| `data-label-current` | string | `current` | Current badge. |
| `data-label-by` | string | `by {author}` | Author line ({author}). |
| `data-label-changelog` | string | `Changelog` | Changelog link text. |
| `data-label-changelog-for` | string | `{version} changelog` | Changelog link accessible name ({version}). |
| `data-label-banner-label` | string | `Archived version notice` | Banner landmark name. |
| `data-label-banner` | string | `You’re viewing {version} (archived).` | Banner status text ({version}). |
| `data-label-banner-latest` | string | `Latest: {version}` | Banner latest link / text ({version}). |
| `data-label-diff` | string | `Diff: {from} → {to}` | Caption above the diff render ({from}, {to}). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-versions` | script | boolean |  | Marks a <script type="application/json"> child as the versions JSON source |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `version-switcher:open` |  | Picker popover opened |
| `version-switcher:close` |  | Picker popover closed |
| `version-switcher:select` | `{ entry }` | Fires when an entry is selected (before the action runs) |
| `version-switcher:before-navigate` | `{ entry }` | Cancellable. Fires before location.href is set (only for a safe url that is not the current page); preventDefault() blocks navigation. |
| `version-switcher:before-swap` | `{ entry }` | Cancellable. Fires before swap fetches (same-origin only) and replaces the versioned region. |
| `version-switcher:swap` | `{ entry, previousId }` | Fires after swap completes: versioned region replaced (sanitized) and <meta itemprop="version"> updated. |
| `version-switcher:before-diff` | `{ entry }` | Cancellable. Fires before diff fetches the other version. |
| `version-switcher:diff` | `{ entry, previousId, diffElement, opCount }` | Fires after diff renders. diffElement is the mounted <change-set>. |
| `version-switcher:error` | `{ message, entry?, error? }` | Parse / fetch / action failure, a dropped unsafe entry, a cross-origin swap/diff url, or a navigate to the current page. |

## Methods

| Method | Description |
| --- | --- |
| `openPicker()` | Open the picker popover. |
| `closePicker()` | Close the picker popover. |
| `switchTo(id)` | Programmatic selection; fires select then runs data-action. |
| `refresh()` | Re-resolve the data source and re-render. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `versions` | `VersionEntry[]` | Resolved (URL-checked) version entries; read-only copy. |
| `currentId` | `string\|null` | Id of the current entry. |

## Accessibility

- Pattern: Native popover
- You provide: An aria-label on the host when the default trigger name does not fit
- The component manages: `role="dialog"`, `role="list"`, `role="listitem"`, `role="status"`, `aria-haspopup`, `aria-expanded`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-current`, `aria-hidden`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` | Move to the next version | Focus on a version in the picker |
| `ArrowUp` | Move to the previous version | Focus on a version in the picker |
| `Home` | Move to the first version | Focus on a version in the picker |
| `End` | Move to the last version | Focus on a version in the picker |
| `Escape` | Close the picker | Native behaviour of popover |
