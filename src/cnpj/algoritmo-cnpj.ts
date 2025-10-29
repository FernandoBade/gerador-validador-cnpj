/* ============================
   Algoritmos do CNPJ
============================ */

import { PESOS_DIGITOS } from "../gerais/constantes.js";
import { TamanhoIdentificador } from "../gerais/enums.js";

/**
 * @summary Converte um caractere [0-9A-Z] em valor numérico para o módulo 11.
 */
export function converterCaractereParaValor(caractere: string): number {
    const codigo = caractere.toUpperCase().charCodeAt(0);
    const codigoZero = "0".charCodeAt(0);
    const codigoNove = "9".charCodeAt(0);
    const codigoA = "A".charCodeAt(0);
    const codigoZ = "Z".charCodeAt(0);

    if ((codigo >= codigoZero && codigo <= codigoNove) || (codigo >= codigoA && codigo <= codigoZ)) {
        return codigo - codigoZero;
    }
    throw new Error(`Caractere inválido para CNPJ alfanumérico: ${caractere}`);
}

/**
 * @summary Calcula um dígito verificador pelo módulo 11.
 */
export function calcularDigitoVerificador(valores: number[], pesos: number[]): number {
    const soma = valores.reduce(
        (acumulado, valorAtual, indice) => acumulado + valorAtual * pesos[indice],
        0,
    );
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}

/**
 * @summary Verifica se todos os caracteres de uma sequência são idênticos.
 */
export function verificarSequenciaRepetida(valor: string): boolean {
    return valor.length > 0 && valor.split("").every((c) => c === valor[0]);
}

/**
 * @summary Valida um CNPJ puro (14) quanto à forma e aos dígitos verificadores.
 */
export function validarCnpjPuro(puro: string): boolean {
    if (puro.length !== TamanhoIdentificador.Total) return false;
    if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(puro)) return false;
    if (verificarSequenciaRepetida(puro)) return false;

    const corpo = puro.slice(0, 12);
    const valores = Array.from(corpo).map((ch) => converterCaractereParaValor(ch));
    const dv1 = calcularDigitoVerificador(valores, PESOS_DIGITOS.primeiro);
    const dv2 = calcularDigitoVerificador([...valores, dv1], PESOS_DIGITOS.segundo);
    return puro.endsWith(`${dv1}${dv2}`);
}

export { PESOS_DIGITOS };
