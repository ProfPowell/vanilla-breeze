/**
 * links-init: rel-aware link enhancements
 *
 * Treats <a rel="..."> as the native vocabulary of link intent and
 * makes the opener policy of new-tab links explicit:
 *
 *   upgradeBlankTargets(root)
 *     For every <a href target="_blank"> that doesn't already declare
 *     an opener policy, add rel="noopener". Idempotent — running twice
 *     produces the same result. Honors opt-in privacy mode (see below).
 *
 * Runs once on load for the links already in the page. Links added later
 * are upgraded when they are activated (see the listeners at the bottom).
 *
 * Privacy mode: when <html data-link-privacy="strict">, upgraded links
 * also gain noreferrer. Opt-in because some flows (referral analytics,
 * affiliate tracking) legitimately depend on Referer.
 *
 * See /docs/content-management/link-relations/ for vocabulary + philosophy.
 */

const SAFE_OPENER_TOKENS = new Set(['opener', 'noopener', 'noreferrer']);
const BLANK_LINK = 'a[href][target="_blank"]';

function relTokens(anchor) {
  return new Set((anchor.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
}

function writeRel(anchor, tokens) {
  anchor.setAttribute('rel', [...tokens].join(' '));
}

/** @param {Element} anchor */
function upgradeAnchor(anchor) {
  const strict = document.documentElement?.dataset?.linkPrivacy === 'strict';
  const tokens = relTokens(anchor);
  const hasOpenerPolicy = [...tokens].some(t => SAFE_OPENER_TOKENS.has(t));
  let changed = false;
  if (!hasOpenerPolicy) {
    tokens.add('noopener');
    changed = true;
  }
  if (strict && !tokens.has('noreferrer')) {
    tokens.add('noreferrer');
    changed = true;
  }
  if (changed) writeRel(anchor, tokens);
}

/**
 * Add rel="noopener" to every <a target="_blank"> that doesn't already
 * carry an explicit opener-related policy. Optionally add noreferrer
 * when document-level privacy mode is strict.
 * @param {ParentNode} [root] Subtree to scan; defaults to document.
 */
export function upgradeBlankTargets(root = document) {
  for (const anchor of root.querySelectorAll(BLANK_LINK)) upgradeAnchor(anchor);
}

// Auto-run the safety upgrade on module load.
upgradeBlankTargets(document);

// Links added after load: upgrade at activation, in the capture phase, so
// rel is in place before the browser navigates. Keyboard activation fires
// click; a middle click fires auxclick. Cheaper than observing every mutation.
/** @param {Event} event */
function upgradeOnActivate(event) {
  const origin = event.composedPath?.()[0] ?? event.target;
  const anchor = origin instanceof Element ? origin.closest(BLANK_LINK) : null;
  if (anchor) upgradeAnchor(anchor);
}
document.addEventListener('click', upgradeOnActivate, true);
document.addEventListener('auxclick', upgradeOnActivate, true);
