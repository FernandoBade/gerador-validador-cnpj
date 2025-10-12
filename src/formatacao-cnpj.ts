/* ============================
   Formatação e normalização do CNPJ
============================ */

/**
 * @summary Remove caracteres inválidos e converte para maiúsculas.
 */
export function normalizarPuro(valor: string): string {
    return valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
}

/**
 * @summary Aplica a máscara ##.###.###/####-## a um CNPJ puro (14).
 */
export function aplicarMascara(puro: string): string {
    if (puro.length !== 14) return puro;
    return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8, 12)}-${puro.slice(12)}`;
}

/**
 * @summary Aplica máscara progressiva durante digitação.
 */
export function aplicarMascaraProgressiva(puro: string): string {
    if (puro.length <= 2) return puro;
    if (puro.length <= 5) return `${puro.slice(0, 2)}.${puro.slice(2)}`;
    if (puro.length <= 8) return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5)}`;
    if (puro.length <= 12) return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8)}`;
    return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8, 12)}-${puro.slice(12, 14)}`;
}

