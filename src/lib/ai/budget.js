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

/** Soft cap (in characters) on the content handed to the on-device
 *  Summarizer when the browser can't measure the real input quota.
 *  16000 chars ≈ 4000 tokens, roughly Nano's input window. */
export const SUMMARIZER_CHAR_BUDGET = 16000;

/** Character budget for the conversation history `<ai-chat>` sends to an
 *  endpoint (`messages[]`, AI page-tools v1.1). Keeps request bodies bounded
 *  on long sessions; the server decides what to do with what it gets. */
export const HISTORY_CHAR_BUDGET = 12000;

/** Hard cap on the number of history entries sent, whatever their size. */
export const HISTORY_MAX_MESSAGES = 20;

/**
 * Keep the most recent conversation turns that fit a character budget.
 *
 * Walks backwards from the newest entry and stops at the first one that
 * would overflow `maxChars` or `maxMessages`, so the result is always a
 * contiguous, chronologically ordered tail. A leading assistant entry is
 * dropped so the history never opens mid-exchange.
 *
 * @template {{ role: string, content: string }} M
 * @param {M[]} messages  Oldest first.
 * @param {{ maxChars?: number, maxMessages?: number }} [opts]
 * @returns {M[]}
 */
export function trimHistory(messages, { maxChars = HISTORY_CHAR_BUDGET, maxMessages = HISTORY_MAX_MESSAGES } = {}) {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const out = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const len = String(m?.content ?? '').length;
    if (out.length >= maxMessages || used + len > maxChars) break;
    out.unshift(m);
    used += len;
  }
  while (out.length && out[0].role === 'assistant') out.shift();
  return out;
}

/**
 * Trim text so its measured input usage fits a quota.
 *
 * `usage` and `quota` come from the Writing Assistance APIs
 * (`measureInputUsage()` / `inputQuota`), whose units are opaque tokens; the
 * cut is proportional with a 5% safety margin. Returns the text unchanged
 * when it already fits or the numbers are unusable.
 *
 * @param {string} text
 * @param {number} usage
 * @param {number} quota
 * @returns {string}
 */
export function fitToQuota(text, usage, quota) {
  const s = String(text ?? '');
  if (!(usage > 0) || !(quota > 0) || !Number.isFinite(quota) || usage <= quota) return s;
  const keep = Math.floor(s.length * (quota / usage) * 0.95);
  return s.slice(0, Math.max(0, keep));
}
