/**
 * Shared utilities for UX planning web components
 * (user-persona, user-story, user-journey, empathy-map, impact-effort, story-map)
 *
 * Shadow DOM components extend HTMLElement directly.
 * Light DOM components (impact-effort, story-map) extend VBElement.
 */

/**
 * HTML-escape a string to prevent XSS in shadow DOM innerHTML.
 * @param {string} s
 * @returns {string}
 */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Extract up to 2 initials from a name.
 * @param {string} name
 * @returns {string}
 */
export function initials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a deterministic HSL color from a name string.
 * @param {string} name
 * @returns {string} HSL color string
 */
export function hashColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/**
 * Emotion metadata used by user-journey (and potentially other planning components).
 * Maps emotion names to emoji, normalized score (0–1), and color.
 */
/**
 * Build a Lucide-style inline SVG string (24x24, stroke-based).
 * @param {string} inner - SVG child elements (path, circle, line, etc.)
 * @returns {string}
 */
export function lucideSvg(inner) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

/** Shared Lucide SVG fragments for reuse across UX components. */
export const UX_ICONS = {
  user:          '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  pencil:        '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  check:         '<path d="M20 6 9 17l-5-5"/>',
  target:        '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  alertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  messageCircle: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
  lightbulb:     '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  wrench:        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',
  heart:         '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
};

/**
 * Empathy map quadrant metadata used by empathy-map.
 * Maps quadrant keys to label, Lucide SVG icon inner content, and accent color.
 */
export const QUADRANT_META = {
  says:   { label: 'Says',   icon: UX_ICONS.messageCircle, color: '#3b82f6' },
  thinks: { label: 'Thinks', icon: UX_ICONS.lightbulb,     color: '#8b5cf6' },
  does:   { label: 'Does',   icon: UX_ICONS.wrench,        color: '#f59e0b' },
  feels:  { label: 'Feels',  icon: UX_ICONS.heart,         color: '#ef4444' },
};

/**
 * Emotion metadata used by user-journey (and potentially other planning components).
 * Maps emotion names to emoji, normalized score (0–1), and color.
 */
export const EMOTION_META = {
  delighted:  { emoji: '😄', score: 0.95, color: '#16a34a' },
  satisfied:  { emoji: '😊', score: 0.80, color: '#22c55e' },
  hopeful:    { emoji: '🙂', score: 0.68, color: '#84cc16' },
  curious:    { emoji: '🤔', score: 0.55, color: '#eab308' },
  neutral:    { emoji: '😐', score: 0.50, color: '#94a3b8' },
  uncertain:  { emoji: '😕', score: 0.40, color: '#f97316' },
  confused:   { emoji: '😵', score: 0.30, color: '#fb923c' },
  frustrated: { emoji: '😤', score: 0.18, color: '#ef4444' },
  angry:      { emoji: '😠', score: 0.05, color: '#dc2626' },
};
