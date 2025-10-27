/* ============================
   Controle de Tema (Claro/Escuro)
   - Lê e persiste preferência no localStorage
   - Sincroniza com a preferência do sistema (prefers-color-scheme)
   - Inicializa o toggle de tema e mantém estado consistente
============================ */
/**
 * @summary Chave única usada para armazenar o tema atual no localStorage.
 */
const CHAVE_ARMAZENAMENTO = "tema-cnpj-bade-digital";
/**
 * @summary Verifica se um valor é um tema válido ("light" ou "dark").
 */
const ehTemaValido = (valor) => valor === "light" || valor === "dark";
/**
 * @summary Obtém o tema armazenado no localStorage, se existir.
 * @returns O tema armazenado ("light" ou "dark") ou null se não houver.
 */
export const obterPreferenciaArmazenada = () => {
    const tema = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return ehTemaValido(tema) ? tema : null;
};
/**
 * @summary Verifica se há uma preferência de tema salva no localStorage.
 */
const possuiPreferenciaArmazenada = () => {
    const tema = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return ehTemaValido(tema);
};
/**
 * @summary Aplica o tema (dark ou light) ao documento e salva no localStorage, se desejado.
 * @param tema Tema a ser aplicado.
 * @param persistir Define se o tema deve ser salvo no localStorage.
 */
const aplicarTema = (tema, persistir) => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    if (persistir)
        localStorage.setItem(CHAVE_ARMAZENAMENTO, tema);
};
/**
 * @summary Identifica a preferência atual do usuário (armazenada ou do sistema) e aplica o tema.
 */
export function identificaPreferenciaEAplicaTema() {
    const temaArmazenado = obterPreferenciaArmazenada();
    const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const temaSelecionado = temaArmazenado ?? (prefereEscuro ? "dark" : "light");
    aplicarTema(temaSelecionado, !!temaArmazenado);
}
/**
 * @summary Inicializa o controle do alternador de tema e sincroniza com o sistema.
 * Configura eventos para alternar o tema manualmente e reagir a mudanças no sistema.
 */
const inicializarControleTema = () => {
    const controleTema = document.getElementById("alternar-tema");
    if (!controleTema)
        return;
    const preferenciaSistema = window.matchMedia("(prefers-color-scheme: dark)");
    const temaArmazenado = obterPreferenciaArmazenada();
    const temaInicial = temaArmazenado ?? (preferenciaSistema.matches ? "dark" : "light");
    aplicarTema(temaInicial, !!temaArmazenado);
    controleTema.checked = temaInicial === "dark";
    controleTema.addEventListener("change", () => {
        const novoTema = controleTema.checked ? "dark" : "light";
        aplicarTema(novoTema, true);
    });
    preferenciaSistema.addEventListener("change", (evento) => {
        if (possuiPreferenciaArmazenada())
            return;
        const novoTema = evento.matches ? "dark" : "light";
        aplicarTema(novoTema, false);
        controleTema.checked = novoTema === "dark";
    });
};
/**
 * @summary Executa a inicialização do controle de tema quando o DOM estiver carregado.
 */
document.addEventListener("DOMContentLoaded", () => {
    inicializarControleTema();
});
//# sourceMappingURL=tema.js.map