/**
 * Bouwt de beurzenkalender op /beurzen/ uit beurzen/beurzen.json.
 *
 * Waarom een script: de agenda moet statisch in de HTML staan (anders ziet
 * Google geen enkele beurs), maar hij verandert elke maand. Handmatig kaarten
 * bijwerken gaat een keer of drie goed. Daarom staat alle data in een JSON en
 * genereert dit script de HTML ertussen, inclusief de Event-markup voor
 * zoekmachines. Voorbije edities vallen er automatisch uit.
 *
 * Draaien vanuit de projectmap (opnieuw draaien is veilig, het overschrijft):
 *   node tools/build-beurzen.mjs
 *   node tools/build-beurzen.mjs --dry-run
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'beurzen', 'beurzen.json');
const PAGINA = path.join(ROOT, 'beurzen', 'index.html');
const DRY = process.argv.includes('--dry-run');

const SITE = 'https://startmetpokemon.nl';
const PAGE_URL = SITE + '/beurzen/';

const MAAND_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MAAND_LANG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const DAG_LANG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const datum = (s) => {
  const [j, m, d] = String(s).split('-').map(Number);
  return new Date(j, m - 1, d);
};

function kort(start, eind) {
  const a = datum(start);
  if (!eind) return `${a.getDate()} ${MAAND_KORT[a.getMonth()]}`;
  const b = datum(eind);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} en ${b.getDate()} ${MAAND_KORT[b.getMonth()]}`;
  return `${a.getDate()} ${MAAND_KORT[a.getMonth()]} tot ${b.getDate()} ${MAAND_KORT[b.getMonth()]}`;
}

function lang(start, eind) {
  const a = datum(start);
  const eerste = `${DAG_LANG[a.getDay()]} ${a.getDate()} ${MAAND_LANG[a.getMonth()]} ${a.getFullYear()}`;
  if (!eind) return eerste;
  const b = datum(eind);
  return `${DAG_LANG[a.getDay()]} ${a.getDate()} en ${DAG_LANG[b.getDay()]} ${b.getDate()} ${MAAND_LANG[b.getMonth()]} ${b.getFullYear()}`;
}

/** Alle beurzen platslaan naar losse edities, voorbije edities eruit. */
function edities(beurzen, vandaag) {
  const uit = [];
  for (const b of beurzen) {
    for (const d of b.datums || []) {
      const laatste = datum(d.eind || d.start);
      if (laatste < vandaag) continue;
      uit.push({ ...b, start: d.start, eind: d.eind || null, tijden: d.tijden || b.tijden || null });
    }
  }
  uit.sort((x, y) => {
    if (x.uitgelicht !== y.uitgelicht) return x.uitgelicht ? -1 : 1;
    return x.start.localeCompare(y.start) || x.naam.localeCompare(y.naam);
  });
  return uit;
}

function waar(e) {
  return [e.locatie, e.plaats].filter(Boolean).join(', ') || e.plaats;
}

function entreeTekst(e) {
  if (!e.entree) return 'Nog niet bekend';
  const delen = [];
  if (e.entree.normaal) delen.push(`&euro; ${esc(e.entree.normaal)}`);
  if (e.entree.early) delen.push(`early access &euro; ${esc(e.entree.early)}`);
  if (e.entree.kind) delen.push(esc(e.entree.kind));
  return delen.join(', ') || 'Nog niet bekend';
}

function tijdenTekst(e) {
  if (!e.tijden) return null;
  const t = [];
  if (e.tijden.open && e.tijden.sluit) t.push(`${esc(e.tijden.open)} tot ${esc(e.tijden.sluit)} uur`);
  else if (e.tijden.open) t.push(`vanaf ${esc(e.tijden.open)} uur`);
  if (e.tijden.early) t.push(`early access vanaf ${esc(e.tijden.early)} uur`);
  return t.join(', ') || null;
}

function rij(label, waarde) {
  if (!waarde) return '';
  return `\n            <div class="bf-row"><dt>${label}</dt><dd>${waarde}</dd></div>`;
}

