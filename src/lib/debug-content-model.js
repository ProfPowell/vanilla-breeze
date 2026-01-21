/**
 * Content Model Validation for Vanilla Breeze components
 * Provides runtime validation with console warnings and visual feedback
 *
 * Activation:
 * - <html data-debug> attribute
 * - localStorage.setItem('vanillaBreeze.debug', 'true')
 */

const CONTENT_MODELS = {
  'semantic-card': {
    validChildren: ['header', 'section', 'footer'],
    validSlots: ['header', 'content', 'footer'],
    rules: {
      maxHeader: 1,
      maxFooter: 1,
      order: ['header', 'section', 'footer']
    }
  }
};

/**
 * Check if debug mode is enabled
 */
function isDebugEnabled() {
  return (
    document.documentElement.hasAttribute('data-debug') ||
    localStorage.getItem('vanillaBreeze.debug') === 'true'
  );
}

/**
 * Validate a single element against its content model
 */
function validateElement(element, tagName, model) {
  const errors = [];
  const children = Array.from(element.children);

  // Track counts and order
  const counts = { header: 0, section: 0, footer: 0 };
  const foundOrder = [];

  for (const child of children) {
    const childTag = child.tagName.toLowerCase();
    const slot = child.getAttribute('slot');

    // Check if it's a valid semantic child or has a valid slot
    if (model.validChildren.includes(childTag)) {
      counts[childTag]++;
      foundOrder.push(childTag);
      continue;
    }

    if (slot && model.validSlots.includes(slot)) {
      // Map slot to semantic equivalent for ordering
      const semanticEquiv = slot === 'content' ? 'section' : slot;
      foundOrder.push(semanticEquiv);
      continue;
    }

    // Non-semantic children without slots go to implicit content area
    // This is valid behavior, no error needed
  }

  // Check max counts
  if (model.rules.maxHeader && counts.header > model.rules.maxHeader) {
    errors.push({
      type: 'duplicate',
      message: `Multiple <header> elements found (max: ${model.rules.maxHeader})`,
      element
    });
  }

  if (model.rules.maxFooter && counts.footer > model.rules.maxFooter) {
    errors.push({
      type: 'duplicate',
      message: `Multiple <footer> elements found (max: ${model.rules.maxFooter})`,
      element
    });
  }

  // Check order (header should come before section, section before footer)
  const expectedOrder = model.rules.order;
  let lastIndex = -1;

  for (const tag of foundOrder) {
    const index = expectedOrder.indexOf(tag);
    if (index !== -1 && index < lastIndex) {
      errors.push({
        type: 'order',
        message: `Invalid child order: <${tag}> should appear before elements that follow it in the semantic order (header > section > footer)`,
        element
      });
      break;
    }
    if (index !== -1) {
      lastIndex = index;
    }
  }

  return errors;
}

/**
 * Report validation errors
 */
function reportErrors(errors) {
  for (const error of errors) {
    console.warn(
      `[Vanilla Breeze] Content model warning in <${error.element.tagName.toLowerCase()}>:`,
      error.message,
      error.element
    );

    // Add visual feedback
    error.element.setAttribute('data-debug-invalid', '');
    error.element.setAttribute('data-debug-message', error.message);
  }
}

/**
 * Clear previous validation state from an element
 */
function clearValidationState(element) {
  element.removeAttribute('data-debug-invalid');
  element.removeAttribute('data-debug-message');
}

/**
 * Validate all components on the page
 */
function validateAll() {
  for (const [tagName, model] of Object.entries(CONTENT_MODELS)) {
    const elements = document.querySelectorAll(tagName);

    for (const element of elements) {
      clearValidationState(element);
      const errors = validateElement(element, tagName, model);
      if (errors.length > 0) {
        reportErrors(errors);
      }
    }
  }
}

/**
 * Initialize content model validation
 */
function initContentModelValidation() {
  if (!isDebugEnabled()) {
    return;
  }

  console.info('[Vanilla Breeze] Debug mode enabled - content model validation active');

  // Initial validation after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateAll);
  } else {
    validateAll();
  }

  // Re-validate on DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldValidate = false;

    for (const mutation of mutations) {
      // Check if mutation affects components we care about
      if (mutation.type === 'childList') {
        const target = mutation.target;
        if (target.tagName && CONTENT_MODELS[target.tagName.toLowerCase()]) {
          shouldValidate = true;
          break;
        }
        // Check added nodes
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (CONTENT_MODELS[node.tagName.toLowerCase()] ||
                node.querySelector(Object.keys(CONTENT_MODELS).join(','))) {
              shouldValidate = true;
              break;
            }
          }
        }
      }
    }

    if (shouldValidate) {
      validateAll();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Auto-initialize
initContentModelValidation();

export { initContentModelValidation, validateAll, isDebugEnabled };
