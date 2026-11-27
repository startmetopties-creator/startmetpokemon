// Nieuwsbrief-dashboard: startmetpokemon.nl/api/stats
// Live uit D1, aangevuld met afleverstatus uit Resend (5 min gecachet).
// Toegang met STATS_TOKEN: eerste keer /api/stats?k=<token>, daarna een cookie (1 jaar).
// Toont alleen tellingen en pagina's, geen e-mailadressen.
// Periodekeuze: ?p=7 | 30 | 90 | all (standaard 30).

const TZ = 'Europe/Amsterdam';
const COOKIE = 'smp_stats';
const RESEND_LIMIET = 1000; // gratis marketingplan Resend
const MIJLPALEN = [250, 500, 750, 1000, 2500, 5000];

export async function stats(request, env, url) {
  if (!env.STATS_TOKEN) return tekst('Dashboard staat uit: STATS_TOKEN ontbreekt in Cloudflare.', 503);
  const verwacht = await sha256(env.STATS_TOKEN);

  const k = url.searchParams.get('k');
  if (k) {
    if (!gelijk(await sha256(k), verwacht)) return tekst('Onjuiste sleutel.', 403);
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/api/stats',
        'Set-Cookie': `${COOKIE}=${verwacht}; Path=/api/stats; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`,
        'Cache-Control': 'no-store',
      },
    });
  }
  const cookie = (request.headers.get('Cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!cookie || !gelijk(cookie.slice(COOKIE.length + 1), verwacht)) return tekst('Geen toegang.', 403);

  const p = ['7', '30', '90', 'all'].includes(url.searchParams.get('p')) ? url.searchParams.get('p') : '30';

  const [{ results }, resendData] = await Promise.all([
    env.DB.prepare('SELECT status, bron, subscribed_at, unsubscribed_at, source, welcome, land, apparaat FROM subscribers').all(),
    resendGegevens(env),
  ]);
  return html(render(results || [], p, resendData));
}

/* ------------------------------------------------------------------ */
/* Datum-hulpjes (alles in Nederlandse tijd)                            */
/* ------------------------------------------------------------------ */

const fmtDag = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
const fmtDelen = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', hour: '2-digit', hour12: false });
const dag = (iso) => (iso ? fmtDag.format(new Date(iso)) : null);
const plusDagen = (d, n) => {
  const x = new Date(d + 'T12:00:00Z');
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const maandag = (d) => plusDagen(d, -((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7));
const verschilDagen = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5);
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const kort = (d) => `${Number(d.slice(8, 10))} ${MAANDEN[Number(d.slice(5, 7)) - 1]}`;
const lang = (d) => `${kort(d)} ${d.slice(0, 4)}`;
const tijd = (iso) => new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const WEEKDAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const WEEKDAGEN_LANG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const WD_EN = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
function wdUur(iso) {
  const delen = Object.fromEntries(fmtDelen.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return [WD_EN[delen.weekday], Number(delen.hour) % 24];
}
const nl = (n) => new Intl.NumberFormat('nl-NL').format(n);
const komma = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const pct = (a, b) => (b ? `${komma((a / b) * 100)}%` : '-');

/* ------------------------------------------------------------------ */
/* Bronnen indelen                                                      */
/* ------------------------------------------------------------------ */

const CATS = [
  ['/beurzen', 'Beurzen'],
  ['/kopen/release-kalender', 'Release-kalender'],
  ['/kopen/pokemon-adventskalender', 'Cadeau en advent'],
  ['/kopen/pokemon-kaarten-cadeau', 'Cadeau en advent'],
  ['/kopen', 'Kopen'],
  ['/grading', 'Grading'],
  ['/investeren', 'Investeren'],
  ['/sets', 'Sets'],
  ['/waarde', 'Waarde'],
  ['/bewaren', 'Bewaren'],
  ['/nieuws', 'Nieuws'],
  ['/module-', 'Cursus'],
];

function indeling(bron) {
  const b = String(bron || '').trim();
  const [padRuw, blok = ''] = b.split('#');
  const pad = padRuw.replace(/\/$/, '') || '/';
  if (!b) return { cat: 'Onbekend (vóór okt 2026)', pagina: '(geen bron)', blok: '' };
  if (b.startsWith('setlijst-')) return { cat: 'Setlijsten', pagina: 'Setlijst: ' + setNaam(b), blok: 'afvinklijst' };
  if (b === 'checklist-grading') return { cat: 'Grading-checklist', pagina: 'Grading-checklist', blok: 'checklist' };
  if (b === '404') return { cat: '404-pagina', pagina: '404-pagina', blok: '' };
  if (pad === '/') return { cat: 'Homepage', pagina: 'Homepage', blok };
  const c = CATS.find(([pre]) => pad.startsWith(pre));
  return { cat: c ? c[1] : 'Overig', pagina: pad, blok };
}
function setNaam(b) {
  return b.replace(/^setlijst-/, '').split('-').map((w) => (w === 'pokemon' ? 'Pokémon' : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}
let regioNamen = null;
try { regioNamen = new Intl.DisplayNames(['nl'], { type: 'region' }); } catch {}
const LANDEN = { NL: 'Nederland', BE: 'België', DE: 'Duitsland', FR: 'Frankrijk', GB: 'Verenigd Koninkrijk', US: 'Verenigde Staten', LU: 'Luxemburg' };
function landNaam(c) {
  try { return (regioNamen && regioNamen.of(c)) || LANDEN[c] || c; } catch { return LANDEN[c] || c; }
}
const VARIANT = { plan30: '30-dagen plan', afvinklijst: 'Afvinklijst', beurzen: 'Beurzen', releases: 'Releases', mailerlite: 'Nog via MailerLite' };
const BLOKNAMEN = {
  'aanmelden-boven': 'Blok bovenaan (compact)',
  community: 'Homepage-blok',
  signup: 'Blok onderaan',
  reminder: 'Release-reminder',
  'release-alert': 'Release-alert',
  hoofdinhoud: 'Blok in de tekst',
};

/* ------------------------------------------------------------------ */
/* Resend: afleverstatus en verstuurde nieuwsbrieven (5 min cache)      */
/* ------------------------------------------------------------------ */

async function resendGegevens(env) {
  if (!env.RESEND_API_KEY) return null;
  const cache = caches.default;
  const sleutel = new Request('https://startmetpokemon.nl/__cache/stats-resend-v1');
  try {
    const hit = await cache.match(sleutel);
    if (hit) return await hit.json();
  } catch {}

  const get = async (pad) => {
    const r = await fetch('https://api.resend.com' + pad, { headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY } });
    if (!r.ok) throw new Error('resend ' + r.status);
    return r.json();
  };
  const uit = { emails: [], broadcasts: [], fout: null };
  try {
    let after = '';
    const gezien = new Set();
    for (let i = 0; i < 5; i++) {
      const res = await get('/emails?limit=100' + (after ? '&after=' + encodeURIComponent(after) : ''));
      const data = res.data || [];
      const nieuw = data.filter((e) => !gezien.has(e.id));
      if (!nieuw.length) break;
      for (const e of nieuw) {
        gezien.add(e.id);
        uit.emails.push({
          subject: e.subject || '',
          last_event: e.last_event || 'onbekend',
          created_at: e.created_at,
          test: [].concat(e.to || []).some((t) => /^startmetopties\+/i.test(String(t))),
        });
      }
      if (!res.has_more) break;
      after = data[data.length - 1].id;
    }
  } catch {
    uit.fout = 'De afleverstatus uit Resend kon nu niet worden geladen.';
  }
  try {
    const b = await get('/broadcasts');
    uit.broadcasts = (b.data || []).map((x) => ({ name: x.name || '(zonder naam)', status: x.status, sent_at: x.sent_at }));
  } catch {}

  try {
    await cache.put(sleutel, new Response(JSON.stringify(uit), { headers: { 'Cache-Control': 'max-age=300', 'Content-Type': 'application/json' } }));
  } catch {}
  return uit;
}

/* ------------------------------------------------------------------ */
/* Berekenen                                                            */
/* ------------------------------------------------------------------ */

function render(alle, p, resend) {
  const vandaag = dag(new Date().toISOString());
  const rows = alle.filter((r) => !String(r.bron || '').startsWith('livetest'));
  const metDatum = rows.filter((r) => r.subscribed_at).map((r) => ({ ...r, d: dag(r.subscribed_at), ud: r.unsubscribed_at ? dag(r.unsubscribed_at) : null }));
  const eerste = metDatum.map((r) => r.d).sort()[0] || vandaag;
  const lengte = p === 'all' ? verschilDagen(eerste, vandaag) + 1 : Number(p);
  const vanaf = plusDagen(vandaag, -(lengte - 1));
  const vorigeVanaf = plusDagen(vanaf, -lengte);
  const inPeriode = (d) => !!d && d >= vanaf && d <= vandaag;
  const inVorige = (d) => !!d && d >= vorigeVanaf && d < vanaf;
  const periodeNaam = p === 'all' ? 'sinds de start' : `laatste ${p} dagen`;

  const actief = rows.filter((r) => r.status === 'active').length;
  const afgemeld = rows.filter((r) => r.status === 'unsubscribed').length;
  const bounced = rows.filter((r) => r.status === 'bounced').length;

  const nieuw = metDatum.filter((r) => inPeriode(r.d));
  const nieuwVorige = metDatum.filter((r) => inVorige(r.d)).length;
  const weg = metDatum.filter((r) => r.status !== 'active' && inPeriode(r.ud)).length;
  const netto = nieuw.length - weg;
  const perDag = nieuw.length / lengte;
  const vandaagN = metDatum.filter((r) => r.d === vandaag).length;
  const gisterN = metDatum.filter((r) => r.d === plusDagen(vandaag, -1)).length;

  // Netto actieve subs per dag, over de hele geschiedenis.
  const delta = new Map();
  for (const r of metDatum) {
    delta.set(r.d, (delta.get(r.d) || 0) + 1);
    if (r.status !== 'active' && r.ud) delta.set(r.ud, (delta.get(r.ud) || 0) - 1);
  }
  const lijnAlles = [];
  let tot = 0;
  for (let d = eerste; d <= vandaag; d = plusDagen(d, 1)) {
    tot += delta.get(d) || 0;
    lijnAlles.push({ x: d, y: tot });
  }
  const lijn = lijnAlles.filter((pt) => pt.x >= vanaf);

  // Aanmeldingen per dag (7/30) of per week (90/alles).
  const perWeek = p === 'all' || p === '90';
  const staven = [];
  if (perWeek) {
    for (let w = maandag(vanaf); w <= vandaag; w = plusDagen(w, 7)) staven.push({ x: w, y: 0, label: `Week van ${kort(w)}` });
  } else {
    for (let d = vanaf; d <= vandaag; d = plusDagen(d, 1)) staven.push({ x: d, y: 0, label: `${WEEKDAGEN[(new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7]} ${kort(d)}` });
  }
  const stIdx = new Map(staven.map((s, i) => [s.x, i]));
  for (const r of nieuw) {
    const i = stIdx.get(perWeek ? maandag(r.d) : r.d);
    if (i !== undefined) staven[i].y++;
  }

  // Records over alle tijd.
  const perDagAlles = new Map();
  const perWeekAlles = new Map();
  for (const r of metDatum) {
    perDagAlles.set(r.d, (perDagAlles.get(r.d) || 0) + 1);
    perWeekAlles.set(maandag(r.d), (perWeekAlles.get(maandag(r.d)) || 0) + 1);
  }
  const recordDag = [...perDagAlles.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0] || [vandaag, 0];
  const recordWeek = [...perWeekAlles.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0] || [vandaag, 0];

  // Prognose op het netto tempo van de laatste 30 dagen.
  const grens30 = plusDagen(vandaag, -30);
  const n30 = metDatum.filter((r) => r.d > grens30).length;
  const w30 = metDatum.filter((r) => r.status !== 'active' && r.ud && r.ud > grens30).length;
  const tempo = (n30 - w30) / 30;
  const volgende = MIJLPALEN.filter((m) => m > actief);
  const gekozen = volgende.slice(0, 2);
  if (actief < RESEND_LIMIET && !gekozen.includes(RESEND_LIMIET)) gekozen.push(RESEND_LIMIET);
  else if (volgende[2]) gekozen.push(volgende[2]);
  const mijlpalen = gekozen.map((m) => {
    const dagen = tempo > 0 ? Math.ceil((m - actief) / tempo) : null;
    return { m, dagen, datum: dagen ? plusDagen(vandaag, dagen) : null };
  });

  // Heatmap weekdag x uur.
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const r of nieuw) {
    const [wd, uur] = wdUur(r.subscribed_at);
    if (wd !== undefined) heat[wd][uur]++;
  }

  // Bronnen groeperen.
  const groepeer = (sleutel) => {
    const m = new Map();
    for (const r of metDatum) {
      const k = sleutel(indeling(r.bron));
      if (!k) continue;
      const g = m.get(k) || { naam: k, periode: 0, vorige: 0, totaal: 0, actief: 0, cat: indeling(r.bron).cat };
      g.totaal++;
      if (r.status === 'active') g.actief++;
      if (inPeriode(r.d)) g.periode++;
      if (inVorige(r.d)) g.vorige++;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.periode - a.periode || b.totaal - a.totaal);
  };
  const categorieen = groepeer((i) => i.cat);
  const paginas = groepeer((i) => (i.cat === 'Setlijsten' ? null : i.pagina));
  const sets = groepeer((i) => (i.cat === 'Setlijsten' ? i.pagina.replace('Setlijst: ', '') : null));
  const blokken = groepeer((i) => {
    if (i.cat === 'Setlijsten') return 'Afvinklijst-blok (setpagina)';
    if (i.cat === 'Grading-checklist') return 'Checklist-blok (grading)';
    if (i.cat.startsWith('Onbekend') || i.cat === '404-pagina') return null;
    return BLOKNAMEN[i.blok] || (i.blok ? `#${i.blok}` : 'Blok onderaan');
  });

  // Land en apparaat (gemeten sinds 27 nov 2026).
  const gemeten = nieuw.filter((r) => r.land || r.apparaat);
  const landen = new Map();
  const apparaten = { mobiel: 0, desktop: 0, tablet: 0 };
  for (const r of gemeten) {
    if (r.land) landen.set(r.land, (landen.get(r.land) || 0) + 1);
    if (r.apparaat && r.apparaat in apparaten) apparaten[r.apparaat]++;
  }
  const landLijst = [...landen.entries()].map(([c, n]) => ({ naam: landNaam(c), periode: n })).sort((a, b) => b.periode - a.periode);

  // Welkomstmails in de periode.
  const varianten = new Map();
  for (const r of nieuw) if (r.welcome) varianten.set(r.welcome, (varianten.get(r.welcome) || 0) + 1);

  // Lijstgezondheid.
  const afmelders = metDatum.filter((r) => r.status === 'unsubscribed' && r.ud);
  const gemDagenTotAfmelden = afmelders.length ? Math.round(afmelders.reduce((s, r) => s + Math.max(0, verschilDagen(r.d, r.ud)), 0) / afmelders.length) : null;
  const vanML = metDatum.filter((r) => r.source === 'mailerlite');
  const vanSite = metDatum.filter((r) => r.source === 'site');

  // Afleverstatus uit Resend in de periode.
  let mailStatus = null;
  if (resend && resend.emails.length) {
    const sinds = new Date(vanaf + 'T00:00:00Z').getTime();
    const binnen = resend.emails.filter((e) => !e.test && new Date(e.created_at).getTime() >= sinds);
    const telling = {};
    for (const e of binnen) telling[e.last_event] = (telling[e.last_event] || 0) + 1;
    mailStatus = { totaal: binnen.length, telling };
  }

  const laatste = [...metDatum].sort((a, b) => (a.subscribed_at < b.subscribed_at ? 1 : -1)).slice(0, 20);
  const bijgewerkt = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  const pill = (v, t) => `<a href="/api/stats?p=${v}" class="pill${v === p ? ' aan' : ''}">${t}</a>`;
  const vgl = (nu, toen) => {
    if (p === 'all' || !toen) return '';
    const d = nu - toen;
    return ` <span class="${d >= 0 ? 'plus' : 'min'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(Math.round((d / toen) * 100))}%</span>`;
  };

  /* ---------------------------------------------------------------- */
  /* Pagina                                                            */
  /* ---------------------------------------------------------------- */

  return `
<header class="kop">
  <div>
    <p class="eyebrow">Start Met Pokémon</p>
    <h1>Nieuwsbrief</h1>
    <p class="meta">Live uit je eigen database · ${esc(bijgewerkt)}</p>
  </div>
  <nav class="pills" aria-label="Periode">${pill('7', '7 dagen')}${pill('30', '30 dagen')}${pill('90', '90 dagen')}${pill('all', 'Alles')}</nav>
</header>

<section class="tegels">
  ${tegel('Actieve subs', nl(actief), `${netto >= 0 ? '+' : ''}${nl(netto)} netto, ${periodeNaam}`, true)}
  ${tegel('Nieuw', nl(nieuw.length), `${periodeNaam}${vgl(nieuw.length, nieuwVorige)}`)}
  ${tegel('Vandaag', nl(vandaagN), `gisteren ${nl(gisterN)}`)}
  ${tegel('Gemiddeld per dag', komma(perDag), periodeNaam)}
  ${tegel('Afgemeld', nl(afgemeld), `${pct(afgemeld, rows.length)} van alle aanmeldingen`)}
  ${tegel('Bounced', nl(bounced), `${pct(bounced, rows.length)}, ongeldige adressen`)}
</section>

<section class="kaart">
  <div class="kaartkop"><h2>Op weg naar de volgende mijlpaal</h2><p class="sub">Prognose op het netto tempo van de laatste 30 dagen: ${komma(tempo)} per dag</p></div>
  <div class="mijlpalen">
    ${mijlpalen.map((m) => `
    <div class="mijlpaal">
      <div class="mtop"><strong>${nl(m.m)}${m.m === RESEND_LIMIET ? ' <span class="tag">limiet Resend gratis</span>' : ''}</strong><span class="klein">${nl(actief)} / ${nl(m.m)}</span></div>
      <div class="balk"><div style="width:${Math.min(100, (actief / m.m) * 100).toFixed(1)}%"></div></div>
      <div class="klein">${m.datum ? `nog ${nl(m.m - actief)}, rond <strong class="wit">${esc(lang(m.datum))}</strong> (over ${nl(m.dagen)} dagen)` : 'geen netto groei in de laatste 30 dagen'}</div>
    </div>`).join('')}
  </div>
  <div class="records">
    <div><span class="klein">Beste dag ooit</span><strong>${nl(recordDag[1])}</strong><span class="klein">${esc(lang(recordDag[0]))}</span></div>
    <div><span class="klein">Beste week ooit</span><strong>${nl(recordWeek[1])}</strong><span class="klein">week van ${esc(lang(recordWeek[0]))}</span></div>
    <div><span class="klein">Eerste aanmelding</span><strong>${esc(kort(eerste))}</strong><span class="klein">${nl(verschilDagen(eerste, vandaag))} dagen geleden</span></div>
    <div><span class="klein">Via de nieuwe koppeling</span><strong>${nl(vanSite.length)}</strong><span class="klein">${nl(vanML.length)} overgezet uit MailerLite</span></div>
  </div>
</section>

<section class="kaart">
  <div class="kaartkop"><h2>Groei van de lijst</h2><p class="sub">Actieve subs per dag, ${periodeNaam}</p></div>
  ${lijnGrafiek(lijn)}
</section>

<section class="kaart">
  <div class="kaartkop"><h2>Aanmeldingen ${perWeek ? 'per week' : 'per dag'}</h2><p class="sub">${periodeNaam}${perWeek ? ', week begint op maandag' : ''}, stippellijn is het gemiddelde</p></div>
  ${staafGrafiek(staven)}
</section>

<section class="twee">
  <div class="kaart">
    <div class="kaartkop"><h2>Uit welk deel van de site</h2><p class="sub">Aanmeldingen per onderdeel, ${periodeNaam}</p></div>
    ${horizontaal(categorieen.filter((c) => c.periode > 0))}
  </div>
  <div class="kaart">
    <div class="kaartkop"><h2>Wanneer mensen zich aanmelden</h2><p class="sub">Per weekdag en uur (Nederlandse tijd), ${periodeNaam}</p></div>
    ${heatmap(heat)}
  </div>
</section>

<section class="kaart">
  <div class="kaartkop"><h2>Beste pagina's</h2><p class="sub">Gesorteerd op ${periodeNaam}. "Nog actief" is het deel dat nog ingeschreven staat.</p></div>
  <div class="tabelwrap"><table>
    <thead><tr><th>Pagina</th><th>Onderdeel</th><th class="r">${p === 'all' ? 'Aantal' : esc(p + ' dagen')}</th>${p === 'all' ? '' : '<th class="r">Periode ervoor</th>'}<th class="r">Totaal</th><th class="r">Nog actief</th></tr></thead>
    <tbody>
      ${paginas.slice(0, 20).map((g) => `<tr><td>${esc(g.naam)}</td><td class="klein">${esc(g.cat)}</td><td class="r"><strong>${nl(g.periode)}</strong></td>${p === 'all' ? '' : `<td class="r klein">${nl(g.vorige)}</td>`}<td class="r">${nl(g.totaal)}</td><td class="r klein">${pct(g.actief, g.totaal)}</td></tr>`).join('')}
    </tbody>
  </table></div>
</section>

<section class="twee">
  <div class="kaart">
    <div class="kaartkop"><h2>Populairste afvinklijsten</h2><p class="sub">Aanmeldingen per set</p></div>
    <div class="tabelwrap"><table>
      <thead><tr><th>Set</th><th class="r">${p === 'all' ? 'Aantal' : esc(p + ' dagen')}</th><th class="r">Totaal</th></tr></thead>
      <tbody>${sets.slice(0, 15).map((g) => `<tr><td>${esc(g.naam)}</td><td class="r"><strong>${nl(g.periode)}</strong></td><td class="r">${nl(g.totaal)}</td></tr>`).join('') || '<tr><td colspan="3" class="klein">Nog geen setlijst-aanmeldingen.</td></tr>'}</tbody>
    </table></div>
  </div>
  <div class="kaart">
    <div class="kaartkop"><h2>Welk aanmeldblok werkt</h2><p class="sub">Op basis van waar het formulier op de pagina staat, ${periodeNaam}</p></div>
    ${horizontaal(blokken.filter((b) => b.periode > 0))}
  </div>
</section>

<section class="twee">
  <div class="kaart">
    <div class="kaartkop"><h2>Uit welk land</h2><p class="sub">${periodeNaam}, op basis van ${nl(gemeten.length)} van ${nl(nieuw.length)} aanmeldingen (gemeten sinds 27 nov 2026)</p></div>
    ${gemeten.length ? horizontaal(landLijst) : '<p class="klein">Nog geen aanmeldingen met deze gegevens in deze periode.</p>'}
  </div>
  <div class="kaart">
    <div class="kaartkop"><h2>Mobiel of desktop</h2><p class="sub">${periodeNaam}, zelfde aanmeldingen als hiernaast</p></div>
    ${gemeten.length ? `${stapelBalk([
      { naam: 'Mobiel', n: apparaten.mobiel, kl: 'k5' },
      { naam: 'Desktop', n: apparaten.desktop, kl: 'k4' },
      { naam: 'Tablet', n: apparaten.tablet, kl: 'k6' },
    ])}
    <div class="feiten">
      <div><span class="klein">Mobiel</span><strong>${pct(apparaten.mobiel, gemeten.length)}</strong></div>
      <div><span class="klein">Desktop</span><strong>${pct(apparaten.desktop, gemeten.length)}</strong></div>
      <div><span class="klein">Tablet</span><strong>${pct(apparaten.tablet, gemeten.length)}</strong></div>
    </div>` : '<p class="klein">Nog geen aanmeldingen met deze gegevens in deze periode.</p>'}
  </div>
</section>

<section class="twee">
  <div class="kaart">
    <div class="kaartkop"><h2>Welkomstmails</h2><p class="sub">Welke welkomstmail mensen kregen, ${periodeNaam}</p></div>
    ${horizontaal([...varianten.entries()].map(([v, n]) => ({ naam: VARIANT[v] || v, periode: n })).sort((a, b) => b.periode - a.periode))}
    <h3>Aflevering volgens Resend</h3>
    ${mailStatus && mailStatus.totaal ? afleverBlok(mailStatus) : `<p class="klein">${esc((resend && resend.fout) || 'Nog geen verstuurde mails in deze periode.')}</p>`}
  </div>
  <div class="kaart">
    <div class="kaartkop"><h2>Gezondheid van de lijst</h2><p class="sub">Over alle aanmeldingen</p></div>
    ${stapelBalk([
      { naam: 'Actief', n: actief, kl: 'k1' },
      { naam: 'Afgemeld', n: afgemeld, kl: 'k2' },
      { naam: 'Bounced', n: bounced, kl: 'k3' },
    ])}
    <div class="feiten">
      <div><span class="klein">Afmeldingen, ${esc(periodeNaam)}</span><strong>${nl(weg)}</strong></div>
      <div><span class="klein">Gem. dagen tot afmelden</span><strong>${gemDagenTotAfmelden === null ? '-' : nl(gemDagenTotAfmelden)}</strong></div>
      <div><span class="klein">MailerLite-lijst nog actief</span><strong>${pct(vanML.filter((r) => r.status === 'active').length, vanML.length)}</strong></div>
    </div>
    <h3>Verstuurde nieuwsbrieven</h3>
    ${resend && resend.broadcasts.length
      ? `<table><tbody>${resend.broadcasts.slice(0, 8).map((b) => `<tr><td>${esc(b.name)}</td><td class="r klein">${b.sent_at ? esc(lang(dag(b.sent_at))) : esc(b.status || '')}</td></tr>`).join('')}</tbody></table>`
      : '<p class="klein">Nog geen nieuwsbrieven verstuurd via Resend.</p>'}
  </div>
</section>

<section class="kaart">
  <div class="kaartkop"><h2>Laatste aanmeldingen</h2><p class="sub">De 20 nieuwste, zonder e-mailadressen</p></div>
  <div class="tabelwrap"><table>
    <thead><tr><th>Wanneer</th><th>Onderdeel</th><th>Pagina</th><th>Welkomstmail</th><th class="r">Status</th></tr></thead>
    <tbody>
      ${laatste.map((r) => {
        const i = indeling(r.bron);
        const st = r.status === 'active' ? '<span class="ok">actief</span>' : r.status === 'bounced' ? '<span class="min">bounced</span>' : '<span class="min">afgemeld</span>';
        return `<tr><td class="d">${esc(kort(r.d))} <span class="klein">${esc(tijd(r.subscribed_at))}</span></td><td>${esc(i.cat)}</td><td class="klein">${esc(i.pagina)}</td><td class="klein">${esc(VARIANT[r.welcome] || r.welcome || '-')}</td><td class="r">${st}</td></tr>`;
      }).join('')}
    </tbody>
  </table></div>
</section>

<footer>Bron: eigen database (Cloudflare D1). Afleverstatus en nieuwsbrieven uit Resend, maximaal 5 minuten oud. Opens en kliks verschijnen pas als tracking in Resend aan staat. Testaanmeldingen tellen niet mee.</footer>`;
}

/* ------------------------------------------------------------------ */
/* Bouwstenen                                                           */
/* ------------------------------------------------------------------ */

function tegel(label, waarde, sub, hoofd = false) {
  return `<div class="tegel${hoofd ? ' hoofd' : ''}"><div class="label">${esc(label)}</div><div class="waarde">${esc(waarde)}</div><div class="klein">${sub}</div></div>`;
}

function horizontaal(items) {
  if (!items.length) return '<p class="klein">Geen aanmeldingen in deze periode.</p>';
  const max = Math.max(...items.map((i) => i.periode));
  const som = items.reduce((s, i) => s + i.periode, 0);
  return `<div class="hbars">${items.slice(0, 14).map((i) => `
    <div class="hbar" title="${esc(i.naam)}: ${i.periode} (${pct(i.periode, som)})">
      <div class="hlabel"><span>${esc(i.naam)}</span><span class="klein">${nl(i.periode)} · ${pct(i.periode, som)}</span></div>
      <div class="hspoor"><div style="width:${((i.periode / max) * 100).toFixed(1)}%"></div></div>
    </div>`).join('')}</div>`;
}

function stapelBalk(delen) {
  const som = delen.reduce((s, d) => s + d.n, 0) || 1;
  return `<div class="stapel">${delen.filter((d) => d.n > 0).map((d) => `<div class="${d.kl}" style="width:${((d.n / som) * 100).toFixed(2)}%" title="${esc(d.naam)}: ${d.n}"></div>`).join('')}</div>
  <div class="legenda">${delen.map((d) => `<span><i class="${d.kl}"></i>${esc(d.naam)} ${nl(d.n)} (${pct(d.n, som)})</span>`).join('')}</div>`;
}

function afleverBlok(s) {
  const t = s.telling;
  const delen = [
    { naam: 'Afgeleverd', n: (t.delivered || 0) + (t.opened || 0) + (t.clicked || 0), kl: 'k1' },
    { naam: 'Onderweg', n: (t.sent || 0) + (t.delivery_delayed || 0) + (t.queued || 0) + (t.scheduled || 0), kl: 'k4' },
    { naam: 'Bounced', n: t.bounced || 0, kl: 'k3' },
    { naam: 'Spamklacht', n: t.complained || 0, kl: 'k2' },
  ];
  return `<p class="klein">${nl(s.totaal)} mails verstuurd in deze periode, ${pct(delen[0].n, s.totaal)} afgeleverd</p>${stapelBalk(delen)}`;
}

function heatmap(heat) {
  const totaal = heat.flat().reduce((a, b) => a + b, 0);
  if (!totaal) return '<p class="klein">Geen aanmeldingen in deze periode.</p>';
  const max = Math.max(1, ...heat.flat());
  const W = 900, L = 52, T = 30, cw = (W - L - 4) / 24, ch = 38, H = T + ch * 7 + 4;
  let s = '';
  for (let u = 0; u < 24; u += 3) s += `<text x="${(L + u * cw + cw / 2).toFixed(1)}" y="16" class="hl" text-anchor="middle">${String(u).padStart(2, '0')}</text>`;
  heat.forEach((rij, wd) => {
    s += `<text x="${L - 10}" y="${T + wd * ch + ch / 2 + 7}" class="hl" text-anchor="end">${WEEKDAGEN[wd]}</text>`;
    rij.forEach((n, u) => {
      const a = n ? 0.18 + 0.82 * (n / max) : 0.05;
      s += `<rect x="${(L + u * cw + 1).toFixed(1)}" y="${T + wd * ch + 1}" width="${(cw - 2).toFixed(1)}" height="${ch - 2}" rx="3" fill="#FACC15" fill-opacity="${a.toFixed(2)}"><title>${WEEKDAGEN_LANG[wd]} ${String(u).padStart(2, '0')}:00-${String((u + 1) % 24).padStart(2, '0')}:00: ${n} aanmelding${n === 1 ? '' : 'en'}</title></rect>`;
    });
  });
  const perDag = heat.map((r) => r.reduce((a, b) => a + b, 0));
  const perUur = Array(24).fill(0);
  heat.forEach((r) => r.forEach((n, u) => (perUur[u] += n)));
  const besteDag = perDag.indexOf(Math.max(...perDag));
  const besteUur = perUur.indexOf(Math.max(...perUur));
  const avond = perUur.slice(18, 24).reduce((a, b) => a + b, 0);
  const weekend = perDag[5] + perDag[6];
  return `<svg viewBox="0 0 ${W} ${H}" class="grafiek" role="img" aria-label="Aanmeldingen per weekdag en uur">${s}</svg>
  <div class="feiten">
    <div><span class="klein">Drukste dag</span><strong>${WEEKDAGEN_LANG[besteDag]}</strong></div>
    <div><span class="klein">Drukste uur</span><strong>${String(besteUur).padStart(2, '0')}:00</strong></div>
    <div><span class="klein">'s Avonds (18-24 uur)</span><strong>${pct(avond, totaal)}</strong></div>
    <div><span class="klein">In het weekend</span><strong>${pct(weekend, totaal)}</strong></div>
  </div>`;
}

function lijnGrafiek(punten) {
  const W = 900, H = 300, L = 64, R = 14, T = 28, B = 44;
  if (punten.length < 2) return '<p class="klein">Nog te weinig data.</p>';
  const ys = punten.map((pt) => pt.y);
  const minRuw = Math.min(...ys), maxRuw = Math.max(...ys);
  const stap = niceStap(Math.max(4, maxRuw - Math.min(minRuw, maxRuw * 0.6)));
  const bodem = Math.max(0, Math.floor((minRuw - stap * 0.5) / stap) * stap);
  const top = Math.ceil((maxRuw + stap * 0.2) / stap) * stap;
  const x = (i) => L + (i / (punten.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - bodem) / (top - bodem || 1)) * (H - T - B);
  const pad = punten.map((pt, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pt.y).toFixed(1)}`).join('');
  const vlak = `${pad}L${x(punten.length - 1).toFixed(1)},${y(bodem)}L${x(0).toFixed(1)},${y(bodem)}Z`;
  let rooster = '';
  for (let v = bodem; v <= top; v += stap) rooster += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="rooster"/><text x="${L - 8}" y="${y(v) + 4}" class="as" text-anchor="end">${nl(v)}</text>`;
  const labels = [0, Math.floor((punten.length - 1) / 2), punten.length - 1]
    .map((i, j) => `<text x="${x(i)}" y="${H - 10}" class="as" text-anchor="${['start', 'middle', 'end'][j]}">${kort(punten[i].x)}</text>`).join('');
  const w = (W - L - R) / punten.length;
  const hover = punten.map((pt, i) => `<rect x="${(x(i) - w / 2).toFixed(1)}" y="${T}" width="${w.toFixed(2)}" height="${H - T - B}" class="hit"><title>${kort(pt.x)}: ${pt.y} actief</title></rect>`).join('');
  const laatste = punten[punten.length - 1];
  const verschil = laatste.y - punten[0].y;
  return `<svg viewBox="0 0 ${W} ${H}" class="grafiek" role="img" aria-label="Groei van de lijst">${rooster}<path d="${vlak}" class="vlak"/><path d="${pad}" class="lijn"/><circle cx="${x(punten.length - 1)}" cy="${y(laatste.y)}" r="4.5" class="punt"/><text x="${x(punten.length - 1) - 10}" y="${y(laatste.y) - 10}" class="waardelabel" text-anchor="end">${nl(laatste.y)} (${verschil >= 0 ? '+' : ''}${nl(verschil)})</text>${labels}${hover}</svg>`;
}

function staafGrafiek(punten) {
  const W = 900, H = 260, L = 64, R = 14, T = 30, B = 44;
  const max = Math.max(5, ...punten.map((pt) => pt.y));
  const stap = niceStap(max);
  const top = Math.ceil(max / stap) * stap;
  const bw = (W - L - R) / punten.length;
  const y = (v) => T + (1 - v / top) * (H - T - B);
  const gem = punten.reduce((s, pt) => s + pt.y, 0) / (punten.length || 1);
  let rooster = '';
  for (let v = 0; v <= top; v += stap) rooster += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="rooster"/><text x="${L - 8}" y="${y(v) + 4}" class="as" text-anchor="end">${v}</text>`;
  const elk = Math.max(1, Math.ceil(punten.length / 8));
  const toonWaarde = punten.length <= 31;
  const staven = punten.map((pt, i) => {
    const h = y(0) - y(pt.y);
    const midden = L + i * bw + bw / 2;
    const laatsteI = punten.length - 1;
    const label = (i % elk === 0 && laatsteI - i >= Math.ceil(elk * 0.6)) || i === laatsteI ? `<text x="${midden.toFixed(1)}" y="${H - 10}" class="as" text-anchor="middle">${kort(pt.x)}</text>` : '';
    return `<g><rect x="${(L + i * bw + bw * 0.15).toFixed(1)}" y="${y(pt.y).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${Math.max(h, 0).toFixed(1)}" rx="${bw > 20 ? 3 : 1.5}" class="${i === punten.length - 1 ? 'staaf nu' : 'staaf'}"><title>${esc(pt.label)}: ${pt.y} nieuw</title></rect>${toonWaarde && pt.y ? `<text x="${midden.toFixed(1)}" y="${y(pt.y) - 5}" class="waardelabel" text-anchor="middle">${pt.y}</text>` : ''}${label}</g>`;
  }).join('');
  const gemLijn = `<line x1="${L}" x2="${W - R}" y1="${y(gem)}" y2="${y(gem)}" class="gem"/><text x="${L + 6}" y="${y(gem) - 6}" class="as gemlabel" text-anchor="start">gem. ${komma(gem)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="grafiek" role="img" aria-label="Aanmeldingen">${rooster}${staven}${gemLijn}</svg>`;
}

function niceStap(max) {
  const ruw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(ruw || 1)));
  const n = ruw / mag;
  return Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag);
}

/* ------------------------------------------------------------------ */
/* HTML-omhulsel                                                        */
/* ------------------------------------------------------------------ */

function html(inhoud) {
  const page = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Nieuwsbrief-dashboard | Start Met Pokémon</title>
<style>
  :root{--bg:#0A0E17;--kaart:#111827;--rand:#1E293B;--tekst:#F1F5F9;--zacht:#94A3B8;--geel:#FACC15;--groen:#4ADE80;--rood:#F87171;--oranje:#FB923C;--blauw:#60A5FA}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--tekst);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.5}
  main{max-width:1120px;margin:0 auto;padding:32px 20px 48px}
  .kop{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
  .eyebrow{margin:0;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:var(--geel)}
  h1{font-family:Georgia,serif;font-weight:400;font-size:34px;margin:6px 0 4px}
  h2{font-size:16px;margin:0}
  h3{font-size:14px;margin:22px 0 10px;color:var(--zacht);font-weight:600}
  .meta,.sub,.klein{color:var(--zacht);font-size:13px;margin:0}
  .wit{color:var(--tekst)}
  .kaartkop{margin-bottom:14px}
  .pills{display:flex;gap:4px;background:var(--kaart);border:1px solid var(--rand);border-radius:999px;padding:4px}
  .pill{color:var(--zacht);text-decoration:none;font-size:13px;padding:6px 12px;border-radius:999px;white-space:nowrap}
  .pill:hover{color:var(--tekst)}
  .pill.aan{background:var(--geel);color:var(--bg);font-weight:700}
  .tegels{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:24px 0 12px}
  .tegel,.kaart{background:var(--kaart);border:1px solid var(--rand);border-radius:14px;padding:18px 20px}
  .tegel.hoofd{border-color:#8a7414}
  .kaart{margin-bottom:12px}
  .label{font-size:13px;color:var(--zacht)}
  .waarde{font-size:30px;font-weight:700;margin:2px 0;font-variant-numeric:tabular-nums}
  .tegel.hoofd .waarde{color:var(--geel)}
  .plus{color:var(--groen);font-weight:600}
  .min{color:var(--rood);font-weight:600}
  .ok{color:var(--groen)}
  .twee{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px;margin-bottom:12px}
  .twee .kaart{margin:0}
  .mijlpalen{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
  .mtop{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;margin-bottom:6px;gap:8px}
  .tag{font-size:11px;font-weight:600;color:var(--bg);background:var(--zacht);border-radius:999px;padding:1px 7px;margin-left:4px;vertical-align:2px}
  .balk{height:10px;background:var(--rand);border-radius:99px;overflow:hidden;margin-bottom:6px}
  .balk div{height:100%;background:var(--geel);border-radius:99px}
  .records,.feiten{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid var(--rand)}
  .records div,.feiten div{display:flex;flex-direction:column}
  .records strong,.feiten strong{font-size:22px;font-variant-numeric:tabular-nums}
  .hbars{display:flex;flex-direction:column;gap:10px}
  .hlabel{display:flex;justify-content:space-between;font-size:14px;gap:10px;margin-bottom:4px}
  .hspoor{height:8px;background:var(--rand);border-radius:99px;overflow:hidden}
  .hspoor div{height:100%;background:var(--geel);border-radius:99px}
  .stapel{display:flex;height:14px;border-radius:99px;overflow:hidden;background:var(--rand);margin:8px 0}
  .legenda{display:flex;flex-wrap:wrap;gap:12px;font-size:13px;color:var(--zacht)}
  .legenda i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
  .k5{background:var(--geel)}.k6{background:#A78BFA}.k1{background:var(--groen)}.k2{background:var(--rood)}.k3{background:var(--oranje)}.k4{background:var(--blauw)}
  .tabelwrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{text-align:left;font-weight:600;color:var(--zacht);font-size:12px;padding:6px 0;border-bottom:1px solid var(--rand);white-space:nowrap}
  td{padding:8px 0;border-bottom:1px solid var(--rand);vertical-align:top}
  td+td,th+th{padding-left:12px}
  .r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .d{white-space:nowrap}
  .grafiek{width:100%;height:auto;display:block}
  .rooster{stroke:var(--rand);stroke-width:1}
  .gem{stroke:var(--zacht);stroke-width:1;stroke-dasharray:4 4;opacity:.7}
  .as{fill:var(--zacht);font-size:12px}
  .lijn{fill:none;stroke:var(--geel);stroke-width:2.5}
  .vlak{fill:var(--geel);opacity:.10}
  .punt{fill:var(--geel)}
  .staaf{fill:#475569}
  .staaf.nu{fill:var(--geel)}
  .staaf:hover,.hit:hover{opacity:.8}
  .hit{fill:transparent}
  .waardelabel{fill:var(--tekst);font-size:11px}
  .hl{fill:var(--zacht);font-size:20px}
  .gemlabel{paint-order:stroke;stroke:var(--kaart);stroke-width:4px}
  footer{color:var(--zacht);font-size:13px;margin-top:20px}
  @media (max-width:600px){
    main{padding:24px 14px 40px}
    .tegel,.kaart{padding:14px 16px}
    .tegels{grid-template-columns:repeat(2,1fr)}
    .waarde{font-size:24px}
    .as{font-size:26px}
    .waardelabel{font-size:22px}
    .twee{grid-template-columns:1fr}
    .pills{width:100%;justify-content:space-between}
    .pill{padding:6px 9px}
  }
</style>
</head>
<body><main>${inhoud}</main></body>
</html>`;
  return new Response(page, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

function tekst(t, status) {
  return new Response(t, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function sha256(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function gelijk(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
