/**
 * Navigation data — reads from the canonical source in site/data/navigation.json
 * so both Astro and 11ty share the same navigation structure.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const navPath = join(__dirname, '..', '..', '..', 'site', 'data', 'navigation.json');

export default JSON.parse(readFileSync(navPath, 'utf-8'));
