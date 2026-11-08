/**
 * Mastodon provider — sandboxed <instance>/@user/<id>/embed iframe.
 *
 * Any instance is accepted (federation), so the instance is untrusted: the
 * URL must be https with a /@user/<numeric id> path, the frame URL is rebuilt
 * from those parts, and the frame is sandboxed without
 * allow-popups-to-escape-sandbox. No oEmbed HTML is inserted.
 */

import { createEmbedFrame, parseHttpsUrl, messageData, frameId } from '../shared.js';

const PATH = /^\/@([A-Za-z0-9_]{1,30})\/(\d{1,25})\/?$/;

/**
 * @param {string} url
 * @returns {{ origin: string, host: string, user: string, id: string } | null}
 */
export function parseMastodonUrl(url) {
  const u = parseHttpsUrl(url, null);
  if (!u || !u.hostname.includes('.')) return null;
  const m = PATH.exec(u.pathname);
  return m ? { origin: u.origin, host: u.hostname, user: m[1], id: m[2] } : null;
}

export const MastodonProvider = {
  label: 'Mastodon',
  canHandle: (/** @type {string} */ url) => !!parseMastodonUrl(url),
  frameHost: (/** @type {string} */ url) => parseMastodonUrl(url)?.host ?? '',

  /**
   * @param {HTMLElement} _host
   * @param {string} url
   * @param {{ title: string }} opts
   */
  async render(_host, url, { title }) {
    const post = parseMastodonUrl(url);
    if (!post) throw new Error('Not a Mastodon post URL');
    const id = Number(frameId());
    return createEmbedFrame({
      src: new URL(`${post.origin}/@${post.user}/${post.id}/embed`),
      title,
      sandbox: ['allow-scripts', 'allow-same-origin', 'allow-popups'],
      allow: 'fullscreen',
      height: 320,
      // Mastodon's embed protocol: ask for the height, it answers
      // { type: 'setHeight', id, height }.
      onload(frame) {
        frame.contentWindow?.postMessage({ type: 'setHeight', id }, post.origin);
      },
      measure(data) {
        const msg = messageData(data);
        return msg?.type === 'setHeight' && msg.id === id ? msg.height : null;
      },
    });
  },
};
