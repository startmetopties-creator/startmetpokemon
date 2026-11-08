/* MintArca-promo, eigen merk van de makers van deze site.
 * Desktop: kaart in het midden met donkere achtergrond. Mobiel: compacte balk onderaan
 * (geen schermvullende pop-up, Google straft dat af op mobiel).
 * Verschijnt na 40% scrollen of 20 seconden, nooit tijdens de cookiebanner.
 * Weggeklikt: 7 dagen stil. Geklikt: 30 dagen stil.
 */
(function () {
  var KEY = 'smp_promo_until';
  var SKIP = /^\/(disclaimer|privacyverklaring|contact|bedankt|bedankt-nieuwsbrief|404|hoe-wij-werken)(\.html)?$/;
  var CAMP = encodeURIComponent((location.pathname.replace(/\.html$/, '').replace(/^\/|\/$/g, '') || 'home').replace(/\//g, '-'));
  var URL = 'https://mintarca.com/discount/WELCOME10?redirect=%2Fnl%2Fcollections%2Fall' +
    '&utm_source=startmetpokemon&utm_medium=popup&utm_campaign=' + CAMP;

  function now() { return Date.now(); }
  function blocked() { try { return parseInt(localStorage.getItem(KEY) || '0', 10) > now(); } catch (e) { return false; } }
  function snooze(days) { try { localStorage.setItem(KEY, String(now() + days * 864e5)); } catch (e) {} }

  if (SKIP.test(location.pathname) || blocked()) return;

  var mobile = window.matchMedia('(max-width: 640px)').matches;
  var shown = false, el;

  var SW = [['#c0262b','#111'],['#2a2a2a','#cfd3d6'],['#1f5fbf','#111'],['#2f8f4e','#cfd3d6'],['#111','#111'],['#111','#6b3fa0'],
            ['#b3122a','#b3122a'],['#f2d21b','#111'],['#c9a24a','#f0d78c'],['#1f5fbf','#7b3fc4'],['#f07a1a','#f07a1a']]
    .map(function (c) { return '<i style="background:linear-gradient(135deg,' + c[0] + ' 0 50%,' + c[1] + ' 50% 100%)"></i>'; }).join('');

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '#smp-promo{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,8,14,.62);opacity:0;transition:opacity .3s ease;font-family:Figtree,system-ui,sans-serif}',
      '#smp-promo.is-on{opacity:1}',
      '#smp-promo .pr-card{position:relative;display:grid;grid-template-columns:300px 1fr;width:760px;max-width:100%;background:#F4F3F0;color:#111;border-radius:8px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);transform:translateY(16px) scale(.98);transition:transform .35s ease}',
      '#smp-promo.is-on .pr-card{transform:none}',
      '#smp-promo .pr-img{background:#ebeae6 url(/assets/guard-popup.webp) 50% 85%/cover no-repeat;min-height:380px}',
      '#smp-promo .pr-body{padding:34px 34px 28px}',
      '#smp-promo .pr-label{font-size:.62rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:#6b6e70;margin:0 0 12px}',
      '#smp-promo .pr-h{font-family:"DM Serif Display",Georgia,serif;font-size:2rem;line-height:1.1;margin:0 0 10px;font-weight:400;color:#111}',
      '#smp-promo .pr-t{font-size:.95rem;line-height:1.5;color:#3d3f41;margin:0 0 16px}',
      '#smp-promo ul{list-style:none;padding:0;margin:0 0 16px;font-size:.88rem;color:#111}',
      '#smp-promo li{padding-left:22px;position:relative;margin:0 0 6px}',
      '#smp-promo li:before{content:"";position:absolute;left:2px;top:5px;width:10px;height:6px;border-left:2px solid #111;border-bottom:2px solid #111;transform:rotate(-45deg)}',
      '#smp-promo .pr-sw{display:flex;gap:5px;margin:0 0 20px}',
      '#smp-promo .pr-sw i{width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}',
      '#smp-promo .pr-code{display:flex;align-items:center;justify-content:space-between;border:1.5px dashed #b5b2ab;border-radius:6px;padding:9px 12px;margin:0 0 12px;font-size:.85rem;color:#3d3f41}',
      '#smp-promo .pr-code b{font-size:1rem;letter-spacing:.08em;color:#111}',
      '#smp-promo .pr-btn{display:block;text-align:center;background:#111;color:#fff;font-weight:600;font-size:1rem;padding:14px 18px;border-radius:999px;text-decoration:none}',
      '#smp-promo .pr-btn:hover{background:#333}',
      '#smp-promo .pr-no{display:block;margin:12px auto 0;background:none;border:0;color:#6b6e70;font-size:.82rem;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
      '#smp-promo .pr-x{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.85);color:#111;font-size:22px;line-height:1;cursor:pointer}',
      /* mobiel: balk onderaan */
      '#smp-promo.is-mob{inset:auto 0 0 0;padding:0 10px 10px;background:none;align-items:flex-end}',
      '#smp-promo.is-mob .pr-card{grid-template-columns:86px 1fr;border-radius:10px;transform:translateY(30px)}',
      '#smp-promo.is-mob.is-on .pr-card{transform:none}',
      '#smp-promo.is-mob .pr-img{min-height:0}',
      '#smp-promo.is-mob .pr-body{padding:12px 40px 12px 12px}',
      '#smp-promo.is-mob .pr-label{font-size:.55rem;margin:0 0 4px}',
      '#smp-promo.is-mob .pr-h{font-size:1.1rem;margin:0 0 4px}',
      '#smp-promo.is-mob .pr-t{font-size:.78rem;margin:0 0 8px}',
      '#smp-promo.is-mob ul,#smp-promo.is-mob .pr-sw,#smp-promo.is-mob .pr-code,#smp-promo.is-mob .pr-no{display:none}',
      '#smp-promo.is-mob .pr-btn{padding:9px 12px;font-size:.85rem}',
      '#smp-promo.is-mob .pr-x{top:6px;right:6px;width:28px;height:28px;font-size:18px;background:none}'
    ].join('');
    document.head.appendChild(s);
  }

  function build() {
    el = document.createElement('div');
    el.id = 'smp-promo';
    if (mobile) el.className = 'is-mob';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Aanbieding van de makers van deze site');
    el.innerHTML =
      '<div class="pr-card">' +
        '<button type="button" class="pr-x" aria-label="Sluiten">&times;</button>' +
        '<div class="pr-img" role="img" aria-label="PSA-slabs in een Guard-hoes"></div>' +
        '<div class="pr-body">' +
          '<p class="pr-label">Van de makers van deze site</p>' +
          '<p class="pr-h">10% korting op je eerste Guards</p>' +
          '<p class="pr-t">' + (mobile ? 'TPU-hoes voor je PSA-slab, vanaf &euro;7,95.' : 'Een flexibele TPU-hoes voor je PSA-slab. Beschermt tegen stoten en krassen, de voorkant blijft open.') + '</p>' +
          '<ul><li>Vanaf &euro;7,95, 5 voor &euro;29,95</li><li>Verzonden vanuit Utrecht, binnen 1 tot 2 werkdagen</li><li>Gratis verzending vanaf &euro;60</li></ul>' +
          '<div class="pr-sw" aria-label="11 kleuren">' + SW + '</div>' +
          '<div class="pr-code"><span>Jouw code</span><b>WELCOME10</b></div>' +
          '<a class="pr-btn" href="' + URL + '" target="_blank" rel="sponsored noopener">Claim 10% korting</a>' +
          '<button type="button" class="pr-no">Nee, bedankt</button>' +
        '</div>' +
      '</div>';
    function close() { snooze(7); hide(); }
    el.querySelector('.pr-x').addEventListener('click', close);
    el.querySelector('.pr-no').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    el.querySelector('.pr-btn').addEventListener('click', function () { snooze(30); hide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && shown) close(); });
    document.body.appendChild(el);
  }

  function hide() {
    if (!el) return;
    el.classList.remove('is-on');
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 350);
  }

  function show() {
    if (shown || blocked()) return;
    if (document.getElementById('smp-cookie-banner')) { setTimeout(show, 3000); return; }
    shown = true;
    css(); build();
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-on'); }); });
    window.removeEventListener('scroll', onScroll);
  }

  var ready = false;
  setTimeout(function () { ready = true; onScroll(); }, 8000);
  setTimeout(show, 20000);
  function onScroll() {
    if (!ready || shown) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && window.scrollY / h > 0.4) show();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
