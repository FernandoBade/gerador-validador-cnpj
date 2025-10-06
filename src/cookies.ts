/**
 * @summary Inicializa o aviso de cookies e gerencia a escolha do usuário (aceitar ou recusar).
 *
 * Exibe um banner simples de consentimento e grava a decisão no `localStorage`
 * com a chave "aceitou-cookies".
 *
 * - Se o usuário aceitar, envia um evento `status_consentimento` com valor `aceito` ao Google Tag Manager.
 * - Se recusar, envia o mesmo evento com valor `recusado`.
 * - Ao retornar ao site, reenvia o último status salvo automaticamente.
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
            consentimento: preferencia === "true" ? "aceito" : "recusado"
        });
    }

    // Mostra o aviso apenas se o usuário ainda não escolheu
    if (preferencia !== "true" && preferencia !== "false") {
        aviso.classList.add("visivel");
    }

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
            consentimento: "aceito"
        });
    });

    botaoRecusar.addEventListener("click", () => {
        localStorage.setItem(CHAVE_COOKIES, "false");
        esconderAviso();

        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
            event: "status_consentimento",
            consentimento: "recusado"
        });
    });
}

// HTML do banner injetado automaticamente
export const htmlCookies = `
<div id="aviso-cookies"
  class="fixed bottom-0 left-0 right-0 bg-slate-800 dark:bg-slate-800 text-white text-sm flex flex-col sm:flex-row justify-between items-center gap-3 px-6 py-4 shadow-lg transition-all duration-500 translate-y-full opacity-0 z-50">
  <p class="text-center sm:text-left">
    A gente usa cookies pra entender como você navega e deixar tudo mais redondinho. Pode ser?
  </p>
  <div class="flex gap-5">
    <button id="botao-recusar-cookies"
      class="bg-transparent text-slate-500 px-2 font-semibold hover:text-slate-600 hover:border-slate-300 transition-all duration-300">
      Prefiro não
    </button>
    <button id="botao-aceitar-cookies"
      class="bg-pink-600 hover:bg-pink-500 dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-lg transition">
      Pode sim!
    </button>
  </div>
</div>
`;
