/* ============================
   Gerador CNPJ Alfanumérico 2026
   - Corpo: 12 caracteres [0-9A-Z] (ou apenas números)
   - Dígitos verificadores: módulo 11 (somente numéricos)
   - Máscara visual: ##.###.###/####-##
   - Auto-regeneração: 10s + barra de progresso
============================ */

import { IntervaloTemporizador, TamanhoIdentificador, TipoAviso } from "../gerais/enums.js";
import { CARACTERES_PERMITIDOS } from "../gerais/constantes.js";
import {
  ElementosInterface,
  HistoricoIdentificadores,
  IdentificadorGerado,
  Temporizadores,
} from "../gerais/tipos.js";
import { htmlCookies, inicializarAvisoDeCookies } from "../gerais/cookies.js";
import { aplicarMascara } from "./formatacao-cnpj.js";
import {
  calcularDigitoVerificador,
  converterCaractereParaValor,
  verificarSequenciaRepetida,
  PESOS_DIGITOS,
} from "../cnpj/algoritmo-cnpj.js";
import {
  copiarTexto,
  inicializarEfeitoOnda,
  obterElementoObrigatorio,
} from "../interface/interface.js";
import { exibirAviso } from "../gerais/mensageria.js";

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
    inicializarEfeitoOnda();
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
      exibirAviso(this.elementos.areaAviso, "Erro inesperado ao gerar.", TipoAviso.Erro);
    }
  }

  /**
   * @summary Manipula o clique no botão de geração em lote (+10).
   */
  private tratarCliqueGera10(): void {
    try {
      for (let i = 0; i < 10; i++) {
        if (this.historico.itens.length >= this.historico.limite) {
          exibirAviso(
            this.elementos.areaAviso,
            `Limite de ${this.historico.limite} CNPJs atingido. CALMAAAAA QUE O NAVEGADOR NUM GUENTA!!! 😅`,
            TipoAviso.Erro,
          );
          break;
        }
        this.gerarEExibirIdentificador(true, 10);
      }
    } catch (erro) {
      this.cnpjAtual = null;
      this.elementos.campoResultado.value = "";
      console.error(erro);
      exibirAviso(this.elementos.areaAviso, "Erro inesperado ao gerar.", TipoAviso.Erro);
    }
  }

  /**
   * @summary Manipula o clique no botão de copiar o identificador atual.
   */
  private async tratarCliqueCopiar(): Promise<void> {
    if (!this.cnpjAtual) {
      exibirAviso(this.elementos.areaAviso, "Nenhum CNPJ gerado para copiar", TipoAviso.Erro);
      return;
    }

    try {
      const valorParaCopiar = this.elementos.controleMascara?.checked
        ? aplicarMascara(this.cnpjAtual)
        : this.cnpjAtual;
      await copiarTexto(valorParaCopiar);
      exibirAviso(
        this.elementos.areaAviso,
        `CNPJ copiado: ${valorParaCopiar}`,
        TipoAviso.InfoAlternativo,
      );
    } catch (erro) {
      console.error(erro);
      exibirAviso(this.elementos.areaAviso, "Falha ao copiar", TipoAviso.Erro);
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
  // Reaproveitado de algoritmo-cnpj.ts via import

  /**
   * @summary Verifica se todos os caracteres da sequência são idênticos.
   * @param valor Texto a ser avaliado.
   * @returns Indica se a sequência está composta por um único caractere repetido.
   */
  // Reaproveitado de algoritmo-cnpj.ts via import

  /**
   * @summary Calcula um dígito verificador com base em valores e pesos informados.
   * @param valores Vetor com os valores numéricos do identificador.
   * @param pesos Pesos utilizados no cálculo do módulo 11.
   * @returns Dígito verificador calculado conforme as regras do módulo 11.
   */
  // Reaproveitado de algoritmo-cnpj.ts via import

  /**
   * @summary Aplica a máscara visual padrão do CNPJ ao valor informado.
   * @param valor Identificador puro com 14 caracteres.
   * @returns Texto formatado conforme a máscara ##.###.###/####-##.
   */
  // Reaproveitado de formatacao-cnpj.ts via import

  /**
   * @summary Gera um identificador válido composto por corpo (alfa ou numérico) e dígitos verificadores.
   * @returns Objeto com a versão pura e mascarada do identificador gerado.
   */
  private gerarIdentificadorValido(): IdentificadorGerado {
    const limiteTentativas = 2_000;

    for (let tentativa = 0; tentativa < limiteTentativas; tentativa++) {
      const usarAlfanumerico = this.elementos.controleAlfanumerico?.checked !== false;
      const corpo = usarAlfanumerico ? this.gerarCorpoAlfanumerico() : this.gerarCorpoNumerico();
      if (verificarSequenciaRepetida(corpo)) {
        continue;
      }

      const valores = Array.from(corpo).map((caractere) => converterCaractereParaValor(caractere));
      const digitoUm = calcularDigitoVerificador(valores, PESOS_DIGITOS.primeiro);
      const digitoDois = calcularDigitoVerificador([...valores, digitoUm], PESOS_DIGITOS.segundo);

      const identificadorCompleto = `${corpo}${digitoUm}${digitoDois}`;
      if (identificadorCompleto.length !== TamanhoIdentificador.Total) {
        continue;
      }
      const padrao = usarAlfanumerico ? /^[0-9A-Z]{12}[0-9]{2}$/ : /^[0-9]{14}$/;
      if (!padrao.test(identificadorCompleto)) {
        continue;
      }
      if (verificarSequenciaRepetida(identificadorCompleto)) {
        continue;
      }

      return {
        puro: identificadorCompleto,
        mascarado: aplicarMascara(identificadorCompleto),
      };
    }

    throw new Error("Não foi possível gerar um identificador válido.");
  }

  /**
   * @summary Exibe um aviso temporário para o usuário com estilos adequados ao tipo.
   * @param mensagem Texto exibido dentro do aviso.
   * @param tipo Tipo do aviso a ser aplicado.
   */
  // Exibição de avisos reaproveitada via utilitário em ui.ts

  /**
   * @summary Copia um texto para a área de transferência do sistema.
   * @param valor Texto que será copiado.
   */
  // Cópia para clipboard reaproveitada via utilitário em ui.ts

  /**
   * @summary Atualiza o campo principal de resultado considerando a máscara selecionada.
   */
  private atualizarCampoResultado(): void {
    if (!this.cnpjAtual) {
      return;
    }

    const { campoResultado, controleMascara } = this.elementos;
    campoResultado.value = controleMascara?.checked
      ? aplicarMascara(this.cnpjAtual)
      : this.cnpjAtual;
  }

  /**
   * @summary Gera um novo identificador, atualiza o campo de resultado e reinicia a contagem automática.
   * @param disparoManual Indica se a geração foi solicitada manualmente pelo usuário.
   */
  private gerarEExibirIdentificador(disparoManual = false, disparoEmLote?: number): void {
    // Impede novas gerações ao atingir o limite e interrompe a auto-regeneração
    if (this.historico.itens.length >= this.historico.limite) {
      exibirAviso(
        this.elementos.areaAviso,
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

    if (disparoManual)
      exibirAviso(this.elementos.areaAviso, "Novo CNPJ alfanumérico gerado", TipoAviso.Sucesso);

    if (disparoEmLote)
      exibirAviso(
        this.elementos.areaAviso,
        `Novos ${disparoEmLote} CNPJs alfanuméricos gerados`,
        TipoAviso.Sucesso,
      );

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
      const texto = controleMascara?.checked ? aplicarMascara(puro) : puro;
      const item = document.createElement("li");
      item.className =
        "flex items-center justify-between gap-3 rounded-md ring-2 ring-slate-100 dark:ring-slate-800 dark:shadow-2xl px-3 py-1 hover:ring-zinc-200/50 transition-all duration-300 dark:hover:ring-slate-900 cursor-default";

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
          await copiarTexto(texto);
          exibirAviso(
            this.elementos.areaAviso,
            `CNPJ copiado: ${texto}`,
            TipoAviso.InfoAlternativo,
          );
        } catch {
          exibirAviso(this.elementos.areaAviso, "Falha ao copiar", TipoAviso.Erro);
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
      exibirAviso(this.elementos.areaAviso, "Nenhum CNPJ no histórico.", TipoAviso.Erro);
      return;
    }

    const { controleMascara } = this.elementos;
    const listaParaCopiar = this.historico.itens
      .map((puro) => (controleMascara?.checked ? aplicarMascara(puro) : puro))
      .join(",");

    try {
      await copiarTexto(listaParaCopiar);
      if (this.historico.itens.length === 1) {
        exibirAviso(
          this.elementos.areaAviso,
          `Copiado 1 CNPJ: ${listaParaCopiar}`,
          TipoAviso.InfoAlternativo,
        );
        return;
      } else {
        exibirAviso(
          this.elementos.areaAviso,
          `Copiados ${this.historico.itens.length} CNPJs separados por vírgula`,
          TipoAviso.Info,
        );
      }
    } catch {
      exibirAviso(this.elementos.areaAviso, "Falha ao copiar todos.", TipoAviso.Erro);
    }
  }

  /**
   * @summary Atualiza o estado visual e funcional do botão de copiar todos os itens do histórico.
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

  // Efeito de onda movido para utilitário em ui.ts
}

/**
 * @summary Obtém um elemento obrigatório por id, lançando erro caso não exista.
 * @param id Identificador do elemento HTML desejado.
 * @returns Referência ao elemento encontrado.
 */
// obterElementoObrigatorio reaproveitado de ui.ts

// Bootstrap do gerador e do banner de cookies
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("aviso-cookies")) {
    document.body.insertAdjacentHTML("beforeend", htmlCookies);
  }
  inicializarAvisoDeCookies();

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

  void new GeradorCnpj(elementos);
});

export {};
