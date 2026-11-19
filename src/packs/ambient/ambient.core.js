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
 *   Ambient.refresh()                      // re-resolve now
 *   document.addEventListener('ambient:change', (e) => e.detail.changed)
 *
 * The pure resolvers (resolveSeason, resolveDaypart, resolveOccasions,
 * expandCalendar, mapWeatherCode) are in ambient.resolve.js, for builds and
 * tests. This module fetches that file only when a page gives calendar
 * rules instead of the dated windows a build writes.
 */
import {
  SEASONS, DAYPARTS, WEATHERS, INTENSITIES, TWILIGHT,
  zonedParts, resolveSeason, resolveDaypart, sunTimes, activeOccasions,
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
    if (on.includes('daypart')) next.daypart = known(pin.daypart ?? resolveDaypart(now, config), DAYPARTS);
    if (on.includes('weather')) {
      // The feed arrives in a later phase; until then weather comes only
      // from a pin or a preview override.
      next.weather = known(pin.weather, WEATHERS);
      next.intensity = next.weather ? known(pin.intensity, INTENSITIES) : null;
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

/** Wake once at the next daypart boundary or midnight in the place. */
function schedule(now) {
  clearTimeout(timer);
  if (!signals().length || !ambientEnabled()) return;
  try {
    const config = readConfig();
    const { min } = zonedParts(now, config.tz);
    const [rise, set] = sunTimes(now, config);
    const next = [rise - TWILIGHT, rise + TWILIGHT, set - TWILIGHT, set + TWILIGHT, 1440].find((b) => b > min) ?? 1440;
    timer = setTimeout(apply, (next - min) * 60000 - now.getSeconds() * 1000 + 1000);
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

  /** Re-resolve from the clock and the config now. */
  refresh() {
    apply();
  },
};

start();
