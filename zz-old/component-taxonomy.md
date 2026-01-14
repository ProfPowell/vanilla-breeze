# Web Component Taxonomy

A consolidated reference of UI components, partials, and page patterns across major component libraries. Designed for comparison with HTML-first/standards-based approaches.

---

## Sources Researched

| Library | Type | Notes |
|---------|------|-------|
| **OpenUI** | Standards body | WICG project standardizing component definitions |
| **Web Awesome** | Web Components | Framework-agnostic, successor to Shoelace |
| **Tailwind UI** | HTML/CSS patterns | 500+ components, official Tailwind product |
| **shadcn/ui** | React + Radix + Tailwind | Copy-paste model, 60+ components |

---

## Core Components

### Interactive Elements

| Component | Alternate Names | HTML Basis |
|-----------|-----------------|------------|
| **Accordion** | Collapse, Collapsible, Disclosure, Expandable, Expander | `<details>` |
| **Button** | — | `<button>` |
| **Button Group** | Segmented Control | `<div role="group">` |
| **Dialog** | Modal, Lightbox | `<dialog>` |
| **Drawer** | Sheet, Side Panel, Slide-over | `<dialog>` variant |
| **Dropdown** | Menu, Popover Menu | `<details>` or `popover` |
| **Popover** | Popup, Floating Panel | `popover` attribute |
| **Tabs** | Tab Group, Tab Panel | — |
| **Tooltip** | — | `popover` or title fallback |
| **Command Palette** | Spotlight, Quick Actions, Omnibar | — |

### Form Elements

| Component | Alternate Names | HTML Basis |
|-----------|-----------------|------------|
| **Input** | Text Field | `<input>` |
| **Input Group** | Input with Addons | — |
| **Textarea** | Text Area, Multiline Input | `<textarea>` |
| **Checkbox** | — | `<input type="checkbox">` |
| **Radio** | Radio Button | `<input type="radio">` |
| **Radio Group** | — | `<fieldset>` + radios |
| **Select** | Dropdown, Picker | `<select>` |
| **Combobox** | Autocomplete, Typeahead, Autosuggest | `<input>` + `<datalist>` |
| **Switch** | Toggle | `<input type="checkbox">` styled |
| **Slider** | Range, Range Slider | `<input type="range">` |
| **Color Picker** | — | `<input type="color">` |
| **Date Picker** | Calendar Input | `<input type="date">` |
| **File Upload** | File Input, Dropzone | `<input type="file">` |
| **OTP Input** | Verification Code, PIN Input | multiple `<input>` |
| **Rating** | Star Rating | — |

### Navigation

| Component | Alternate Names | HTML Basis |
|-----------|-----------------|------------|
| **Navbar** | Header, Top Navigation, App Bar | `<header>` + `<nav>` |
| **Sidebar** | Side Navigation, Vertical Nav, Rail | `<aside>` + `<nav>` |
| **Breadcrumb** | — | `<nav>` + `<ol>` |
| **Pagination** | Pager | `<nav>` + links |
| **Tabs** | Tab Bar | — |
| **Menu** | Navigation Menu | `<nav>` + `<ul>` |
| **Flyout Menu** | Mega Menu, Dropdown Nav | — |
| **Tree** | Tree View | nested `<ul>` |

### Feedback & Status

| Component | Alternate Names | HTML Basis |
|-----------|-----------------|------------|
| **Alert** | Banner, Message, Notification (inline) | `role="alert"` |
| **Toast** | Snackbar, Notification (floating) | `role="status"` |
| **Callout** | Admonition, Note, Tip, Warning | `<aside>` |
| **Badge** | Tag, Chip, Label, Pill | `<span>` |
| **Progress Bar** | — | `<progress>` |
| **Progress Ring** | Circular Progress | — |
| **Spinner** | Loading, Loader | — |
| **Skeleton** | Placeholder, Shimmer | — |
| **Empty State** | Zero State, No Data | — |

### Data Display

| Component | Alternate Names | HTML Basis |
|-----------|-----------------|------------|
| **Table** | Data Table, Grid | `<table>` |
| **List** | — | `<ul>` or `<ol>` |
| **Stacked List** | — | `<ul>` |
| **Grid List** | Card Grid | — |
| **Feed** | Activity Feed, Timeline | — |
| **Card** | Tile | `<article>` |
| **Avatar** | Profile Image | `<img>` |
| **Description List** | Definition List, Key-Value | `<dl>` |
| **Stats** | Metrics, KPIs | — |
| **Calendar** | — | `<table>` |

### Layout

| Component | Alternate Names | HTML Basis |
|-----------|-----------------|------------|
| **Container** | Wrapper, Max-Width | `<div>` |
| **Divider** | Separator, Hr, Rule | `<hr>` |
| **Split Panel** | Resizable Panels | — |
| **Scroll Area** | Scrollable Container | — |
| **Aspect Ratio** | — | CSS `aspect-ratio` |

### Media

