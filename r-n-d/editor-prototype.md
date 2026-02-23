# Editor Prototype: Vanilla Breeze Block Editor

A standalone editor prototype for exploring the authoring experience with Vanilla Breeze custom elements. Runs independently from the CMS pipeline — no database, no build system, no deployment. Just a browser, ProseMirror, and your components.

## Goal

Answer these questions through hands-on experimentation:

- What does it feel like to author content where the editing surface IS the published output?
- How well do Vanilla Breeze custom elements work as editable blocks?
- Where does ProseMirror's model help and where does it fight the component model?
- What's the right balance between structured blocks and freeform prose?
- How should the block palette work — slash commands, toolbar, drag?
- What does the collapsible/tabs/steps editing UX actually look like?

## Architecture

The prototype is a single-page web app. No bundler. ES module imports from CDN. The only dependency is ProseMirror (loaded as ES modules). Everything else is vanilla JS, Vanilla Breeze CSS, and custom elements.

```
editor-prototype/
├── index.html                        # Editor shell
├── assets/
│   ├── css/
│   │   ├── main.css                  # Vanilla Breeze @layer hub
│   │   ├── _reset.css
│   │   ├── _tokens.css
│   │   ├── _base.css
│   │   ├── components/
│   │   │   ├── _callout.css          # <ui-callout> styles
│   │   │   ├── _card.css             # <content-card> styles
│   │   │   └── _code-block.css       # <code-block> styles
│   │   └── editor/
│   │       ├── _prosemirror.css      # ProseMirror base overrides
│   │       ├── _toolbar.css          # Block palette, formatting bar
│   │       ├── _sidebar.css          # Document meta panel
│   │       └── _shell.css            # Editor layout grid
│   └── js/
│       ├── editor.js                 # Editor initialization
│       ├── schema.js                 # ProseMirror schema from content-schema
│       ├── keymap.js                 # Key bindings
│       ├── input-rules.js            # Markdown-style input rules
│       ├── menu.js                   # Formatting toolbar
│       ├── ast.js                    # AST ↔ ProseMirror serialization
│       ├── blocks/                   # Custom NodeViews
│       │   ├── callout-view.js
│       │   ├── code-block-view.js
│       │   ├── collapsible-view.js
│       │   ├── figure-view.js
│       │   ├── tabs-view.js
│       │   ├── steps-view.js
│       │   └── card-view.js
│       └── components/               # Editor UI web components
│           ├── block-palette.js      # Slash command menu
│           ├── editor-shell.js       # Layout container
│           ├── meta-panel.js         # Document metadata sidebar
│           └── ast-inspector.js      # Debug: live AST view
├── content-schema.js                 # Symlink or copy from src/schema/
└── fixtures/                         # Symlink or copy from test/fixtures/
    ├── simple-post.json
    ├── component-rich.json
    └── minimal.json
```

## Dependency Strategy

ProseMirror is distributed as many small packages. For the prototype, load from CDN (esm.sh or jspm) to avoid any build step:

```js
// editor.js
import { EditorState } from 'https://esm.sh/prosemirror-state@1';
import { EditorView } from 'https://esm.sh/prosemirror-view@1';
import { Schema } from 'https://esm.sh/prosemirror-model@1';
import { keymap } from 'https://esm.sh/prosemirror-keymap@1';
import { baseKeymap } from 'https://esm.sh/prosemirror-commands@1';
import { history, undo, redo } from 'https://esm.sh/prosemirror-history@1';
import { inputRules } from 'https://esm.sh/prosemirror-inputrules@1';
```

If CDN imports cause issues (version conflicts between packages), fall back to a single `npm install` and an import map:

```html
<script type="importmap">
{
  "imports": {
    "prosemirror-state": "./node_modules/prosemirror-state/dist/index.js",
    "prosemirror-view": "./node_modules/prosemirror-view/dist/index.js",
    "prosemirror-model": "./node_modules/prosemirror-model/dist/index.js"
  }
}
</script>
```

No bundler either way. Import maps are the platform-first solution.


---

## Implementation Steps

### Step 1: Editor Shell and Prose Editing

Get a basic ProseMirror editor running with paragraph and heading support inside a Vanilla Breeze styled shell.

**1.1 HTML shell**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Vanilla Press Editor Prototype</title>
  <link rel="stylesheet" href="assets/css/main.css"/>
</head>
<body>
  <editor-shell>
    <div slot="toolbar" id="toolbar"></div>
    <div slot="editor" id="editor"></div>
    <div slot="sidebar" id="sidebar"></div>
    <div slot="inspector" id="inspector"></div>
  </editor-shell>
  <script type="module" src="assets/js/editor.js"></script>
</body>
</html>
```

**1.2 Editor shell component**

```js
// components/editor-shell.js
class EditorShell extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div data-editor-layout>
        <header data-editor-toolbar><slot name="toolbar"></slot></header>
        <div data-editor-main>
          <div data-editor-content><slot name="editor"></slot></div>
          <aside data-editor-sidebar><slot name="sidebar"></slot></aside>
        </div>
        <footer data-editor-inspector><slot name="inspector"></slot></footer>
      </div>
    `;
  }
}
customElements.define('editor-shell', EditorShell);
```

