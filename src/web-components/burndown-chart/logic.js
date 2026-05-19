/**
 * burndown-chart: Sprint burndown plot
 *
 * Thin composing preset that wraps <chart-wc type="line"> with two
 * series: an `Actual` series from the author's daily remaining counts
 * and an `Ideal` series the component computes from start/end/total.
 *
 * Replaces the boilerplate of hand-computing the ideal trend line and
 * formatting two parallel data series. Authors supply only the daily
 * actuals (and optional scope-change deltas) — the ideal slope is
 * mechanical.
 *
 * Data source: a <template> child whose <tr> rows are
 *   <tr><td>YYYY-MM-DD</td><td>remaining</td></tr>
 *   <tr><td>YYYY-MM-DD</td><td>remaining</td><td>±N</td></tr>
 * The optional 3rd cell is a scope-change delta on that day; the
 * component renders an inline annotation note (no chart marker primitive
 * exists in chart-wc yet, so we surface scope changes via a captioned
 * list under the chart).
 *
 * @attr {string} start    - Sprint start date (ISO 8601, required)
 * @attr {string} end      - Sprint end date (ISO 8601, required, inclusive)
 * @attr {number} total    - Total points/items at sprint start (required)
 * @attr {string} unit     - Display unit, default "points"
 * @attr {string} label    - Optional heading text (e.g., "Sprint 14")
 * @attr {string} weekends - "include" (default) or "exclude" from ideal slope
 *
 * @fires burndown-chart:ready - { dayCount, total, scopeChanges }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const MS_PER_DAY = 86_400_000;

class BurndownChart extends VBElement {
  setup() {
    const start = this.getAttribute('start');
    const end = this.getAttribute('end');
    const total = parseFloat(this.getAttribute('total'));

    if (!start || !end || !Number.isFinite(total)) {
      console.warn('burndown-chart: requires start, end, and total attributes');
      return false;
    }

    const startDate = BurndownChart.#parseDate(start);
    const endDate = BurndownChart.#parseDate(end);
    if (!startDate || !endDate || endDate < startDate) {
      console.warn('burndown-chart: start/end dates invalid', start, end);
      return false;
    }

    const includeWeekends = (this.getAttribute('weekends') || 'include') !== 'exclude';
    const unit = this.getAttribute('unit') || 'points';
    const label = this.getAttribute('label') || '';

    const tmpl = this.querySelector(':scope > template');
    const samples = tmpl ? BurndownChart.#parseTemplate(tmpl) : [];
    const scopeChanges = samples.filter((s) => s.delta !== 0);

    const dayLabels = BurndownChart.#enumerateDays(startDate, endDate);
    const ideal = BurndownChart.#idealSeries(dayLabels, total, includeWeekends);
    const actual = BurndownChart.#actualSeries(dayLabels, samples);

    this.#render({ label, unit, dayLabels, actual, ideal, scopeChanges });

    queueMicrotask(() => {
      this.dispatchEvent(new CustomEvent('burndown-chart:ready', {
        bubbles: true,
        detail: { dayCount: dayLabels.length, total, scopeChanges: scopeChanges.length },
      }));
    });
    return true;
  }

  #render({ label, unit, dayLabels, actual, ideal, scopeChanges }) {
    [...this.children].forEach((c) => { if (c.tagName !== 'TEMPLATE') c.remove(); });

    if (label) {
      const h = document.createElement('header');
      h.className = 'bdc-label';
      h.textContent = label;
      this.appendChild(h);
    }

    const chart = document.createElement('chart-wc');
    chart.setAttribute('data-type', 'line');
    chart.setAttribute('data-legend', '');
    chart.setAttribute('data-tooltip', '');
    chart.setAttribute('data-label-x', 'Day');
    chart.setAttribute('data-label-y', unit);

    const idealValues = {};
    const actualValues = {};
    dayLabels.forEach((d, i) => {
      idealValues[d] = ideal[i];
      if (actual[i] !== null) actualValues[d] = actual[i];
    });

    const payload = [
      { name: 'Actual', values: actualValues },
      { name: 'Ideal',  values: idealValues },
    ];
    chart.setAttribute('data-values', JSON.stringify(payload));
    this.appendChild(chart);

    if (scopeChanges.length) {
      const notes = document.createElement('aside');
      notes.className = 'bdc-scope-changes';
      const heading = document.createElement('h4');
      heading.textContent = 'Scope changes';
      notes.appendChild(heading);
      const list = document.createElement('ul');
      for (const change of scopeChanges) {
        const li = document.createElement('li');
        const sign = change.delta > 0 ? '+' : '';
        li.innerHTML = `<time datetime="${change.date}">${change.date}</time>: <strong>${sign}${change.delta} ${unit}</strong>`;
        list.appendChild(li);
      }
      notes.appendChild(list);
      this.appendChild(notes);
    }
  }

  static #parseTemplate(tmpl) {
    const out = [];
    const trs = tmpl.content.querySelectorAll('tr');
    for (const tr of trs) {
      const cells = [...tr.children];
      const date = cells[0]?.textContent?.trim();
      const remaining = parseFloat(cells[1]?.textContent ?? '');
      const delta = parseFloat(cells[2]?.textContent ?? '0') || 0;
      if (!date || !Number.isFinite(remaining)) continue;
      out.push({ date, remaining, delta });
    }
    return out;
  }

  static #parseDate(s) {
    /* Treat YYYY-MM-DD as a local-midnight date so weekend math is
       deterministic across viewer time zones. */
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  static #toISO(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  static #enumerateDays(start, end) {
    const days = [];
    for (let t = start.getTime(); t <= end.getTime(); t += MS_PER_DAY) {
      days.push(BurndownChart.#toISO(new Date(t)));
    }
    return days;
  }

  static #idealSeries(dayLabels, total, includeWeekends) {
    const isWeekend = (label) => {
      const d = BurndownChart.#parseDate(label);
      const w = d.getDay();
      return w === 0 || w === 6;
    };
    const workingIndices = dayLabels
      .map((d, i) => ({ d, i, weekend: isWeekend(d) }))
      .filter((entry) => includeWeekends || !entry.weekend);
    const decrement = workingIndices.length > 1 ? total / (workingIndices.length - 1) : 0;
    const out = new Array(dayLabels.length).fill(null);
    let lastIdeal = total;
    let workingSeen = 0;
    for (let i = 0; i < dayLabels.length; i++) {
      const isWeekendDay = isWeekend(dayLabels[i]);
      if (includeWeekends || !isWeekendDay) {
        out[i] = Math.max(0, total - decrement * workingSeen);
        workingSeen++;
        lastIdeal = out[i];
      } else {
        /* Weekend in exclude mode: hold previous ideal flat. */
        out[i] = lastIdeal;
      }
    }
    return out;
  }

  static #actualSeries(dayLabels, samples) {
    const byDate = new Map(samples.map((s) => [s.date, s.remaining]));
    return dayLabels.map((d) => (byDate.has(d) ? byDate.get(d) : null));
  }
}

registerComponent('burndown-chart', BurndownChart);

export { BurndownChart };
