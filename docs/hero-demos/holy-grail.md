# Holy Grail Challenge

**Tagline:** "5 Elements. Complete Page Layout. Zero CSS."

## The Wow Factor

The Holy Grail layout is a classic web design challenge: creating a complete page layout with a header, footer, navigation sidebar, content area, and optional right sidebar. Vanilla Breeze solves this elegantly using `data-layout="holy-grail"`, which creates a complete page layout using CSS Grid with named areas that automatically adapts when semantic elements (nav, aside) are missing. The magic happens through CSS `:has()` selectors that detect the presence or absence of each section and adjust the grid template accordingly—transforming from a 3-column layout to 2-column or even 1-column configurations without any JavaScript.

## How It Works

The Holy Grail implementation combines CSS Grid's power with modern CSS selector techniques:

- **Grid named areas:** The layout defines five named grid areas—header, nav, main, aside, and footer—each representing a semantic section of the page.
- **`:has()` selectors:** These CSS selectors detect whether specific elements exist within the layout container, enabling the grid to respond dynamically.
- **Layout auto-adapts:** Depending on which elements are present, the grid automatically reconfigures:
  - All 5 elements present → 3-column layout (nav | main | aside)
  - No aside element → 2-column layout (nav | main)
  - No nav element → 2-column layout (main | aside)
  - No nav or aside → 1-column layout (main only)
- **Mobile responsive:** At breakpoints below 60rem, the layout stacks vertically to accommodate smaller screens, ensuring usability across all device sizes.

## Usage

Implement the Holy Grail layout with simple semantic HTML. Just add `data-layout="holy-grail"` to your `body` element and structure your page with the standard semantic sections:

```html
<body data-layout="holy-grail">
  <header>Header</header>
  <nav>Navigation</nav>
  <main>Main Content</main>
  <aside>Sidebar</aside>
  <footer>Footer</footer>
</body>
```

The layout automatically adapts based on which elements you include. Remove any section and the grid reconfigures itself—no CSS changes needed.

## Available Adaptations

The layout intelligently responds to different content structures:

| Elements Present | Layout | Use Case |
|-----------------|--------|----------|
| All 5 elements | 3-column | Full page with navigation and sidebar |
| No aside | 2-column (nav + main) | Left navigation, no right sidebar |
| No nav | 2-column (main + aside) | Right sidebar, no left navigation |
| No nav or aside | 1-column | Main content only, minimal layout |

## Demo Features

The interactive Holy Grail Challenge demo showcases these capabilities in action:

- **Interactive toggles** to show/hide the navigation and aside elements in real-time
- **Real-time status indicator** displaying the current layout type and configuration
- **Responsive behavior** that adapts automatically as elements are toggled
- **Contained within demo region** for easy embedding and sharing

Try toggling the nav and aside elements to see how the layout seamlessly adapts from 3-column to 2-column to 1-column configurations.

## See Also

Explore the Holy Grail layout in action: [View Demo](./holy-grail.html)
