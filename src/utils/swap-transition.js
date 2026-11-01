/**
 * Wrap a DOM mutation in a View Transition when supported
 * @returns {ViewTransition | any} The ViewTransition, or the callback's return value when unsupported.
 */
export function startSwapTransition(callback) {
  if (!document.startViewTransition) return callback();
  return document.startViewTransition(callback);
}
