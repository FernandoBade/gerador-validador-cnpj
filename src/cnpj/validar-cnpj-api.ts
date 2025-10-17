/* ============================
   Validação de CNPJ via API OpenCNPJ
   - Consulta até 10 CNPJs em sequência
   - Exibe status em lista e detalhes em modal
   - Reutiliza padrões visuais do projeto
============================ */

import { aplicarMascara } from "../cnpj/formatacao-cnpj.js";
import { atualizarContadorHistorico } from "../interface/contador-historico.js";
import {
    exibirAviso,
    inicializarEfeitoOnda,
    obterElementoObrigatorio,
    TipoAviso,
} from "../interface/interface.js";

interface ElementosPagina {
    campoEntrada: HTMLTextAreaElement;
    botaoValidar: HTMLButtonElement;
    listaResultados: HTMLUListElement;
    contadorResultados: HTMLSpanElement;
    areaAviso: HTMLDivElement;
    modal: HTMLDivElement;
    botaoFecharModal: HTMLButtonElement;
    tituloModal: HTMLHeadingElement;
    detalhesModal: {
        nomeEmpresarial: HTMLParagraphElement;
        nomeFantasia: HTMLParagraphElement;
        situacao: HTMLParagraphElement;
        naturezaJuridica: HTMLParagraphElement;
        capitalSocial: HTMLParagraphElement;
        cnaePrincipal: HTMLParagraphElement;
        endereco: HTMLParagraphElement;
        dataAbertura: HTMLParagraphElement;
    };
}

interface CnaeApi {
    codigo?: string;
    descricao?: string;
}

interface NaturezaJuridicaApi {
    codigo?: string;
    descricao?: string;
}

interface EstabelecimentoApi {
    nome_fantasia?: string | null;
    situacao_cadastral?: string | null;
    descricao_situacao_cadastral?: string | null;
    data_inicio_atividade?: string | null;
    tipo_logradouro?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cep?: string | null;
    municipio?: string | null;
    uf?: string | null;
    cnae_principal?: CnaeApi | null;
}

interface EmpresaApi {
    razao_social?: string | null;
    capital_social?: number | string | null;
    natureza_juridica?: NaturezaJuridicaApi | string | null;
}

interface RespostaApiOpenCnpj {
    cnpj?: string;
    razao_social?: string | null;
    nome_fantasia?: string | null;
    descricao_situacao_cadastral?: string | null;
    data_abertura?: string | null;
    estabelecimento?: EstabelecimentoApi | null;
    empresa?: EmpresaApi | null;
}

interface DadosCnpjNormalizados {
    cnpj: string;
    cnpjFormatado: string;
    nomeEmpresarial: string;
    nomeFantasia: string;
    situacao: string;
    naturezaJuridica: string;
    capitalSocial: string;
    cnaePrincipal: string;
    endereco: string;
    dataAbertura: string;
}

interface EntradaCnpj {
    original: string;
    puro: string;
}

const elementos: ElementosPagina = {
    campoEntrada: obterElementoObrigatorio<HTMLTextAreaElement>("campo-cnpjs"),
    botaoValidar: obterElementoObrigatorio<HTMLButtonElement>("botao-validar-api"),
    listaResultados: obterElementoObrigatorio<HTMLUListElement>("lista-resultados-api"),
    contadorResultados: obterElementoObrigatorio<HTMLSpanElement>("contador-resultados"),
    areaAviso: obterElementoObrigatorio<HTMLDivElement>("toast"),
    modal: obterElementoObrigatorio<HTMLDivElement>("modal-detalhes-cnpj"),
    botaoFecharModal: obterElementoObrigatorio<HTMLButtonElement>("botao-fechar-modal"),
    tituloModal: obterElementoObrigatorio<HTMLHeadingElement>("modal-titulo"),
    detalhesModal: {
        nomeEmpresarial: obterElementoObrigatorio<HTMLParagraphElement>("modal-nome-empresarial"),
        nomeFantasia: obterElementoObrigatorio<HTMLParagraphElement>("modal-nome-fantasia"),
        situacao: obterElementoObrigatorio<HTMLParagraphElement>("modal-situacao"),
        naturezaJuridica: obterElementoObrigatorio<HTMLParagraphElement>("modal-natureza-juridica"),
        capitalSocial: obterElementoObrigatorio<HTMLParagraphElement>("modal-capital-social"),
        cnaePrincipal: obterElementoObrigatorio<HTMLParagraphElement>("modal-cnae-principal"),
        endereco: obterElementoObrigatorio<HTMLParagraphElement>("modal-endereco"),
        dataAbertura: obterElementoObrigatorio<HTMLParagraphElement>("modal-data-abertura"),
    },
};

