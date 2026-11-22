/**
 * Zet onderaan elke setpagina een blok "Vorige set / Volgende set".
 *
 * Waarom: de setpagina's linken nu vooral naar hubs, niet naar elkaar. Wie op
 * Evolving Skies landt, kan niet in een klik naar de set ervoor of erna, en
 * zoekmachines zien geen volgorde tussen de 127 pagina's. Met dit blok hangen
 * alle setpagina's in een keten op releasedatum.
 *
 * Wat dit script doet: uit sets/data/sets.json alle sets met een eigen pagina
 * halen, sorteren op releasedatum (oud naar nieuw) en per pagina tussen twee
 * marker-comments een navigatieblok zetten, direct boven <nav class="closing">.
 * De oudste en de nieuwste set krijgen aan de lege kant een link naar het
 * overzicht van alle sets op volgorde.
 *
 * Draaien vanuit de projectmap (opnieuw draaien is veilig, het overschrijft):
 *   node tools/build-set-nav.mjs
 *   node tools/build-set-nav.mjs --dry-run
 * Opnieuw draaien na elke nieuwe set of gewijzigde releasedatum in sets.json.
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'sets', 'data', 'sets.json');
const DRY = process.argv.includes('--dry-run');

const START = '<!-- SET-NAV:START (gegenereerd door tools/build-set-nav.mjs, niet met de hand aanpassen) -->';
const END = '<!-- SET-NAV:END -->';
const ANCHOR = '<nav class="closing">';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Zelfde normalisatie als build-set-index.mjs: geen em-dashes in publieke content.
const naam = (s) => String(s).replace(/\s*—\s*/g, '-');

const data = JSON.parse(await readFile(DATA, 'utf8'));
const sets = [];
const gezien = new Set();
let volg = 0;
for (const serie of data.series) {
  for (const s of serie.sets || []) {
    volg++;
    // Drie sets hebben geen gewone setpagina maar een eigen setgids (guide): die tellen mee.
    const pagina = s.page || s.guide;
    if (!pagina || !pagina.startsWith('/sets/') || gezien.has(pagina)) continue;
    gezien.add(pagina);
    sets.push({ ...s, page: pagina, _volg: volg });
  }
}
// Oud naar nieuw. Bij gelijke datum: de volgorde in sets.json omgekeerd (die loopt nieuw naar oud).
sets.sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || '') || b._volg - a._volg);

const OVERZICHT = { page: '/sets/pokemon-sets-op-volgorde', name: 'Alle sets op volgorde' };

function blok(prev, next) {
  const links = prev
    ? `    <a href="${esc(prev.page)}" class="closing-card">\n      <p class="cc-label">&larr; Vorige set</p>\n      <p class="cc-title">${esc(naam(prev.name))}</p>\n    </a>`
    : `    <a href="${OVERZICHT.page}" class="closing-card">\n      <p class="cc-label">Overzicht</p>\n      <p class="cc-title">${OVERZICHT.name}</p>\n    </a>`;
  const rechts = next
    ? `    <a href="${esc(next.page)}" class="closing-card">\n      <p class="cc-label">Volgende set &rarr;</p>\n      <p class="cc-title">${esc(naam(next.name))}</p>\n    </a>`
    : `    <a href="${OVERZICHT.page}" class="closing-card">\n      <p class="cc-label">Overzicht</p>\n      <p class="cc-title">${OVERZICHT.name}</p>\n    </a>`;
  return `${START}\n  <nav class="closing" aria-label="Vorige en volgende set" style="padding-bottom:0;border-bottom:none">\n${links}\n${rechts}\n  </nav>\n  ${END}\n\n  `;
}

let gewijzigd = 0, overgeslagen = [];
for (let i = 0; i < sets.length; i++) {
  const s = sets[i];
  const file = path.join(ROOT, s.page + '.html');
  try { await access(file); } catch { overgeslagen.push(`${s.page}: bestand ontbreekt`); continue; }
  let html = await readFile(file, 'utf8');
  const nieuw = blok(sets[i - 1], sets[i + 1]);
  const a = html.indexOf(START);
  if (a >= 0) {
    const b = html.indexOf(END, a);
    if (b < 0) { overgeslagen.push(`${s.page}: START zonder END`); continue; }
    // vervang het oude blok inclusief de witruimte erna tot aan de closing-nav
    const na = html.indexOf(ANCHOR, b);
    html = html.slice(0, a) + nieuw + html.slice(na);
  } else {
    const n = html.split(ANCHOR).length - 1;
    if (n !== 1) { overgeslagen.push(`${s.page}: ${n}x ${ANCHOR}`); continue; }
    html = html.replace(ANCHOR, nieuw + ANCHOR);
  }
  const oud = await readFile(file, 'utf8');
  if (oud !== html) {
    gewijzigd++;
    if (!DRY) await writeFile(file, html);
  }
}
console.log(`${sets.length} setpagina's in de keten, ${gewijzigd} ${DRY ? 'zouden wijzigen' : 'gewijzigd'}.`);
console.log(`Oudste: ${sets[0].name} (${sets[0].releaseDate}), nieuwste: ${sets.at(-1).name} (${sets.at(-1).releaseDate}).`);
if (overgeslagen.length) { console.log('Overgeslagen:'); overgeslagen.forEach((x) => console.log('  ' + x)); }
