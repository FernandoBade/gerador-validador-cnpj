/* ============================
   Aviso de Cookies (Consentimento)
   - Exibe banner de consentimento e salva a decisão no localStorage
   - Reenvia o status de consentimento via dataLayer (GTM)
   - Evita reexibir o banner quando já houver decisão
============================ */

/**
 * @summary Inicializa o aviso de cookies e gerencia a escolha do usuário (aceitar ou recusar).
 * Exibe um banner simples de consentimento e grava a decisão no localStorage.
 */
export function inicializarAvisoDeCookies(): void {
  const AVISO_ID = "aviso-cookies";
  const BOTAO_ACEITAR_ID = "botao-aceitar-cookies";
  const BOTAO_RECUSAR_ID = "botao-recusar-cookies";
  const CHAVE_COOKIES = "aceitou-cookies";

  const aviso = document.getElementById(AVISO_ID);
  const botaoAceitar = document.getElementById(BOTAO_ACEITAR_ID);
  const botaoRecusar = document.getElementById(BOTAO_RECUSAR_ID);

  if (!aviso || !botaoAceitar || !botaoRecusar) return;

  const preferencia = localStorage.getItem(CHAVE_COOKIES);

  // Reenvia o status salvo anterior (se existir)
  if (preferencia === "true" || preferencia === "false") {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: "status_consentimento",
      consentimento: preferencia === "true" ? "aceito" : "recusado",
    });
  }

  // Mostra o aviso apenas se o usuário ainda não escolheu
  if (preferencia !== "true" && preferencia !== "false") {
    aviso.classList.add("visivel");
  }

  /**
   * @summary Oculta o banner após uma decisão do usuário.
   */
  const esconderAviso = () => {
    aviso.classList.remove("visivel");
    aviso.classList.add("oculto");
  };

  botaoAceitar.addEventListener("click", () => {
    localStorage.setItem(CHAVE_COOKIES, "true");
    esconderAviso();

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: "status_consentimento",
      consentimento: "aceito",
    });
  });

  botaoRecusar.addEventListener("click", () => {
    localStorage.setItem(CHAVE_COOKIES, "false");
    esconderAviso();

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: "status_consentimento",
      consentimento: "recusado",
    });
  });
}

/**
 * @summary HTML do banner de cookies injetado automaticamente no DOM.
 */
export const htmlCookies = `
<div id="aviso-cookies"
  class="fixed bottom-0 left-0 right-0 shadow-inner bg-transparent backdrop-blur-md text-white text-sm flex flex-col sm:flex-row justify-between items-center gap-3 px-6 py-4 shadow-[0_-10px_15px_-10px_rgba(124,58,237,0.5)] transition-all duration-500 translate-y-full opacity-0 z-50">
  <p class="text-center sm:text-left">
    A gente usa cookies pra entender como você navega e deixar tudo mais redondinho. Pode ser?
  </p>
  <div class="flex gap-5">
    <button id="botao-recusar-cookies"
      class="text-slate-100/50 px-2 font-semibold hover:text-slate-300 hover:border-slate-300 transition-all duration-300">
      Prefiro não
    </button>
    <button id="botao-aceitar-cookies"
      class="bg-pink-500 hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-lg transition">
      Pode sim!
    </button>
  </div>
</div>
`;

/**
 * @summary Injeta o HTML do banner (se ainda não existir) e inicializa os eventos
 * assim que o DOM estiver pronto.
 */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("aviso-cookies")) {
    document.body.insertAdjacentHTML("beforeend", htmlCookies);
  }
  try {
    inicializarAvisoDeCookies();
  } catch {}
});
