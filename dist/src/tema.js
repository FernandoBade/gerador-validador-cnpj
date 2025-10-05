const CHAVE_ARMAZENAMENTO = "tema-cnpj-2026";
const CHAVE_ARMAZENAMENTO_ANTERIOR = "theme";
const ehTemaValido = (valor) => valor === "light" || valor === "dark";
const obterPreferenciaArmazenada = () => {
    const temaAtual = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (ehTemaValido(temaAtual)) {
        return temaAtual;
    }
    const temaAnterior = localStorage.getItem(CHAVE_ARMAZENAMENTO_ANTERIOR);
    if (ehTemaValido(temaAnterior)) {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, temaAnterior);
        localStorage.removeItem(CHAVE_ARMAZENAMENTO_ANTERIOR);
        return temaAnterior;
    }
    return null;
};
const possuiPreferenciaArmazenada = () => {
    const temaAtual = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return ehTemaValido(temaAtual);
};
const aplicarTema = (tema, persistir) => {
    if (tema === "dark") {
        document.documentElement.classList.add("dark");
    }
    else {
        document.documentElement.classList.remove("dark");
    }
    if (persistir) {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, tema);
    }
};
const inicializarControleTema = () => {
    const controleTema = document.getElementById("toggle-tema");
    if (!controleTema) {
        return;
    }
    const preferenciaSistema = window.matchMedia("(prefers-color-scheme: dark)");
    const temaArmazenado = obterPreferenciaArmazenada();
    const temaInicial = temaArmazenado ?? (preferenciaSistema.matches ? "dark" : "light");
    aplicarTema(temaInicial, temaArmazenado !== null);
    controleTema.checked = temaInicial === "dark";
    controleTema.addEventListener("change", () => {
        const novoTema = controleTema.checked ? "dark" : "light";
        aplicarTema(novoTema, true);
    });
    preferenciaSistema.addEventListener("change", (evento) => {
        if (possuiPreferenciaArmazenada()) {
            return;
        }
        const temaAtualizado = evento.matches ? "dark" : "light";
        aplicarTema(temaAtualizado, false);
        controleTema.checked = temaAtualizado === "dark";
    });
};
document.addEventListener("DOMContentLoaded", () => {
    inicializarControleTema();
});
export {};
