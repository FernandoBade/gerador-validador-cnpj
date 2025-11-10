/* ============================
   Métodos auxiliares gerais
============================ */
import { exibirAviso, TipoAviso } from "./mensageria.js";
export async function copiarTexto(valor, areaAviso, mensagemSucesso = "Conteúdo copiado!") {
    if (areaAviso) {
        try {
            await navigator.clipboard.writeText(valor);
            exibirAviso(areaAviso, mensagemSucesso, TipoAviso.InfoAlternativo);
            return true;
        }
        catch {
            exibirAviso(areaAviso, "Não foi possível copiar!", TipoAviso.Erro);
            return false;
        }
    }
    await navigator.clipboard.writeText(valor);
}
/**
 * @summary Obtém um elemento obrigatório por id.
 */
export function obterElementoObrigatorio(id) {
    const elemento = document.getElementById(id);
    if (!elemento) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return elemento;
}
/**
 * @summary Aplica o efeito de onda em elementos com a classe base.
 */
export function inicializarEfeitoOnda() {
    const botoes = document.querySelectorAll(".efeito-onda-base");
    botoes.forEach((botao) => {
        botao.style.position = botao.style.position || "relative";
        botao.style.overflow = botao.style.overflow || "hidden";
        botao.addEventListener("click", (evento) => {
            if (botao.disabled)
                return;
            const baseRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const rect = botao.getBoundingClientRect();
            const x = (evento.pageX - (rect.left + window.scrollX)) / baseRem;
            const y = (evento.pageY - (rect.top + window.scrollY)) / baseRem;
            const bolha = document.createElement("span");
            bolha.className = "efeito-onda-circulo";
            bolha.style.left = `${x}rem`;
            bolha.style.top = `${y}rem`;
            botao.appendChild(bolha);
            setTimeout(() => bolha.remove(), 600);
        });
    });
}
/**
 * @summary Retorna a área de aviso (toast) disponível na página, se existir.
 */
function obterAreaAviso() {
    return (document.getElementById("toast") ||
        document.getElementById("feedback-toast") ||
        undefined);
}
/**
 * @summary Obtém o texto de um elemento pelo seletor, priorizando o conteúdo de <code>.
 */
function obterTextoParaCopiar(selector) {
    const alvo = document.querySelector(selector);
    if (!alvo)
        throw new Error(`Conteúdo não encontrado: ${selector}`);
    const code = alvo.querySelector("code");
    const fonte = code ?? alvo;
    const texto = (fonte.innerText ?? fonte.textContent ?? "").trim();
    return texto;
}
/**
 * @summary Lida com cliques em botões com atributo data-copy-target e copia o conteúdo alvo.
 */
document.addEventListener("click", async (ev) => {
    const origem = ev.target;
    if (!origem)
        return;
    const botao = origem.closest("[data-copy-target]");
    if (!botao)
        return;
    const seletor = botao.getAttribute("data-copy-target");
    if (!seletor)
        return;
    ev.preventDefault();
    try {
        const texto = obterTextoParaCopiar(seletor);
        await copiarTexto(texto, obterAreaAviso());
    }
    catch {
        await copiarTexto("", obterAreaAviso());
    }
});
/**
 * @summary Retorna o elemento de feedback de compartilhamento, se presente.
 */
function obterFeedbackCompartilhamento() {
    return document.getElementById("feedback-compartilhamento");
}
/**
 * @summary Obtém o conteúdo da meta tag de descrição da página.
 */
function obterMetaDescricao() {
    const meta = document.querySelector('meta[name="description"]');
    return meta?.content?.trim() || undefined;
}
/**
 * @summary Retorna a URL canônica da página, ou o location.href como fallback.
 */
function obterUrlCompartilhamento() {
    const link = document.querySelector('link[rel="canonical"]');
    return (link?.href?.trim() || location.href);
}
/**
 * @summary Tenta compartilhar a página via Web Share API; se não disponível, copia o link.
 */
