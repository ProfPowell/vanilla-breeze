# Skeleton

Skeleton loading patterns to display placeholder content while data is being fetched. Reduce perceived load time with animated placeholders.

- Documentation: https://vanilla-breeze.com/docs/patterns/feedback/skeleton/
- Vanilla Breeze 0.7.4

## Overview

Skeleton loaders create a visual preview of content that will appear, giving users an immediate sense of the page structure. They are preferable to spinners for content-heavy pages as they maintain layout stability and feel faster.

Vanilla Breeze draws skeletons from the markup you already have. Put `data-loading="skeleton"` on a container and each direct child becomes a placeholder block the size of its own content: text turns transparent, headings and buttons take a darker shade, and a shimmer sweeps across every block. Remove the attribute when the data arrives and the same elements show their real content, so nothing shifts.

Key features:
- No skeleton classes: one attribute on the container, from `src/utils/loading.css`
- Placeholder sizes come from the placeholder content itself, so widths vary naturally
- Shimmer animation that stops under `prefers-reduced-motion`
- Accessible loading states with `aria-busy="true"`
- Works with layout primitives like `<layout-stack>` for structure

## Text Placeholder

Display placeholder lines for text content like paragraphs. Each child is one block, so write placeholder text of different lengths to vary the widths. `data-layout-align="start"` lets each block shrink to its text instead of stretching to the full width.

## Placeholder article heading

Placeholder text that stands in for the first line of the paragraph while it loads

Placeholder text that stands in for the second line of the paragraph as well

A shorter placeholder for the closing line

## Card Placeholder

A complete card skeleton with image placeholder, heading, text lines, and button. Use this pattern for product cards, blog posts, or any content card that loads asynchronously. A direct `<img>` child becomes the block, sized by its `width` and `height`, with the image itself hidden.

skeleton-card.html:

```html
<layout-card data-padding="m" aria-busy="true" aria-label="Loading card" role="status">
  <layout-stack data-loading="skeleton" data-layout-gap="xs"
                data-layout-align="start" aria-hidden="true">
    <img src="placeholder.svg" alt="" width="600" height="400"/>
    <h3>Placeholder card title</h3>
    <p>Placeholder summary line for the card</p>
    <p>A shorter second line</p>
    <button type="button" disabled>Read more</button>
  </layout-stack>
</layout-card>
```

## Table Placeholder

Table skeleton with real headers and placeholder rows. Put `data-loading="skeleton"` on each cell and wrap its placeholder text in a `<span>`: the span becomes an inline bar the length of its text, so columns keep their real widths. Use this when loading tabular data.

skeleton-table.html:

```html
<layout-card data-padding="none" aria-busy="true" aria-label="Loading table data" role="status">
  <table>
    <thead>
      <tr>
        <th scope="col">User</th>
        <th scope="col">Email</th>
        <th scope="col">Role</th>
        <th scope="col">Status</th>
        <th scope="col">Joined</th>
      </tr>
    </thead>
    <tbody aria-hidden="true">
      <tr>
        <td data-loading="skeleton"><span>Placeholder name</span></td>
        <td data-loading="skeleton"><span>placeholder@example.com</span></td>
        <td data-loading="skeleton"><span>Editor</span></td>
        <td data-loading="skeleton"><span>Active</span></td>
        <td data-loading="skeleton"><span>Jan 2026</span></td>
      </tr>
      <!-- Additional rows... -->
    </tbody>
  </table>
</layout-card>
```

## Skeletons in Feedback States

When a container switches between loading, empty, error and populated with `data-state`, show the skeleton as its loading feedback instead: an `<output data-loading data-feedback="skeleton">` of `.skeleton-line` spans (from `src/utils/feedback-states.css`). It appears only while the container has `data-state="loading"`. See Feedback States.

## Configuration

Skeletons are configured with attributes, not classes:

## Accessibility

- Add `aria-busy="true"` to loading containers. Remove the attribute when content finishes loading.
- Include an `aria-label` describing the loading state so screen readers announce meaningful context (e.g. "Loading card").
- Mark the placeholder content `aria-hidden="true"`. Its text is only there to size the blocks; transparent text is still read aloud.
- Disable placeholder buttons with `disabled` so they cannot take focus.
- Use `role="status"` with a live region announcement when content finishes loading so assistive technology is notified.
- The shimmer stops under `prefers-reduced-motion: reduce`; the blocks stay as static shapes.

## Usage Notes

- Swap, don't rebuild: Render the real elements with placeholder text, then replace the text and remove `data-loading`. The block sizes carry over, so the layout does not shift.
- Layout stability: Match placeholder lengths and image dimensions to the real content to prevent layout shift (CLS) when content loads.
- Only direct children: Nested elements are not drawn as separate blocks. Put the attribute on the element whose children are the shapes you want, as the table does per cell.
- Duration: Use skeletons for loads under 3-5 seconds. For longer waits, consider progress indicators with estimated time.

## Related

Unified empty, loading, and error states

When there's no content to display

404, 500, and maintenance pages
