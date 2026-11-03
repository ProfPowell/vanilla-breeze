/**
 * time-grid — shared parsing + layout helpers for <day-view> and <week-view>.
 *
 * Pure functions (no DOM writes) so both views read times and durations
 * the same way and the formats documented on <calendar-event> hold for
 * both.
 */

/**
 * Read the wall-clock time out of a `datetime` value. Accepts "HH:MM",
 * "H:MM", "HH:MM:SS" and full ISO datetimes ("2026-04-10T09:30",
 * "2026-04-10T09:30:00Z", "2026-04-10T09:30+02:00"). The time is taken as
 * written: offsets/`Z` are not converted to local time. Hours clamp to
 * 0–23, minutes to 0–59. A date-only value ("2026-04-10") has no time and
 * returns null.
 *
 * @param {string | null | undefined} value
 * @returns {{ hour: number, minute: number } | null}
 */
export function parseTime(value) {
  if (!value) return null;
  const m = /(?:^|T|\s)(\d{1,2}):(\d{2})/.exec(String(value).trim());
  if (!m) return null;
  const hour = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const minute = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { hour, minute };
}

/** Default length (minutes) when data-duration is present but unparseable. */
export const DEFAULT_DURATION_MINUTES = 60;

const NUM = '(\\d+(?:\\.\\d+)?)';
const ISO_RE = new RegExp(`^PT(?:${NUM}H)?(?:${NUM}M)?(?:${NUM}S)?$`, 'i');
const HM_RE = new RegExp(`^(?:${NUM}\\s*h(?:ours?|rs?)?)?\\s*(?:${NUM}\\s*m(?:in(?:utes?|s)?)?)?$`, 'i');
const BARE_RE = new RegExp(`^${NUM}$`);

/**
 * Parse an event duration to whole minutes. Accepted forms:
 *   - hours / minutes: "2h", "1.5h", "45m", "90m", "1h30m", "1h 30m", "90min"
 *   - bare number = minutes: "60"
 *   - ISO-8601 duration: "PT1H30M", "PT45M", "PT1.5H"
 * Returns null for empty, zero, negative or unrecognised values; callers
 * fall back to DEFAULT_DURATION_MINUTES.
 *
 * @param {string | number | null | undefined} value
 * @returns {number | null}
 */
export function parseDuration(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;

  let minutes = null;
  let m;
  if ((m = BARE_RE.exec(s))) {
    minutes = parseFloat(m[1]);
  } else if ((m = ISO_RE.exec(s)) && (m[1] || m[2] || m[3])) {
    minutes = (m[1] ? parseFloat(m[1]) * 60 : 0)
            + (m[2] ? parseFloat(m[2]) : 0)
            + (m[3] ? parseFloat(m[3]) / 60 : 0);
  } else if ((m = HM_RE.exec(s)) && (m[1] || m[2])) {
    minutes = (m[1] ? parseFloat(m[1]) * 60 : 0)
            + (m[2] ? parseFloat(m[2]) : 0);
  }

  if (minutes === null || !Number.isFinite(minutes)) return null;
  minutes = Math.round(minutes);
  return minutes > 0 ? minutes : null;
}

/**
 * Lay out overlapping intervals in side-by-side columns. Intervals that
 * overlap (transitively) form a cluster; each interval gets the first free
 * column in its cluster and every member reports the cluster's column
 * count.
 *
 * @template {{ start: number, end: number }} T
 * @param {T[]} items
 * @returns {Array<T & { column: number, columns: number }>}
 */
export function layoutColumns(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  /** @type {Array<T & { column: number, columns: number }>} */
  const out = [];
  /** @type {Array<T & { column: number, columns: number }>} */
  let cluster = [];
  /** @type {number[]} */
  let colEnds = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const c of cluster) c.columns = colEnds.length;
    cluster = [];
    colEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    let column = colEnds.findIndex((end) => end <= item.start);
    if (column === -1) { column = colEnds.length; colEnds.push(item.end); }
    else colEnds[column] = item.end;
    const placed = { ...item, column, columns: 1 };
    cluster.push(placed);
    out.push(placed);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return out;
}

/**
 * Accessible name for a calendar-event: its visible text without nested
 * <details> bodies and the visually-hidden PT… duration, whitespace
 * collapsed.
 *
 * @param {Element} el
 * @returns {string}
 */
export function eventLabel(el) {
  const clone = /** @type {Element} */ (el.cloneNode(true));
  clone.querySelectorAll('details, time[datetime^="PT"]').forEach((n) => n.remove());
  return (clone.textContent || '').replace(/\s+/g, ' ').trim();
}

/** Inline style properties the views write on spanning events. */
export const SPAN_STYLE_PROPS = ['position', 'top', 'height', 'inset-inline-start', 'inset-inline-end'];
