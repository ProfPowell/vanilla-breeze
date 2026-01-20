# Tailwind vs VB: The Blog Card

**Tagline:** "Same result. 80% less markup."

## The Wow Factor

Side-by-side comparison showing identical visual output with dramatically different code complexity. Demonstrates Vanilla Breeze's semantic approach vs utility class verbosity.

## The Comparison

### Tailwind Approach (~580 characters, 23 classes)

```html
<article class="flex flex-col gap-4 p-4 bg-white rounded-lg border border-gray-200">
  <div class="flex items-center justify-between">
    <span class="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">Tutorial</span>
    <time class="text-sm text-gray-500">Jan 18, 2026</time>
  </div>
  <h3 class="text-lg font-semibold">Building Semantic Layouts</h3>
  <p class="text-gray-600">Learn how to build layouts...</p>
  <div class="flex items-center justify-between mt-auto">
    <span class="text-sm text-gray-500">5 min read</span>
    <a href="#" class="text-blue-600">Read more →</a>
  </div>
</article>
```

### Vanilla Breeze Approach (~290 characters, 4 attributes)

```html
<article class="card" data-layout="stack" data-gap="s">
  <header data-layout="cluster" data-justify="between">
    <span class="tag">Tutorial</span>
    <time>Jan 18, 2026</time>
  </header>
  <h3>Building Semantic Layouts</h3>
  <p>Learn how to build layouts...</p>
  <footer data-layout="cluster" data-justify="between">
    <span>5 min read</span>
    <a href="#">Read more →</a>
  </footer>
</article>
```

## Key Differences

| Metric | Tailwind | Vanilla Breeze |
|--------|----------|----------------|
| Characters | ~580 | ~290 |
| Classes/Attributes | 23 | 4 |
| Semantic HTML | Limited | Full |
| Readability | Noisy | Clean |

## See Also

Link to demo: [View Demo](./tailwind-comparison.html)
