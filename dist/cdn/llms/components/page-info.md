# <page-info>

Document provenance disclosure panel

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/page-info/
- Vanilla Breeze 0.7.4

## Example

```html
<page-info>
  <details>
    <summary>
      <span class="page-info-author">Jane Doe</span>
      <span class="page-info-sep" aria-hidden="true">&middot;</span>
      <time datetime="2026-03-15" data-relative>
        15 March 2026
      </time>
      <span class="page-info-sep" aria-hidden="true">&middot;</span>
      <span class="page-info-badge"
            data-provenance="ai-assisted"
            data-trust="declared">
        Human-written, AI-assisted
      </span>
    </summary>
    <section class="page-info-panel">
      <section>
        <h2 class="page-info-section-heading">Author</h2>
        <ul class="page-info-author-list">
          <li>
            <address>
              <a href="/team/jane" rel="author">Jane Doe</a>
              <span class="page-info-role">Lead author</span>
            </address>
          </li>
        </ul>
      </section>
      <section>
        <h2 class="page-info-section-heading">History</h2>
        <dl>
          <div>
            <dt>Published</dt>
            <dd><time datetime="2026-01-10">January 10, 2026</time></dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>
              <time datetime="2026-03-15" data-relative>
                15 March 2026
              </time>
            </dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>1.4.0</dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd data-reading-time>&mdash;</dd>
          </div>
        </dl>
      </section>
      <section>
        <h2 class="page-info-section-heading">How this was made</h2>
        <dl>
          <div>
            <dt>Authorship</dt>
            <dd>Human-written, AI-assisted</dd>
          </div>
          <div>
            <dt>AI tools used</dt>
            <dd>Claude Sonnet 4 &mdash; research and drafting</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>Editor-reviewed</dd>
          </div>
        </dl>
      </section>
    </section>
  </details>
</page-info>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `auto` | boolean |  | Render the whole panel from <meta> tags in <head> (meta-tag contract v1): author, link[rel=author] / article:author, last-modified / article:modified_time, article:published_time, itemprop=version, vb:version-url, vb:provenance, vb:ai-tools, vb:review, vb:status, license + link[rel=license], keywords, repeated meta[name=concept]. Values are inserted as text; links are used only when they resolve to http(s). |
| `data-concept-base` | string | `/topics/` | Auto mode: base path for concept links ({base}{id}/). Must be relative or http(s); otherwise concepts render as plain text. |
| `data-heading-level` | `2`, `3`, `4`, `5`, `6` | `2` | Auto mode: heading level of the panel section headings. |
| `data-label-reading-time` | string | `~{n}` | Template for [data-reading-time]; {n} is the Intl-formatted minute value ("5 min"). |
| `data-label-author` | string | `Author` | Auto mode UI string (default "Author"). |
| `data-label-history` | string | `History` | Auto mode UI string (default "History"). |
| `data-label-provenance` | string | `How this was made` | Auto mode UI string (default "How this was made"). |
| `data-label-topic` | string | `Topic` | Auto mode UI string (default "Topic"). |
| `data-label-published` | string | `Published` | Auto mode UI string (default "Published"). |
| `data-label-updated` | string | `Last updated` | Auto mode UI string (default "Last updated"). |
| `data-label-version` | string | `Version` | Auto mode UI string (default "Version"). |
| `data-label-authorship` | string | `Authorship` | Auto mode UI string (default "Authorship"). |
| `data-label-ai-tools` | string | `AI tools used` | Auto mode UI string (default "AI tools used"). |
| `data-label-review` | string | `Review` | Auto mode UI string (default "Review"). |
| `data-label-status` | string | `Status` | Auto mode UI string (default "Status"). |
| `data-label-license` | string | `License` | Auto mode UI string (default "License"). |
| `data-label-concepts` | string | `Concepts` | Auto mode UI string (default "Concepts"). |
| `data-label-keywords` | string | `Keywords` | Auto mode UI string (default "Keywords"). |
| `data-label-tier-declared` | string | `Self-declared` | Visible trust-tier text appended to the badge for data-trust="declared" (default "Self-declared"). |
| `data-label-tier-verified` | string | `Verified` | Visible trust-tier text appended to the badge for data-trust="verified" (default "Verified"). |
| `data-label-tier-failed` | string | `Signature failed` | Visible trust-tier text appended to the badge for data-trust="failed" (default "Signature failed"). |
| `data-label-tier-key-unavailable` | string | `Key unavailable` | Visible trust-tier text appended to the badge for data-trust="key-unavailable" (default "Key unavailable"). |
| `data-label-tier-key-untrusted` | string | `Key not from this site` | Visible trust-tier text for data-trust="failed" when link[rel=author-key] points at another origin (default "Key not from this site"). The key is not fetched. |
| `data-label-tier-key-expired` | string | `Key expired` | Visible trust-tier text for data-trust="failed" when the key's metadata.expires date has passed (default "Key expired"). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-trust` | .page-info-badge | `undeclared`, `declared`, `verified`, `failed`, `key-unavailable` |  | Verification tier, written by the component (the first .page-info-badge without data-status). A .page-info-tier span with the tier text is appended inside the badge. |
| `data-provenance` | .page-info-badge | string |  | vb:provenance token(s) the badge describes (styling hook). |
| `data-status` | .page-info-badge | `draft`, `archived` |  | Publication-status badge (auto mode renders it for non-published pages); excluded from trust updates. |
| `data-relative` | time | boolean |  | Rewrite the text as a localized relative time (Intl.RelativeTimeFormat, closest [lang]) from the datetime attribute; the absolute date is put in title unless the author set one. Future dates read "in 3 days". |
| `datetime` | time | string |  | ISO date or datetime read by time[data-relative]. Date-only values are formatted in UTC. |
| `data-reading-time` | any element | boolean |  | Filled with the estimated reading time of the page's outermost [data-signable] roots (238 wpm / 500 CJK chars per minute, shared with page-stats; skips [data-signable=false], hidden and script content). |

## Structure

| Child | Description |
| --- | --- |
| `details` | Static mode: <details> with a <summary> trust bar (author as plain text, time[data-relative], .page-info-badge) and a .page-info-panel of sections. Keep links out of <summary>. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `page-info:verified` | `{ status: 'undeclared' \| 'declared' \| 'verified' \| 'failed' \| 'key-unavailable', tier: 0 \| 1 \| 3 \| -1 \| -2, reason?: string }` | Bubbles. Fired on every setup with the declared tier (undeclared/declared, no reason), then again with the verification result when the page carries meta[name=vb:signature]. reason: 'ok', 'mismatch', 'hash-mismatch' (vb:hash differs from the canonical document), 'key-origin' (key is not same-origin), 'key-expired', 'missing-author-key', 'unsupported-algorithm:…', 'canonicalize:…', 'verify:…', or the key fetch error. |

## Accessibility

- Pattern: Native details/summary
- The component manages: `aria-label`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open or close the page information panel | Native behaviour of summary |
