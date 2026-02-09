/**
 * hotkey-wc: Keyboard shortcut display
 *
 * Parses a key combination string and renders platform-aware
 * <kbd> elements. On Mac, "meta" shows ⌘; on other platforms, "Ctrl".
 *
 * @attr {string} data-keys - Key combo string (e.g., "meta+k", "ctrl+shift+p")
 *
 * @example
 * <hotkey-wc data-keys="meta+k">Ctrl+K</hotkey-wc>
 */
class HotkeyWc extends HTMLElement {
  static #isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '');

  static #SYMBOLS = {
    mac: { meta: '⌘', alt: '⌥', shift: '⇧', ctrl: '⌃' },
    other: { meta: 'Ctrl', alt: 'Alt', shift: 'Shift', ctrl: 'Ctrl' }
  };

  connectedCallback() {
    const combo = this.dataset.keys;
    if (!combo) return;

    const map = HotkeyWc.#isMac ? HotkeyWc.#SYMBOLS.mac : HotkeyWc.#SYMBOLS.other;
    const keys = combo.toLowerCase().split('+').map(k => k.trim());

    const fragment = document.createDocumentFragment();
    keys.forEach((key, i) => {
      const kbd = document.createElement('kbd');
      kbd.textContent = map[key] ?? key.toUpperCase();
      fragment.appendChild(kbd);

      if (i < keys.length - 1 && !HotkeyWc.#isMac) {
        fragment.appendChild(document.createTextNode('+'));
      }
    });

    this.replaceChildren(fragment);
    this.setAttribute('aria-label', this.textContent);
  }
}

customElements.define('hotkey-wc', HotkeyWc);
export { HotkeyWc };
