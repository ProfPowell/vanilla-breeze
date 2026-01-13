# {{SITE_NAME}} Landing Page

Marketing landing page built with Vanilla Breeze.

## Getting Started

```bash
npm install
npm run dev
```

## Structure

```
src/
├── layouts/           # Page layouts (Astro)
├── components/        # Reusable sections (Astro)
├── pages/             # Page files (Astro)
├── _includes/         # Templates and partials (Eleventy)
│   ├── layouts/       # Page layouts
│   └── components/    # Section components
├── _data/             # Site data (Eleventy)
└── styles/            # CSS files
```

## Sections

The landing page includes:

- **Hero** - Main headline with CTAs
- **Features** - Product feature grid
- **Pricing** - Pricing tiers
- **Testimonials** - Customer quotes
- **FAQ** - Frequently asked questions
- **CTA** - Final call to action

## Customization

### Content

Edit the content directly in:
- `src/pages/index.astro` (Astro)
- `src/index.njk` (Eleventy)

### Styling

Modify the design tokens in `src/styles/_tokens.css`:

```css
:root {
  --color-primary: {{THEME_COLOR}};
}
```

### Adding Pages

Create new pages in `src/pages/` (Astro) or `src/` (Eleventy).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## License

MIT
