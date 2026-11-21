/**
 * Ambient core module.
 *
 * Resolves the ambient state (season, daypart, weather, occasion) for the
 * signals the author enabled on <html data-ambient="…">, writes it to state
 * attributes on <html>, and re-resolves at the next boundary. The pack's CSS
 * responds to the attributes; nothing else knows where a value came from.
 *
 *   import { Ambient } from '/cdn/packs/ambient.core.js'
 *   Ambient.state                          // frozen state object
 *   Ambient.enabled = false                // visitor opt-out, persisted
 *   Ambient.override({ season: 'winter' }) // preview; null clears
 *   Ambient.refresh()                      // re-resolve; refetch the feed if its cache expired
 *   document.addEventListener('ambient:change', (e) => e.detail.changed)
 *
 * The pure resolvers (resolveSeason, resolveDaypart, resolveOccasions,
 * expandCalendar, mapWeatherCode) are in ambient.resolve.js, for builds and
 * tests. This module fetches that file only when a page gives calendar
 * rules instead of the dated windows a build writes.
 *
 * Weather comes from one URL, config.feed (see AmbientFeed in
 * ambient.resolve.js). It is fetched once at idle, kept in sessionStorage
 * for its ttl, and dropped from the state when stale. The module knows
 * nothing about weather providers.
 */
import {
  SEASONS, DAYPARTS, WEATHERS, INTENSITIES, TWILIGHT,
  zonedParts, resolveSeason, resolveDaypart, sunTimes, activeOccasions, readFeed, feedFresh,
} from './ambient.resolve.js';
import { ambientEnabled, setAmbientEnabled, AMBIENT_PREF_EVENT } from '../../lib/ambient-pref.js';

/**
 * @typedef {object} AmbientState
 * @property {string | null} season
 * @property {string | null} daypart
 * @property {string | null} weather
 * @property {string | null} intensity
 * @property {string[]} occasions
 * @property {boolean} occasionDay
 * @property {string | null} occasionIcon motif icon named by the active occasions
 * @property {number | null} tempC
 * @property {string} asOf
 */

const ID = /^[a-z0-9][a-z0-9-]*$/;
const SIGNALS = ['season', 'daypart', 'weather', 'occasion'];
/** sessionStorage: the last feed, as readFeed() returned it, plus `at`, the time it was fetched. */
const FEED_KEY = 'vb-ambient-feed';
const FEED_TIMEOUT = 3000;

/** @type {AmbientState} */
let state = Object.freeze({
  season: null, daypart: null, weather: null, intensity: null, occasions: [], occasionDay: false, occasionIcon: null, tempC: null, asOf: '',
});
/** @type {Partial<AmbientState> | null} */
let override = null;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let timer;
/** Windows expanded from config.calendar, keyed by the year they were expanded for. */
let expanded = { year: 0, windows: /** @type {import('./ambient.resolve.js').OccasionWindow[] | null} */ (null) };
let expanding = false;
let started = false;
/** @type {(NonNullable<ReturnType<typeof readFeed>> & { at: number }) | null | undefined} undefined until the cache is read */
let feed;
/** A fetch is under way, or one failed: no retry within the page view. */
let feedBusy = false;

const root = () => document.documentElement;

/** The signals the author enabled; empty when the feature is off. */
function signals() {
  const words = (root().getAttribute('data-ambient') || '').split(/\s+/).filter(Boolean);
  return words.includes('off') ? [] : words.filter((w) => SIGNALS.includes(w));
}

function readConfig() {
  try {
    return JSON.parse(document.getElementById('ambient-config')?.textContent || '{}') || {};
  } catch {
    return {};
  }
}

/** The feed from this page view or the session cache. */
function cachedFeed() {
  if (feed === undefined) {
    feed = null;
    try {
      const raw = JSON.parse(sessionStorage.getItem(FEED_KEY) || 'null');
      const read = readFeed(raw && { ...raw, v: 1 });
      if (read && raw.at > 0) feed = { ...read, at: raw.at };
    } catch { /* storage blocked or not JSON: no cache */ }
  }
  return feed;
}

/** When the cached feed should be fetched again: its ttl after it was fetched. */
const feedExpiry = () => (feed ? feed.at + feed.ttl * 1000 : 0);

/**
 * Fetch the feed when the page asks for one, a signal uses it and the cache
 * has expired. One request, at idle and low priority, given up after 3 s.
 * @param {{ feed?: string }} config
 * @param {string[]} on enabled signals
 */
