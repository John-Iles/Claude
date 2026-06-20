(function () {
  'use strict';

  var COOKIE_NAME = 'picked_consent';
  var COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

  function getCookie(name) {
    var re = new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
    var m = document.cookie.match(re);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setCookie(name, value, maxAge) {
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = [
      name + '=' + encodeURIComponent(value),
      'max-age=' + maxAge,
      'path=/',
      'SameSite=Lax' + secure
    ].join('; ');
  }

  function loadGA4() {
    var id = document.documentElement.dataset.ga4 || document.body.dataset.ga4;
    if (!id || window.gtag) return;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);

    // Track waitlist sign-up after consent
    document.addEventListener('waitlist:signed_up', function () {
      if (window.gtag) window.gtag('event', 'waitlist_signup');
    });
  }

  function applyConsent(accepted) {
    if (window.Shopify && window.Shopify.customerPrivacy) {
      window.Shopify.customerPrivacy.setTrackingConsent(
        {
          sale_of_data: false,
          analytics: accepted,
          marketing: accepted,
          preferences: accepted
        },
        function () {}
      );
    }
    if (accepted) loadGA4();
  }

  var banner = document.getElementById('consent-banner');
  if (!banner) return;

  // Already chose — apply silently and bail
  var stored = getCookie(COOKIE_NAME);
  if (stored) {
    if (stored === 'accepted') applyConsent(true);
    return;
  }

  // Show banner
  banner.removeAttribute('hidden');

  var acceptBtn = banner.querySelector('#consent-accept');
  var rejectBtn = banner.querySelector('#consent-reject');

  // Focus trap within banner
  var focusable = banner.querySelectorAll('a[href], button:not([disabled]), [tabindex]');
  var first = focusable[0];
  var last  = focusable[focusable.length - 1];

  if (first) first.focus();

  banner.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    // Escape = reject (conservative default)
    if (e.key === 'Escape') decide(false);
  });

  function decide(accepted) {
    setCookie(COOKIE_NAME, accepted ? 'accepted' : 'rejected', COOKIE_MAX_AGE);
    applyConsent(accepted);
    banner.setAttribute('hidden', '');
  }

  if (acceptBtn) acceptBtn.addEventListener('click', function () { decide(true); });
  if (rejectBtn) rejectBtn.addEventListener('click', function () { decide(false); });
})();
