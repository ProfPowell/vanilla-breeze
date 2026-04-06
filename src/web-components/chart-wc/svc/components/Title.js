import VElement from '../DOM/VElement.js';
import {escapeHtml, miniMarkdown} from '../utils/Utils.js';

/**
 * Title class — supports plain text, markdown subset, and structured title+subtitle.
 *
 * Config formats:
 *   title: { text: 'Sales Report' }
 *   title: { text: 'Sales Report', subtitle: 'Q1 2026' }
 *   title: { text: '**Bold** and *italic*' }          // miniMarkdown
 *   title: { text: 'Sales Report', markdown: true }    // explicit opt-in
 */
class Title {
  /**
   * Constructor for the Title object
   * @param {object} config
   */
  constructor(config) {
    this.config = config;
  }
  /**
   * Returns the default config for the Title
   */
  static get defaults() {
    return {
      l: {
        top: {
          breakpoint: {
            width: 200,
            height: 150,
          },
        },
      },
      title: {
        enabled: true,
        text: 'Title',
        style: {
          'text-align': 'center',
          'width': '100%',
          'font-weight': 400,
          'font-size': 'var(--chart-title-size, 1.4rem)',
          'color': 'var(--chart-title-color, #444)',
          'text-anchor': 'middle',
          'alignment-baseline': 'middle',
        },
        subtitle: {
          style: {
            'font-size': 'var(--chart-subtitle-size, 0.9rem)',
            'color': 'var(--chart-subtitle-color, var(--chart-label-color, #737373))',
            'font-weight': 300,
          },
        },
      },
    };
  }

  /**
   * Render the title object
   * @return {object} a virtual dom object of the title
   */
  render() {
    const titleConfig = this.config.title;
    const title = new VElement('div', {
      class: ['title'],
    });

    // Render main title text with optional markdown
    const useMarkdown = titleConfig.markdown !== false && hasMarkdown(titleConfig.text);
    const titleText = useMarkdown
      ? miniMarkdown(titleConfig.text)
      : escapeHtml(titleConfig.text);

    // Build title HTML — with optional subtitle
    if (titleConfig.subtitle && typeof titleConfig.subtitle === 'string') {
      title.innerHTML = `<span class="svc-title-text">${titleText}</span>` +
        `<div class="svc-subtitle">${escapeSubtitle(titleConfig.subtitle, useMarkdown)}</div>`;
    } else if (titleConfig.subtitle && titleConfig.subtitle.text) {
      title.innerHTML = `<span class="svc-title-text">${titleText}</span>` +
        `<div class="svc-subtitle">${escapeSubtitle(titleConfig.subtitle.text, useMarkdown)}</div>`;
    } else {
      title.innerHTML = titleText;
    }

    return title;
  }
}

/**
 * Detect if a string contains markdown patterns (**bold**, *italic*, `code`, \n).
 * @param {string} str
 * @return {boolean}
 */
function hasMarkdown(str) {
  return /\*\*.+?\*\*|\*.+?\*|`.+?`|\n/.test(String(str));
}

/**
 * Escape subtitle text, using markdown if the title uses it.
 * @param {string} text
 * @param {boolean} useMarkdown
 * @return {string}
 */
function escapeSubtitle(text, useMarkdown) {
  return useMarkdown ? miniMarkdown(text) : escapeHtml(text);
}

export default Title;
