/**
 * links-init: rel-aware link enhancements
 *
 * Treats <a rel="..."> as the native vocabulary of link intent and
 * provides two passive helpers:
 *
 *   upgradeBlankTargets(root)
 *     For every <a href target="_blank"> that doesn't already declare
 *     an opener policy, add rel="noopener". Idempotent — running twice
 *     produces the same result. Honors opt-in privacy mode (see below).
 *
 *   collectLinksByRel(root)
 *     Returns Map<token, HTMLAnchorElement[]> so callers can ask
 *     "which links on this page are help links?" without re-querying.
 *
 * Privacy mode: when <html data-link-privacy="strict">, upgraded links
 * also gain noreferrer. Opt-in because some flows (referral analytics,
 * affiliate tracking) legitimately depend on Referer.
 *
 * See /docs/concepts/link-relations/ for vocabulary + philosophy.
 */

const SAFE_OPENER_TOKENS = new Set(['opener', 'noopener', 'noreferrer']);

function relTokens(anchor) {
  return new Set((anchor.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
}

function writeRel(anchor, tokens) {
  anchor.setAttribute('rel', [...tokens].join(' '));
}

/**
 * Add rel="noopener" to every <a target="_blank"> that doesn't already
 * carry an explicit opener-related policy. Optionally add noreferrer
 * when document-level privacy mode is strict.
 * @param {ParentNode} [root] Subtree to scan; defaults to document.
 */
export function upgradeBlankTargets(root = document) {
  const strict = document.documentElement?.dataset?.linkPrivacy === 'strict';
  for (const anchor of root.querySelectorAll('a[href][target="_blank"]')) {
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
}

/**
 * Group anchors by rel token so callers can query the document by intent.
 * @param {ParentNode} [root] Subtree to scan; defaults to document.
 * @returns {Map<string, HTMLAnchorElement[]>}
 */
export function collectLinksByRel(root = document) {
  const byToken = new Map();
  for (const anchor of root.querySelectorAll('a[rel]')) {
    for (const token of relTokens(anchor)) {
      const list = byToken.get(token) ?? [];
      list.push(anchor);
      byToken.set(token, list);
    }
  }
  return byToken;
}

// Auto-run the safety upgrade on module load.
upgradeBlankTargets(document);
