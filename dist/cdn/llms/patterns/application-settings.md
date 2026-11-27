# Settings

Settings page patterns with grouped sections, sidebar navigation, and tabbed interfaces for application preferences and configuration.

- Documentation: https://vanilla-breeze.com/docs/patterns/application/settings/
- Vanilla Breeze 0.7.4

## Overview

Settings patterns provide organized interfaces for managing user preferences, account configuration, and application options. These layouts scale from simple single-page forms to complex multi-section configurations.

Key features:
- Grouped sections with fieldset and legend for logical organization
- Sidebar navigation for multi-page settings with persistent nav
- Tab-based organization for compact, single-page layouts
- Toggle switches and radio groups for preference selection
- Clear save/cancel actions with form validation

## Grouped Sections

A straightforward settings layout using fieldset sections with legend headings. Each section groups related settings together, making it easy to scan and understand the form structure.

settings-sections.html:

```html
<main data-layout="center" data-layout-max="normal">
  <form action="/settings" method="POST" data-layout="stack" data-layout-gap="xl">
    <hgroup>
      <h1>Settings</h1>
      <p>Manage your account settings and preferences.</p>
    </hgroup>

    <!-- Profile Section -->
    <fieldset>
      <legend>Profile</legend>
      <layout-stack data-layout-gap="l">
        <form-field>
          <label for="name">Full name</label>
          <input type="text" id="name" name="name" value="John Doe"/>
        </form-field>
        <form-field>
          <label for="email">Email address</label>
          <input type="email" id="email" name="email" value="john@example.com"/>
        </form-field>
        <form-field>
          <label for="bio">Bio</label>
          <textarea id="bio" name="bio" rows="4"></textarea>
        </form-field>
      </layout-stack>
    </fieldset>

    <!-- Notifications Section -->
    <fieldset>
      <legend>Notifications</legend>
      <layout-stack data-layout-gap="m">
        <label>
          <input type="checkbox" name="notify_comments" checked/>
          <span>
            Comments<br/>
            <small>Get notified when someone comments on your posts.</small>
          </span>
        </label>
        <label>
          <input type="checkbox" name="notify_mentions" checked/>
          <span>
            Mentions<br/>
            <small>Get notified when someone mentions you.</small>
          </span>
        </label>
      </layout-stack>
    </fieldset>

    <!-- Privacy Section -->
    <fieldset>
      <legend>Privacy</legend>
      <layout-stack data-layout-gap="m">
        <label>
          <input type="radio" name="visibility" value="public"/>
          <span>
            Public<br/>
            <small>Anyone can view your profile and activity.</small>
          </span>
        </label>
        <label>
          <input type="radio" name="visibility" value="private" checked/>
          <span>
            Private<br/>
            <small>Only approved followers can see your activity.</small>
          </span>
        </label>
      </layout-stack>
    </fieldset>

    <footer data-layout="cluster" data-layout-justify="end" data-layout-gap="m">
      <button type="button" class="secondary">Cancel</button>
      <button type="submit">Save changes</button>
    </footer>
  </form>
</main>
```

Fieldset styling:

```css
fieldset {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);
  padding: var(--size-l);
}

fieldset legend {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  padding: 0 var(--size-xs);
}
```

## Sidebar Navigation

A settings layout with persistent sidebar navigation for applications with many configuration sections. The sidebar provides quick access to different settings categories while the main area displays the selected section.

`nav.vertical` stacks the links and marks the `aria-current` page. A `<layout-card>` with a `<header>` child draws each section with a divided title bar. The page adds a surface to the sidebar region and lines up each icon with its label, selecting by element:

settings-sidebar.html:

```html
<body data-page-layout="sidebar-left" data-layout-gap="none" data-layout-sidebar-width="narrow">
  <!-- Settings Navigation -->
  <nav class="vertical" aria-label="Settings navigation">
    <ul>
      <li>
        <a href="#" aria-current="page">
          <icon-wc name="cog"></icon-wc>
          General
        </a>
      </li>
      <li>
        <a href="#">
          <icon-wc name="shield-check"></icon-wc>
          Security
        </a>
      </li>
      <li>
        <a href="#">
          <icon-wc name="bell"></icon-wc>
          Notifications
        </a>
      </li>
      <li>
        <a href="#">
          <icon-wc name="credit-card"></icon-wc>
          Billing
        </a>
      </li>
    </ul>
  </nav>

  <!-- Settings Content -->
  <main data-layout="stack" data-layout-gap="xl">
    <hgroup>
      <h1>General Settings</h1>
      <p>Manage your account preferences.</p>
    </hgroup>

    <layout-card data-padding="l">
      <header>
        <hgroup>
          <h2>Account Information</h2>
          <p>Update your personal details and contact information.</p>
        </hgroup>
      </header>
      <form data-layout="stack" data-layout-gap="l">
        <!-- Form fields -->
        <button type="submit">Save changes</button>
      </form>
    </layout-card>
  </main>
</body>
```

