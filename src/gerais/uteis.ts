import { exibirAviso, TipoAviso } from "./mensageria.js";

/**
 * @summary Copia o texto informado para a área de transferência e exibe mensagem de sucesso/erro.
 */
export async function copiarTextoParaAreaTransferencia(
    texto: string,
    areaAviso?: HTMLDivElement,
    mensagemSucesso: string = "Conteúdo copiado!",
): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(texto);
        if (areaAviso) {
            exibirAviso(areaAviso, mensagemSucesso, TipoAviso.InfoAlternativo);
        }
        return true;
    } catch {
        if (areaAviso) {
            exibirAviso(areaAviso, "Não foi possível copiar!", TipoAviso.Erro);
        }
        return false;
    }
}

/**
 * @summary Retorna a área de aviso (toast) disponível na página, se existir.
 */
function obterAreaAviso(): HTMLDivElement | undefined {
    return (
        (document.getElementById("toast") as HTMLDivElement | null) ||
        (document.getElementById("feedback-toast") as HTMLDivElement | null) ||
        undefined
    );
}

/**
 * @summary Obtém o texto de um elemento pelo seletor, priorizando o conteúdo de <code>.
 */
function obterTextoParaCopiar(selector: string): string {
    const alvo = document.querySelector<HTMLElement>(selector);
    if (!alvo) throw new Error(`Alvo não encontrado: ${selector}`);
    const code = alvo.querySelector<HTMLElement>("code");
    const fonte = code ?? alvo;
    const texto = (fonte.innerText ?? fonte.textContent ?? "").trim();
    return texto;
}

/**
 * @summary Lida com cliques em botões com atributo data-copy-target e copia o conteúdo alvo.
 */
document.addEventListener("click", async (ev) => {
    const origem = ev.target as HTMLElement | null;
    if (!origem) return;
    const botao = origem.closest<HTMLElement>("[data-copy-target]");
    if (!botao) return;
    const seletor = botao.getAttribute("data-copy-target");
    if (!seletor) return;
    ev.preventDefault();
    try {
        const texto = obterTextoParaCopiar(seletor);
        await copiarTextoParaAreaTransferencia(texto, obterAreaAviso());
    } catch {
        await copiarTextoParaAreaTransferencia("", obterAreaAviso());
    }
});

/**
 * @summary Retorna o elemento de feedback de compartilhamento, se presente.
 */
function obterFeedbackCompartilhamento(): HTMLParagraphElement | undefined {
    return document.getElementById("feedback-compartilhamento") as HTMLParagraphElement | undefined;
}

/**
 * @summary Obtém o conteúdo da meta tag de descrição da página.
 */
function obterMetaDescricao(): string | undefined {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    return meta?.content?.trim() || undefined;
}

/**
 * @summary Retorna a URL canônica da página, ou o location.href como fallback.
 */
function obterUrlCompartilhamento(): string {
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    return (link?.href?.trim() || location.href);
}

/**
 * @summary Tenta compartilhar a página via Web Share API; se não disponível, copia o link.
 */
async function compartilharAtual(): Promise<void> {
    const url = obterUrlCompartilhamento();
    const titulo = document.title;
    const texto = obterMetaDescricao() || titulo;
    const area = obterAreaAviso();
    const feedback = obterFeedbackCompartilhamento();

    try {
        if (navigator.share) {
            await navigator.share({ title: titulo, text: texto, url });
            if (feedback) feedback.textContent = "Compartilhado!";
            if (area) exibirAviso(area, "Compartilhado!", TipoAviso.Sucesso);
            return;
        }
        // Fallback: copiar URL
        await copiarTextoParaAreaTransferencia(url, area, "Link copiado!");
        if (feedback) feedback.textContent = "Link copiado para a área de transferência.";
    } catch (e: unknown) {
        const nome = (e as any)?.name as string | undefined;
        if (nome === "AbortError") return;
        await copiarTextoParaAreaTransferencia(url, area, "Link copiado!");
        if (feedback) feedback.textContent = "Link copiado para a área de transferência.";
    }
}

/**
 * @summary Lida com cliques em elementos de compartilhamento e aciona a função de compartilhamento.
 */
document.addEventListener("click", (ev) => {
    const alvo = ev.target as HTMLElement | null;
    if (!alvo) return;
    const share = alvo.closest<HTMLElement>("#botao-compartilhar, [data-share]");
    if (!share) return;
    ev.preventDefault();
    compartilharAtual();
});
