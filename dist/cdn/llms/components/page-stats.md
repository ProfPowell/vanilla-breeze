# <page-stats>

Lightweight reading statistics

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/page-stats/
- Vanilla Breeze 0.7.4

## Example

```html
<page-stats data-for="article-content" data-show="reading-time,word-count"></page-stats>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-for` | string |  | ID of the target content element to analyze. Without it (or with an author-rendered <dl> inside) the component renders nothing and adopts the existing markup. |
| `data-wpm` | number | `238` | Words per minute for reading time (default 238, shared with page-info). Chinese/Japanese text is timed at 500 characters per minute. |
| `data-show` | string | `reading-time` | Comma-separated list of stats to display, in fixed order: reading-time, word-count, last-modified. Unknown tokens are ignored. last-modified reads meta[name=last-modified], then meta[property=article:modified_time]; it is omitted when neither is present. |
| `data-label-reading-time` | string | `Reading time` | Visually hidden dt label for the reading-time item. |
| `data-label-word-count` | string | `Word count` | Visually hidden dt label for the word-count item. |
| `data-label-last-modified` | string | `Last updated` | Visually hidden dt label for the last-modified item. |
| `data-label-min-read` | string | `{n} read` | Reading-time text template; {n} is the Intl-formatted minute value ("5 min"). Default "{n} read" for English documents, "{n}" otherwise. |
| `data-label-words` | string | `{n} words` | Word-count text template; {n} is the Intl-formatted count. Per-plural overrides: data-label-words-zero/-one/-two/-few/-many (Intl.PluralRules category of the document language). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-generated` | dl | boolean |  | Set by the component on the <dl> it renders itself. A <dl> without it is author/SSR markup and is adopted unchanged. |
| `data-stats-ignore` | any element inside the target | boolean |  | Exclude this subtree from the word count (script, style, template, noscript, [hidden], [aria-hidden=true] and [inert] are always excluded). |
