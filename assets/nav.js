/*
 * Start Met Pokémon — toegankelijkheid van de navigatie-dropdown.
 *
 * Het menu opent via CSS (:hover en :focus-within). Dat werkt prima met muis
 * en toetsenbord, maar een screenreader krijgt niet te horen dat er iets is
 * opengeklapt, want aria-expanded stond nergens.
 *
 * Dit script verandert niets aan het gedrag; het spiegelt alleen de toestand
 * die CSS al bepaalt naar aria-expanded. Escape sluit het menu door de focus
 * terug te zetten op de knop.
 */
(function () {
  'use strict';

  function init() {
    var groups = document.querySelectorAll('.nav-dd');
    if (!groups.length) return;

    Array.prototype.forEach.call(groups, function (dd) {
      var btn = dd.querySelector('.nav-dd-btn');
      if (!btn) return;

      btn.setAttribute('aria-expanded', 'false');

      var set = function (open) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      };

      dd.addEventListener('mouseenter', function () { set(true); });
      dd.addEventListener('mouseleave', function () {
        if (!dd.contains(document.activeElement)) set(false);
      });
      dd.addEventListener('focusin', function () { set(true); });
      dd.addEventListener('focusout', function () {
        // focusout vuurt vóór de focus elders staat; even wachten.
        window.setTimeout(function () {
          if (!dd.contains(document.activeElement)) set(false);
        }, 0);
      });
      dd.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && dd.contains(document.activeElement)) {
          btn.focus();
          set(false);
        }
      });
    });
  }

  /* Hamburger: opent en sluit het mobiele menu. Doet niets op pagina's
     zonder .nav-hamburger-knop, dus veilig om overal te laden. */
  function initHamburger() {
    var btn = document.querySelector('.nav-hamburger');
    if (!btn) return;
    var nav = btn.closest ? btn.closest('nav') : null;
    if (!nav) return;

    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    Array.prototype.forEach.call(document.querySelectorAll('.nav-links a'), function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function loadPromo() {
    var s = document.createElement('script');
    s.src = '/assets/promo.js?v=20261108c';
    s.defer = true;
    document.body.appendChild(s);
  }

  // Klikmeting richting MintArca: per pagina en per plek (blok, popup, tekstlink).
  // GA4-event 'mintarca_click'. Zonder cookie-toestemming gaat het als cookieloze hit (consent mode).
  function trackMintarca() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href*="mintarca.com"]') : null;
      if (!a || typeof window.gtag !== 'function') return;
      var q = {};
      try { new URL(a.href).searchParams.forEach(function (v, k) { q[k] = v; }); } catch (err) {}
      var plek = a.closest('.maker-block') ? 'blok' : (q.utm_medium === 'popup' ? 'popup' : 'tekst');
      window.gtag('event', 'mintarca_click', {
        plek: plek,
        campagne: q.utm_campaign || '',
        inhoud: q.utm_content || '',
        link_url: a.href.split('?')[0]
      });
    }, true);
  }

  function start() {
    init();
    initHamburger();
    loadPromo();
    trackMintarca();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
