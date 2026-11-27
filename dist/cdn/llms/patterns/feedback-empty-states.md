# Empty States

Empty state patterns for when there's no content to display. State-driven feedback with semantic HTML.

- Documentation: https://vanilla-breeze.com/docs/patterns/feedback/empty-states/
- Vanilla Breeze 0.7.4

## Overview

Empty states show feedback when a container has no content to display. They're a state of the container, not a separate component.

Key concepts:
- Use `data-state="empty"` on the container
- Use `<output data-empty data-feedback="message" role="status">` for semantic, accessible feedback
- The `<output>` element is the correct semantic choice — it represents the result of an action (query returned 0 items)
- Mark populated content with `.content` class
- CSS shows/hides content based on state attribute
- Works without JavaScript (progressive enhancement)

See also: Feedback States for the unified pattern covering empty, loading, and error states.

## The Pattern

An empty state is fundamentally feedback about a container's current status. The pattern uses:
- A container with `data-state="empty"` when content is absent
- Content marked with `.content` class that gets hidden via CSS when state is "empty"
- `<output data-empty data-feedback="message" role="status">` to show the feedback

Empty state CSS pattern:

```css
/* Hide feedback by default */
output[data-empty] {
  display: none;
}

/* Hide content when empty, show feedback */
[data-state="empty"] > .content {
  display: none;
}

[data-state="empty"] > [data-empty] {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-m);
  padding: var(--size-xl);
  text-align: center;
}
```

## Simple Example

A minimal empty state with an icon, heading, and description. The container shows where messages would appear, with feedback when none exist.

empty-simple.html:

```html
<section id="messages" data-state="empty">
  <h2 class="visually-hidden">Messages</h2>

  <!-- Populated content -->
  <ul class="content">
    <!-- Message items go here -->
  </ul>

  <!-- Empty state feedback -->
  <output data-empty data-feedback="message" role="status">
    <icon-wc name="inbox"></icon-wc>
    <h3>No messages yet</h3>
    <p>When you receive messages, they will appear here.</p>
  </output>
</section>
```

## With Action Button

An empty state with a call-to-action button inside the output. Use this when users can immediately add content.

empty-action.html:

```html
<section id="documents" data-state="empty">
  <h2 class="visually-hidden">Documents</h2>

  <!-- Populated content -->
  <ul class="content">
    <!-- Document items go here -->
  </ul>

  <!-- Empty state feedback with action -->
  <output data-empty data-feedback="message" role="status">
    <icon-wc name="file-text"></icon-wc>
    <h3>No documents</h3>
    <p>Get started by creating your first document.</p>
    <button type="button">
      <icon-wc name="plus"></icon-wc>
      Create document
    </button>
  </output>
</section>
```

## With Illustration

An empty state with space for a custom illustration or image. Use this for feature-level empty states where visual appeal matters.

empty-illustration.html:

```html
<section id="projects" data-state="empty">
  <h2 class="visually-hidden">Projects</h2>

  <!-- Populated content -->
  <ul class="content">
    <!-- Project items go here -->
  </ul>

  <!-- Empty state feedback with illustration -->
  <output data-empty data-feedback="message" role="status">
    <!-- Decorative SVG uses currentColor for theming -->
    <svg aria-hidden="true" width="192" height="128" viewBox="0 0 192 128" fill="none">
      <rect x="32" y="36" width="128" height="80" rx="6"
            stroke="currentColor" stroke-width="2" opacity="0.25"/>
      <path d="M32 42c0-3.3 2.7-6 6-6h36l8 12h72c3.3 0 6 2.7 6 6"
            stroke="currentColor" stroke-width="2" opacity="0.4"/>
      <!-- Dashed circle + plus icon hint -->
      <circle cx="96" cy="82" r="16" stroke="currentColor"
              stroke-width="2" stroke-dasharray="4 3" opacity="0.2"/>
      <path d="M90 82h12M96 76v12" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" opacity="0.3"/>
    </svg>
    <h3>No projects found</h3>
    <p>You haven't created any projects yet.</p>
  </output>
</section>
```

## Semantic Elements

Use appropriate elements within the output for each content type:

## Accessibility

- `<output>` element: Represents the result of an action. Screen readers announce its content naturally when it becomes visible.
- `role="status"`: Creates a polite live region. When the empty state appears via JavaScript, screen readers announce the message without interrupting.
- `.visually-hidden` headings: Container headings like `<h2 class="visually-hidden">Messages</h2>` provide navigation landmarks for screen reader users even when hidden visually.
- Decorative icons: `<icon-wc>` without a `label` attribute is automatically `aria-hidden="true"`, preventing redundant announcements alongside the heading text.

## JavaScript Integration

The pattern works CSS-only with server-rendered `data-state="empty"`. For dynamic content, toggle the attribute:

Managing state with JavaScript:

```javascript
// Toggle empty state based on content
function updateEmptyState(container, items) {
  if (items.length === 0) {
    container.setAttribute('data-state', 'empty');
  } else {
    container.removeAttribute('data-state');
  }
}

// Example: after fetching data
const messagesContainer = document.getElementById('messages');
fetchMessages().then(messages => {
  updateEmptyState(messagesContainer, messages);
  renderMessages(messages);
});
```

## Icon Options

Choose icons that represent the empty content type. Common icons from the Lucide set:

## Usage Notes

- Be helpful: Explain why the area is empty and what content will appear there
- Provide actions: When possible, include a button or link to add content
- Keep it brief: Use short, clear messages that don't overwhelm
- Match the context: Use icons and illustrations that relate to the content type
- Consider states: Differentiate between "no content yet" and "no results found"

## Related

Unified empty, loading, and error states

404, 500, and maintenance pages

Loading placeholders for content
