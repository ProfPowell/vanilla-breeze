/**
 * Ambient resolvers: pure functions, no DOM.
 *
 * They turn a Date, a config and (later) a weather feed into ambient state.
 * The browser module, the inline head script and a site's build all import
 * from here, so a page baked at build time and a page resolved in the
 * browser agree.
 *
 * All date maths runs in the place's IANA time zone through
 * Intl.DateTimeFormat; without `tz` the runtime's own zone is used.
 */

/**
 * @typedef {object} AmbientConfig
 * @property {string} [tz] IANA time zone of the place
 * @property {'north' | 'south'} [hemisphere]
 * @property {Record<string, string>} [seasons] custom month (1-12) to label map
 */

/**
 * @typedef {object} OccasionWindow
 * @property {string} id
 * @property {string} from first active day (start minus lead), YYYY-MM-DD
 * @property {string} to last active day (end plus trail)
 * @property {string} start first day of the occasion itself
 * @property {string} end last day of the occasion itself
 * @property {number} [p] priority
 * @property {string} [icon]
 * @property {string} [effect]
 */

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
export const DAYPARTS = ['dawn', 'day', 'dusk', 'night'];
export const WEATHERS = ['clear', 'cloudy', 'fog', 'rain', 'snow', 'storm', 'wind'];
export const INTENSITIES = ['light', 'heavy'];

/** Minutes either side of sunrise and sunset that count as dawn and dusk. */
export const TWILIGHT = 45;

/** Sunrise and sunset, in minutes after midnight, used when no feed gives them. In SEASONS order. */
const SUN = [[420, 1020], [375, 1155], [345, 1200], [405, 1080]];

const pad = (n) => (n < 10 ? '0' : '') + n;

/**
 * The calendar date and clock time of an instant in a time zone.
 * @param {Date} date
 * @param {string} [tz]
 * @returns {{ y: number, m: number, min: number, ymd: string }}
 */
export function zonedParts(date, tz) {
  /** @type {Record<string, number>} */
  const p = {};
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: tz || undefined, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(date);
  for (const { type, value } of parts) p[type] = +value;
  return { y: p.year, m: p.month, min: p.hour * 60 + p.minute, ymd: p.year + '-' + pad(p.month) + '-' + pad(p.day) };
}

/**
 * Meteorological season of the month, by hemisphere, as an index into SEASONS.
 * @param {Date} date
 * @param {AmbientConfig} config
 * @returns {number}
 */
function fourSeason(date, config) {
  const i = Math.floor((zonedParts(date, config.tz).m % 12) / 3);
  return config.hemisphere === 'south' ? (i + 2) % 4 : i;
}

/**
 * @param {Date} date
 * @param {AmbientConfig} [config]
 * @returns {string | null} a season, a custom label, or null when the custom map has no entry
 */
export function resolveSeason(date, config = {}) {
  return config.seasons ? config.seasons[zonedParts(date, config.tz).m] || null : SEASONS[fourSeason(date, config)];
}

const minutes = (hm) => {
  const [h, m] = String(hm).split(':');
  return +h * 60 + +m;
};

/**
 * Sunrise and sunset in minutes after midnight: from the feed when it has
 * them, otherwise a fixed pair per season.
 * @param {Date} date
 * @param {AmbientConfig} [config]
 * @param {{ sunrise?: string, sunset?: string } | null} [sun]
 * @returns {number[]}
 */
export function sunTimes(date, config = {}, sun) {
  return sun && sun.sunrise && sun.sunset ? [minutes(sun.sunrise), minutes(sun.sunset)] : SUN[fourSeason(date, config)];
}

/**
 * @param {Date} date
 * @param {AmbientConfig} [config]
 * @param {{ sunrise?: string, sunset?: string } | null} [sun]
 * @returns {string}
 */
