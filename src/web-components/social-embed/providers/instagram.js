/**
 * Instagram provider — sandboxed www.instagram.com/p/<id>/embed/ iframe.
 *
 * No embed.js: the post URL is parsed and validated, and the frame URL is
 * rebuilt from the shortcode.
 */

import { createEmbedFrame, parseHttpsUrl, messageData, POST_SANDBOX } from '../shared.js';

const HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const PATH = /^\/(?:[A-Za-z0-9_.]{1,30}\/)?(?:p|reel|tv)\/([A-Za-z0-9_-]{5,64})\/?$/;
const FRAME_HOST = 'www.instagram.com';

/**
 * @param {string} url
 * @returns {{ id: string } | null}
 */
export function parseInstagramUrl(url) {
  const u = parseHttpsUrl(url, HOSTS);
  const m = u && PATH.exec(u.pathname);
  return m ? { id: m[1] } : null;
}

export const InstagramProvider = {
  label: 'Instagram',
  canHandle: (/** @type {string} */ url) => !!parseInstagramUrl(url),
  frameHost: () => FRAME_HOST,

  /**
   * @param {HTMLElement} _host
   * @param {string} url
   * @param {{ title: string }} opts
   */
  async render(_host, url, { title }) {
    const post = parseInstagramUrl(url);
    if (!post) throw new Error('Not an Instagram post URL');
    return createEmbedFrame({
      src: new URL(`https://${FRAME_HOST}/p/${post.id}/embed/`),
      title, sandbox: [...POST_SANDBOX], height: 560,
      // {"type":"MEASURE","details":{"height":…}}
      measure(data) {
        const msg = messageData(data);
        return msg?.type === 'MEASURE' ? msg.details?.height : null;
      },
    });
  },
};
