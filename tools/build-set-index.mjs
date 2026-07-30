/**
 * Zet een statische, doorklikbare index van alle setpagina's in de HTML.
 *
 * Waarom: de set-verkenner op /sets/pokemon-sets-op-volgorde en de hub /sets/
 * bouwen hun grid volledig met JavaScript op (createElement na een fetch van
 * sets.json). Er staat daardoor geen enkele <a href> naar een setpagina in de
 * geleverde HTML. Van de 104 setpagina's hebben er maar zes een echte interne
 * link, en de rest is alleen via de sitemap vindbaar. Zoekmachines krijgen zo
 * geen signaal welke setpagina's ertoe doen.
 *
 * Wat dit script doet: uit sets.json een lijst per serie genereren en die
 * tussen twee marker-comments plaatsen. Het blok staat BUITEN #setGrid, dus de
 * bestaande JavaScript en de kaartlayout worden niet geraakt. De verkenner
 * blijft precies werken zoals hij werkt.
 *
 * Draaien vanuit de projectmap (opnieuw draaien is veilig, het overschrijft):
 *   node tools/build-set-index.mjs
 *   node tools/build-set-index.mjs --dry-run
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'sets', 'data', 'sets.json');
const DRY = process.argv.includes('--dry-run');

const START = '<!-- SET-INDEX:START (gegenereerd door tools/build-set-index.mjs, niet met de hand aanpassen) -->';
const END = '<!-- SET-INDEX:END -->';

const TARGETS = [
  path.join(ROOT, 'sets', 'pokemon-sets-op-volgorde.html'),
  path.join(ROOT, 'sets', 'index.html'),
];

// De Pokemon TCG API levert een paar setnamen met een em-dash aan
// (HS—Triumphant, HS—Undaunted, HS—Unleashed). De setpagina's zelf schrijven
// die met een gewoon koppelteken, en em-dashes zijn sowieso niet toegestaan in
// publieke content. Daarom hier normaliseren.
const normalise = (s) => String(s).replace(/—/g, '-');

const escape = (s) =>
  normalise(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Zelfde soortaanduiding als de set-verkenner gebruikt, zodat de statische
// lijst en het grid dezelfde taal spreken.
function serieKind(status) {
  if (status === 'lopend') return 'Lopende serie';
  if (status === 'losse jubileumset') return 'Losse jubileumset';
  return 'Afgesloten serie';
}

// Zelfde href-logica als cardEl() in de verkenner: eigen pagina, anders de
// setgids, anders de release-kalender voor wat nog moet verschijnen.
function hrefFor(s) {
  return s.page || s.guide || (s.status === 'aangekondigd' ? '/kopen/release-kalender' : null);
}

function buildBlock(data) {
  const out = [];
  out.push(START);
  out.push('<div class="set-index">');

  for (const ser of data.series) {
    const items = ser.sets.map((s) => {
      const href = hrefFor(s);
      const name = escape(s.name);
      const suffix = s.status === 'aangekondigd' ? ' <span class="si-soon">binnenkort</span>' : '';
      return href
        ? `        <li><a href="${escape(href)}">${name}</a>${suffix}</li>`
        : `        <li>${name}${suffix}</li>`;
    });

    out.push('    <div class="set-index-serie">');
    out.push(`      <h3>${escape(ser.name)}</h3>`);
    out.push(`      <p class="si-meta">${serieKind(ser.status)} &middot; ${escape(ser.period)}</p>`);
    out.push('      <ul>');
    out.push(...items);
    out.push('      </ul>');
    out.push('    </div>');
  }

  out.push('</div>');
  out.push(END);
  return out.join('\n');
}

const data = JSON.parse(await readFile(DATA, 'utf8'));
const block = buildBlock(data);

const linkCount = (block.match(/<a href="/g) || []).length;
const setCount = data.series.reduce((n, s) => n + s.sets.length, 0);
console.log(`sets.json: ${data.series.length} series, ${setCount} sets -> ${linkCount} links in het blok`);

let changed = 0;
for (const file of TARGETS) {
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch {
    console.log(`OVERGESLAGEN (bestaat niet): ${path.relative(ROOT, file)}`);
    continue;
  }

  const i = html.indexOf(START);
  const j = html.indexOf(END);
  if (i === -1 || j === -1) {
    console.log(`OVERGESLAGEN (geen markers): ${path.relative(ROOT, file)}`);
    continue;
  }

  const before = html.slice(0, i);
  const after = html.slice(j + END.length);
  const next = before + block + after;

  if (next === html) {
    console.log(`ongewijzigd: ${path.relative(ROOT, file)}`);
    continue;
  }

  // Veiligheidscheck: buiten het blok mag er niets veranderd zijn.
  const strip = (s) => {
    const a = s.indexOf(START);
    const b = s.indexOf(END);
    return a === -1 || b === -1 ? s : s.slice(0, a) + s.slice(b + END.length);
  };
  if (strip(next) !== strip(html)) {
    console.error(`FOUT: wijziging buiten het blok in ${path.relative(ROOT, file)}, niet weggeschreven`);
    process.exitCode = 1;
    continue;
  }

  if (!DRY) await writeFile(file, next, 'utf8');
  changed++;
  console.log(`${DRY ? 'zou bijwerken' : 'bijgewerkt'}: ${path.relative(ROOT, file)}`);
}

console.log(`klaar, ${changed} bestand(en) ${DRY ? 'zouden wijzigen' : 'gewijzigd'}`);
