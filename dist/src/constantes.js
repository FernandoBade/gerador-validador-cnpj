/* ============================
   Constantes do Gerador CNPJ Alfanumérico 2026
============================ */
import { ClasseAviso, TipoAviso } from "./enums.js";
/**
 * @summary Caracteres elegíveis para compor o corpo alfanumérico do identificador.
 */
export const CARACTERES_PERMITIDOS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/**
 * @summary Pesos do módulo 11 aplicados aos dígitos verificadores.
 */
export const PESOS_DIGITOS = {
    primeiro: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    segundo: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
};
/**
 * @summary Representa a combinação de classes CSS utilizadas por tipo de aviso.
 */
export const MAPA_CLASSES_TIPO_AVISO = {
    [TipoAviso.Sucesso]: [ClasseAviso.FundoSucesso, ClasseAviso.TextoBranco],
    [TipoAviso.Info]: [ClasseAviso.FundoInfo, ClasseAviso.TextoBranco],
    [TipoAviso.Erro]: [ClasseAviso.FundoErro, ClasseAviso.TextoBranco],
};
/**
 * @summary Classes aplicadas ao iniciar o aviso em estado oculto.
 */
export const CLASSES_AVISO_OCULTO = [
    ClasseAviso.OpacidadeOculta,
    ClasseAviso.TranslacaoOculta,
    ClasseAviso.PonteiroDesativado,
];
/**
 * @summary Classes utilizadas quando o aviso está visível.
 */
export const CLASSES_AVISO_VISIVEL = [
    ClasseAviso.OpacidadeVisivel,
    ClasseAviso.TranslacaoVisivel,
    ClasseAviso.PonteiroAtivo,
];
