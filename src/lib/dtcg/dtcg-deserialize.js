/**
 * DTCG (Design Tokens Community Group) deserializer for VB.
 *
 * Pure function: takes a parsed DTCG object → returns
 *   { tokens: Array<[name, value]>, ignored: string[], stats: {...} }
 *
 * Inverse of dtcg-serialize.js. Handles:
 * - reverse prefix mapping (color/* → --color-*, etc.)
 * - color rebuild from structured components (oklch / srgb)
 * - dimension/duration/cubicBezier/shadow rebuild as CSS strings
 * - light-dark variant folding back to light-dark()
 * - $extensions["com.vanilla-breeze"] preference for round-trip-lossless
 *   reconstruction (expression, lightDark literal, em/% units)
 * - composite typography unpacking into VB scalars
 * - {curly.brace} alias resolution (intra-document) → var(--…) output
 * - group-level $type inheritance per spec
 *
 * Spec: https://www.designtokens.org/ (stable v1, 2025-10-28)
 */

const VB_NS = 'com.vanilla-breeze';

/**
 * @param {any} doc
 * @returns {{ tokens: Array<[string, string]>, ignored: string[], stats: { applied: number, ignored: number } }}
 */
export function deserializeDTCG(doc) {
  const tokens = [];
  const ignored = [];
  const tree = doc && typeof doc === 'object' ? doc : {};

  // Walk the tree depth-first, propagating $type inheritance from groups.
  walk(tree, [], undefined, tree, tokens, ignored);

  return {
    tokens,
    ignored,
    stats: { applied: tokens.length, ignored: ignored.length },
  };
}

/* ---------- tree walk ---------- */

function walk(node, path, inheritedType, root, tokens, ignored) {
  if (!node || typeof node !== 'object') return;

  // A token is an object that has $value OR is a variant container ($root/light/dark).
  if ('$value' in node) {
    handleToken(node, path, inheritedType ?? node.$type, root, tokens, ignored);
    return;
  }

  // Variant container: presence of $root or both light+dark children that have $value.
  if (isVariantContainer(node)) {
    handleVariantToken(node, path, inheritedType ?? node.$type ?? 'color', root, tokens, ignored);
    return;
  }

  // Otherwise it's a group — descend, inheriting $type if the group declares one.
  const groupType = node.$type ?? inheritedType;
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    walk(child, [...path, key], groupType, root, tokens, ignored);
  }
}

function isVariantContainer(node) {
  // Variants are children with $value; the container itself has no $value.
  const variants = ['$root', 'light', 'dark'];
  return variants.some(k => node[k] && typeof node[k] === 'object' && '$value' in node[k]);
}

/* ---------- prefix reversal ---------- */

/**
 * Map a DTCG path back to the VB CSS custom-property name.
 * Returns null if the path doesn't map to a known VB prefix.
 *
 * @param {string[]} path
 * @returns {string | null}
 */
function pathToVar(path) {
  const [head, second, ...rest] = path;
  switch (head) {
    case 'color': {
      if (second === 'seeds') {
        // color/seeds/{name} where name is the full token (hue-primary, lightness-primary, …)
        return rest.length ? `--${rest.join('-')}` : null;
      }
      const tail = [second, ...rest].filter(Boolean).join('-');
      return tail ? `--color-${tail}` : null;
    }
    case 'typography': {
      const leaf = rest.join('-') || second;
      const child = rest.length ? rest.join('-') : '';
      switch (second) {
        case 'family':        return child ? `--font-${child}` : null;
        case 'size':          return child ? `--font-size-${child}` : null;
        case 'weight':        return child ? `--font-weight-${child}` : null;
        case 'lineHeight':    return child ? `--line-height-${child}` : null;
        case 'letterSpacing': return child ? `--letter-spacing-${child}` : null;
        default:              return null;
      }
      // (unreachable)
      const _ = leaf;
    }
    case 'spacing':
      return [second, ...rest].filter(Boolean).length ? `--size-${[second, ...rest].filter(Boolean).join('-')}` : null;
    case 'border': {
      const child = rest.join('-') || '';
      if (second === 'radius') return child ? `--radius-${child}` : null;
      if (second === 'width')  return child ? `--border-width-${child}` : null;
      return null;
    }
    case 'motion': {
      const child = rest.join('-') || '';
      if (second === 'duration') return child ? `--duration-${child}` : null;
      if (second === 'easing')   return child ? `--ease-${child}` : null;
      return null;
    }
    case 'effect': {
      const child = rest.join('-') || '';
      if (second === 'shadow') return child ? `--shadow-${child}` : null;
      return null;
    }
    default:
      return null;
  }
}

