/* ============================
   Validador de CNPJ via OpenCNPJ
   - Integração para consulta pública de dados cadastrais
   - Validação individual e em massa com histórico persistente
   - Exibição detalhada dos dados consultados em modal
============================ */

import { ClasseAviso, IntervaloTemporizador, TipoAviso } from "../gerais/enums.js";
import {
    CLASSES_AVISO_OCULTO,
    CLASSES_AVISO_VISIVEL,
    MAPA_CLASSES_TIPO_AVISO,
} from "../gerais/constantes.js";
import { htmlCookies, inicializarAvisoDeCookies } from "../gerais/cookies.js";
import { aplicarMascara, aplicarMascaraProgressiva, normalizarPuro } from "./formatacao-cnpj.js";
import { inicializarEfeitoOnda } from "../interface/interface.js";
import { exibirAviso } from "../gerais/mensageria.js";
import { atualizarContadorHistorico } from "../interface/contador-historico.js";

const URL_BASE_OPEN_CNPJ = "https://api.opencnpj.org";

/**
 * @summary Estrutura básica de um endereço cadastral retornado pela API.
 */
interface EnderecoCnpj {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
}

/**
 * @summary Representa uma atividade econômica do CNPJ consultado.
 */
interface AtividadeCnpj {
    codigo?: string;
    descricao?: string;
}

/**
 * @summary Representa um sócio ou responsável vinculado ao CNPJ.
 */
interface SocioCnpj {
    nome?: string;
    qualificacao?: string;
    tipo?: string;
    pais?: string;
    entrada?: string;
}

/**
 * @summary Conjunto completo de dados normalizados da consulta ao OpenCNPJ.
 */
export interface DadosCnpj {
    cnpj: string;
    nomeEmpresarial?: string;
    nomeFantasia?: string;
    situacaoCadastral?: string;
    dataSituacaoCadastral?: string;
    naturezaJuridica?: string;
    capitalSocial?: number;
    porte?: string;
    telefone?: string;
    email?: string;
    endereco?: EnderecoCnpj | null;
    atividadePrincipal?: AtividadeCnpj | null;
    atividadesSecundarias?: AtividadeCnpj[];
    socios?: SocioCnpj[];
    dadosOriginais: Record<string, unknown>;
}

/**
 * @summary Estrutura do resultado das validações utilizando a API pública.
 */
export interface ResultadoValidacaoApi {
    puro: string;
    valido: boolean;
    mensagem: string;
    statusHttp: number;
    dados: DadosCnpj | null;
    carregando?: boolean;
    mensagemComplementar?: string;
}

/**
 * @summary Estrutura com os elementos necessários para controle de interface.
 */
interface ElementosValidador {
    campoUnico: HTMLInputElement;
    campoMassa: HTMLTextAreaElement;
    controleMascara: HTMLInputElement;
    controleMassa: HTMLInputElement;
    botaoValidarUnico: HTMLButtonElement;
    botaoValidarMassa: HTMLButtonElement;
    listaHistorico: HTMLUListElement;
    areaAviso: HTMLDivElement;
    botaoColar: HTMLButtonElement;
    modalOverlay: HTMLDivElement;
    modalConteudo: HTMLDivElement;
    modalTitulo: HTMLHeadingElement;
    botaoFecharModal: HTMLButtonElement;
    modalCaixa: HTMLDivElement;
}

/**
 * @summary Erro especializado que transporta o status HTTP retornado pela API.
 */
class ErroOpenCnpjApi extends Error {
    public readonly statusHttp: number;

    public constructor(statusHttp: number, mensagem: string) {
        super(mensagem);
        this.statusHttp = statusHttp;
        this.name = "ErroOpenCnpjApi";
    }
}

/**
 * @summary Consulta a API do OpenCNPJ e retorna os dados normalizados do CNPJ informado.
 */
export async function buscarDadosCnpj(cnpj: string): Promise<DadosCnpj | null> {
    const puro = normalizarPuro(cnpj);
    if (puro.length !== 14) {
        throw new ErroOpenCnpjApi(400, "CNPJ deve conter 14 caracteres válidos para consulta.");
    }

    let resposta: Response;
    try {
        resposta = await fetch(`${URL_BASE_OPEN_CNPJ}/${puro}`, {
            headers: {
                Accept: "application/json",
            },
        });
    } catch {
        throw new ErroOpenCnpjApi(0, "Falha de comunicação com o serviço do OpenCNPJ.");
    }

    if (resposta.status === 404) {
        return null;
    }

    if (resposta.status === 429) {
        throw new ErroOpenCnpjApi(
            429,
            "Limite de consultas do OpenCNPJ atingido. Aguarde alguns instantes e tente novamente.",
        );
    }

    if (!resposta.ok) {
        throw new ErroOpenCnpjApi(
            resposta.status,
            "Não foi possível consultar o CNPJ na API do OpenCNPJ.",
        );
    }

    const dados = await resposta.json();
    return normalizarDadosOpenCnpj(dados, puro);
}

/**
 * @summary Realiza a validação de um único CNPJ via OpenCNPJ e retorna o resultado detalhado.
 */
