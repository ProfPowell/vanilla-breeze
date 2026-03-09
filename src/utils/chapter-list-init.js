/**
 * chapter-list-init: Video chapter markers from <track kind="chapters">
 *
 * Enhances <track kind="chapters" data-chapter-list> to render a clickable
 * chapter list below the video. Clicking a chapter seeks to that timestamp.
 * The current chapter is highlighted during playback.
 *
 * Without JS: the video plays normally, chapters available in browser's
 * native UI (where supported).
 *
 * @attr {string} data-chapter-list - Activates chapter list rendering
 *
 * @example
 * <video controls>
 *   <source src="tutorial.mp4" type="video/mp4">
 *   <track kind="chapters" src="chapters.vtt" default data-chapter-list>
 * </video>
 */

const SELECTOR = 'track[kind="chapters"][data-chapter-list]';

/**
 * Initialize chapter lists within a root element
 * @param {Element|Document} root
 */
function initChapterLists(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceTrack);
}

/**
 * Enhance a single track element with a chapter list
 * @param {HTMLTrackElement} trackEl
 */
function enhanceTrack(trackEl) {
  if (trackEl.hasAttribute('data-chapter-list-init')) return;
  trackEl.setAttribute('data-chapter-list-init', '');

  const video = trackEl.parentElement;
  if (!video || video.tagName !== 'VIDEO') return;

  const textTrack = trackEl.track;

  // Browsers won't load disabled tracks — set to hidden so cues load
  // without displaying as on-screen text
  if (textTrack.mode === 'disabled') {
    textTrack.mode = 'hidden';
  }

  // readyState: 0=NONE, 1=LOADING, 2=LOADED, 3=ERROR
  if (trackEl.readyState >= 2) {
    buildChapterList(video, textTrack);
  } else {
    trackEl.addEventListener('load', () => buildChapterList(video, textTrack), { once: true });
  }
}

/**
 * Build and insert the chapter list UI
 * @param {HTMLVideoElement} video
 * @param {TextTrack} textTrack
 */
function buildChapterList(video, textTrack) {
  const cues = textTrack.cues;
  if (!cues || cues.length === 0) return;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Video chapters');
  nav.classList.add('chapter-list');

  const ol = document.createElement('ol');

  for (const cue of cues) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = cue.text;

    const timeEl = document.createElement('time');
    timeEl.textContent = formatTime(cue.startTime);
    timeEl.setAttribute('datetime', formatDuration(cue.startTime));

    button.appendChild(titleSpan);
    button.appendChild(timeEl);

    button.addEventListener('click', () => {
      video.currentTime = cue.startTime;
      if (video.paused) video.play();
    });

    li.appendChild(button);
    ol.appendChild(li);
  }

  nav.appendChild(ol);
  video.insertAdjacentElement('afterend', nav);

  // Highlight current chapter during playback
  let activeLi = null;

  video.addEventListener('timeupdate', () => {
    const time = video.currentTime;
    let activeIndex = -1;

    for (let i = 0; i < cues.length; i++) {
      if (time >= cues[i].startTime && time < cues[i].endTime) {
        activeIndex = i;
        break;
      }
    }

    if (activeLi) activeLi.removeAttribute('data-active');

    if (activeIndex >= 0) {
      activeLi = ol.children[activeIndex];
      activeLi.setAttribute('data-active', '');
    } else {
      activeLi = null;
    }
  });
}

/**
 * Format seconds as h:mm:ss or m:ss
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format seconds as ISO 8601 duration for <time datetime>
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `PT${h ? h + 'H' : ''}${m ? m + 'M' : ''}${s}S`;
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initChapterLists());
} else {
  initChapterLists();
}

// Watch for dynamically added tracks
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches?.(SELECTOR)) {
        enhanceTrack(/** @type {HTMLTrackElement} */ (el));
      }

      el.querySelectorAll?.(SELECTOR).forEach(child =>
        enhanceTrack(/** @type {HTMLTrackElement} */ (child))
      );
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initChapterLists };
