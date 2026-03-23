/**
 * Instagram provider — script injection via instagram.com/embed.js
 * Builds a blockquote that the embed.js SDK processes into an iframe.
 */

import { SocialEmbed, loadScript } from '../logic.js';

const EMBED_SRC = 'https://www.instagram.com/embed.js';

const InstagramProvider = {
  canHandle(url) {
    return /instagram\.com\/(p|reel|tv)\/[^/]+/.test(url);
  },

  async render(host, url) {
    await loadScript(EMBED_SRC);

    host.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"><a href="${url}"></a></blockquote>`;

    // instgrm.Embeds.process() converts blockquotes to iframes
    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
    }
  }
};

SocialEmbed.register('instagram', InstagramProvider);
export { InstagramProvider };