export async function validarCnpjIndividual(cnpj: string): Promise<ResultadoValidacaoApi> {
    const puro = normalizarPuro(cnpj);
    if (puro.length !== 14) {
        return {
            puro,
            valido: false,
            mensagem: "Insira os 14 caracteres antes da consulta.",
            statusHttp: 400,
            dados: null,
        };
    }

    try {
        const dados = await buscarDadosCnpj(puro);
        if (!dados) {
            return {
                puro,
                valido: false,
                mensagem: `CNPJ não encontrado na base pública da Receita Federal, consultando via OpenCNPJ. `,
                mensagemComplementar: `Para confirmar, consulte diretamente no <a href="https://www.gov.br/pt-br/servicos/consultar-cadastro-nacional-de-pessoas-juridicas" target="_blank" class="underline underline-offset-4 decoration-2 !decoration-violet-500" rel="noopener noreferrer">Gov.br</a>.`,
                statusHttp: 404,
                dados: null,
            };
        }

        return {
            puro: dados.cnpj ?? puro,
            valido: true,
            mensagem: "Dados do CNPJ localizados com sucesso.",
            statusHttp: 200,
            dados,
        };
    } catch (erro) {
        if (erro instanceof ErroOpenCnpjApi) {
            return {
                puro,
                valido: false,
                mensagem: erro.message,
                statusHttp: erro.statusHttp,
                dados: null,
            };
        }

        return {
            puro,
            valido: false,
            mensagem: "Ocorreu um erro inesperado ao consultar o OpenCNPJ.",
            statusHttp: 0,
            dados: null,
        };
    }
}

/**
 * @summary Valida uma lista de CNPJs sequencialmente e devolve os resultados acumulados.
 */
export async function validarCnpjsEmMassa(listaCnpjs: string[]): Promise<ResultadoValidacaoApi[]> {
    const resultados: ResultadoValidacaoApi[] = [];
    for (const item of listaCnpjs) {
        const resultado = await validarCnpjIndividual(item);
        resultados.push(resultado);
    }
    return resultados;
}

/**
 * @summary Normaliza e estrutura os dados recebidos do OpenCNPJ para consumo interno.
 */
function normalizarDadosOpenCnpj(registro: Record<string, unknown>, puro: string): DadosCnpj {
    const str = (v: unknown): string | undefined =>
        typeof v === "string" && v.trim() ? v.trim() : undefined;

    const num = (v: unknown): number | undefined => {
        if (typeof v === "number") return v;
        if (typeof v === "string") {
            const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
            return isFinite(n) ? n : undefined;
        }
        return undefined;
    };

    const telefones =
        Array.isArray(registro.telefones) && registro.telefones.length
            ? registro.telefones
                .map((t: any) =>
                    t && typeof t === "object" && t.ddd && t.numero ? `(${t.ddd}) ${t.numero}` : undefined,
                )
                .filter(Boolean)
                .join(" / ")
            : undefined;

    const socios =
        Array.isArray(registro.QSA) && registro.QSA.length
            ? (registro.QSA as any[]).map((s) => ({
                nome: str(s.nome_socio),
                qualificacao: str(s.qualificacao_socio),
                tipo: str(s.identificador_socio),
                pais: undefined,
                entrada: str(s.data_entrada_sociedade),
            }))
            : [];

    return {
        cnpj: normalizarPuro(str(registro.cnpj) ?? puro),
        nomeEmpresarial: str(registro.razao_social),
        nomeFantasia: str(registro.nome_fantasia),
        situacaoCadastral: str(registro.situacao_cadastral),
        dataSituacaoCadastral: str(registro.data_situacao_cadastral),
        naturezaJuridica: str(registro.natureza_juridica),
        capitalSocial: num(registro.capital_social),
        porte: str(registro.porte_empresa),
        telefone: telefones,
        email: str(registro.email),
        endereco: {
            logradouro: str(registro.logradouro),
            numero: str(registro.numero),
            complemento: str(registro.complemento),
            bairro: str(registro.bairro),
            municipio: str(registro.municipio),
            uf: str(registro.uf),
            cep: str(registro.cep),
        },
        atividadePrincipal: str(registro.cnae_principal)
            ? { codigo: str(registro.cnae_principal)!, descricao: undefined }
            : null,
        atividadesSecundarias: Array.isArray(registro.cnaes_secundarios)
            ? registro.cnaes_secundarios.map((c: any) => ({ codigo: String(c) }))
            : [],
        socios,
        dadosOriginais: registro,
    };
}

/**
 * @summary Escapa caracteres especiais para exibição segura em HTML.
 */
