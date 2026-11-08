/* MintArca-promo: kleine slide-in, eigen merk van de makers van deze site.
 * Verschijnt na 45% scrollen of 25 seconden, nooit tijdens de cookiebanner.
 * Weggeklikt: 7 dagen niet meer. Geklikt: 30 dagen niet meer.
 * Bewust geen schermvullende pop-up: Google straft dat af op mobiel.
 */
(function () {
  var KEY = 'smp_promo_until';
  var SKIP = /^\/(disclaimer|privacyverklaring|contact|bedankt|bedankt-nieuwsbrief|404|hoe-wij-werken)(\.html)?$/;
  var URL = 'https://mintarca.com/discount/WELCOME10?redirect=%2Fcollections%2Fall' +
    '&utm_source=startmetpokemon&utm_medium=popup&utm_campaign=' +
    encodeURIComponent((location.pathname.replace(/\.html$/, '').replace(/^\/|\/$/g, '') || 'home').replace(/\//g, '-'));

  function now() { return Date.now(); }
  function blocked() {
    try { var u = parseInt(localStorage.getItem(KEY) || '0', 10); return u > now(); } catch (e) { return false; }
  }
  function snooze(days) {
    try { localStorage.setItem(KEY, String(now() + days * 864e5)); } catch (e) {}
  }

  if (SKIP.test(location.pathname) || blocked()) return;

  var shown = false, el;

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '#smp-promo{position:fixed;right:20px;bottom:20px;z-index:9000;width:360px;max-width:calc(100vw - 24px);background:#131A2A;color:#E8ECF3;border:1px solid rgba(255,255,255,.12);border-left:3px solid #FACC15;border-radius:4px;box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:Figtree,system-ui,sans-serif;transform:translateY(24px);opacity:0;transition:transform .35s ease,opacity .35s ease}',
      '#smp-promo.is-on{transform:none;opacity:1}',
      '#smp-promo .pr-in{display:grid;grid-template-columns:96px 1fr;gap:14px;padding:16px 16px 16px 14px}',
      '#smp-promo img{width:96px;height:96px;object-fit:cover;border-radius:3px;background:#f3f3f3;display:block}',
      '#smp-promo .pr-label{font-size:.6rem;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#FACC15;margin:0 0 6px;padding-right:22px}',
      '#smp-promo .pr-h{font-family:"DM Serif Display",Georgia,serif;font-size:1.2rem;line-height:1.2;margin:0 0 6px;color:#E8ECF3;font-weight:400}',
      '#smp-promo .pr-t{font-size:.85rem;line-height:1.45;color:#94A3B8;margin:0 0 12px}',
      '#smp-promo .pr-btn{display:block;text-align:center;background:#FACC15;color:#0A0E17;font-weight:700;font-size:.9rem;padding:10px 14px;border-radius:2px;text-decoration:none}',
      '#smp-promo .pr-btn:hover{opacity:.92}',
      '#smp-promo .pr-fine{font-size:.72rem;color:#7C8CA6;margin:8px 0 0}',
      '#smp-promo .pr-x{position:absolute;top:6px;right:6px;width:30px;height:30px;border:0;background:none;color:#94A3B8;font-size:20px;line-height:1;cursor:pointer}',
      '#smp-promo .pr-x:hover{color:#fff}',
      '@media (max-width:600px){#smp-promo{right:12px;left:12px;bottom:12px;width:auto}#smp-promo .pr-in{grid-template-columns:72px 1fr;gap:12px;padding:12px 12px 12px 10px}#smp-promo img{width:72px;height:72px}#smp-promo .pr-h{font-size:1.05rem;padding-right:22px}#smp-promo .pr-t{display:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  function build() {
    el = document.createElement('aside');
    el.id = 'smp-promo';
    el.setAttribute('aria-label', 'Aanbieding van de makers van deze site');
    el.innerHTML =
      '<button type="button" class="pr-x" aria-label="Sluiten">&times;</button>' +
      '<div class="pr-in">' +
        '<img src="/assets/guard-fan.webp" width="96" height="96" alt="PSA-slabs in een Guard-hoes">' +
        '<div>' +
          '<p class="pr-label">Van de makers van deze site</p>' +
          '<p class="pr-h">10% korting op je eerste Guards</p>' +
          '<p class="pr-t">Een TPU-hoes voor je PSA-slab tegen krassen en stoten. Elf kleuren, vanaf 7,95 euro.</p>' +
          '<a class="pr-btn" href="' + URL + '" target="_blank" rel="sponsored noopener">Pak 10% korting</a>' +
          '<p class="pr-fine">Code WELCOME10 gaat er vanzelf af. Gratis verzending vanaf 60 euro.</p>' +
        '</div>' +
      '</div>';
    el.querySelector('.pr-x').addEventListener('click', function () { snooze(7); hide(); });
    el.querySelector('.pr-btn').addEventListener('click', function () { snooze(30); hide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && shown) { snooze(7); hide(); } });
    document.body.appendChild(el);
  }

  function hide() {
    if (!el) return;
    el.classList.remove('is-on');
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 400);
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
  setTimeout(show, 25000);
  function onScroll() {
    if (!ready || shown) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && window.scrollY / h > 0.45) show();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
