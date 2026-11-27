// Start Met Pokémon: API-laag voor de nieuwsbrief.
//
// Alle formulieren op de site posten naar /api/subscribe op ons eigen domein.
// Deze Worker bewaart de aanmelding in onze eigen D1-database en geeft hem
// door aan de mailtool (nu Resend). Wisselen van mailtool betekent alleen
// deze file aanpassen; de HTML van de site blijft gelijk.
//
// Routes (alles andere gaat gewoon naar de statische site):
//   POST /api/subscribe        aanmelden vanaf de site
//   GET  /api/afmelden         bevestigingspagina afmelden (link uit welkomstmail)
//   POST /api/afmelden         afmelden uitvoeren (ook one-click vanuit Gmail/Apple Mail)
//   POST /api/resend-webhook   Resend meldt afmeldingen, bounces en klachten
// Cron (dagelijks): afgemelde adressen na 30 dagen verwijderen (zie privacyverklaring).
//
// Secrets (Cloudflare dashboard > Worker > Settings > Variables and Secrets):
//   RESEND_API_KEY         verplicht
//   UNSUB_SECRET           verplicht, lange willekeurige tekst, nooit meer wijzigen
//   RESEND_WEBHOOK_SECRET  optioneel, "whsec_..." uit Resend > Webhooks

import { welkomMail } from './mails.js';

const SITE = 'https://startmetpokemon.nl';
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const BEWAAR_DAGEN_NA_AFMELDEN = 30;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      switch (url.pathname) {
        case '/api/subscribe':
          return await aanmelden(request, env, ctx);
        case '/api/afmelden':
          return await afmelden(request, env, url);
        case '/api/resend-webhook':
          return await webhook(request, env);
      }
    } catch (err) {
      console.error('api-fout', url.pathname, (err && err.stack) || String(err));
      return url.pathname === '/api/afmelden'
        ? pagina('Er ging iets mis', '<p>Het afmelden lukte niet. Probeer het later opnieuw of stuur een mail naar <a href="mailto:nieuwsbrief@startmetpokemon.nl">nieuwsbrief@startmetpokemon.nl</a>, dan regelen we het.</p>', 500)
        : json({ ok: false }, 500);
    }
    if (url.pathname.startsWith('/api/')) return new Response('Niet gevonden', { status: 404 });
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(opruimen(env));
  },
};

/* ------------------------------------------------------------------ */
/* Aanmelden                                                           */
/* ------------------------------------------------------------------ */

async function aanmelden(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
  }
  const origin = request.headers.get('Origin');
  if (origin && !eigenOrigin(origin)) return json({ ok: false }, 403);

  let email = '';
  let bron = '';
  let honeypot = '';
  const type = request.headers.get('Content-Type') || '';
  if (type.includes('application/json')) {
    const b = await request.json().catch(() => ({}));
    email = b.email;
    bron = b.bron;
    honeypot = b.website;
  } else {
    const fd = await request.formData();
    email = fd.get('fields[email]') || fd.get('email');
    bron = fd.get('fields[bron]') || fd.get('bron');
    honeypot = fd.get('website');
  }
  email = String(email || '').trim().toLowerCase();
  bron = String(bron || '').trim().slice(0, 200);

  // Zonder JavaScript is het een gewone formulierpost: stuur door naar de bedankpagina.
  const navigatie = request.headers.get('Sec-Fetch-Mode') === 'navigate';
  const klaar = () => (navigatie ? Response.redirect(SITE + '/bedankt-nieuwsbrief', 303) : json({ ok: true }));

  if (honeypot) return klaar(); // bot: doe alsof het gelukt is
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return navigatie ? Response.redirect(request.headers.get('Referer') || SITE, 303) : json({ ok: false, fout: 'email' }, 400);
  }

  const nu = new Date().toISOString();
  const bestaand = await env.DB.prepare('SELECT status FROM subscribers WHERE email = ?').bind(email).first();
  if (bestaand && bestaand.status === 'active') return klaar(); // al ingeschreven, geen dubbele welkomstmail

  if (bestaand) {
    await env.DB.prepare(
      "UPDATE subscribers SET status = 'active', bron = ?, subscribed_at = ?, unsubscribed_at = NULL, welcome = NULL, updated_at = ? WHERE email = ?"
    ).bind(bron, nu, nu, email).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO subscribers (email, status, bron, subscribed_at, source, updated_at) VALUES (?, 'active', ?, ?, 'site', ?)"
    ).bind(email, bron, nu, nu).run();
  }

  ctx.waitUntil(naAanmelding(env, email, bron));
  return klaar();
}

