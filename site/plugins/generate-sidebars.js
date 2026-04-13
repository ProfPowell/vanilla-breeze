/**
 * @file generate-sidebars.js
 * @description Build-time plugin that generates sidebar navigation HTML from navigation.json.
 *
 * This replaces the Nunjucks {% for %} loops and conditional {% if %} logic
 * that the 11ty layouts use to render sidebar navigation. Instead of a template
 * language, we generate the HTML with JavaScript and write it to include files.
 *
 * Each sidebar type gets its own include file in src/includes/:
 *   - sidebar-elements.html
 *   - sidebar-attributes.html
 *   - sidebar-guide.html
 *   - sidebar-patterns.html
 *
 * Pages reference the sidebar via data-include, and Cook's replaceInclude
 * plugin injects the HTML at build time.
 *
 * Conditional "open" attributes on <details> depend on per-page front matter
 * (category, nativeGroup, guideGroup, etc.), so the sidebar HTML uses
 * data-open-for="value" attributes that a companion file-loop plugin resolves.
 * UPDATE: Since Cook doesn't have per-file conditionals for includes, we generate
 * the full sidebar once with ALL <details> closed. Cook's setActiveLinks plugin
 * will mark the active link, and a small client-side script opens the parent <details>.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class GenerateSidebars {
  constructor({ data }) {
    this.data = data;
    this.nav = data.navigation;
    this.includesDir = resolve(process.cwd(), 'src/includes');
  }

  async init() {
    // Ensure includes directory exists
    if (!existsSync(this.includesDir)) {
      mkdirSync(this.includesDir, { recursive: true });
    }

    this.generateElementsSidebar();
    this.generateAttributesSidebar();
    this.generateGuideSidebar();
    this.generatePatternsSidebar();
    this.generateHeader();
    this.generateMobileMenu();

    console.log('  ✓ Generated sidebar includes');
  }

  // --- ELEMENT SIDEBAR ---
  generateElementsSidebar() {
    const elements = this.nav.elements;
    let html = '';

    // Native Elements (nested: category > groups > items)
    html += `<details data-sidebar-section="native">\n`;
    html += `  <summary>${elements.native.label}</summary>\n`;
    for (const group of elements.native.groups) {
      html += `  <details data-sidebar-group="${group.label}">\n`;
      html += `    <summary>${group.label}</summary>\n`;
      html += `    <ul>\n`;
      for (const item of group.items) {
        html += `      <li><a href="${item.href}">${item.name}</a></li>\n`;
      }
      html += `    </ul>\n`;
      html += `  </details>\n`;
    }
    html += `</details>\n`;

    // Custom Elements (flat list)
    html += `<details data-sidebar-section="custom">\n`;
    html += `  <summary>${elements.custom.label}</summary>\n`;
    html += `  <ul>\n`;
    for (const item of elements.custom.items) {
      html += `    <li><a href="${item.href}">${item.name}</a></li>\n`;
    }
    html += `  </ul>\n`;
    html += `</details>\n`;

    // Web Components (nested: category > groups > items)
    html += `<details data-sidebar-section="component">\n`;
    html += `  <summary>${elements.component.label}</summary>\n`;
    for (const group of elements.component.groups) {
      html += `  <details data-sidebar-group="${group.label}">\n`;
      html += `    <summary>${group.label}</summary>\n`;
      html += `    <ul>\n`;
      for (const item of group.items) {
        html += `      <li><a href="${item.href}">${item.name}</a></li>\n`;
      }
      html += `    </ul>\n`;
      html += `  </details>\n`;
    }
    html += `</details>\n`;

    writeFileSync(resolve(this.includesDir, 'sidebar-elements.html'), html);
  }

  // --- ATTRIBUTE SIDEBAR ---
  generateAttributesSidebar() {
    const attrs = this.nav.attributes;
    let html = '';

    // Native Attributes (nested: native > groups > items)
    html += `<details data-sidebar-section="native">\n`;
    html += `  <summary>${attrs.native.label}</summary>\n`;
    for (const group of attrs.native.groups) {
      html += `  <details data-sidebar-group="${group.label}">\n`;
      html += `    <summary>${group.label}</summary>\n`;
      html += `    <ul>\n`;
      for (const item of group.items) {
        html += `      <li><a href="${item.href}">${item.name}</a></li>\n`;
      }
      html += `    </ul>\n`;
      html += `  </details>\n`;
    }
    html += `</details>\n`;

    // Data Attributes (nested: data > categories > items)
    html += `<details data-sidebar-section="data">\n`;
    html += `  <summary>${attrs.data.label}</summary>\n`;
    for (const [key, cat] of Object.entries(attrs.data.groups)) {
      html += `  <details data-sidebar-group="${key}">\n`;
      html += `    <summary>${cat.label}</summary>\n`;
      html += `    <ul>\n`;
      for (const item of cat.items) {
        html += `      <li><a href="${item.href}">${item.name}</a></li>\n`;
      }
      html += `    </ul>\n`;
      html += `  </details>\n`;
    }
    html += `</details>\n`;

    writeFileSync(resolve(this.includesDir, 'sidebar-attributes.html'), html);
  }

  // --- GUIDE SIDEBAR ---
  generateGuideSidebar() {
    const sidebar = this.nav.guideSidebar;
    let html = '';

    for (const group of sidebar) {
      html += `<details data-sidebar-group="${group.label}">\n`;
      html += `  <summary>${group.label}</summary>\n`;
      html += `  <ul>\n`;
      for (const item of group.items) {
        html += `    <li><a href="${item.href}">${item.label}</a></li>\n`;
      }
      html += `  </ul>\n`;
      html += `</details>\n`;
    }

    writeFileSync(resolve(this.includesDir, 'sidebar-guide.html'), html);
  }

  // --- PATTERN SIDEBAR ---
  generatePatternsSidebar() {
    const patterns = this.nav.patterns;
    let html = '';

    for (const [key, cat] of Object.entries(patterns)) {
      html += `<details data-sidebar-group="${key}">\n`;
      html += `  <summary>${cat.label}</summary>\n`;
      html += `  <ul>\n`;
      for (const item of cat.items) {
        html += `    <li><a href="${item.href}">${item.name}</a></li>\n`;
      }
      html += `  </ul>\n`;
      html += `</details>\n`;
    }

    writeFileSync(resolve(this.includesDir, 'sidebar-patterns.html'), html);
  }

  // --- HEADER NAV ---
  generateHeader() {
    const header = this.nav.header;
    let html = '';

    html += `<header class="site" data-sticky data-vt="header">\n`;
    html += `  <a href="${header.logo.href}"><brand-mark>${header.logo.text}</brand-mark></a>\n`;
    html += `  <nav class="horizontal pills" aria-label="Main navigation">\n`;
    html += `    <ul>\n`;

    for (const item of header.nav) {
      if (item.children) {
        html += `      <li>\n`;
        html += `        <drop-down position="bottom-start" hover>\n`;
        html += `          <a href="${item.href}" data-trigger data-nav-section="${item.section}">${item.label}</a>\n`;
        html += `          <menu>\n`;
        for (const child of item.children) {
          html += `            <li><a href="${child.href}">${child.label}</a></li>\n`;
        }
        html += `          </menu>\n`;
        html += `        </drop-down>\n`;
        html += `      </li>\n`;
      } else {
        html += `      <li><a href="${item.href}" data-nav-section="${item.section}">${item.label}</a></li>\n`;
      }
    }

    html += `    </ul>\n`;
    html += `  </nav>\n`;
    html += `  <site-tools>\n`;
    html += `    <site-search>\n`;
    html += `      <button type="button" data-trigger class="ghost">\n`;
    html += `        <icon-wc name="search" size="sm"></icon-wc>\n`;
    html += `        Search\n`;
    html += `      </button>\n`;
    html += `    </site-search>\n`;
    html += `    <theme-picker compact>\n`;
    html += `      <button type="button" data-trigger class="ghost">\n`;
    html += `        <icon-wc name="palette" size="sm"></icon-wc>\n`;
    html += `        Theme\n`;
    html += `      </button>\n`;
    html += `    </theme-picker>\n`;
    html += `  </site-tools>\n`;
    html += `  <button type="button" class="mobile-menu-toggle" popovertarget="mobile-menu" aria-label="Menu">\n`;
    html += `    <icon-wc name="menu"></icon-wc>\n`;
    html += `  </button>\n`;
    html += `</header>\n`;

    writeFileSync(resolve(this.includesDir, 'header.html'), html);
  }

  // --- MOBILE MENU ---
  generateMobileMenu() {
    const header = this.nav.header;
    let html = '';

    html += `<nav popover id="mobile-menu" class="mobile-menu">\n`;
    html += `  <button type="button" class="mobile-menu-close" popovertarget="mobile-menu" popovertargetaction="hide" aria-label="Close menu">\n`;
    html += `    <icon-wc name="x"></icon-wc>\n`;
    html += `  </button>\n`;
    html += `  <div class="mobile-menu-search">\n`;
    html += `    <site-search>\n`;
    html += `      <button type="button" data-trigger class="ghost" style="inline-size: 100%">\n`;
    html += `        <icon-wc name="search" size="sm"></icon-wc>\n`;
    html += `        Search\n`;
    html += `      </button>\n`;
    html += `    </site-search>\n`;
    html += `  </div>\n`;
    html += `  <ul>\n`;

    for (const item of header.nav) {
      if (item.children) {
        html += `    <li class="mobile-section">\n`;
        html += `      <strong class="mobile-section-title">${item.label}</strong>\n`;
        html += `      <ul>\n`;
        for (const child of item.children) {
          html += `        <li><a href="${child.href}">${child.label}</a></li>\n`;
        }
        html += `      </ul>\n`;
        html += `    </li>\n`;
      } else {
        html += `    <li><a href="${item.href}">${item.label}</a></li>\n`;
      }
    }

    html += `  </ul>\n`;
    html += `  <div class="mobile-menu-theme">\n`;
    html += `    <strong class="mobile-section-title">Theme</strong>\n`;
    html += `    <theme-picker variant="inline" compact></theme-picker>\n`;
    html += `  </div>\n`;
    html += `</nav>\n`;

    writeFileSync(resolve(this.includesDir, 'mobile-menu.html'), html);
  }
}
