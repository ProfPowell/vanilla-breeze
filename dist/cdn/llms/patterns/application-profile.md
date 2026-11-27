# Profile

User profile patterns with avatar displays, stats, activity feeds, and action buttons. Build profile pages and user cards for your applications.

- Documentation: https://vanilla-breeze.com/docs/patterns/application/profile/
- Vanilla Breeze 0.7.4

## Overview

Profile patterns display user information in various contexts, from compact cards to full-page layouts. These patterns combine avatars, user data, statistics, and interactive elements into cohesive displays.

Key features:
- Avatar display with image or initials fallback
- `<hgroup>` for name + role pairs with automatic muted subtitle styling
- `<dl>` / `<dt>` / `<dd>` for stat label/value pairs — semantic and accessible
- Activity feeds showing recent actions
- Action buttons for messaging, following, and editing
- Responsive sidebar layout that automatically stacks on smaller screens

## Profile Header

A profile header built on `data-layout="media"`: a large avatar in the figure column, with the name, role, bio, stats row and edit button stacked beside it. Ideal for the top of a user's profile page.

The hgroup mutes the role, `data-variant="stacked"` mutes the stat labels and drops the `<dd>` indent, and `<strong>` weights the numbers. No extra CSS is needed: a stacked list that is also `data-layout` spaces its groups with the layout's gap instead of a block margin.

profile-header.html:

```html
<layout-card data-padding="xl">
  <header data-layout="media" data-layout-gap="xl">
    <!-- Avatar: slot="figure" puts it in the media column -->
    <user-avatar data-size="2xl" slot="figure">
      <span data-fallback>JD</span>
    </user-avatar>

    <!-- Name and Role -->
    <hgroup>
      <h1>Jane Doe</h1>
      <p>Senior Product Designer</p>
    </hgroup>

    <!-- Bio -->
    <p>Passionate about creating intuitive user experiences...</p>

    <!-- Stats -->
    <dl data-layout="cluster" data-layout-gap="xl" data-variant="stacked">
      <dl-item>
        <dt>Posts</dt>
        <dd><strong>142</strong></dd>
      </dl-item>
      <dl-item>
        <dt>Followers</dt>
        <dd><strong>12.4K</strong></dd>
      </dl-item>
      <dl-item>
        <dt>Following</dt>
        <dd><strong>891</strong></dd>
      </dl-item>
    </dl>

    <!-- Edit Button -->
    <p>
      <button type="button" class="button secondary">
        <icon-wc name="edit" size="sm"></icon-wc>
        Edit Profile
      </button>
    </p>
  </header>
</layout-card>
```

## Profile Card

A compact profile card suitable for user lists, team member displays, or search results. Features an avatar, name, email, description, and action buttons.

No custom CSS: `<hgroup>` mutes the email line, and `slot="figure"` sends the avatar to the media column.

profile-card.html:

```html
<layout-card data-padding="l">
  <layout-stack data-layout-gap="m">
    <header data-layout="media" data-layout-gap="m" data-layout-align="center">
      <user-avatar data-size="lg" slot="figure">
        <img src="user-photo.jpg" alt="Alex Thompson" />
      </user-avatar>
      <hgroup>
        <h2>Alex Thompson</h2>
        <p><a href="mailto:alex@example.com">alex@example.com</a></p>
      </hgroup>
    </header>
    <p>Full-stack developer with 8 years of experience.</p>
    <layout-cluster data-layout-gap="s">
      <button type="button" class="button small">
        <icon-wc name="mail" size="sm"></icon-wc>
        Message
      </button>
      <button type="button" class="button small secondary">
        <icon-wc name="user-plus" size="sm"></icon-wc>
        Follow
      </button>
    </layout-cluster>
  </layout-stack>
</layout-card>
```

## Full Profile Page

A complete profile page layout with a sidebar containing user info and a main content area showing an `<activity-feed>`. Uses `<layout-sidebar>` with an `<aside>` for the responsive two-column layout.

`<activity-feed>` lays out each `<article data-activity>` with its icon rail and turns the authored `<time>` into a relative timestamp. The only page CSS is the stat-row rule shown under Profile Header.

profile-full.html:

```html
<layout-sidebar data-layout-gap="xl" data-layout-sidebar-width="wide" data-layout-content-min="m">
  <!-- Profile Sidebar -->
  <aside aria-label="Profile">
    <layout-card data-padding="l">
      <layout-center data-layout-intrinsic data-layout-text data-layout-gutter="none" data-layout-gap="l">
        <user-avatar data-size="2xl">
          <img src="user-photo.jpg" alt="Sarah Chen" />
          <span data-status="online"></span>
        </user-avatar>

        <hgroup data-align="center">
          <h1>Sarah Chen</h1>
          <p>Engineering Manager</p>
        </hgroup>

        <p>Leading distributed teams...</p>

        <dl data-layout="cluster" data-layout-gap="l" data-layout-justify="center" data-variant="stacked">
          <dl-item>
            <dt>Posts</dt>
            <dd><strong>89</strong></dd>
          </dl-item>
          <!-- More stats... -->
        </dl>

        <layout-cluster data-layout-gap="s" data-layout-justify="center">
          <button type="button" class="button">Follow</button>
          <button type="button" class="button secondary">Message</button>
        </layout-cluster>
      </layout-center>
    </layout-card>
  </aside>

  <!-- Activity Feed -->
  <section data-layout="stack" data-layout-gap="l" aria-labelledby="activity-heading">
    <header data-layout="cluster" data-layout-justify="between">
      <h2 id="activity-heading">Recent Activity</h2>
      <!-- Filter buttons -->
    </header>

    <layout-card>
      <activity-feed aria-label="Recent activity">
        <article data-activity data-activity-icon="file-text">
          Published <a href="/posts/microservices">Building Resilient Microservices</a>
          <time datetime="2026-07-06T08:00:00Z">Jul 6, 2026</time>
        </article>
        <!-- More activity entries... -->
      </activity-feed>
    </layout-card>
  </section>
</layout-sidebar>
```

## Configuration

Profile patterns use these layout elements and attributes:

## Usage Notes

- Avatar fallbacks: Always provide initials via `<span data-fallback>` as a fallback when images fail to load
- Status indicators: Use `<span data-status="online">` inside `user-avatar` to show user presence
- Heading groups: Use `<hgroup>` for name + role pairs — the `<p>` inside automatically gets muted color styling
- Semantic stats: Use `<dl data-variant="stacked">` with one `<dl-item>` per stat, label (`<dt>`) before value (`<dd>`), instead of generic `<div>` / `<span>` elements
- Responsive layouts: The sidebar layout automatically stacks on smaller screens when `data-layout-content-min` is reached
- Sticky sidebar: `data-layout-sticky` works on `<nav>` and `<aside>` within page layouts, not on `<layout-card>`
- Accessibility: Ensure avatar images have meaningful `alt` text and buttons have clear labels
- Stats formatting: Use abbreviated numbers (e.g., 12.4K) for large counts to maintain visual balance
- Empty states: Provide helpful messages when activity feeds are empty

## Related

Admin dashboards with stats and data tables

Avatar element documentation and API

Card container element documentation

Icon element documentation and available icons

Accessible feed of timestamped user actions