let elementoComFocoAnterior: HTMLElement | null = null;

inicializarPagina();

/**
 * @summary Realiza a configuração inicial de eventos e estilos.
 */
function inicializarPagina(): void {
    elementos.botaoValidar.addEventListener("click", () => {
        void validarCnpjsInformados();
    });

    elementos.campoEntrada.addEventListener("keydown", (evento: KeyboardEvent) => {
        if (evento.key === "Enter" && (evento.ctrlKey || evento.metaKey)) {
            evento.preventDefault();
            void validarCnpjsInformados();
        }
    });

    elementos.botaoFecharModal.addEventListener("click", () => {
        fecharModal();
    });

    elementos.modal.addEventListener("click", (evento: MouseEvent) => {
        if (evento.target === elementos.modal) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", (evento: KeyboardEvent) => {
        if (evento.key === "Escape" && !elementos.modal.classList.contains("hidden")) {
            fecharModal();
        }
    });

    atualizarContadorHistorico(elementos.contadorResultados, 0, 10, false);
    inicializarEfeitoOnda();
}

/**
 * @summary Processa os CNPJs digitados, chama a API e atualiza a lista.
 */
async function validarCnpjsInformados(): Promise<void> {
    const texto = elementos.campoEntrada.value.trim();
    if (!texto) {
        exibirAviso(elementos.areaAviso, "Informe ao menos um CNPJ para consultar", TipoAviso.Info);
        return;
    }

    const entradas = texto
        .split(/[\s,;]+/)
        .map((parte) => parte.trim())
        .filter((parte) => parte.length > 0)
        .slice(0, 10);

    if (entradas.length === 0) {
        exibirAviso(elementos.areaAviso, "Nenhum CNPJ válido foi identificado", TipoAviso.Info);
        return;
    }

    if (texto.split(/[\s,;]+/).filter((parte) => parte.trim().length > 0).length > 10) {
        exibirAviso(elementos.areaAviso, "Limite de 10 CNPJs por consulta", TipoAviso.Erro);
    }

    elementos.listaResultados.innerHTML = "";
    atualizarContadorHistorico(elementos.contadorResultados, 0, 10, false);

    bloquearBotaoConsulta(true);

    let totalValidos = 0;
    let totalInvalidos = 0;

    try {
        for (const entrada of entradas) {
            const atual: EntradaCnpj = { original: entrada, puro: extrairNumeros(entrada) };
            const placeholder = criarItemCarregamento(atual);
            elementos.listaResultados.appendChild(placeholder);
            atualizarContadorHistorico(
                elementos.contadorResultados,
                elementos.listaResultados.childElementCount,
                10,
                false,
            );

            if (atual.puro.length !== 14) {
                exibirResultado(atual, null, placeholder, "O CNPJ deve conter 14 dígitos numéricos.");
                totalInvalidos += 1;
                continue;
            }

            try {
                const resposta = await consultarCNPJ(atual.puro);
                const dadosNormalizados = normalizarDadosCnpj(resposta, atual.puro);
                exibirResultado(atual, dadosNormalizados, placeholder);
                totalValidos += 1;
            } catch (erro) {
                const mensagem = erro instanceof Error ? erro.message : "Falha ao consultar a API";
                exibirResultado(atual, null, placeholder, mensagem);
                totalInvalidos += 1;
            }
        }

        if (totalValidos > 0 && totalInvalidos === 0) {
            exibirAviso(elementos.areaAviso, "Todos os CNPJs retornaram dados válidos", TipoAviso.Sucesso);
        } else if (totalValidos > 0) {
            exibirAviso(
                elementos.areaAviso,
                "Consulta concluída com alguns CNPJs inválidos ou indisponíveis",
                TipoAviso.InfoAlternativo,
            );
        } else {
            exibirAviso(elementos.areaAviso, "Não foi possível validar os CNPJs informados", TipoAviso.Erro);
        }
    } finally {
        bloquearBotaoConsulta(false);
    }
}

