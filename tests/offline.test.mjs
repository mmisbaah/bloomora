// Checks that sw.js lists every file the game loads, so offline play doesn't break when a
// file is added. Run: node tests/offline.test.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const listed = new Set([...sw.matchAll(/^\s*'([^']+)',$/gm)].map(m => m[1]));

const walk = dir => readdirSync(dir).flatMap(name => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [relative(root, p).split('\\').join('/')];
});
const needed = ['index.html', 'manifest.webmanifest', ...['css', 'js', 'icons'].flatMap(d => walk(join(root, d)))];
const missing = needed.filter(f => !listed.has(f));
const stale = [...listed].filter(f => f !== './' && !needed.includes(f));

console.log(`files listed: ${listed.size}, missing: ${missing.length}, stale: ${stale.length}`);
if (missing.length) console.log('missing from sw.js:', missing.join(', '));
if (stale.length) console.log('listed but not found:', stale.join(', '));
if (missing.length || stale.length) process.exit(1);
