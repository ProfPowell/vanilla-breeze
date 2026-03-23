/**
 * X (Twitter) provider — script injection via platform.x.com/widgets.js
 * Builds a blockquote that the widgets.js SDK processes into an iframe embed.
 */

import { SocialEmbed, loadScript } from '../logic.js';

const WIDGETS_SRC = 'https://platform.x.com/widgets.js';

const XProvider = {
  canHandle(url) {
    return /(?:x\.com|twitter\.com)\/[^/]+\/status\/\d+/.test(url);
  },

  async render(host, url, { theme }) {
    await loadScript(WIDGETS_SRC);

    host.innerHTML = `<blockquote class="twitter-tweet" data-theme="${theme}"><a href="${url}"></a></blockquote>`;

    // twttr.widgets.load() processes blockquotes into iframes
    if (window.twttr?.widgets?.load) {
      window.twttr.widgets.load(host);
    }
  }
};

SocialEmbed.register('x', XProvider);
export { XProvider };
