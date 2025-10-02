/* ============================
   Tipos e interfaces do Gerador CNPJ Alfanumérico 2026
============================ */

/**
 * @summary Estrutura com os pesos utilizados no cálculo dos dígitos verificadores.
 */
export interface PesosDigitos {
    primeiro: number[];
    segundo: number[];
}

/**
 * @summary Limites e dados relacionados ao histórico de identificadores.
 */
export interface HistoricoIdentificadores {
    itens: string[];
    limite: number;
}

/**
 * @summary Estrutura com referências a todos os elementos de interface utilizados.
 */
export interface ElementosInterface {
    campoResultado: HTMLInputElement;
    botaoGerar: HTMLButtonElement;
    botaoCopiar: HTMLButtonElement;
    areaAviso: HTMLDivElement;
    textoTempoRestante: HTMLDivElement;
    barraProgresso: HTMLElement;
    controleMascara: HTMLInputElement | null;
    listaRecentes: HTMLUListElement | null;
    botaoCopiarTodos: HTMLButtonElement | null;
}

/**
 * @summary Representa um identificador gerado pelo algoritmo.
 */
export interface IdentificadorGerado {
    puro: string;
    mascarado: string;
}

/**
 * @summary Estrutura de controle dos temporizadores utilizados na interface.
 */
export interface Temporizadores {
    timeoutAviso?: number;
    intervaloRegressivo?: number;
    inicioContagem: number;
}