async function naAanmelding(env, email, bron) {
  await resendContact(env, email, { unsubscribed: false, properties: { bron } });

  const link = await afmeldLink(env, email);
  const mail = welkomMail(bron, link);
  const r = await resend(env, 'POST', '/emails', {
    from: env.MAIL_FROM,
    to: [email],
    reply_to: env.MAIL_REPLY_TO,
    subject: mail.subject,
    html: mail.html,
    headers: {
      'List-Unsubscribe': `<${link}>, <mailto:${env.MAIL_REPLY_TO}?subject=afmelden>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tags: [
      { name: 'type', value: 'welkom' },
      { name: 'variant', value: mail.variant },
    ],
  });
  if (r.ok) {
    await env.DB.prepare('UPDATE subscribers SET welcome = ?, updated_at = ? WHERE email = ?')
      .bind(mail.variant, new Date().toISOString(), email)
      .run();
  }
}

/* ------------------------------------------------------------------ */
/* Afmelden                                                            */
/* ------------------------------------------------------------------ */

async function afmeldLink(env, email) {
  const t = await afmeldToken(env, email);
  return `${SITE}/api/afmelden?e=${encodeURIComponent(email)}&t=${t}`;
}

async function afmeldToken(env, email) {
  if (!env.UNSUB_SECRET) throw new Error('UNSUB_SECRET ontbreekt');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.UNSUB_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('afmelden:' + email));
  return b64url(new Uint8Array(sig)).slice(0, 32);
}

async function afmelden(request, env, url) {
  const email = String(url.searchParams.get('e') || '').trim().toLowerCase();
  const t = String(url.searchParams.get('t') || '');
  const geldig = email && t && gelijk(t, await afmeldToken(env, email));

  if (!geldig) {
    return pagina('Link werkt niet', '<p>Deze afmeldlink klopt niet of is onvolledig. Stuur een mail naar <a href="mailto:nieuwsbrief@startmetpokemon.nl?subject=afmelden">nieuwsbrief@startmetpokemon.nl</a>, dan melden we je met de hand af.</p>', 400);
  }

  if (request.method === 'GET') {
    // Niet direct afmelden bij GET: virusscanners openen links in mails automatisch.
    const actie = `/api/afmelden?e=${encodeURIComponent(email)}&t=${encodeURIComponent(t)}`;
    return pagina('Afmelden voor de nieuwsbrief', `
      <p>Je staat op het punt <strong>${esc(email)}</strong> af te melden. Daarna krijg je geen mails meer van Start Met Pokémon.</p>
      <form method="POST" action="${esc(actie)}"><button type="submit">Ja, meld me af</button></form>
      <p class="klein">Per ongeluk hier? Dan hoef je niks te doen. <a href="/">Terug naar de site</a></p>`);
  }

  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  await zetAfgemeld(env, email);
  await resendContact(env, email, { unsubscribed: true });

  // One-click vanuit Gmail/Apple Mail verwacht alleen een 200.
  const body = await request.text().catch(() => '');
  if (body.includes('List-Unsubscribe=One-Click')) return new Response('ok');

  return pagina('Je bent afgemeld', '<p>Je krijgt geen mails meer van ons. Toch per ongeluk? Je kunt je altijd opnieuw inschrijven op de site.</p><p><a href="/">Terug naar Start Met Pokémon</a></p>');
}

async function zetAfgemeld(env, email, status = 'unsubscribed') {
  const nu = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE subscribers SET status = ?, unsubscribed_at = COALESCE(unsubscribed_at, ?), updated_at = ? WHERE email = ?'
  ).bind(status, nu, nu, email).run();
}

/* ------------------------------------------------------------------ */
/* Webhook van Resend: houdt onze eigen lijst gelijk                   */
/* ------------------------------------------------------------------ */

async function webhook(request, env) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!env.RESEND_WEBHOOK_SECRET) return new Response('Webhook niet ingesteld', { status: 503 });

  const body = await request.text();
  const id = request.headers.get('svix-id');
  const ts = request.headers.get('svix-timestamp');
  const sigs = request.headers.get('svix-signature');
  if (!id || !ts || !sigs) return new Response('Ontbrekende headers', { status: 400 });
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return new Response('Te oud', { status: 400 });

  const secret = b64decode(env.RESEND_WEBHOOK_SECRET.replace(/^whsec_/, ''));
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const verwacht = b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`))));
  const klopt = sigs.split(' ').some((s) => gelijk(s.split(',')[1] || '', verwacht));
  if (!klopt) return new Response('Ongeldige handtekening', { status: 401 });

  const evt = JSON.parse(body);
  const d = evt.data || {};
  switch (evt.type) {
    case 'contact.created':
    case 'contact.updated': {
      const email = String(d.email || '').toLowerCase();
      if (!email) break;
      if (d.unsubscribed === true) {
        await env.DB.prepare(
          "UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = COALESCE(unsubscribed_at, ?), updated_at = ? WHERE email = ? AND status = 'active'"
        ).bind(new Date().toISOString(), new Date().toISOString(), email).run();
      }
      break;
    }
    case 'contact.deleted': {
      const email = String(d.email || '').toLowerCase();
      if (email) await env.DB.prepare('DELETE FROM subscribers WHERE email = ?').bind(email).run();
      break;
    }
    case 'email.bounced':
    case 'email.complained': {
      const status = evt.type === 'email.bounced' ? 'bounced' : 'unsubscribed';
      for (const to of [].concat(d.to || [])) {
        const email = String(to).toLowerCase();
        await zetAfgemeld(env, email, status);
        await resendContact(env, email, { unsubscribed: true });
      }
      break;
    }
  }
  return new Response('ok');
}

