# Vanilla Breeze Astro Integration

Astro components and layouts for building sites with Vanilla Breeze.

## Installation

Copy the `astro/` directory into your Astro project's `src/` folder.

## Components

### BaseHead
Standard `<head>` setup with meta tags, OG data, and theme initialization.

```astro
---
import BaseHead from './components/BaseHead.astro';
---
<head>
  <BaseHead title="Page Title" description="Page description" />
</head>
```

### ThemeToggle
Theme switcher button using `theme-wc`.

```astro
---
import ThemeToggle from './components/ThemeToggle.astro';
---
<ThemeToggle />
```

### NavTree
Tree navigation from structured data.

```astro
---
import NavTree from './components/NavTree.astro';
const nav = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs/', children: [...] }
];
---
<NavTree items={nav} />
```

### PageToc
Auto-generated table of contents.

```astro
---
import PageToc from './components/PageToc.astro';
const { headings } = Astro.props;
---
<PageToc headings={headings} />
```

### Card
Wrapper for `layout-card` element.

```astro
---
import Card from './components/Card.astro';
---
<Card variant="outlined" interactive href="/item/">
  <h3>Card Title</h3>
</Card>
```

### FormField
Wrapper for `form-field` element.

```astro
---
import FormField from './components/FormField.astro';
---
<FormField
  label="Email"
  name="email"
  type="email"
  required
  hint="We'll never share your email."
/>
```

## Layouts

### BaseLayout
Minimal page structure with header and footer.

```astro
---
import BaseLayout from './layouts/BaseLayout.astro';
---
<BaseLayout title="Home" description="Welcome">
  <h1>Hello World</h1>
</BaseLayout>
```

### DocsLayout
Documentation page with sidebar navigation.

```astro
---
import DocsLayout from './layouts/DocsLayout.astro';
import { getEntry } from 'astro:content';
const { headings } = await Astro.props;
---
<DocsLayout
  title="Getting Started"
  description="Learn how to use Vanilla Breeze"
  headings={headings}
  navigation={nav}
>
  <slot />
</DocsLayout>
```

### BlogLayout
Blog post layout with metadata and author info.

```astro
---
import BlogLayout from './layouts/BlogLayout.astro';
---
<BlogLayout
  title="Post Title"
  description="Post excerpt"
  pubDate={new Date('2024-01-15')}
  author="John Doe"
  tags={['css', 'web']}
>
  <slot />
</BlogLayout>
```

### LandingLayout
Marketing page with hero support.

```astro
---
import LandingLayout from './layouts/LandingLayout.astro';
---
<LandingLayout title="Product Name" description="Product description">
  <section class="hero">...</section>
  <section class="features">...</section>
</LandingLayout>
```

## Styles

Import `astro-overrides.css` after `main.css` for Astro-specific styles:

```css
@import 'vanilla-breeze/main.css';
@import './styles/astro-overrides.css';
```
