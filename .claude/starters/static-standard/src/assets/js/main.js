/**
 * Main JavaScript
 * Progressive enhancement for the static site
 */

document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize all enhancements
 */
function init() {
  initNavigation();
  initForms();
  initAccessibility();
}

/**
 * Navigation enhancements
 */
function initNavigation() {
  // Add mobile menu toggle if needed
  const nav = document.querySelector('.nav-container');
  if (!nav) return;

  // Could add mobile hamburger menu here
}

/**
 * Form enhancements
 */
function initForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach((form) => {
    form.addEventListener('submit', handleFormSubmit);
  });
}

/**
 * Handle form submission
 * @param {SubmitEvent} event - The submit event
 */
function handleFormSubmit(event) {
  const form = event.target;

  // Native validation is used as the baseline
  // Add custom handling here if needed

  // Example: Prevent submission and show success message
  // event.preventDefault();
  // showFormSuccess(form);
}

/**
 * Accessibility enhancements
 */
function initAccessibility() {
  // Manage focus for skip links
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      const targetId = skipLink.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
    });
  }

  // Add keyboard navigation hints
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
}
