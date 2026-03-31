/**
 * <user-story> Web Component
 * Displays user stories in the classic Agile format:
 * "As a [persona], I want [action] so that [benefit]"
 *
 * @example
 * <user-story
 *   persona="Product Manager"
 *   action="view all project timelines in one dashboard"
 *   benefit="I can quickly identify bottlenecks and reallocate resources"
 *   priority="high"
 *   points="5">
 *
 *   <div slot="acceptance-criteria">
 *     <ul>
 *       <li>Dashboard loads within 2 seconds</li>
 *       <li>All active projects are displayed</li>
 *       <li>Timeline view is zoomable</li>
 *     </ul>
 *   </div>
 * </user-story>
 */

class UserStory extends HTMLElement {
	static get observedAttributes() {
		return [
			'persona', 'action', 'benefit', 'priority', 'points',
			'status', 'epic', 'story-id', 'mode', 'compact'
		];
	}

	static PRIORITIES = {
		critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
		high: { label: 'High', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
		medium: { label: 'Medium', color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)' },
		low: { label: 'Low', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' }
	};

	static STATUSES = {
		backlog: { label: 'Backlog', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
		'to-do': { label: 'To Do', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
		'in-progress': { label: 'In Progress', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
		review: { label: 'Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
		done: { label: 'Done', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }
	};

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this._render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && this.shadowRoot) {
			this._render();
		}
	}

	// Attribute getters
	get persona() {
		return this.getAttribute('persona') || 'user';
	}

	get action() {
		return this.getAttribute('action') || '';
	}

	get benefit() {
		return this.getAttribute('benefit') || '';
	}

	get priority() {
		return this.getAttribute('priority') || 'medium';
	}

	get points() {
		return this.getAttribute('points') || '';
	}

	get status() {
		return this.getAttribute('status') || 'backlog';
	}

	get epic() {
		return this.getAttribute('epic') || '';
	}

	get storyId() {
		return this.getAttribute('story-id') || '';
	}

	get mode() {
		return this.getAttribute('mode') || 'auto';
	}

	get compact() {
		return this.hasAttribute('compact');
	}

	_render() {
		const isDark = this.mode === 'dark' ||
			(this.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		const priorityInfo = UserStory.PRIORITIES[this.priority] || UserStory.PRIORITIES.medium;
		const statusInfo = UserStory.STATUSES[this.status] || UserStory.STATUSES.backlog;

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--user-story-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          --us-bg: ${isDark ? '#1e1e1e' : '#ffffff'};
          --us-card-bg: ${isDark ? '#252525' : '#f8f9fa'};
          --us-text: ${isDark ? '#e8e8e8' : '#1a1a1a'};
          --us-muted: ${isDark ? '#888888' : '#666666'};
          --us-border: ${isDark ? '#333333' : '#e0e0e0'};
          --us-accent: ${isDark ? '#6b9fff' : '#0066cc'};
          --us-highlight: ${isDark ? 'rgba(107, 159, 255, 0.15)' : 'rgba(0, 102, 204, 0.08)'};
        }

        .story-card {
          background: var(--us-bg);
          border: 1px solid var(--us-border);
          border-radius: var(--user-story-radius, 12px);
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .story-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .story-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--us-card-bg);
          border-bottom: 1px solid var(--us-border);
          gap: 12px;
          flex-wrap: wrap;
        }

        .story-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .story-id {
          font-size: 12px;
          font-weight: 600;
          color: var(--us-muted);
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .epic-badge {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          background: var(--us-highlight);
          color: var(--us-accent);
          font-weight: 500;
        }

        .story-badges {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .priority-badge,
        .status-badge {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .priority-badge {
          background: ${priorityInfo.bg};
          color: ${priorityInfo.color};
        }

        .status-badge {
          background: ${statusInfo.bg};
          color: ${statusInfo.color};
        }

        .points-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--us-accent);
          color: white;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .story-body {
          padding: 20px;
        }

        :host([compact]) .story-body {
          padding: 16px;
        }

        .story-statement {
          font-size: 18px;
          line-height: 1.6;
          color: var(--us-text);
          margin: 0;
        }

        :host([compact]) .story-statement {
          font-size: 15px;
        }

        .keyword {
          font-weight: 600;
          color: var(--us-accent);
        }

        .persona-text {
          background: var(--us-highlight);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .action-text {
          font-weight: 500;
        }

        .benefit-text {
          font-style: italic;
          color: var(--us-muted);
        }

        .story-sections {
          border-top: 1px solid var(--us-border);
        }

        .section {
          padding: 16px 20px;
          border-bottom: 1px solid var(--us-border);
        }

        .section:last-child {
          border-bottom: none;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .section-icon {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--us-accent);
        }

        .section-icon svg {
          width: 14px;
          height: 14px;
          fill: white;
        }

        .section-icon.acceptance { background: #22c55e; }
        .section-icon.notes { background: #f59e0b; }
        .section-icon.tasks { background: #8b5cf6; }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--us-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-content {
          color: var(--us-text);
          font-size: 14px;
          line-height: 1.6;
        }

        .section-content ::slotted(ul),
        .section-content ::slotted(ol) {
          margin: 0;
          padding-left: 20px;
        }

        .section-content ::slotted(li) {
          margin-bottom: 6px;
        }

        .section-content ::slotted(p) {
          margin: 0;
        }

        /* Draggable indicator for Kanban use */
        .drag-handle {
          cursor: grab;
          padding: 4px;
          opacity: 0.4;
          transition: opacity 0.2s ease;
        }

        .story-card:hover .drag-handle {
          opacity: 0.8;
        }

        .drag-handle svg {
          width: 16px;
          height: 16px;
          fill: var(--us-muted);
        }

        /* Story as read-only vs editable modes */
        :host([editable]) .story-statement {
          cursor: text;
        }

        :host([editable]) .story-statement:hover {
          background: var(--us-highlight);
          border-radius: 4px;
          margin: -4px;
          padding: 4px;
        }

        @media (max-width: 480px) {
          .story-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .story-badges {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .story-card {
            transition: none;
          }
        }
      </style>

      <article class="story-card" part="card" role="article" aria-label="User story">
        <header class="story-header" part="header">
          <div class="story-meta">
            ${this.storyId ? `<span class="story-id" part="id">${this.storyId}</span>` : ''}
            ${this.epic ? `<span class="epic-badge" part="epic">${this.epic}</span>` : ''}
          </div>
          <div class="story-badges">
            <span class="priority-badge" part="priority">${priorityInfo.label}</span>
            <span class="status-badge" part="status">${statusInfo.label}</span>
            ${this.points ? `<span class="points-badge" part="points" title="Story points">${this.points}</span>` : ''}
          </div>
        </header>

        <div class="story-body" part="body">
          <p class="story-statement" part="statement">
            <span class="keyword">As a</span>
            <span class="persona-text">${this.persona}</span>,
            <span class="keyword">I want</span>
            <span class="action-text">${this.action || '[describe the action]'}</span>
            ${this.benefit ? `
              <span class="keyword">so that</span>
              <span class="benefit-text">${this.benefit}</span>
            ` : ''}
          </p>
        </div>

        <div class="story-sections" part="sections">
          <div class="section" part="section">
            <div class="section-header">
              <div class="section-icon acceptance">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <span class="section-title">Acceptance Criteria</span>
            </div>
            <div class="section-content">
              <slot name="acceptance-criteria">
                <em style="color: var(--us-muted);">No acceptance criteria defined.</em>
              </slot>
            </div>
          </div>

          <div class="section" part="section">
            <div class="section-header">
              <div class="section-icon tasks">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              </div>
              <span class="section-title">Tasks</span>
            </div>
            <div class="section-content">
              <slot name="tasks">
                <em style="color: var(--us-muted);">No tasks added yet.</em>
              </slot>
            </div>
          </div>

          <div class="section" part="section">
            <div class="section-header">
              <div class="section-icon notes">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </div>
              <span class="section-title">Notes</span>
            </div>
            <div class="section-content">
              <slot name="notes">
                <em style="color: var(--us-muted);">No additional notes.</em>
              </slot>
            </div>
          </div>
        </div>
      </article>
    `;

		// Emit ready event
		this.dispatchEvent(new CustomEvent('story-ready', {
			detail: {
				id: this.storyId,
				persona: this.persona,
				action: this.action,
				benefit: this.benefit,
				priority: this.priority,
				status: this.status,
				points: this.points
			},
			bubbles: true,
			composed: true
		}));
	}

	// Public API for programmatic updates
	updateStatus(newStatus) {
		if (UserStory.STATUSES[newStatus]) {
			this.setAttribute('status', newStatus);
			this.dispatchEvent(new CustomEvent('status-changed', {
				detail: { status: newStatus, storyId: this.storyId },
				bubbles: true,
				composed: true
			}));
		}
	}

	updatePriority(newPriority) {
		if (UserStory.PRIORITIES[newPriority]) {
			this.setAttribute('priority', newPriority);
			this.dispatchEvent(new CustomEvent('priority-changed', {
				detail: { priority: newPriority, storyId: this.storyId },
				bubbles: true,
				composed: true
			}));
		}
	}
}

customElements.define('user-story', UserStory);

export { UserStory };