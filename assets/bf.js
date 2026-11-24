/* Black Friday 2026: MintArca-campagne op Start Met Pokémon.
 * Loopt t/m maandag 30 november 23:59 (code SLAB20, 20%, alleen voor deze site).
 * nav.js laadt dit script in plaats van promo.js zolang de campagne loopt; daarna
 * valt alles vanzelf terug op de gewone pop-up. Niets in de HTML-pagina's aangepast.
 *
 * Drie onderdelen:
 *  1. Pop-up: na 6 seconden of 25% scrollen. Desktop een kaart in het midden,
 *     mobiel een kaart onderaan (geen schermvullende pop-up, Google straft dat af).
 *  2. Lopende Black Friday-balk onderaan het scherm (zoals Hears), met aftelling.
 *     Klik opent de pop-up. Foto's in pop-up en blok wisselen automatisch.
 *  3. Het MintArca-blok in de gidsen krijgt de Black Friday-prijzen en de code.
 * Meten: GA4 mintarca_click (plek blok/popup, inhoud=blackfriday) en
 * het gebruik van SLAB20 in Shopify.
 */
(function () {
  var END = Date.parse('2026-11-30T23:59:59+01:00');
  if (!(Date.now() < END)) return;

  var CODE = 'SLAB20';
  var PCT = 20;
  var KEY = 'smp_bf26_until';
  var KEY_PILL = 'smp_bf26_pill_off';
  var SKIP = /^\/(disclaimer|privacyverklaring|contact|bedankt|bedankt-nieuwsbrief|404|hoe-wij-werken)(\.html)?$/;
  var PAGE = (location.pathname.replace(/\.html$/, '').replace(/^\/|\/$/g, '') || 'home').replace(/\//g, '-');

  function eur(n) { return '&euro;' + n.toFixed(2).replace('.', ','); }
  function off(n) { return Math.round(n * (100 - PCT)) / 100; }
  var P = [['1 Guard', 7.95], ['5-pack', 29.95], ['10-pack', 55]];

  function link(medium) {
    var u = 'utm_source=startmetpokemon&utm_medium=' + medium + '&utm_campaign=' + encodeURIComponent(PAGE) + '&utm_content=blackfriday';
    return 'https://mintarca.com/discount/' + CODE + '?redirect=' + encodeURIComponent('/nl/products/guard?' + u) + '&' + u;
  }

  function get(k) { try { return parseInt(localStorage.getItem(k) || '0', 10); } catch (e) { return 0; } }
  function set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }

  function left() {
    var s = Math.max(0, Math.floor((END - Date.now()) / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function shortLeft() { var t = left(); return t.d > 0 ? 'nog ' + t.d + 'd ' + t.h + 'u' : 'nog ' + t.h + 'u ' + pad(t.m) + 'm'; }

  var mobile = window.matchMedia('(max-width: 640px)').matches;
  var SERIF = '"DM Serif Display",Georgia,serif';
  var SANS = 'Figtree,system-ui,-apple-system,"Segoe UI",sans-serif';

  /* ---------- stijl ---------- */
  function css() {
    if (document.getElementById('smp-bf-css')) return;
    var s = document.createElement('style');
    s.id = 'smp-bf-css';
    s.textContent = [
      /* pop-up */
      '#smp-bf{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(4,5,7,.72);opacity:0;transition:opacity .35s ease;font-family:' + SANS + '}',
      '#smp-bf.is-on{opacity:1}',
      '#smp-bf .bf-card:focus{outline:none}',
      '#smp-bf .bf-card{position:relative;display:grid;grid-template-columns:380px 1fr;width:860px;max-width:100%;background:#0c0c0d;color:#f2f3f2;border-radius:10px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.6);transform:translateY(18px) scale(.985);transition:transform .45s cubic-bezier(.2,.8,.2,1)}',
      '#smp-bf.is-on .bf-card{transform:none}',
      '#smp-bf .bf-img{position:relative;background:#f3f3f3;min-height:440px}',
      '#smp-bf .bf-tag{z-index:3}',
      '#smp-bf .bf-tag{position:absolute;left:16px;top:16px;background:#0c0c0d;color:#f2f3f2;font-size:.58rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;padding:9px 12px;border-radius:3px;display:flex;align-items:center;gap:10px}',
      '#smp-bf .bf-tag img{height:12px;display:block}#smp-bf .bf-tag i{width:1px;height:12px;background:#55575a}',
      '#smp-bf .bf-wm{height:15px;width:auto;display:block;align-self:flex-start;margin:0 0 16px}',
      '#smp-bf.is-mob .bf-wm{height:12px;margin:0 0 10px}',
      '#smp-bf .bf-body{padding:34px 36px 26px;display:flex;flex-direction:column}',
      '#smp-bf .bf-label{font-size:.62rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:#8c8f92;margin:0 0 14px}',
      '#smp-bf .bf-h{font-family:' + SERIF + ';font-weight:400;font-size:3.1rem;line-height:1;margin:0 0 6px;color:#fff;letter-spacing:-.01em}',
      '#smp-bf .bf-h em{font-style:italic;color:#d9d6cf}',
      '#smp-bf .bf-t{font-size:.95rem;line-height:1.5;color:#b9bcbf;margin:0 0 18px}',
      '#smp-bf .bf-cd{display:flex;gap:8px;margin:0 0 18px}',
      '#smp-bf .bf-cd div{flex:1;background:#18181a;border:1px solid #262628;border-radius:6px;text-align:center;padding:8px 0 6px}',
      '#smp-bf .bf-cd b{display:block;font-size:1.35rem;font-weight:600;color:#fff;font-variant-numeric:tabular-nums;line-height:1.1}',
      '#smp-bf .bf-cd span{font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:#7d8083}',
      '#smp-bf .bf-pr{list-style:none;padding:0;margin:0 0 18px;font-size:.9rem}',
      '#smp-bf .bf-pr li{display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid #222224}',
      '#smp-bf .bf-pr li:last-child{border-bottom:0}',
      '#smp-bf .bf-pr s{color:#6f7275;margin-right:8px}',
      '#smp-bf .bf-pr strong{color:#fff;font-weight:600}',
      '#smp-bf .bf-code{display:flex;align-items:center;justify-content:space-between;border:1.5px dashed #3a3a3d;border-radius:6px;padding:8px 8px 8px 14px;margin:0 0 12px}',
      '#smp-bf .bf-code b{font-size:1.05rem;letter-spacing:.16em;color:#fff}',
      '#smp-bf .bf-copy{background:#232326;color:#f2f3f2;border:0;border-radius:4px;font:600 .75rem ' + SANS + ';padding:7px 10px;cursor:pointer}',
      '#smp-bf .bf-btn{display:block;text-align:center;background:#f2f3f2;color:#0c0c0d;font-weight:700;font-size:1rem;padding:15px 18px;border-radius:999px;text-decoration:none;transition:background .2s}',
      '#smp-bf .bf-btn:hover{background:#fff;text-decoration:none}',
      '#smp-bf .bf-small{font-size:.75rem;color:#7d8083;text-align:center;margin:10px 0 0}',
      '#smp-bf .bf-no{display:block;margin:6px auto 0;background:none;border:0;color:#7d8083;font-size:.8rem;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
      '#smp-bf .bf-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:#1d1d20;color:#f2f3f2;font-size:21px;line-height:1;cursor:pointer;z-index:2}',
      /* mobiel: kaart onderaan */
      '#smp-bf.is-mob{inset:auto 0 0 0;padding:0 8px 8px;background:none;align-items:flex-end}',
      '#smp-bf.is-mob .bf-card{grid-template-columns:1fr;border-radius:14px;transform:translateY(40px);box-shadow:0 -8px 40px rgba(0,0,0,.45)}',
      '#smp-bf.is-mob.is-on .bf-card{transform:none}',
      '#smp-bf.is-mob .bf-img{display:none}',
      '#smp-bf.is-mob .bf-body{padding:18px 18px 14px}',
      '#smp-bf.is-mob .bf-label{font-size:.56rem;margin:0 0 8px;padding-right:36px}',
      '#smp-bf.is-mob .bf-h{font-size:2rem;margin:0 0 4px}',
      '#smp-bf.is-mob .bf-t{font-size:.82rem;margin:0 0 12px;padding-right:20px}',
      '#smp-bf.is-mob .bf-cd{margin:0 0 12px;gap:6px}',
      '#smp-bf.is-mob .bf-cd div{padding:5px 0 4px}',
      '#smp-bf.is-mob .bf-cd b{font-size:1.05rem}',
      '#smp-bf.is-mob .bf-pr,#smp-bf.is-mob .bf-no{display:none}',
      '#smp-bf.is-mob .bf-code{margin:0 0 10px;padding:6px 6px 6px 12px}',
      '#smp-bf.is-mob .bf-btn{padding:13px 16px;font-size:.95rem}',
      '#smp-bf.is-mob .bf-small{display:none}',
      '#smp-bf.is-mob .bf-x{top:10px;right:10px;width:30px;height:30px;font-size:19px}',
      /* pil */
      '#smp-bf-pill{position:fixed;left:16px;bottom:16px;z-index:8900;display:flex;align-items:center;gap:10px;background:#f2f3f2;color:#0c0c0d;border-radius:999px;padding:8px 8px 8px 16px;box-shadow:0 10px 30px rgba(0,0,0,.45);font:600 .85rem ' + SANS + ';opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s}',
      '#smp-bf-pill.is-on{opacity:1;transform:none}',
      '#smp-bf-pill.is-on.is-away{opacity:0;pointer-events:none}',
      '#smp-bf-pill button.bf-open{background:none;border:0;color:inherit;font:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;padding:0}',
      '#smp-bf-pill .bf-pct{background:#0c0c0d;color:#f2f3f2;font-weight:700;border-radius:999px;padding:3px 9px;font-size:.8rem}',
      '#smp-bf-pill .bf-left{color:#5d6063;font-variant-numeric:tabular-nums}',
      '#smp-bf-pill .bf-px{background:#dcdcd8;border:0;color:#333;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1}',
      '@media (max-width:640px){#smp-bf-pill{left:50%;bottom:12px;transform:translate(-50%,12px);white-space:nowrap;font-size:.8rem}#smp-bf-pill.is-on{transform:translate(-50%,0)}}',
      /* lopende Black Friday-balk onderaan (zoals Hears) */
      '#smp-bf-tick{position:fixed;left:0;right:0;bottom:0;z-index:8900;height:46px;background:#f2f3f2;color:#0c0c0d;display:flex;align-items:center;overflow:hidden;font:700 .82rem ' + SANS + ';letter-spacing:.14em;text-transform:uppercase;cursor:pointer;box-shadow:0 -6px 24px rgba(0,0,0,.45);border-top:1px solid #d8d8d4;transform:translateY(100%);transition:transform .35s ease}',
      '#smp-bf-tick.is-on{transform:none}',
      '#smp-bf-tick .tk-track{display:flex;white-space:nowrap;animation:smpTick 38s linear infinite;will-change:transform}',
      '#smp-bf-tick:hover .tk-track{animation-play-state:paused}',
      '#smp-bf-tick .tk-item{display:inline-flex;align-items:center;gap:14px;padding:0 22px}',
      '#smp-bf-tick .tk-dot{width:8px;height:8px;border-radius:50%;background:#e5484d;box-shadow:0 0 0 0 rgba(229,72,77,.6);animation:smpPulse 1.6s infinite}',
      '#smp-bf-tick .tk-sep{color:#a3a5a7}',
      '#smp-bf-tick .tk-red{color:#e5484d}',
      '#smp-bf-tick .tk-code{border:1.5px dashed #8a8d8f;border-radius:3px;padding:2px 8px;letter-spacing:.18em}',
      '#smp-bf-tick .tk-wm{height:11px;display:block;filter:invert(1)}',
      '#smp-bf-tick .tk-x{position:absolute;right:0;top:0;bottom:0;width:46px;border:0;background:linear-gradient(90deg,rgba(242,243,242,0),#f2f3f2 35%);color:#555;font-size:20px;cursor:pointer}',
      'body.smp-bf-pad{padding-bottom:46px}',
      '@keyframes smpTick{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
      '@keyframes smpPulse{0%{box-shadow:0 0 0 0 rgba(255,90,95,.6)}70%{box-shadow:0 0 0 8px rgba(255,90,95,0)}100%{box-shadow:0 0 0 0 rgba(255,90,95,0)}}',
      '@media (prefers-reduced-motion:reduce){#smp-bf-tick .tk-track{animation:none}}',
      '@media (max-width:640px){#smp-bf-tick{height:42px;font-size:.72rem}body.smp-bf-pad{padding-bottom:42px}}',
      /* foto's die automatisch wisselen */
      '.bf-slides{position:absolute;inset:0;overflow:hidden}',
      '.bf-slides .sl{position:absolute;inset:0;opacity:0;transition:opacity .8s ease,transform 4.5s ease;transform:scale(1.03)}',
      '.bf-slides .sl.on{opacity:1;transform:scale(1)}',
      '.bf-slides .dots{position:absolute;left:0;right:0;bottom:14px;display:flex;justify-content:center;gap:6px;z-index:2}',
      '.bf-slides .dots i{width:7px;height:7px;border-radius:999px;background:rgba(17,17,17,.25);transition:width .3s,background .3s;box-shadow:0 0 0 1px rgba(255,255,255,.5)}',
      '.bf-slides .dots i.on{width:20px;background:#111}',
      '.maker-block.bf-on .maker-media{position:relative;aspect-ratio:1/1;background:#f3f3f3}',
      '.maker-block.bf-on .maker-media .maker-img{visibility:hidden}',
      /* blok in de gidsen */
      '.maker-block.bf-on{position:relative;border-color:#0c0c0d !important;box-shadow:0 0 0 1px #0c0c0d}',
      '.maker-block .bf-ribbon{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;background:#0c0c0d;color:#f2f3f2;font:600 .72rem ' + SANS + ';letter-spacing:.14em;text-transform:uppercase;padding:9px 14px;border-radius:4px;margin:0 0 14px}',
      '.maker-block .bf-ribbon i{font-style:normal;background:#f2f3f2;color:#0c0c0d;border-radius:3px;padding:2px 7px;letter-spacing:.08em}',
      '.maker-block .bf-ribbon span{color:#9a9da0;letter-spacing:.06em;text-transform:none;font-weight:500}',
      '.maker-block.bf-on .bf-hide{display:none !important}',
      '.maker-block.bf-on.maker-block--img{grid-template-columns:300px 1fr;align-items:center}',
      '.maker-block .bf-pt{margin:16px 0 14px;border-top:1px solid #dcdad5}',
      '.maker-block .bf-pt div{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid #e6e4df;font-size:.95rem;color:#3d3f41}',
      '.maker-block .bf-pt b{font-weight:600;color:#111;font-size:1.05rem}',
      '.maker-block .bf-pt s{color:#a3a5a7;margin-right:10px;font-size:.9rem}',
      '.maker-block .bf-codeline{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1.5px dashed #b5b2ab;border-radius:6px;padding:8px 12px;margin:0 0 16px;font-size:.88rem;color:#55575a}',
      '.maker-block .bf-codeline b{letter-spacing:.16em;color:#111;font-size:1rem}',
      '@media (max-width:640px){.maker-block.bf-on.maker-block--img{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- wisselende foto's ---------- */
  /* Vierkante foto's, hele beeld zichtbaar (contain). De achtergrond loopt door in de kleur van de foto,
   de plankfoto is hoger gemaakt (gespiegelde rand) en vult het vak. */
  var SLIDES = [
    ['/assets/bf-slide-1.webp', '#f3f3f3'],
    ['/assets/bf-slide-2.webp', '#f3f3f3'],
    ['/assets/bf-slide-3.webp', '#0b0b0b', 'cover'],
    ['/assets/bf-slide-4.webp', '#f3f3f3']
  ];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* foto's alvast laden, zodat de pop-up niet met een leeg vlak opent */
  if (!mobile) SLIDES.forEach(function (x) { var im = new Image(); im.src = x[0]; });
  function slideshow(host, ms) {
    var box = document.createElement('div');
    box.className = 'bf-slides';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = SLIDES.map(function (u, i) { return '<div class="sl' + (i === 0 ? ' on' : '') + '" style="background:url(' + u[0] + ') 50% 50%/' + (u[2] || 'contain') + ' no-repeat,' + u[1] + '"></div>'; }).join('') +
      '<div class="dots">' + SLIDES.map(function (u, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';
    host.appendChild(box);
    if (reduce) return box;
    var n = 0, sl = box.querySelectorAll('.sl'), dt = box.querySelectorAll('.dots i');
    box._t = setInterval(function () {
      if (!box.isConnected) { clearInterval(box._t); return; }
      sl[n].classList.remove('on'); dt[n].classList.remove('on');
      n = (n + 1) % sl.length;
      sl[n].classList.add('on'); dt[n].classList.add('on');
    }, ms || 3200);
    return box;
  }

  /* ---------- pop-up ---------- */
  var el = null, tick = null, shown = false;

  function prices() {
    return P.map(function (p) {
      return '<li><span>' + p[0] + '</span><span><s>' + eur(p[1]) + '</s><strong>' + eur(off(p[1])) + '</strong></span></li>';
    }).join('');
  }

  function cdHtml() {
    return ['d', 'h', 'm', 's'].map(function (k, i) {
      return '<div><b data-k="' + k + '">00</b><span>' + ['dagen', 'uur', 'min', 'sec'][i] + '</span></div>';
    }).join('');
  }

  function updateCd() {
    if (!el) return;
    var t = left();
    ['d', 'h', 'm', 's'].forEach(function (k) {
      var b = el.querySelector('[data-k="' + k + '"]');
      if (b) b.textContent = pad(t[k]);
    });
    if (Date.now() >= END) closePopup(false);
  }

  function build() {
    el = document.createElement('div');
    el.id = 'smp-bf';
    if (mobile) el.className = 'is-mob';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', mobile ? 'false' : 'true');
    el.setAttribute('aria-label', 'Black Friday-aanbieding van de makers van deze site');
    el.innerHTML =
      '<div class="bf-card">' +
        '<button type="button" class="bf-x" aria-label="Sluiten">&times;</button>' +
        '<div class="bf-img" role="img" aria-label="PSA-slabs in Guard-hoezen in verschillende kleuren"><span class="bf-tag"><img src="/assets/ma-wordmark-white.svg" alt="MintArca"><i></i>Black Friday</span></div>' +
        '<div class="bf-body">' +
          (mobile ? '<img class="bf-wm" src="/assets/ma-wordmark-white.svg" alt="MintArca">' : '') +
          '<p class="bf-label">Black Friday &middot; ' + (mobile ? 'van de makers' : 'van de makers van deze site') + '</p>' +
          '<p class="bf-h">20% op <em>alle</em> Guards</p>' +
          '<p class="bf-t">' + (mobile ? 'Code alleen voor lezers van deze site. T/m maandag 30 november.' : 'Een code alleen voor lezers van Start Met Pok&eacute;mon. De TPU-hoes voor je PSA-slab, in 11 kleuren. Geldig tot en met maandag 30 november.') + '</p>' +
          '<div class="bf-cd" aria-label="Tijd tot het einde van de actie">' + cdHtml() + '</div>' +
          '<ul class="bf-pr">' + prices() + '</ul>' +
          '<div class="bf-code"><span>Code&nbsp; <b>' + CODE + '</b></span><button type="button" class="bf-copy">Kopieer</button></div>' +
          '<a class="bf-btn" href="' + link('popup') + '" target="_blank" rel="sponsored noopener">Shop met 20% korting</a>' +
          '<p class="bf-small">De code staat er bij het afrekenen al op. Gratis verzending vanaf &euro;60.</p>' +
          '<button type="button" class="bf-no">Nee, bedankt</button>' +
        '</div>' +
      '</div>';
    if (!mobile) slideshow(el.querySelector('.bf-img'), 3000);
    el.querySelector('.bf-x').addEventListener('click', function () { closePopup(true); });
    el.querySelector('.bf-no').addEventListener('click', function () { closePopup(true); });
    el.addEventListener('click', function (e) { if (e.target === el) closePopup(true); });
    el.querySelector('.bf-btn').addEventListener('click', function () { set(KEY, END); closePopup(false); });
    el.querySelector('.bf-copy').addEventListener('click', function (e) {
      var b = e.currentTarget;
      try { navigator.clipboard.writeText(CODE); } catch (err) {}
      b.textContent = 'Gekopieerd';
      setTimeout(function () { b.textContent = 'Kopieer'; }, 1800);
    });
    document.body.appendChild(el);
    updateCd();
    tick = setInterval(updateCd, 1000);
  }

  function onKey(e) { if (e.key === 'Escape' && el) closePopup(true); }

  function openPopup() {
    if (el) return;
    css(); build();
    hideTick(false);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (el) el.classList.add('is-on'); }); });
    var card = el.querySelector('.bf-card');
    card.setAttribute('tabindex', '-1');
    if (!mobile) setTimeout(function () { try { card.focus({ preventScroll: true }); } catch (e) {} }, 400);
  }

  function closePopup(snooze) {
    if (!el) return;
    if (snooze) set(KEY, Date.now() + 864e5); /* een dag stil */
    clearInterval(tick);
    document.removeEventListener('keydown', onKey);
    var old = el; el = null;
    old.classList.remove('is-on');
    setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 400);
    setTimeout(showTick, 500);
  }

  /* ---------- lopende balk onderaan ---------- */
  var bar = null, tickT = null;

  function tickItems() {
    var one =
      '<span class="tk-item"><span class="tk-red">Black Friday</span><span class="tk-sep">|</span><span class="tk-dot"></span>Nu live</span>' +
      '<span class="tk-item"><img class="tk-wm" src="/assets/ma-wordmark-white.svg" alt=""></span>' +
      '<span class="tk-item">20% op alle Guards</span><span class="tk-sep">&middot;</span>' +
      '<span class="tk-item">Code <span class="tk-code">' + CODE + '</span></span><span class="tk-sep">&middot;</span>' +
      '<span class="tk-item tk-left"></span><span class="tk-sep">&middot;</span>';
    var half = one + one + one;
    return half + half; /* twee gelijke helften voor een naadloze lus */
  }

  function showTick() {
    if (el) return;
    if (get(KEY_PILL) > Date.now()) return;
    if (document.getElementById('smp-cookie-banner')) { setTimeout(showTick, 3000); return; }
    css();
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'smp-bf-tick';
      bar.setAttribute('role', 'button');
      bar.setAttribute('tabindex', '0');
      bar.setAttribute('aria-label', 'Black Friday: 20% korting op alle Guards met code ' + CODE + '. Bekijk de aanbieding.');
      bar.innerHTML = '<div class="tk-track">' + tickItems() + '</div><button type="button" class="tk-x" aria-label="Balk verbergen">&times;</button>';
      bar.addEventListener('click', function (e) {
        if (e.target.closest('.tk-x')) { set(KEY_PILL, Date.now() + 864e5); hideTick(true); return; }
        openPopup();
      });
      bar.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopup(); } });
      document.body.appendChild(bar);
      var upd = function () {
        Array.prototype.forEach.call(bar.querySelectorAll('.tk-left'), function (x) { x.textContent = shortLeft().replace('nog', 'Nog'); });
        if (Date.now() >= END) hideTick(true);
      };
      upd(); tickT = setInterval(upd, 30000);
    }
    document.body.classList.add('smp-bf-pad');
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (bar) bar.classList.add('is-on'); }); });
  }

  function hideTick(remove) {
    if (!bar) return;
    bar.classList.remove('is-on');
    if (remove) {
      clearInterval(tickT);
      document.body.classList.remove('smp-bf-pad');
      var old = bar; bar = null;
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 400);
    }
  }

  /* ---------- blok in de gidsen ---------- */
  function upgradeBlocks() {
    var blocks = document.querySelectorAll('.maker-block');
    if (!blocks.length) return;
    css();
    Array.prototype.forEach.call(blocks, function (b) {
      if (b.classList.contains('bf-on')) return;
      b.classList.add('bf-on');
      var media = b.querySelector('.maker-media');
      if (media) slideshow(media, 3400);
      var body = b.querySelector('.maker-body') || b;
      var label = body.querySelector('.maker-label');
      var rib = document.createElement('p');
      rib.className = 'bf-ribbon';
      rib.innerHTML = 'Black Friday <i>-20%</i><span class="bf-rl">' + shortLeft() + '</span>';
      if (label) label.parentNode.insertBefore(rib, label.nextSibling); else body.insertBefore(rib, body.firstChild);
      var pr = body.querySelector('.maker-price');
      if (pr) {
        var pt = document.createElement('div');
        pt.className = 'bf-pt';
        pt.innerHTML = P.map(function (x) { return '<div><span>' + x[0] + '</span><span><s>' + eur(x[1]) + '</s><b>' + eur(off(x[1])) + '</b></span></div>'; }).join('');
        pr.classList.add('bf-hide');
        pr.parentNode.insertBefore(pt, pr.nextSibling);
        var cl = document.createElement('p');
        cl.className = 'bf-codeline';
        cl.innerHTML = '<span>Code bij het afrekenen</span><b>' + CODE + '</b>';
        pt.parentNode.insertBefore(cl, pt.nextSibling);
      }
      Array.prototype.forEach.call(b.querySelectorAll('a[href*="mintarca.com"]'), function (a) {
        a.href = link('gids');
      });
      var btn = b.querySelector('.maker-btn');
      if (btn) btn.textContent = 'Shop met 20% korting';
      /* rustiger blok tijdens de actie: algemene producttekst, kleurbolletjes en tweede link weg */
      Array.prototype.forEach.call(body.querySelectorAll('.maker-sw, .maker-link'), function (x) { x.classList.add('bf-hide'); });
      if (body.querySelector('.maker-lead')) Array.prototype.forEach.call(body.children, function (x) {
        if (x.tagName === 'P' && !x.className) x.classList.add('bf-hide');
      });
    });
    setInterval(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.bf-rl'), function (s) { s.textContent = shortLeft(); });
    }, 60000);
  }

  /* ---------- start ---------- */
  upgradeBlocks();
  if (SKIP.test(location.pathname)) return;

  setTimeout(showTick, 1200);
  var popupOff = get(KEY) > Date.now();
  if (popupOff) return;

  function trigger() {
    if (shown) return;
    if (document.getElementById('smp-cookie-banner')) { setTimeout(trigger, 2500); return; }
    shown = true;
    window.removeEventListener('scroll', onScroll);
    openPopup();
  }
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && window.scrollY / h > 0.25) trigger();
  }
  setTimeout(function () { window.addEventListener('scroll', onScroll, { passive: true }); }, 2500);
  setTimeout(trigger, 6000);
})();