/**
 * @summary Cria um item na lista com spinner de carregamento.
 */
function criarItemCarregamento(entrada: EntradaCnpj): HTMLLIElement {
    const item = document.createElement("li");
    item.className =
        "flex items-center justify-between gap-3 rounded-md ring-2 ring-slate-100 dark:ring-slate-800 dark:shadow-2xl px-3 py-2 hover:ring-slate-300 transition-all duration-300 dark:hover:ring-slate-900";

    const indicador = document.createElement("span");
    indicador.className =
        "inline-block w-2 h-2 rounded-full border bg-violet-400 border-violet-500 ring-2 ring-violet-400/40 shadow-sm shadow-current transition-all duration-300";
    indicador.setAttribute("title", "Consultando API");

    const texto = document.createElement("span");
    texto.className = "text-sm font-semibold text-slate-600 dark:text-zinc-50 break-words flex-1";
    texto.textContent = entrada.puro.length === 14 ? aplicarMascara(entrada.puro) : entrada.original;

    const containerEsquerdo = document.createElement("div");
    containerEsquerdo.className = "flex items-center gap-3 flex-1";
    containerEsquerdo.append(indicador, texto);

    const status = document.createElement("div");
    status.className = "flex items-center gap-3";

    const spinner = document.createElement("span");
    spinner.className = "inline-flex items-center justify-center";
    spinner.innerHTML =
        '<span class="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>' +
        '<span class="sr-only">Consultando API</span>';

    const botao = document.createElement("button");
    botao.type = "button";
    botao.disabled = true;
    botao.className =
        "efeito-onda-base inline-flex items-center justify-center rounded-lg border border-violet-400/60 text-violet-500 px-3 py-1 text-xs font-semibold opacity-60 cursor-not-allowed";
    botao.textContent = "Detalhes";

    status.append(spinner, botao);
    item.append(containerEsquerdo, status);
    return item;
}

/**
 * @summary Consulta um CNPJ no endpoint público do OpenCNPJ.
 */
async function consultarCNPJ(cnpj: string): Promise<RespostaApiOpenCnpj> {
    const resposta = await fetch(`https://opencnpj.org/api/cnpj/${cnpj}`, {
        headers: {
            Accept: "application/json",
        },
    });

    if (resposta.status === 404) {
        throw new Error("CNPJ não encontrado na base do OpenCNPJ.");
    }

    if (!resposta.ok) {
        throw new Error("Serviço do OpenCNPJ indisponível. Tente novamente em instantes.");
    }

    const dados = (await resposta.json()) as RespostaApiOpenCnpj;
    return dados;
}

/**
 * @summary Exibe o resultado na lista, atualizando o status e o botão de detalhes.
 */
function exibirResultado(
    entrada: EntradaCnpj,
    dados: DadosCnpjNormalizados | null,
    anterior: HTMLLIElement,
    mensagem?: string,
): void {
    const item = document.createElement("li");
    item.className =
        "flex items-center justify-between gap-3 rounded-md ring-2 ring-slate-100 dark:ring-slate-800 dark:shadow-2xl px-3 py-2 hover:ring-slate-300 transition-all duration-300 dark:hover:ring-slate-900";

    const indicador = document.createElement("span");
    indicador.className = dados
        ? "inline-block w-2 h-2 rounded-full border bg-teal-500 border-emerald-500 ring-2 ring-teal-500/40 shadow-sm shadow-current transition-all duration-300"
        : "inline-block w-2 h-2 rounded-full border bg-red-400 border-red-500 ring-2 ring-red-400/40 shadow-sm shadow-current transition-all duration-300";
    indicador.setAttribute("title", dados ? "CNPJ válido" : "CNPJ inválido");

    const texto = document.createElement("span");
    texto.className = "text-sm font-semibold text-slate-600 dark:text-zinc-50 break-words flex-1";
    texto.textContent = entrada.puro.length === 14 ? aplicarMascara(entrada.puro) : entrada.original;

    const containerEsquerdo = document.createElement("div");
    containerEsquerdo.className = "flex items-center gap-3 flex-1";
    containerEsquerdo.append(indicador, texto);

    const containerDireito = document.createElement("div");
    containerDireito.className = "flex items-center gap-3";

    const status = document.createElement("span");
    status.className = dados
        ? "text-xs font-semibold uppercase tracking-wide text-emerald-500"
        : "text-xs font-semibold uppercase tracking-wide text-red-500";
    status.textContent = dados ? "Válido" : "Inválido";

    if (!dados && mensagem) {
        status.setAttribute("title", mensagem);
    }

    const botaoDetalhes = document.createElement("button");
    botaoDetalhes.type = "button";
    botaoDetalhes.textContent = "Detalhes";
    botaoDetalhes.className =
        "efeito-onda-base inline-flex items-center justify-center rounded-lg border-2 border-violet-500 text-violet-500 px-3 py-1 text-xs font-semibold transition-all duration-300 hover:border-violet-600 hover:text-violet-600";
    botaoDetalhes.disabled = !dados;

    if (!dados) {
        botaoDetalhes.classList.add("opacity-60", "cursor-not-allowed");
        botaoDetalhes.setAttribute("aria-disabled", "true");
    } else {
        botaoDetalhes.addEventListener("click", () => {
            abrirModal(dados);
        });
    }

    containerDireito.append(status, botaoDetalhes);
    item.append(containerEsquerdo, containerDireito);

    if (!dados && mensagem) {
        const alerta = document.createElement("p");
        alerta.className = "text-xs text-slate-500 dark:text-slate-400 mt-1";
        alerta.textContent = mensagem;
        alerta.setAttribute("aria-live", "polite");
        containerDireito.append(alerta);
    }

    elementos.listaResultados.replaceChild(item, anterior);
}

