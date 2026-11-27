/**
 * Vanilla Breeze conventions as html-validate rules.
 *
 * Element and attribute-value checks come from the generated element
 * metadata (elements.cjs); these rules cover what metadata cannot say:
 * no <div> for layout, no inline styles, state in data-* not classes,
 * <icon-wc> over inline SVG, <form-field> for validated controls,
 * data-layout-* names no layout defines, and data-* attributes Vanilla
 * Breeze does not read.
 *
 * Every message ends with the fix, so a tool or an agent can act on the
 * report without opening the docs.
 */
import { createRequire } from 'node:module';
import { Rule } from 'html-validate';

const require = createRequire(import.meta.url);
/** @type {string[]} */
const KNOWN_DATA = require('./data-attributes.cjs');
const elements = require('./elements.cjs');

const knownData = new Set(KNOWN_DATA);
const layoutAttributes = new Set(Object.keys(elements['*']?.attributes ?? {}).filter((name) => name.startsWith('data-layout')));
const vbElements = new Set(Object.keys(elements).filter((name) => name.includes('-')));
/** Attribute families read by computed name, so no literal appears in the source. */
const DYNAMIC_DATA_PREFIXES = ['data-label-'];

const DOCS = 'https://vanilla-breeze.com/docs';

/** Class-name fragments on a <div> and the element that says the same thing. */
const DIV_ALTERNATIVES = [
  // Layout words first: "card-grid" is a grid, not a card.
  ['grid', 'a semantic element with data-layout="grid"'], ['row', 'a semantic element with data-layout="cluster"'],
  ['stack', 'a semantic element with data-layout="stack"'], ['sidebar', '<aside>, inside data-layout="sidebar"'],
  ['header', '<header>'], ['nav', '<nav>'], ['footer', '<footer>'], ['aside', '<aside>'],
  ['section', '<section>'], ['article', '<article>'], ['main', '<main>'], ['content', '<main> or <section>'],
  ['card', '<article> or <layout-card>'],
  ['wrapper', 'the semantic parent (drop the wrapper)'], ['container', '<section> or data-layout="center"'],
];

const SEMANTIC_CHILDREN = new Set([
  'article', 'section', 'header', 'footer', 'nav', 'main', 'aside', 'ul', 'ol', 'form', 'table', 'figure', 'details',
  'fieldset', 'dialog', 'menu',
]);

const STATE_CLASSES = new Set([
  'active', 'inactive', 'open', 'closed', 'hidden', 'visible', 'selected', 'disabled', 'enabled', 'expanded',
  'collapsed', 'loading', 'loaded', 'error', 'success', 'pending', 'checked', 'focused', 'highlighted', 'current',
]);

/** Custom properties a layout documents as a one-off escape hatch. */
const ESCAPE_HATCH_PROPS = new Set(['--layout-min', '--layout-threshold', '--layout-content-min']);

/** @param {string} url */
const documentation = (url, description) => ({ description, url });

export class NoDiv extends Rule {
  documentation() {
    return documentation(`${DOCS}/semantic-layouts/`, 'Vanilla Breeze lays out semantic elements with data-layout; <div> adds no meaning. The <div> group inside <dl> is allowed.');
  }

  setup() {
    this.on('dom:ready', (event) => {
      for (const div of event.document.querySelectorAll('div')) {
        if (div.parent?.tagName?.toLowerCase() === 'dl') continue;
        const children = div.childElements;
        const only = children.length === 1 ? children[0].tagName.toLowerCase() : '';
        if (SEMANTIC_CHILDREN.has(only)) {
          this.report(div, `<div> wraps a single <${only}>: remove the <div> and move its attributes to the <${only}>`);
          continue;
        }
        const className = String(div.getAttributeValue('class') ?? '').toLowerCase();
        const match = className && DIV_ALTERNATIVES.find(([fragment]) => className.includes(fragment));
        this.report(div, match
          ? `<div class="${className}">: use ${match[1]}`
          : '<div>: use a semantic element (<section>, <article>, <header>, <footer>, <aside>, <nav>, <main>) and put data-layout on it for layout');
      }
    });
  }
}

export class NoInlineStyle extends Rule {
  documentation() {
    return documentation(`${DOCS}/principles/`, 'Styling lives in CSS and is switched with data-* attributes. The exception is a style attribute that only sets a documented layout escape hatch (--layout-min, --layout-threshold, --layout-content-min).');
  }

