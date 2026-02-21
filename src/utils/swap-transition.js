/** Wrap a DOM mutation in a View Transition when supported */
export function startSwapTransition(callback) {
  if (!document.startViewTransition) return callback();
  return document.startViewTransition(callback);
}