/**
 * @summary Normaliza os dados recebidos da API para exibição na interface.
 */
function normalizarDadosCnpj(resposta: RespostaApiOpenCnpj, cnpjPuro: string): DadosCnpjNormalizados {
    const estabelecimento = resposta.estabelecimento ?? {};
    const empresa = resposta.empresa ?? {};

    const nomeEmpresarial =
        resposta.razao_social?.trim() ||
        empresa.razao_social?.toString().trim() ||
        "Não informado";

    const nomeFantasia =
        estabelecimento.nome_fantasia?.trim() || resposta.nome_fantasia?.trim() || "Não informado";

    const situacao =
        estabelecimento.descricao_situacao_cadastral?.trim() ||
        estabelecimento.situacao_cadastral?.trim() ||
        resposta.descricao_situacao_cadastral?.trim() ||
        "Não informado";

    const naturezaBruta = empresa.natureza_juridica;
    const naturezaJuridica = normalizarNaturezaJuridica(naturezaBruta);

    const capitalSocial = normalizarCapitalSocial(empresa.capital_social);
    const cnaePrincipal = normalizarCnae(estabelecimento.cnae_principal);
    const endereco = montarEndereco(estabelecimento);

    const dataAbertura = normalizarData(
        estabelecimento.data_inicio_atividade ?? resposta.data_abertura ?? null,
    );

    const cnpjFormatado = aplicarMascara(cnpjPuro);

    return {
        cnpj: cnpjPuro,
        cnpjFormatado,
        nomeEmpresarial,
        nomeFantasia,
        situacao,
        naturezaJuridica,
        capitalSocial,
        cnaePrincipal,
        endereco,
        dataAbertura,
    };
}

/**
 * @summary Formata a natureza jurídica recebida da API.
 */
function normalizarNaturezaJuridica(valor: NaturezaJuridicaApi | string | null | undefined): string {
    if (!valor) return "Não informado";

    if (typeof valor === "string") {
        return valor.trim() || "Não informado";
    }

    const codigo = valor.codigo?.trim();
    const descricao = valor.descricao?.trim();
    if (codigo && descricao) return `${codigo} — ${descricao}`;
    if (codigo) return codigo;
    if (descricao) return descricao;
    return "Não informado";
}

/**
 * @summary Formata o capital social para moeda brasileira.
 */
function normalizarCapitalSocial(valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined) return "Não informado";

    const numero = typeof valor === "string" ? Number.parseFloat(valor) : valor;
    if (!Number.isFinite(numero)) return "Não informado";

    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @summary Formata o CNAE principal.
 */
function normalizarCnae(cnae: CnaeApi | null | undefined): string {
    if (!cnae) return "Não informado";
    const codigo = cnae.codigo?.trim();
    const descricao = cnae.descricao?.trim();
    if (codigo && descricao) return `${codigo} — ${descricao}`;
    if (codigo) return codigo;
    if (descricao) return descricao;
    return "Não informado";
}

