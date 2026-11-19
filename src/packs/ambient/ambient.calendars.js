/**
 * Ambient built-in calendars. All are opt-in by name through
 * config.calendars; only `markers` is on when a page names none.
 *
 * Entries follow the calendar rule forms in ambient.resolve.js. Religious
 * and cultural observances are not here: a site adds its own entries.
 *
 * Solstice and equinox dates move by a day between years; these are the
 * usual dates, not astronomical calculations.
 */

/** @typedef {{ id: string, rule: string | { dates: string[] }, lead?: number, trail?: number, priority?: number, icon?: string, effect?: string }} CalendarEntry */

/** @type {Record<string, CalendarEntry[]>} */
export const CALENDARS = {
  markers: [
    { id: 'new-year', rule: '01-01', lead: 1, priority: 20, icon: 'sparkles' },
    { id: 'march-equinox', rule: '03-20', priority: 10, icon: 'star' },
    { id: 'june-solstice', rule: '06-21', priority: 10, icon: 'sun' },
    { id: 'september-equinox', rule: '09-22', priority: 10, icon: 'star' },
    { id: 'december-solstice', rule: '12-21', priority: 10, icon: 'sun' },
    { id: 'leap-day', rule: '02-29', priority: 20, icon: 'sparkles' },
  ],

  geek: [
    { id: 'web-birthday', rule: '03-12', priority: 30, icon: 'cake' },
    { id: 'pi-day', rule: '03-14', priority: 30, icon: 'pi' },
    { id: 'css-naked-day', rule: '04-09', priority: 30 },
    { id: 'may-the-4th', rule: '05-04', priority: 30, icon: 'star' },
    { id: 'towel-day', rule: '05-25', priority: 30 },
    { id: 'programmers-day', rule: 'doy:256', priority: 30 },
    { id: 'ada-lovelace-day', rule: '10:2:tue', priority: 30, icon: 'star' },
  ],

  // US federal holidays by their statutory names, plus Valentine's Day and Halloween.
  'civic-us': [
    { id: 'new-year', rule: '01-01', lead: 1, priority: 40, icon: 'sparkles' },
    { id: 'mlk-day', rule: '1:3:mon', priority: 40, icon: 'flag' },
    { id: 'valentines-day', rule: '02-14', lead: 1, priority: 40, icon: 'heart' },
    { id: 'presidents-day', rule: '2:3:mon', priority: 40, icon: 'flag' },
    { id: 'memorial-day', rule: '5:-1:mon', priority: 40, icon: 'flag' },
    { id: 'juneteenth', rule: '06-19', priority: 40, icon: 'flag' },
    { id: 'independence-day', rule: '07-04', lead: 1, priority: 40, icon: 'sparkles' },
    { id: 'labor-day', rule: '9:1:mon', priority: 40, icon: 'flag' },
    { id: 'columbus-day', rule: '10:2:mon', priority: 40, icon: 'flag' },
    { id: 'halloween', rule: '10-31', lead: 7, priority: 50, icon: 'ghost' },
    { id: 'veterans-day', rule: '11-11', priority: 40, icon: 'flag' },
    { id: 'thanksgiving', rule: '11:4:thu', lead: 3, priority: 40, icon: 'leaf' },
    { id: 'christmas-day', rule: '12-25', lead: 7, priority: 40, icon: 'gift' },
  ],
};

/**
 * The calendar a config asks for: the named built-in sets (default
 * `markers`) followed by the site's own entries. A later entry replaces an
 * earlier one with the same id.
 * @param {{ calendars?: string[], calendar?: CalendarEntry[] }} [config]
 * @returns {CalendarEntry[]}
 */
export function calendarFor(config = {}) {
  const names = Array.isArray(config.calendars) ? config.calendars : ['markers'];
  /** @type {Map<string, CalendarEntry>} */
  const byId = new Map();
  for (const name of names) {
    for (const entry of Object.hasOwn(CALENDARS, name) ? CALENDARS[name] : []) byId.set(entry.id, entry);
  }
  for (const entry of Array.isArray(config.calendar) ? config.calendar : []) {
    if (entry && entry.id) byId.set(entry.id, entry);
  }
  return [...byId.values()];
}
