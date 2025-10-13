/* ============================
   Salva e restaura os últimos estados de
   aberto/fechado dos elementos <details>
   ============================ */
/**
 * @summary Lê um valor do localStorage de forma segura, evitando quebra em contextos onde o storage pode estar bloqueado.
 */
function lerDoStorage(chave) {
    try {
        return window.localStorage.getItem(chave);
    }
    catch {
        return null;
    }
}
/**
 * @summary Escreve um valor no localStorage de forma segura, ignorando erros em ambientes restritos.
 */
function escreverNoStorage(chave, valor) {
    try {
        window.localStorage.setItem(chave, valor);
    }
    catch {
        // ignora silenciosamente para não quebrar a UI
    }
}
/**
 * @summary Gera a chave única para persistência do estado de um elemento <details>.
 * Prioriza o atributo data-chave-storage; depois o id; por fim o índice como fallback.
 */
function gerarChaveParaDetails(details, indiceFallback) {
    const chaveCustom = details.dataset.chaveStorage?.trim();
    if (chaveCustom && chaveCustom.length > 0)
        return chaveCustom;
    const id = details.id?.trim();
    if (id && id.length > 0)
        return `details-aberto-${id}`;
    return `details-estado-${indiceFallback}`;
}
/**
 * @summary Aplica no elemento <details> o estado salvo anteriormente (aberto ou fechado).
 */
function aplicarEstado(details, chave) {
    const valorSalvo = lerDoStorage(chave);
    if (valorSalvo === "true") {
        details.setAttribute("open", "");
    }
    else if (valorSalvo === "false") {
        details.removeAttribute("open");
    }
    // Se null, não havia estado salvo: respeita o HTML original
}
/**
 * @summary Observa mudanças de abrir/fechar em um <details> e persiste o estado automaticamente.
 */
function observarMudancas(details, chave) {
    details.addEventListener("toggle", () => {
        escreverNoStorage(chave, String(details.open));
    });
}
/**
 * @summary Inicializa a persistência de TODOS os <details> presentes no documento.
 * Usa data-chave-storage ou id para formar a chave; se ausentes, usa um índice incremental.
 */
export function inicializarPersistenciaDeTodosOsDetails() {
    const todosOsDetails = document.querySelectorAll("details");
    todosOsDetails.forEach((detalhe, indice) => {
        const chave = gerarChaveParaDetails(detalhe, indice);
        aplicarEstado(detalhe, chave);
        observarMudancas(detalhe, chave);
    });
}
/**
 * @summary Inicializa a persistência para um único <details> identificado por seletor (id ou qualquer seletor CSS).
 * Útil se você quiser controlar elementos específicos manualmente.
 */
export function inicializarPersistenciaDeUmDetails(seletor) {
    const detalhe = document.querySelector(seletor);
    if (!detalhe)
        return;
    const chave = gerarChaveParaDetails(detalhe, 0);
    aplicarEstado(detalhe, chave);
    observarMudancas(detalhe, chave);
}
/**
 * @summary Ponto de entrada automático: dispara a inicialização quando o DOM estiver pronto.
 * Evita chamadas duplas e garante que os <details> já existam no DOM.
 */
function iniciarQuandoDomPronto() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarPersistenciaDeTodosOsDetails(), { once: true });
    }
    else {
        inicializarPersistenciaDeTodosOsDetails();
    }
}
iniciarQuandoDomPronto();