/* ---------- token handling ---------- */

function handleToken(token, path, type, root, tokens, ignored) {
  // Composite typography spans multiple VB scalars; check before pathToVar
  // because the leaf name (e.g. "heading") doesn't have a single VB token.
  if ((type === 'typography' || token.$type === 'typography')
      && token.$value && typeof token.$value === 'object' && !Array.isArray(token.$value)
      && path[0] === 'typography') {
    unpackTypography(token, path, tokens);
    return;
  }

  const cssVar = pathToVar(path);
  if (!cssVar) {
    ignored.push(path.join('.'));
    return;
  }

  // Type inference from path when neither token nor group declared one.
  // The DTCG spec forbids inferring from $value contents; path-based hints
  // are part of group hierarchy and fine.
  const effectiveType = type ?? inferTypeFromPath(path);

  const ext = (token.$extensions && token.$extensions[VB_NS]) || {};

  // Round-trip-lossless: prefer preserved CSS expression / literal.
  if (ext.expression) { tokens.push([cssVar, ext.expression]); return; }
  if (ext.lightDark)  { tokens.push([cssVar, ext.lightDark]);  return; }

  const value = renderValue(token.$value, effectiveType, ext, root);
  if (value == null) {
    ignored.push(path.join('.'));
    return;
  }
  tokens.push([cssVar, value]);
}

/**
 * Infer a token type from its path (group-based, NOT $value-content-based).
 * Mirrors the prefix table in pathToVar().
 */
function inferTypeFromPath(path) {
  const [head, second] = path;
  if (head === 'color')   return 'color';
  if (head === 'spacing') return 'dimension';
  if (head === 'border' && (second === 'radius' || second === 'width')) return 'dimension';
  if (head === 'motion'   && second === 'duration') return 'duration';
  if (head === 'motion'   && second === 'easing')   return 'cubicBezier';
  if (head === 'effect'   && second === 'shadow')   return 'shadow';
  if (head === 'typography') {
    if (second === 'family')        return 'fontFamily';
    if (second === 'size')          return 'dimension';
    if (second === 'weight')        return 'fontWeight';
    if (second === 'lineHeight')    return 'number';
    if (second === 'letterSpacing') return 'dimension';
  }
  return undefined;
}

function handleVariantToken(node, path, type, root, tokens, ignored) {
  const cssVar = pathToVar(path);
  if (!cssVar) { ignored.push(path.join('.')); return; }
  const ext = (node.$extensions && node.$extensions[VB_NS]) || {};
  if (ext.lightDark) { tokens.push([cssVar, ext.lightDark]); return; }

  const light = node.light?.$value ? renderValue(node.light.$value, type, {}, root) : null;
  const dark  = node.dark?.$value  ? renderValue(node.dark.$value,  type, {}, root) : null;
  const root_ = node.$root?.$value ? renderValue(node.$root.$value, type, {}, root) : null;

  if (light && dark) {
    tokens.push([cssVar, `light-dark(${light}, ${dark})`]);
    return;
  }
  if (root_) { tokens.push([cssVar, root_]); return; }
  if (light) { tokens.push([cssVar, light]); return; }
  if (dark)  { tokens.push([cssVar, dark]);  return; }
  ignored.push(path.join('.'));
}

/* ---------- value rendering ---------- */

