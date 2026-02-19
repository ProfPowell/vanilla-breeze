#!/usr/bin/env node

/**
 * Sync Icon Sets
 *
 * Downloads 15 SVGs each from Phosphor, Tabler, and Mage GitHub repos
 * (MIT / Apache 2.0 licensed) and writes them to src/icons/{set}/ with
 * normalized names. Also generates index.json manifests matching the lucide format.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'src', 'icons');

const SHARED_NAMES = [
  'home', 'search', 'settings', 'user', 'heart',
  'star', 'bell', 'mail', 'calendar', 'camera',
  'bookmark', 'globe', 'lock', 'music', 'zap'
];

const PHOSPHOR_MAP = {
  home: 'house',
  search: 'magnifying-glass',
  settings: 'gear',
  user: 'user',
  heart: 'heart',
  star: 'star',
  bell: 'bell',
  mail: 'envelope',
  calendar: 'calendar',
  camera: 'camera',
  bookmark: 'bookmark-simple',
  globe: 'globe',
  lock: 'lock-simple',
  music: 'music-note',
  zap: 'lightning',
};

const TABLER_MAP = {
  home: 'home',
  search: 'search',
  settings: 'settings',
  user: 'user',
  heart: 'heart',
  star: 'star',
  bell: 'bell',
  mail: 'mail',
  calendar: 'calendar',
  camera: 'camera',
  bookmark: 'bookmark',
  globe: 'world',
  lock: 'lock',
  music: 'music',
  zap: 'bolt',
};

const MAGE_MAP = {
  home: 'Home',
  search: 'Search',
  settings: 'Settings',
  user: 'User',
  heart: 'Heart',
  star: 'Star',
  bell: 'Notification Bell',
  mail: 'Email',
  calendar: 'Calendar',
  camera: 'Camera',
  bookmark: 'Bookmark',
  globe: 'Globe',
  lock: 'Lock',
  music: 'Music',
  zap: 'Zap',
};

async function fetchSVG(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function syncSet(name, baseUrl, nameMap, { normalize } = {}) {
  const dir = join(ICONS_DIR, name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  console.log(`\nSyncing ${name} icons...`);
  let count = 0;

  for (const normalizedName of SHARED_NAMES) {
    const sourceName = nameMap[normalizedName];
    const url = baseUrl.replace('{name}', encodeURIComponent(sourceName));
    try {
      let svg = await fetchSVG(url);
      if (!svg.includes('<svg')) {
        console.warn(`  SKIP ${normalizedName}: not valid SVG`);
        continue;
      }
      if (normalize) svg = normalize(svg);
      writeFileSync(join(dir, `${normalizedName}.svg`), svg);
      console.log(`  OK ${normalizedName} (from ${sourceName})`);
      count++;
    } catch (err) {
      console.error(`  FAIL ${normalizedName}: ${err.message}`);
    }
  }

  // Write index.json
  const manifest = {
    name,
    count,
    icons: SHARED_NAMES.filter(n => existsSync(join(dir, `${n}.svg`))),
    generated: new Date().toISOString(),
  };
  writeFileSync(join(dir, 'index.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`  Wrote index.json (${count} icons)`);
}

async function main() {
  console.log('Icon Set Sync');
  console.log('=============');

  await syncSet(
    'phosphor',
    'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/{name}.svg',
    PHOSPHOR_MAP
  );

  await syncSet(
    'tabler',
    'https://raw.githubusercontent.com/tabler/tabler-icons/main/icons/outline/{name}.svg',
    TABLER_MAP
  );

  await syncSet(
    'mage',
    'https://raw.githubusercontent.com/Mage-Icons/mage-icons/main/svg/stroke/{name}.svg',
    MAGE_MAP,
    {
      normalize(svg) {
        // Mage SVGs use stroke="black" — replace with currentColor for theming
        return svg.replace(/stroke="black"/g, 'stroke="currentColor"');
      },
    }
  );

  console.log('\nDone!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
