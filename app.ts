/* ============================
   Gerador CNPJ Alfanumérico 2026
   - Corpo: 12 caracteres [0-9A-Z]
   - Dígitos verificadores: módulo 11 (somente numéricos)
   - Máscara visual: ##.###.###/####-##
   - Auto-regeneração: 10s + barra de progresso
============================ */

import {
    ClasseAviso,
    IntervaloTemporizador,
    TamanhoIdentificador,
    TipoAviso,
} from "./src/enums.js";
import {
    CARACTERES_PERMITIDOS,
    CLASSES_AVISO_OCULTO,
    CLASSES_AVISO_VISIVEL,
    MAPA_CLASSES_TIPO_AVISO,
    PESOS_DIGITOS,
} from "./src/constantes.js";
import {
    ElementosInterface,
    HistoricoIdentificadores,
    IdentificadorGerado,
    Temporizadores,
} from "./src/tipos.js";
import { htmlCookies, inicializarAvisoDeCookies } from "./src/cookies.js";

/**
 * @summary Classe responsável por agrupar regras de negócio e interação com a interface do gerador.
 */
class GeradorCnpj {
    private cnpjAtual: string | null = null;
    private readonly historico: HistoricoIdentificadores = { itens: [], limite: 100 };
    private readonly temporizadores: Temporizadores = { inicioContagem: 0 };

    /**
     * @summary Inicializa a classe com os elementos de interface necessários.
     * @param elementos Elementos HTML utilizados pela aplicação.
     */
    public constructor(private readonly elementos: ElementosInterface) {
        this.configurarEventos();
        this.inicializarEfeitoOnda();
        this.inicializarHistorico();
        this.gerarEExibirIdentificador();
    }

    /**
     * @summary Configura todos os manipuladores de eventos da interface.
     */
    private configurarEventos(): void {
        const { botaoGerar, botaoGerar10, botaoCopiar, botaoCopiarTodos, controleMascara } =
            this.elementos;

        botaoGerar.addEventListener("click", () => {
            this.tratarCliqueGerar();
        });

        botaoGerar10.addEventListener("click", () => {
            this.tratarCliqueGera10();
        });

        botaoCopiar.addEventListener("click", () => {
            void this.tratarCliqueCopiar();
        });

        botaoCopiarTodos?.addEventListener("click", (evento) => {
            evento.preventDefault();
            void this.copiarTodos();
        });

        controleMascara?.addEventListener("change", () => {
            this.atualizarCampoResultado();
            this.atualizarVisualHistorico();
        });
    }

    /**
     * @summary Manipula o clique no botão principal de geração de identificador.
     */
    private tratarCliqueGerar(): void {
        try {
            this.gerarEExibirIdentificador(true);
        } catch (erro) {
            this.cnpjAtual = null;
            this.elementos.campoResultado.value = "";
            console.error(erro);
            this.exibirAviso("Erro inesperado ao gerar.", TipoAviso.Erro);
        }
    }

    /**
     * @summary Manipula o clique no botão principal de geração de identificador.
     */
    private tratarCliqueGera10(): void {
        try {
            for (let i = 0; i < 10; i++) {
                if (this.historico.itens.length >= this.historico.limite) {
                    this.exibirAviso(
                        `Limite de ${this.historico.limite} CNPJs atingido. CALMAAAAA QUE O NAVEGADOR NUM GUENTA!!! 😅`,
                        TipoAviso.Info,
                    );
                    break;
                }
                this.gerarEExibirIdentificador(true, 10);
            }
        } catch (erro) {
            this.cnpjAtual = null;
            this.elementos.campoResultado.value = "";
            console.error(erro);
            this.exibirAviso("Erro inesperado ao gerar.", TipoAviso.Erro);
        }
    }

    /**
     * @summary Manipula o clique no botão de copiar o identificador atual.
     */
    private async tratarCliqueCopiar(): Promise<void> {
        if (!this.cnpjAtual) {
            this.exibirAviso("Nenhum CNPJ gerado para copiar", TipoAviso.Erro);
            return;
        }

        try {
            const valorParaCopiar = this.elementos.controleMascara?.checked
                ? this.aplicarMascara(this.cnpjAtual)
                : this.cnpjAtual;
            await this.copiarTexto(valorParaCopiar);
            this.exibirAviso(`CNPJ copiado: ${valorParaCopiar}`, TipoAviso.InfoAlternativo);
        } catch (erro) {
            console.error(erro);
            this.exibirAviso("Falha ao copiar", TipoAviso.Erro);
        }
    }

