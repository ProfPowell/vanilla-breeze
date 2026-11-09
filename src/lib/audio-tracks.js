/**
 * audio-tracks: shared track-list behaviour for <audio-player> and the
 * `[data-audio-playlist]` playlist utility (src/utils/audio-playlist-init.js).
 *
 * Track-list contract (both consumers):
 * - Tracks are `<li>` elements inside `.track-list`, each holding an `<a href>`
 *   pointing at the audio file.
 * - `data-audio-active` marks the loaded track. It stays on the track after it
 *   ends, so the list always shows what was last playing.
 * - `data-audio-played` is added to a track when it plays to the end.
 * - When a track ends, playback advances to the next track in list order and
 *   stops after the last one (the caller decides whether to wrap/shuffle).
 */

/**
 * Track items (in list order) that carry a playable link.
 * @param {Element} trackList
 * @returns {HTMLLIElement[]}
 */
export function trackItems(trackList) {
  return /** @type {HTMLLIElement[]} */ ([...trackList.querySelectorAll('li')]
    .filter((li) => li.querySelector('a[href]')));
}

/**
 * The track item currently marked `data-audio-active`, if any.
 * @param {Element} trackList
 * @returns {HTMLLIElement | null}
 */
export function activeTrack(trackList) {
  return trackList.querySelector('li[data-audio-active]');
}

/**
 * Activate a track: mark it `data-audio-active` (clearing the others), point
 * the audio at its link and start playback. A rejected play() (autoplay
 * policy, an interrupted load) is caught — load failures surface through the
 * audio element's own `error` event instead.
 *
 * @param {HTMLAudioElement} audio
 * @param {Element} trackList
 * @param {HTMLLIElement} li
 * @returns {{ src: string, title: string } | null} null when li has no link
 */
export function activateTrack(audio, trackList, li) {
  const link = /** @type {HTMLAnchorElement | null} */ (li.querySelector('a[href]'));
  if (!link) return null;
  trackList.querySelectorAll('li[data-audio-active]').forEach((item) => {
    if (item !== li) item.removeAttribute('data-audio-active');
  });
  li.setAttribute('data-audio-active', '');
  audio.src = link.href;
  audio.play()?.catch(() => {});
  return { src: link.href, title: link.textContent?.trim() ?? '' };
}

/**
 * Mark the active track as played. It keeps `data-audio-active`.
 * @param {Element} trackList
 * @returns {HTMLLIElement | null} the active track
 */
export function markActivePlayed(trackList) {
  const active = activeTrack(trackList);
  active?.setAttribute('data-audio-played', '');
  return active;
}

/**
 * The track after the active one in list order, or null at the end of the
 * list (wraps to the first track when `loop` is true). With no active track
 * the first track is next.
 *
 * @param {Element} trackList
 * @param {{ loop?: boolean }} [opts]
 * @returns {HTMLLIElement | null}
 */
export function nextTrack(trackList, { loop = false } = {}) {
  const items = trackItems(trackList);
  if (!items.length) return null;
  const active = activeTrack(trackList);
  const idx = active ? items.indexOf(/** @type {HTMLLIElement} */ (active)) : -1;
  if (idx + 1 < items.length) return items[idx + 1];
  return loop ? items[0] : null;
}