function renderValue(value, type, ext, root) {
  // Alias: {group.token} → resolve and rebuild as var(--…) for cross-tool clarity.
  if (typeof value === 'string' && /^\{[^}]+\}$/.test(value)) {
    const targetPath = value.slice(1, -1).split('.');
    const targetVar = pathToVar(targetPath);
    if (targetVar) return `var(${targetVar})`;
    // If unmappable target, fall back to literal.
    return value;
  }
  switch (type) {
    case 'color':       return renderColor(value, ext);
    case 'fontFamily':  return renderFontFamily(value);
    case 'fontWeight':  return String(value);
    case 'number':      return renderNumber(value, ext);
    case 'dimension':   return renderDimension(value, ext);
    case 'duration':    return renderDuration(value);
    case 'cubicBezier': return Array.isArray(value) ? `cubic-bezier(${value.join(', ')})` : null;
    case 'shadow':      return renderShadow(value);
    default:
      // Best effort: stringify primitives.
      if (typeof value === 'string' || typeof value === 'number') return String(value);
      return null;
  }
}

function renderColor(value, ext) {
  if (!value || typeof value !== 'object') return null;
  if (value.hex) return value.hex;
  if (value.colorSpace === 'oklch') {
    const [L, C, H] = value.components || [0, 0, 0];
    const alpha = value.alpha != null ? ` / ${value.alpha}` : '';
    return `oklch(${L} ${C} ${H}${alpha})`;
  }
  if (value.colorSpace === 'srgb') {
    const [r, g, b] = value.components || [0, 0, 0];
    const a = value.alpha;
    if (a != null) {
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
    return rgbToHex(r, g, b);
  }
  return null;
}

function rgbToHex(r, g, b) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// CSS generic + system font keywords that should NOT be quoted.
const BARE_FONT_KEYWORDS = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  'math', 'emoji', 'fangsong',
  '-apple-system', 'BlinkMacSystemFont',
]);

function renderFontFamily(value) {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return null;
  return value.map((f) => {
    if (BARE_FONT_KEYWORDS.has(f)) return f;
    if (f.startsWith('"') || f.startsWith("'")) return f;
    return `"${f}"`;
  }).join(', ');
}

function renderNumber(value, ext) {
  if (ext.unit === '%') return `${value}%`;
  return String(value);
}

function renderDimension(value, ext) {
  if (!value || typeof value !== 'object') return null;
  // Honor VB extension unit hint (em, %) over the DTCG-stated unit.
  const unit = ext.unit || value.unit || 'px';
  return `${value.value}${unit}`;
}

function renderDuration(value) {
  if (!value || typeof value !== 'object') return null;
  return `${value.value}${value.unit || 'ms'}`;
}

function renderShadow(value) {
  if (Array.isArray(value)) return value.map(renderShadowStop).filter(Boolean).join(', ');
  return renderShadowStop(value);
}

function renderShadowStop(stop) {
  if (!stop) return null;
  const ox = renderDimension(stop.offsetX, {}) ?? '0px';
  const oy = renderDimension(stop.offsetY, {}) ?? '0px';
  const blur = renderDimension(stop.blur, {}) ?? '0px';
  const spread = stop.spread ? ' ' + renderDimension(stop.spread, {}) : '';
  const color = renderColor(stop.color, {}) ?? '#000';
  return `${ox} ${oy} ${blur}${spread} ${color}`;
}

/* ---------- composite typography ---------- */

function unpackTypography(token, path, tokens) {
  const v = token.$value;
  // Take the leaf segment as the token name (typography/heading → 'heading').
  const leaf = path[path.length - 1];
  if (v.fontFamily != null) tokens.push([`--font-${leaf}`,        renderFontFamily(v.fontFamily)]);
  if (v.fontSize   != null) tokens.push([`--font-size-${leaf}`,   renderDimension(v.fontSize, {})]);
  if (v.fontWeight != null) tokens.push([`--font-weight-${leaf}`, String(v.fontWeight)]);
  if (v.lineHeight != null) tokens.push([`--line-height-${leaf}`, String(v.lineHeight)]);
  if (v.letterSpacing != null) tokens.push([`--letter-spacing-${leaf}`, renderDimension(v.letterSpacing, {})]);
}
