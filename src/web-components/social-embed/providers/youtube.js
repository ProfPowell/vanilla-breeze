/**
 * YouTube provider — delegates to <youtube-player>
 *
 * Sets delegatesActivation: true so social-embed skips its own click gate.
 * youtube-player handles its own facade (thumbnail + click-to-play).
 */

import { SocialEmbed } from '../logic.js';

/**
 * Extract a video ID from a YouTube URL.
 * Handles youtube.com/watch?v=, youtu.be/, youtube.com/shorts/
 * @param {string} url
 * @returns {string | null}
 */
function extractVideoId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

const YouTubeProvider = {
  delegatesActivation: true,

  canHandle(url) {
    return /(?:youtube\.com\/(?:watch|shorts\/)|youtu\.be\/)/.test(url);
  },

  async render(host, url) {
    const id = extractVideoId(url);
    if (!id) throw new Error('Could not parse YouTube video ID');

    const yt = document.createElement('youtube-player');
    yt.dataset.id = id;
    yt.dataset.title = host.dataset.title || 'YouTube video';
    host.innerHTML = '';
    host.appendChild(yt);
  }
};

SocialEmbed.register('youtube', YouTubeProvider);
export { YouTubeProvider };
