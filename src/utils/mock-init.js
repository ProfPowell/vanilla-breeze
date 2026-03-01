/**
 * mock-init: Placeholder media via data-mock attribute
 *
 * Enhances <img>, <video>, <iframe>, and <canvas> elements with data-mock
 * to render placeholder content. CSS handles visual styling; JS generates
 * valid src/poster/srcdoc content so elements render correctly.
 *
 * @attr {string} data-mock - Preset name or empty for generic placeholder
 * @attr {string} data-seed - Reproducible seed for photo service (picsum)
 *
 * @example Simple placeholder
 * <img data-mock width="400" height="300" alt="Hero banner">
 *
 * @example Preset
 * <img data-mock="avatar" alt="User photo">
 *
 * @example Photo from picsum
 * <img data-mock="photo" width="400" height="300" alt="Product shot">
 */

const SELECTOR = ':is(img, video, iframe, canvas)[data-mock]';

const PRESETS = {
  hero:      { w: 1200, h: 400 },
  card:      { w: 400,  h: 225 },
  avatar:    { w: 48,   h: 48 },
  product:   { w: 400,  h: 400 },
  thumbnail: { w: 150,  h: 150 },
  logo:      { w: 200,  h: 50 },
  og:        { w: 1200, h: 630 },
  banner:    { w: 728,  h: 90 },
};

/**
 * Escape XML special characters for SVG text
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate an inline SVG data URI placeholder
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {string} label - Center label text
 * @returns {string} Data URI
 */
function placeholderSvg(w, h, label) {
  const fontSize = Math.min(Math.max(w / 15, 12), 32);
  const cx = w / 2;
  const cy = h / 2;
  const safeLabel = label ? escapeXml(label) : '';

  const textEl = safeLabel
    ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="${fontSize}" fill="#6b7280">${safeLabel}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f3f4f6"/><line x1="0" y1="0" x2="${w}" y2="${h}" stroke="#d1d5db"/><line x1="${w}" y1="0" x2="0" y2="${h}" stroke="#d1d5db"/>${textEl}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Get dimensions for an element, falling back to preset or defaults
 * @param {HTMLElement} el
 * @returns {{ w: number, h: number }}
 */
function getDimensions(el) {
  const preset = PRESETS[el.dataset.mock];
  const w = Number(el.getAttribute('width')) || preset?.w || 400;
  const h = Number(el.getAttribute('height')) || preset?.h || 300;
  return { w, h };
}

/**
 * Enhance a single element with mock behavior
 * @param {HTMLElement} el
 */
function enhanceMock(el) {
  if (el.hasAttribute('data-mock-init')) return;
  el.setAttribute('data-mock-init', '');

  const tag = el.tagName.toLowerCase();
  const variant = el.dataset.mock;
  const { w, h } = getDimensions(el);

  if (tag === 'img') {
    if (variant === 'photo') {
      const seed = el.dataset.seed;
      const base = seed
        ? `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
        : `https://picsum.photos/${w}/${h}`;
      if (!el.getAttribute('src')) {
        el.setAttribute('src', base);
        el.setAttribute('loading', 'lazy');
      }
    } else if (variant === 'placehold') {
      if (!el.getAttribute('src')) {
        const text = el.getAttribute('alt') || '';
        const params = text ? `?text=${encodeURIComponent(text)}` : '';
        el.setAttribute('src', `https://placehold.co/${w}x${h}${params}`);
        el.setAttribute('loading', 'lazy');
      }
    } else {
      // Standard placeholder — generate inline SVG
      if (!el.getAttribute('src')) {
        const label = el.getAttribute('alt') || `${w}\u00D7${h}`;
        el.setAttribute('src', placeholderSvg(w, h, label));
      }
    }
  } else if (tag === 'video') {
    // Set a poster with the placeholder SVG
    if (!el.getAttribute('poster')) {
      const label = el.getAttribute('alt') || el.getAttribute('title') || 'Video';
      el.setAttribute('poster', placeholderSvg(w, h, `\u25B6 ${label}`));
    }
  } else if (tag === 'iframe') {
    // Set srcdoc with centered label
    if (!el.getAttribute('src') && !el.getAttribute('srcdoc')) {
      const label = el.getAttribute('title') || 'Embedded content';
      el.setAttribute('srcdoc', `<!DOCTYPE html><html><body style="display:grid;place-items:center;height:100vh;margin:0;background:#f3f4f6;font-family:system-ui,sans-serif;color:#6b7280"><p>${escapeXml(label)}</p></body></html>`);
    }
  } else if (tag === 'canvas') {
    // Draw X-pattern + label on canvas
    drawCanvasPlaceholder(el, w, h);
  }
}

/**
 * Draw placeholder pattern on a canvas element
 * @param {HTMLCanvasElement} el
 * @param {number} w
 * @param {number} h
 */
function drawCanvasPlaceholder(el, w, h) {
  el.width = w;
  el.height = h;
  const ctx = el.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, w, h);

  // X-pattern
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, h);
  ctx.moveTo(w, 0);
  ctx.lineTo(0, h);
  ctx.stroke();

  // Label
  const label = el.getAttribute('aria-label') || el.getAttribute('title') || `${w}\u00D7${h}`;
  const fontSize = Math.min(Math.max(w / 15, 12), 32);
  ctx.fillStyle = '#6b7280';
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, h / 2);
}

/**
 * Initialize all mock media within a root element
 * @param {Element|Document} root
 */
function initMockMedia(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceMock);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initMockMedia());
} else {
  initMockMedia();
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceMock(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceMock);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initMockMedia };