export function resolveDaypart(date, config = {}, sun) {
  const { min } = zonedParts(date, config.tz);
  const [rise, set] = sunTimes(date, config, sun);
  if (min >= rise - TWILIGHT && min < rise + TWILIGHT) return 'dawn';
  if (min >= set - TWILIGHT && min < set + TWILIGHT) return 'dusk';
  return min > rise && min < set ? 'day' : 'night';
}

/**
 * The occasions active on a day, from windows already expanded to dates.
 * Highest priority first, then nearest to its own day; at most two. The
 * icon is the first one those occasions name; the effect is the first one
 * named by an occasion that is on its own day, not in its lead or trail.
 * @param {OccasionWindow[] | null | undefined} windows
 * @param {string} ymd today in the place, YYYY-MM-DD
 * @returns {{ ids: string[], day: boolean, icon?: string, effect?: string }}
 */
export function activeOccasions(windows, ymd) {
  const t = Date.parse(ymd);
  const far = (w) => (ymd < w.start ? Date.parse(w.start) - t : ymd > w.end ? t - Date.parse(w.end) : 0);
  const on = (windows || [])
    .filter((w) => w.from <= ymd && ymd <= w.to)
    .sort((a, b) => (b.p || 0) - (a.p || 0) || far(a) - far(b))
    .slice(0, 2);
  const result = { ids: on.map((w) => w.id), day: on.some((w) => !far(w)), icon: (on.find((w) => w.icon) || {}).icon };
  const effect = (on.find((w) => w.effect && !far(w)) || {}).effect;
  return effect ? { ...result, effect } : result;
}

/* ---------- calendar rules (build and module only; not in the head script) ---------- */

export { CALENDARS, calendarFor } from './ambient.calendars.js';

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY = 86400000;

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

/** A real calendar date as UTC milliseconds, or null (for example 29 February in a common year). */
function utc(y, m, d) {
  const ms = Date.UTC(y, m - 1, d);
  const back = new Date(ms);
  return back.getUTCMonth() === m - 1 && back.getUTCDate() === d ? ms : null;
}

/**
 * The first and last day of a rule in one year, as UTC milliseconds.
 * @param {string} rule
 * @param {number} year
 * @returns {number[][]} zero or one [start, end] pair
 */
function ruleSpan(rule, year) {
  let m;
  if ((m = /^(\d{1,2})-(\d{1,2})$/.exec(rule))) {
    const day = utc(year, +m[1], +m[2]);
    return day === null ? [] : [[day, day]];
  }
  if ((m = /^(\d{1,2})-(\d{1,2})\.\.(\d{1,2})-(\d{1,2})$/.exec(rule))) {
    const start = utc(year, +m[1], +m[2]);
    const wraps = +m[3] < +m[1] || (+m[3] === +m[1] && +m[4] < +m[2]);
    const end = utc(year + (wraps ? 1 : 0), +m[3], +m[4]);
    return start === null || end === null ? [] : [[start, end]];
  }
  if ((m = /^(\d{1,2}):(-?\d):([a-z]{3})$/.exec(rule))) {
    const month = +m[1];
    const nth = +m[2];
    const dow = DOW.indexOf(m[3]);
    if (dow < 0 || !nth || month < 1 || month > 12) return [];
    let day;
    if (nth > 0) {
      const first = Date.UTC(year, month - 1, 1);
      day = first + (((dow - new Date(first).getUTCDay() + 7) % 7) + (nth - 1) * 7) * DAY;
    } else {
      const last = Date.UTC(year, month, 0);
      day = last - (((new Date(last).getUTCDay() - dow + 7) % 7) + (-nth - 1) * 7) * DAY;
    }
    return new Date(day).getUTCMonth() === month - 1 ? [[day, day]] : [];
  }
  if ((m = /^doy:(\d{1,3})$/.exec(rule))) {
    const day = Date.UTC(year, 0, +m[1]);
    return +m[1] >= 1 && new Date(day).getUTCFullYear() === year ? [[day, day]] : [];
  }
  return [];
}

