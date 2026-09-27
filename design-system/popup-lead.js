/* Saucier — pop-up de captura com memória.
   Spec: keter/malkuth/saucier/popup-e-captura-2026-09-24.md
   Depende do consent.js: só aparece depois que o banner de LGPD foi resolvido.
   Estilo é injetado aqui para funcionar em qualquer página (home, curso, blog) sem CSS novo.

   Copy = EBOOK, por decisão do fundador em 24/09/2026: "é melhor o pop-up com o ebook
   gratuito, para captura de lead". Não é provisório — é a escolha feita.
   Motivo: o ebook não toca em preço, não reduz a comissão do afiliado e não conflita com a
   regra "cupom não é do afiliado" do kit. Desconto é alavanca de fim de funil; pop-up é topo.
   Se um dia virar cupom, mexe-se em TITULO, LINHA e BOTAO — e só depois que o cupom existir
   no painel da Hotmart, porque prometer desconto inexistente quebra no clique. */
(function () {
  "use strict";

  var TITULO = "Leva o ebook antes de sair";
  var LINHA  = "10 receitas de pesto, do clássico genovês ao de azeitona. Chega no seu e-mail em um minuto.";
  var BOTAO  = "Quero o ebook grátis";

  var FORM_ID   = "1zuPpn4";
  var KEY       = "saucier_popup";
  var KEY_CK    = "saucier_popup_st";
  /* Regra de frequencia, apertada por decisao do fundador em 24/09/2026:
     "o pop-up nao deve ser repetitivo para a mesma pessoa".
     - quem fecha no X so volta a ver depois de 30 DIAS (nao 24 h);
     - no maximo 2 aparicoes na vida do navegador (nao 3);
     - depois da segunda, vira "nunca" sozinho e nao volta mais;
     - o cookie dura 400 dias, que e o teto que o Chrome aceita. */
  var MIN_HORAS = 24 * 30;   // 30 dias
  var MAX_VEZES = 2;
  var BLOQUEADAS = ["/obrigado/", "/curso/", "/versao-antiga/"];

  function ler() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var ck = document.cookie.match(/(?:^|; )saucier_popup_st=([^;]*)/);
    return ck ? { estado: decodeURIComponent(ck[1]), vezes: 0, visto_em: null } : null;
  }

  function gravar(st) {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    var d = new Date();
    d.setTime(d.getTime() + 400 * 864e5);   // 400 dias = teto do Chrome
    document.cookie = KEY_CK + "=" + encodeURIComponent(st.estado) +
                      "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax";
  }

  function marcar(estado) {
    var st = ler() || { vezes: 0 };
    st.estado = estado;
    st.visto_em = Date.now();
    if (estado === "adiado") {
      st.vezes = (st.vezes || 0) + 1;
      // esgotou a cota: nao e mais "adiado", e "nunca" — e nunca mais volta
      if (st.vezes >= MAX_VEZES) st.estado = "nunca";
    }
    gravar(st);
  }

  function podeMostrar() {
    for (var i = 0; i < BLOQUEADAS.length; i++) {
      if (location.pathname.indexOf(BLOQUEADAS[i]) === 0) return false;
    }
    // o banner de LGPD tem prioridade: sem decisão de consentimento, o pop-up espera
    if (!document.cookie.match(/saucier_consent=/)) return false;
    var st = ler();
    if (!st) return true;
    if (st.estado === "nunca" || st.estado === "convertido") return false;
    if ((st.vezes || 0) >= MAX_VEZES) return false;
    if (st.visto_em && (Date.now() - st.visto_em) < MIN_HORAS * 36e5) return false;
    return true;
  }

  function estilo() {
    if (document.getElementById("popup-lead-css")) return;
    var s = document.createElement("style");
    s.id = "popup-lead-css";
    s.textContent =
      '#popup-lead{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;' +
      'justify-content:center;background:hsl(26 32% 6% / .62);padding:16px;' +
      'opacity:0;transition:opacity 200ms cubic-bezier(.4,0,.2,1)}' +
      '#popup-lead.show{opacity:1}' +
      '#popup-lead .cx{background:hsl(40 44% 98%);color:hsl(26 32% 6%);max-width:420px;width:100%;' +
      'border-radius:.5rem;padding:28px 24px 20px;position:relative;box-shadow:0 12px 32px hsl(20 30% 10% / .28);' +
      'transform:translateY(8px);transition:transform 200ms cubic-bezier(.4,0,.2,1);max-height:92vh;overflow:auto}' +
      '#popup-lead.show .cx{transform:none}' +
      '#popup-lead h2{font-family:"Bebas Neue",Impact,sans-serif;letter-spacing:.02em;' +
      'font-size:1.953rem;line-height:1.1;margin:0 0 8px}' +
      '#popup-lead p{font-size:.875rem;line-height:1.5;margin:0 0 16px;color:hsl(26 18% 32%)}' +
      '#popup-lead input[type=email],#popup-lead input[type=tel]{width:100%;box-sizing:border-box;' +
      'padding:12px 14px;margin-bottom:10px;border:1px solid hsl(34 24% 86%);border-radius:.3rem;' +
      'font:inherit;font-size:1rem;background:#fff}' +
      '#popup-lead .gdpr{display:flex;gap:8px;align-items:flex-start;margin:4px 0 14px;' +
      'font-size:.75rem;line-height:1.4;color:hsl(27 14% 44%)}' +
      '#popup-lead .gdpr input{margin-top:2px;flex:0 0 auto}' +
      '#popup-lead button.ok{width:100%;padding:13px 18px;border:0;border-radius:9999px;' +
      'background:hsl(19 76% 45%);color:hsl(40 44% 98%);font-family:"Bebas Neue",Impact,sans-serif;' +
      'letter-spacing:.04em;font-size:1.25rem;cursor:pointer}' +
      '#popup-lead button.ok:hover{background:hsl(19 78% 38%)}' +
      '#popup-lead .x{position:absolute;top:8px;right:10px;background:none;border:0;font-size:26px;' +
      'line-height:1;color:hsl(28 14% 60%);cursor:pointer;padding:4px 8px}' +
      '#popup-lead .nunca{display:block;width:100%;margin-top:12px;background:none;border:0;' +
      'font-size:.75rem;color:hsl(28 14% 60%);text-decoration:underline;cursor:pointer}' +
      '@media (max-width:420px){#popup-lead .cx{padding:24px 18px 16px}#popup-lead h2{font-size:1.563rem}}';
    document.head.appendChild(s);
  }

  function abrir(prefixo) {
    estilo();
    var el = document.createElement("div");
    el.id = "popup-lead";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "popup-lead-titulo");
    el.innerHTML =
      '<div class="cx">' +
        '<button type="button" class="x" aria-label="Fechar">&times;</button>' +
        '<h2 id="popup-lead-titulo">' + TITULO + '</h2>' +
        '<p>' + LINHA + '</p>' +
        '<form klicksend-form-id="' + FORM_ID + '" autocomplete="off" method="post" ' +
              'action="https://handler.send.hotmart.com/subscription/' + FORM_ID + '?hotfeature=53">' +
          '<input type="email" name="email" placeholder="Seu melhor e-mail" required>' +
          '<input type="tel" name="phone" placeholder="Seu WhatsApp" required>' +
          '<div klicksend-gdpr-text style="display:none"><p>Esses dados serão utilizados para entrarmos ' +
            'em contato com você e disponibilizarmos mais conteúdos e ofertas. Caso você não queira mais ' +
            'receber os nossos e-mails, cada e-mail que você receber incluirá, ao final, um link para ' +
            'remover o seu e-mail da nossa lista.</p></div>' +
          '<div class="gdpr">' +
            '<input type="checkbox" name="gdpr" id="gdpr-popup" value="Concordo em receber os e-mails" required>' +
            '<label for="gdpr-popup">Concordo em receber e-mails com receitas e novidades da Saucier.</label>' +
          '</div>' +
          '<div style="position:absolute;left:-5000px" aria-hidden="true">' +
            '<input type="text" autocomplete="new-password" name="b_' + FORM_ID + '" tabindex="-1" value="">' +
          '</div>' +
          '<button klicksend-form-submit-id="' + FORM_ID + '" class="ok" type="submit">' + BOTAO + '</button>' +
        '</form>' +
        '<button type="button" class="nunca">Não quero ver isso de novo</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("show"); });
    });

    function fecha(estado) {
      marcar(estado);
      el.remove();
      document.removeEventListener("keydown", onEsc);
    }
    function onEsc(ev) { if (ev.key === "Escape") fecha("adiado"); }

    el.querySelector(".x").addEventListener("click", function () { fecha("adiado"); });
    el.querySelector(".nunca").addEventListener("click", function () { fecha("nunca"); });
    el.addEventListener("click", function (ev) { if (ev.target === el) fecha("adiado"); });
    document.addEventListener("keydown", onEsc);

    /* Quem dispara generate_lead e Lead e o lead-form.js, que trata TODO formulario do
       Send da casa. Aqui so se guarda o estado, senao o evento sairia duas vezes. */
    el.querySelector("form").addEventListener("submit", function () {
      marcar("convertido");
    });

    /* Avisa o lead-form.js que nasceu um formulario novo depois do DOMContentLoaded. */
    document.dispatchEvent(new CustomEvent("saucier:popup-aberto", { detail: el }));

    var em = el.querySelector('input[type=email]');
    if (em) em.focus();

    marcar("adiado"); // a exibição já conta
  }

  /* Ponte com a base da Hotmart: link de e-mail com ?lead=1 marca este navegador */
  try {
    if (new URLSearchParams(location.search).get("lead") === "1") {
      gravar({ estado: "convertido", vezes: 0, visto_em: Date.now() });
    }
  } catch (e) {}

  /* Quem chega em /obrigado/ acabou de se cadastrar */
  if (location.pathname.indexOf("/obrigado/") === 0) {
    gravar({ estado: "convertido", vezes: 0, visto_em: Date.now() });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var disparou = false;
    function dispara() {
      if (disparou || !podeMostrar()) return;
      disparou = true;
      abrir();
    }
    setTimeout(dispara, 20000);
    window.addEventListener("scroll", function () {
      var h = document.documentElement;
      if ((h.scrollTop + window.innerHeight) / (h.scrollHeight || 1) > 0.5) dispara();
    }, { passive: true });
    document.addEventListener("saucier:consent-granted", function () {
      setTimeout(dispara, 20000);
    });
  });
})();
