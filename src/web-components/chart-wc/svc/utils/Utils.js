// CSS Class CLASS_PREFIX
const CLASS_PREFIX = 'svc';

/**
 * Escapes HTML special characters to prevent XSS
 * @param {*} str - value to escape
 * @return {string} escaped string
 */
function escapeHtml(str) {
  const s = String(str);
  return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

/**
 * Converts a minimal markdown subset to safe HTML.
 * Supports: **bold**, *italic*, `code`, \n (line break).
 * All text is HTML-escaped first, then markdown patterns are applied.
 * @param {string} str - markdown-flavored text
 * @return {string} safe HTML string
 */
function miniMarkdown(str) {
  let s = escapeHtml(String(str));
  // **bold** (must come before *italic*)
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // *italic*
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // `code`
  s = s.replace(/`(.+?)`/g, '<code>$1</code>');
  // \n → <br>
  s = s.replace(/\n/g, '<br>');
  return s;
}

/**
 * Checks if a value is a plain object (not an array, class instance, or null)
 * @param {*} value
 * @return {boolean}
 */
function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Formats to 2 decimal places, and drops trailing 0
 * @param {*} value
 * @return {number} the floating point value
 */
function formatNumber(value) {
  const val = value.toFixed(2);
  return parseFloat((val[val.length-1] === '0') ? value.toFixed(1) : val);
}

/**
 * Takes a Virtual DOM root and compiles it to a string
 * @param {*} svg - the virtual dom root
 * @return {string} The SVG output
 */
function compileDOM(svg) {
  return (compile(svg));
  /**
   * The helper function for recursive actions
   * @param {*} element - a parent node
   * @return {string}
   */
  function compile(element) {
    let attrs = '';
    for (const prop in element.options) {
      if (Object.hasOwn(element.options, prop)) {
        const key = prop;
        let value = element.options[prop];

        if (prop === 'class') {
          if (!Array.isArray(value)) {
            throw new Error('Wrong argument to class');
          }
          value = '';
          element.options[prop].forEach((classname) => {
            value += ((value === '') ? '': ' ') + `${CLASS_PREFIX}-${classname}`;
          });
        }
        attrs += ((attrs === '') ? '': ' ') + `${key}="${escapeHtml(String(value))}"`;
      }
    }
    if (element.children.length > 0) {
      let children = '';
      element.children.forEach(function(child) {
        children += ((attrs === '') ? '': ' ') + compile(child);
      });
      return `<${element.tagName}${fmtAttrs(attrs)}>${children}</${element.tagName}>`;
    } else if (typeof element.innerHTML !== 'undefined') {
      return `<${element.tagName}${fmtAttrs(attrs)}>${element.innerHTML}</${element.tagName}>`;
    } else {
      return `<${element.tagName}${fmtAttrs(attrs)}></${element.tagName}>`;
    }
  }
  /**
   * Adds a space padding if attrs exists
   * @param {*} attrs
   * @return {string}
   */
  function fmtAttrs(attrs) {
    return (attrs === '') ? attrs : ' ' + attrs;
  }
}

/**
 * Deep assign an object
 * @param {object} dest
 * @param {object} source
 * @return {object}
 */
function deepAssign(dest, source) {
  return mergeDeep(dest, source);
  /**
   * Simple object check and ensures the object is not a Class
   * @param {*} item
   * @return {boolean}
   */
  function isObject(item) {
    return isPlainObject(item);
  }

  /**
   * Deep merge two objects.
   * @param {*} target
   * @param  {...any} sources
   * @return {object}
   */
  function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, {[key]: {}});
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, {[key]: source[key]});
        }
      }
    }
    return mergeDeep(target, ...sources);
  }
}

/**
 * Escapes less than and greater than brackets for script tags.
 * @param {*} str
 * @return {string}
 */
function escapeCarets(str) {
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  return str;
}

/**
 * Converts a semi-colon delimited list into an object (inline-styles)
 * @param {*} str
 * @return {object}
 */
function stringToObject(str) {
  const attrs = str.split(';');
  return attrs.reduce((acc, val) => {
    if (val !== '') {
      const parts = val.split(':');
      acc[parts[0]] = parts[1];
    }
    return acc;
  }, {});
}

/**
 * Determines if the object has an embedded object path.
 * @param {object} obj - The object to detect a path
 * @param {*} path - a '.' delimited object path
 * @return {boolean} if the object has a value in the object path given.
 */
function propertyExists(obj, path) {
  let currentObj = obj;
  const parts = path.split('.');

  for (let i = 0; i < parts.length; i++) {
    currentObj = currentObj[parts[i]];
    if (!currentObj) {
      return false;
    }
  }
  return true;
}


/**
 * Safely call a user-provided tooltip format function.
 * Returns escaped formatted string, or the fallback on error.
 * @param {Function|null} formatter
 * @param {*} label
 * @param {*} value
 * @param {string} fallback
 * @return {string}
 */
function safeFormatTooltip(formatter, label, value, fallback) {
  if (!formatter) return fallback;
  try {
    return escapeHtml(String(formatter(label, value)));
  } catch (e) {
    console.warn('SVC: tooltip.format threw an error:', e);
    return fallback;
  }
}

export {
  formatNumber, compileDOM, deepAssign, escapeCarets,
  stringToObject, propertyExists, escapeHtml, miniMarkdown,
  isPlainObject, safeFormatTooltip,
};