async function compartilharAtual() {
    const url = obterUrlCompartilhamento();
    const titulo = document.title;
    const texto = obterMetaDescricao() || titulo;
    const area = obterAreaAviso();
    const feedback = obterFeedbackCompartilhamento();
    try {
        if (navigator.share) {
            await navigator.share({ title: titulo, text: texto, url });
            if (feedback)
                feedback.textContent = "Compartilhado!";
            if (area)
                exibirAviso(area, "Compartilhado!", TipoAviso.Sucesso);
            return;
        }
        await copiarTexto(url, area, "Link copiado!");
        if (feedback)
            feedback.textContent = "Link copiado para a área de transferência.";
    }
    catch (e) {
        const nome = e?.name;
        if (nome === "AbortError")
            return;
        await copiarTexto(url, area, "Link copiado!");
        if (feedback)
            feedback.textContent = "Link copiado para a área de transferência.";
    }
}
/**
 * @summary Lida com cliques em elementos de compartilhamento e aciona a função de compartilhamento.
 */
document.addEventListener("click", (ev) => {
    const alvo = ev.target;
    if (!alvo)
        return;
    const share = alvo.closest("#botao-compartilhar, [data-share]");
    if (!share)
        return;
    ev.preventDefault();
    compartilharAtual();
});
/* ============================
   Injeção do Google Tag Manager
============================ */
const GTM_ID = "GTM-5LSGCFMM";
const GTM_SCRIPT_CONTEUDO = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;
/**
 * @summary Injeta o bloco de script do Google Tag Manager no topo do <head>.
 */
function injetarScriptGTM() {
    const cabecalho = document.head;
    if (!cabecalho)
        return;
    const existentes = cabecalho.querySelectorAll("script");
    const jaTem = Array.from(existentes).some((script) => {
        const conteudo = script.textContent ?? "";
        return conteudo.includes("googletagmanager.com/gtm.js") && conteudo.includes(GTM_ID);
    });
    if (jaTem)
        return;
    const comentarioInicial = document.createComment(" Google Tag Manager ");
    const script = document.createElement("script");
    script.text = GTM_SCRIPT_CONTEUDO;
    const comentarioFinal = document.createComment(" End Google Tag Manager ");
    const fragmento = document.createDocumentFragment();
    fragmento.append(comentarioInicial, script, comentarioFinal);
    cabecalho.insertBefore(fragmento, cabecalho.firstChild);
}
/**
 * @summary Injeta o bloco <noscript> do Google Tag Manager logo após o <body>.
 */
function injetarNoscriptGTM() {
    const corpo = document.body;
    if (!corpo)
        return;
    const existentes = corpo.querySelectorAll("noscript");
    const jaTem = Array.from(existentes).some((noscript) => {
        const conteudo = noscript.textContent ?? "";
        const iframe = noscript.querySelector("iframe");
        const src = iframe?.getAttribute("src") ?? "";
        return conteudo.includes(GTM_ID) || src.includes(GTM_ID);
    });
    if (jaTem)
        return;
    const comentarioInicial = document.createComment(" Google Tag Manager (noscript) ");
    const noscript = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    const comentarioFinal = document.createComment(" End Google Tag Manager (noscript) ");
    const fragmento = document.createDocumentFragment();
    fragmento.append(comentarioInicial, noscript, comentarioFinal);
    corpo.insertBefore(fragmento, corpo.firstChild);
}
/**
 * @summary Inicia a injeção dos blocos do Google Tag Manager na página.
 */
function injetarGoogleTagManager() {
    if (typeof document === "undefined")
        return;
    if (typeof window !== "undefined" && window.__gtmInjected)
        return;
    if (typeof window !== "undefined")
        window.__gtmInjected = true;
    injetarScriptGTM();
    injetarNoscriptGTM();
}
if (typeof window !== "undefined") {
    const inicializarGTM = () => injetarGoogleTagManager();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarGTM, { once: true });
    }
    else {
        inicializarGTM();
    }
}
export { injetarGoogleTagManager };
//# sourceMappingURL=uteis.js.map