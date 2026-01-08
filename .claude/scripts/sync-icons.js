#!/usr/bin/env node

/**
 * Icon Sync Script
 * Copies Lucide icons from node_modules to assets/icons/lucide/
 * Generates index.json manifest of available icons
 *
 * Usage:
 *   node scripts/sync-icons.js
 *   npm run icons:sync
 */

import { readdirSync, copyFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Configuration
const SOURCE_DIR = join(ROOT, 'node_modules', 'lucide-static', 'icons');
const TARGET_DIR = join(ROOT, 'assets', 'icons', 'lucide');
const CUSTOM_DIR = join(ROOT, 'assets', 'icons', 'custom');
const MANIFEST_FILE = join(TARGET_DIR, 'index.json');

// Colors for terminal output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    dim: '\x1b[2m'
};

/**
 * Ensure directory exists
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`${colors.green}Created${colors.reset} ${dir}`);
    }
}

/**
 * Get all SVG files from source directory
 * @returns {string[]} Array of SVG filenames
 */
function getSourceIcons() {
    if (!existsSync(SOURCE_DIR)) {
        console.error(`${colors.red}Error:${colors.reset} lucide-static not installed.`);
        console.log(`Run: npm install lucide-static --save-dev`);
        process.exit(1);
    }

    return readdirSync(SOURCE_DIR)
        .filter(file => file.endsWith('.svg'))
        .sort();
}

/**
 * Copy icons from source to target
 * @param {string[]} icons - Array of icon filenames
 * @returns {number} Number of icons copied
 */
function copyIcons(icons) {
    let copied = 0;

    for (const icon of icons) {
        const source = join(SOURCE_DIR, icon);
        const target = join(TARGET_DIR, icon);

        copyFileSync(source, target);
        copied++;
    }

    return copied;
}

/**
 * Generate manifest file with icon metadata
 * @param {string[]} icons - Array of icon filenames
 */
function generateManifest(icons) {
    const manifest = {
        name: 'lucide',
        version: getLucideVersion(),
        count: icons.length,
        icons: icons.map(file => basename(file, '.svg')),
        generated: new Date().toISOString()
    };

    writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

/**
 * Get lucide-static package version
 * @returns {string} Version string
 */
function getLucideVersion() {
    try {
        const pkg = JSON.parse(
            readFileSync(join(ROOT, 'node_modules', 'lucide-static', 'package.json'), 'utf8')
        );
        return pkg.version || 'unknown';
    } catch {
        return 'unknown';
    }
}

// Import readFileSync for version check
import { readFileSync } from 'fs';

/**
 * Main function
 */
function main() {
    console.log(`${colors.cyan}Icon Sync${colors.reset}`);
    console.log(`${colors.dim}Syncing Lucide icons to assets/icons/lucide/${colors.reset}`);
    console.log();

    // Ensure directories exist
    ensureDir(TARGET_DIR);
    ensureDir(CUSTOM_DIR);

    // Get source icons
    const icons = getSourceIcons();
    console.log(`Found ${colors.cyan}${icons.length}${colors.reset} icons in lucide-static`);

    // Copy icons
    const copied = copyIcons(icons);
    console.log(`Copied ${colors.green}${copied}${colors.reset} icons to ${TARGET_DIR}`);

    // Generate manifest
    generateManifest(icons);
    console.log(`Generated ${colors.green}index.json${colors.reset} manifest`);

    console.log();
    console.log(`${colors.green}Done!${colors.reset} Icons are ready in assets/icons/lucide/`);
    console.log(`${colors.dim}Add custom icons to assets/icons/custom/${colors.reset}`);
}

main();
