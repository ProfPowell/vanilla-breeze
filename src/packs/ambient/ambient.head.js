/**
 * Ambient head script: the source of the inline snippet.
 *
 * Built to dist/cdn/packs/ambient.head.js as a classic script. A site
 * inlines it in <head>, after #ambient-config and before the stylesheets, so
 * season, daypart and occasion are right before first paint, and so is the
 * weather when the module cached a feed earlier in the session. It never
 * throws, never waits on the network and never touches layout.
 *
 * Budget: 1.25 KB gzipped (scripts/bundle-budget.config.json).
 */
import { zonedParts, resolveSeason, resolveDaypart, activeOccasions } from './ambient.resolve.js';

try {
  const root = document.documentElement;
  const signals = (root.getAttribute('data-ambient') || '').split(/\s+/);
  if (signals[0] && !signals.includes('off')) {
    let out;
    try { out = localStorage.getItem('vb-ambient') === 'off'; } catch { /* storage blocked */ }
    const set = (name, value) => (value ? root.setAttribute('data-' + name, value === true ? '' : value) : root.removeAttribute('data-' + name));
    const has = (signal) => !out && signals.includes(signal);
    const config = JSON.parse((document.getElementById('ambient-config') || {}).textContent || '{}');
    const pin = config.pin || {};
    const now = new Date();
    // The feed the module cached (validated there), while it is not stale.
    let feed;
    try {
      feed = config.feed && JSON.parse(sessionStorage.getItem('vb-ambient-feed') || '0');
      if (!(+now <= Date.parse(feed.asOf) + feed.ttl * 2000)) feed = 0;
    } catch { feed = 0; }
    const sky = pin.weather ? pin : feed || {};
    const word = (value) => /^[a-z]+$/.test(value) && value;

    set('season', has('season') && (pin.season || resolveSeason(now, config)));
    set('daypart', has('daypart') && (pin.daypart || resolveDaypart(now, config, feed)));
    set('weather', has('weather') && word(sky.weather));
    set('weather-intensity', has('weather') && word(sky.weather) && word(sky.intensity));

    // Occasions need the dated windows a build writes. With only rules in the
    // config, the baked attributes stand until the module expands them.
    const occasions = has('occasion') && config.occasions && activeOccasions(config.occasions, zonedParts(now, config.tz).ymd);
    if (occasions || !has('occasion')) {
      set('occasion', occasions && occasions.ids.join(' '));
      set('occasion-day', occasions && occasions.day);
      set('occasion-icon', occasions && occasions.icon);
    }
  }
} catch { /* any failure leaves the page as it was */ }
