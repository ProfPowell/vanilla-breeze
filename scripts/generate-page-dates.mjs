#!/usr/bin/env node
/**
 * Write site/data/page-dates.json: the date each docs page last changed,
 * from git history. The human sitemap (site/plugins/generate-sitemap-page.js)
 * and sitemap.xml (scripts/generate-sitemap.js) both read it, so "updated"
 * means the same thing in each.
 *
 * The file is committed. The deploy build may run on a shallow clone with no
 * per-file history, so it reads the committed file and does not run this
 * script; on a shallow clone the script leaves the file alone.
 *
 * A page's date is the day of the newest commit that touched its source file,
 * skipping sweeps: a commit that edits more than BULK pages at once is a
 * mechanical change (a rename, a frontmatter migration), not an update to
 * each of them (a page that only sweeps have touched keeps the day it was
 * added). Page files changed in the working tree count as changed
 * today, so the data is already right in the commit that carries the edit.
 * A moved page keeps the history it had at its old path.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PAGES = 'site/src/pages/';
const OUT = join(ROOT, 'site/data/page-dates.json');
const BULK = 25;

/* Generated on every build, so their history says nothing about content. */
const GENERATED = [/^\/sitemap\/$/, /^\/topics\//];

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

export function urlOf(file) {
  const rel = file.slice(PAGES.length);
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
}

/**
 * @param {string} log `git log --format=@%cs --name-status -M` output, newest first
 * @param {string[]} dirty page files changed in the working tree
 * @param {string} today YYYY-MM-DD
 * @param {(file: string) => boolean} exists
 * @param {Record<string, string>} [moved] working-tree moves: old path → new path
 * @returns {Record<string, string>} url → date
 */
export function datesFromLog(log, dirty, today, exists, moved = {}) {
  /**
   * What a path in an older commit is called today. Filled while walking back
   * through history: a rename points the old path at the new one, and a path
   * that was added later is a different page before that point.
   * @type {Map<string, string | null>}
   */
  const alias = new Map(Object.entries(moved));
  const nowAt = (/** @type {string} */ file) => (alias.has(file) ? alias.get(file) : file);
  let current = { date: today, files: dirty };
  /** @type {Array<[string, string | null]>} */
  let pending = [];
  const commits = [current];
  const settle = () => { for (const [file, to] of pending) alias.set(file, to); pending = []; };
  for (const line of log.split('\n')) {
    if (line.startsWith('@')) {
      settle();
      current = { date: line.slice(1).trim(), files: [] };
      commits.push(current);
      continue;
    }
    const [kind, ...paths] = line.split('\t');
    const path = paths.at(-1);
    if (!kind || !path || !path.endsWith('.html') || !path.startsWith(PAGES)) continue;
    const file = nowAt(path);
    if (file) current.files.push(file);
    if (kind.startsWith('R') && paths.length === 2) pending.push([paths[0], file ?? null]);
    if (kind === 'A') pending.push([path, null]);
  }
  /** @type {Record<string, string>} */
  const dates = {};
  /** URLs dated from a sweep: later (older) sweeps overwrite, ending on the first */
  const bulkOnly = new Set();
  for (const { date, files } of commits) {
    if (files.length > BULK) continue;
    for (const file of files) {
      const url = urlOf(file);
      if (url in dates || GENERATED.some((rx) => rx.test(url)) || !exists(file)) continue;
      dates[url] = date;
    }
  }
  // A page only ever touched by sweeps keeps the day it was added
  for (const { date, files } of commits) {
    if (files.length <= BULK) continue;
    for (const file of files) {
      const url = urlOf(file);
      if (GENERATED.some((rx) => rx.test(url)) || !exists(file)) continue;
      if (!(url in dates) || bulkOnly.has(url)) { dates[url] = date; bulkOnly.add(url); }
    }
  }
  return Object.fromEntries(Object.entries(dates).sort(([a], [b]) => a.localeCompare(b)));
}

function main() {
  let shallow = true;
  try { shallow = git('rev-parse', '--is-shallow-repository').trim() !== 'false'; } catch { /* not a repo */ }
  if (shallow) {
    console.log('  ! page-dates: no full git history here, keeping the committed file');
    return;
  }
  const log = git('log', '--format=@%cs', '--name-status', '-M', '--', PAGES);
  const dirty = git('status', '--porcelain', '--', PAGES).split('\n')
    .map((line) => line.slice(3).split(' -> ').pop() ?? '')
    .filter((file) => file.endsWith('.html'));
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const moved = Object.fromEntries(git('diff', 'HEAD', '--name-status', '-M', '--diff-filter=R', '--', PAGES)
    .split('\n').map((line) => line.split('\t').slice(1)).filter((pair) => pair.length === 2));
  const pages = datesFromLog(log, dirty, today, (file) => existsSync(join(ROOT, file)), moved);
  const json = JSON.stringify({
    _comment: 'Generated by scripts/generate-page-dates.mjs from git history. Do not edit by hand.',
    pages,
  }, null, 2) + '\n';
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== json) writeFileSync(OUT, json);
  console.log(`  ✓ page-dates: ${Object.keys(pages).length} pages`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
