/**
 * audio-playlist-init: Track list click handling for native audio playlists
 *
 * Enhances `.audio-standalone` containers (not `audio-player` — that component
 * handles its own playlist). Clicking a track in `.track-list` updates the
 * sibling `<audio>` element's src and plays it.
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

const CONTAINER_SELECTOR = '.audio-standalone';

/**
 * Initialize playlist behavior for a single container
 * @param {HTMLElement} root
 */
function initPlaylist(root) {
  if (root.hasAttribute('data-audio-playlist-init')) return;
  root.setAttribute('data-audio-playlist-init', '');

  const audio = root.querySelector('audio');
  if (!audio) return;

  const trackList = root.querySelector('.track-list');
  if (!trackList) return;

  // Mark track as played when it ends
  audio.addEventListener('ended', () => {
    const active = trackList.querySelector('li[data-audio-active]');
    if (active) {
      active.setAttribute('data-audio-played', '');
      active.removeAttribute('data-audio-active');
    }
  });

  trackList.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    e.preventDefault();

    audio.src = link.href;
    audio.play();

    // Update active state
    const items = trackList.querySelectorAll('li');
    items.forEach(li => li.removeAttribute('data-audio-active'));
    link.closest('li')?.setAttribute('data-audio-active', '');
  });
}

/**
 * Initialize all playlist containers
 * @param {Element|Document} scope
 */
function initAllPlaylists(scope = document) {
  scope.querySelectorAll(CONTAINER_SELECTOR).forEach(initPlaylist);
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
