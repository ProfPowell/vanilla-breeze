/**
 * Form Builder Application Entry Point
 * @module app
 */

import { FormRegistry } from './lib/form-registry.js';
import { FormRenderer } from './components/FormRenderer.js';
import { FormStorage } from './lib/storage.js';

/**
 * Initialize the application
 */
async function init() {
  const formList = document.getElementById('form-list');

  if (formList) {
    await renderFormList(formList);
  }

  // Check if we're on a form page
  const formContainer = document.getElementById('form-container');
  if (formContainer) {
    const formId = new URLSearchParams(window.location.search).get('id');
    if (formId) {
      await renderForm(formContainer, formId);
    }
  }
}

/**
 * Render the list of available forms
 * @param {HTMLElement} container - Container element
 */
async function renderFormList(container) {
  const forms = await FormRegistry.getAll();

  if (forms.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No forms available yet.</p>
        <p>Add form schemas to <code>src/forms/</code> to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = forms.map(form => `
    <article class="form-card">
      <h2><a href="/form.html?id=${form.id}">${form.title}</a></h2>
      <p>${form.description || ''}</p>
      <div class="form-card-meta">
        <span>${form.fields?.length || 0} fields</span>
        ${form.steps ? `<span>${form.steps.length} steps</span>` : ''}
      </div>
    </article>
  `).join('');
}

/**
 * Render a specific form
 * @param {HTMLElement} container - Container element
 * @param {string} formId - Form identifier
 */
async function renderForm(container, formId) {
  const form = await FormRegistry.get(formId);

  if (!form) {
    container.innerHTML = `
      <div class="error-state">
        <h2>Form not found</h2>
        <p>The form "${formId}" could not be found.</p>
        <a href="/">Back to forms</a>
      </div>
    `;
    return;
  }

  const renderer = new FormRenderer(form, {
    storage: new FormStorage('{{STORAGE_TYPE}}'),
    onSubmit: handleFormSubmit,
    onError: handleFormError
  });

  container.appendChild(renderer.render());
}

/**
 * Handle successful form submission
 * @param {Object} data - Form data
 * @param {Object} form - Form schema
 */
function handleFormSubmit(data, form) {
  console.log('Form submitted:', { formId: form.id, data });

  // Show success message
  const container = document.getElementById('form-container');
  container.innerHTML = `
    <div class="success-state">
      <h2>Thank you!</h2>
      <p>${form.successMessage || 'Your response has been recorded.'}</p>
      <a href="/">Submit another response</a>
    </div>
  `;
}

/**
 * Handle form submission error
 * @param {Error} error - Error object
 * @param {Object} form - Form schema
 */
function handleFormError(error, form) {
  console.error('Form submission error:', error);

  // Show error message (form component handles inline errors)
  const errorBanner = document.createElement('div');
  errorBanner.className = 'error-banner';
  errorBanner.setAttribute('role', 'alert');
  errorBanner.textContent = 'There was an error submitting the form. Please try again.';

  document.getElementById('form-container')?.prepend(errorBanner);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}