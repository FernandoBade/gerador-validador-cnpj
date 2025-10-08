const CHAVE_ARMAZENAMENTO = "tema-cnpj-2026" as const;
const CHAVE_ARMAZENAMENTO_ANTERIOR = "theme" as const;

type TemaPreferido = "light" | "dark";

export function identificaPreferenciaEAplicaTema(): void {
    const chaveTemaAtual = "tema-cnpj-2026";
    const chaveTemaAnterior = "theme";

    const temaAtual = localStorage.getItem(chaveTemaAtual);
    const temaAnterior = localStorage.getItem(chaveTemaAnterior);

    let temaSelecionado: "dark" | "light" | null = null;

    if (temaAtual === "dark" || temaAtual === "light") {
        temaSelecionado = temaAtual;
    } else if (temaAnterior === "dark" || temaAnterior === "light") {
        temaSelecionado = temaAnterior;
        localStorage.setItem(chaveTemaAtual, temaAnterior);
        localStorage.removeItem(chaveTemaAnterior);
    }

    const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const deveAplicarEscuro = temaSelecionado === "dark" || (!temaSelecionado && prefereEscuro);

    if (deveAplicarEscuro) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}

const ehTemaValido = (valor: string | null): valor is TemaPreferido =>
    valor === "light" || valor === "dark";

export const obterPreferenciaArmazenada = (): TemaPreferido | null => {
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

const possuiPreferenciaArmazenada = (): boolean => {
    const temaAtual = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return ehTemaValido(temaAtual);
};

const aplicarTema = (tema: TemaPreferido, persistir: boolean): void => {
    if (tema === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }

    if (persistir) {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, tema);
    }
};

const inicializarControleTema = (): void => {
    const controleTema = document.getElementById("alternar-tema") as HTMLInputElement | null;
    if (!controleTema) {
        return;
    }

    const preferenciaSistema = window.matchMedia("(prefers-color-scheme: dark)");
    const temaArmazenado = obterPreferenciaArmazenada();
    const temaInicial: TemaPreferido = temaArmazenado ?? "dark";

    aplicarTema(temaInicial, temaArmazenado !== null);
    controleTema.checked = temaInicial === "dark";

    controleTema.addEventListener("change", () => {
        const novoTema: TemaPreferido = controleTema.checked ? "dark" : "light";
        aplicarTema(novoTema, true);
    });

    preferenciaSistema.addEventListener("change", (evento: MediaQueryListEvent) => {
        if (possuiPreferenciaArmazenada()) {
            return;
        }

        const temaAtualizado: TemaPreferido = evento.matches ? "dark" : "light";
        aplicarTema(temaAtualizado, false);
        controleTema.checked = temaAtualizado === "dark";
    });
};

document.addEventListener("DOMContentLoaded", () => {
    inicializarControleTema();
});

export { };