/**
 * Expand calendar entries into dated windows for the given years. A build
 * does this once and ships the result, so the browser compares date strings
 * and needs no rule parser.
 *
 * Rule forms: "10-31" (fixed), "12-24..01-01" (inclusive range, may wrap
 * the year), "11:4:thu" (fourth Thursday of November; "5:-1:mon" is the last
 * Monday of May), "doy:256" (day of year), { dates: ["2026-02-17"] }.
 *
 * @param {Array<{ id: string, rule: string | { dates: string[] }, lead?: number, trail?: number, priority?: number, icon?: string, effect?: string }>} calendar
 * @param {number[]} years
 * @returns {OccasionWindow[]}
 */
export function expandCalendar(calendar, years) {
  /** @type {OccasionWindow[]} */
  const out = [];
  for (const entry of calendar || []) {
    if (!entry || !/^[a-z0-9][a-z0-9-]*$/.test(String(entry.id))) continue;
    /** @type {number[][]} */
    let spans = [];
    if (typeof entry.rule === 'string') {
      for (const year of years) spans.push(...ruleSpan(entry.rule, year));
    } else if (entry.rule && Array.isArray(entry.rule.dates)) {
      spans = entry.rule.dates
        .map((d) => Date.parse(`${d}T00:00:00Z`))
        .filter((ms) => !Number.isNaN(ms) && years.includes(new Date(ms).getUTCFullYear()))
        .map((ms) => [ms, ms]);
    }
    for (const [start, end] of spans) {
      /** @type {OccasionWindow} */
      const w = {
        id: entry.id,
        from: iso(start - (entry.lead || 0) * DAY),
        to: iso(end + (entry.trail || 0) * DAY),
        start: iso(start),
        end: iso(end),
      };
      if (entry.priority) w.p = entry.priority;
      if (entry.icon) w.icon = entry.icon;
      if (entry.effect) w.effect = entry.effect;
      out.push(w);
    }
  }
  return out;
}

/**
 * @param {Date} date
 * @param {Parameters<typeof expandCalendar>[0]} calendar
 * @param {AmbientConfig} [config]
 * @returns {{ ids: string[], day: boolean, icon?: string, effect?: string }}
 */
export function resolveOccasions(date, calendar, config = {}) {
  const { y, ymd } = zonedParts(date, config.tz);
  return activeOccasions(expandCalendar(calendar, [y - 1, y, y + 1]), ymd);
}

/**
 * Map a WMO weather interpretation code to the pack's closed vocabulary.
 * @param {number} code
 * @param {number} [windKmh]
 * @returns {{ weather: string, intensity?: string } | null} null for an unknown code
 */
export function mapWeatherCode(code, windKmh = 0) {
  const c = Number(code);
  if (!Number.isInteger(c)) return null;
  if (c >= 0 && c <= 3) {
    if (windKmh >= 40) return { weather: 'wind' };
    return { weather: c <= 1 ? 'clear' : 'cloudy' };
  }
  if (c === 45 || c === 48) return { weather: 'fog' };
  if (c >= 51 && c <= 57) return { weather: 'rain', intensity: 'light' };
  if ([61, 63, 66, 80, 81].includes(c)) return { weather: 'rain' };
  if ([65, 67, 82].includes(c)) return { weather: 'rain', intensity: 'heavy' };
  if ([71, 73, 77, 85].includes(c)) return { weather: 'snow' };
  if (c === 75 || c === 86) return { weather: 'snow', intensity: 'heavy' };
  if (c >= 95 && c <= 99) return { weather: 'storm' };
  return null;
}

