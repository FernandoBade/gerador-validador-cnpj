/* ============================
   Definições de enums para o Gerador CNPJ Alfanumérico 2026
============================ */

/**
 * @summary Possíveis tamanhos do identificador alfanumérico.
 */
export enum TamanhoIdentificador {
    Corpo = 12,
    Total = 14,
}

/**
 * @summary Durações e intervalos utilizados pelos temporizadores da interface.
 */
export enum IntervaloTemporizador {
    GeracaoAutomatica = 10_000,
    Atualizacao = 100,
    Aviso = 2_500,
}

/**
 * @summary Classes utilitárias aplicadas ao componente de aviso.
 */
export enum ClasseAviso {
    OpacidadeOculta = "opacity-0",
    TranslacaoOculta = "translate-y-5",
    OpacidadeVisivel = "opacity-100",
    TranslacaoVisivel = "translate-y-0",
    FundoSucesso = "bg-emerald-600",
    FundoErro = "bg-red-600",
    FundoInfo = "bg-blue-600",
    TextoBranco = "text-white",
    PonteiroDesativado = "pointer-events-none",
    PonteiroAtivo = "pointer-events-auto",
}

/**
 * @summary Identifica os tipos de aviso exibidos ao usuário.
 */
export enum TipoAviso {
    Sucesso = "sucesso",
    Info = "info",
    Erro = "erro",
}
