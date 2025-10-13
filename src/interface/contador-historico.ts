/* ============================
   Contador de Histórico (Badge)
   - Aplica estilo e valor padrão do gerador
   - Reutilizável entre páginas
============================ */

/**
 * @summary Atualiza o badge de contador de histórico para manter padrão visual do gerador.
 * @param alvo Elemento <span> do contador (ex.: #contador-historico).
 * @param total Total de itens no histórico.
 * @param limite Limite máximo para exibição (padrão 100).
 */
export function atualizarContadorHistorico(
    alvo: HTMLSpanElement | null,
    total: number,
    limite = 100,
    mostrarQuandoZero = false,
): void {
    if (!alvo) return;
    const exibido = Math.min(total, limite);

    if (total > 0 || mostrarQuandoZero) {
        alvo.textContent = exibido.toString();
        alvo.className =
            "absolute mt-1.5 ml-2 inline-flex items-center justify-center rounded-lg p-2 bg-transparent text-slate-600 dark:text-zinc-50 text-xs font-bold w-6 h-6 border-2 border-zinc-600 dark:border-zinc-50 cursor-default";
    } else {
        alvo.textContent = "";
        alvo.className = "hidden";
    }
}

export { };
