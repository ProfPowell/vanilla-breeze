/**
 * relative-time-wc: Relative time display
 *
 * Finds a child <time> element, reads its datetime attribute,
 * and replaces its text with a human-readable relative string
 * (e.g., "3 hours ago"). The original text is preserved in the
 * title attribute for hover access. Auto-refreshes on interval.
 *
 * @example
 * <relative-time-wc>
 *   <time datetime="2026-02-09T10:00:00Z">February 9, 2026</time>
 * </relative-time-wc>
 */
class RelativeTimeWc extends HTMLElement {
  #timeEl;
  #interval;
  #datetime;

  connectedCallback() {
    this.#timeEl = this.querySelector('time');
    if (!this.#timeEl) return;

    const raw = this.#timeEl.getAttribute('datetime');
    if (!raw) return;

    this.#datetime = new Date(raw);
    if (isNaN(this.#datetime)) return;

    // Preserve original text as tooltip
    if (!this.#timeEl.title) {
      this.#timeEl.title = this.#timeEl.textContent.trim();
    }

    this.#update();
    this.#scheduleRefresh();
  }

  disconnectedCallback() {
    clearInterval(this.#interval);
  }

  #update() {
    if (!this.#timeEl || !this.#datetime) return;
    this.#timeEl.textContent = this.#formatRelative(this.#datetime);
  }

  #scheduleRefresh() {
    const diffMs = Math.abs(Date.now() - this.#datetime.getTime());
    const ONE_HOUR = 3600000;
    const ONE_DAY = 86400000;

    let intervalMs;
    if (diffMs < ONE_HOUR) {
      intervalMs = 60000;       // Every 60s for < 1 hour
    } else if (diffMs < ONE_DAY) {
      intervalMs = 300000;      // Every 5 min for < 24 hours
    } else {
      intervalMs = 3600000;     // Every hour for older
    }

    clearInterval(this.#interval);
    this.#interval = setInterval(() => {
      this.#update();
      // Re-evaluate refresh rate
      this.#scheduleRefresh();
    }, intervalMs);
  }

  #formatRelative(date) {
    const now = Date.now();
    const diffSec = Math.round((date.getTime() - now) / 1000);
    const absSec = Math.abs(diffSec);

    const units = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 }
    ];

    for (const { unit, seconds } of units) {
      if (absSec >= seconds) {
        const value = Math.round(diffSec / seconds);
        try {
          const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
          return rtf.format(value, unit);
        } catch {
          // Fallback if Intl not available
          const abs = Math.abs(value);
          const label = abs === 1 ? unit : `${unit}s`;
          return value < 0 ? `${abs} ${label} ago` : `in ${abs} ${label}`;
        }
      }
    }

    try {
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      return rtf.format(0, 'second');
    } catch {
      return 'just now';
    }
  }
}

customElements.define('relative-time-wc', RelativeTimeWc);
export { RelativeTimeWc };
