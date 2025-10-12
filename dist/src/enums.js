/* ============================
   Definições de enums para o Gerador CNPJ Alfanumérico 2026
============================ */
/**
 * @summary Possíveis tamanhos do identificador alfanumérico.
 */
export var TamanhoIdentificador;
(function (TamanhoIdentificador) {
    TamanhoIdentificador[TamanhoIdentificador["Corpo"] = 12] = "Corpo";
    TamanhoIdentificador[TamanhoIdentificador["Total"] = 14] = "Total";
})(TamanhoIdentificador || (TamanhoIdentificador = {}));
/**
 * @summary Durações e intervalos utilizados pelos temporizadores da interface.
 */
export var IntervaloTemporizador;
(function (IntervaloTemporizador) {
    IntervaloTemporizador[IntervaloTemporizador["GeracaoAutomatica"] = 10000] = "GeracaoAutomatica";
    IntervaloTemporizador[IntervaloTemporizador["Atualizacao"] = 100] = "Atualizacao";
    IntervaloTemporizador[IntervaloTemporizador["Aviso"] = 2500] = "Aviso";
})(IntervaloTemporizador || (IntervaloTemporizador = {}));
/**
 * @summary Classes utilitárias aplicadas ao componente de aviso.
 */
export var ClasseAviso;
(function (ClasseAviso) {
    ClasseAviso["OpacidadeOculta"] = "opacity-0";
    ClasseAviso["TranslacaoOculta"] = "-translate-y-5";
    ClasseAviso["OpacidadeVisivel"] = "opacity-100";
    ClasseAviso["TranslacaoVisivel"] = "translate-y-0";
    ClasseAviso["FundoSucesso"] = "bg-teal-600";
    ClasseAviso["FundoErro"] = "bg-red-500";
    ClasseAviso["FundoInfo"] = "bg-pink-500";
    ClasseAviso["FundoInfoAlternativo"] = "bg-sky-600";
    ClasseAviso["TextoBranco"] = "text-zinc-50";
    ClasseAviso["PonteiroDesativado"] = "pointer-events-none";
    ClasseAviso["PonteiroAtivo"] = "pointer-events-auto";
})(ClasseAviso || (ClasseAviso = {}));
/**
 * @summary Identifica os tipos de aviso exibidos ao usuário.
 */
export var TipoAviso;
(function (TipoAviso) {
    TipoAviso["Sucesso"] = "sucesso";
    TipoAviso["Info"] = "info";
    TipoAviso["Erro"] = "erro";
    TipoAviso["InfoAlternativo"] = "infoAlternativo";
})(TipoAviso || (TipoAviso = {}));
