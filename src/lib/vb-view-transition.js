/**
 * viewTransitionSwap — wrap a DOM mutation in document.startViewTransition
 * so the swap crossfades instead of flashing.
 *
 * Falls back to a plain swap when:
 *   - the host is not connected,
 *   - startViewTransition is unavailable (e.g. Firefox today),
 *   - prefers-reduced-motion is set.
 *
 * Same pattern used inline by diagram-wc, flow-diagram, gantt-chart,
 * and site-map (vanilla-breeze-4tsb); extracted for the components
 * covered by vanilla-breeze-7ixr.
 *
 * @param {HTMLElement} host - Element to pin the transition to. The browser
 *   snapshots the host's painted area (including shadow content) and uses
 *   the unique view-transition-name to pair the old and new snapshots.
 * @param {() => void} swap - Synchronous DOM mutation. Runs before the
 *   browser captures the "new" snapshot.
 * @param {string} [prefix='vb-vt'] - Name prefix; aids debugging in DevTools.
 * @returns {ViewTransition | null} The live transition, or null when the
 *   fallback path was taken.
 */
let counter = 0;

export function viewTransitionSwap(host, swap, prefix = 'vb-vt') {
  if (
    !host?.isConnected
    || typeof document === 'undefined'
    || !('startViewTransition' in document)
    || matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    swap();
    return null;
  }
  const name = `${prefix}-${++counter}`;
  host.style.viewTransitionName = name;
  const tx = document.startViewTransition(swap);
  tx.finished.finally(() => {
    if (host.style.viewTransitionName === name) {
      host.style.viewTransitionName = '';
    }
  });
  return tx;
}
