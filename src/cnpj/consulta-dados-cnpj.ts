/* ============================
   Validador de CNPJ via OpenCNPJ
   - Integração para consulta pública de dados cadastrais
   - Validação individual e em massa com histórico persistente
   - Exibição detalhada dos dados consultados em modal
============================ */

import { ClasseAviso, IntervaloTemporizador, TipoAviso } from "../gerais/enums.js";
import { CLASSES_AVISO_OCULTO, CLASSES_AVISO_VISIVEL, MAPA_CLASSES_TIPO_AVISO } from "../gerais/constantes.js";
import { htmlCookies, inicializarAvisoDeCookies } from "../gerais/cookies.js";
import { aplicarMascara, aplicarMascaraProgressiva, normalizarPuro } from "./formatacao-cnpj.js";
import { copiarTexto, inicializarEfeitoOnda } from "../interface/interface.js";
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

type RegistroGenerico = Record<string, unknown>;

interface RegistroOpenCnpj extends RegistroGenerico {
    estabelecimento?: unknown;
    estabelecimentos?: unknown;
}

interface RegistroEstabelecimento extends RegistroGenerico {
    cnpj?: string;
    razao_social?: string;
    nome_empresarial?: string;
    nome_fantasia?: string;
    situacao_cadastral?: string;
    data_situacao_cadastral?: string;
    natureza_juridica?: string;
    porte?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    municipio_texto?: string;
    cidade?: string;
    uf?: string;
    estado?: string;
    cep?: string;
    email?: string;
    telefone?: string;
    telefone1?: string;
    telefone2?: string;
    telefone3?: string;
}

/**
 * @summary Erro especializado que transporta o status HTTP retornado pela API.
 */
class ErroOpenCnpjApi extends Error {
    public constructor(public readonly statusHttp: number, mensagem: string) {
        super(mensagem);
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
        throw new ErroOpenCnpjApi(429, "Limite de consultas do OpenCNPJ atingido. Aguarde alguns instantes e tente novamente.");
    }

    if (!resposta.ok) {
        throw new ErroOpenCnpjApi(resposta.status, "Não foi possível consultar o CNPJ na API do OpenCNPJ.");
    }

