# Container Query Killer

**Tagline:** "Responsive without media queries."

## The Wow Factor

The `data-layout="switcher"` attribute with `data-threshold` provides true intrinsic responsive design. Elements switch from horizontal to vertical layout based on container width WITHOUT using container queries or media queries. This means your component automatically adapts to its available space, making it truly reusable across different contexts.

## How It Works

The magic lies in a clever CSS flexbox formula:

```css
flex-basis: calc((var(--threshold) - 100%) * 999);
```

This single line creates responsive behavior with pure CSS:

- **When container > threshold:** The flex-basis calculation produces a negative value → flex items stay horizontal in a row
- **When container < threshold:** The flex-basis calculation produces a huge positive value → flex items are forced to stack vertically
- **Pure CSS, no JavaScript:** No container queries needed, no media queries required, and no JavaScript overhead

The `999` multiplier amplifies the difference between threshold and container width, ensuring a dramatic switch between layouts.

## Usage

```html
<section data-layout="switcher" data-threshold="30rem" data-gap="m">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</section>
```

**Attributes:**
- `data-layout="switcher"` - Activates the switcher layout mode
- `data-threshold` - The container width breakpoint (in rem units) where the layout switches
- `data-gap` - The spacing between items (follows your gap scale: xs, s, m, l, xl, etc.)

## Threshold Options

| Value | Width | Use Case |
|-------|-------|----------|
| 20rem | 320px | Very small containers, mobile-first components |
| 25rem | 400px | Small sidebar or widget containers |
| 30rem | 480px | Default, balanced for most use cases |
| 35rem | 560px | Medium containers, typical card layouts |
| 40rem | 640px | Larger containers, dashboard panels |
| 45rem | 720px | Extra-large containers, full-width sections |

## Demo Features

- **Resizable Container:** Drag the container edge to see the layout switch in real-time
- **Threshold Selector:** Quick buttons to test different threshold values
- **Pricing Cards Example:** Pre-built pricing card layout demonstrating the switcher in action
- **Live Preview:** Watch responsive behavior without page refresh or browser resizing

## See Also

- [View Demo](./layout-switcher.html)
- [Vanilla Breeze Layout Documentation](../layout.html)
