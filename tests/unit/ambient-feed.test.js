/**
 * Ambient weather feed: the reader a page trusts (readFeed, feedFresh) and
 * the producer helpers a Worker uses (openMeteoUrl, feedFromOpenMeteo).
 * The fixture is a real Open-Meteo response, recorded 2026-11-20.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFeed, feedFresh, openMeteoUrl, feedFromOpenMeteo, resolveDaypart } from '../../src/packs/ambient/ambient.resolve.js';

const FORECAST = JSON.parse(readFileSync(new URL('./fixtures/open-meteo-forecast.json', import.meta.url), 'utf8'));
const FEED = { v: 1, asOf: '2026-11-15T20:00:00-08:00', ttl: 1800, weather: 'rain', intensity: 'light', tempC: 17, sunrise: '06:18', sunset: '16:47', attribution: 'Weather data by Open-Meteo.com' };

describe('readFeed', () => {
  it('keeps the known fields of a version 1 feed and drops the rest', () => {
    assert.deepEqual(readFeed({ ...FEED, extra: '<b>' }), {
      asOf: FEED.asOf, ttl: 1800, weather: 'rain', intensity: 'light', tempC: 17, sunrise: '06:18', sunset: '16:47',
    });
  });

  it('gives null for anything that is not a version 1 feed with a readable time', () => {
    for (const bad of [null, undefined, 'rain', 7, [], {}, { ...FEED, v: 2 }, { ...FEED, v: '1' }, { ...FEED, asOf: 'yesterday' }, { ...FEED, asOf: undefined }]) {
      assert.equal(readFeed(bad), null, JSON.stringify(bad));
    }
  });

  it('never passes on a value outside the vocabulary', () => {
    assert.deepEqual(readFeed({ v: 1, asOf: FEED.asOf, weather: 'frogs', intensity: 'heavy', tempC: '17', sunrise: '6:18', sunset: '16:47' }), {
      asOf: FEED.asOf, ttl: 1800, weather: null, intensity: null, tempC: null,
    });
    assert.equal(readFeed({ ...FEED, intensity: 'biblical' })?.intensity, null);
    assert.equal(readFeed({ ...FEED, weather: 'clear', intensity: 'drizzly' })?.intensity, null);
    assert.equal(readFeed({ ...FEED, sunset: '25:00' })?.sunrise, undefined, 'sun times come as a pair or not at all');
  });

  it('defaults the ttl and holds it to a minute or more', () => {
    assert.equal(readFeed({ ...FEED, ttl: undefined })?.ttl, 1800);
    assert.equal(readFeed({ ...FEED, ttl: -5 })?.ttl, 1800);
    assert.equal(readFeed({ ...FEED, ttl: 1 })?.ttl, 60);
    assert.equal(readFeed({ ...FEED, ttl: 900 })?.ttl, 900);
  });
});

describe('feedFresh', () => {
  const feed = readFeed(FEED);
  const asOf = Date.parse(FEED.asOf);

  it('holds until asOf + 2 × ttl and not a moment longer', () => {
    assert.equal(feedFresh(feed, asOf), true);
    assert.equal(feedFresh(feed, asOf + 3600_000), true);
    assert.equal(feedFresh(feed, asOf + 3600_001), false);
    assert.equal(feedFresh(null, asOf), false);
    assert.equal(feedFresh(undefined, asOf), false);
  });
});

describe('feed sun times', () => {
  it('replace the fixed table for the daypart', () => {
    const config = { tz: 'America/Los_Angeles' };
    const at = new Date('2026-11-16T01:30:00Z'); // 17:30 in San Diego
    assert.equal(resolveDaypart(at, config), 'dusk', 'the table puts an autumn sunset at 18:00');
    assert.equal(resolveDaypart(at, config, readFeed({ ...FEED, sunset: '19:30' })), 'day');
    assert.equal(resolveDaypart(at, config, readFeed(FEED)), 'dusk', '16:47 plus 45 minutes');
    assert.equal(resolveDaypart(at, config, readFeed({ ...FEED, sunset: '16:00' })), 'night');
  });
});

describe('openMeteoUrl', () => {
  it('asks for current conditions and sun times at two decimals', () => {
    const url = new URL(openMeteoUrl({ lat: 32.7157, lon: -117.1611 }));
    assert.equal(url.origin + url.pathname, 'https://api.open-meteo.com/v1/forecast');
    assert.equal(url.searchParams.get('latitude'), '32.72');
    assert.equal(url.searchParams.get('longitude'), '-117.16');
    assert.equal(url.searchParams.get('current'), 'temperature_2m,weather_code,precipitation,wind_speed_10m');
    assert.equal(url.searchParams.get('daily'), 'sunrise,sunset');
    assert.equal(url.searchParams.get('timezone'), 'auto');
  });
});

describe('feedFromOpenMeteo', () => {
  it('turns a recorded response into a feed the reader accepts', () => {
    const feed = feedFromOpenMeteo(FORECAST);
    assert.deepEqual(feed, {
      v: 1, asOf: '2026-11-20T15:30:00-08:00', ttl: 1800, weather: 'clear', tempC: 18.8, sunrise: '06:23', sunset: '16:44',
      attribution: 'Weather data by Open-Meteo.com',
    });
    assert.equal(Date.parse(feed.asOf), Date.parse('2026-11-20T23:30:00Z'));
    assert.deepEqual(readFeed(feed), { asOf: feed.asOf, ttl: 1800, weather: 'clear', intensity: null, tempC: 18.8, sunrise: '06:23', sunset: '16:44' });
    assert.ok(JSON.stringify(feed).length <= 512, 'the feed stays within 512 bytes');
    assert.doesNotMatch(JSON.stringify(feed), /32\.7|117\.1|latitude|longitude/, 'no coordinates');
  });

  it('maps codes, intensity and wind, and takes ttl and attribution options', () => {
    const with_ = (current) => feedFromOpenMeteo({ ...FORECAST, current: { ...FORECAST.current, ...current } }, { ttl: 900, attribution: 'x' });
    assert.partialDeepStrictEqual(with_({ weather_code: 65 }), { weather: 'rain', intensity: 'heavy', ttl: 900, attribution: 'x' });
    assert.equal(with_({ weather_code: 53 })?.intensity, 'light');
    assert.equal(with_({ weather_code: 2, wind_speed_10m: 45 })?.weather, 'wind');
    assert.equal(with_({ weather_code: 63 })?.intensity, undefined);
  });

  it('writes offsets east of Greenwich and half-hour zones', () => {
    assert.equal(feedFromOpenMeteo({ ...FORECAST, utc_offset_seconds: 19800 })?.asOf, '2026-11-20T15:30:00+05:30');
    assert.equal(feedFromOpenMeteo({ ...FORECAST, utc_offset_seconds: 0 })?.asOf, '2026-11-20T15:30:00+00:00');
  });

  it('leaves out what it cannot read, and gives null without a current time', () => {
    const feed = feedFromOpenMeteo({ ...FORECAST, current: { time: '2026-11-20T15:30', weather_code: 4 }, daily: {} });
    assert.deepEqual(feed, { v: 1, asOf: '2026-11-20T15:30:00-08:00', ttl: 1800, attribution: 'Weather data by Open-Meteo.com' });
    for (const bad of [null, {}, { current: {} }, { current: { time: 'now' } }, { error: true, reason: 'x' }]) assert.equal(feedFromOpenMeteo(bad), null, JSON.stringify(bad));
  });
});
