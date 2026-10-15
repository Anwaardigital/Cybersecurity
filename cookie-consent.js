/* Cookie consent + consent-gated Google Analytics (GDPR) */
(function () {
  'use strict';
  var GA_ID = 'G-T6WVGJVD4J';
  var KEY = 'ad_cookie_consent_v1';

  function loadGA() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  function hideBanner() {
    var b = document.getElementById('adCookieBanner');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function showBanner() {
    if (document.getElementById('adCookieBanner')) return;
    if (!document.body) return;
    var b = document.createElement('div');
    b.id = 'adCookieBanner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie consent');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;' +
      'background:#0d2818;color:#ffffff;padding:14px 18px;display:flex;flex-wrap:wrap;' +
      'gap:12px;align-items:center;justify-content:center;font-size:14px;line-height:1.5;' +
      'box-shadow:0 -2px 18px rgba(0,0,0,.35);font-family:inherit';
    var cookieEmoji = String.fromCharCode(0xD83C, 0xDF6A);
    b.innerHTML =
      '<span style="max-width:640px">' + cookieEmoji + ' We use cookies for analytics (Google Analytics) ' +
      'to understand visits and improve our website. Accept to allow analytics cookies, or decline.</span>' +
      '<span style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button type="button" id="adCookieAccept" style="background:#d4af37;color:#0A3D2E;border:0;' +
      'border-radius:20px;padding:9px 28px;font-weight:700;cursor:pointer;font-size:14px">Accept</button>' +
      '<button type="button" id="adCookieDecline" style="background:transparent;color:#ffffff;' +
      'border:1px solid #ffffff;border-radius:20px;padding:9px 24px;cursor:pointer;font-size:14px">Decline</button>' +
      '</span>';
    document.body.appendChild(b);
    document.getElementById('adCookieAccept').onclick = function () {
      try { localStorage.setItem(KEY, 'accepted'); } catch (e) {}
      hideBanner(); loadGA();
    };
    document.getElementById('adCookieDecline').onclick = function () {
      try { localStorage.setItem(KEY, 'declined'); } catch (e) {}
      hideBanner();
    };
  }

  function init() {
    var c = null;
    try { c = localStorage.getItem(KEY); } catch (e) {}
    if (c === 'accepted') { loadGA(); return; }
    if (c === 'declined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }

  init();
})();