/**
 * @typedef {object} AmbientFeed the feed a page reads, default /ambient.json
 * @property {1} v
 * @property {string} asOf ISO time of the observation
 * @property {number} ttl seconds the observation is good for
 * @property {string | null} [weather]
 * @property {string | null} [intensity]
 * @property {number | null} [tempC]
 * @property {string} [sunrise] HH:MM in the place
 * @property {string} [sunset] HH:MM in the place
 * @property {string} [attribution]
 */

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * A feed reduced to what the pack trusts: known values only. Null for
 * anything that is not a version 1 feed with a readable time.
 * @param {unknown} feed
 * @returns {{ asOf: string, ttl: number, weather: string | null, intensity: string | null, tempC: number | null, sunrise?: string, sunset?: string } | null}
 */
export function readFeed(feed) {
  const f = /** @type {any} */ (feed);
  if (!f || f.v !== 1 || !Number.isFinite(Date.parse(f.asOf))) return null;
  const weather = WEATHERS.includes(f.weather) ? f.weather : null;
  const out = {
    asOf: String(f.asOf),
    ttl: f.ttl > 0 ? Math.max(60, +f.ttl) : 1800,
    weather,
    intensity: weather && INTENSITIES.includes(f.intensity) ? f.intensity : null,
    tempC: typeof f.tempC === 'number' && Number.isFinite(f.tempC) ? f.tempC : null,
  };
  return CLOCK.test(f.sunrise) && CLOCK.test(f.sunset) ? { ...out, sunrise: f.sunrise, sunset: f.sunset } : out;
}

/**
 * Whether a feed's observation may still be shown: until asOf + 2 × ttl.
 * @param {{ asOf: string, ttl: number } | null | undefined} feed
 * @param {number} nowMs
 * @returns {boolean}
 */
export const feedFresh = (feed, nowMs) => !!feed && nowMs <= Date.parse(feed.asOf) + feed.ttl * 2000;

/**
 * For a feed producer (a Worker or a build): the Open-Meteo request for a
 * place. Coordinates stay with the producer; they are never sent to a page.
 * @param {{ lat: number, lon: number }} place two decimals are enough
 * @returns {string}
 */
export function openMeteoUrl({ lat, lon }) {
  const q = new URLSearchParams({
    latitude: Number(lat).toFixed(2),
    longitude: Number(lon).toFixed(2),
    current: 'temperature_2m,weather_code,precipitation,wind_speed_10m',
    daily: 'sunrise,sunset',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

/**
 * For a feed producer: an Open-Meteo forecast response as a feed. Assumes
 * the default units (°C, km/h) and `timezone=auto`. Null when the response
 * has no current time; an unknown weather code gives a feed without weather.
 * @param {any} data
 * @param {{ ttl?: number, attribution?: string }} [options]
 * @returns {AmbientFeed | null}
 */
export function feedFromOpenMeteo(data, { ttl = 1800, attribution = 'Weather data by Open-Meteo.com' } = {}) {
  const current = data && data.current;
  if (!current || !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(current.time)) return null;
  const offset = Number(data.utc_offset_seconds) || 0;
  const abs = Math.abs(offset);
  const zone = `${offset < 0 ? '-' : '+'}${pad(Math.floor(abs / 3600))}:${pad(Math.floor((abs % 3600) / 60))}`;
  /** @type {AmbientFeed} */
  const feed = { v: 1, asOf: `${current.time}:00${zone}`, ttl };
  const mapped = mapWeatherCode(current.weather_code, Number(current.wind_speed_10m) || 0);
  if (mapped) {
    feed.weather = mapped.weather;
    if (mapped.intensity) feed.intensity = mapped.intensity;
  }
  if (typeof current.temperature_2m === 'number' && Number.isFinite(current.temperature_2m)) feed.tempC = Math.round(current.temperature_2m * 10) / 10;
  const clock = (value) => (typeof value === 'string' && CLOCK.test(value.slice(11, 16)) ? value.slice(11, 16) : '');
  const sunrise = clock(data.daily?.sunrise?.[0]);
  const sunset = clock(data.daily?.sunset?.[0]);
  if (sunrise && sunset) Object.assign(feed, { sunrise, sunset });
  feed.attribution = attribution;
  return feed;
}