function escaparHtml(texto: string): string {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * @summary Classe responsável por integrar a interface com a API OpenCNPJ.
 */
class ValidadorCnpjApi {
    [x: string]: any;
    private readonly historico: ResultadoValidacaoApi[] = [];
    private readonly limiteHistorico = 100;
    private readonly formatando = { unico: false, massa: false };
    private timeoutAviso: number | undefined;
    private elementoFocoAnterior: HTMLElement | null = null;
    private readonly escutarTeclaEscape: (evento: KeyboardEvent) => void;

    /**
     * @summary Inicializa o validador com os elementos de interface e configurações necessárias.
     */
    public constructor(private readonly elementos: ElementosValidador) {
        this.configurarEventos();
        this.configurarPlaceholderMascara();
        this.configurarEntradaCnpj();
        this.configurarEntradaCNPJMassa();
        this.alternarModoMassa(false);
        this.atualizarEstadoBotaoValidarUnico();
        inicializarEfeitoOnda();

        this.escutarTeclaEscape = (evento: KeyboardEvent) => {
            if (evento.key === "Escape") {
                this.fecharModal();
            }
        };
    }

    /**
     * @summary Registra os manipuladores de eventos dos elementos principais da interface.
     */
    private configurarEventos(): void {
        const {
            botaoValidarUnico,
            botaoValidarMassa,
            controleMascara,
            controleMassa,
            botaoColar,
            modalOverlay,
            botaoFecharModal,
        } = this.elementos;

        botaoValidarUnico.addEventListener("click", () => {
            void this.validarUnico();
        });

        botaoValidarMassa.addEventListener("click", () => {
            void this.validarEmMassa();
        });

        controleMascara.addEventListener("change", () => {
            this.renderizarHistorico();
        });

        controleMassa.addEventListener("change", () => {
            this.alternarModoMassa(controleMassa.checked);
            if (!controleMassa.checked) {
                this.atualizarEstadoBotaoValidarUnico();
            }
        });

        botaoColar.addEventListener("click", () => {
            void this.colarDoClipboard();
        });

        modalOverlay.addEventListener("click", (evento) => {
            if (evento.target === modalOverlay) {
                this.fecharModal();
            }
        });

        botaoFecharModal.addEventListener("click", () => {
            this.fecharModal();
        });
    }

    /**
     * @summary Alterna entre validação unitária e em massa com animação suave.
     */
    private alternarModoMassa(ativo: boolean): void {
        const { campoUnico, campoMassa, botaoValidarUnico, botaoValidarMassa, botaoColar } =
            this.elementos;

        this.animarAlturaSincronizada(() => {
            campoUnico.classList.toggle("hidden", ativo);
            campoMassa.classList.toggle("hidden", !ativo);
            botaoValidarUnico.classList.toggle("hidden", ativo);
            botaoValidarMassa.classList.toggle("hidden", !ativo);
            botaoColar.classList.toggle("hidden", ativo);

            if (ativo) {
                campoMassa.value = "";
            }
        });

        if (ativo) {
            campoMassa.focus();
        } else {
            campoUnico.focus();
        }
    }

    /**
     * @summary Cola conteúdo da área de transferência no campo de consulta única,
     * aplicando máscara conforme o toggle ativo.
     */
    private async colarDoClipboard(): Promise<void> {
        try {
            const textoBruto = (await navigator.clipboard.readText()).trim();

            if (!textoBruto) {
                exibirAviso(
                    this.elementos.areaAviso,
                    "Nenhum conteúdo disponível para colar",
                    TipoAviso.Info,
                );
                return;
            }

            const puro = normalizarPuro(textoBruto);

            if (!puro || puro.length === 0) {
                this.exibirAviso("Conteúdo inválido para colar", TipoAviso.Erro);
                return;
            }

            const limitado = puro.slice(0, 14);

            const usarMascara = this.elementos.controleMascara.checked;
            const exibicao = usarMascara ? aplicarMascaraProgressiva(limitado) : limitado;

            this.elementos.campoUnico.value = exibicao;
            this.atualizarEstadoBotaoValidarUnico();

            exibirAviso(
                this.elementos.areaAviso,
                `Conteúdo colado: ${exibicao}`,
                TipoAviso.InfoAlternativo,
            );
        } catch {
            this.exibirAviso("Não foi possível acessar a área de transferência", TipoAviso.Erro);
        }
    }

    /**
     * @summary Abre o modal de detalhes com base no valor atual do campo único.
     * Se o CNPJ ainda não foi consultado, exibe um aviso orientando a consulta.
     */
    private abrirDetalhesDoCampoAtual(): void {
        const { campoUnico } = this.elementos;
        const valor = campoUnico.value.trim();

        if (!valor) {
            this.exibirAviso("Informe um CNPJ para ver os detalhes", TipoAviso.Info);
            return;
        }

        const puro = normalizarPuro(valor);
        if (puro.length < 14) {
            this.exibirAviso("Insira os 14 caracteres antes de ver os dados", TipoAviso.Info);
            return;
        }

        const item = this.historico.find((h) => h.puro === puro);
        if (!item) {
            this.exibirAviso("Consulte o CNPJ primeiro para ver os detalhes", TipoAviso.Info);
            return;
        }

        this.exibirModalCnpj(item);
    }

    /**
     * @summary Consulta um único CNPJ na API, atualiza o histórico e exibe mensagens ao usuário.
     */
    private async validarUnico(): Promise<void> {
        const valor = this.elementos.campoUnico.value.trim();
        if (!valor) {
            exibirAviso(this.elementos.areaAviso, "Informe um CNPJ para validar", TipoAviso.Erro);
            return;
        }

        const puro = normalizarPuro(valor);
        if (puro.length < 14) {
            exibirAviso(
                this.elementos.areaAviso,
                "Insira os 14 caracteres antes da consulta",
                TipoAviso.Info,
            );
            return;
        }
        const usarMascara = this.elementos.controleMascara.checked;
        const exibicao = usarMascara ? aplicarMascara(puro) : puro;
        this.exibirAviso(`Iniciando validação do CNPJ ${exibicao}`, TipoAviso.InfoAlternativo);
        const placeholder: ResultadoValidacaoApi = {
            puro,
            valido: false,
            mensagem: "Buscando dados...",
            statusHttp: 0,
            dados: null,
            carregando: true,
        };
        this.adicionarAoHistorico(placeholder);
        this.renderizarHistorico();
        this.exibirAviso("Consultando OpenCNPJ...", TipoAviso.Info);

        const resultado = await validarCnpjIndividual(valor);

        const indice = this.historico.findIndex(
            (h) => h.puro === resultado.puro && (h as ResultadoValidacaoApi).carregando === true,
        );
        if (indice >= 0) {
            this.historico[indice] = resultado;
        } else {
            this.adicionarAoHistorico(resultado);
        }
        this.renderizarHistorico();
        this.notificarResultado(resultado);
    }

    /**
     * @summary Realiza a consulta em massa de CNPJs, respeitando o limite e atualizando o histórico.
     */
    private async validarEmMassa(): Promise<void> {
        const valor = this.elementos.campoMassa.value.trim();
        if (!valor) {
            exibirAviso(
                this.elementos.areaAviso,
                "Informe ao menos um CNPJ para validar",
                TipoAviso.Info,
            );
            return;
        }

        const entradas = valor
            .split(/[;,]/)
            .map((parte) => parte.trim())
            .filter((parte) => parte.length > 0);

        if (entradas.length === 0) {
            exibirAviso(
                this.elementos.areaAviso,
                "Informe ao menos um CNPJ para validar",
                TipoAviso.Info,
            );
            return;
        }

        if (entradas.length > 100) {
            exibirAviso(this.elementos.areaAviso, "Limite de 100 CNPJs por validação", TipoAviso.Erro);
            return;
        }
        this.exibirAviso(`Iniciando validação de ${entradas.length} CNPJs`, TipoAviso.InfoAlternativo);

        const puros = entradas.map((parte) => normalizarPuro(parte));

        for (const puro of [...puros].reverse()) {
            if (!puro) continue;
            const placeholder: ResultadoValidacaoApi = {
                puro,
                valido: false,
                mensagem: "Consultando no OpenCNPJ...",
                statusHttp: 0,
                dados: null,
                carregando: true,
            };
            this.adicionarAoHistorico(placeholder); // continua usando unshift
        }
        this.renderizarHistorico();

        this.exibirAviso("Consultando OpenCNPJ...", TipoAviso.Info);

        const resultados: ResultadoValidacaoApi[] = [];
        for (const entrada of entradas) {
            const resultado = await validarCnpjIndividual(entrada);
            resultados.push(resultado);

            const idx = this.historico.findIndex(
                (h) => h.puro === resultado.puro && (h as ResultadoValidacaoApi).carregando === true,
            );
            if (idx >= 0) {
                this.historico[idx] = resultado;
            } else {
                this.adicionarAoHistorico(resultado);
            }
        }

        this.renderizarHistorico();
        this.notificarResumoMassa(resultados);
    }

    /**
     * @summary Adiciona um novo resultado ao histórico respeitando o limite máximo configurado.
     */
    private adicionarAoHistorico(resultado: ResultadoValidacaoApi): void {
        this.historico.unshift(resultado);
        if (this.historico.length > this.limiteHistorico) {
            this.historico.length = this.limiteHistorico;
        }

        const contador = document.getElementById("contador-historico") as HTMLSpanElement | null;
        atualizarContadorHistorico(contador, this.historico.length, this.limiteHistorico, true);
    }

    /**
     * @summary Renderiza a lista do histórico e associa os eventos de cópia e modal.
     */
    private renderizarHistorico(): void {
        const { listaHistorico, controleMascara } = this.elementos;
        listaHistorico.innerHTML = "";

        const aplicarMascaraAtiva = controleMascara.checked;

        this.historico.forEach((item) => {
            const elemento = document.createElement("li");
            elemento.className =
                "flex items-center justify-between gap-3 px-3 py-1 transition-all duration-300 rounded-md cursor-pointer ring-2 ring-slate-100 dark:ring-slate-800 dark:shadow-2xl hover:ring-slate-300 dark:hover:ring-slate-900";

            const indicador = document.createElement("span");
            if (item.carregando) {
                indicador.innerHTML = `
                    <span class="relative flex size-2">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                    <span class="relative inline-flex size-2 rounded-full bg-blue-500 boder boder-blue-500"></span>
                    </span>
                    `;
                indicador.className = "flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400";
                indicador.setAttribute("title", "Consulta em andamento...");
            } else {
                indicador.className = item.valido
                    ? "inline-block w-2 h-2 rounded-full border bg-teal-500 border-emerald-500 ring-2 ring-teal-500/40 shadow-sm shadow-current transition-all duration-300"
                    : "inline-block w-2 h-2 rounded-full border bg-red-400 border-red-500 ring-2 ring-red-400/40 shadow-sm shadow-current transition-all duration-300";
                indicador.setAttribute("title", item.valido ? "Dados encontrados" : item.mensagem);
            }

            const texto = document.createElement("span");
            texto.className = "flex-1 text-sm font-semibold break-words text-slate-600 dark:text-zinc-50";
            const exibicao = aplicarMascaraAtiva ? aplicarMascara(item.puro) : item.puro;
            texto.textContent = exibicao;
            texto.setAttribute("title", item.mensagem);

            const containerEsquerdo = document.createElement("div");
            containerEsquerdo.className = "flex items-center flex-1 gap-3";
            containerEsquerdo.append(indicador, texto);

            containerEsquerdo.addEventListener("click", () => {
                if ((item as ResultadoValidacaoApi).carregando) {
                    this.exibirAviso("Consulta em andamento...", TipoAviso.Info);
                    return;
                }
                this.exibirModalCnpj(item);
            });

            const botaoVisualizar = document.createElement("button");
            botaoVisualizar.className =
                "inline-flex items-center justify-center py-1 ml-1 text-xs transition-all ease-in-out rounded text-violet-500 dark:text-violet-500 dark:hover:text-violet-600 hover:text-violet-600 hover:scale-110";
            botaoVisualizar.setAttribute("title", "Ver mais detalhes");
            botaoVisualizar.setAttribute("aria-label", "Ver mais detalhes");
            botaoVisualizar.classList.add("opacity50");
            botaoVisualizar.innerHTML = `
                            <svg class="w-6 h-6 text-slate-600 dark:text-slate-300 opacity-25" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                               <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 21 12c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                            </svg>`;

            if (!item.carregando) {
                botaoVisualizar.addEventListener("click", (evento) => {
                    evento.preventDefault();
                    evento.stopPropagation();
                    this.exibirModalCnpj(item);
                });
            } else {
                botaoVisualizar.addEventListener("click", (evento) => {
                    evento.preventDefault();
                    evento.stopPropagation();
                    this.exibirAviso("Consulta em andamento...", TipoAviso.Info);
                });
            }

            if (item.valido) {
                botaoVisualizar.classList.add("opacity50");
                botaoVisualizar.innerHTML = `<svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">\
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12c2.15-4.2 6.16-7.5 9.75-7.5s7.6 3.3 9.75 7.5c-2.15 4.2-6.16 7.5-9.75 7.5s-7.6-3.3-9.75-7.5Z" />\
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />\
                    </svg>`;
            }

            elemento.append(containerEsquerdo, botaoVisualizar);
            listaHistorico.appendChild(elemento);
        });

        listaHistorico.scrollTop = 0;
    }

    /**
     * @summary Torna público o fluxo de exibição do modal para um CNPJ já presente no histórico.
     * @param puroOuFormatado CNPJ em qualquer formato para localizar o item correspondente.
     */
    public abrirDetalhesPorCnpj(puroOuFormatado: string): void {
        const puro = normalizarPuro(puroOuFormatado);
        if (puro.length !== 14) {
            return;
        }

        const encontrado = this.historico.find((item) => item.puro === puro);
        if (!encontrado || encontrado.carregando) {
            return;
        }

        this.exibirModalCnpj(encontrado);
    }

    /**
     * @summary Exibe o modal com os dados completos retornados pela API.
     */
    private exibirModalCnpj(resultado: ResultadoValidacaoApi): void {
        const { modalConteudo, modalTitulo, controleMascara } = this.elementos;
        const exibicao = controleMascara.checked ? aplicarMascara(resultado.puro) : resultado.puro;
        modalTitulo.textContent = exibicao;

        if (!resultado.valido || !resultado.dados) {
            modalConteudo.innerHTML = `
                    <p class="text-sm text-slate-600 dark:text-slate-300" >
                        ${resultado.mensagem} ${resultado.mensagemComplementar ? resultado.mensagemComplementar : ""}
                </p>
                    `;
        } else {
            const dados = resultado.dados;
            const endereco = dados.endereco
                ? [
                    dados.endereco.logradouro,
                    dados.endereco.numero,
                    dados.endereco.complemento,
                    dados.endereco.bairro,
                    dados.endereco.municipio,
                    dados.endereco.uf,
                    dados.endereco.cep ? `CEP: ${dados.endereco.cep} ` : undefined,
                ]
                    .filter(Boolean)
                    .join(", ")
                : "Não informado";

            const atividadePrincipal = dados.atividadePrincipal
                ? [dados.atividadePrincipal.codigo, dados.atividadePrincipal.descricao]
                    .filter(Boolean)
                    .join(" - ")
                : "Não informada";

            const atividadesSecundarias =
                dados.atividadesSecundarias && dados.atividadesSecundarias.length > 0
                    ? `<ul class="ml-2 list-disc list-inside font-semibold space-y-1" > ${dados.atividadesSecundarias
                        .map(
                            (atividade) =>
                                `<li>${escaparHtml([atividade.codigo, atividade.descricao].filter(Boolean).join(" - ") || "")}</li>`,
                        )
                        .join("")} </ul>`
                    : '<p class="text-sm">Nenhuma atividade secundária informada.</p>';

            const socios =
                dados.socios && dados.socios.length > 0
                    ? `<ul class="ml-2 list-disc list-inside font-semibold space-y-1">${dados.socios
                        .map((socio) => {
                            const linha = [socio.nome, socio.qualificacao, socio.pais]
                                .filter((parte) => (parte ?? "").toString().trim().length > 0)
                                .join(" · ");
                            const infoEntrada = socio.entrada
                                ? ` <span class=\"text-xs text-slate-500 dark:text-slate-400\">(Desde ${escaparHtml(socio.entrada)})</span>`
                                : "";
                            return `<li>${escaparHtml(linha || "Não informado")}${infoEntrada}</li>`;
                        })
                        .join("")}</ul>`
                    : '<p class="text-sm">Nenhum sócio informado.</p>';

            const capital =
                typeof dados.capitalSocial === "number"
                    ? dados.capitalSocial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    : "Não informado";

            const jsonBruto = escaparHtml(JSON.stringify(dados.dadosOriginais, null, 2));

            modalConteudo.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-200">
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nome Empresarial</h4>
                        <p class="font-semibold text-slate-700 dark:text-zinc-50">${escaparHtml(dados.nomeEmpresarial ?? "Não informado")}</p>
                    </div>
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nome Fantasia</h4>
                        <p class="font-semibold text-slate-700 dark:text-zinc-50">${escaparHtml(dados.nomeFantasia ?? "Não informado")}</p>
                    </div>
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Situação Cadastral</h4>
                        <p class="font-semibold">${escaparHtml(dados.situacaoCadastral ?? "Não informada")}</p>
                    </div>
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Data da Situação</h4>
                        <p class="font-semibold">${escaparHtml(dados.dataSituacaoCadastral ?? "Não informada")}</p>
                    </div>
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Natureza Jurídica</h4>
                        <p class="font-semibold">${escaparHtml(dados.naturezaJuridica ?? "Não informada")}</p>
                    </div>
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Porte</h4>
                        <p class="font-semibold">${escaparHtml(dados.porte ?? "Não informado")}</p>
                    </div>
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Capital Social</h4>
                        <p class="font-semibold">${escaparHtml(capital)}</p>
                    </div>
                    <div>
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Contato</h4>
                        <p class="font-semibold">${escaparHtml(dados.telefone ?? "Telefone não informado")}</p>
                        <p class="font-semibold">${escaparHtml(dados.email ?? "E-mail não informado")}</p>
                    </div>
                    <div class="md:col-span-2">
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Endereço</h4>
                        <p class="font-semibold">${escaparHtml(endereco)}</p>
                    </div>
                    <div class="md:col-span-2">
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Atividade Principal</h4>
                        <p class="font-semibold">${escaparHtml(atividadePrincipal)}</p>
                    </div>
                    <div class="md:col-span-2">
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Atividades Secundárias</h4>
                        ${atividadesSecundarias}
                    </div>
                    <div class="md:col-span-2">
                        <h4 class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Quadro Societário</h4>
                        ${socios}
                    </div>
                </div>
                <div class="mt-6">
                    <details class="bg-zinc-100 dark:bg-slate-900/60 rounded-xl p-4 group">
                    <summary
                        class="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-200 flex items-center justify-between"
                    >
                        <span class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-slate-500 transition-transform duration-300 group-open:rotate-90"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        Ver dados completos (JSON)
                        </span>

                        <button
                        type="button"
                        class="flex items-center justify-center ml-2 rounded text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-600 active:scale-90 transition-all duration-300 ease-in-out"
                        onclick="(function(botao){
                            const pre = botao.closest('details').querySelector('pre');
                            const texto = pre.textContent.trim();
                            navigator.clipboard.writeText(texto)
                            .then(() => document.dispatchEvent(new CustomEvent('jsonCopiado')))
                            .catch(() => document.dispatchEvent(new CustomEvent('jsonNaoCopiado')))
                        })(this)"
                        title="Copiar JSON"
                        aria-label="Copiar JSON"
                        >
                        <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linejoin="round" stroke-width="1.5" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                        </svg>
                        </button>
                    </summary>

                    <pre
                        class="mt-3 max-h-64 overflow-auto scroll-personalizado text-xs bg-slate-800 dark:bg-slate-800 text-teal-500 rounded-lg p-3"
                    >${jsonBruto}</pre>
                    </details>

                </div>
            `;
        }

        this.abrirModal();
    }

    /**
     * @summary Abre o modal de detalhes aplicando classes de transição.
     */
    private abrirModal(): void {
        const { modalOverlay, modalCaixa, botaoFecharModal } = this.elementos;
        this.elementoFocoAnterior =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        modalOverlay.classList.remove("hidden");
        requestAnimationFrame(() => {
            modalOverlay.classList.remove("opacity-0", "pointer-events-none");
            modalCaixa.classList.remove("scale-95");
        });

        document.addEventListener("keydown", this.escutarTeclaEscape);
        window.setTimeout(() => {
            botaoFecharModal.focus();
        }, 150);
    }


    /**
     * @summary Fecha o modal e restaura o foco anterior.
     */
    private fecharModal(): void {
        const { modalOverlay, modalCaixa } = this.elementos;
        modalOverlay.classList.add("opacity-0", "pointer-events-none");
        modalCaixa.classList.add("scale-95");
        document.removeEventListener("keydown", this.escutarTeclaEscape);

        window.setTimeout(() => {
            modalOverlay.classList.add("hidden");
            if (this.elementoFocoAnterior) {
                this.elementoFocoAnterior.focus();
            }
        }, 250);
    }

    /**
     * @summary Exibe um aviso referente ao resultado individual da consulta.
     */
    private notificarResultado(resultado: ResultadoValidacaoApi): void {
        const mascaraAtiva = this.elementos.controleMascara.checked;
        const exibicao = mascaraAtiva ? aplicarMascara(resultado.puro) : resultado.puro;
        const tipo = this.obterTipoAviso(resultado);

        const mensagem = resultado.valido
            ? `Dados do CNPJ ${exibicao} encontrados com sucesso`
            : resultado.mensagem;

        this.exibirAviso(mensagem, tipo);
        const eventoConclusao = new CustomEvent<ResultadoValidacaoApi>("consultaCnpjConcluida", {
            detail: resultado,
        });
        document.dispatchEvent(eventoConclusao);
    }

    /**
     * @summary Exibe um resumo após a consulta em massa.
     */
    private notificarResumoMassa(resultados: ResultadoValidacaoApi[]): void {
        const validos = resultados.filter((item) => item.valido).length;
        const total = resultados.length;
        const invalidos = total - validos;

        if (validos === total && total > 0) {
            this.exibirAviso(`Todos os ${total} CNPJs retornaram dados no OpenCNPJ`, TipoAviso.Sucesso);
            return;
        }

        if (validos > 0) {
            this.exibirAviso(
                `${validos} de ${total} CNPJs retornaram dados. ${invalidos} não foram localizados ou apresentaram erro`,
                TipoAviso.InfoAlternativo,
            );
            return;
        }

        this.exibirAviso("Nenhum dos CNPJs informados foi localizado no OpenCNPJ", TipoAviso.Erro);
    }

    /**
     * @summary Determina o tipo de aviso adequado para o resultado informado.
     */
    private obterTipoAviso(resultado: ResultadoValidacaoApi): TipoAviso {
        if (resultado.valido) {
            return TipoAviso.Sucesso;
        }

        if (resultado.statusHttp === 404) {
            return TipoAviso.Info;
        }

        if (resultado.statusHttp === 429) {
            return TipoAviso.InfoAlternativo;
        }

        return TipoAviso.Erro;
    }

    /**
     * @summary Configura o campo de consulta única (normalização e máscara).
     */
    private configurarEntradaCnpj(): void {
        const { campoUnico, controleMascara } = this.elementos;

        const aplicarMascaraLocal = (valor: string): string =>
            aplicarMascaraProgressiva(normalizarPuro(valor));

        const atualizarEntrada = (): void => {
            if (this.formatando.unico) return;
            this.formatando.unico = true;

            let bruto = campoUnico.value;
            bruto = normalizarPuro(bruto);

            if (bruto.length > 14) {
                bruto = bruto.slice(0, 14);
            }

            campoUnico.value = controleMascara.checked ? aplicarMascaraLocal(bruto) : bruto;
            this.atualizarEstadoBotaoValidarUnico();
            this.formatando.unico = false;
        };

        campoUnico.addEventListener("input", atualizarEntrada);
        campoUnico.addEventListener("paste", (evento) => {
            evento.preventDefault();
            const texto = (evento.clipboardData?.getData("text") ?? "").trim();
            campoUnico.value = texto;
            atualizarEntrada();
        });

        controleMascara.addEventListener("change", atualizarEntrada);
    }

    /**
     * @summary Atualiza o estado do botão de validação unitária conforme o campo preenchido.
     */
    private atualizarEstadoBotaoValidarUnico(): void {
        const { campoUnico, botaoValidarUnico } = this.elementos;
        const puro = normalizarPuro(campoUnico.value);
        const habilitar = puro.length >= 14;
        botaoValidarUnico.disabled = !habilitar;
        botaoValidarUnico.classList.toggle("opacity-60", !habilitar);
        botaoValidarUnico.classList.toggle("cursor-not-allowed", !habilitar);
    }

    /**
     * @summary Atualiza o estado do botão de validação em massa conforme a quantidade de itens.
     */
    private atualizarEstadoBotaoValidarMassa(total: number): void {
        const { botaoValidarMassa } = this.elementos;
        const habilitar = total > 0;
        botaoValidarMassa.disabled = !habilitar;
        botaoValidarMassa.classList.toggle("opacity-60", !habilitar);
        botaoValidarMassa.classList.toggle("cursor-not-allowed", !habilitar);
    }

    /**
     * @summary Configura o campo de validação em massa, formatando e limitando itens.
     */
    private configurarEntradaCNPJMassa(): void {
        const { campoMassa, controleMascara } = this.elementos;
        const LIMITE = 100;

        const formatarLista = (texto: string, manterSeparadorFinal: boolean): string => {
            const partesBrutas = texto.split(/[;,]/);
            const formatadas: string[] = [];
            const vistos = new Set<string>();

            for (const parte of partesBrutas) {
                const p = parte.trim();
                if (!p) continue;

                const puroParte = normalizarPuro(p);
                const f = controleMascara.checked ? aplicarMascaraProgressiva(puroParte) : puroParte;
                const chave = puroParte;
                if (chave && !vistos.has(chave)) {
                    vistos.add(chave);
                    formatadas.push(f);
                    if (formatadas.length >= LIMITE) break;
                }
            }

            let saida = formatadas.join(", ");
            if (manterSeparadorFinal && formatadas.length < LIMITE) {
                if (saida.length > 0) saida += ", ";
            } else {
                saida = saida.replace(/[,\s]+$/, "");
            }
            return saida;
        };

        const reformatar = (textoOrig: string): void => {
            if (this.formatando.massa) return;
            this.formatando.massa = true;

            const temDelimitadorFinal = /[;,]\s*$/.test(textoOrig) || /\n\s*$/.test(textoOrig);
            const novo = formatarLista(textoOrig, temDelimitadorFinal);
            if (novo.length > 0 && novo !== campoMassa.value) {
                campoMassa.value = novo;
            } else if (novo.length === 0 && campoMassa.value !== "") {
                campoMassa.value = "";
            }

            const total = novo
                .split(",")
                .map((parte) => parte.trim())
                .filter(Boolean).length;
            if (total >= LIMITE && /[;,]|\n/.test(textoOrig)) {
                exibirAviso(
                    this.elementos.areaAviso,
                    `Limite de ${LIMITE} CNPJs atingido. Os extras foram ignorados`,
                    TipoAviso.Info,
                );
            }

            this.atualizarEstadoBotaoValidarMassa(total);
            this.formatando.massa = false;
        };

        campoMassa.addEventListener("input", () => {
            const valorAtual = campoMassa.value;
            const terminouItem = /[;,]|\n/.test(valorAtual.slice(-1));
            if (terminouItem) reformatar(valorAtual);
        });

        campoMassa.addEventListener("paste", (evento) => {
            evento.preventDefault();
            const texto = (evento.clipboardData?.getData("text") ?? "").trim();

            if (!texto) {
                exibirAviso(
                    this.elementos.areaAviso,
                    "Nenhum conteúdo disponível para colar",
                    TipoAviso.Info,
                );
                return;
            }

            const textoNormalizado = texto
                .replace(/[\n\r]+/g, ",")
                .replace(/\s+/g, " ")
                .replace(/,+/g, ",");

            campoMassa.value = textoNormalizado;
            this.elementos.campoMassa.dispatchEvent(new Event("input"));

            exibirAviso(
                this.elementos.areaAviso,
                "Conteúdo colado no modo em massa",
                TipoAviso.InfoAlternativo,
            );
        });

        controleMascara.addEventListener("change", () => reformatar(campoMassa.value));
    }

    /**
     * @summary Define o placeholder do campo único conforme o estado da máscara.
     */
    private configurarPlaceholderMascara(): void {
        const { controleMascara, campoUnico } = this.elementos;

        const atualizarPlaceholder = (): void => {
            campoUnico.placeholder = controleMascara.checked ? "00.ABC.000/ABCD-00" : "00ABC000ABCD00";
        };

        atualizarPlaceholder();
        controleMascara.addEventListener("change", atualizarPlaceholder);
    }

    /**
     * @summary Anima a altura dos cards ao alternar entre os modos de validação.
     */
    private animarAlturaSincronizada(mutarDOM: () => void, duracaoMs = 400): void {
        const cardValidacao = document.getElementById("card-validacao") as HTMLDivElement | null;
        const painelValidacao = document.getElementById("painel-validacao") as HTMLDivElement | null;
        const toggleMassa = document.getElementById("toggle-massa") as HTMLInputElement | null;

        if (!cardValidacao || !painelValidacao) {
            mutarDOM();
            return;
        }

        const startA = cardValidacao.offsetHeight;
        const startB = painelValidacao.offsetHeight;
        const trans = `height ${duracaoMs}ms ease-in-out`;

        cardValidacao.style.height = `${startA}px`;
        painelValidacao.style.height = `${startB}px`;
        cardValidacao.style.transition = trans;
        painelValidacao.style.transition = trans;
        cardValidacao.style.overflow = "hidden";
        painelValidacao.style.overflow = "hidden";

        mutarDOM();

        requestAnimationFrame(() => {
            cardValidacao.style.height = "auto";
            const endA = cardValidacao.offsetHeight;

            cardValidacao.style.height = `${startA}px`;
            void cardValidacao.offsetHeight;
            cardValidacao.style.height = `${endA}px`;

            painelValidacao.style.height = `${startB}px`;
            void painelValidacao.offsetHeight;
            painelValidacao.style.height = `${endA}px`;

            const limparDepois = () => {
                cardValidacao.style.transition = "";
                painelValidacao.style.transition = "";
                cardValidacao.style.overflow = "";
                painelValidacao.style.overflow = "";

                if (toggleMassa && !toggleMassa.checked) {
                    cardValidacao.style.height = "";
                    painelValidacao.style.height = "";
                } else {
                    cardValidacao.style.height = `${endA}px`;
                    painelValidacao.style.height = `${endA}px`;
                }
            };

            cardValidacao.addEventListener("transitionend", limparDepois, { once: true });
        });
    }

    /**
     * @summary Exibe aviso utilizando as classes locais para garantir compatibilidade.
     */
    private exibirAviso(mensagem: string, tipo: TipoAviso): void {
        const { areaAviso } = this.elementos;
        const classesBase =
            "fixed bottom-4 right-4 min-w-[240px] max-w-[calc(100%-2rem)] rounded-lg px-4 py-3 text-sm shadow-2xl transition-all duration-200 ease-out";

        areaAviso.textContent = mensagem;
        areaAviso.className = `${classesBase} ${MAPA_CLASSES_TIPO_AVISO[tipo].join(" ")} ${ClasseAviso.OpacidadeOculta} ${ClasseAviso.TranslacaoOculta} ${ClasseAviso.PonteiroDesativado}`;

        requestAnimationFrame(() => {
            areaAviso.classList.remove(...CLASSES_AVISO_OCULTO);
            areaAviso.classList.add(...CLASSES_AVISO_VISIVEL);
        });

        if (this.timeoutAviso !== undefined) {
            window.clearTimeout(this.timeoutAviso);
        }

        this.timeoutAviso = window.setTimeout(() => {
            areaAviso.classList.remove(...CLASSES_AVISO_VISIVEL);
            areaAviso.classList.add(...CLASSES_AVISO_OCULTO);
        }, IntervaloTemporizador.Aviso);
    }
}

