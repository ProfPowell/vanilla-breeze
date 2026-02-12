/**
 * command-init: Auto-discovery for [data-command] and [commandfor] elements
 *
 * Follows the established *-init.js pattern: auto-init on DOMContentLoaded,
 * MutationObserver for dynamic changes. Maintains a live registry of
 * discoverable commands that command-wc can consume via data-discover.
 *
 * @attr {string} data-command - Label in the command palette (required to opt in)
 * @attr {string} data-command-group - Group name (default: "Page Actions")
 * @attr {string} data-command-icon - Icon name for icon-wc in palette (optional)
 * @attr {string} data-shortcut - Keyboard shortcut — displayed AND bound
 *
 * @example
 * <button data-command="Toggle Dark Mode" data-shortcut="meta+shift+t">Dark Mode</button>
 * <a href="/docs" data-command="Documentation" data-command-group="Navigation">Docs</a>
 */

import { bindHotkey } from './hotkey-bind.js';

const SELECTOR = '[data-command], [commandfor]';
const DEFAULT_GROUP = 'Page Actions';

/**
 * @typedef {{ element: Element, label: string, group: string, icon: string|null, shortcut: string|null, unbind: Function|null }} CommandEntry
 */

/** @type {Map<Element, CommandEntry>} */
const registry = new Map();

/**
 * Register a single element as a command
 * @param {Element} el
 */
function registerCommand(el) {
  if (registry.has(el)) return;
  if (el.hasAttribute('data-command-init')) return;
  el.setAttribute('data-command-init', '');

  // Derive label: data-command attribute or textContent for [commandfor]
  const label = el.getAttribute('data-command') ||
    el.textContent.trim();
  if (!label) return;

  const group = el.getAttribute('data-command-group') || DEFAULT_GROUP;
  const icon = el.getAttribute('data-command-icon') || null;
  const shortcut = el.getAttribute('data-shortcut') || null;

  let unbind = null;
  if (shortcut) {
    unbind = bindHotkey(shortcut, () => el.click());
  }

  const entry = { element: el, label, group, icon, shortcut, unbind };
  registry.set(el, entry);

  document.dispatchEvent(new CustomEvent('command-registry-change', {
    detail: { action: 'add', entry }
  }));
}

/**
 * Unregister a command element
 * @param {Element} el
 */
function unregisterCommand(el) {
  const entry = registry.get(el);
  if (!entry) return;
  entry.unbind?.();
  registry.delete(el);
  el.removeAttribute('data-command-init');

  document.dispatchEvent(new CustomEvent('command-registry-change', {
    detail: { action: 'remove', element: el }
  }));
}

/**
 * Get all registered commands grouped by their group name
 * @returns {Map<string, CommandEntry[]>}
 */
function getRegisteredCommands() {
  const grouped = new Map();
  for (const entry of registry.values()) {
    // Skip hidden/disabled elements
    if (entry.element.hidden || entry.element.closest('[hidden]')) continue;

    const list = grouped.get(entry.group) || [];
    list.push(entry);
    grouped.set(entry.group, list);
  }
  return grouped;
}

/**
 * Initialize command discovery within a root element
 * @param {Element|Document} root
 */
function initCommands(root = document) {
  root.querySelectorAll(SELECTOR).forEach(registerCommand);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initCommands());
} else {
  initCommands();
}

// Watch for dynamically added/removed command elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // Handle added nodes
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) registerCommand(node);
      node.querySelectorAll?.(SELECTOR).forEach(registerCommand);
    }

    // Handle removed nodes
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (registry.has(node)) unregisterCommand(node);
      node.querySelectorAll?.(SELECTOR).forEach(el => {
        if (registry.has(el)) unregisterCommand(el);
      });
    }

    // Handle attribute changes (data-command added/removed)
    if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
      const el = mutation.target;
      if (el.matches(SELECTOR) && !registry.has(el)) {
        registerCommand(el);
      } else if (!el.matches(SELECTOR) && registry.has(el)) {
        unregisterCommand(el);
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-command', 'commandfor']
});

// Expose for command-wc lazy access (avoids circular imports)
window.__commandRegistry = { getRegisteredCommands };

export { getRegisteredCommands, initCommands };
