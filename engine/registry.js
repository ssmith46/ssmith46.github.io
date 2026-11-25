/**
 * @file registry.js
 * The plug-in registry: the single place that knows which blocks, collection
 * types and site templates exist. Everything else looks modules up here, so
 * modules never import each other.
 *
 * Add a module by creating it and listing it in the matching index.js:
 *   engine/blocks/index.js        page sections
 *   engine/collections/index.js   collection item types
 *   engine/templates/index.js     "new site" starting points
 */
import blocks from './blocks/index.js';
import collections from './collections/index.js';
import templates from './templates/index.js';

/**
 * @typedef {object} Registry
 * @property {Map<string, any>} blocks       type → block module
 * @property {Map<string, any>} collections  type → collection type module
 * @property {Map<string, any>} templates    id → site template
 */

/** Build a registry from module lists, validating as it goes. */
export function createRegistry({ blocks: b = [], collections: c = [], templates: t = [] } = {}) {
  const toMap = (list, key, kind) => {
    const map = new Map();
    for (const mod of list) {
      if (!mod?.[key]) throw new Error(`A ${kind} module is missing its "${key}"`);
      if (map.has(mod[key])) throw new Error(`Duplicate ${kind} "${mod[key]}"`);
      map.set(mod[key], mod);
    }
    return map;
  };
  return {
    blocks: toMap(b, 'type', 'block'),
    collections: toMap(c, 'type', 'collection'),
    templates: toMap(t, 'id', 'template'),
  };
}

/** The default registry with every built-in module. */
export const registry = createRegistry({ blocks, collections, templates });
