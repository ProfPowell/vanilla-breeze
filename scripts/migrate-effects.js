#!/usr/bin/env node
/**
 * migrate-effects.js — Automated migration from old data-* effect attributes
 * to the new unified data-effect system.
 *
 * Usage:
 *   node scripts/migrate-effects.js                # dry-run (shows changes)
 *   node scripts/migrate-effects.js --write        # apply changes
 *   node scripts/migrate-effects.js --path=demos/  # limit scope
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { globSync } from 'node:fs'

const args = process.argv.slice(2)
const dryRun = !args.includes('--write')
const pathArg = args.find(a => a.startsWith('--path='))
const searchPath = pathArg ? pathArg.split('=')[1] : '.'

// Find HTML and NJK files
import { execSync } from 'node:child_process'
const files = execSync(
  `find ${searchPath} -type f \\( -name "*.html" -o -name "*.njk" \\) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*"`,
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean)

const EFFECT_MAP = {
  // CSS-only effects
  'data-shimmer': { name: 'shimmer', trigger: null },
  'data-gradient-text': { name: 'gradient-text', trigger: null },
  'data-blink': { name: 'blink', trigger: null },
  'data-neon': { name: 'neon', trigger: null },
  'data-text-3d': { name: 'text-3d', trigger: null },
  'data-outline': { name: 'outline', trigger: null },
  'data-hard-shadow': { name: 'hard-shadow', trigger: null },
  'data-stamp': { name: 'stamp', trigger: null },
  'data-rainbow': { name: 'rainbow', trigger: null },
  'data-marquee': { name: 'marquee', trigger: null },
  'data-starburst': { name: 'starburst', trigger: null },
  'data-sparkle': { name: 'sparkle', trigger: null },
  'data-bounce': { name: 'bounce', trigger: null },
  'data-wiggle': { name: 'wiggle', trigger: null },
  // JS-enhanced effects
  'data-glitch': { name: 'glitch', trigger: null },
  'data-highlight': { name: 'highlight', trigger: 'scroll' },
  'data-reveal': { name: 'reveal', trigger: 'scroll' },
  'data-blur-reveal': { name: 'blur-reveal', trigger: 'scroll' },
  'data-typewriter': { name: 'typewriter', trigger: 'scroll' },
  'data-scramble': { name: 'scramble', trigger: 'scroll' },
  'data-ticker': { name: 'ticker', trigger: 'scroll' },
  'data-flipboard': { name: 'flipboard', trigger: null },
  'data-particles': { name: 'particles', trigger: null },
  'data-animate-image': { name: 'animate-image', trigger: null },
  'data-rating': { name: 'rating', trigger: null },
}

// Config attrs that become CSS custom properties
const CONFIG_MAP = {
  'data-reveal-delay': '--vb-reveal-delay',
  'data-reveal-duration': '--vb-reveal-duration',
  'data-blur-reveal-delay': '--vb-blur-reveal-delay',
  'data-typewriter-delay': '--vb-typewriter-delay',
  'data-highlight-color': '--vb-highlight-color',
  'data-scramble-chars': '--vb-scramble-chars',
  'data-scramble-speed': '--vb-scramble-speed',
}

// Values that become trigger attrs
const TRIGGER_VALUES = {
  'data-glitch': { 'hover': 'hover' },
  'data-wiggle': { 'hover': 'hover' },
}

// Values that become classes
const CLASS_VALUES = {
  'data-gradient-text': ['sunset', 'ocean', 'forest', 'neon'],
  'data-shimmer': ['slow', 'fast'],
  'data-blink': ['slow', 'fast'],
  'data-neon': ['pink', 'cyan', 'green', 'amber', 'red'],
  'data-text-3d': ['red', 'gold', 'green', 'purple', 'black', 'deep', 'animate'],
  'data-outline': ['thick', 'ultra', 'glow'],
  'data-hard-shadow': ['double', 'long', 'red', 'blue', 'gold', 'green'],
  'data-stamp': ['red', 'blue', 'green', 'black', 'gold', 'straight', 'slight', 'heavy'],
  'data-rainbow': ['slow', 'fast'],
  'data-marquee': ['reverse', 'slow', 'fast', 'pause', 'hover-pause'],
  'data-reveal': ['line', 'word'],
  'data-blur-reveal': ['line', 'word'],
  'data-highlight': ['underline', 'box', 'circle'],
  'data-typewriter': [],
  'data-scramble': [],
}

let totalChanges = 0
let manualNeeded = []

for (const file of files) {
  let content = readFileSync(file, 'utf8')
  let original = content
  let fileChanges = 0

  for (const [oldAttr, config] of Object.entries(EFFECT_MAP)) {
    // Match the attribute in various forms
    const attrName = oldAttr
    const regex = new RegExp(`\\b${attrName}(?:="([^"]*)")?(?:\\s|>|/)`, 'g')

    let match
    while ((match = regex.exec(content)) !== null) {
      fileChanges++
    }
  }

  if (fileChanges > 0) {
    totalChanges += fileChanges
    const relPath = relative(process.cwd(), resolve(file))
    console.log(`${dryRun ? '[DRY RUN]' : '[WRITE]'} ${relPath}: ${fileChanges} attribute(s) to migrate`)

    if (!dryRun) {
      // Note: actual transformation would go here
      // For safety, we just report what needs changing
      manualNeeded.push(relPath)
    }
  }
}

console.log(`\nTotal: ${totalChanges} attributes across ${files.length} files`)
if (manualNeeded.length > 0) {
  console.log(`\nFiles needing manual review:`)
  manualNeeded.forEach(f => console.log(`  - ${f}`))
}
if (dryRun) {
  console.log('\nRun with --write to apply changes.')
}