/* ------------------------------------------------------------------ */
/* Dagelijks opruimen                                                  */
/* ------------------------------------------------------------------ */

async function opruimen(env) {
  const grens = new Date(Date.now() - BEWAAR_DAGEN_NA_AFMELDEN * 864e5).toISOString();
  const { results } = await env.DB.prepare(
    "SELECT email FROM subscribers WHERE status = 'unsubscribed' AND unsubscribed_at < ? LIMIT 50"
  ).bind(grens).all();
  for (const { email } of results || []) {
    const r = await resend(env, 'DELETE', '/contacts/' + encodeURIComponent(email));
    if (r.ok || r.status === 404) {
      await env.DB.prepare('DELETE FROM subscribers WHERE email = ?').bind(email).run();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Resend                                                              */
/* ------------------------------------------------------------------ */

async function resend(env, method, pad, body) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY ontbreekt');
    return { ok: false, status: 0 };
  }
  const res = await fetch('https://api.resend.com' + pad, {
    method,
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'startmetpokemon-worker',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) console.error('resend', method, pad.replace(/\/contacts\/.+/, '/contacts/…'), res.status, JSON.stringify(data));
  return { ok: res.ok, status: res.status, data };
}

// Contact aanmaken of bijwerken. Lukt het niet met properties (bijvoorbeeld
// omdat het veld in Resend niet bestaat), dan zonder: de aanmelding mag nooit
// stuklopen op een extra veld.
async function resendContact(env, email, velden) {
  const segment = env.RESEND_SEGMENT_ID ? { segments: [{ id: env.RESEND_SEGMENT_ID }] } : {};
  const pad = '/contacts/' + encodeURIComponent(email);
  let r = await resend(env, 'POST', '/contacts', { email, ...velden, ...segment });
  if (r.ok) return r;
  r = await resend(env, 'PATCH', pad, velden);
  if (r.ok || !velden.properties) return r;
  const { properties, ...rest } = velden;
  r = await resend(env, 'POST', '/contacts', { email, ...rest, ...segment });
  if (!r.ok) r = await resend(env, 'PATCH', pad, rest);
  return r;
}

/* ------------------------------------------------------------------ */
/* Hulpjes                                                             */
/* ------------------------------------------------------------------ */

function eigenOrigin(origin) {
  try {
    const h = new URL(origin).hostname;
    return h === 'startmetpokemon.nl' || h === 'www.startmetpokemon.nl' || h === 'localhost' || h.endsWith('.workers.dev');
  } catch {
    return false;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function pagina(titel, inhoud, status = 200) {
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(titel)} | Start Met Pokémon</title>
<style>
  body{margin:0;background:#0A0E17;color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6}
  main{max-width:520px;margin:12vh auto;padding:36px 32px;background:#111827;border:1px solid #1E293B;border-radius:16px}
  h1{font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 16px}
  p{color:#C5CCD8}
  a{color:#FACC15}
  button{background:#FACC15;color:#0A0E17;border:0;border-radius:10px;padding:14px 26px;font-size:15px;font-weight:700;cursor:pointer;margin:8px 0 16px}
  .klein{font-size:14px;color:#94A3B8}
</style>
</head>
<body><main><h1>${esc(titel)}</h1>${inhoud}</main></body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gelijk(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

function b64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64url(bytes) {
  return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64decode(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
