/**
 * Single parser for CHANGELOG.md, shared by scripts/build-feed.js (feed.json)
 * and the docs site's render-dynamic-pages plugin (/changelog/), so the feed
 * and the page can never disagree about what shipped.
 *
 * Grammar (Keep a Changelog):
 *   ## [Unreleased]
 *   ## [{version}] - {date}
 *   {summary paragraphs}
 *   ### Added | Changed | Changed (breaking) | Fixed | Removed | Internal
 *   - bullets
 */

/**
 * @typedef {{ heading: string, markdown: string }} ChangelogGroup
 * @typedef {{
 *   version: string,        // "0.4.1" or "Unreleased"
 *   rawDate: string,        // literal date text, "" for Unreleased
 *   date: string,           // ISO YYYY-MM-DD where parseable
 *   anchor: string,         // "v0-4-1" | "unreleased"
 *   summary: string,        // markdown before the first ### heading
 *   groups: ChangelogGroup[],
 *   bodyLines: string[],    // every line after the ## header
 * }} ChangelogRelease
 */

/** "0.4.1" → "v0-4-1"; the id the /changelog/ page and feed links share. */
export function versionAnchor(version) {
  if (/^unreleased$/i.test(version)) return 'unreleased';
  return `v${version.replace(/^v/, '').replace(/[^\w]+/g, '-')}`;
}

/** Normalize to ISO YYYY-MM-DD; year-only becomes YYYY-01-01. */
export function normalizeDate(raw) {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return raw;
}

/**
 * @param {string} md
 * @param {{ includeUnreleased?: boolean }} [opts] Unreleased is returned
 *   only when asked for and only when it has content.
 * @returns {ChangelogRelease[]}
 */
export function parseChangelog(md, { includeUnreleased = false } = {}) {
  /** @type {ChangelogRelease[]} */
  const releases = [];
  let current = null;

  for (const line of md.split('\n')) {
    const header = /^##\s+\[([^\]]+)\](?:\s*-\s*(.+?))?\s*$/.exec(line);
    if (header) {
      if (current) releases.push(current);
      current = { version: header[1].trim(), rawDate: (header[2] ?? '').trim(), bodyLines: [] };
      continue;
    }
    if (current) current.bodyLines.push(line);
  }
  if (current) releases.push(current);

  return releases
    .map((r) => {
      const summaryLines = [];
      /** @type {ChangelogGroup[]} */
      const groups = [];
      for (const line of r.bodyLines) {
        const sub = /^###\s+(.+?)\s*$/.exec(line);
        if (sub) {
          groups.push({ heading: sub[1], markdown: '' });
        } else if (groups.length) {
          groups[groups.length - 1].markdown += `${line}\n`;
        } else {
          summaryLines.push(line);
        }
      }
      return {
        ...r,
        date: normalizeDate(r.rawDate),
        anchor: versionAnchor(r.version),
        summary: summaryLines.join('\n').trim(),
        groups: groups.map((g) => ({ ...g, markdown: g.markdown.trim() })),
      };
    })
    .filter((r) => {
      if (r.anchor !== 'unreleased') return true;
      return includeUnreleased && (r.summary || r.groups.length);
    });
}

/** Map a ### heading to the timeline badge class + label it renders as. */
export function groupBadge(heading) {
  const h = heading.toLowerCase();
  if (h.includes('breaking')) return { cls: 'remove', label: 'breaking' };
  if (h.startsWith('added')) return { cls: 'new', label: 'added' };
  if (h.startsWith('fixed')) return { cls: 'fix', label: 'fixed' };
  if (h.startsWith('removed')) return { cls: 'remove', label: 'removed' };
  if (h.startsWith('changed')) return { cls: 'change', label: 'changed' };
  return null; // Internal, Security, etc. get no badge
}