    /**
     * @summary Gera uma sequência base alfanumérica com o tamanho definido para o identificador.
     * @returns Sequência composta por caracteres permitidos em letras maiúsculas.
     */
    private gerarCorpoAlfanumerico(): string {
        let corpo = "";
        for (let indice = 0; indice < TamanhoIdentificador.Corpo; indice++) {
            const indiceCaractere = Math.floor(Math.random() * CARACTERES_PERMITIDOS.length);
            corpo += CARACTERES_PERMITIDOS[indiceCaractere] ?? "";
        }
        return corpo;
    }

    /**
     * @summary Gera uma sequência base exclusivamente numérica com o tamanho definido.
     * @returns Sequência composta apenas por dígitos [0-9].
     */
    private gerarCorpoNumerico(): string {
        let corpo = "";
        for (let indice = 0; indice < TamanhoIdentificador.Corpo; indice++) {
            corpo += Math.floor(Math.random() * 10).toString();
        }
        return corpo;
    }

    /**
     * @summary Converte um caractere alfanumérico para o valor numérico esperado pelo módulo 11.
     * @param caractere Caractere a ser convertido.
     * @returns Valor numérico correspondente ao caractere informado.
     */
    private converterCaractereParaValor(caractere: string): number {
        const codigo = caractere.toUpperCase().charCodeAt(0);
        const codigoZero = "0".charCodeAt(0);
        const codigoNove = "9".charCodeAt(0);
        const codigoA = "A".charCodeAt(0);
        const codigoZ = "Z".charCodeAt(0);

        if (
            (codigo >= codigoZero && codigo <= codigoNove) ||
            (codigo >= codigoA && codigo <= codigoZ)
        ) {
            return codigo - codigoZero;
        }

        throw new Error(`Caractere inválido para CNPJ alfanumérico: ${caractere}`);
    }

    /**
     * @summary Verifica se todos os caracteres da sequência são idênticos.
     * @param valor Texto a ser avaliado.
     * @returns Indica se a sequência está composta por um único caractere repetido.
     */
    private verificarSequenciaRepetida(valor: string): boolean {
        return valor.length > 0 && valor.split("").every((caractere) => caractere === valor[0]);
    }