Settings sidebar CSS:

```css
body > nav {
  background: var(--color-surface);
  border-inline-end: var(--border-width-thin) solid var(--color-border);
  padding: var(--size-l) var(--size-s);
}

body > nav a {
  display: flex;
  align-items: center;
  gap: var(--size-s);
  border-radius: var(--radius-m);
}

body > main {
  padding: var(--size-xl);
}
```

## Tab Navigation

A compact settings layout using `<tab-set>` for section navigation. Each tab is a native `<details name>`, so without JavaScript the sections still open as an accordion. This pattern works well when settings fit on a single page and users need to switch between a few main categories quickly. Toggle switches use VB's built-in `<input data-switch>` for on/off settings.

`<tab-set>` draws the tab bar and panels, links each summary to its panel and handles arrow-key navigation, so the recipe needs no tab CSS or script. The demo adds one rule so setting-row headings read as labels rather than page headings:

Use VB's built-in `<input type="checkbox" data-switch>` for toggle settings — no custom CSS needed. Size variants are available with `data-switch="s"` and `data-switch="l"`.

settings-tabs.html:

```html
<layout-card>
  <tab-set aria-label="Settings sections">
    <details name="settings-tabs" open>
      <summary>Account</summary>
      <form data-layout="stack" data-layout-gap="l">
        <!-- Account settings form -->
        <button type="submit">Save changes</button>
      </form>
    </details>

    <details name="settings-tabs">
      <summary>Security</summary>
      <layout-stack data-layout-gap="l">
        <layout-cluster data-layout-justify="between" data-layout-gap="l">
          <hgroup class="tight">
            <h2 id="two-factor-label">Two-factor authentication</h2>
            <p>Add an extra layer of security to your account.</p>
          </hgroup>
          <input type="checkbox" data-switch name="two_factor" aria-labelledby="two-factor-label"/>
        </layout-cluster>
        <!-- More setting rows... -->
      </layout-stack>
    </details>

    <details name="settings-tabs">
      <summary>Notifications</summary>
      <!-- Notification settings -->
    </details>

    <details name="settings-tabs">
      <summary>Billing</summary>
      <!-- Billing settings -->
    </details>
  </tab-set>
</layout-card>
```

Setting row CSS:

```css
tab-set hgroup > h2 {
  font-size: var(--font-size-m);
}
```

Toggle switch usage:

```html
<!-- Default toggle -->
<input type="checkbox" data-switch name="email_notifications"
       aria-labelledby="email-notifications-label"/>

<!-- Small toggle -->
<input type="checkbox" data-switch="s" name="compact_toggle"/>

<!-- Large toggle -->
<input type="checkbox" data-switch="l" name="prominent_toggle"/>
```

## Configuration

Settings patterns use these layout elements and attributes:

`<tab-set>` keeps the native `<details>`/`<summary>` semantics (each summary is a button) rather than applying ARIA tab roles. When it upgrades it gives the host `role="group"`, links each summary and panel with `aria-controls` / `aria-labelledby`, and keeps `aria-expanded` in sync. Author only the `aria-label` on the `<tab-set>` and a shared `name` on its `<details>`.

## Usage Notes

- Toggle switches: Use `<input type="checkbox" data-switch>` for on/off settings — VB provides complete toggle styling with size variants (`data-switch="s"`, `data-switch="l"`)
- Setting rows: Use `<hgroup class="tight">` for heading + description pairs in setting rows — provides automatic muted text and margin resets
- Form validation: Show validation errors inline near the relevant field, not at the top of the page
- Save states: Provide clear feedback when settings are saved; consider auto-save for simple toggles
- Section organization: Group settings logically by category; put most-used settings first
- Keyboard navigation: `<tab-set>` provides arrow-key navigation between tabs and Enter/Space to activate
- Loading states: Show skeleton placeholders while loading settings to prevent layout shift
- Confirmation dialogs: Confirm before destructive actions like account deletion or password changes
- Deep linking: Support URL fragments or query params to link directly to specific settings sections
- Mobile considerations: Convert sidebar nav to a dropdown or stacked layout on small screens

## Related

Admin dashboards with stats and data tables

Application shell layouts with navigation

Multi-step form workflows

Form input wrapper with labels and validation

SVG icon component with Lucide icons
