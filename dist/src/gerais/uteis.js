"use strict";
// --------------------------------------------
// --------------------------------------------
// Validador de CNPJ Alfanumérico (versão simplificada)
// Compatível com o novo formato de CNPJ a partir de 2026
// --------------------------------------------
/**
* Converte um caractere (letra ou número) em valor numérico
* conforme a regra do novo CNPJ alfanumérico:
* - '0' → 0
* - '9' → 9
* - 'A' → 17 (pois 65 - 48 = 17)
* - 'B' → 18, e assim por diante
*/
function valorPorCaractere(ch) {
    const code = ch.charCodeAt(0); // obtém o código ASCII do caractere
    // Se for um dígito ('0' a '9')
    if (code >= 48 && code <= 57) {
        return code - 48;
    }
    // Se for uma letra maiúscula ('A' a 'Z')
    if (code >= 65 && code <= 90) {
        return code - 48;
    }
    // Se não for válido, lança erro
    throw new Error(`Caractere inválido no CNPJ: ${ch}`);
}
/**
 * Calcula os dois dígitos verificadores (DV) do CNPJ.
 * O algoritmo usa o método de módulo 11, igual ao formato antigo,
 * mas agora com valores numéricos derivados de letras.
 */
function calcularDVs(cnpj12) {
    const valores = cnpj12.split("").map(valorPorCaractere);
    // Pesos usados para o cálculo do primeiro DV
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma1 = 0;
    // Multiplica cada valor pelo peso correspondente
    for (let i = 0; i < 12; i++) {
        soma1 += valores[i] * pesos1[i];
    }
    // Calcula o primeiro DV
    const resto1 = soma1 % 11;
    const dv1 = resto1 < 2 ? 0 : 11 - resto1;
    // Adiciona o primeiro DV e calcula o segundo
    const valores13 = [...valores, dv1];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma2 = 0;
    for (let i = 0; i < 13; i++) {
        soma2 += valores13[i] * pesos2[i];
    }
    const resto2 = soma2 % 11;
    const dv2 = resto2 < 2 ? 0 : 11 - resto2;
    // Retorna ambos os dígitos verificadores
    return [dv1, dv2];
}
/**
 * Valida um CNPJ (numérico ou alfanumérico) conforme o novo padrão.
 * Remove caracteres especiais, converte letras e confere os dígitos verificadores.
 */
function validarCNPJ(cnpj) {
    // Remove pontos, barras e traços
    const limpo = cnpj.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    // O CNPJ precisa ter exatamente 14 caracteres (letras + números)
    if (limpo.length !== 14)
        return false;
    const parte12 = limpo.slice(0, 12);
    const dvInformado1 = Number(limpo.charAt(12));
    const dvInformado2 = Number(limpo.charAt(13));
    // Recalcula os DVs com base nos 12 primeiros caracteres
    const [dv1, dv2] = calcularDVs(parte12);
    // Compara os DVs calculados com os informados
    return dv1 === dvInformado1 && dv2 === dvInformado2;
}
// --------------------------------------------
// Exemplo de uso
// --------------------------------------------
console.log(validarCNPJ("A1B2C3D4E5F6-78".replace(/-/g, "")));
// Retorna true ou false dependendo se o CNPJ é válido
//# sourceMappingURL=uteis.js.map