    /**
     * @summary Calcula um dígito verificador com base em valores e pesos informados.
     * @param valores Vetor com os valores numéricos do identificador.
     * @param pesos Pesos utilizados no cálculo do módulo 11.
     * @returns Dígito verificador calculado conforme as regras do módulo 11.
     */
    private calcularDigitoVerificador(valores: number[], pesos: number[]): number {
        const soma = valores.reduce(
            (acumulado, valorAtual, indice) => acumulado + valorAtual * pesos[indice],
            0,
        );
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    /**
     * @summary Aplica a máscara visual padrão do CNPJ ao valor informado.
     * @param valor Identificador puro com 14 caracteres.
     * @returns Texto formatado conforme a máscara ##.###.###/####-##.
     */
    private aplicarMascara(valor: string): string {
        const mascara = "##.###.###/####-##";
        let resultado = "";
        let indiceValor = 0;

        for (const caractereMascara of mascara) {
            if (caractereMascara === "#") {
                resultado += valor[indiceValor++] ?? "";
            } else {
                resultado += caractereMascara;
            }
        }

        return resultado;
    }

    /**
     * @summary Gera um identificador válido composto por corpo alfanumérico e dígitos verificadores.
     * @returns Objeto com a versão pura e mascarada do identificador gerado.
     */
    private gerarIdentificadorValido(): IdentificadorGerado {
        const limiteTentativas = 2_000;

        for (let tentativa = 0; tentativa < limiteTentativas; tentativa++) {
            const usarAlfanumerico = this.elementos.controleAlfanumerico?.checked !== false;
            const corpo = usarAlfanumerico
                ? this.gerarCorpoAlfanumerico()
                : this.gerarCorpoNumerico();
            if (this.verificarSequenciaRepetida(corpo)) {
                continue;
            }

            const valores = Array.from(corpo).map((caractere) =>
                this.converterCaractereParaValor(caractere),
            );
            const digitoUm = this.calcularDigitoVerificador(valores, PESOS_DIGITOS.primeiro);
            const digitoDois = this.calcularDigitoVerificador(
                [...valores, digitoUm],
                PESOS_DIGITOS.segundo,
            );

            const identificadorCompleto = `${corpo}${digitoUm}${digitoDois}`;
            if (identificadorCompleto.length !== TamanhoIdentificador.Total) {
                continue;
            }
            const padrao = usarAlfanumerico ? /^[0-9A-Z]{12}[0-9]{2}$/ : /^[0-9]{14}$/;
            if (!padrao.test(identificadorCompleto)) {
                continue;
            }
            if (this.verificarSequenciaRepetida(identificadorCompleto)) {
                continue;
            }

            return {
                puro: identificadorCompleto,
                mascarado: this.aplicarMascara(identificadorCompleto),
            };
        }

        throw new Error("Não foi possível gerar um identificador válido.");
    }

    /**
     * @summary Exibe um aviso temporário para o usuário com estilos adequados ao tipo.
     * @param mensagem Texto exibido dentro do aviso.
     * @param tipo Tipo do aviso a ser aplicado.
     */
    private exibirAviso(mensagem: string, tipo: TipoAviso = TipoAviso.Sucesso): void {
        const { areaAviso } = this.elementos;
        const classesBase =
            "fixed top-4 right-3 min-w-60 max-w-[calc(100%-2rem)] rounded-lg px-4 py-3 text-sm shadow-2xl transition-all duration-300 ease-out";

        areaAviso.textContent = mensagem;
        areaAviso.className = `${classesBase} ${MAPA_CLASSES_TIPO_AVISO[tipo].join(" ")} ${ClasseAviso.OpacidadeOculta} ${ClasseAviso.TranslacaoOculta} ${ClasseAviso.PonteiroDesativado}`;

        requestAnimationFrame(() => {
            areaAviso.classList.remove(...CLASSES_AVISO_OCULTO);
            areaAviso.classList.add(...CLASSES_AVISO_VISIVEL);
        });

        if (this.temporizadores.timeoutAviso !== undefined) {
            window.clearTimeout(this.temporizadores.timeoutAviso);
        }

        this.temporizadores.timeoutAviso = window.setTimeout(() => {
            areaAviso.classList.remove(...CLASSES_AVISO_VISIVEL);
            areaAviso.classList.add(...CLASSES_AVISO_OCULTO);
        }, IntervaloTemporizador.Aviso);
    }

    /**
     * @summary Copia um texto para a área de transferência do sistema.
     * @param valor Texto que será copiado.
     */
    private async copiarTexto(valor: string): Promise<void> {
        await navigator.clipboard.writeText(valor);
    }

    /**
     * @summary Atualiza o campo principal de resultado considerando a máscara selecionada.
     */
    private atualizarCampoResultado(): void {
        if (!this.cnpjAtual) {
            return;
        }

        const { campoResultado, controleMascara } = this.elementos;
        campoResultado.value = controleMascara?.checked
            ? this.aplicarMascara(this.cnpjAtual)
            : this.cnpjAtual;
    }

    /**
     * @summary Gera um novo identificador, atualiza o campo de resultado e reinicia a contagem automática.
     * @param disparoManual Indica se a geração foi solicitada manualmente pelo usuário.
     */
    private gerarEExibirIdentificador(disparoManual = false, disparoEmLote?: number): void {
        // Impede novas gerações ao atingir o limite e interrompe a auto-regeneração
        if (this.historico.itens.length >= this.historico.limite) {
            this.exibirAviso(
                `Limite de ${this.historico.limite} CNPJs atingido. Não é possível gerar novos registros.`,
                TipoAviso.Erro,
            );

            if (this.temporizadores.intervaloRegressivo !== undefined) {
                window.clearInterval(this.temporizadores.intervaloRegressivo);
            }

            const { textoTempoRestante, barraProgresso } = this.elementos;
            textoTempoRestante.textContent = "Limite atingido";
            barraProgresso.style.transform = "scaleX(0)";
            return;
        }

        const { campoResultado, controleMascara } = this.elementos;
        const identificador = this.gerarIdentificadorValido();

        this.cnpjAtual = identificador.puro;
        campoResultado.value = controleMascara?.checked ? identificador.mascarado : identificador.puro;
        this.adicionarAoHistorico(identificador.puro);

        if (disparoManual) {
            this.exibirAviso("Novo CNPJ alfanumérico gerado", TipoAviso.Sucesso);
        }

        if (disparoEmLote) {
            this.exibirAviso(`Novos ${disparoEmLote} CNPJs alfanuméricos gerados`, TipoAviso.Sucesso);
        }

        this.temporizadores.inicioContagem = performance.now();
        this.atualizarContagemRegressiva();

        if (this.temporizadores.intervaloRegressivo !== undefined) {
            window.clearInterval(this.temporizadores.intervaloRegressivo);
        }

        this.temporizadores.intervaloRegressivo = window.setInterval(
            () => this.atualizarContagemRegressiva(),
            IntervaloTemporizador.Atualizacao,
        );
    }


    /**
     * @summary Atualiza a contagem regressiva e o estado visual da barra de progresso.
     */
    private atualizarContagemRegressiva(): void {
        const { textoTempoRestante, barraProgresso } = this.elementos;
        const tempoDecorrido = performance.now() - this.temporizadores.inicioContagem;
        const tempoRestante = IntervaloTemporizador.GeracaoAutomatica - tempoDecorrido;

        if (tempoRestante <= 0) {
            this.gerarEExibirIdentificador();
            return;
        }

        textoTempoRestante.textContent = `Novo em ${(tempoRestante / 1_000).toFixed(1)}s`;
        const fracaoRestante = Math.max(
            0,
            Math.min(1, 1 - tempoDecorrido / IntervaloTemporizador.GeracaoAutomatica),
        );

        barraProgresso.style.transform = `scaleX(${fracaoRestante})`;
        barraProgresso.style.background = "linear-gradient(to left, #bd93f9, #8b5cf6)";

    }


    /**
     * @summary Reinicia o histórico para o estado inicial vazio.
     */
    private inicializarHistorico(): void {
        this.historico.itens = [];
        this.atualizarVisualHistorico();
    }


    /**
     * @summary Adiciona um novo identificador ao histórico, respeitando o limite configurado.
     * @param novo Identificador puro recém-gerado.
     */
    private adicionarAoHistorico(novo: string): void {
        if (this.historico.itens[0] === novo) {
            return;
        }

        this.historico.itens.unshift(novo);
        if (this.historico.itens.length > this.historico.limite) {
            this.historico.itens.pop();
        }
        this.atualizarVisualHistorico();
    }

    /**
     * @summary Renderiza o histórico de identificadores na interface.
     */
    private atualizarVisualHistorico(): void {
        const { listaRecentes, controleMascara } = this.elementos;

        if (!listaRecentes) {
            this.atualizarEstadoBotaoCopiarTodos();
            return;
        }

        listaRecentes.innerHTML = "";

        this.historico.itens.forEach((puro) => {
            const texto = controleMascara?.checked ? this.aplicarMascara(puro) : puro;
            const item = document.createElement("li");
            item.className = "flex items-center justify-between gap-3 rounded-md ring-2 ring-slate-100 dark:ring-slate-800 dark:shadow-2xl px-3 py-1 hover:ring-slate-300 transition-all duration-300 dark:hover:ring-slate-900 cursor-default";

            const rotulo = document.createElement("span");
            rotulo.className = "ml-1 text-sm text-slate-600 font-semibold dark:text-zinc-50 break-words";
            rotulo.textContent = texto;

            const botao = document.createElement("button");
            botao.className =
                "ml-1 inline-flex items-center justify-center rounded bg-transparent text-violet-500 transition-all dark:text-violet-500 dark:hover:text-violet-500 hover:violet-600 ease-in-out hover:text-violet-600 px-2 py-1 text-xs active:scale-75";
            botao.setAttribute("title", "Copiar esse CNPJ");
            botao.innerHTML = `
                <svg class="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
                </svg>
            `;

            botao.addEventListener("click", async (evento) => {
                evento.preventDefault();
                try {
                    await this.copiarTexto(texto);
                    this.exibirAviso(`CNPJ copiado: ${texto}`, TipoAviso.InfoAlternativo);
                } catch {
                    this.exibirAviso("Falha ao copiar", TipoAviso.Erro);
                }
            });

            item.append(rotulo, botao);
            listaRecentes.appendChild(item);
        });

        listaRecentes.scrollTop = 0;
        this.atualizarEstadoBotaoCopiarTodos();
    }

    /**
     * @summary Copia todos os itens presentes no histórico para a área de transferência.
     */
    private async copiarTodos(): Promise<void> {
        if (this.historico.itens.length === 0) {
            this.exibirAviso("Nenhum CNPJ no histórico.", TipoAviso.Erro);
            return;
        }

        const { controleMascara } = this.elementos;
        const listaParaCopiar = this.historico.itens
            .map((puro) => (controleMascara?.checked ? this.aplicarMascara(puro) : puro))
            .join(",");

        try {
            await this.copiarTexto(listaParaCopiar);
            this.exibirAviso(
                `Copiados ${this.historico.itens.length} CNPJs separados por vírgula`,
                TipoAviso.Info,
            );
        } catch {
            this.exibirAviso("Falha ao copiar todos.", TipoAviso.Erro);
        }
    }

    /**
     * @summary Atualiza o estado visual e funcional do botão de copiar todos os itens do histórico.
     */
    /**
     * Atualiza o estado visual do botão "Copiar em massa",
     * exibindo um contador em formato de bolinha ao lado do texto.
     */
    private atualizarEstadoBotaoCopiarTodos(): void {
        const { botaoCopiarTodos, contadorHistorico } = this.elementos;

        const total = this.historico.itens.length;
        const totalExibido = Math.min(total, this.historico.limite);

        if (botaoCopiarTodos) {
            botaoCopiarTodos.disabled = total === 0;
            botaoCopiarTodos.classList.toggle("cursor-nao-permitido", total === 0);
            botaoCopiarTodos.classList.toggle("opacity-60", total === 0);
        }

        if (contadorHistorico) {
            if (total > 0) {
                contadorHistorico.textContent = totalExibido.toString();
                contadorHistorico.className =
                    "absolute mt-1.5 ml-2 inline-flex items-center justify-center rounded-lg p-2 bg-transparent text-slate-600 dark:text-zinc-50 text-xs font-bold w-6 h-6 border-2 border-zinc-600 dark:border-zinc-50 dark:border-zinc-50 cursor-default";
            } else {
                contadorHistorico.textContent = "";
                contadorHistorico.className = "hidden";
            }
        }
    }

    /**
     * Inicializa o efeito de onda em todos os botões que tiverem:
     *  - .efeito-onda-base (obrigatória)
     *  - .efeitoOndaClaro  (para botões sem fundo)
     *  - .efeitoOndaEscuro (para botões com fundo)
     */
    private inicializarEfeitoOnda(): void {
        const botoes = document.querySelectorAll<HTMLElement>(".efeito-onda-base");

        botoes.forEach((botao) => {
            // garante contexto de posicionamento
            botao.style.position = botao.style.position || "relative";
            botao.style.overflow = botao.style.overflow || "hidden";

            botao.addEventListener("click", (evento: MouseEvent) => {
                // evita criar efeito em botões realmente desabilitados
                if ((botao as HTMLButtonElement).disabled) return;

                const baseRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
                const rect = botao.getBoundingClientRect();
                const x = (evento.pageX - (rect.left + window.scrollX)) / baseRem;
                const y = (evento.pageY - (rect.top + window.scrollY)) / baseRem;

                const bolha = document.createElement("span");
                bolha.className = "efeito-onda-circulo";
                bolha.style.left = `${x}rem`;
                bolha.style.top = `${y}rem`;

                botao.appendChild(bolha);
                setTimeout(() => bolha.remove(), 600);
            });
        });
    }


}

/**
 * @summary Obtém um elemento obrigatório por id, lançando erro caso não exista.
 * @param id Identificador do elemento HTML desejado.
 * @returns Referência ao elemento encontrado.
 */
function obterElementoObrigatorio<T extends HTMLElement>(id: string): T {
    const elemento = document.getElementById(id);
    if (!elemento) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return elemento as T;
}



// Garante que o banner de cookies exista no DOM
document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("aviso-cookies")) {
        document.body.insertAdjacentHTML("beforeend", htmlCookies);
    }
    inicializarAvisoDeCookies();
});

const elementos: ElementosInterface = {
    campoResultado: obterElementoObrigatorio<HTMLInputElement>("campo-resultado"),
    botaoGerar: obterElementoObrigatorio<HTMLButtonElement>("botao-gerar"),
    botaoGerar10: obterElementoObrigatorio<HTMLButtonElement>("botao-gerar-10"),
    botaoCopiar: obterElementoObrigatorio<HTMLButtonElement>("botao-copiar"),
    areaAviso: obterElementoObrigatorio<HTMLDivElement>("toast"),
    textoTempoRestante: obterElementoObrigatorio<HTMLDivElement>("tempo-restante"),
    barraProgresso: obterElementoObrigatorio<HTMLElement>("barra"),
    controleMascara: document.getElementById("toggle-mascara") as HTMLInputElement | null,
    controleAlfanumerico: document.getElementById("toggle-alfanumerico") as HTMLInputElement | null,
    listaRecentes: document.getElementById("lista-recentes") as HTMLUListElement | null,
    botaoCopiarTodos: document.getElementById("botao-copiar-todos") as HTMLButtonElement | null,
    contadorHistorico: document.getElementById("contador-historico") as HTMLSpanElement | null,
};

// Inicialização da aplicação
new GeradorCnpj(elementos);
