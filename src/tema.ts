const CHAVE_ARMAZENAMENTO = "tema-cnpj-2026" as const;
const CHAVE_ARMAZENAMENTO_ANTERIOR = "theme" as const;

type TemaPreferido = "light" | "dark";

/**
 * @summary Identifica e aplica a preferência de tema inicial
 *
 * Identifica a preferência de tema (armazenada ou antiga) e aplica o tema
 * inicial com base nessa preferência ou na preferência do sistema.
 *
 * - Lê a chave atual e a chave anterior de localStorage.
 * - Migra o valor da chave antiga quando necessário.
 * - Aplica a classe `dark` ao <html> quando o tema a aplicar for escuro.
 */
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

identificaPreferenciaEAplicaTema();

/**
 * @summary Type guard para tema válido
 *
 * Guarda se o valor informado é um tema válido (type guard).
 * @param valor Valor possivelmente armazenado em localStorage
 * @returns true quando o valor é "light" ou "dark"
 */
const ehTemaValido = (valor: string | null): valor is TemaPreferido =>
    valor === "light" || valor === "dark";

/**
 * @summary Retorna preferência de tema armazenada (com migração)
 *
 * Retorna a preferência de tema armazenada pelo usuário, se houver.
 * Caso exista uma chave legada (`theme`), faz migração para a chave atual.
 * @returns "light" | "dark" quando presente, senão null
 */
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

/**
 * @summary Indica se há preferência de tema armazenada
 *
 * Indica se há uma preferência de tema armazenada atualmente.
 * @returns true quando a chave de armazenamento contém um tema válido
 */
const possuiPreferenciaArmazenada = (): boolean => {
    const temaAtual = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return ehTemaValido(temaAtual);
};

/**
 * @summary Aplica e (opcionalmente) persiste o tema
 *
 * Aplica o tema informado no `document.documentElement` e opcionalmente
 * persiste essa escolha em localStorage.
 * @param tema Tema a aplicar ("light" | "dark")
 * @param persistir Se true, grava a preferência em localStorage
 */
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

/**
 * @summary Inicializa o controle de alternância de tema
 *
 * Inicializa o controle de alternância de tema no DOM.
 * - Lê a preferência armazenada para decidir o estado inicial do checkbox.
 * - Escuta mudanças do checkbox para aplicar e persistir o novo tema.
 * - Observa alterações na preferência do sistema e as aplica caso não haja
 *   preferência do usuário armazenada.
 */
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
