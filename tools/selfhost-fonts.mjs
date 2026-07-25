/**
 * Haalt DM Serif Display en Figtree bij Google op, zet ze in assets/fonts/,
 * genereert assets/fonts.css en verwijst alle HTML-pagina's naar die kopie.
 *
 * Waarom: nu haalt elke bezoeker het lettertype rechtstreeks bij Google op.
 * Daarmee gaat hun IP-adres naar Google voordat je cookiebanner is beantwoord.
 * Zelf serveren lost dat op en scheelt bovendien twee DNS-lookups plus een
 * render-blokkerende request naar een ander domein.
 *
 * Draaien vanuit de projectmap:
 *   node tools/selfhost-fonts.mjs
 *
 * Alleen tonen wat er zou gebeuren:
 *   node tools/selfhost-fonts.mjs --dry-run
 *
 * Het script is herhaalbaar: opnieuw draaien overschrijft netjes.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
const CSS_OUT = path.join(ROOT, 'assets', 'fonts.css');
const DRY = process.argv.includes('--dry-run');

const GOOGLE_CSS =
  'https://fonts.googleapis.com/css2' +
  '?family=DM+Serif+Display:ital@0;1' +
  '&family=Figtree:wght@400;500;600;700' +
  '&display=swap';

// Met deze UA levert Google woff2 (kleinst, overal ondersteund).
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Nederlands heeft aan latin + latin-ext genoeg (é, ë, ï, ó, ü).
const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} bij ${url}`);
  return res.text();
}

function parseFaces(css) {
  const faces = [];
  let subset = null;
  for (const line of css.split('\n')) {
    const comment = line.match(/^\s*\/\*\s*([a-z-]+)\s*\*\/\s*$/);
    if (comment) subset = comment[1];
    if (line.includes('@font-face')) faces.push({ subset, lines: [] });
    if (faces.length) faces[faces.length - 1].lines.push(line);
  }
  return faces
    .map((f) => {
      const block = f.lines.join('\n');
      const url = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
      const family = block.match(/font-family:\s*'([^']+)'/);
      const weight = block.match(/font-weight:\s*(\d+)/);
      const style = block.match(/font-style:\s*(\w+)/);
      const range = block.match(/unicode-range:\s*([^;]+);/);
      if (!url || !family) return null;
      return {
        subset: f.subset,
        url: url[1],
        family: family[1],
        weight: weight ? weight[1] : '400',
        style: style ? style[1] : 'normal',
        range: range ? range[1].trim() : null,
      };
    })
    .filter(Boolean)
    .filter((f) => !f.subset || KEEP_SUBSETS.has(f.subset));
}

function fileNameFor(f) {
  const slug = f.family.toLowerCase().replace(/\s+/g, '-');
  return `${slug}-${f.weight}-${f.style}-${f.subset || 'latin'}.woff2`;
}

async function main() {
  console.log('Lettertype-CSS ophalen bij Google…');
  const css = await fetchText(GOOGLE_CSS);
  const faces = parseFaces(css);
  if (!faces.length) throw new Error('Geen @font-face-regels gevonden.');
  console.log(`${faces.length} varianten gevonden (latin + latin-ext).`);

  if (DRY) {
    for (const f of faces) {
      console.log(`  ${f.family} ${f.weight} ${f.style} ${f.subset} -> ${fileNameFor(f)}`);
    }
    console.log('\n--dry-run: niets gedownload of gewijzigd.');
    return;
  }

  await mkdir(FONT_DIR, { recursive: true });

  const rules = [];
  for (const f of faces) {
    const name = fileNameFor(f);
    const dest = path.join(FONT_DIR, name);
    const res = await fetch(f.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${res.status} bij ${f.url}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`  opgeslagen  assets/fonts/${name}`);
    rules.push(
      [
        '@font-face {',
        `  font-family: '${f.family}';`,
        `  font-style: ${f.style};`,
        `  font-weight: ${f.weight};`,
        '  font-display: swap;',
        `  src: url('/assets/fonts/${name}') format('woff2');`,
        f.range ? `  unicode-range: ${f.range};` : null,
        '}',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  const header =
    '/* Automatisch gegenereerd door tools/selfhost-fonts.mjs.\n' +
    '   Niet met de hand aanpassen; draai het script opnieuw.\n' +
    '   Lettertypen: DM Serif Display en Figtree, SIL Open Font License 1.1. */\n\n';
  await writeFile(CSS_OUT, header + rules.join('\n\n') + '\n', 'utf8');
  console.log(`\nassets/fonts.css geschreven (${rules.length} regels).`);

  await rewriteHtml();
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_werkdocumenten', 'tools', 'assets'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

async function rewriteHtml() {
  const files = await walk(ROOT);
  let touched = 0;

  for (const file of files) {
    let html = await readFile(file, 'utf8');
    const before = html;

    // preconnects naar Google zijn overbodig zodra we zelf serveren
    html = html.replace(
      /[ \t]*<link[^>]*rel="preconnect"[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\r?\n?/g,
      ''
    );
    // de stylesheet-link vervangen door de lokale variant
    html = html.replace(
      /[ \t]*<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>/,
      '  <link rel="preload" href="/assets/fonts/figtree-400-normal-latin.woff2" as="font" type="font/woff2" crossorigin>\n' +
        '  <link rel="stylesheet" href="/assets/fonts.css">'
    );

    if (html !== before) {
      await writeFile(file, html, 'utf8');
      touched++;
    }
  }
  console.log(`${touched} HTML-bestanden verwijzen nu naar de lokale lettertypen.`);
  console.log(
    '\nLet op: haal daarna fonts.googleapis.com en fonts.gstatic.com uit de\n' +
      'Content-Security-Policy in _headers. Ze zijn dan niet meer nodig.'
  );
}

main().catch((err) => {
  console.error('\nMislukt:', err.message);
  process.exit(1);
});
