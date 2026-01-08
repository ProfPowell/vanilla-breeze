# Calendar

## Description

Date grid display for viewing and selecting dates. Can show month, week, or day views with optional event support.

## Anatomy

- **container**: Calendar wrapper
- **header**: Month/year navigation
- **weekdays**: Day name headers
- **grid**: Date cells grid
- **day**: Individual day cell
- **event**: Event indicator within day

## States

| State | Description |
|-------|-------------|
| Default | Current month view |
| Selected | Date is selected |
| Today | Current date highlighted |
| Disabled | Date not selectable |
| Has Events | Day contains events |

## Variants

### View

**Attribute:** `data-view`
**Values:** `month`, `week`, `day`

### Size

**Attribute:** `data-size`
**Values:** `compact`, `default`, `large`

### Selection

**Attribute:** `data-selection`
**Values:** `single`, `range`, `multiple`

## Baseline HTML

```html
<div class="calendar">
  <header>
    <button aria-label="Previous month">←</button>
    <h2>January 2025</h2>
    <button aria-label="Next month">→</button>
  </header>
  <table>
    <thead>
      <tr>
        <th>Sun</th>
        <th>Mon</th>
        <th>Tue</th>
        <th>Wed</th>
        <th>Thu</th>
        <th>Fri</th>
        <th>Sat</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><button>1</button></td>
        <!-- ... -->
      </tr>
    </tbody>
  </table>
</div>
```

## Enhanced HTML

```html
<date-calendar data-view="month" data-selection="single">
  <header data-header>
    <button data-nav="prev" aria-label="Previous month">
      <svg><!-- chevron-left --></svg>
    </button>
    <h2 data-title>January 2025</h2>
    <button data-nav="next" aria-label="Next month">
      <svg><!-- chevron-right --></svg>
    </button>
  </header>

  <table data-grid role="grid" aria-label="January 2025">
    <thead>
      <tr>
        <th scope="col" abbr="Sunday">Sun</th>
        <th scope="col" abbr="Monday">Mon</th>
        <th scope="col" abbr="Tuesday">Tue</th>
        <th scope="col" abbr="Wednesday">Wed</th>
        <th scope="col" abbr="Thursday">Thu</th>
        <th scope="col" abbr="Friday">Fri</th>
        <th scope="col" abbr="Saturday">Sat</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-day data-outside>
          <button tabindex="-1" disabled>29</button>
        </td>
        <td data-day data-outside>
          <button tabindex="-1" disabled>30</button>
        </td>
        <td data-day data-outside>
          <button tabindex="-1" disabled>31</button>
        </td>
        <td data-day>
          <button tabindex="-1">1</button>
        </td>
        <td data-day>
          <button tabindex="-1">2</button>
        </td>
        <td data-day>
          <button tabindex="-1">3</button>
        </td>
        <td data-day>
          <button tabindex="-1">4</button>
        </td>
      </tr>
      <!-- More rows... -->
      <tr>
        <td data-day data-today>
          <button tabindex="0" aria-current="date">15</button>
        </td>
        <td data-day data-events>
          <button tabindex="-1">16</button>
          <span data-event-dot></span>
        </td>
        <!-- ... -->
      </tr>
    </tbody>
  </table>
</date-calendar>
```

## CSS

```css
@layer components {
  date-calendar {
    display: block;
    width: 100%;
    max-width: 20rem;
    background: var(--surface, white);
    border: 1px solid var(--border, oklch(0.85 0 0));
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  /* Header */
  date-calendar [data-header] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    background: var(--surface-alt, oklch(0.98 0 0));
    border-block-end: 1px solid var(--border);
  }

  date-calendar [data-title] {
    margin: 0;
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
  }

  date-calendar [data-nav] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--text-muted);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  date-calendar [data-nav]:hover {
    background: var(--overlay-light);
    color: var(--text);
  }

  date-calendar [data-nav] svg {
    width: 1rem;
    height: 1rem;
  }

  /* Grid */
  date-calendar [data-grid] {
    width: 100%;
    border-collapse: collapse;
  }

  date-calendar thead th {
    padding: var(--spacing-sm);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-muted);
    text-align: center;
  }

  date-calendar tbody td {
    padding: var(--spacing-xs);
    text-align: center;
  }

  /* Day cells */
  date-calendar [data-day] {
    position: relative;
  }

  date-calendar [data-day] button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    margin: 0 auto;
    padding: 0;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    background: transparent;
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  date-calendar [data-day] button:hover:not(:disabled) {
    background: var(--overlay-light);
  }

  date-calendar [data-day] button:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* Outside month */
  date-calendar [data-outside] button {
    color: var(--text-muted);
    opacity: 0.5;
  }

  /* Today */
  date-calendar [data-today] button {
    background: var(--surface-alt);
    font-weight: var(--font-weight-bold);
  }

  date-calendar [data-today] button[aria-current="date"] {
    outline: 2px solid var(--primary);
    outline-offset: -2px;
  }

  /* Selected */
  date-calendar [data-selected] button,
  date-calendar [data-day] button[aria-selected="true"] {
    background: var(--primary);
    color: var(--primary-contrast);
  }

  /* Range selection */
  date-calendar [data-range-start] button {
    border-radius: var(--radius-full) 0 0 var(--radius-full);
  }

  date-calendar [data-range-end] button {
    border-radius: 0 var(--radius-full) var(--radius-full) 0;
  }

  date-calendar [data-in-range] {
    background: oklch(0.95 0.05 250);
  }

  date-calendar [data-in-range] button {
    border-radius: 0;
  }

  /* Events indicator */
  date-calendar [data-events] {
    position: relative;
  }

  date-calendar [data-event-dot] {
    position: absolute;
    bottom: 0.25rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.25rem;
    height: 0.25rem;
    background: var(--primary);
    border-radius: var(--radius-full);
  }

  date-calendar [data-event-dot][data-count]::after {
    content: attr(data-count);
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    font-size: var(--text-xs);
    background: var(--primary);
    color: var(--primary-contrast);
    padding: 0 0.25rem;
    border-radius: var(--radius-full);
  }

  /* Disabled */
  date-calendar [data-day] button:disabled {
    color: var(--text-muted);
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* Size variants */
  date-calendar[data-size="compact"] {
    max-width: 16rem;
  }

  date-calendar[data-size="compact"] [data-day] button {
    width: 1.5rem;
    height: 1.5rem;
    font-size: var(--text-xs);
  }

  date-calendar[data-size="large"] {
    max-width: 28rem;
  }

  date-calendar[data-size="large"] [data-day] button {
    width: 2.5rem;
    height: 2.5rem;
  }

  /* Week view */
  date-calendar[data-view="week"] [data-grid] {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
}
```