**1.3 Minimal ProseMirror schema**

Start with just prose blocks. Derive from content-schema.js but only enable paragraph, heading, blockquote, list, hr, and inline marks.

**1.4 Basic editor initialization**

Create an EditorState and EditorView. Load a fixture document. Verify typing, selection, undo/redo work.

**1.5 Formatting toolbar**

Buttons for bold, italic, code, link. Heading level selector. Built as a web component that dispatches ProseMirror commands.

**Milestone:** You can type prose, format text, create headings and lists. The editor renders using Vanilla Breeze base styles. The experience should feel like writing in a well-styled text area.


### Step 2: AST Inspector

A debug panel that shows the live block AST as you edit. This is essential for understanding how ProseMirror's document model maps to your content model.

**2.1 AST serializer**

```js
// ast.js

// ProseMirror document → block AST
export function toBlockAst(pmDoc) { ... }

// Block AST → ProseMirror document
export function fromBlockAst(ast, schema) { ... }
```

**2.2 Inspector component**

```js
// components/ast-inspector.js
class AstInspector extends HTMLElement {
  update(pmDoc) {
    const ast = toBlockAst(pmDoc);
    this.querySelector('pre').textContent = JSON.stringify(ast, null, 2);
  }
}
customElements.define('ast-inspector', AstInspector);
```

Wire this to ProseMirror's `dispatchTransaction` so it updates on every edit.

**Milestone:** Every keystroke shows the live AST. You can verify the round-trip: load a fixture, edit, serialize back, compare. This is how you catch model mismatches early.


### Step 3: Code Block

The first non-prose block. Tests the NodeView pattern you'll use for all component blocks.

**3.1 ProseMirror node spec for code_block**

Leaf node with `language` and `filename` attrs. Content is raw text (not inline marks).

**3.2 NodeView**

```js
// blocks/code-block-view.js
export class CodeBlockView {
  constructor(node, view, getPos) {
    // Create <code-block> custom element
    this.dom = document.createElement('code-block');
    this.dom.setAttribute('data-language', node.attrs.language);

    // Filename display
    if (node.attrs.filename) {
      const label = document.createElement('span');
      label.className = 'code-filename';
      label.textContent = node.attrs.filename;
      this.dom.appendChild(label);
    }

    // Editable content area
    this.contentDOM = document.createElement('pre');
    const code = document.createElement('code');
    this.contentDOM = code;
    this.dom.appendChild(this.contentDOM);
  }

  // Attr editing: language selector dropdown on focus
  // Filename: editable inline on click
}
```

**3.3 Input rule**

Typing ` ``` ` followed by a language name at the start of a line creates a code block. Standard markdown convention.

**3.4 CSS**

The `<code-block>` element gets the same Vanilla Breeze styles it would have on the published site. What you see is what publishes.

**Milestone:** You can insert code blocks, type code, change the language, see it styled as the real component. The AST inspector shows the correct `code_block` node.


### Step 4: Callout

The first Vanilla Breeze component block. This is the critical test — does editing inside a styled custom element feel right?

**4.1 NodeView**

```js
// blocks/callout-view.js
export class CalloutView {
  constructor(node, view, getPos) {
    this.dom = document.createElement('ui-callout');
    this.dom.setAttribute('data-variant', node.attrs.variant);
    this.dom.setAttribute('data-editable', '');

    // Variant selector (appears on hover/focus)
    this.controls = document.createElement('div');
    this.controls.setAttribute('data-block-controls', '');
    this.controls.innerHTML = `
      <select data-variant-select>
        <option value="note">Note</option>
        <option value="tip">Tip</option>
        <option value="warning">Warning</option>
        <option value="danger">Danger</option>
      </select>
    `;
    this.dom.appendChild(this.controls);

    // Editable content area — ProseMirror manages this
    this.contentDOM = document.createElement('div');
    this.contentDOM.setAttribute('data-block-content', '');
    this.dom.appendChild(this.contentDOM);

    // Variant change handler
    this.controls.querySelector('select').value = node.attrs.variant;
    this.controls.querySelector('select').addEventListener('change', (e) => {
      const tr = view.state.tr.setNodeMarkup(getPos(), null, {
        ...node.attrs,
        variant: e.target.value,
      });
      view.dispatch(tr);
    });
  }

  update(node) {
    if (node.type.name !== 'callout') return false;
    this.dom.setAttribute('data-variant', node.attrs.variant);
    this.controls.querySelector('select').value = node.attrs.variant;
    return true;
  }

