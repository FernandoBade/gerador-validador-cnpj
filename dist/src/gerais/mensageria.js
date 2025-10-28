/* ============================
   Mensageria (Toasts/Avisos)
   - Exibe avisos temporários com estilos por tipo
   - Reutilizável em todas as páginas
============================ */
import { CLASSES_AVISO_OCULTO, CLASSES_AVISO_VISIVEL, MAPA_CLASSES_TIPO_AVISO } from "./constantes.js";
import { ClasseAviso, IntervaloTemporizador, TipoAviso } from "./enums.js";
const timeoutsPorArea = new WeakMap();
/**
 * @summary Exibe um aviso temporário na área indicada, com estilos por tipo.
 * @param areaAviso Elemento alvo que renderiza o toast (ex.: div#toast).
 * @param mensagem Texto do aviso a ser exibido.
 * @param tipo Tipo de aviso para estilização (sucesso, info, erro, etc.).
 */
export function exibirAviso(areaAviso, mensagem, tipo = TipoAviso.Sucesso) {
    const classesBase = "z-[9999] fixed bottom-6 right-6 min-w-3xs max-w-[calc(100%-2rem)] rounded-lg px-4 py-3 text-sm shadow-2xl transition-all duration-300 ease-out";
    areaAviso.textContent = mensagem;
    areaAviso.className = `${classesBase} ${MAPA_CLASSES_TIPO_AVISO[tipo].join(" ")} ${ClasseAviso.OpacidadeOculta} ${ClasseAviso.TranslacaoOculta} ${ClasseAviso.PonteiroDesativado}`;
    requestAnimationFrame(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_OCULTO);
        areaAviso.classList.add(...CLASSES_AVISO_VISIVEL);
    });
    const atual = timeoutsPorArea.get(areaAviso);
    if (atual !== undefined) {
        window.clearTimeout(atual);
    }
    const timeout = window.setTimeout(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_VISIVEL);
        areaAviso.classList.add(...CLASSES_AVISO_OCULTO);
        timeoutsPorArea.delete(areaAviso);
    }, IntervaloTemporizador.Aviso);
    timeoutsPorArea.set(areaAviso, timeout);
}
export { TipoAviso };
//# sourceMappingURL=mensageria.js.map