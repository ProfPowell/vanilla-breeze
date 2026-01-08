# Convert Image to Picture Element

Convert an `<img>` element to a `<picture>` element with modern format sources (AVIF, WebP) and fallback.

## Arguments
- `$ARGUMENTS` - The image path or a description of which image to convert

## Instructions

1. Find the `<img>` element to convert in the specified file
2. Extract the current attributes (`src`, `alt`, `loading`, `decoding`, `width`, `height`, etc.)
3. Generate the `<picture>` structure with:
   - AVIF source (highest priority, best compression)
   - WebP source (wide browser support)
   - Original format as `<img>` fallback
4. Preserve all original attributes on the `<img>` element
5. Add appropriate `sizes` attribute if the image is responsive

## Output Template

```html
<picture>
  <source srcset="image.avif" type="image/avif"/>
  <source srcset="image.webp" type="image/webp"/>
  <img src="image.jpg"
       alt="Description"
       loading="lazy"
       decoding="async"
       width="800"
       height="600"/>
</picture>
```

## With Responsive srcset

```html
<picture>
  <source type="image/avif"
          srcset="image-400.avif 400w,
                  image-800.avif 800w,
                  image-1200.avif 1200w"
          sizes="(max-width: 600px) 100vw, 800px"/>
  <source type="image/webp"
          srcset="image-400.webp 400w,
                  image-800.webp 800w,
                  image-1200.webp 1200w"
          sizes="(max-width: 600px) 100vw, 800px"/>
  <img src="image-800.jpg"
       srcset="image-400.jpg 400w,
               image-800.jpg 800w,
               image-1200.jpg 1200w"
       sizes="(max-width: 600px) 100vw, 800px"
       alt="Description"
       loading="lazy"
       decoding="async"/>
</picture>
```

## Usage Examples

```
/add-picture hero-image in index.html
/add-picture examples/pages/about/team-photo.jpg
/add-picture the logo image in the header
```

## Notes

- Run `npm run optimize:images` first to generate WebP/AVIF versions
- Use `npm run optimize:images -- --sizes` to generate multiple sizes for srcset
- The `type` attribute tells browsers which format each source is
- Order matters: browsers use the first supported source
