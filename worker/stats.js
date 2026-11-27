// Nieuwsbrief-dashboard: startmetpokemon.nl/api/stats
// Leest live uit D1. Toegang met STATS_TOKEN (secret in Cloudflare):
// eerste keer /api/stats?k=<token>, daarna onthoudt een cookie het een jaar.
// Toont alleen tellingen en pagina's, geen e-mailadressen.

const TZ = 'Europe/Amsterdam';
const COOKIE = 'smp_stats';

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

  const { results } = await env.DB.prepare(
    'SELECT status, bron, subscribed_at, unsubscribed_at, source, welcome FROM subscribers'
  ).all();
  return html(render(results || []));
}

/* ------------------------------------------------------------------ */

const dag = (iso) => (iso ? new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso)) : null);
const plusDagen = (d, n) => {
  const x = new Date(d + 'T12:00:00Z');
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const maandag = (d) => {
  const x = new Date(d + 'T12:00:00Z');
  const wd = (x.getUTCDay() + 6) % 7;
  return plusDagen(d, -wd);
};
const kort = (d) => {
  const [, m, dd] = d.split('-');
  return `${Number(dd)} ${['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][Number(m) - 1]}`;
};
const nl = (n) => new Intl.NumberFormat('nl-NL').format(n);

function bronGroep(bron) {
  const b = String(bron || '').trim();
  if (!b) return { groep: 'Onbekend (vóór okt 2026)', detail: '' };
  if (b.startsWith('setlijst-')) return { groep: 'Setlijst-downloads', detail: b.slice(9).replace(/-/g, ' ') };
  if (b === 'checklist-grading') return { groep: 'Grading-checklist', detail: '' };
  if (b === '404') return { groep: '404-pagina', detail: '' };
  if (b.startsWith('livetest')) return { groep: 'Test', detail: '' };
  const pad = b.split('#')[0].replace(/\/$/, '') || '/';
  if (pad === '/') return { groep: 'Homepage', detail: b.split('#')[1] || '' };
  return { groep: pad, detail: b.split('#')[1] || '' };
}

const VARIANT = { plan30: '30-dagen plan', afvinklijst: 'Afvinklijst', beurzen: 'Beurzen', releases: 'Releases', mailerlite: 'Via MailerLite' };

function render(rows) {
  const vandaag = dag(new Date().toISOString());
  const actief = rows.filter((r) => r.status === 'active');
  const afgemeld = rows.filter((r) => r.status === 'unsubscribed').length;
  const bounced = rows.filter((r) => r.status === 'bounced').length;

  const sinds = (n) => actief.filter((r) => dag(r.subscribed_at) > plusDagen(vandaag, -n)).length;
  const nieuw7 = sinds(7);
  const nieuw30 = sinds(30);
  const vorige30 = actief.filter((r) => {
    const d = dag(r.subscribed_at);
    return d > plusDagen(vandaag, -60) && d <= plusDagen(vandaag, -30);
  }).length;
  const groei = vorige30 ? Math.round(((nieuw30 - vorige30) / vorige30) * 100) : null;

  // Netto actieve subs per dag (aanmeldingen min afmeldingen/bounces met datum).
  const delta = new Map();
  for (const r of rows) {
    const s = dag(r.subscribed_at);
    if (s) delta.set(s, (delta.get(s) || 0) + 1);
    if (r.status !== 'active' && r.unsubscribed_at) {
      const u = dag(r.unsubscribed_at);
      delta.set(u, (delta.get(u) || 0) - 1);
    }
  }
  const eerste = [...delta.keys()].sort()[0] || vandaag;
  const lijn = [];
  let tot = 0;
  for (let d = eerste; d <= vandaag; d = plusDagen(d, 1)) {
    tot += delta.get(d) || 0;
    lijn.push({ x: d, y: tot });
  }

  // Nieuwe aanmeldingen per week, laatste 16 weken.
  const weken = [];
  const dezeWeek = maandag(vandaag);
  for (let i = 15; i >= 0; i--) weken.push({ x: plusDagen(dezeWeek, -7 * i), y: 0 });
  const weekIdx = new Map(weken.map((w, i) => [w.x, i]));
  for (const r of rows) {
    const s = dag(r.subscribed_at);
    if (!s) continue;
    const i = weekIdx.get(maandag(s));
    if (i !== undefined) weken[i].y++;
  }

  // Bronnen: alle tijd en laatste 30 dagen.
  const groepen = new Map();
  for (const r of rows) {
    const { groep, detail } = bronGroep(r.bron);
    const g = groepen.get(groep) || { groep, totaal: 0, recent: 0, details: new Map() };
    g.totaal++;
    if (dag(r.subscribed_at) > plusDagen(vandaag, -30)) g.recent++;
    if (detail) g.details.set(detail, (g.details.get(detail) || 0) + 1);
    groepen.set(groep, g);
  }
  const bronnen = [...groepen.values()].sort((a, b) => b.recent - a.recent || b.totaal - a.totaal);

  const varianten = new Map();
  for (const r of rows) {
    if (!r.welcome) continue;
    varianten.set(r.welcome, (varianten.get(r.welcome) || 0) + 1);
  }

  const laatste = [...rows]
    .filter((r) => r.subscribed_at)
    .sort((a, b) => (a.subscribed_at < b.subscribed_at ? 1 : -1))
    .slice(0, 12);

  const bijgewerkt = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  return `
<header>
  <p class="eyebrow">Start Met Pokémon</p>
  <h1>Nieuwsbrief</h1>
  <p class="meta">Live uit je eigen database · ${esc(bijgewerkt)}</p>
</header>

<section class="tegels">
  ${tegel('Actieve subs', nl(actief.length), 'krijgen je mails')}
  ${tegel('Nieuw deze week', nl(nieuw7), 'laatste 7 dagen')}
  ${tegel('Nieuw deze maand', nl(nieuw30), groei === null ? 'laatste 30 dagen' : `${groei >= 0 ? '+' : ''}${groei}% t.o.v. de 30 dagen daarvoor`)}
  ${tegel('Afgemeld / bounced', `${nl(afgemeld)} / ${nl(bounced)}`, 'krijgen geen mail meer')}
</section>

<section class="kaart">
  <h2>Groei van de lijst</h2>
  <p class="sub">Actieve subs per dag, aanmeldingen min afmeldingen</p>
  ${lijnGrafiek(lijn)}
</section>

<section class="kaart">
  <h2>Nieuwe aanmeldingen per week</h2>
  <p class="sub">Laatste 16 weken, week begint op maandag</p>
  ${staafGrafiek(weken)}
</section>

<section class="twee">
  <div class="kaart">
    <h2>Waar mensen zich aanmelden</h2>
    <p class="sub">Gesorteerd op de laatste 30 dagen</p>
    <table>
      <thead><tr><th>Bron</th><th class="r">30 dgn</th><th class="r">Totaal</th></tr></thead>
      <tbody>
        ${bronnen.slice(0, 15).map((g) => `<tr><td>${esc(g.groep)}${g.details.size ? `<div class="klein">${esc(top(g.details))}</div>` : ''}</td><td class="r">${nl(g.recent)}</td><td class="r">${nl(g.totaal)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="kaart">
    <h2>Welkomstmail</h2>
    <p class="sub">Welke welkomstmail mensen kregen</p>
    <table>
      <tbody>
        ${[...varianten.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => `<tr><td>${esc(VARIANT[v] || v)}</td><td class="r">${nl(n)}</td></tr>`).join('')}
      </tbody>
    </table>
    <h2 class="mt">Laatste aanmeldingen</h2>
    <table>
      <tbody>
        ${laatste.map((r) => `<tr><td class="d">${esc(kort(dag(r.subscribed_at)))}</td><td>${esc(bronGroep(r.bron).groep)}</td><td class="r klein">${r.status === 'active' ? '' : esc(r.status === 'bounced' ? 'bounced' : 'afgemeld')}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</section>

<footer>Opens en kliks per mail staan in Resend onder Emails en Broadcasts.</footer>`;
}

function top(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ');
}

function tegel(label, waarde, sub) {
  return `<div class="tegel"><div class="label">${esc(label)}</div><div class="waarde">${esc(waarde)}</div><div class="klein">${esc(sub)}</div></div>`;
}

function lijnGrafiek(punten) {
  const W = 900, H = 300, L = 64, R = 14, T = 16, B = 44;
  if (punten.length < 2) return '<p class="klein">Nog te weinig data.</p>';
  const max = Math.max(10, ...punten.map((p) => p.y));
  const stap = niceStap(max);
  const top = Math.ceil(max / stap) * stap;
  const x = (i) => L + (i / (punten.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / top) * (H - T - B);
  const pad = punten.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  const vlak = `${pad}L${x(punten.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  let rooster = '';
  for (let v = 0; v <= top; v += stap) rooster += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="rooster"/><text x="${L - 8}" y="${y(v) + 4}" class="as" text-anchor="end">${v}</text>`;
  const labels = [0, Math.floor((punten.length - 1) / 2), punten.length - 1]
    .map((i, j) => `<text x="${x(i)}" y="${H - 10}" class="as" text-anchor="${['start', 'middle', 'end'][j]}">${kort(punten[i].x)}</text>`).join('');
  const hover = punten.map((p, i) => {
    const w = (W - L - R) / punten.length;
    return `<rect x="${(x(i) - w / 2).toFixed(1)}" y="${T}" width="${w.toFixed(2)}" height="${H - T - B}" class="hit"><title>${kort(p.x)}: ${p.y} actief</title></rect>`;
  }).join('');
  const laatste = punten[punten.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="grafiek" role="img" aria-label="Groei van de lijst">${rooster}<path d="${vlak}" class="vlak"/><path d="${pad}" class="lijn"/><circle cx="${x(punten.length - 1)}" cy="${y(laatste.y)}" r="4" class="punt"/>${labels}${hover}</svg>`;
}

function staafGrafiek(punten) {
  const W = 900, H = 260, L = 64, R = 14, T = 30, B = 44;
  const max = Math.max(5, ...punten.map((p) => p.y));
  const stap = niceStap(max);
  const top = Math.ceil(max / stap) * stap;
  const bw = (W - L - R) / punten.length;
  const y = (v) => T + (1 - v / top) * (H - T - B);
  let rooster = '';
  for (let v = 0; v <= top; v += stap) rooster += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="rooster"/><text x="${L - 8}" y="${y(v) + 4}" class="as" text-anchor="end">${v}</text>`;
  const staven = punten.map((p, i) => {
    const h = y(0) - y(p.y);
    const xx = L + i * bw + bw * 0.15;
    const label = i % 3 === 0 || i === punten.length - 1 ? `<text x="${L + i * bw + bw / 2}" y="${H - 10}" class="as" text-anchor="middle">${kort(p.x)}</text>` : '';
    return `<g><rect x="${xx.toFixed(1)}" y="${y(p.y).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${Math.max(h, 0).toFixed(1)}" rx="3" class="${i === punten.length - 1 ? 'staaf nu' : 'staaf'}"><title>Week van ${kort(p.x)}: ${p.y} nieuw</title></rect>${p.y ? `<text x="${L + i * bw + bw / 2}" y="${y(p.y) - 5}" class="waardelabel" text-anchor="middle">${p.y}</text>` : ''}${label}</g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="grafiek" role="img" aria-label="Nieuwe aanmeldingen per week">${rooster}${staven}</svg>`;
}

function niceStap(max) {
  const ruw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(ruw)));
  const n = ruw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

function html(inhoud) {
  const page = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Nieuwsbrief-dashboard | Start Met Pokémon</title>
<style>
  :root{--bg:#0A0E17;--kaart:#111827;--rand:#1E293B;--tekst:#F1F5F9;--zacht:#94A3B8;--geel:#FACC15}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--tekst);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.5}
  main{max-width:1080px;margin:0 auto;padding:32px 20px 48px}
  .eyebrow{margin:0;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:var(--geel)}
  h1{font-family:Georgia,serif;font-weight:400;font-size:34px;margin:6px 0 4px}
  h2{font-size:16px;margin:0 0 2px}
  h2.mt{margin-top:24px}
  .meta,.sub,.klein{color:var(--zacht);font-size:13px;margin:0}
  .sub{margin-bottom:14px}
  .tegels{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:24px 0}
  .tegel,.kaart{background:var(--kaart);border:1px solid var(--rand);border-radius:14px;padding:18px 20px}
  .kaart{margin-bottom:12px}
  .label{font-size:13px;color:var(--zacht)}
  .waarde{font-size:32px;font-weight:700;margin:2px 0;font-variant-numeric:tabular-nums}
  .twee{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}
  .twee .kaart{margin:0}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{text-align:left;font-weight:600;color:var(--zacht);font-size:12px;padding:6px 0;border-bottom:1px solid var(--rand)}
  td{padding:8px 0;border-bottom:1px solid var(--rand);vertical-align:top}
  .r{text-align:right;font-variant-numeric:tabular-nums;padding-left:12px;white-space:nowrap}
  .grafiek{width:100%;height:auto;display:block}
  .rooster{stroke:var(--rand);stroke-width:1}
  .as{fill:var(--zacht);font-size:12px}
  .lijn{fill:none;stroke:var(--geel);stroke-width:2.5}
  .vlak{fill:var(--geel);opacity:.10}
  .punt{fill:var(--geel)}
  .staaf{fill:#475569}
  .staaf.nu{fill:var(--geel)}
  .staaf:hover,.hit:hover{opacity:.8}
  .hit{fill:transparent}
  .waardelabel{fill:var(--tekst);font-size:11px}
  .d{white-space:nowrap;padding-right:14px;color:var(--zacht)}
  footer{color:var(--zacht);font-size:13px;margin-top:20px}
  @media (max-width:600px){
    main{padding:24px 14px 40px}
    .tegel,.kaart{padding:14px 16px}
    .waarde{font-size:26px}
    .as{font-size:26px}
    .waardelabel{font-size:22px}
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