| Component | Alternate Names | HTML Basis |
|-----------|-----------------|------------|
| **Image** | Picture | `<img>`, `<picture>` |
| **Animated Image** | GIF | — |
| **Icon** | — | `<svg>` or icon font |
| **Carousel** | Slider, Slideshow, Gallery | — |
| **Comparison** | Before/After, Image Diff | — |
| **Video** | — | `<video>` |
| **Zoomable** | Lightbox, Image Zoom | — |

### Utilities

| Component | Purpose |
|-----------|---------|
| **Animation** | Transition effects |
| **Copy Button** | Clipboard copy |
| **Format Bytes** | File size display |
| **Format Date** | Date/time formatting |
| **Format Number** | Number formatting |
| **Format Time** | Relative time (e.g., "2 hours ago") |
| **Include** | HTML fragment injection |
| **Intersection Observer** | Visibility detection |
| **Mutation Observer** | DOM change detection |
| **Resize Observer** | Size change detection |
| **QR Code** | QR generation |
| **Visually Hidden** | Screen reader only text |

---

## Page Patterns

### Marketing / Landing Pages

- Hero Section
- Feature Section
- CTA (Call to Action)
- Bento Grid
- Pricing Section
- Testimonials
- Logo Cloud
- Stats Section
- Team Section
- FAQ Section
- Newsletter Signup
- Contact Section
- 404 / Error Page

### Application Screens

- Dashboard / Home Screen
- Detail Screen
- Settings Screen
- List View
- Grid View
- Profile Page
- Onboarding Flow

### E-commerce

- Storefront / Home
- Category Page
- Product List
- Product Detail
- Product Quickview
- Shopping Cart
- Checkout
- Order Summary
- Order History
- Order Detail

### Authentication

- Sign In
- Sign Up / Register
- Password Reset
- Two-Factor / OTP

---

## Partial Patterns

### Headers & Navigation

- Simple Header
- Header with Search
- Header with User Menu
- Sticky Header
- Mobile Header with Hamburger
- Breadcrumb Trail

### Footers

- Simple Footer
- Multi-column Footer
- Footer with Newsletter
- Minimal Footer

### Content Sections

- Two-column Layout
- Three-column Layout
- Sidebar Layout
- Card Grid
- Masonry Grid
- Media Object (image + text)

### Forms

- Contact Form
- Login Form
- Registration Form
- Search Form
- Filter Panel
- Settings Form
- Multi-step Form / Wizard

### Overlays

- Confirmation Dialog
- Alert Dialog
- Form in Modal
- Image Lightbox
- Slide-out Drawer
- Command Palette

---

## HTML-Native Equivalents

Components with direct or near-direct HTML implementations:

| Component | HTML/CSS Implementation |
|-----------|-------------------------|
| Accordion | `<details>` + `<summary>` |
| Dialog/Modal | `<dialog>` |
| Popover | `popover` attribute |
| Tooltip | `popover` (or CSS `:hover` + positioning) |
| Tabs | Radio buttons + `:checked` selector |
| Progress | `<progress>` |
| Meter | `<meter>` |
| Slider | `<input type="range">` |
| Color Picker | `<input type="color">` |
| Date Picker | `<input type="date/datetime-local">` |
| Combobox | `<input>` + `<datalist>` |
| Details Menu | `<details>` for dropdown-like behavior |

---

## Components Requiring JavaScript

These patterns have no pure HTML/CSS equivalent:

- **Command Palette** — search + keyboard navigation
- **Toast** — timed appearance/dismissal
- **Carousel** — slide transitions, autoplay
- **Tree View** — dynamic expand/collapse with state
- **Data Table** — sorting, filtering, pagination
- **Drag and Drop** — reordering
- **Virtual Scroll** — large list performance
- **Rich Text Editor** — contenteditable + formatting

---

## Naming Conventions by Library

| Concept | Web Awesome | Tailwind UI | shadcn/ui |
|---------|-------------|-------------|-----------|
| Collapsible | `wa-details` | Disclosure | Collapsible |
| Modal | `wa-dialog` | Modal Dialog | Dialog |
| Side Panel | `wa-drawer` | Slide-over | Sheet |
| Floating UI | `wa-popup` | — | Popover |
| Status Pill | `wa-tag` | Badge | Badge |
| Checkbox styled | `wa-switch` | Toggle | Switch |
| Selection List | `wa-select` | Select Menu | Select |
| Search Select | `wa-combobox` | Combobox | Combobox |
| Notification | `wa-alert` | Alert | Alert |
| Loading | `wa-spinner` | — | Spinner |

---

## Component Prefix Reference

| Library | Prefix | Example |
|---------|--------|---------|
| Web Awesome | `wa-` | `<wa-button>` |
| Shoelace (legacy) | `sl-` | `<sl-button>` |
| UI5 Web Components | `ui5-` | `<ui5-button>` |
| Lion (ING) | `lion-` | `<lion-button>` |
| Spectrum (Adobe) | `sp-` | `<sp-button>` |

---

## References

- [Open UI Component Matrix](https://open-ui.org/research/component-matrix/)
- [Web Awesome Components](https://www.webawesome.com/components)
- [Tailwind UI](https://tailwindui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Component Gallery](https://component.gallery/) — cross-library component reference
