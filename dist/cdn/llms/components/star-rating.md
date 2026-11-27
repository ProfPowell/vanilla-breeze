# <star-rating>

Form-associated star rating web component: generates a fieldset[data-rating] of radios (CSS layer) opted into the rating effect (clear, rating:change), and submits one name=value entry via ElementInternals.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/rating/
- Vanilla Breeze 0.7.4

## Example

```html
<fieldset data-rating>
  <legend>Rate this product</legend>
  <label><input type="radio" name="rating" value="1" aria-label="1 star">&#9733;</label>
  <label><input type="radio" name="rating" value="2" aria-label="2 stars">&#9733;</label>
  <label><input type="radio" name="rating" value="3" aria-label="3 stars">&#9733;</label>
  <label><input type="radio" name="rating" value="4" aria-label="4 stars">&#9733;</label>
  <label><input type="radio" name="rating" value="5" aria-label="5 stars">&#9733;</label>
</fieldset>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Form field name. FormData gets exactly one name=value entry via ElementInternals; omit for read-only. |
| `value` | string |  | Rating value, also the form-reset default (default: 0). Observed: changing it after upgrade updates the rating. |
| `max` | string |  | Number of stars (default: 5). Observed: changing it rebuilds the stars, keeping the value. |
| `label` | string |  | Legend text (default: "Rating"). Observed. |
| `allow-half` | boolean |  | Enable half-star increments |
| `readonly` | boolean |  | Display-only mode (role="img" summary, partial stars). Observed. |
| `icon` | string |  | Lucide icon name for icon-wc (default: star text) |
| `required` | boolean |  | Makes rating required for form validation (valueMissing until a star is chosen). Observed. |
| `data-label-one` | string |  | Radio label for the Intl.PluralRules "one" category; {n} is the Intl.NumberFormat value (default "{n} star"). Any CLDR category works (data-label-few, ...). Locale from the closest [lang]. |
| `data-label-other` | string |  | Radio label for categories without their own data-label-* (default "{n} stars") |
| `data-label-readonly` | string |  | Read-only summary; {label}, {value}, {max} are replaced (default "{label}: {value} out of {max}") |
| `data-label-required` | string |  | Validation message when required and empty (default "Please select a rating") |
| `data-label-cleared` | string |  | Live-region announcement when the rating is cleared (default "Rating cleared") |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-rating` | fieldset | boolean |  | Generated: the CSS-only rating fieldset |
| `data-rating-half` | fieldset | boolean |  | Generated with allow-half: half-star labels |
| `data-rating-readonly` | fieldset | boolean |  | Generated with readonly: display-only stars (role=img) |
| `data-effect` | fieldset | string |  | Generated: "rating" opts the fieldset into the rating effect |
| `data-half` | label | `left`, `right` |  | Generated with allow-half: which half of the star the label covers |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `rating:change` |  | Fires (bubbling, from the inner fieldset) when the rating changes, including clear to 0. detail: { value: number } |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `number` | Current rating (0 = none). Settable before connect; applied when the stars are built. |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--rating-color` | Filled star colour (default var(--color-warning)); set on star-rating or any [data-rating] |
| `--rating-color-empty` | Empty star outline colour (default var(--color-text-muted)) |

## Accessibility

- Pattern: Native form controls
- You provide: A label attribute naming what is rated; the legend defaults to "Rating"
- The component manages: `role="img"`, `role="status"`, `aria-label`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Delete` / `Backspace` | Clear the rating | Focus on the selected star, with the rating effect loaded |
