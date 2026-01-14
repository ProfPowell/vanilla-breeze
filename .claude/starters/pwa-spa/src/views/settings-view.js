/**
 * Settings View
 * User preferences and configuration
 */

import { BaseView } from './base-view.js';
import { store } from '../app/store.js';

class SettingsView extends BaseView {
  static get tag() {
    return 'settings-view';
  }

  render() {
    return `
      <h1>Settings</h1>
      <p data-role="lead">Customize your experience.</p>

      <form id="settings-form">
        <fieldset>
          <legend>Appearance</legend>

          <div data-field>
            <label for="theme">Color Theme</label>
            <select id="theme" name="theme">
              <option value="auto">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>Notifications</legend>

          <div data-field data-type="checkbox">
            <input type="checkbox" id="notifications" name="notifications"/>
            <label for="notifications">Enable notifications</label>
          </div>
        </fieldset>

        <nav data-role="actions">
          <button type="submit">Save Settings</button>
        </nav>
      </form>
    `;
  }

  styles() {
    return `
      ${super.styles()}

      [data-role="lead"] {
        margin-block-end: var(--size-2xl);
      }

      form {
        max-inline-size: 32rem;
      }

      fieldset {
        border: 1px solid var(--border, #e5e5e5);
        border-radius: var(--radius-lg, 0.5rem);
        padding: var(--size-l);
        margin-block-end: var(--size-l);
      }

      legend {
        font-weight: 600;
        padding-inline: var(--size-xs);
      }

      [data-field] {
        margin-block-end: var(--size-m);
      }

      [data-field] label {
        display: block;
        margin-block-end: var(--size-2xs);
        font-weight: 500;
      }

      [data-field][data-type="checkbox"] {
        display: flex;
        align-items: center;
        gap: var(--size-xs);
      }

      [data-field][data-type="checkbox"] label {
        margin-block-end: 0;
        font-weight: normal;
      }

      select,
      input[type="text"] {
        inline-size: 100%;
        padding: var(--size-xs);
        border: 1px solid var(--border, #e5e5e5);
        border-radius: var(--radius-md, 0.25rem);
        font: inherit;
      }

      [data-role="actions"] {
        margin-block-start: var(--size-xl);
      }

      button {
        padding: var(--size-xs) var(--size-l);
        background: var(--primary, #1e40af);
        color: white;
        border: none;
        border-radius: var(--radius-md, 0.25rem);
        font: inherit;
        font-weight: 500;
        cursor: pointer;
      }

      button:hover {
        background: var(--primary-hover, #1e3a8a);
      }
    `;
  }

  onMount() {
    const form = this.$('#settings-form');

    // Load saved settings
    this.loadSettings();

    // Handle form submission
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveSettings();
    });
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');

    const theme = this.$('#theme');
    const notifications = this.$('#notifications');

    if (settings.theme) {
      theme.value = settings.theme;
    }
    if (settings.notifications !== undefined) {
      notifications.checked = settings.notifications;
    }
  }

  saveSettings() {
    const theme = this.$('#theme').value;
    const notifications = this.$('#notifications').checked;

    const settings = { theme, notifications };
    localStorage.setItem('settings', JSON.stringify(settings));

    // Apply theme
    document.documentElement.dataset.mode = theme === 'auto' ? '' : theme;

    // Store in global state
    store.set('settings', settings);

    alert('Settings saved!');
  }
}

customElements.define(SettingsView.tag, SettingsView);
