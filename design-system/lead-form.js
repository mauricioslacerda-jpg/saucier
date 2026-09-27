/* Saucier — um só tratador para todo formulário do Hotmart Send da casa.
   Criado em 2026-09-27 para consertar dois defeitos que a auditoria achou:

   1. FALTAVA EVENTO NO BLOG. O bloco de captura que entrou nos 26 posts e no índice era
      HTML puro, sem JavaScript nenhum. Ele postava para o Send e pronto: não disparava
      `generate_lead` nem `fbq('track','Lead')`. Só a home tinha tratador, e ele era inline.
      Resultado: 27 páginas novas capturariam e-mail sem que Meta ou GA4 soubessem.

   2. CORRIDA COM A NAVEGAÇÃO. O tratador da home empurrava no dataLayer e deixava o
      formulário navegar na sequência. O `fbq` é chamada direta e sobrevive; o caminho
      dataLayer → GTM → GA4 é assíncrono e pode nunca chegar a disparar antes de a página
      sair. Aqui o envio espera o `eventCallback` do GTM, com teto de 1,2 s para o caso de o
      GTM estar bloqueado ou ausente — o e-mail NUNCA deixa de ser enviado por causa disto.

   Carregado em toda página pública, depois do consent.js. Cobre a home, o rodapé dos posts,
   o índice do blog e o pop-up. */
(function () {
  "use strict";

  var TETO_MS = 1200;

  function origemDo(form) {
    if (form.closest("#popup-lead")) return "popup";
    if (form.closest(".captura-lead")) return "captura-rodape";
    var sec = form.closest("section,header");
    return (sec && sec.id) || "captura";
  }

  /* Repassa os parâmetros da URL (utm_*, gclid, fbclid, src…) para o handler do Send,
     sem perder os que a própria action já carrega (hotfeature). */
  function repassaParametros(form) {
    try {
      var daPagina = window.location.search.replace(/^\?/, "");
      if (!daPagina) return;
      var u = new URL(form.action);
      var atuais = u.searchParams.toString();
      form.action = u.origin + u.pathname + "?" + (atuais ? atuais + "&" : "") + daPagina;
    } catch (e) { /* URL inválida: deixa a action como está */ }
  }

  function liga(form) {
    if (form.dataset.saucierLigado) return;
    form.dataset.saucierLigado = "1";
    repassaParametros(form);

    form.addEventListener("submit", function (ev) {
      if (form.dataset.saucierLiberado === "1") return;   // segunda passada: deixa ir
      ev.preventDefault();

      var seguiu = false;
      function segue() {
        if (seguiu) return;
        seguiu = true;
        form.dataset.saucierLiberado = "1";
        form.submit();   // não redispara o evento, e a validação do HTML já passou
      }

      try {
        if (typeof fbq === "function") fbq("track", "Lead");
      } catch (e) {}

      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "generate_lead",
          form_id: origemDo(form),
          currency: "BRL",
          value: 0,
          eventCallback: segue,
          eventTimeout: TETO_MS
        });
      } catch (e) {}

      setTimeout(segue, TETO_MS);   // rede de segurança: sem GTM, o envio sai assim mesmo
    });
  }

  function varre(raiz) {
    (raiz || document).querySelectorAll("form[klicksend-form-id]").forEach(liga);
  }

  document.addEventListener("DOMContentLoaded", function () { varre(document); });

  /* O pop-up nasce depois do DOMContentLoaded — ele avisa quando abre. */
  document.addEventListener("saucier:popup-aberto", function (ev) {
    varre((ev && ev.detail) || document);
  });
})();