function loadFeed(config, on) {
  if (feedBusy || !config.feed || typeof config.feed !== 'string' || document.hidden) return;
  if (!on.includes('weather') && !on.includes('daypart')) return;
  cachedFeed();
  if (Date.now() < feedExpiry()) return;
  // Data saving: no request.
  if (/** @type {any} */ (navigator).connection?.saveData || matchMedia('(prefers-reduced-data: reduce)').matches) return;
  feedBusy = true;
  const url = config.feed;
  const run = async () => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FEED_TIMEOUT), /** @type {any} */ priority: 'low' });
      const read = res.ok ? readFeed(await res.json()) : null;
      if (!read) return;
      feed = { ...read, at: Date.now() };
      feedBusy = false;
      try { sessionStorage.setItem(FEED_KEY, JSON.stringify(feed)); } catch { /* storage blocked */ }
      apply();
    } catch { /* missing, slow or malformed: no weather, and no retry */ }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 1);
}

/** A value from a closed vocabulary, or null. */
const known = (value, list) => (list.includes(value) ? value : null);

/**
 * @param {Date} now
 * @returns {AmbientState}
 */
function compute(now) {
  const config = readConfig();
  const on = ambientEnabled() ? signals() : [];
  const pin = { ...config.pin, ...override };
  loadFeed(config, on);
  // Stale weather is never shown: past asOf + 2 × ttl the feed counts for nothing.
  const fresh = config.feed && on.length && feedFresh(cachedFeed(), now.getTime()) ? feed : null;
  /** @type {AmbientState} */
  const next = {
    season: null, daypart: null, weather: null, intensity: null, occasions: [], occasionDay: false, occasionIcon: null, tempC: null,
    asOf: now.toISOString(),
  };

  try {
    if (on.includes('season')) {
      const season = pin.season ?? resolveSeason(now, config);
      next.season = config.seasons ? (ID.test(String(season)) ? season : null) : known(season, SEASONS);
    }
    if (on.includes('daypart')) next.daypart = known(pin.daypart ?? resolveDaypart(now, config, fresh), DAYPARTS);
    if (on.includes('weather')) {
      // A pin or a preview replaces the feed's weather, intensity included.
      const source = pin.weather ? pin : fresh;
      next.weather = known(source?.weather, WEATHERS);
      next.intensity = next.weather ? known(source?.intensity, INTENSITIES) : null;
      next.tempC = pin.tempC ?? fresh?.tempC ?? null;
    }
    if (on.includes('occasion')) {
      if (Array.isArray(pin.occasions)) {
        next.occasions = pin.occasions.filter((id) => ID.test(String(id))).slice(0, 2);
        next.occasionDay = !!pin.occasionDay;
        next.occasionIcon = pin.occasionIcon && ID.test(pin.occasionIcon) ? pin.occasionIcon : null;
      } else {
        const { y, ymd } = zonedParts(now, config.tz);
        const active = activeOccasions(config.occasions || calendarWindows(config, y), ymd);
        next.occasions = active.ids.filter((id) => ID.test(String(id)));
        next.occasionDay = active.day;
        next.occasionIcon = active.icon && ID.test(active.icon) ? active.icon : null;
      }
    }
  } catch { /* a bad time zone or config resolves to no state: the plain theme */ }

  return next;
}

/**
 * Dated windows for a config that carries rules. The rule parser is in the
 * resolver file, fetched once; until it arrives there are no occasions, and
 * the state is applied again when it does.
 * @param {{ calendars?: string[], calendar?: object[] }} config
 * @param {number} year
 */
function calendarWindows(config, year) {
  if (expanded.year === year) return expanded.windows;
  if (!expanding) {
    expanding = true;
    // A computed specifier, so the bundler leaves it as a runtime import of
    // the sibling file rather than inlining the parser here.
    const url = new URL('./ambient.resolve.js', import.meta.url).href;
    import(url).then((m) => {
      expanded = { year, windows: m.expandCalendar(m.calendarFor(config), [year - 1, year, year + 1]) };
      expanding = false;
      apply();
    }).catch(() => { /* no rule parser: occasions stay off */ });
  }
  return null;
}

