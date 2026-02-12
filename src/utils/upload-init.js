/**
 * upload-init: File upload drop zone
 *
 * Wraps a native file input in a drag-and-drop zone with file list display.
 * Falls back to standard file input without JS.
 *
 * @attr {string} data-upload - Enable drop zone enhancement
 *
 * @example
 * <input type="file" data-upload accept=".pdf,.doc" multiple>
 */

const SELECTOR = 'input[type="file"][data-upload]';

/**
 * Format file size in human-readable bytes
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Enhance a file input with drop zone
 * @param {HTMLInputElement} input
 */
function enhanceUpload(input) {
  if (input.hasAttribute('data-upload-init')) return;
  input.setAttribute('data-upload-init', '');

  const isMultiple = input.hasAttribute('multiple');
  const accept = input.getAttribute('accept') || '';

  // Create drop zone wrapper
  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.setAttribute('role', 'presentation');
  input.parentNode.insertBefore(zone, input);

  // Move input inside zone (visually hidden but still functional)
  zone.appendChild(input);

  // Drop zone content
  const prompt = document.createElement('div');
  prompt.className = 'upload-prompt';
  prompt.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <span>Drag files here or <button type="button" class="upload-browse">browse</button></span>
    ${accept ? `<small>${accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}</small>` : ''}
  `;
  zone.appendChild(prompt);

  // File list
  const fileList = document.createElement('ul');
  fileList.className = 'upload-file-list';
  fileList.setAttribute('aria-label', 'Selected files');
  zone.appendChild(fileList);

  // Browse button triggers file input
  const browseBtn = prompt.querySelector('.upload-browse');
  browseBtn.addEventListener('click', () => input.click());

  // Also click on zone (but not on file list items)
  zone.addEventListener('click', (e) => {
    if (e.target === zone || e.target === prompt || e.target.closest('.upload-prompt')) {
      input.click();
    }
  });

  // Drag and drop handlers
  let dragCounter = 0;

  zone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    zone.dataset.dragover = '';
  });

  zone.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter === 0) delete zone.dataset.dragover;
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    delete zone.dataset.dragover;

    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Update file list on change
  input.addEventListener('change', () => {
    fileList.innerHTML = '';
    const files = Array.from(input.files);

    if (files.length === 0) {
      fileList.hidden = true;
      return;
    }

    fileList.hidden = false;
    files.forEach((file) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="upload-file-name">${escapeHtml(file.name)}</span>
        <span class="upload-file-size">${formatBytes(file.size)}</span>
      `;
      fileList.appendChild(li);
    });
  });
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Initialize upload zones within a root
 * @param {Element|Document} root
 */
function initUploadZones(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceUpload);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initUploadZones());
} else {
  initUploadZones();
}

// Watch for dynamically added file inputs
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceUpload(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceUpload);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initUploadZones };
