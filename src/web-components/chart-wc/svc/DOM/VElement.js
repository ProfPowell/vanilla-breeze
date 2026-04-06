import {escapeHtml} from '../utils/Utils.js';

/**
 * VElement - A Virtual DOM element
 */
class VElement {
  /**
   * Constructor of the Virtual DOM Element
   * @param {string} tagName - the element's tag
   * @param {*} options - key:value pair of attributes and their values.
   */
  constructor(tagName = 'div', options = {}) {
    this.children = [];
    this.tagName = tagName;
    this.options = {};
    Object.assign(this.options, options);
  }

  /**
   * Sets text content, auto-escaping HTML special characters.
   * Use this instead of innerHTML for plain text content.
   * @param {string} text
   */
  set textContent(text) {
    this.innerHTML = escapeHtml(text);
  }

  /**
   * Attach an element as a child to the end of it's list
   * @param {VElement} element - The virtual DOM element to attach.
   */
  appendChild(element) {
    this.children.push(element);
  }
  /**
   * Attach an element as a child to the front of it's list
   * @param {VElement} element - The virtual DOM element to attach.
   */
  prependChild(element) {
    this.children.unshift(element);
  }

  /**
   * Remove a child element from the list
   * @param {VElement} element - The virtual DOM element to remove.
   */
  removeChild(element) {
    const index = this.children.indexOf(element);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  /**
   * Set attributes to the virtual element. Overrides any existing properties.
   * @param {object} options
   */
  setAttrs(options) {
    Object.assign(this.options, options);
  }

  /**
   * Set a specific attribute's value
   * @param {string} key
   * @param {string} value
   */
  setAttribute(key, value) {
    this.options[key] = value;
  }
}
export default VElement;
