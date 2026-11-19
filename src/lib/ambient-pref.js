/**
 * Ambient visitor preference.
 *
 * One localStorage key holds the visitor's opt-out from ambient styling
 * (the ambient pack). It lives here, outside the pack, so that
 * <settings-panel> can offer the switch without importing the pack: the
 * pack listens for the event and re-resolves.
 */

/** localStorage key; the value "off" means the visitor opted out. */
export const AMBIENT_KEY = 'vb-ambient';

/** Fired on document when the preference changes. detail: { enabled } */
export const AMBIENT_PREF_EVENT = 'ambient:preference';

/** @returns {boolean} false only when the visitor opted out */
export function ambientEnabled() {
  try {
    return localStorage.getItem(AMBIENT_KEY) !== 'off';
  } catch {
    return true;
  }
}

/**
 * Store the preference and tell the page.
 * @param {boolean} enabled
 */
export function setAmbientEnabled(enabled) {
  try {
    if (enabled) localStorage.removeItem(AMBIENT_KEY);
    else localStorage.setItem(AMBIENT_KEY, 'off');
  } catch { /* storage blocked: the choice lasts for this page view */ }
  document.dispatchEvent(new CustomEvent(AMBIENT_PREF_EVENT, { detail: { enabled: !!enabled } }));
}
