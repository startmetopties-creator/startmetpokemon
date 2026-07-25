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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