/** @param {AmbientState} s */
function reflect(s) {
  const el = root();
  const set = (name, value) => (value ? el.setAttribute(`data-${name}`, value === true ? '' : value) : el.removeAttribute(`data-${name}`));
  set('season', s.season);
  set('daypart', s.daypart);
  set('weather', s.weather);
  set('weather-intensity', s.intensity);
  set('occasion', s.occasions.join(' '));
  set('occasion-day', s.occasionDay);
  set('occasion-icon', s.occasionIcon);
}

/** Wake once at the next daypart boundary or midnight in the place, or when the feed expires or goes stale. */
function schedule(now) {
  clearTimeout(timer);
  if (!signals().length || !ambientEnabled()) return;
  try {
    const config = readConfig();
    const { min } = zonedParts(now, config.tz);
    const t = now.getTime();
    const live = config.feed && feed ? feed : null;
    const [rise, set] = sunTimes(now, config, feedFresh(live, t) ? live : null);
    const next = [rise - TWILIGHT, rise + TWILIGHT, set - TWILIGHT, set + TWILIGHT, 1440].find((b) => b > min) ?? 1440;
    const feedTimes = live ? [feedExpiry(), Date.parse(live.asOf) + live.ttl * 2000].filter((ms) => ms > t).map((ms) => ms - t) : [];
    timer = setTimeout(apply, Math.min((next - min) * 60000 - now.getSeconds() * 1000, ...feedTimes) + 1000);
  } catch { /* no schedule; visibilitychange still re-resolves */ }
}

function syncToggles() {
  const on = ambientEnabled();
  for (const el of document.querySelectorAll('[data-ambient-toggle]')) {
    if (el instanceof HTMLInputElement) el.checked = on;
    else el.setAttribute('aria-pressed', String(on));
  }
}

function apply() {
  const now = new Date();
  const next = compute(now);
  const changed = ['season', 'daypart', 'weather', 'intensity', 'occasionDay', 'occasionIcon', 'tempC'].filter((k) => next[k] !== state[k]);
  if (next.occasions.join(' ') !== state.occasions.join(' ')) changed.push('occasions');
  Object.freeze(next.occasions);
  state = Object.freeze(next);
  reflect(state);
  schedule(now);
  if (changed.length) {
    document.dispatchEvent(new CustomEvent('ambient:change', { detail: { state, changed } }));
  }
}

/** ?ambient=winter,night,snow,halloween — only on localhost or with data-ambient-debug. */
function previewFromQuery() {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!local && !root().hasAttribute('data-ambient-debug')) return;
  const raw = new URLSearchParams(location.search).get('ambient');
  if (!raw) return;
  /** @type {Partial<AmbientState>} */
  const preview = {};
  const occasions = [];
  for (const word of raw.split(',').map((w) => w.trim()).filter(Boolean)) {
    if (SEASONS.includes(word)) preview.season = word;
    else if (DAYPARTS.includes(word)) preview.daypart = word;
    else if (WEATHERS.includes(word)) preview.weather = word;
    else if (INTENSITIES.includes(word)) preview.intensity = word;
    else if (ID.test(word)) occasions.push(word);
  }
  if (occasions.length) {
    preview.occasions = occasions;
    preview.occasionDay = true;
  }
  override = preview;
}

function start() {
  if (started || typeof document === 'undefined') return;
  started = true;
  previewFromQuery();
  apply();
  syncToggles();

  document.addEventListener(AMBIENT_PREF_EVENT, () => {
    apply();
    syncToggles();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) apply();
  });
  // <button data-ambient-toggle> and <input type="checkbox" data-ambient-toggle>
  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-ambient-toggle]') : null;
    if (el && !(el instanceof HTMLInputElement)) setAmbientEnabled(!ambientEnabled());
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.hasAttribute('data-ambient-toggle')) setAmbientEnabled(el.checked);
  });
}

export const Ambient = {
  /** @returns {AmbientState} the frozen current state */
  get state() {
    return state;
  },

  /** Visitor preference: false stores the opt-out and removes every state attribute. */
  get enabled() {
    return ambientEnabled();
  },
  set enabled(value) {
    setAmbientEnabled(!!value);
  },

  /**
   * Preview a state. Given signals replace the resolved ones; null clears.
   * @param {Partial<AmbientState> | null} partial
   */
  override(partial) {
    override = partial ? { ...partial } : null;
    apply();
  },

  /** Re-resolve from the clock and the config now; refetch the feed if its cache expired. */
  refresh() {
    apply();
  },
};

start();
