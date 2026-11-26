/**
 * Ambient atmosphere: which effect a state plays. The DOM side (the slot,
 * the five-second time box, the motion gates) is in
 * tests/components/ambient-pack.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { effectFor, PLAY_MS } from '../../src/packs/ambient/ambient.atmosphere.js';

describe('effectFor', () => {
  it('maps weather to its effect', () => {
    assert.equal(effectFor({ weather: 'snow' }), 'snow');
    assert.equal(effectFor({ weather: 'rain' }), 'rain');
    assert.equal(effectFor({ weather: 'storm' }), 'rain');
    assert.equal(effectFor({ weather: 'fog' }), 'fog');
  });

  it('plays leaves only for wind in autumn', () => {
    assert.equal(effectFor({ weather: 'wind', season: 'autumn' }), 'leaves');
    assert.equal(effectFor({ weather: 'wind', season: 'spring' }), null);
    assert.equal(effectFor({ weather: 'wind' }), null);
  });

  it('plays nothing for a season alone or for calm weather', () => {
    for (const state of [null, {}, { season: 'winter' }, { season: 'autumn' }, { weather: 'clear' }, { weather: 'cloudy', season: 'winter' }]) {
      assert.equal(effectFor(state), null);
    }
  });

  it('puts an occasion\'s confetti before the weather and ignores other effect names', () => {
    assert.equal(effectFor({ weather: 'snow', occasionEffect: 'confetti' }), 'confetti');
    assert.equal(effectFor({ weather: 'snow', occasionEffect: 'fireworks' }), 'snow');
    assert.equal(effectFor({ occasionEffect: 'fireworks' }), null);
  });

  it('keeps the play time at five seconds', () => {
    assert.equal(PLAY_MS, 5000);
  });
});
