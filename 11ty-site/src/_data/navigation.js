/**
 * Navigation data — reads from the local navigation.json file.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const navPath = join(__dirname, 'navigation.json');

export default JSON.parse(readFileSync(navPath, 'utf-8'));
