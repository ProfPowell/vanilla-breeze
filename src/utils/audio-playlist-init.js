/**
 * audio-playlist-init: Track list click handling for native audio playlists
 *
 * Enhances `.audio-standalone` containers (not `audio-player` — that component
 * handles its own playlist). Clicking a track in `.track-list` updates the
 * `<audio>` element's src, marks the track `data-audio-active` and plays it.
 * When a track ends it is marked `data-audio-played` (and stays active) and
 * the next track in list order starts; playback stops after the last track.
 * Track activation is shared with <audio-player> via src/lib/audio-tracks.js.
 *
 * Without JS, track links navigate to the audio file directly — a valid fallback.
 *
 * @example
 * <section class="audio-standalone">
 *   <audio controls>
 *     <source src="tracks/01.mp3" type="audio/mpeg">
 *   </audio>
 *   <details>
 *     <summary>Track Listing</summary>
 *     <ol class="track-list">
 *       <li><a href="tracks/01.mp3">01. Opening</a></li>
 *       <li><a href="tracks/02.mp3">02. Main Theme</a></li>
 *     </ol>
 *   </details>
 * </section>
 */

import { activateTrack, markActivePlayed, nextTrack } from '../lib/audio-tracks.js';

const CONTAINER_SELECTOR = '.audio-standalone';

/**
 * Initialize playlist behavior for a single container
 * @param {HTMLElement} root
 */
function initPlaylist(root) {
  if (root.hasAttribute('data-audio-playlist-init')) return;

  const audio = root.querySelector('audio');
  if (!audio) return;

  const trackList = root.querySelector('.track-list');
  if (!trackList) return;

  root.setAttribute('data-audio-playlist-init', '');

  // Same contract as <audio-player>: mark the finished track played, keep it
  // active, and advance to the next track in list order (stop after the last).
  // A native <audio loop> repeats the current track and never fires `ended`.
  audio.addEventListener('ended', () => {
    markActivePlayed(trackList);
    const next = nextTrack(trackList);
    if (next) activateTrack(audio, trackList, next);
  });

  trackList.addEventListener('click', (e) => {
    const link = /** @type {HTMLAnchorElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('a[href]'));
    const li = link?.closest('li');
    if (!link || !li) return;
    e.preventDefault();
    activateTrack(audio, trackList, li);
  });
}

/**
 * Initialize all playlist containers
 * @param {Element|Document} scope
 */
function initAllPlaylists(scope = document) {
  scope.querySelectorAll(CONTAINER_SELECTOR).forEach(el => initPlaylist(/** @type {HTMLElement} */ (el)));
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAllPlaylists());
} else {
  initAllPlaylists();
}

// Watch for dynamically added containers
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(CONTAINER_SELECTOR)) {
        initPlaylist(/** @type {HTMLElement} */ (el));
      }

      el.querySelectorAll(CONTAINER_SELECTOR).forEach(child =>
        initPlaylist(/** @type {HTMLElement} */ (child))
      );
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initAllPlaylists };
