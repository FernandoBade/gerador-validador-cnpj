import { exibirAviso, TipoAviso } from "./mensageria.js";
/**
 * @summary Copia o texto informado para a área de transferência e exibe mensagem de sucesso/erro.
 */
export async function copiarTextoParaAreaTransferencia(texto, areaAviso, mensagemSucesso = "Conteúdo copiado!") {
    try {
        await navigator.clipboard.writeText(texto);
        if (areaAviso) {
            exibirAviso(areaAviso, mensagemSucesso, TipoAviso.InfoAlternativo);
        }
        return true;
    }
    catch {
        if (areaAviso) {
            exibirAviso(areaAviso, "Não foi possível copiar!", TipoAviso.Erro);
        }
        return false;
    }
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
        throw new Error(`Alvo não encontrado: ${selector}`);
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
        await copiarTextoParaAreaTransferencia(texto, obterAreaAviso());
    }
    catch {
        await copiarTextoParaAreaTransferencia("", obterAreaAviso());
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
        // Fallback: copiar URL
        await copiarTextoParaAreaTransferencia(url, area, "Link copiado!");
        if (feedback)
            feedback.textContent = "Link copiado para a área de transferência.";
    }
    catch (e) {
        const nome = e?.name;
        if (nome === "AbortError")
            return;
        await copiarTextoParaAreaTransferencia(url, area, "Link copiado!");
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
//# sourceMappingURL=uteis.js.map