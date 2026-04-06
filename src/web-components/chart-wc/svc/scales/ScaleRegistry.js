/**
 * Scale type registry. Built-in types (linear, category) are registered
 * automatically. Custom scale types can be added via registerScale().
 */
const registry = new Map();

/**
 * Register a scale class under a name.
 * @param {string} name - scale type name (e.g. 'linear', 'category', 'time')
 * @param {Function} ScaleClass - class with a render() method
 */
export function registerScale(name, ScaleClass) {
  registry.set(name, ScaleClass);
}

/**
 * Create a scale instance by type name.
 * @param {string} type - registered scale type name
 * @param {Object} options - constructor options (type, config, stats, data, chartType)
 * @return {Object} scale instance with a render() method
 */
export function createScale(type, options) {
  const ScaleClass = registry.get(type);
  if (!ScaleClass) {
    throw new Error(`SVC: Unknown scale type "${type}". Registered types: ${[...registry.keys()].join(', ')}`);
  }
  return new ScaleClass(options);
}
