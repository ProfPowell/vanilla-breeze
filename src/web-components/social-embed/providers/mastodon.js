/**
 * Mastodon provider — oEmbed via instance-relative /api/oembed
 * Parses the instance hostname from the URL. No third-party script required.
 */

import { SocialEmbed, fetchOEmbed } from '../logic.js';

const MastodonProvider = {
  canHandle(url) {
    // Mastodon URLs: https://{instance}/@{user}/{id}
    return /^https?:\/\/[^/]+\/@[^/]+\/\d+/.test(url);
  },

  async render(host, url) {
    const instance = new URL(url).origin;
    const data = await fetchOEmbed(`${instance}/api/oembed`, url);
    host.innerHTML = data.html;
  }
};

SocialEmbed.register('mastodon', MastodonProvider);
export { MastodonProvider };
