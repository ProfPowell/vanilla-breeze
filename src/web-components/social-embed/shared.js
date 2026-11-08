/**
 * Shared helpers for <social-embed> and its providers.
 *
 * Lives in its own module so the built-in providers can import it without
 * importing logic.js: logic.js imports the providers, registers them, and only
 * then defines the element. A provider that imported logic.js would make that
 * a cycle and push provider registration after customElements.define — every
 * parsed <social-embed> would upgrade against an empty registry.
 *
 * Security contract for built-in providers: never insert third-party HTML and
 * never inject third-party script. A provider parses the URL with new URL(),
 * accepts only https and an exact hostname allowlist, rebuilds the embed URL
 * from validated parts, and returns a sandboxed <iframe> from createEmbedFrame().
 */

/** @type {Map<string, Promise<void>>} */
const scriptCache = new Map();

/**
 * Load a script idempotently. Concurrent calls share one promise; a failed
 * load is evicted from the cache so a later call can retry.
 *
 * Built-in providers do not use this (they render sandboxed iframes). It is
 * exported for custom providers that deliberately accept a first-party SDK.
 * @param {string} src
 * @returns {Promise<void>}
 */
export function loadScript(src) {
  const cached = scriptCache.get(src);
  if (cached) return cached;
  /** @type {HTMLScriptElement} */
  const el = document.createElement('script');
  const p = new Promise((resolve, reject) => {
    el.src = src;
    el.async = true;
    el.onload = () => resolve(undefined);
    el.onerror = () => {
      scriptCache.delete(src);
      el.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(el);
  });
  scriptCache.set(src, /** @type {Promise<void>} */ (p));
  return /** @type {Promise<void>} */ (p);
}

/**
 * Fetch oEmbed JSON from an endpoint. Never insert the returned `html` with
 * innerHTML: use its metadata, or sanitize it (src/lib/sanitize-html.js).
 * @param {string} endpoint - oEmbed API base URL
 * @param {string} url - Content URL to embed
 * @param {Record<string, string>} [params] - Additional query params
 * @returns {Promise<{ html?: string, [key: string]: unknown }>}
 */
export async function fetchOEmbed(endpoint, url, params = {}) {
  const query = new URLSearchParams({ url, format: 'json', ...params });
  const res = await fetch(`${endpoint}?${query}`);
  if (!res.ok) throw new Error(`oEmbed error ${res.status}`);
  return res.json();
}

/**
 * Parse an https URL whose hostname is in `hosts` (exact match, lower-case).
 * Rejects other schemes, credentials and non-default ports.
 * @param {string} raw
 * @param {Set<string> | null} hosts - null accepts any hostname (Mastodon)
 * @returns {URL | null}
 */
export function parseHttpsUrl(raw, hosts) {
  let u;
  try { u = new URL(String(raw ?? '').trim()); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  if (hosts && !hosts.has(u.hostname)) return null;
  return u;
}

/**
 * @typedef {object} FrameMeta
 * @property {string} origin - Expected origin of messages from the frame
 * @property {(data: any) => number | null | undefined} [measure] - Height from a frame message
 */

/** @type {WeakMap<HTMLIFrameElement, FrameMeta>} */
const FRAME_META = new WeakMap();

/**
 * @param {HTMLIFrameElement} frame
 * @returns {FrameMeta | undefined}
 */
export const frameMeta = (frame) => FRAME_META.get(frame);

/** Largest height a frame may ask for (px). */
const MAX_HEIGHT = 5000;

/**
 * Parse a postMessage payload that may be a JSON string.
 * @param {unknown} data
 * @returns {any}
 */
export function messageData(data) {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return null; }
  }
  return data && typeof data === 'object' ? data : null;
}

/**
 * Apply a height a frame reported, if it is a sane number.
 * @param {HTMLIFrameElement} frame
 * @param {unknown} value
 */
export function applyFrameHeight(frame, value) {
  const h = Number(value);
  if (!Number.isFinite(h) || h <= 0) return;
  frame.height = String(Math.ceil(Math.min(h, MAX_HEIGHT)));
}

/**
 * Build a sandboxed, lazily loaded embed iframe.
 *
 * @param {object} opts
 * @param {URL} opts.src - Embed URL, rebuilt from validated parts
 * @param {string} opts.title - Accessible name of the frame
 * @param {string[]} opts.sandbox - Sandbox tokens (keep minimal)
 * @param {string} [opts.allow] - Permissions policy (default: none)
 * @param {number} [opts.height] - Initial height before the frame reports one
 * @param {FrameMeta['measure']} [opts.measure] - Read a height from a frame message
 * @param {(frame: HTMLIFrameElement) => void} [opts.onload] - Runs on each frame load
 * @returns {HTMLIFrameElement}
 */
export function createEmbedFrame({ src, title, sandbox, allow = '', height = 400, measure, onload }) {
  if (!(src instanceof URL) || src.protocol !== 'https:') {
    throw new Error('social-embed: embed frames must use an https URL');
  }
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', sandbox.join(' '));
  frame.setAttribute('referrerpolicy', 'strict-origin');
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('title', title);
  if (allow) frame.setAttribute('allow', allow);
  frame.setAttribute('data-embed-frame', '');
  frame.height = String(height);
  if (onload) frame.addEventListener('load', () => onload(frame));
  frame.src = src.href;
  FRAME_META.set(frame, { origin: src.origin, measure });
  return frame;
}

/** Sandbox tokens shared by the built-in post embeds. */
export const POST_SANDBOX = Object.freeze([
  'allow-scripts', 'allow-same-origin', 'allow-popups', 'allow-popups-to-escape-sandbox',
]);

/**
 * Random id for frames whose resize protocol is keyed by id.
 * @returns {string}
 */
export const frameId = () => String(crypto.getRandomValues(new Uint32Array(1))[0]);