/**
 * @summary Monta o endereço completo a partir dos campos do estabelecimento.
 */
function montarEndereco(estabelecimento: EstabelecimentoApi): string {
    const partes: string[] = [];

    const logradouro = [estabelecimento.tipo_logradouro, estabelecimento.logradouro]
        .filter((parte) => Boolean(parte && parte.toString().trim()))
        .join(" ")
        .trim();

    if (logradouro) {
        const numero = estabelecimento.numero?.trim() || "s/ nº";
        const complemento = estabelecimento.complemento?.trim();
        const linha = complemento ? `${logradouro}, ${numero} (${complemento})` : `${logradouro}, ${numero}`;
        partes.push(linha);
    }

    if (estabelecimento.bairro?.trim()) {
        partes.push(estabelecimento.bairro.trim());
    }

    const cidadeUf = [estabelecimento.municipio?.trim(), estabelecimento.uf?.trim()]
        .filter((parte) => parte && parte.length > 0)
        .join(" - ");
    if (cidadeUf) {
        partes.push(cidadeUf);
    }

    if (estabelecimento.cep?.trim()) {
        partes.push(`CEP ${formatarCep(estabelecimento.cep)}`);
    }

    return partes.length > 0 ? partes.join(" • ") : "Não informado";
}

/**
 * @summary Normaliza a data (YYYY-MM-DD) para o formato brasileiro.
 */
function normalizarData(valor: string | null): string {
    if (!valor) return "Não informado";

    const [ano, mes, dia] = valor.split("T")[0]?.split("-") ?? [];
    if (!ano || !mes || !dia) return "Não informado";

    const data = new Date(Number.parseInt(ano, 10), Number.parseInt(mes, 10) - 1, Number.parseInt(dia, 10));
    if (Number.isNaN(data.getTime())) return "Não informado";

    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(data);
}

/**
 * @summary Formata o CEP com máscara brasileira padrão.
 */
function formatarCep(valor: string): string {
    const apenasNumeros = extrairNumeros(valor);
    if (apenasNumeros.length !== 8) return valor.trim();
    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5)}`;
}

/**
 * @summary Remove todos os caracteres que não são dígitos.
 */
function extrairNumeros(valor: string): string {
    return valor.replace(/\D+/g, "");
}

/**
 * @summary Abre a modal preenchendo os dados do CNPJ selecionado.
 */
function abrirModal(dados: DadosCnpjNormalizados): void {
    elementoComFocoAnterior = document.activeElement as HTMLElement | null;

    elementos.tituloModal.textContent = dados.cnpjFormatado || dados.cnpj;
    elementos.detalhesModal.nomeEmpresarial.textContent = dados.nomeEmpresarial;
    elementos.detalhesModal.nomeFantasia.textContent = dados.nomeFantasia;
    elementos.detalhesModal.situacao.textContent = dados.situacao;
    elementos.detalhesModal.naturezaJuridica.textContent = dados.naturezaJuridica;
    elementos.detalhesModal.capitalSocial.textContent = dados.capitalSocial;
    elementos.detalhesModal.cnaePrincipal.textContent = dados.cnaePrincipal;
    elementos.detalhesModal.endereco.textContent = dados.endereco;
    elementos.detalhesModal.dataAbertura.textContent = dados.dataAbertura;

    elementos.modal.classList.remove("hidden");
    elementos.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
    elementos.botaoFecharModal.focus();
}

/**
 * @summary Fecha a modal e restaura o foco anterior.
 */
function fecharModal(): void {
    elementos.modal.classList.add("hidden");
    elementos.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    if (elementoComFocoAnterior) {
        elementoComFocoAnterior.focus();
    }
    elementoComFocoAnterior = null;
}

/**
 * @summary Desativa ou reativa o botão principal durante a consulta.
 */
function bloquearBotaoConsulta(bloquear: boolean): void {
    elementos.botaoValidar.disabled = bloquear;
    elementos.botaoValidar.classList.toggle("opacity-60", bloquear);
    elementos.botaoValidar.classList.toggle("cursor-not-allowed", bloquear);
}

export { consultarCNPJ, exibirResultado, abrirModal };
