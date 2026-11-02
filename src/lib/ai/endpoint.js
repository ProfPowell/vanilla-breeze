/**
 * Inline programmatic fallback for AI page-tool components.
 *
 * When the local Chrome AI API isn't available but the author has configured
 * `endpoint="…"`, components POST a small JSON envelope and stream the
 * response back as text chunks. The async iterator shape matches Chrome's
 * `summarizeStreaming()` / `promptStreaming()` so component code looks the
 * same regardless of which provider won.
 *
 * Wire format
 * -----------
 * Request:
 *   POST {endpoint}
 *   Content-Type: application/json
 *   { "prompt": "...", "content": "..." (optional), "mode": "summarize" | "chat",
 *     "messages": [{ "role": "user" | "assistant", "content": "..." }] (optional, v1.1) }
 *
 *   `messages` carries the prior conversation turns (oldest first, excluding
 *   the current `prompt`). Servers that ignore it still work, single-turn.
 *
 * Response:
 *   200, Content-Type: text/plain  → chunked stream, yielded as decoded chunks
 *   200, Content-Type: application/json → { "text": "..." }, yielded once
 *
 * Anything else throws.
 */

/**
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.prompt]
 * @param {string} [options.content]
 * @param {string} [options.mode]
 * @param {Array<{ role: 'user'|'assistant', content: string }>} [options.messages]
 *   Prior turns, oldest first. Omitted from the body when absent.
 * @param {AbortSignal} [options.signal]
 * @returns {AsyncIterable<string>}
 */
export async function* callEndpoint(url, { prompt = '', content, mode, messages, signal } = {}) {
  /** @type {Record<string, unknown>} */
  const body = { prompt };
  if (content !== undefined) body.content = content;
  if (mode !== undefined) body.mode = mode;
  if (Array.isArray(messages)) body.messages = messages;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error(`AI endpoint ${url} returned ${res.status} ${res.statusText}`);
  }

  const ctype = (res.headers.get('content-type') || '').toLowerCase();

  if (ctype.includes('application/json')) {
    const data = await res.json();
    const text = typeof data?.text === 'string' ? data.text : '';
    if (text) yield text;
    return;
  }

  if (!res.body || typeof res.body.getReader !== 'function') {
    const text = await res.text();
    if (text) yield text;
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) yield chunk;
      }
    }
    const tail = decoder.decode();
    if (tail) yield tail;
  } finally {
    try { reader.releaseLock(); } catch { /* noop */ }
  }
}
