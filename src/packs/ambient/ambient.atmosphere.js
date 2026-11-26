/**
 * Ambient atmosphere: a brief effect for the current state, played inside
 * [data-ambient-slot="atmosphere"]. The core module fetches this file only
 * when the page asked for data-ambient-level="atmosphere", has a slot, the
 * state has an effect, and neither reduced motion nor data saving is on.
 *
 *   snow → ambient-snow          rain, storm → ambient-rain
 *   fog → ambient-fog            wind in autumn → ambient-leaves
 *   an occasion with "effect": "confetti", on its day → ambient-confetti
 *
 * The drawing is done by <bg-wc> (@profpowell/bg-wc), which the page loads:
 * this file adds one <bg-wc preset="…"> behind the slot's content and no
 * canvas code of its own. Without bg-wc on the page nothing plays.
 *
 * An effect plays for five seconds and fades out. A slot with
 * data-ambient-loop keeps playing only while a visible [data-ambient-pause]
 * control exists; that control, and data-paused on the slot, pause it.
 * bg-wc itself stops drawing while the tab is hidden.
 */

/** Total play time, fade included, in ms (WCAG 2.2.2: under five seconds needs no control). */
export const PLAY_MS = 5000;
const FADE_MS = 600;
const SLOT = '[data-ambient-slot="atmosphere"]';
const WEATHER = { snow: 'snow', rain: 'rain', storm: 'rain', fog: 'fog' };
/** bg-wc density and intensity (0–1) by weather intensity. */
const AMOUNT = { light: ['0.15', '0.3'], heavy: ['0.5', '0.8'] };

/**
 * The effect a state plays, or null. An occasion's effect comes before the
 * weather; a season alone plays nothing.
 * @param {{ weather?: string | null, season?: string | null, occasionEffect?: string | null } | null} state
 * @returns {'snow' | 'rain' | 'fog' | 'leaves' | 'confetti' | null}
 */
export function effectFor(state) {
  if (!state) return null;
  if (state.occasionEffect === 'confetti') return 'confetti';
  if (state.weather && WEATHER[state.weather]) return WEATHER[state.weather];
  return state.weather === 'wind' && state.season === 'autumn' ? 'leaves' : null;
}

/** @type {WeakMap<Element, { name: string | null, layer?: Element, timers?: ReturnType<typeof setTimeout>[], watch?: MutationObserver }>} */
const slots = new WeakMap();
/** @type {Parameters<typeof play>[0]} */
let last = null;
let waiting = false;
let wired = false;

const root = () => document.documentElement;
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches || root().hasAttribute('data-motion-reduced');
const pauseControl = () => [...document.querySelectorAll('[data-ambient-pause]')].find((el) => el.checkVisibility?.());

/** @param {Element} slot */
function clear(slot) {
  const entry = slots.get(slot);
  entry?.timers?.forEach(clearTimeout);
  entry?.watch?.disconnect();
  entry?.layer?.remove();
  slot.removeAttribute('data-ambient-effect');
}

/**
 * @param {Element} slot
 * @param {string | null} name
 * @param {string | null | undefined} intensity
 */
function run(slot, name, intensity) {
  // The same effect is not replayed on every re-resolve: once per state.
  if (slots.get(slot)?.name === name) return;
  clear(slot);
  slots.set(slot, { name });
  if (!name) return;

  const layer = document.createElement('bg-wc');
  const [density, strength] = AMOUNT[intensity || ''] || ['0.3', '0.5'];
  for (const [k, v] of Object.entries({
    preset: name, density, intensity: strength, quality: 'low', 'aria-hidden': 'true', 'data-ambient-atmosphere': name,
  })) layer.setAttribute(k, v);
  layer.toggleAttribute('paused', slot.hasAttribute('data-paused'));
  // The layer is positioned against the slot; a slot the author positioned is left alone.
  if (slot instanceof HTMLElement && getComputedStyle(slot).position === 'static') slot.style.position = 'relative';
  slot.setAttribute('data-ambient-effect', `ambient-${name}`);
  slot.prepend(layer);

  const watch = new MutationObserver(() => layer.toggleAttribute('paused', slot.hasAttribute('data-paused')));
  watch.observe(slot, { attributes: true, attributeFilter: ['data-paused'] });

  // Looping needs a visible pause control; otherwise the time box applies.
  const timers = slot.hasAttribute('data-ambient-loop') && pauseControl() ? [] : [
    setTimeout(() => layer.setAttribute('data-ambient-ending', ''), PLAY_MS - FADE_MS),
    setTimeout(() => {
      watch.disconnect();
      layer.remove();
      slot.removeAttribute('data-ambient-effect');
    }, PLAY_MS),
  ];
  slots.set(slot, { name, layer, timers, watch });
}

function wire() {
  if (wired) return;
  wired = true;
  // <button data-ambient-pause>: pauses and resumes every playing effect.
  document.addEventListener('click', (e) => {
    const control = e.target instanceof Element ? e.target.closest('[data-ambient-pause]') : null;
    if (!control) return;
    const paused = control.getAttribute('aria-pressed') !== 'true';
    control.setAttribute('aria-pressed', String(paused));
    for (const layer of document.querySelectorAll('[data-ambient-atmosphere]')) layer.toggleAttribute('paused', paused);
  });
}

/**
 * Play the effect for a state in every atmosphere slot, or clear them.
 * @param {{ weather?: string | null, intensity?: string | null, season?: string | null, occasionEffect?: string | null } | null} state
 */
export function play(state) {
  last = state;
  const on = root().getAttribute('data-ambient-level') === 'atmosphere' && !still();
  const name = on ? effectFor(state) : null;
  if (name && !customElements.get('bg-wc')) {
    // bg-wc may be defined later; play then, or never.
    if (!waiting) {
      waiting = true;
      customElements.whenDefined('bg-wc').then(() => play(last));
    }
    return;
  }
  wire();
  for (const slot of document.querySelectorAll(SLOT)) run(slot, name, state?.intensity);
}