function kaart(e) {
  const uid = `${e.id}-${e.start}`;
  const tijden = tijdenTekst(e);
  const zoek = [e.naam, e.plaats, e.provincie, e.locatie, e.organisator].filter(Boolean).join(' ').toLowerCase();
  const icsEind = e.eind
    ? new Date(datum(e.eind).getTime() + 864e5)
    : new Date(datum(e.start).getTime() + 864e5);
  const icsEindStr = `${icsEind.getFullYear()}-${String(icsEind.getMonth() + 1).padStart(2, '0')}-${String(icsEind.getDate()).padStart(2, '0')}`;

  const links = [];
  if (e.tickets) links.push(`<a href="${esc(e.tickets)}" target="_blank" rel="noopener nofollow">Tickets en info</a>`);
  else if (e.site) links.push(`<a href="${esc(e.site)}" target="_blank" rel="noopener nofollow">Site van de organisator</a>`);

  return `
      <article class="beurs-card${e.uitgelicht ? ' is-uitgelicht' : ''}" data-datum="${esc(e.start)}" data-eind="${esc(e.eind || e.start)}" data-provincie="${esc(e.provincie || '')}" data-status="${esc(e.status || '')}" data-zoek="${esc(zoek)}" data-ics-uid="${esc(uid)}" data-ics-start="${esc(e.start)}" data-ics-end="${esc(icsEindStr)}" data-ics-naam="${esc(e.naam)}" data-ics-plek="${esc([e.locatie, e.adres || e.plaats].filter(Boolean).join(', '))}">
        <button type="button" class="beurs-head" aria-expanded="false">
          <span class="beurs-when"><time datetime="${esc(e.start)}">${esc(kort(e.start, e.eind))}</time><span class="beurs-badge">&ndash;</span></span>
          <span class="beurs-titles">
            <span class="beurs-name">${esc(e.naam)}</span>
            <span class="beurs-sub">${esc(waar(e))}${e.uitgelicht ? ' <span class="beurs-tag">uitgelicht</span>' : ''}</span>
          </span>
          <span class="beurs-chevron" aria-hidden="true">+</span>
        </button>
        <div class="beurs-body">
          <div class="beurs-body-inner">
            <p>${esc(e.omschrijving || '')}</p>
            <dl class="beurs-facts">${rij('Wanneer', esc(lang(e.start, e.eind)))}${rij('Tijden', tijden)}${rij('Waar', esc([e.locatie, e.adres || e.plaats].filter(Boolean).join(', ')))}${rij('Entree', entreeTekst(e))}${rij('Standhouders', e.standhouders ? esc(e.standhouders) : '')}${rij('Reeks', e.reeks ? esc(e.reeks) : '')}
            </dl>
            ${e.status === 'onder voorbehoud' ? '<p class="beurs-let-op">Deze datum komt uit een agenda-overzicht en is nog niet bevestigd bij de organisator. Check voor je afreist.</p>' : ''}
            <div class="beurs-foot">
              <button type="button" class="ics-btn beurs-ics">Zet in je agenda</button>
              ${links.join('\n              ')}
            </div>
            <p class="beurs-checked">Gecontroleerd op ${esc(lang(e.gecontroleerd).replace(/^[a-z]+dag /, ''))}${e.bron ? ` &middot; <a href="${esc(e.bron)}" target="_blank" rel="noopener nofollow">bron</a>` : ''}</p>
          </div>
        </div>
      </article>`;
}

function jsonld(lijst) {
  const items = lijst.map((e, i) => {
    const ev = {
      '@type': 'Event',
      name: `${e.naam}, Pokemon beurs in ${e.plaats}`,
      startDate: e.start,
      endDate: e.eind || e.start,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      description: e.omschrijving || '',
      image: `${SITE}/og-image.png`,
      url: PAGE_URL,
      location: {
        '@type': 'Place',
        name: e.locatie || e.plaats,
        address: {
          '@type': 'PostalAddress',
          streetAddress: e.adres || undefined,
          addressLocality: e.plaats,
          addressRegion: e.provincie || undefined,
          addressCountry: 'NL'
        }
      },
      organizer: { '@type': 'Organization', name: e.organisator || e.naam, url: e.site || undefined }
    };
    const prijs = e.entree && e.entree.normaal && /^\d+,\d{2}$/.test(e.entree.normaal) ? e.entree.normaal.replace(',', '.') : null;
    if (prijs) {
      ev.offers = {
        '@type': 'Offer',
        price: prijs,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: e.tickets || e.site || PAGE_URL,
        validFrom: e.gecontroleerd
      };
    }
    return { '@type': 'ListItem', position: i + 1, item: ev };
  });

  const doc = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pokemon beurzen in Nederland',
    description: 'Agenda met aankomende Pokemon- en TCG-beurzen in Nederland.',
    itemListElement: items
  };
  return `  <script type="application/ld+json">\n${JSON.stringify(doc, null, 2).replace(/^/gm, '  ')}\n  <\/script>`;
}

