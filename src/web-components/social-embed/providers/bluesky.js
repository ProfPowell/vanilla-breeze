/**
 * Bluesky provider — oEmbed via embed.bsky.app
 * No third-party script required.
 */

import { SocialEmbed, fetchOEmbed } from '../logic.js';

const OEMBED_ENDPOINT = 'https://embed.bsky.app/oembed';

const BlueskyProvider = {
  canHandle(url) {
    return /bsky\.app\/profile\/[^/]+\/post\//.test(url);
  },

  async render(host, url) {
    const data = await fetchOEmbed(OEMBED_ENDPOINT, url);
    host.innerHTML = data.html;
  }
};

SocialEmbed.register('bluesky', BlueskyProvider);
export { BlueskyProvider };
