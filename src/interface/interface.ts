/* ============================
   Utilidades de interface (UI)
============================ */

import { CLASSES_AVISO_OCULTO, CLASSES_AVISO_VISIVEL, MAPA_CLASSES_TIPO_AVISO } from "../gerais/constantes.js";
import { ClasseAviso, IntervaloTemporizador, TipoAviso } from "../gerais/enums.js";

const timeoutsAviso = new WeakMap<HTMLElement, number>();

/**
 * @summary Exibe um aviso temporário na área indicada, com estilos por tipo.
 */
export function exibirAviso(areaAviso: HTMLDivElement, mensagem: string, tipo: TipoAviso = TipoAviso.Sucesso): void {
    const classesBase =
        "fixed top-4 right-3 min-w-60 max-w-[calc(100%-2rem)] rounded-lg px-4 py-3 text-sm shadow-2xl transition-all duration-300 ease-out";

    areaAviso.textContent = mensagem;
    areaAviso.className = `${classesBase} ${MAPA_CLASSES_TIPO_AVISO[tipo].join(" ")} ${ClasseAviso.OpacidadeOculta} ${ClasseAviso.TranslacaoOculta} ${ClasseAviso.PonteiroDesativado}`;

    requestAnimationFrame(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_OCULTO);
        areaAviso.classList.add(...CLASSES_AVISO_VISIVEL);
    });

    const anterior = timeoutsAviso.get(areaAviso);
    if (anterior !== undefined) {
        window.clearTimeout(anterior);
    }

    const novo = window.setTimeout(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_VISIVEL);
        areaAviso.classList.add(...CLASSES_AVISO_OCULTO);
        timeoutsAviso.delete(areaAviso);
    }, IntervaloTemporizador.Aviso);
    timeoutsAviso.set(areaAviso, novo);
}

/**
 * @summary Copia um texto para a área de transferência do sistema.
 */
export async function copiarTexto(valor: string): Promise<void> {
    await navigator.clipboard.writeText(valor);
}

/**
 * @summary Obtém um elemento obrigatório por id.
 */
export function obterElementoObrigatorio<T extends HTMLElement>(id: string): T {
    const elemento = document.getElementById(id);
    if (!elemento) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return elemento as T;
}

/**
 * @summary Aplica o efeito de onda em elementos com a classe base.
 */
export function inicializarEfeitoOnda(): void {
    const botoes = document.querySelectorAll<HTMLElement>(".efeito-onda-base");

    botoes.forEach((botao) => {
        if (botao.dataset.ondaInicializada === "true") {
            return;
        }

        botao.dataset.ondaInicializada = "true";
        botao.style.position = botao.style.position || "relative";
        botao.style.overflow = botao.style.overflow || "hidden";

        botao.addEventListener("click", (evento: MouseEvent) => {
            if ((botao as HTMLButtonElement).disabled) return;

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

export { TipoAviso };