    const dados = (await resposta.json()) as RegistroOpenCnpj;
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
                mensagem: "CNPJ não encontrado na base pública do OpenCNPJ.",
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
function normalizarDadosOpenCnpj(registro: RegistroOpenCnpj, puro: string): DadosCnpj {
    const estabelecimento = extrairEstabelecimento(registro);

    const nomeEmpresarial =
        extrairTexto(registro, ["razao_social", "nome_empresarial", "nome"])
        ?? extrairTexto(estabelecimento, ["razao_social", "nome_empresarial"]);

    const nomeFantasia =
        extrairTexto(estabelecimento, ["nome_fantasia", "nome_fantasia_simplificado"])
        ?? extrairTexto(registro, ["nome_fantasia"]);

    const situacaoCadastral =
        extrairTexto(estabelecimento, ["situacao_cadastral", "descricao_situacao_cadastral"])
        ?? extrairTexto(registro, ["situacao_cadastral"]);

    const dataSituacaoCadastral =
        extrairTexto(estabelecimento, ["data_situacao_cadastral"])
        ?? extrairTexto(registro, ["data_situacao_cadastral"]);

    const naturezaJuridica =
        extrairTexto(registro, ["natureza_juridica", "descricao_natureza_juridica"])
        ?? extrairTexto(estabelecimento, ["natureza_juridica"]);

    const capitalSocial = extrairNumero(registro, ["capital_social"]) ?? extrairNumero(estabelecimento, ["capital_social"]);
    const porte = extrairTexto(registro, ["porte", "porte_empresa"]) ?? extrairTexto(estabelecimento, ["porte"]);
    const telefone = extrairTelefones(estabelecimento, registro);
    const email = extrairTexto(estabelecimento, ["email"]) ?? extrairTexto(registro, ["email"]);
    const endereco = montarEndereco(estabelecimento) ?? montarEndereco(registro as RegistroEstabelecimento);
    const atividades = extrairAtividades(registro, estabelecimento);
    const socios = extrairSocios(registro, estabelecimento);

    const cnpjNormalizado =
        normalizarPuro(
            extrairTexto(estabelecimento, ["cnpj", "cnpj_completo", "cnpj_basico"])
            ?? extrairTexto(registro, ["cnpj", "cnpj_basico"]) ?? puro,
        );

    return {
        cnpj: cnpjNormalizado || puro,
        nomeEmpresarial,
        nomeFantasia,
        situacaoCadastral,
        dataSituacaoCadastral,
        naturezaJuridica,
        capitalSocial,
        porte,
        telefone,
        email,
        endereco,
        atividadePrincipal: atividades.principal,
        atividadesSecundarias: atividades.secundarias,
        socios,
        dadosOriginais: registro as Record<string, unknown>,
    };
}

/**
 * @summary Localiza o objeto de estabelecimento prioritário dentro da resposta.
 */
function extrairEstabelecimento(registro: RegistroOpenCnpj): RegistroEstabelecimento | null {
    const candidatoDireto = registro.estabelecimento;
    if (candidatoDireto && typeof candidatoDireto === "object") {
        return candidatoDireto as RegistroEstabelecimento;
    }

    const candidatosLista = registro.estabelecimentos;
    if (Array.isArray(candidatosLista) && candidatosLista.length > 0) {
        const primeiro = candidatosLista[0];
        if (primeiro && typeof primeiro === "object") {
            return primeiro as RegistroEstabelecimento;
        }
    }

    return null;
}

/**
 * @summary Tenta obter um texto limpo a partir de várias chaves possíveis.
 */
function extrairTexto(origem: RegistroGenerico | RegistroEstabelecimento | null | undefined, chaves: string[]): string | undefined {
    if (!origem) return undefined;
    for (const chave of chaves) {
        const valor = origem[chave];
        if (typeof valor === "string") {
            const texto = valor.trim();
            if (texto.length > 0) {
                return texto;
            }
        }
    }
    return undefined;
}

/**
 * @summary Converte valores numéricos representados como string para number, quando possível.
 */
function extrairNumero(origem: RegistroGenerico | RegistroEstabelecimento | null | undefined, chaves: string[]): number | undefined {
    if (!origem) return undefined;
    for (const chave of chaves) {
        const valor = origem[chave];
        if (typeof valor === "number" && Number.isFinite(valor)) {
            return valor;
        }
        if (typeof valor === "string") {
            const normalizado = valor.replace(/\./g, "").replace(/,/g, ".");
            const numero = Number.parseFloat(normalizado);
            if (Number.isFinite(numero)) {
                return numero;
            }
        }
    }
    return undefined;
}

/**
 * @summary Monta o endereço legível a partir do estabelecimento identificado.
 */
function montarEndereco(origem: RegistroEstabelecimento | RegistroGenerico | null): EnderecoCnpj | null {
    if (!origem) return null;

    const logradouroBase = extrairTexto(origem, ["logradouro", "nome_logradouro"]);
    const tipoLogradouro = extrairTexto(origem, ["tipo_logradouro"]);
    const logradouro = tipoLogradouro ? `${tipoLogradouro} ${logradouroBase ?? ""}`.trim() : logradouroBase;

    const numero = extrairTexto(origem, ["numero", "numero_local"]);
    const complemento = extrairTexto(origem, ["complemento"]);
    const bairro = extrairTexto(origem, ["bairro", "bairro_logradouro"]);
    const municipio = extrairTexto(origem, ["municipio", "cidade", "municipio_texto"]);
    const uf = extrairTexto(origem, ["uf", "estado"]);
    const cep = extrairTexto(origem, ["cep"]);

    if (![logradouro, numero, complemento, bairro, municipio, uf, cep].some(Boolean)) {
        return null;
    }

    return { logradouro, numero, complemento, bairro, municipio, uf, cep };
}

/**
 * @summary Extrai e concatena os telefones disponíveis na resposta.
 */
function extrairTelefones(estabelecimento: RegistroEstabelecimento | null, registro: RegistroOpenCnpj): string | undefined {
    const candidatos = [
        extrairTexto(estabelecimento, ["telefone", "telefone1"]),
        extrairTexto(estabelecimento, ["telefone2"]),
        extrairTexto(estabelecimento, ["telefone3"]),
        extrairTexto(registro, ["telefone", "telefone1", "telefone2"]),
    ].filter((valor): valor is string => Boolean(valor));

    const unicos = Array.from(new Set(candidatos.map((valor) => valor.trim()).filter(Boolean)));
    if (unicos.length === 0) return undefined;
    return unicos.join(" / ");
}

/**
 * @summary Normaliza as atividades principal e secundárias retornadas.
 */
function extrairAtividades(
    registro: RegistroOpenCnpj,
    estabelecimento: RegistroEstabelecimento | null,
): { principal: AtividadeCnpj | null; secundarias: AtividadeCnpj[] } {
    const colecoesPossiveis: unknown[] = [];
    const principalPossiveis: unknown[] = [];

    principalPossiveis.push(
        (registro as RegistroGenerico)["atividade_principal"],
        (registro as RegistroGenerico)["atividades_principais"],
        (registro as RegistroGenerico)["atividades_economicas"],
        estabelecimento ? (estabelecimento as RegistroGenerico)["atividade_principal"] : undefined,
        estabelecimento ? (estabelecimento as RegistroGenerico)["atividades_economicas_principais"] : undefined,
    );

    colecoesPossiveis.push(
        (registro as RegistroGenerico)["atividades_secundarias"],
        (registro as RegistroGenerico)["atividades_economicas"],
        estabelecimento ? (estabelecimento as RegistroGenerico)["atividades_secundarias"] : undefined,
        estabelecimento ? (estabelecimento as RegistroGenerico)["atividades_economicas_secundarias"] : undefined,
    );

    const principal = localizarAtividadePrincipal(principalPossiveis);
    const secundarias = localizarAtividadesSecundarias(colecoesPossiveis);

    return { principal, secundarias };
}

/**
 * @summary Constrói a lista de sócios a partir das possíveis coleções disponíveis.
 */
function extrairSocios(
    registro: RegistroOpenCnpj,
    estabelecimento: RegistroEstabelecimento | null,
): SocioCnpj[] {
    const colecoes: unknown[] = [
        (registro as RegistroGenerico)["socios"],
        (registro as RegistroGenerico)["quadro_societario"],
        (registro as RegistroGenerico)["qsa"],
        (registro as RegistroGenerico)["quadroSocietario"],
    ];

    if (estabelecimento) {
        colecoes.push((estabelecimento as RegistroGenerico)["socios"]);
    }

    const sociosMap = new Map<string, SocioCnpj>();

    for (const colecao of colecoes) {
        if (!colecao) continue;
        const lista = Array.isArray(colecao) ? colecao : [colecao];
        for (const item of lista) {
            if (!item || typeof item !== "object") continue;
            const registroSocio = item as RegistroGenerico;
            const nome =
                extrairTexto(registroSocio, [
                    "nome",
                    "nome_socio",
                    "nome_socio_razao_social",
                    "socio",
                    "razao_social",
                ]);
            const chave = (nome ?? "desconhecido").toUpperCase();
            if (!sociosMap.has(chave)) {
                sociosMap.set(chave, {
                    nome,
                    qualificacao: extrairTexto(registroSocio, [
                        "qualificacao",
                        "qualificacao_socio",
                        "qualificacao_representante",
                    ]),
                    tipo: extrairTexto(registroSocio, ["tipo", "identificador_socio", "tipo_socio"]),
                    pais: extrairTexto(registroSocio, ["pais", "pais_origem", "pais_residencia"]),
                    entrada: extrairTexto(registroSocio, [
                        "data_entrada",
                        "data_inicio_sociedade",
                        "data_de_entrada",
                    ]),
                });
            }
        }
    }

    return Array.from(sociosMap.values());
}

/**
 * @summary Localiza a atividade principal considerando diferentes formatos.
 */
function localizarAtividadePrincipal(possiveis: unknown[]): AtividadeCnpj | null {
    for (const candidato of possiveis) {
        if (!candidato) continue;
        if (Array.isArray(candidato)) {
            for (const item of candidato) {
                const atividade = construirAtividade(item);
                if (atividade) return atividade;
            }
        } else if (typeof candidato === "object") {
            const atividade = construirAtividade(candidato);
            if (atividade) return atividade;
        }
    }
    return null;
}

/**
 * @summary Constrói a lista de atividades secundárias a partir de vários formatos possíveis.
 */
function localizarAtividadesSecundarias(possiveis: unknown[]): AtividadeCnpj[] {
    const atividades: AtividadeCnpj[] = [];
    const vistos = new Set<string>();

    for (const candidato of possiveis) {
        if (!candidato) continue;
        const lista = Array.isArray(candidato) ? candidato : [candidato];
        for (const item of lista) {
            const atividade = construirAtividade(item);
            if (!atividade) continue;
            const chave = `${atividade.codigo ?? ""}|${atividade.descricao ?? ""}`;
            if (!vistos.has(chave)) {
                vistos.add(chave);
                atividades.push(atividade);
            }
        }
    }

    return atividades;
}

/**
 * @summary Normaliza um possível objeto de atividade em estrutura conhecida.
 */
function construirAtividade(entrada: unknown): AtividadeCnpj | null {
    if (!entrada || typeof entrada !== "object") return null;
    const registro = entrada as RegistroGenerico;
    const codigo = extrairTexto(registro, ["codigo", "code", "cnae", "cnae_principal", "classe"]);
    const descricao = extrairTexto(registro, ["descricao", "text", "atividade", "descricao_atividade"]);
    if (!codigo && !descricao) return null;
    return { codigo: codigo ?? undefined, descricao: descricao ?? undefined };
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

        botaoColar.addEventListener("click", async () => {
            await this.colarDoClipboard();
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
        const {
            campoUnico,
            campoMassa,
            botaoValidarUnico,
            botaoValidarMassa,
            botaoColar,
        } = this.elementos;

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
     * @summary Cola conteúdo da área de transferência no campo de consulta única.
     */
    private async colarDoClipboard(): Promise<void> {
        try {
            const texto = await navigator.clipboard.readText();
            if (!texto) {
                exibirAviso(this.elementos.areaAviso, "Nenhum conteúdo disponível para colar", TipoAviso.Info);
                return;
            }
            this.elementos.campoUnico.value = texto.trim();
            exibirAviso(this.elementos.areaAviso, `Conteúdo colado: ${texto}`, TipoAviso.InfoAlternativo);
            this.atualizarEstadoBotaoValidarUnico();
        } catch {
            this.exibirAviso("Não foi possível acessar a área de transferência", TipoAviso.Erro);
        }
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
            exibirAviso(this.elementos.areaAviso, "Insira os 14 caracteres antes da consulta", TipoAviso.Info);
            return;
        }

        const { botaoValidarUnico } = this.elementos;
        botaoValidarUnico.disabled = true;
        botaoValidarUnico.classList.add("opacity-60", "cursor-not-allowed");

        try {
            const resultado = await validarCnpjIndividual(valor);
            this.adicionarAoHistorico(resultado);
            this.renderizarHistorico();
            this.notificarResultado(resultado);
        } finally {
            botaoValidarUnico.disabled = false;
            botaoValidarUnico.classList.remove("opacity-60", "cursor-not-allowed");
        }
    }

    /**
     * @summary Realiza a consulta em massa de CNPJs, respeitando o limite e atualizando o histórico.
     */
    private async validarEmMassa(): Promise<void> {
        const valor = this.elementos.campoMassa.value.trim();
        if (!valor) {
            exibirAviso(this.elementos.areaAviso, "Informe ao menos um CNPJ para validar", TipoAviso.Info);
            return;
        }

        const entradas = valor
            .split(/[;,]/)
            .map((parte) => parte.trim())
            .filter((parte) => parte.length > 0);

        if (entradas.length === 0) {
            exibirAviso(this.elementos.areaAviso, "Informe ao menos um CNPJ para validar", TipoAviso.Info);
            return;
        }

        if (entradas.length > 100) {
            exibirAviso(this.elementos.areaAviso, "Limite de 100 CNPJs por validação", TipoAviso.Erro);
            return;
        }

        const { botaoValidarMassa } = this.elementos;
        botaoValidarMassa.disabled = true;
        botaoValidarMassa.classList.add("opacity-60", "cursor-not-allowed");

        try {
            const resultados = await validarCnpjsEmMassa(entradas);
            resultados.forEach((resultado) => {
                this.adicionarAoHistorico(resultado);
            });
            this.renderizarHistorico();
            this.notificarResumoMassa(resultados);
        } finally {
            botaoValidarMassa.disabled = false;
            botaoValidarMassa.classList.remove("opacity-60", "cursor-not-allowed");
        }
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
            indicador.className = (item.valido
                ? "inline-block w-2 h-2 rounded-full border bg-teal-500 border-emerald-500 ring-2 ring-teal-500/40 shadow-sm shadow-current transition-all duration-300"
                : "inline-block w-2 h-2 rounded-full border bg-red-400 border-red-500 ring-2 ring-red-400/40 shadow-sm shadow-current transition-all duration-300");
            indicador.setAttribute("title", item.valido ? "Dados encontrados" : item.mensagem);

            const texto = document.createElement("span");
            texto.className = "flex-1 text-sm font-semibold break-words text-slate-600 dark:text-zinc-50";
            const exibicao = aplicarMascaraAtiva ? aplicarMascara(item.puro) : item.puro;
            texto.textContent = exibicao;
            texto.setAttribute("title", item.mensagem);

            const containerEsquerdo = document.createElement("div");
            containerEsquerdo.className = "flex items-center flex-1 gap-3";
            containerEsquerdo.append(indicador, texto);

            containerEsquerdo.addEventListener("click", () => {
                this.exibirModalCnpj(item);
            });

            const botaoCopiar = document.createElement("button");
            botaoCopiar.className = "inline-flex items-center justify-center py-1 ml-1 text-xs transition-all ease-in-out rounded text-violet-500 dark:text-violet-500 dark:hover:text-violet-600 hover:text-violet-600 hover:scale-110";
            botaoCopiar.setAttribute("title", "Copiar esse CNPJ");
            botaoCopiar.innerHTML = `
                <svg class="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
                </svg>
            `;

            botaoCopiar.addEventListener("click", async (evento) => {
                evento.preventDefault();
                evento.stopPropagation();
                const textoParaCopiar = aplicarMascaraAtiva ? aplicarMascara(item.puro) : item.puro;
                try {
                    await copiarTexto(textoParaCopiar);
                    exibirAviso(this.elementos.areaAviso, `CNPJ copiado: ${textoParaCopiar}`, TipoAviso.InfoAlternativo);
                } catch {
                    exibirAviso(this.elementos.areaAviso, "Falha ao copiar", TipoAviso.Erro);
                }
            });

            elemento.append(containerEsquerdo, botaoCopiar);
            listaHistorico.appendChild(elemento);
        });

        listaHistorico.scrollTop = 0;
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
                <p class="text-sm text-slate-600 dark:text-slate-300">
                    ${escaparHtml(resultado.mensagem)}
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
                    dados.endereco.cep ? `CEP: ${dados.endereco.cep}` : undefined,
                ].filter(Boolean).join(", ")
                : "Não informado";

