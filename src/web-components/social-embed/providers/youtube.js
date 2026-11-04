/**
 * YouTube provider — delegates to <youtube-player>.
 *
 * delegatesActivation: social-embed skips its own button and renders the
 * player at once; youtube-player shows its own facade (thumbnail + play
 * button). Note the thumbnail is fetched from i.ytimg.com up front.
 */

import '../../youtube-player/logic.js';
import { parseHttpsUrl } from '../shared.js';

const HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
  'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be',
]);
const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * @param {string | null} t - t= / start= value: 90, 90s or 1h2m3s
 * @returns {number | null}
 */
function parseStart(t) {
  if (!t) return null;
  if (/^\d+s?$/.test(t)) return parseInt(t, 10);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  if (!m || !m[0]) return null;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

/**
 * Extract a video id (and start time) from a YouTube URL:
 * youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/.
 * @param {string} url
 * @returns {{ id: string, start: number | null } | null}
 */
export function parseYouTubeUrl(url) {
  const u = parseHttpsUrl(url, HOSTS);
  if (!u) return null;
  let id = null;
  if (u.hostname === 'youtu.be') {
    id = u.pathname.slice(1).replace(/\/$/, '');
  } else if (u.pathname === '/watch') {
    id = u.searchParams.get('v');
  } else {
    id = /^\/(?:shorts|embed|live)\/([^/]+)\/?$/.exec(u.pathname)?.[1] ?? null;
  }
  if (!id || !ID.test(id)) return null;
  return { id, start: parseStart(u.searchParams.get('t') ?? u.searchParams.get('start')) };
}

export const YouTubeProvider = {
  label: 'YouTube',
  noun: 'video',
  delegatesActivation: true,
  canHandle: (/** @type {string} */ url) => !!parseYouTubeUrl(url),
  frameHost: () => 'www.youtube-nocookie.com',

  /**
   * @param {HTMLElement} _host
   * @param {string} url
   * @param {{ title: string }} opts
   */
  async render(_host, url, { title }) {
    const video = parseYouTubeUrl(url);
    if (!video) throw new Error('Could not parse YouTube video ID');
    const yt = document.createElement('youtube-player');
    yt.setAttribute('video-id', video.id);
    // youtube-player interpolates its title into attribute markup: keep
    // quotes and angle brackets out of it.
    yt.setAttribute('title', title.replace(/["<>]/g, ''));
    if (video.start) yt.setAttribute('start', String(video.start));
    return yt;
  },
};