## JavaScript Enhancement

```javascript
class DateCalendar extends HTMLElement {
  static observedAttributes = ['data-month', 'data-year'];

  connectedCallback() {
    this.currentDate = new Date();
    this.selectedDate = null;

    this.prevBtn = this.querySelector('[data-nav="prev"]');
    this.nextBtn = this.querySelector('[data-nav="next"]');
    this.title = this.querySelector('[data-title]');
    this.grid = this.querySelector('tbody');

    this.prevBtn?.addEventListener('click', () => this.navigate(-1));
    this.nextBtn?.addEventListener('click', () => this.navigate(1));

    this.grid?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn && !btn.disabled) {
        this.selectDate(btn);
      }
    });

    // Keyboard navigation
    this.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  navigate(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.render();
  }

  selectDate(btn) {
    // Clear previous selection
    this.querySelectorAll('[data-selected]').forEach((td) => {
      td.removeAttribute('data-selected');
      td.querySelector('button')?.setAttribute('aria-selected', 'false');
    });

    // Set new selection
    const td = btn.closest('[data-day]');
    td.setAttribute('data-selected', '');
    btn.setAttribute('aria-selected', 'true');

    const day = parseInt(btn.textContent);
    this.selectedDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      day
    );

    this.dispatchEvent(new CustomEvent('select', {
      detail: { date: this.selectedDate }
    }));
  }

  handleKeyboard(e) {
    const focused = this.querySelector('button[tabindex="0"]');
    if (!focused) return;

    let newFocus = null;
    const cells = Array.from(this.querySelectorAll('[data-day]:not([data-outside]) button'));
    const index = cells.indexOf(focused);

    switch (e.key) {
      case 'ArrowRight':
        newFocus = cells[index + 1];
        break;
      case 'ArrowLeft':
        newFocus = cells[index - 1];
        break;
      case 'ArrowDown':
        newFocus = cells[index + 7];
        break;
      case 'ArrowUp':
        newFocus = cells[index - 7];
        break;
      case 'Enter':
      case ' ':
        this.selectDate(focused);
        e.preventDefault();
        return;
    }

    if (newFocus) {
      cells.forEach((c) => c.setAttribute('tabindex', '-1'));
      newFocus.setAttribute('tabindex', '0');
      newFocus.focus();
      e.preventDefault();
    }
  }

  render() {
    // Update title
    const monthName = this.currentDate.toLocaleString('default', { month: 'long' });
    const year = this.currentDate.getFullYear();
    this.title.textContent = `${monthName} ${year}`;

    // Render grid (implementation depends on needs)
    // This would regenerate the tbody with new dates
  }
}

customElements.define('date-calendar', DateCalendar);
```

## Accessibility

- **Grid Role**: Uses `role="grid"` for proper navigation
- **Current Date**: `aria-current="date"` marks today
- **Selected**: `aria-selected="true"` on selected date
- **Keyboard**: Arrow keys navigate, Enter selects
- **Abbr**: Day headers have abbreviations

## Examples

### Date Picker

```html
<date-calendar data-selection="single">
  <!-- Calendar content -->
</date-calendar>
```

### Date Range Picker

```html
<date-calendar data-selection="range">
  <!-- Calendar with range selection -->
</date-calendar>
```

### With Events

```html
<date-calendar data-view="month">
  <!-- Grid with data-events on days that have events -->
  <td data-day data-events>
    <button>15</button>
    <span data-event-dot data-count="3"></span>
  </td>
</date-calendar>
```

## Related Patterns

- [date-picker](../form/date-picker.md)
- [data-table](./data-table.md)
- [popover](../feedback/popover.md)
