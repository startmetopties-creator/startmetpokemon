/**
 * Zet de kaartlijst van elke setpagina vooraf in de HTML.
 *
 * Waarom: nu staat #cardGallery leeg in het HTML-bestand en wordt de lijst pas
 * door JavaScript opgehaald uit /sets/data/<id>.json. Zoekmachines krijgen
 * daardoor een pagina waarvan de enige unieke inhoud — de kaartlijst zelf —
 * ontbreekt. Wat overblijft is per set vrijwel dezelfde tekst.
 *
 * Wat dit script doet: exact dezelfde HTML genereren die renderCards() ook
 * maakt, en die in #cardGallery zetten. Bij het laden wist de bestaande
 * JavaScript de galerij (gallery.innerHTML = '') en bouwt hem opnieuw op.
 * Voor de bezoeker verandert er dus niets. Zonder JavaScript is de lijst nu
 * wel zichtbaar, en zoekmachines zien de kaartnamen zonder te hoeven renderen.
 *
 * Draaien vanuit de projectmap (opnieuw draaien is veilig, het overschrijft):
 *   node tools/prerender-sets.mjs
 *   node tools/prerender-sets.mjs --dry-run
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETS = path.join(ROOT, 'sets');
const DRY = process.argv.includes('--dry-run');

const OPEN = '<div class="card-gallery" id="cardGallery">';
const CLOSE = '</div>';

const escape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Zelfde sortering als renderCards(): op kaartnummer, numeriek waar mogelijk.
function sortCards(cards) {
  return [...cards].sort((a, b) => {
    const na = parseInt(String(a.n), 10);
    const nb = parseInt(String(b.n), 10);
    const ka = Number.isNaN(na) ? Infinity : na;
    const kb = Number.isNaN(nb) ? Infinity : nb;
    return ka - kb || String(a.n).localeCompare(String(b.n), undefined, { numeric: true });
  });
}

function galleryHtml(data, setName, { sort = true, useImgToken = true, rarityFallback = null } = {}) {
  const list = sort ? sortCards(data.cards || []) : data.cards || [];
  return list
    .map((c) => {
      const token = useImgToken ? c.img || c.n : c.n;
      const small = (data.imageSmall || '').replace('{n}', token);
      const large = (data.imageLarge || '').replace('{n}', token);
      const alt = `Pokemon-kaart ${c.name}, nummer ${c.n} uit ${setName}`;
      return (
        `<a class="tcg-card" href="${escape(large || small || '#')}" target="_blank" rel="noopener">` +
        // Attribuutvolgorde gelijk aan de toewijzingen in renderCards(),
        // zodat tools/verify-prerender.mjs een exacte vergelijking kan maken.
        `<img width="245" height="342" loading="lazy" decoding="async" src="${escape(small)}" alt="${escape(alt)}">` +
        `<span class="tc-name">${escape(c.n)} &middot; ${escape(c.name)}</span>` +
        `<span class="tc-rarity">${escape(c.r || rarityFallback || '')}</span>` +
        `</a>`
      );
    })
    .join('');
}

async function main() {
  const files = (await readdir(SETS)).filter((f) => f.endsWith('.html'));
  let done = 0,
    skipped = 0,
    bytes = 0;

  for (const name of files) {
    const file = path.join(SETS, name);
    let html = await readFile(file, 'utf8');

    const start = html.indexOf(OPEN);
    if (start < 0) {
      skipped++;
      continue;
    }
    // Twee varianten in de codebase, allebei ondersteund:
    //  A) var SET_ID = 'base1'  — sorteert op nummer, kent c.img en 'Overig'
    //  B) fetch('/sets/data/me2pt5.json') — houdt de volgorde uit de JSON aan
    const varA = html.match(/var SET_ID\s*=\s*'([^']+)'/);
    const varB = html.match(/fetch\('\/sets\/data\/([^']+)\.json'\)/);
    const setId = varA ? varA[1] : varB ? varB[1] : null;
    if (!setId) {
      console.log(`  geen set-id gevonden: ${name}`);
      skipped++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(await readFile(path.join(SETS, 'data', `${setId}.json`), 'utf8'));
    } catch {
      console.log(`  geen data voor ${setId} (${name})`);
      skipped++;
      continue;
    }

    // De setnaam moet exact overeenkomen met wat renderCards() in de alt-tekst zet.
    const altTpl = html.match(/nummer '?\s*\+\s*c\.n[^;]*?uit ([^']+)'/);
    const nameMatch = html.match(/var SET_NAME\s*=\s*'([^']*)'/);
    const setName = nameMatch ? nameMatch[1] : altTpl ? altTpl[1] : data.name || '';

    // Sommige pagina's tonen 'Overig' bij een ontbrekende zeldzaamheid,
    // andere 'Onbekend'. Lees het uit de pagina in plaats van het te gokken.
    const fb = html.match(/c\.(?:r|rarity)\s*\|\|\s*'([^']*)'/);

    const inner = galleryHtml(data, setName, {
      sort: Boolean(varA),
      useImgToken: Boolean(varA),
      rarityFallback: fb ? fb[1] : null,
    });

    // Van "<div ... id="cardGallery">" tot de bijbehorende "</div>".
    const from = start + OPEN.length;
    const to = html.indexOf(CLOSE, from);
    const replaced = html.slice(0, from) + inner + html.slice(to);

    // De onderschrift-tekst stond op "wordt geladen...". Nu de lijst al in de
    // HTML staat klopt dat niet meer voor bezoekers zonder JavaScript, dus
    // zetten we er meteen het bronvermeldingsonderschrift neer dat het script
    // er anders in zet.
    const noteMatch = replaced.match(/note\.textContent\s*=\s*'((?:Kaartgegevens)[^']*)'/);
    const finalHtml = noteMatch
      ? replaced.replace(
          />De kaartlijst wordt geladen\.\.\.</,
          '>' + noteMatch[1].replace(/&/g, '&amp;').replace(/</g, '&lt;') + '<'
        )
      : replaced;

    bytes += inner.length;
    if (!DRY) await writeFile(file, finalHtml, 'utf8');
    done++;
  }

  console.log(
    `${DRY ? '[dry-run] ' : ''}${done} setpagina's voorzien van een kaartlijst ` +
      `(${skipped} overgeslagen, ${(bytes / 1024).toFixed(0)} kB HTML toegevoegd, ` +
      `sterk comprimeerbaar).`
  );
}

main().catch((err) => {
  console.error('Mislukt:', err.message);
  process.exit(1);
});