function obterElementoObrigatorio<T extends HTMLElement>(id: string): T {
    const elemento = document.getElementById(id);
    if (!elemento) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return elemento as T;
}

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("aviso-cookies")) {
        document.body.insertAdjacentHTML("beforeend", htmlCookies);
    }
    inicializarAvisoDeCookies();

    const elementos: ElementosValidador = {
        campoUnico: obterElementoObrigatorio<HTMLInputElement>("campo-unico"),
        campoMassa: obterElementoObrigatorio<HTMLTextAreaElement>("campo-massa"),
        controleMascara: obterElementoObrigatorio<HTMLInputElement>("toggle-mascara-validator"),
        controleMassa: obterElementoObrigatorio<HTMLInputElement>("toggle-massa"),
        botaoValidarUnico: obterElementoObrigatorio<HTMLButtonElement>("botao-validar"),
        botaoValidarMassa: obterElementoObrigatorio<HTMLButtonElement>("botao-validar-massa"),
        listaHistorico: obterElementoObrigatorio<HTMLUListElement>("lista-historico-validacao"),
        areaAviso: obterElementoObrigatorio<HTMLDivElement>("toast"),
        botaoColar: obterElementoObrigatorio<HTMLButtonElement>("botao-colar"),
        modalOverlay: obterElementoObrigatorio<HTMLDivElement>("modal-dados-cnpj"),
        modalConteudo: obterElementoObrigatorio<HTMLDivElement>("modal-conteudo-cnpj"),
        modalTitulo: obterElementoObrigatorio<HTMLHeadingElement>("modal-titulo-cnpj"),
        botaoFecharModal: obterElementoObrigatorio<HTMLButtonElement>("botao-fechar-modal-cnpj"),
        modalCaixa: obterElementoObrigatorio<HTMLDivElement>("modal-caixa-cnpj"),
    };

    const validador = new ValidadorCnpjApi(elementos);

    document.addEventListener("jsonCopiado", () => {
        exibirAviso(elementos.areaAviso, "JSON copiado!", TipoAviso.InfoAlternativo);
    });

    document.addEventListener("jsonNaoCopiado ", () => {
        exibirAviso(elementos.areaAviso, "Não foi possível copiar o JSON!", TipoAviso.Erro);
    });

    document.addEventListener("abrirDetalhesCnpj", (evento) => {
        const detalhe = (evento as CustomEvent<{ puro?: string }>).detail;
        if (!detalhe?.puro) {
            return;
        }

        validador.abrirDetalhesPorCnpj(detalhe.puro);
    });

    let cnpjAutomatico: string | null = null;

    document.addEventListener("consultaCnpjConcluida", (evento) => {
        if (!cnpjAutomatico) {
            return;
        }

        const detalhe = (evento as CustomEvent<ResultadoValidacaoApi>).detail;
        if (!detalhe) {
            return;
        }

        if (normalizarPuro(detalhe.puro) !== cnpjAutomatico) {
            return;
        }

        setTimeout(() => {
            document.dispatchEvent(new CustomEvent("abrirDetalhesCnpj", { detail: { puro: detalhe.puro } }));
            cnpjAutomatico = null;
        }, 200);
    });

    void (async () => {
        const parametros = new URLSearchParams(window.location.search);
        const parametroCnpj = parametros.get("");
        if (!parametroCnpj) {
            return;
        }

        const puro = normalizarPuro(parametroCnpj);
        if (puro.length !== 14) {
            return;
        }

        const { validarCnpjPuro } = await import("./algoritmo-cnpj.js");
        if (!validarCnpjPuro(puro)) {
            return;
        }

        const usarMascara = elementos.controleMascara.checked;
        elementos.campoUnico.value = usarMascara ? aplicarMascaraProgressiva(puro) : puro;
        elementos.campoUnico.dispatchEvent(new Event("input", { bubbles: true }));

        cnpjAutomatico = puro;
        elementos.botaoValidarUnico.click();
    })();
});

export { };
