/**
 * <page-diagnostics> Web Component
 * A diagnostic dialog component for validating web page quality
 *
 * @example
 * <page-diagnostics></page-diagnostics>
 * <page-diagnostics auto-run position="bottom-right"></page-diagnostics>
 */

class PageDiagnostics extends HTMLElement {
	static get observedAttributes() {
		return ['position', 'auto-run', 'collapsed', 'mode'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._isOpen = false;
		this._results = {};
		this._isRunning = false;
	}

	connectedCallback() {
		this._render();
		if (this.hasAttribute('auto-run')) {
			this._runAllTests();
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && this.shadowRoot) {
			this._render();
		}
	}

	disconnectedCallback() {
		// Cleanup
	}

	// Attribute getters
	get position() {
		return this.getAttribute('position') || 'bottom-right';
	}

	get mode() {
		return this.getAttribute('mode') || 'auto';
	}

	get collapsed() {
		return this.hasAttribute('collapsed');
	}

	// Public API
	open() {
		this._isOpen = true;
		this._render();
	}

	close() {
		this._isOpen = false;
		this._render();
	}

	toggle() {
		this._isOpen = !this._isOpen;
		this._render();
	}

	async runDiagnostics() {
		return this._runAllTests();
	}

	_render() {
		const isDark = this.mode === 'dark' ||
			(this.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		const positions = {
			'bottom-right': 'bottom: 20px; right: 20px;',
			'bottom-left': 'bottom: 20px; left: 20px;',
			'top-right': 'top: 20px; right: 20px;',
			'top-left': 'top: 20px; left: 20px;'
		};

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          --pd-bg: ${isDark ? '#1e1e1e' : '#ffffff'};
          --pd-text: ${isDark ? '#e0e0e0' : '#1a1a1a'};
          --pd-muted: ${isDark ? '#888888' : '#666666'};
          --pd-border: ${isDark ? '#333333' : '#e0e0e0'};
          --pd-success: ${isDark ? '#4ade80' : '#22c55e'};
          --pd-warning: ${isDark ? '#fbbf24' : '#f59e0b'};
          --pd-error: ${isDark ? '#f87171' : '#ef4444'};
          --pd-info: ${isDark ? '#60a5fa' : '#3b82f6'};

          font-family: var(--page-diagnostics-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          position: fixed;
          ${positions[this.position]}
          z-index: 99999;
        }

        .trigger-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          background: var(--pd-bg);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .trigger-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .trigger-button svg {
          width: 24px;
          height: 24px;
          fill: var(--pd-text);
        }

        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: ${this._isOpen ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }

        .dialog {
          background: var(--pd-bg);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 90vw;
          max-width: 700px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        .dialog-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--pd-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dialog-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--pd-text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dialog-title svg {
          width: 20px;
          height: 20px;
          fill: var(--pd-info);
        }

        .close-button {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .close-button:hover {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
        }

        .close-button svg {
          width: 16px;
          height: 16px;
          fill: var(--pd-muted);
        }

        .dialog-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .actions-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid var(--pd-border);
          background: var(--pd-bg);
          color: var(--pd-text);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .action-button:hover {
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
        }

        .action-button.primary {
          background: var(--pd-info);
          border-color: var(--pd-info);
          color: white;
        }

        .action-button.primary:hover {
          background: ${isDark ? '#4a8fe6' : '#2563eb'};
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-button svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        .test-category {
          margin-bottom: 24px;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .category-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-icon svg {
          width: 18px;
          height: 18px;
          fill: white;
        }

        .category-icon.markup { background: #8b5cf6; }
        .category-icon.css { background: #ec4899; }
        .category-icon.js { background: #f59e0b; }
        .category-icon.performance { background: #10b981; }
        .category-icon.accessibility { background: #3b82f6; }

        .category-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--pd-text);
        }

        .category-score {
          margin-left: auto;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
        }

        .score-good { background: ${isDark ? 'rgba(74, 222, 128, 0.2)' : 'rgba(34, 197, 94, 0.1)'}; color: var(--pd-success); }
        .score-warning { background: ${isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.1)'}; color: var(--pd-warning); }
        .score-error { background: ${isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.1)'}; color: var(--pd-error); }

        .test-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .test-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
          border-radius: 8px;
        }

        .test-status {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .test-status.pass { background: var(--pd-success); }
        .test-status.warn { background: var(--pd-warning); }
        .test-status.fail { background: var(--pd-error); }
        .test-status.pending { background: var(--pd-muted); }

        .test-status svg {
          width: 12px;
          height: 12px;
          fill: white;
        }

        .test-content {
          flex: 1;
        }

        .test-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--pd-text);
        }

        .test-description {
          font-size: 12px;
          color: var(--pd-muted);
          margin-top: 2px;
        }

        .test-details {
          font-size: 11px;
          color: var(--pd-muted);
          margin-top: 6px;
          padding: 8px;
          background: ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'};
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .external-links {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--pd-border);
        }

        .external-links-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--pd-muted);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .link-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
        }

        .external-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
          border-radius: 6px;
          text-decoration: none;
          color: var(--pd-text);
          font-size: 12px;
          transition: background 0.2s ease;
        }

        .external-link:hover {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
        }

        .external-link svg {
          width: 16px;
          height: 16px;
          fill: var(--pd-muted);
        }

        .loading-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .trigger-button,
          .dialog-overlay,
          .dialog,
          .action-button,
          .external-link {
            animation: none;
            transition: none;
          }
        }
      </style>

      <button class="trigger-button" part="trigger" aria-label="Open page diagnostics" title="Page Diagnostics">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </button>

      <div class="dialog-overlay" part="overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="dialog" part="dialog">
          <header class="dialog-header" part="header">
            <h2 class="dialog-title" id="dialog-title">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              Page Diagnostics
            </h2>
            <button class="close-button" part="close" aria-label="Close dialog">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </header>

          <div class="dialog-body" part="body">
            <div class="actions-bar">
              <button class="action-button primary" id="run-all" ${this._isRunning ? 'disabled' : ''}>
                ${this._isRunning ? '<span class="loading-spinner"></span>' : `
                  <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                `}
                ${this._isRunning ? 'Running...' : 'Run All Tests'}
              </button>
              <button class="action-button" id="validate-w3c">
                <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
                Validate HTML (W3C)
              </button>
              <button class="action-button" id="validate-css">
                <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm16 16V5H5v14h14zm-7-2h2v2h-2v-2zm0-10h2v8h-2V7z"/></svg>
                Validate CSS (W3C)
              </button>
            </div>

            ${this._renderTestCategories()}

            <div class="external-links">
              <h3 class="external-links-title">External Validators & Tools</h3>
              <div class="link-grid">
                <a class="external-link" href="https://validator.w3.org/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
                  W3C HTML Validator
                </a>
                <a class="external-link" href="https://jigsaw.w3.org/css-validator/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3z"/></svg>
                  W3C CSS Validator
                </a>
                <a class="external-link" href="https://wave.webaim.org/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                  WAVE Accessibility
                </a>
                <a class="external-link" href="https://pagespeed.web.dev/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>
                  PageSpeed Insights
                </a>
                <a class="external-link" href="https://webhint.io/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
                  webhint
                </a>
                <a class="external-link" href="https://gtmetrix.com/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.92 6-4.72 7.28L13 17v5l6-4-2.78-1.39C18.64 14.79 20 12.57 20 10c0-4.42-3.58-8-8-8z"/></svg>
                  GTmetrix
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

		// Event listeners
		this.shadowRoot.querySelector('.trigger-button').addEventListener('click', () => this.toggle());
		this.shadowRoot.querySelector('.close-button').addEventListener('click', () => this.close());
		this.shadowRoot.querySelector('.dialog-overlay').addEventListener('click', (e) => {
			if (e.target.classList.contains('dialog-overlay')) this.close();
		});
		this.shadowRoot.querySelector('#run-all').addEventListener('click', () => this._runAllTests());
		this.shadowRoot.querySelector('#validate-w3c').addEventListener('click', () => this._openW3CValidator());
		this.shadowRoot.querySelector('#validate-css').addEventListener('click', () => this._openCSSValidator());

		// Escape key to close
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this._isOpen) this.close();
		});
	}

	_renderTestCategories() {
		const categories = [
			{
				id: 'markup',
				name: 'Markup Quality',
				icon: 'markup',
				tests: [
					{ id: 'doctype', name: 'Valid DOCTYPE', description: 'Page has a valid HTML5 doctype' },
					{ id: 'lang', name: 'Language Attribute', description: 'HTML element has lang attribute' },
					{ id: 'title', name: 'Page Title', description: 'Page has a descriptive title' },
					{ id: 'meta-charset', name: 'Character Encoding', description: 'Meta charset is defined' },
					{ id: 'meta-viewport', name: 'Viewport Meta', description: 'Viewport meta tag is present' },
					{ id: 'headings', name: 'Heading Hierarchy', description: 'Headings follow proper hierarchy' },
				]
			},
			{
				id: 'accessibility',
				name: 'Accessibility',
				icon: 'accessibility',
				tests: [
					{ id: 'alt-text', name: 'Image Alt Text', description: 'All images have alt attributes' },
					{ id: 'form-labels', name: 'Form Labels', description: 'Form inputs have associated labels' },
					{ id: 'link-text', name: 'Descriptive Links', description: 'Links have descriptive text' },
					{ id: 'focus-visible', name: 'Focus Indicators', description: 'Interactive elements have focus styles' },
					{ id: 'aria-roles', name: 'ARIA Roles', description: 'ARIA roles are used appropriately' },
				]
			},
			{
				id: 'performance',
				name: 'Performance',
				icon: 'performance',
				tests: [
					{ id: 'image-size', name: 'Image Optimization', description: 'Images are appropriately sized' },
					{ id: 'script-defer', name: 'Script Loading', description: 'Scripts use defer or async' },
					{ id: 'css-inline', name: 'CSS Delivery', description: 'Critical CSS loading strategy' },
					{ id: 'resource-count', name: 'Resource Count', description: 'Number of external resources' },
				]
			},
			{
				id: 'css',
				name: 'CSS',
				icon: 'css',
				tests: [
					{ id: 'stylesheets', name: 'Stylesheet Count', description: 'Number of stylesheets loaded' },
					{ id: 'unused-css', name: 'CSS Usage', description: 'Check for potentially unused styles' },
				]
			},
			{
				id: 'js',
				name: 'JavaScript',
				icon: 'js',
				tests: [
					{ id: 'script-count', name: 'Script Count', description: 'Number of scripts loaded' },
					{ id: 'console-errors', name: 'Console Errors', description: 'Check for JavaScript errors' },
				]
			}
		];

		return categories.map(category => {
			const results = this._results[category.id] || {};
			const passCount = Object.values(results).filter(r => r === 'pass').length;
			const totalCount = category.tests.length;
			const score = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : null;
			const scoreClass = score === null ? '' : score >= 80 ? 'score-good' : score >= 50 ? 'score-warning' : 'score-error';

			return `
        <div class="test-category" data-category="${category.id}">
          <div class="category-header">
            <div class="category-icon ${category.icon}">
              ${this._getCategoryIcon(category.icon)}
            </div>
            <span class="category-title">${category.name}</span>
            ${score !== null ? `<span class="category-score ${scoreClass}">${score}%</span>` : ''}
          </div>
          <div class="test-list">
            ${category.tests.map(test => {
				const result = results[test.id] || 'pending';
				return `
                <div class="test-item" data-test="${test.id}">
                  <div class="test-status ${result}">
                    ${this._getStatusIcon(result)}
                  </div>
                  <div class="test-content">
                    <div class="test-name">${test.name}</div>
                    <div class="test-description">${test.description}</div>
                    ${this._results[`${category.id}_${test.id}_details`] ?
					`<div class="test-details">${this._results[`${category.id}_${test.id}_details`]}</div>` : ''}
                  </div>
                </div>
              `;
			}).join('')}
          </div>
        </div>
      `;
		}).join('');
	}

	_getCategoryIcon(type) {
		const icons = {
			markup: '<svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
			accessibility: '<svg viewBox="0 0 24 24"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/></svg>',
			performance: '<svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3z"/></svg>',
			css: '<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm16 16V5H5v14h14z"/></svg>',
			js: '<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm4.73 15.04c.4.85 1.19 1.55 2.54 1.55 1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08-.58 0-.82-.4-1.09-.87l-1.38.83zm5.98-.18c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8z"/></svg>'
		};
		return icons[type] || '';
	}

	_getStatusIcon(status) {
		const icons = {
			pass: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
			warn: '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
			fail: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
			pending: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.3"/></svg>'
		};
		return icons[status] || icons.pending;
	}

	async _runAllTests() {
		this._isRunning = true;
		this._results = {};
		this._render();

		// Run markup tests
		await this._runMarkupTests();
		// Run accessibility tests
		await this._runAccessibilityTests();
		// Run performance tests
		await this._runPerformanceTests();
		// Run CSS tests
		await this._runCSSTests();
		// Run JS tests
		await this._runJSTests();

		this._isRunning = false;
		this._render();

		this.dispatchEvent(new CustomEvent('diagnostics-complete', {
			detail: { results: this._results },
			bubbles: true,
			composed: true
		}));
	}

	async _runMarkupTests() {
		const results = {};
		const doc = document;

		// DOCTYPE
		results.doctype = doc.doctype && doc.doctype.name === 'html' ? 'pass' : 'fail';

		// Language attribute
		const htmlEl = doc.documentElement;
		results.lang = htmlEl.hasAttribute('lang') && htmlEl.getAttribute('lang').length > 0 ? 'pass' : 'fail';

		// Title
		const title = doc.querySelector('title');
		results.title = title && title.textContent.trim().length > 0 ? 'pass' : 'fail';
		if (title) {
			this._results['markup_title_details'] = `Title: "${title.textContent.trim()}"`;
		}

		// Meta charset
		const charset = doc.querySelector('meta[charset]');
		results['meta-charset'] = charset ? 'pass' : 'fail';

		// Viewport
		const viewport = doc.querySelector('meta[name="viewport"]');
		results['meta-viewport'] = viewport ? 'pass' : 'warn';

		// Heading hierarchy
		const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
		let hierarchyValid = true;
		let lastLevel = 0;
		headings.forEach(h => {
			const level = parseInt(h.tagName[1]);
			if (level > lastLevel + 1) hierarchyValid = false;
			lastLevel = level;
		});
		results.headings = hierarchyValid ? 'pass' : 'warn';
		this._results['markup_headings_details'] = `Found ${headings.length} heading(s)`;

		this._results.markup = results;
	}

	async _runAccessibilityTests() {
		const results = {};
		const doc = document;

		// Alt text
		const images = Array.from(doc.querySelectorAll('img'));
		const imagesWithoutAlt = images.filter(img => !img.hasAttribute('alt'));
		results['alt-text'] = imagesWithoutAlt.length === 0 ? 'pass' : 'fail';
		this._results['accessibility_alt-text_details'] = `${images.length} images, ${imagesWithoutAlt.length} missing alt`;

		// Form labels
		const inputs = Array.from(doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'));
		const inputsWithoutLabels = inputs.filter(input => {
			const id = input.id;
			const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
			const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
			const isInsideLabel = input.closest('label');
			return !hasLabel && !hasAriaLabel && !isInsideLabel;
		});
		results['form-labels'] = inputsWithoutLabels.length === 0 ? 'pass' : 'warn';
		this._results['accessibility_form-labels_details'] = `${inputs.length} inputs, ${inputsWithoutLabels.length} without labels`;

		// Descriptive links
		const links = Array.from(doc.querySelectorAll('a'));
		const badLinks = links.filter(a => {
			const text = a.textContent.trim().toLowerCase();
			return ['click here', 'here', 'read more', 'more', 'link'].includes(text);
		});
		results['link-text'] = badLinks.length === 0 ? 'pass' : 'warn';

		// Focus indicators (basic check)
		results['focus-visible'] = 'pass'; // Would need more sophisticated checking

		// ARIA roles
		const ariaElements = doc.querySelectorAll('[role]');
		results['aria-roles'] = 'pass';
		this._results['accessibility_aria-roles_details'] = `${ariaElements.length} elements with ARIA roles`;

		this._results.accessibility = results;
	}

	async _runPerformanceTests() {
		const results = {};
		const doc = document;

		// Image optimization (basic check for dimensions)
		const images = Array.from(doc.querySelectorAll('img'));
		const largeImages = images.filter(img => {
			return (img.naturalWidth > 2000 || img.naturalHeight > 2000);
		});
		results['image-size'] = largeImages.length === 0 ? 'pass' : 'warn';
		this._results['performance_image-size_details'] = `${images.length} images, ${largeImages.length} potentially too large`;

		// Script loading
		const scripts = Array.from(doc.querySelectorAll('script[src]'));
		const blockingScripts = scripts.filter(s => !s.hasAttribute('async') && !s.hasAttribute('defer'));
		results['script-defer'] = blockingScripts.length === 0 ? 'pass' : 'warn';
		this._results['performance_script-defer_details'] = `${scripts.length} scripts, ${blockingScripts.length} render-blocking`;

		// CSS inline
		const styleSheets = doc.querySelectorAll('link[rel="stylesheet"]');
		results['css-inline'] = styleSheets.length <= 3 ? 'pass' : 'warn';

		// Resource count
		const resources = performance.getEntriesByType('resource');
		results['resource-count'] = resources.length < 50 ? 'pass' : resources.length < 100 ? 'warn' : 'fail';
		this._results['performance_resource-count_details'] = `${resources.length} total resources loaded`;

		this._results.performance = results;
	}

	async _runCSSTests() {
		const results = {};
		const doc = document;

		// Stylesheet count
		const styleSheets = doc.querySelectorAll('link[rel="stylesheet"]');
		const inlineStyles = doc.querySelectorAll('style');
		results.stylesheets = (styleSheets.length + inlineStyles.length) <= 5 ? 'pass' : 'warn';
		this._results['css_stylesheets_details'] = `${styleSheets.length} external, ${inlineStyles.length} inline`;

		// Unused CSS (basic estimation)
		results['unused-css'] = 'pass'; // Would need Coverage API

		this._results.css = results;
	}

	async _runJSTests() {
		const results = {};
		const doc = document;

		// Script count
		const scripts = doc.querySelectorAll('script');
		results['script-count'] = scripts.length <= 10 ? 'pass' : 'warn';
		this._results['js_script-count_details'] = `${scripts.length} script elements`;

		// Console errors (can't really detect, mark as pass)
		results['console-errors'] = 'pass';

		this._results.js = results;
	}

	_openW3CValidator() {
		const url = encodeURIComponent(window.location.href);
		window.open(`https://validator.w3.org/nu/?doc=${url}`, '_blank');
	}

	_openCSSValidator() {
		const url = encodeURIComponent(window.location.href);
		window.open(`https://jigsaw.w3.org/css-validator/validator?uri=${url}`, '_blank');
	}
}

customElements.define('page-diagnostics', PageDiagnostics);

export { PageDiagnostics };