function samenvatting(lijst, vandaag) {
  if (!lijst.length) {
    return 'Er staan op dit moment geen bevestigde Pokemon-beurzen in de agenda. Zodra de eerstvolgende datums bekend zijn, staan ze hieronder.';
  }
  const eerst = lijst[0];
  const dagen = Math.round((datum(eerst.start) - vandaag) / 864e5);
  const wanneer = dagen <= 0 ? 'vandaag' : dagen === 1 ? 'morgen' : `over ${dagen} dagen`;
  const andere = new Set(lijst.slice(1).map((e) => e.id)).size;
  const steden = [...new Set(lijst.map((e) => e.plaats))];
  const stedenTekst = steden.length > 3 ? `${steden.slice(0, 3).join(', ')} en nog ${steden.length - 3} andere plaatsen` : steden.join(', ');
  return `De eerstvolgende Pokemon-beurs is <strong>${esc(eerst.naam)}</strong> in <strong>${esc(eerst.plaats)}</strong> op <strong>${esc(lang(eerst.start, eerst.eind))}</strong>, dus ${wanneer}. Daarna staan er nog <strong>${andere} beurzen</strong> op de kalender, in ${esc(stedenTekst)}. Hieronder staan ze allemaal met datum, locatie, entree en een aftelklok naar de eerste.`;
}

function vervang(html, naam, blok) {
  const start = `<!-- ${naam}:START (gegenereerd door tools/build-beurzen.mjs, niet met de hand aanpassen) -->`;
  const eind = `<!-- ${naam}:END -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(eind);
  if (i === -1 || j === -1) throw new Error(`Markers voor ${naam} niet gevonden in beurzen/index.html`);
  return html.slice(0, i + start.length) + '\n' + blok + '\n  ' + html.slice(j);
}

const data = JSON.parse(await readFile(DATA, 'utf8'));
const nu = new Date();
const vandaag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());
const lijst = edities(data.beurzen || [], vandaag);
const provincies = [...new Set(lijst.map((e) => e.provincie).filter(Boolean))].sort();

let html = await readFile(PAGINA, 'utf8');
html = vervang(html, 'BEURZEN-SAMENVATTING', `    <p id="abAnswer">${samenvatting(lijst, vandaag)}</p>`);
html = vervang(
  html,
  'BEURZEN-FILTER',
  provincies.map((p) => `          <option value="${esc(p)}">${esc(p)}</option>`).join('\n')
);
html = vervang(html, 'BEURZEN-LIJST', lijst.map(kaart).join('\n'));
html = vervang(html, 'BEURZEN-JSONLD', jsonld(lijst));
html = vervang(
  html,
  'BEURZEN-BIJGEWERKT',
  `      <span>Laatst bijgewerkt: <time datetime="${esc(data.laatst_bijgewerkt)}">${esc(lang(data.laatst_bijgewerkt).replace(/^[a-z]+dag /, ''))}</time></span>`
);

console.log(`${lijst.length} aankomende edities van ${new Set(lijst.map((e) => e.id)).size} beurzen, in ${provincies.length} provincies.`);
for (const e of lijst) console.log(`  ${e.start}  ${e.naam} (${e.plaats})${e.status === 'onder voorbehoud' ? '  [onder voorbehoud]' : ''}`);

if (DRY) {
  console.log('\n--dry-run: beurzen/index.html is niet aangepast.');
} else {
  await writeFile(PAGINA, html, 'utf8');
  console.log('\nbeurzen/index.html bijgewerkt.');
}
