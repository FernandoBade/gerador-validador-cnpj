/**
 * @summary Inicializa o aviso de cookies e gerencia a escolha do usuário (aceitar ou recusar).
 *
 * Exibe dinamicamente um banner de consentimento de cookies e grava a decisão no `localStorage`
 * com a chave "aceitou-cookies".
 *
 * - Se o usuário aceitar, envia um evento `status_consentimento` com valor `aceito` ao Google Tag Manager.
 * - Se recusar, envia o mesmo evento com valor `recusado`.
 * - O HTML é injetado automaticamente no DOM, sem precisar alterar o index.html.
 */
export function inicializarAvisoDeCookies() {
    const CHAVE_COOKIES = "aceitou-cookies";
    // Evita duplicar o banner se ele já estiver no DOM
    if (document.getElementById("aviso-cookies"))
        return;
    // Injeta o HTML diretamente no corpo da página
    document.body.insertAdjacentHTML("beforeend", htmlCookies);
    const aviso = document.getElementById("aviso-cookies");
    const botaoAceitar = document.getElementById("botao-aceitar-cookies");
    const botaoRecusar = document.getElementById("botao-recusar-cookies");
    if (!aviso || !botaoAceitar || !botaoRecusar)
        return;
    const preferencia = localStorage.getItem(CHAVE_COOKIES);
    // Exibe o aviso se o usuário ainda não escolheu
    if (preferencia !== "true" && preferencia !== "false") {
        aviso.classList.add("visivel");
    }
    const esconderAviso = () => {
        aviso.classList.remove("visivel");
        aviso.classList.add("oculto");
    };
    // Aceitar cookies
    botaoAceitar.addEventListener("click", () => {
        localStorage.setItem(CHAVE_COOKIES, "true");
        esconderAviso();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            evento: "status_consentimento",
            consentimento: "aceito"
        });
    });
    // Recusar cookies
    botaoRecusar.addEventListener("click", () => {
        localStorage.setItem(CHAVE_COOKIES, "false");
        esconderAviso();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            evento: "status_consentimento",
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