  // Don't let ProseMirror serialize the controls
  ignoreMutation(mutation) {
    return !this.contentDOM.contains(mutation.target);
  }
}
```

**Key UX questions to explore:**
- Does the variant selector feel natural? Should it be a dropdown, toggle buttons, or a popover?
- How should the callout border/background interact with the cursor? Does it feel like you're "inside" the callout?
- When you press Enter at the end of a callout, should it create a new paragraph inside or outside the callout?
- How do you exit a callout? Arrow down from the last line? A dedicated key binding?

**Milestone:** You can insert callouts, change variants, type rich content inside them. The callout looks identical to the published version. You have answers to the UX questions above.


### Step 5: Collapsible (Details/Summary)

Tests editing inside a native HTML interactive element.

**5.1 NodeView**

Render as `<details>` with editable `<summary>`. The content inside is a ProseMirror editable region.

**UX questions:**
- Should the collapsible be open or closed while editing? (Probably always open in the editor.)
- How do you edit the summary text? Inline? A separate field?
- Does clicking the summary toggle in the editor, or only on the published site?


### Step 6: Tabs

The most complex component block. Tests nested editing regions.

**6.1 NodeView**

Render as a tab bar + content panels. Each tab is a separate ProseMirror editable region.

**UX questions:**
- How do you add/remove tabs?
- How do you reorder tabs — drag the tab labels?
- When editing tab content, do you see all tabs or just the active one?
- How does the AST stay in sync when tabs are reordered?


### Step 7: Steps

Similar to tabs but simpler — ordered list with titled items.

**6.1 NodeView**

Render as `<ol data-steps>`. Each step has an editable title and editable content body.

**UX questions:**
- How do you add a new step? Enter at the end of the last step?
- Can you drag to reorder?
- Does the step number auto-update on reorder?


### Step 8: Figure

Tests media insertion and caption editing.

**8.1 NodeView**

Render as `<figure>` with `<img>` and editable `<figcaption>`. For the prototype, use placeholder images (no upload flow yet).

**UX questions:**
- How do you set the alt text? An inline field? A sidebar panel?
- How does caption editing feel? Is it natural to click below the image and type?
- Should figures be resizable in the editor?


### Step 9: Card

A linked content card. Tests blocks that are both containers and have link behavior.

**9.1 NodeView**

Render as `<content-card>` with editable children and an href attr editor.


### Step 10: Block Palette

The slash command menu for inserting any block type.

**10.1 Implementation**

Type `/` at the start of an empty paragraph. A popover appears with block types grouped by category (from `categorizedBlocks()` in content-schema.js). Filter by typing. Select with keyboard or click. The selected block type replaces the empty paragraph.

```js
// components/block-palette.js
class BlockPalette extends HTMLElement {
  // Popover positioned at cursor
  // Groups: Prose, Media, Code, Components
  // Keyboard: arrow keys to navigate, enter to select, escape to dismiss
  // Filter: typing narrows the list
}
customElements.define('block-palette', BlockPalette);
```

**UX questions:**
- Is slash-command the right trigger? Should there also be a `+` button between blocks?
- How much description should each block type show? Name only? Name + one-line description?
- Should recently used blocks appear first?


### Step 11: Meta Panel

Document metadata editing in a sidebar.

**11.1 Implementation**

Web component that shows title, slug, description, tags, status. Edits here update the document metadata (separate from the block content).

Slug auto-generates from title but is editable. Tags use a simple comma-separated input or a token field.


### Step 12: Load/Save with Fixtures

Wire up fixture loading and JSON export so you can test the full round-trip.

**12.1 Fixture loader**

Dropdown to select a fixture file. Loads the JSON, converts block AST to ProseMirror document, populates the editor.

**12.2 Export**

Button that serializes the current ProseMirror document to block AST JSON and downloads it. Compare with the original fixture to verify fidelity.

**12.3 localStorage persistence**

Auto-save the current document to localStorage so you don't lose work on refresh. Not for production — just for prototype convenience.

---

## What This Prototype Does NOT Include

- No database or content store — documents are fixtures loaded from JSON files
- No server — everything runs from a local file server (`npx serve .`)
- No publishing or rendering pipeline — the editor IS the interface
- No authentication or multi-user support
- No media upload — use placeholder images
- No deploy configuration

The prototype produces one artifact: a block AST JSON document. That's the contract with the rest of the system. If the editor outputs correct ASTs, it plugs into the CMS pipeline from the main plan.

---

## Running the Prototype

```bash
cd editor-prototype

# If using import maps with local node_modules:
npm install prosemirror-state prosemirror-view prosemirror-model \
  prosemirror-keymap prosemirror-commands prosemirror-history \
  prosemirror-inputrules prosemirror-schema-list \
  prosemirror-dropcursor prosemirror-gapcursor

# Serve locally
npx serve .

# Open http://localhost:3000
```

## Integration Path

Once the prototype answers the UX questions, the editor code moves into the main Vanilla Press project:

1. Copy `assets/js/blocks/` → `vanilla-press/src/editor/blocks/`
2. Copy `assets/js/components/` → `vanilla-press/src/editor/components/`
3. Copy `assets/js/schema.js` → `vanilla-press/src/editor/schema.js`
4. Wire up the content store API in place of fixture loading
5. Add the meta panel's save action to POST to the store

The CSS doesn't move — it's already Vanilla Breeze. The published site and the editor share the same stylesheet.