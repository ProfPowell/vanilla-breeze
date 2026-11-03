/**
 * Shadow DOM styles for geo-map component.
 *
 * Adopted as a constructable stylesheet (no inline <style>, so a CSP
 * without style-src 'unsafe-inline' still works); `<style>` is only the
 * fallback for engines without adoptedStyleSheets.
 */
const styles = `
:host {
  display: block;
  position: relative;
  overflow: hidden;
  height: var(--geo-map-height, 300px);
  border-radius: var(--geo-map-border-radius, 0.5rem);
  /* Loading-state placeholder gradient — derived from VB surface tokens
     so it shifts with the active theme rather than freezing on grey. */
  background: linear-gradient(
    135deg,
    var(--color-surface-raised, #e8e8e8) 0%,
    var(--color-surface-sunken, var(--color-border, #d0d0d0)) 100%
  );
  color-scheme: light dark;
}

[part="container"] {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Stationary viewport (focus target in interactive mode); the tiles layer
   inside it is translated. Tiles are always physically laid out (a map
   is not mirrored in RTL). */
[part="viewport"] {
  position: absolute;
  inset: 0;
  overflow: hidden;
  direction: ltr;
}

[part="viewport"]:focus-visible {
  outline: 2px solid var(--color-interactive, var(--color-primary, Highlight));
  outline-offset: -4px;
}

[part="tiles"] {
  position: absolute;
  top: 0;
  left: 0;
}

[part="tiles"] img {
  position: absolute;
  display: block;
  width: 256px;
  height: 256px;
  max-width: none;
  -webkit-user-drag: none;
  user-select: none;
}

/* Marker — fill follows marker-color (validated, set as --_marker-color),
   then --geo-map-marker-color, then the theme's error/danger token. */
[part="marker"] {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--geo-map-marker-size, 32px);
  height: var(--geo-map-marker-size, 32px);
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.3));
  pointer-events: none;
  z-index: 2;
}

[part="marker"] svg {
  display: block;
  width: 100%;
  height: 100%;
}

[part="marker"] .pin {
  fill: var(--_marker-color, var(--geo-map-marker-color, var(--color-error, #c0392b)));
}

[part="marker"] .dot {
  fill: var(--geo-map-marker-dot-color, #fff);
  opacity: 0.9;
}

/* Caption (slot projection). Translucent surface over the map; uses
   light-dark() so the pair switches automatically with the page's
   resolved color-scheme (driven by VB tokens). */
[part="caption"] {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  background: var(--geo-map-caption-bg, light-dark(rgb(255 255 255 / 0.9), rgb(0 0 0 / 0.75)));
  color: var(--geo-map-caption-color, var(--color-text, light-dark(#1a1a1a, #e0e0e0)));
  padding: var(--geo-map-caption-padding, 0.5rem 0.75rem);
  font-size: 0.875rem;
  /* Above the activation overlay so links in the caption stay usable */
  z-index: 6;
}

[part="container"]:not([data-caption]) [part="caption"] {
  display: none;
}

/* Attribution — translucent surface over the map; same pattern as caption */
[part="attribution"] {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  padding: 2px 5px;
  font-size: var(--geo-map-attribution-font-size, 0.625rem);
  background: var(--geo-map-attribution-bg, light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.6)));
  color: var(--geo-map-attribution-color, var(--color-text, light-dark(#333, #ddd)));
  z-index: 7;
  line-height: 1.4;
}

[part="attribution"][hidden] {
  display: none;
}

[part="attribution"] a {
  color: inherit;
  text-decoration: none;
}

[part="attribution"] a:hover,
[part="attribution"] a:focus-visible {
  text-decoration: underline;
}

/* When caption is present, shift attribution above it */
[part="container"][data-caption] [part="attribution"] {
  inset-block-end: auto;
  inset-block-start: 0;
}

/* Overlay — the whole surface is the activation target; faded in on
   hover/focus for mouse users, always visible on touch (no hover). */
[part="overlay"] {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem 1rem;
  text-align: center;
  background: var(--geo-map-overlay-bg, rgb(0 0 0 / 0.35));
  color: var(--geo-map-overlay-color, var(--color-text-inverted, #fff));
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

[part="overlay"]:hover,
[part="overlay"]:focus-within,
[part="container"][data-consent] [part="overlay"] {
  opacity: 1;
}

@media (hover: none) {
  [part="overlay"] {
    opacity: 1;
    background: transparent;
  }

}

[part="activate"] {
  background: var(--geo-map-activate-bg, rgb(0 0 0 / 0.6));
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

[part="activate"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}

[part="consent-note"] {
  margin: 0;
  font-size: 0.75rem;
}

/* Consent placeholder — no tiles yet; keep the overlay readable */
[part="container"][data-consent] [part="overlay"] {
  background: var(--geo-map-consent-bg, light-dark(rgb(255 255 255 / 0.6), rgb(0 0 0 / 0.5)));
  color: var(--geo-map-consent-color, var(--color-text, light-dark(#1a1a1a, #e0e0e0)));
}

[part="container"][data-consent] [part="activate"] {
  background: var(--color-interactive, var(--color-primary, #1a5fb4));
  color: var(--color-text-on-primary, var(--color-text-inverted, #fff));
}

[part="container"][data-consent] [part="marker"] {
  display: none;
}

[part="container"][data-consent][data-caption] [part="overlay"] {
  padding-block-end: 4rem;
}

/* On-screen controls (interactive mode) */
[part="controls"] {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  z-index: 6;
  display: none;
  flex-direction: column;
  gap: 2px;
}

[part="container"][data-active] [part="controls"] {
  display: flex;
}

[part~="control"] {
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  display: grid;
  place-items: center;
  padding: 0 0.5rem;
  border: 1px solid var(--color-border, rgb(0 0 0 / 0.2));
  border-radius: var(--radius-s, 0.25rem);
  background: var(--color-surface, light-dark(#fff, #1e1e1e));
  color: var(--color-text, light-dark(#1a1a1a, #e0e0e0));
  font: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

[part~="control"]:hover {
  background: var(--color-surface-raised, light-dark(#f2f2f2, #2a2a2a));
}

[part~="control"]:focus-visible {
  outline: 2px solid var(--color-interactive, var(--color-primary, Highlight));
  outline-offset: 1px;
}

[part~="control"]:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Interactive mode */
[part="container"][data-active] [part="viewport"] {
  cursor: grab;
  touch-action: none;
}

[part="container"][data-active] [part="viewport"][data-dragging] {
  cursor: grabbing;
}

[part="container"][data-active] [part="overlay"] {
  display: none;
}

/* Visually hidden live region */
[part="status"] {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Reduced motion — disable transitions */
@media (prefers-reduced-motion: reduce) {
  [part="overlay"] {
    transition: none;
  }
}

/* Error state */
[part="container"][data-state="error"] [part="tiles"] {
  display: none;
}

[part="container"][data-state="error"]::after {
  content: attr(data-error);
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #666);
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
}

@media (forced-colors: active) {
  [part~="control"],
  [part="activate"] {
    border: 1px solid ButtonText;
  }
}
`;

/** @type {CSSStyleSheet | null} */
let sheet = null;

/**
 * Apply the component styles to a shadow root — a shared constructable
 * stylesheet where supported, else a <style> element (textContent).
 *
 * @param {ShadowRoot} root
 * @returns {HTMLStyleElement | null} The fallback <style> to (re)insert, or null.
 */
function adoptStyles(root) {
    if ('adoptedStyleSheets' in root && typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype) {
        if (!sheet) {
            sheet = new CSSStyleSheet();
            sheet.replaceSync(styles);
        }
        if (!root.adoptedStyleSheets.includes(sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        return null;
    }
    const style = document.createElement('style');
    style.textContent = styles;
    return style;
}

export { styles, adoptStyles };
