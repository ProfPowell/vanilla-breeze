/**
 * Bluesky provider — sandboxed embed.bsky.app iframe.
 *
 * The frame URL is embed.bsky.app/embed/<did>/app.bsky.feed.post/<rkey>.
 * A post URL that names the author by DID needs no lookup; a handle URL is
 * resolved to its DID with one request to the public AppView
 * (public.api.bsky.app) on activation. No oEmbed HTML, no embed.js.
 * Themeable (colorMode=light|dark).
 */

import { createEmbedFrame, parseHttpsUrl, messageData, frameId, POST_SANDBOX } from '../shared.js';

const HOSTS = new Set(['bsky.app']);
const PATH = /^\/profile\/([^/]{1,253})\/post\/([A-Za-z0-9._~:-]{1,512})\/?$/;
const DID = /^did:(?:plc:[a-z2-7]{24}|web:[A-Za-z0-9.-]{1,253})$/;
const HANDLE = /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z][A-Za-z0-9-]{0,62}$/;
const FRAME_HOST = 'embed.bsky.app';
const RESOLVE = 'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle';

/**
 * @param {string} url
 * @returns {{ actor: string, did: string | null, rkey: string } | null}
 */
export function parseBlueskyUrl(url) {
  const u = parseHttpsUrl(url, HOSTS);
  const m = u && PATH.exec(u.pathname);
  if (!m) return null;
  const actor = decodeURIComponent(m[1]);
  if (DID.test(actor)) return { actor, did: actor, rkey: m[2] };
  if (HANDLE.test(actor)) return { actor, did: null, rkey: m[2] };
  return null;
}

/**
 * @param {string} handle
 * @returns {Promise<string>}
 */
async function resolveHandle(handle) {
  const res = await fetch(`${RESOLVE}?${new URLSearchParams({ handle })}`);
  if (!res.ok) throw new Error(`Bluesky handle lookup failed (${res.status})`);
  const { did } = await res.json();
  if (typeof did !== 'string' || !DID.test(did)) throw new Error('Bluesky handle lookup returned no DID');
  return did;
}

export const BlueskyProvider = {
  label: 'Bluesky',
  themeable: true,
  canHandle: (/** @type {string} */ url) => !!parseBlueskyUrl(url),
  frameHost: () => FRAME_HOST,

  /**
   * @param {HTMLElement} _host
   * @param {string} url
   * @param {{ theme: 'light' | 'dark', title: string }} opts
   */
  async render(_host, url, { theme, title }) {
    const post = parseBlueskyUrl(url);
    if (!post) throw new Error('Not a Bluesky post URL');
    const did = post.did ?? await resolveHandle(post.actor);
    const id = frameId();
    const src = new URL(`https://${FRAME_HOST}/embed/${did}/app.bsky.feed.post/${post.rkey}`);
    src.searchParams.set('id', id);
    src.searchParams.set('colorMode', theme);
    return createEmbedFrame({
      src, title, sandbox: [...POST_SANDBOX], height: 320,
      // { id, height }
      measure(data) {
        const msg = messageData(data);
        return msg?.id === id ? msg.height : null;
      },
    });
  },
};
