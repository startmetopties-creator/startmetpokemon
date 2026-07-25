/**
 * Zet de <lastmod> in sitemap.xml gelijk aan de "dateModified" uit de JSON-LD
 * van de bijbehorende pagina.
 *
 * Waarom: Google vergelijkt beide signalen. Zegt de sitemap 24 juli en de
 * pagina zelf 19 juli, dan gaat Google lastmod voor de hele site negeren.
 * De pagina is de bron van waarheid, de sitemap volgt.
 *
 * Draaien vanuit de projectmap:
 *   node tools/sync-sitemap.mjs
 *   node tools/sync-sitemap.mjs --check     (alleen melden, niets wijzigen)
 *
 * Handig na elke inhoudelijke wijziging: eerst dateModified op de pagina
 * bijwerken, dan dit script draaien.
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const BASE = 'https://startmetpokemon.nl';
const CHECK = process.argv.includes('--check');

/** Zet een sitemap-URL om naar het bestand dat hem serveert. */
function urlToFile(loc) {
  let p = loc.replace(BASE, '').replace(/^\//, '');
  if (p === '') return 'index.html';
  if (p.endsWith('/')) return p + 'index.html';
  if (!path.extname(p)) return p + '.html';
  return p;
}

/** Haal dateModified uit de JSON-LD; val terug op datePublished. */
async function pageDate(rel) {
  const full = path.join(ROOT, rel);
  try {
    await access(full);
  } catch {
    return null;
  }
  const html = await readFile(full, 'utf8');
  for (const key of ['dateModified', 'datePublished']) {
    const hits = [...html.matchAll(new RegExp(`"${key}"\\s*:\\s*"(\\d{4}-\\d{2}-\\d{2})`, 'g'))].map(
      (m) => m[1]
    );
    if (hits.length) return hits.sort().at(-1);
  }
  return null;
}

const xml = await readFile(SITEMAP, 'utf8');
const blocks = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)];

let out = xml;
const changed = [];
const missing = [];
let same = 0;

for (const m of blocks) {
  const block = m[0];
  const loc = block.match(/<loc>(.*?)<\/loc>/)[1];
  const rel = urlToFile(loc);
  const date = await pageDate(rel);

  if (!date) {
    missing.push([loc, rel]);
    continue;
  }
  const cur = block.match(/<lastmod>(.*?)<\/lastmod>/);
  if (cur && cur[1] === date) {
    same++;
    continue;
  }

  const updated = cur
    ? block.replace(cur[0], `<lastmod>${date}</lastmod>`)
    : block.replace('</loc>', `</loc>\n    <lastmod>${date}</lastmod>`);
  out = out.replace(block, updated);
  changed.push([loc, cur ? cur[1] : '-', date]);
}

for (const [loc, rel] of missing) console.log(`GEEN DATUM  ${loc}  (${rel})`);
for (const [loc, oud, nieuw] of changed) console.log(`BIJWERKEN   ${loc}  ${oud} -> ${nieuw}`);

console.log(
  `\n${same} ongewijzigd, ${changed.length} bij te werken, ${missing.length} zonder datum`
);

if (CHECK) {
  console.log('(--check: sitemap.xml niet aangepast)');
  process.exit(changed.length || missing.length ? 1 : 0);
}

if (changed.length) {
  await writeFile(SITEMAP, out, 'utf8');
  console.log('sitemap.xml bijgewerkt.');
} else {
  console.log('Niets te doen.');
}