  setup() {
    this.on('attr', (event) => {
      if (event.key.toLowerCase() !== 'style') return;
      const tag = event.target.tagName.toLowerCase();
      if (tag === 'meta' || tag === 'link') return;
      const declarations = String(event.value ?? '').split(';').map((d) => d.trim()).filter(Boolean);
      const escapeHatch = declarations.length > 0 && declarations.every((d) => ESCAPE_HATCH_PROPS.has(d.split(':')[0].trim()));
      if (escapeHatch) return;
      this.report(event.target, 'Inline style: remove it and use the data-* attribute the layout or component documents (spacing, alignment and variants are attributes)', event.keyLocation);
    });
  }
}

export class NoClassForState extends Rule {
  documentation() {
    return documentation(`${DOCS}/principles/`, 'State and configuration are data-* attributes; classes name what a thing is. <output class="error"> and <output class="hint"> are the form-field contract and are allowed.');
  }

  setup() {
    this.on('attr', (event) => {
      if (event.key.toLowerCase() !== 'class' || event.target.tagName.toLowerCase() === 'output') return;
      const state = String(event.value ?? '').split(/\s+/).find((token) => STATE_CLASSES.has(token.toLowerCase()));
      if (state) this.report(event.target, `class="${state}" is state: use data-state="${state}" or the attribute the component documents`, event.valueLocation ?? event.keyLocation);
    });
  }
}

export class IconWcRequired extends Rule {
  documentation() {
    return documentation(`${DOCS}/elements/web-components/icon-wc/`, 'Icons are <icon-wc name="…">. An inline <svg> that is a real image (role="img") or decorative (aria-hidden="true") is allowed.');
  }

  setup() {
    this.on('dom:ready', (event) => {
      for (const svg of event.document.querySelectorAll('svg')) {
        if (svg.getAttributeValue('role') === 'img' || svg.getAttributeValue('aria-hidden') === 'true') continue;
        if (svg.closest('icon-wc')) continue;
        this.report(svg, 'Inline <svg>: use <icon-wc name="…"> for an icon, or add role="img" (an image) or aria-hidden="true" (decoration)');
      }
    });
  }
}

export class UseFormField extends Rule {
  documentation() {
    return documentation(`${DOCS}/elements/web-components/form-field/`, 'A control with validation belongs in <form-field> with its <label>, so the message, hint and required marker are wired up.');
  }

  setup() {
    this.on('dom:ready', (event) => {
      for (const form of event.document.querySelectorAll('form')) {
        const loose = form.querySelectorAll('input, textarea, select').find((control) => {
          const validated = ['required', 'pattern', 'minlength', 'maxlength'].some((name) => control.hasAttribute(name))
            || ['email', 'url', 'number'].includes(String(control.getAttributeValue('type') ?? ''));
          return validated && !control.closest('form-field');
        });
        if (loose) this.report(loose, `<${loose.tagName.toLowerCase()}> has validation but is not in a <form-field>: wrap the <label> and the control in <form-field>`);
      }
    });
  }
}

export class LayoutAttribute extends Rule {
  documentation() {
    return documentation(`${DOCS}/layouts/`, 'A data-layout-* attribute that no layout defines does nothing: nothing matches it and nothing reports it.');
  }

  setup() {
    this.on('attr', (event) => {
      const name = event.key.toLowerCase();
      if (!name.startsWith('data-layout-') || layoutAttributes.has(name)) return;
      this.report(event.target, `${name} is not a layout attribute, so it does nothing. Layout attributes: ${[...layoutAttributes].sort().join(', ')}`, event.keyLocation);
    });
  }
}

export class KnownDataAttribute extends Rule {
  documentation() {
    return documentation(`${DOCS}/attributes/`, 'A data-* attribute on a Vanilla Breeze element that Vanilla Breeze never reads is either your own hook or a name that does not exist.');
  }

  setup() {
    this.on('attr', (event) => {
      const name = event.key.toLowerCase();
      if (!name.startsWith('data-') || name.startsWith('data-layout-')) return;
      const tag = event.target.tagName.toLowerCase();
      if (!vbElements.has(tag) || knownData.has(name) || DYNAMIC_DATA_PREFIXES.some((prefix) => name.startsWith(prefix))) return;
      this.report(event.target, `${name} is not read by Vanilla Breeze: check the attributes documented for <${tag}>, or ignore this if it is your own hook`, event.keyLocation);
    });
  }
}

export const rules = {
  'vb/no-div': NoDiv,
  'vb/no-inline-style': NoInlineStyle,
  'vb/no-class-for-state': NoClassForState,
  'vb/icon-wc-required': IconWcRequired,
  'vb/use-form-field': UseFormField,
  'vb/layout-attribute': LayoutAttribute,
  'vb/known-data-attribute': KnownDataAttribute,
};
