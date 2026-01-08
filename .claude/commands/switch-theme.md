# Switch Theme

Apply a theme to the current document or generate a theme toggle component.

## Arguments
- `$ARGUMENTS` - Theme name, mode, or "toggle" for UI component

## Actions

### Apply Theme

Set attributes on document root:

```html
<!-- Brand theme only -->
<html data-theme="ocean">

<!-- Mode only -->
<html data-mode="dark">

<!-- Both -->
<html data-theme="ocean" data-mode="dark">

<!-- Reset to default -->
<html>
```

### Generate Toggle Component

If argument is "toggle", generate accessible theme selector:

```html
<theme-selector>
  <fieldset>
    <legend>Appearance</legend>

    <!-- Color Scheme -->
    <div data-group="mode">
      <span>Mode</span>
      <label>
        <input type="radio" name="color-mode" value="auto" checked />
        <span>Auto</span>
      </label>
      <label>
        <input type="radio" name="color-mode" value="light" />
        <span>Light</span>
      </label>
      <label>
        <input type="radio" name="color-mode" value="dark" />
        <span>Dark</span>
      </label>
    </div>

    <!-- Brand Theme -->
    <div data-group="theme">
      <span>Theme</span>
      <label>
        <input type="radio" name="brand-theme" value="default" checked />
        <span>Default</span>
      </label>
      <label>
        <input type="radio" name="brand-theme" value="ocean" />
        <span>Ocean</span>
      </label>
      <label>
        <input type="radio" name="brand-theme" value="forest" />
        <span>Forest</span>
      </label>
      <label>
        <input type="radio" name="brand-theme" value="sunset" />
        <span>Sunset</span>
      </label>
    </div>
  </fieldset>
</theme-selector>
```

## CSS-Only Toggle (using :has())

```css
/* Mode switching */
:root:has([name="color-mode"][value="light"]:checked) {
  color-scheme: light;
}

:root:has([name="color-mode"][value="dark"]:checked) {
  color-scheme: dark;
}

/* Brand switching */
:root:has([name="brand-theme"][value="ocean"]:checked) {
  --hue-primary: 200;
  --hue-secondary: 180;
  --hue-accent: 45;
}
```

## JavaScript Enhancement

```javascript
const ThemeManager = {
  STORAGE_KEY: 'user-theme',

  init() {
    const saved = this.load();
    if (saved) this.apply(saved);
    this.bindEvents();
  },

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
    } catch { return null; }
  },

  save(pref) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pref));
  },

  apply({ mode, theme }) {
    const root = document.documentElement;

    if (mode && mode !== 'auto') {
      root.dataset.mode = mode;
    } else {
      delete root.dataset.mode;
    }

    if (theme && theme !== 'default') {
      root.dataset.theme = theme;
    } else {
      delete root.dataset.theme;
    }
  },

  bindEvents() {
    document.querySelectorAll('[name="color-mode"]').forEach(input => {
      input.addEventListener('change', () => {
        const pref = this.load() || {};
        pref.mode = input.value;
        this.apply(pref);
        this.save(pref);
      });
    });

    document.querySelectorAll('[name="brand-theme"]').forEach(input => {
      input.addEventListener('change', () => {
        const pref = this.load() || {};
        pref.theme = input.value;
        this.apply(pref);
        this.save(pref);
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
```

## Example Usage

```
/switch-theme ocean
/switch-theme dark
/switch-theme forest dark
/switch-theme toggle
/switch-theme default
```
