/**
 * Token-budget heuristics for Chrome built-in AI components.
 *
 * Gemini Nano's context window is small (~4–6k tokens). We don't have a
 * tokenizer in-browser, so callers use a chars/4 estimate to gate UX warnings
 * (e.g. "this page is large; conversation room is limited").
 */

/** Soft cap (in characters) above which `<ai-chat>` warns the user.
 *  6000 chars ≈ 1500 tokens, leaving real room for the conversation. */
export const NANO_CONTEXT_BUDGET = 6000;

/**
 * Rough token count via the standard chars/4 heuristic.
 * @param {string | null | undefined} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / 4);
}
