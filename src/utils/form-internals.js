/**
 * Form-associated custom element ARIA helpers
 *
 * Firefox does not yet support ARIA reflection on ElementInternals.
 * These utilities set ARIA properties via internals when supported,
 * falling back to host element attributes.
 */

export function setAriaProperty(element, internals, prop, value) {
  const ariaProp = `aria${prop.charAt(0).toUpperCase()}${prop.slice(1)}`;
  if (ariaProp in ElementInternals.prototype) {
    internals[ariaProp] = value;
  } else {
    element.setAttribute(`aria-${prop}`, value);
  }
}

export function setRole(element, internals, role) {
  if ('role' in ElementInternals.prototype) {
    internals.role = role;
  } else {
    element.setAttribute('role', role);
  }
}
