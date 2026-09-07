/*
 * Start Met Pokémon: cookie consent + GA4 loader
 *
 * Advanced consent mode (sinds 7 september 2026).
 *
 * De GA4-tag wordt altijd geladen, met analytics_storage op 'denied' tot de
 * bezoeker accepteert. Zonder toestemming worden er geen cookies gezet of
 * gelezen en is er geen persistente gebruikers-id; de hits komen wel binnen.
 * Na acceptatie schakelt consent mode om naar 'granted' en gaat GA4 pas
 * cookies gebruiken.
 *
 * Wie expliciet op "Weigeren" klikt, krijgt de tag vanaf de volgende pagina
 * helemaal niet meer geladen: dan gaat er niets naar Google.
 *
 * Hiervoor gold: de tag werd pas geladen na acceptatie, waardoor ook iedereen
 * die de banner simpelweg negeerde volledig onzichtbaar bleef.
 *
 * Storage:
 *   localStorage.smp_consent = 'granted' | 'denied'
 *
 * Revoke: visitor can click the small "Cookies" link in the footer to
 * reopen the banner.
 */
(function () {
  'use strict';

  var GA_ID = 'G-60MNJH2PLR';
  var STORAGE_KEY = 'smp_consent';

  // Google Consent Mode v2 defaults: deny everything until granted.
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  // Geen advertentiedoeleinden op deze site: strip advertentie-identifiers
  // uit de verzoeken zolang ad_storage geweigerd is.
  gtag('set', 'ads_data_redaction', true);

  function loadGA() {
    if (window.__smpGaLoaded) return;
    window.__smpGaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function grantAnalytics() {
    try { localStorage.setItem(STORAGE_KEY, 'granted'); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }

  function denyAnalytics() {
    try { localStorage.setItem(STORAGE_KEY, 'denied'); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  // Build the banner DOM
  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.id = 'smp-cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-label', 'Cookie-toestemming');
    wrap.innerHTML = [
      '<div class="smp-cb-inner">',
        '<div class="smp-cb-text">',
          '<strong>Cookies?</strong> We meten anoniem hoe de site wordt gebruikt ',
          '(Google Analytics 4). Zonder jouw akkoord gebeurt dat zonder cookies en ',
          'zonder dat we je herkennen. Geef je akkoord, dan mogen we bezoeken aan ',
          'elkaar koppelen. ',
          '<a href="/privacyverklaring">Lees meer</a>.',
        '</div>',
        '<div class="smp-cb-actions">',
          '<button type="button" class="smp-cb-btn smp-cb-deny" data-action="deny">Weigeren</button>',
          '<button type="button" class="smp-cb-btn smp-cb-accept" data-action="accept">Accepteren</button>',
        '</div>',
      '</div>'
    ].join('');
    return wrap;
  }

  function injectStyles() {
    if (document.getElementById('smp-cookie-style')) return;
    var css = [
      '#smp-cookie-banner{',
        'position:fixed;left:16px;right:16px;bottom:16px;z-index:9998;',
        "font-family:'Figtree',system-ui,sans-serif;",
        'background:#111827;color:#F1F5F9;',
        'border:1px solid #1E293B;border-radius:16px;',
        'padding:18px 22px;',
        'box-shadow:0 20px 60px rgba(0,0,0,0.5);',
        'max-width:760px;margin:0 auto;',
        'animation:smpCbIn .35s ease both;',
      '}',
      '@keyframes smpCbIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}',
      '.smp-cb-inner{display:flex;gap:20px;align-items:center;flex-wrap:wrap;}',
      '.smp-cb-text{flex:1 1 280px;font-size:.92rem;line-height:1.55;color:#CBD5E1;}',
      '.smp-cb-text strong{color:#F1F5F9;}',
      '.smp-cb-text a{color:#FACC15;text-decoration:underline;text-underline-offset:3px;}',
      '.smp-cb-actions{display:flex;gap:10px;flex-wrap:wrap;}',
      '.smp-cb-btn{',
        'cursor:pointer;border:none;border-radius:10px;',
        'padding:10px 18px;font-weight:600;font-size:.9rem;',
        "font-family:inherit;transition:background .15s,transform .1s;",
      '}',
      '.smp-cb-deny{background:#1E293B;color:#CBD5E1;}',
      '.smp-cb-deny:hover{background:#24324a;}',
      '.smp-cb-accept{background:#FACC15;color:#0A0E17;}',
      '.smp-cb-accept:hover{background:#fbe15a;}',
      '.smp-cb-btn:active{transform:translateY(1px);}',
      '@media(max-width:520px){',
        '#smp-cookie-banner{padding:16px 16px;}',
        '.smp-cb-actions{width:100%;}',
        '.smp-cb-btn{flex:1;}',
      '}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'smp-cookie-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function closeBanner() {
    var el = document.getElementById('smp-cookie-banner');
    if (el) el.remove();
  }

  function showBanner() {
    if (document.getElementById('smp-cookie-banner')) return;
    injectStyles();
    var banner = buildBanner();
    document.body.appendChild(banner);
    banner.addEventListener('click', function (ev) {
      var target = ev.target;
      if (!target || target.nodeName !== 'BUTTON') return;
      var action = target.getAttribute('data-action');
      if (action === 'accept') { grantAnalytics(); }
      else if (action === 'deny') { denyAnalytics(); }
      closeBanner();
    });
  }

  // Public API: footer link can re-open the banner
  window.smpCookies = {
    open: showBanner,
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      showBanner();
    }
  };

  // Intercept clicks on any element with [data-open-cookies]
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    while (t && t !== document) {
      if (t.hasAttribute && t.hasAttribute('data-open-cookies')) {
        ev.preventDefault();
        window.smpCookies.reset();
        return;
      }
      t = t.parentNode;
    }
  });

  // On page load:
  //   'granted'      -> consent op granted, tag laden, GA4 mag cookies gebruiken
  //   'denied'       -> tag helemaal niet laden, er gaat niets naar Google
  //   geen keuze     -> tag laden met consent denied (cookieloze hits) + banner
  function init() {
    var stored = getStored();

    if (stored === 'denied') {
      // Expliciet bezwaar. Niets laden, niets versturen.
      return;
    }

    if (stored === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }

    loadGA();

    if (stored !== 'granted') {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