            const atividadePrincipal = dados.atividadePrincipal
                ? [dados.atividadePrincipal.codigo, dados.atividadePrincipal.descricao].filter(Boolean).join(" - ")
                : "Não informada";

            const atividadesSecundarias = dados.atividadesSecundarias && dados.atividadesSecundarias.length > 0
                ? `<ul class="list-disc list-inside space-y-1">${dados.atividadesSecundarias
                    .map((atividade) => `<li>${escaparHtml([atividade.codigo, atividade.descricao].filter(Boolean).join(" - ") || "")}</li>`)
                    .join("")}</ul>`
                : "<p class=\"text-sm\">Nenhuma atividade secundária informada.</p>";

            const socios = dados.socios && dados.socios.length > 0
                ? `<ul class="list-disc list-inside space-y-1">${dados.socios
                    .map((socio) => {
                        const linha = [socio.nome, socio.qualificacao, socio.pais]
                            .filter((parte) => (parte ?? "").toString().trim().length > 0)
                            .join(" · ");
                        const infoEntrada = socio.entrada ? ` <span class=\"text-xs text-slate-500 dark:text-slate-400\">(Desde ${escaparHtml(socio.entrada)})</span>` : "";
                        return `<li>${escaparHtml(linha || "Não informado")}${infoEntrada}</li>`;
                    })
                    .join("")}</ul>`
                : "<p class=\"text-sm\">Nenhum sócio informado.</p>";

            const capital = typeof dados.capitalSocial === "number"
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
                    <details class="bg-zinc-100 dark:bg-slate-900/60 rounded-xl p-4">
                        <summary class="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-200">Ver dados completos (JSON)</summary>
                        <pre class="mt-3 max-h-64 overflow-auto scroll-personalizado text-xs bg-black/80 text-emerald-300 rounded-lg p-3">${jsonBruto}</pre>
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
        this.elementoFocoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;

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
            ? `Dados do CNPJ ${exibicao} encontrados com sucesso.`
            : resultado.mensagem;

        this.exibirAviso(mensagem, tipo);
    }

    /**
     * @summary Exibe um resumo após a consulta em massa.
     */
    private notificarResumoMassa(resultados: ResultadoValidacaoApi[]): void {
        const validos = resultados.filter((item) => item.valido).length;
        const total = resultados.length;
        const invalidos = total - validos;

        if (validos === total && total > 0) {
            this.exibirAviso(`Todos os ${total} CNPJs retornaram dados no OpenCNPJ.`, TipoAviso.Sucesso);
            return;
        }

        if (validos > 0) {
            this.exibirAviso(
                `${validos} de ${total} CNPJs retornaram dados. ${invalidos} não foram localizados ou apresentaram erro.`,
                TipoAviso.InfoAlternativo,
            );
            return;
        }

        this.exibirAviso("Nenhum dos CNPJs informados foi localizado no OpenCNPJ.", TipoAviso.Erro);
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

        const aplicarMascaraLocal = (valor: string): string => aplicarMascaraProgressiva(normalizarPuro(valor));

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

            const total = novo.split(",").map((parte) => parte.trim()).filter(Boolean).length;
            if (total >= LIMITE && /[;,]|\n/.test(textoOrig)) {
                exibirAviso(this.elementos.areaAviso, `Limite de ${LIMITE} CNPJs atingido. Os extras foram ignorados.`, TipoAviso.Info);
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
            reformatar(texto);
        });

        controleMascara.addEventListener("change", () => reformatar(campoMassa.value));
    }

    /**
     * @summary Define o placeholder do campo único conforme o estado da máscara.
     */
    private configurarPlaceholderMascara(): void {
        const { controleMascara, campoUnico } = this.elementos;

        const atualizarPlaceholder = (): void => {
            campoUnico.placeholder = controleMascara.checked
                ? "00.ABC.000/ABCD-00"
                : "00ABC000ABCD00";
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

    void new ValidadorCnpjApi(elementos);
});

export { };

