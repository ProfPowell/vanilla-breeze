/**
 * Platform definitions for share-wc
 *
 * Each entry provides: label, iconName, optional iconSet,
 * and a buildUrl function that returns the share URL.
 *
 * @typedef {{ label: string, iconName: string, iconSet?: string, buildUrl: (opts: { url: string, title: string, text: string }) => string }} Platform
 */

/** @type {Map<string, Platform>} */
const PLATFORMS = new Map([
  ['x', {
    label: 'X',
    iconName: 'twitter',
    buildUrl: ({ url, title }) =>
      `https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}`,
  }],
  ['twitter', {
    label: 'X',
    iconName: 'twitter',
    buildUrl: ({ url, title }) =>
      `https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}`,
  }],
  ['facebook', {
    label: 'Facebook',
    iconName: 'facebook',
    buildUrl: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  }],
  ['linkedin', {
    label: 'LinkedIn',
    iconName: 'linkedin',
    buildUrl: ({ url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
  }],
  ['whatsapp', {
    label: 'WhatsApp',
    iconName: 'whatsapp',
    iconSet: 'custom',
    buildUrl: ({ url, title }) =>
      `https://wa.me/?text=${enc(`${title} ${url}`)}`,
  }],
  ['telegram', {
    label: 'Telegram',
    iconName: 'telegram',
    iconSet: 'custom',
    buildUrl: ({ url, title }) =>
      `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
  }],
  ['bluesky', {
    label: 'Bluesky',
    iconName: 'bluesky',
    iconSet: 'custom',
    buildUrl: ({ url, title }) =>
      `https://bsky.app/intent/compose?text=${enc(`${title} ${url}`)}`,
  }],
  ['mastodon', {
    label: 'Mastodon',
    iconName: 'mastodon',
    iconSet: 'custom',
    buildUrl: ({ url, title }, instance = 'mastodon.social') =>
      `https://${instance}/share?text=${enc(`${title} ${url}`)}`,
  }],
  ['email', {
    label: 'Email',
    iconName: 'mail',
    buildUrl: ({ url, title, text }) =>
      `mailto:?subject=${enc(title)}&body=${enc(`${text}\n\n${url}`)}`,
  }],
  ['copy', {
    label: 'Copy link',
    iconName: 'link',
    buildUrl: () => '',
  }],
]);

const DEFAULT_PLATFORMS = 'x,linkedin,bluesky,mastodon,whatsapp,email,copy';

function enc(str) {
  return encodeURIComponent(str);
}

export { PLATFORMS, DEFAULT_PLATFORMS };
