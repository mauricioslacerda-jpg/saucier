/* Saucier — aviso de cookies (LGPD) + captura de atribuição de origem.
   Incluído via <script src=".../design-system/consent.js" defer> em toda página pública.
   Não depende de caminho relativo (só manipula cookies/localStorage/DOM). */
(function () {
  "use strict";

  var CONSENT_COOKIE = "saucier_consent";
  var ATTR_KEY = "saucier_attr";
  var DAYS = 365;

  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax";
  }

  /* Captura básica + extra (UTM/click ids) no primeiro toque, sem sobrescrever depois (first-touch) */
  function captureAttribution() {
    try {
      var existing = localStorage.getItem(ATTR_KEY);
      if (existing) return;
      var params = new URLSearchParams(window.location.search);
      var data = {
        capturado_em: new Date().toISOString(),
        pagina_entrada: window.location.pathname,
        referrer: document.referrer || null,
        idioma: navigator.language || null,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_content: params.get("utm_content"),
        utm_term: params.get("utm_term"),
        gclid: params.get("gclid"),
        fbclid: params.get("fbclid")
      };
      localStorage.setItem(ATTR_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage indisponível (modo privado etc.) — segue sem capturar */ }
  }

  /* Libera scripts de marketing (GTM/Pixel) só depois do consentimento — chamados via evento */
  function grantConsent() {
    setCookie(CONSENT_COOKIE, "accepted", DAYS);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "consent_granted" });
    document.dispatchEvent(new CustomEvent("saucier:consent-granted"));
    hideBanner();
  }

  function declineConsent() {
    setCookie(CONSENT_COOKIE, "necessary_only", DAYS);
    hideBanner();
  }

  function hideBanner() {
    var el = document.getElementById("cookie-banner");
    if (el) el.classList.remove("show");
  }

  function buildBanner() {
    var el = document.createElement("div");
    el.id = "cookie-banner";
    el.innerHTML =
      '<p>Usamos cookies para melhorar sua experiência e entender como você chegou até aqui. ' +
      'Ao continuar navegando, você concorda com isso.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="cookie-decline">Só o essencial</button>' +
      '<button type="button" class="cookie-accept">Aceitar</button>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector(".cookie-accept").addEventListener("click", grantConsent);
    el.querySelector(".cookie-decline").addEventListener("click", declineConsent);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("show"); });
    });
  }

  captureAttribution();

  document.addEventListener("DOMContentLoaded", function () {
    if (!getCookie(CONSENT_COOKIE)) buildBanner();
  });
})();
