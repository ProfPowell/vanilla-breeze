/**
 * X (Twitter) provider — sandboxed platform.twitter.com/embed/Tweet.html iframe.
 *
 * No widgets.js: the post URL is parsed and validated, and the frame URL is
 * rebuilt from the numeric status id. Themeable (theme=light|dark).
 */

import { createEmbedFrame, parseHttpsUrl, messageData, POST_SANDBOX } from '../shared.js';

const HOSTS = new Set(['x.com', 'www.x.com', 'mobile.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com']);
const PATH = /^\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d{1,25})\/?$/;
const FRAME_HOST = 'platform.twitter.com';

/**
 * @param {string} url
 * @returns {{ user: string, id: string } | null}
 */
export function parseXUrl(url) {
  const u = parseHttpsUrl(url, HOSTS);
  const m = u && PATH.exec(u.pathname);
  return m ? { user: m[1], id: m[2] } : null;
}

export const XProvider = {
  label: 'X',
  themeable: true,
  canHandle: (/** @type {string} */ url) => !!parseXUrl(url),
  frameHost: () => FRAME_HOST,

  /**
   * @param {HTMLElement} _host
   * @param {string} url
   * @param {{ theme: 'light' | 'dark', title: string }} opts
   */
  async render(_host, url, { theme, title }) {
    const post = parseXUrl(url);
    if (!post) throw new Error('Not an X post URL');
    const src = new URL(`https://${FRAME_HOST}/embed/Tweet.html`);
    src.searchParams.set('id', post.id);
    src.searchParams.set('theme', theme);
    src.searchParams.set('dnt', 'true');
    return createEmbedFrame({
      src, title, sandbox: [...POST_SANDBOX], allow: 'fullscreen', height: 360,
      // {"twttr.embed":{"method":"twttr.private.resize","params":[{"height":…}]}}
      measure(data) {
        const msg = messageData(data)?.['twttr.embed'];
        return msg?.method === 'twttr.private.resize' ? msg.params?.[0]?.height : null;
      },
    });
  },
};
