import { aplicarMascara } from "./formatacao-cnpj.js";
import { exibirAviso, inicializarEfeitoOnda, obterElementoObrigatorio, TipoAviso } from "../interface/interface.js";
const mapaItens = new Map();
const mapaDadosModal = new Map();
let ultimoBotaoAtivo = null;
let listenerEscape = null;
const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR");
/**
 * @summary Realiza a requisição do CNPJ na API pública do OpenCNPJ.
 */
export async function consultarCNPJ(cnpj) {
    try {
        const resposta = await fetch(`https://opencnpj.org/api/cnpj/${cnpj}`, {
            headers: {
                Accept: "application/json",
            },
        });
        if (resposta.status === 404) {
            return null;
        }
        if (!resposta.ok) {
            throw new Error(`Não foi possível consultar o CNPJ (código ${resposta.status}).`);
        }
        return (await resposta.json());
    }
    catch (erro) {
        if (erro instanceof TypeError) {
            throw new Error("Falha de conexão com a API do OpenCNPJ. Tente novamente em instantes.");
        }
        if (erro instanceof Error && erro.message.includes("fetch")) {
            throw new Error("Não foi possível se comunicar com a API do OpenCNPJ.");
        }
        throw erro instanceof Error ? erro : new Error("Erro inesperado ao consultar a API do OpenCNPJ.");
    }
}
/**
 * @summary Inicializa a página e configura os eventos principais.
 */
function inicializarPagina() {
    const elementos = {
        formulario: obterElementoObrigatorio("form-validacao-api"),
        campoCnpjs: obterElementoObrigatorio("campo-cnpjs"),
        listaResultados: obterElementoObrigatorio("lista-resultados-api"),
        areaAviso: obterElementoObrigatorio("toast"),
        modal: obterElementoObrigatorio("modal-detalhes"),
        tituloModal: obterElementoObrigatorio("titulo-modal"),
        listaDetalhesModal: obterElementoObrigatorio("lista-detalhes-modal"),
        botaoFecharModal: obterElementoObrigatorio("botao-fechar-modal"),
    };
    inicializarEfeitoOnda();
    elementos.formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        await validarCnpjs(elementos);
    });
    elementos.modal.addEventListener("click", (evento) => {
        if (evento.target === elementos.modal) {
            fecharModal(elementos);
        }
    });
    elementos.botaoFecharModal.addEventListener("click", () => {
        fecharModal(elementos);
    });
}
/**
 * @summary Executa a validação para todos os CNPJs informados.
 */
async function validarCnpjs(elementos) {
    const entradas = obterCnpjsDoFormulario(elementos.campoCnpjs.value);
    if (entradas.length === 0) {
        limparResultados(elementos);
        exibirAviso(elementos.areaAviso, "Informe ao menos um CNPJ para consultar.", TipoAviso.Info);
        return;
    }
    if (entradas.length > 10) {
        exibirAviso(elementos.areaAviso, "Limite de 10 CNPJs por consulta na API.", TipoAviso.Erro);
        return;
    }
    limparResultados(elementos);
    let exibiuAvisoFormato = false;
    const promessas = entradas.map(async (cnpj) => {
        exibirResultado(cnpj, undefined, elementos);
        if (cnpj.length !== 14) {
            exibirResultado(cnpj, { erro: "CNPJ deve conter exatamente 14 dígitos numéricos." }, elementos);
            if (!exibiuAvisoFormato) {
                exibirAviso(elementos.areaAviso, "Alguns CNPJs possuem menos de 14 dígitos. Ajuste e tente novamente.", TipoAviso.Info);
                exibiuAvisoFormato = true;
            }
            return;
        }
        try {
            const dadosBrutos = await consultarCNPJ(cnpj);
            if (dadosBrutos === null) {
                exibirResultado(cnpj, null, elementos);
                exibirAviso(elementos.areaAviso, `CNPJ ${aplicarMascara(cnpj)} não foi encontrado no OpenCNPJ.`, TipoAviso.Info);
                return;
            }
            const informacoes = extrairInformacoesCnpj(dadosBrutos, cnpj);
            exibirResultado(cnpj, informacoes, elementos);
        }
        catch (erro) {
            const mensagem = erro instanceof Error ? erro.message : "Não foi possível validar o CNPJ no momento.";
            exibirResultado(cnpj, { erro: mensagem }, elementos);
            exibirAviso(elementos.areaAviso, mensagem, TipoAviso.Erro);
        }
    });
    await Promise.all(promessas);
}
/**
 * @summary Limpa a lista de resultados e os caches utilizados.
 */
function limparResultados(elementos) {
    elementos.listaResultados.innerHTML = "";
    mapaItens.clear();
    mapaDadosModal.clear();
}
/**
 * @summary Realiza o split das entradas do formulário, removendo caracteres inválidos.
 */
function obterCnpjsDoFormulario(valor) {
    return valor
        .split(/[\s,;]+/)
        .map((parte) => parte.replace(/\D/g, ""))
        .filter((parte) => parte.length > 0);
}
/**
 * @summary Adiciona ou atualiza o item da lista de resultados conforme o estado atual.
 */
function exibirResultado(cnpj, dados, elementos) {
    const chave = cnpj;
    let item = mapaItens.get(chave);
    if (!item) {
        item = document.createElement("li");
        item.className =
            "bg-zinc-50 dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-inner shadow-slate-200/60 dark:shadow-slate-900 flex flex-col gap-2 transition-colors duration-300";
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className =
            "grupo-resultado flex w-full items-center justify-between gap-4 text-left transition-colors duration-300 focus:outline-none";
        const descricaoCnpj = document.createElement("span");
        descricaoCnpj.className = "descricao-cnpj font-semibold text-sm sm:text-base text-slate-600 dark:text-zinc-50";
        descricaoCnpj.textContent = aplicarMascara(cnpj);
        const status = document.createElement("span");
        status.className =
            "status-resultado flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400";
        botao.append(descricaoCnpj, status);
        item.append(botao);
        const mensagem = document.createElement("p");
        mensagem.className = "mensagem-resultado text-xs text-rose-500 dark:text-rose-400 hidden";
        item.append(mensagem);
        elementos.listaResultados.append(item);
        mapaItens.set(chave, item);
        botao.addEventListener("click", () => {
            const dadosModal = mapaDadosModal.get(botao);
            if (dadosModal) {
                ultimoBotaoAtivo = botao;
                abrirModal(dadosModal, elementos);
            }
        });
    }
    const botao = item.querySelector("button");
    const status = item.querySelector(".status-resultado");
    const mensagem = item.querySelector(".mensagem-resultado");
    const descricaoCnpj = item.querySelector(".descricao-cnpj");
    if (!botao || !status || !mensagem || !descricaoCnpj) {
        throw new Error("Estrutura de resultado não encontrada.");
    }
    descricaoCnpj.textContent = aplicarMascara(cnpj);
    if (dados === undefined) {
        botao.disabled = true;
        status.className = "status-resultado flex items-center gap-2 text-sm font-semibold text-violet-500";
        status.replaceChildren(criarSpinner(), criarTextoStatus("Consultando..."));
        mensagem.classList.add("hidden");
        mensagem.textContent = "";
        mapaDadosModal.delete(botao);
    }
    else if (dados === null) {
        botao.disabled = true;
        status.className = "status-resultado flex items-center gap-2 text-sm font-semibold text-rose-500";
        status.replaceChildren(criarIndicador("bg-red-400 border-red-500 ring-2 ring-red-400/40"), criarTextoStatus("Inválido"));
        mensagem.textContent = "CNPJ não localizado na base do OpenCNPJ.";
        mensagem.classList.remove("hidden");
        mapaDadosModal.delete(botao);
    }
    else if (ehErroResultado(dados)) {
        botao.disabled = true;
        status.className = "status-resultado flex items-center gap-2 text-sm font-semibold text-rose-500";
        status.replaceChildren(criarIndicador("bg-red-400 border-red-500 ring-2 ring-red-400/40"), criarTextoStatus("Erro"));
        mensagem.textContent = dados.erro;
        mensagem.classList.remove("hidden");
        mapaDadosModal.delete(botao);
    }
    else {
        botao.disabled = false;
        status.className = "status-resultado flex items-center gap-2 text-sm font-semibold text-emerald-500";
        status.replaceChildren(criarIndicador("bg-teal-500 border-emerald-500 ring-2 ring-teal-500/40"), criarTextoStatus("Válido"));
        mensagem.classList.add("hidden");
        mensagem.textContent = "";
        mapaDadosModal.set(botao, dados);
    }
    return item;
}
/**
 * @summary Abre a modal e exibe os detalhes completos do CNPJ.
 */
function abrirModal(dadosCNPJ, elementos) {
    elementos.tituloModal.textContent = `CNPJ ${dadosCNPJ.cnpjFormatado}`;
    const campos = [
        { titulo: "Nome empresarial", valor: dadosCNPJ.nomeEmpresarial },
        { titulo: "Nome fantasia", valor: dadosCNPJ.nomeFantasia },
        { titulo: "Situação cadastral", valor: dadosCNPJ.situacao },
        { titulo: "Natureza jurídica", valor: dadosCNPJ.naturezaJuridica },
        { titulo: "Capital social", valor: dadosCNPJ.capitalSocial },
        { titulo: "CNAE principal", valor: dadosCNPJ.cnaePrincipal },
        { titulo: "Endereço", valor: dadosCNPJ.endereco },
        { titulo: "Data de abertura", valor: dadosCNPJ.dataAbertura },
    ];
    elementos.listaDetalhesModal.replaceChildren();
    for (const campo of campos) {
        const grupo = document.createElement("div");
        grupo.className = "flex flex-col gap-1 bg-zinc-100/70 dark:bg-slate-800/50 rounded-2xl px-4 py-3";
        const dt = document.createElement("dt");
        dt.className = "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
        dt.textContent = campo.titulo;
        const dd = document.createElement("dd");
        dd.className = "text-sm font-semibold text-slate-700 dark:text-zinc-100";
        dd.textContent = campo.valor;
        grupo.append(dt, dd);
        elementos.listaDetalhesModal.append(grupo);
    }
    elementos.modal.classList.remove("hidden");
    elementos.modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    listenerEscape = (evento) => {
        if (evento.key === "Escape") {
            fecharModal(elementos);
        }
    };
    document.addEventListener("keydown", listenerEscape);
    elementos.botaoFecharModal.focus();
}
/**
 * @summary Fecha a modal e restaura o foco para o elemento de origem.
 */
function fecharModal(elementos) {
    elementos.modal.classList.add("hidden");
    elementos.modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
    if (listenerEscape) {
        document.removeEventListener("keydown", listenerEscape);
        listenerEscape = null;
    }
    if (ultimoBotaoAtivo) {
        ultimoBotaoAtivo.focus();
        ultimoBotaoAtivo = null;
    }
}
/**
 * @summary Verifica se o resultado representa um erro.
 */
function ehErroResultado(dados) {
    return typeof dados === "object" && dados !== null && "erro" in dados;
}
/**
 * @summary Cria um indicador colorido utilizado na lista de resultados.
 */
function criarIndicador(classesExtras) {
    const span = document.createElement("span");
    span.className = `inline-block h-2.5 w-2.5 rounded-full border ${classesExtras}`;
    return span;
}
/**
 * @summary Cria o texto padrão para o status na lista.
 */
function criarTextoStatus(texto) {
    const span = document.createElement("span");
    span.textContent = texto;
    return span;
}
/**
 * @summary Cria o spinner exibido durante a consulta à API.
 */
function criarSpinner() {
    const span = document.createElement("span");
    span.className = "inline-block h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin";
    span.setAttribute("aria-hidden", "true");
    return span;
}
/**
 * @summary Extrai e formata os dados relevantes do CNPJ retornado pela API.
 */
function extrairInformacoesCnpj(dados, cnpj) {
    const estabelecimento = obterRegistro(dados, "estabelecimento");
    const nomeEmpresarial = obterTexto([
        dados,
        estabelecimento,
    ], ["razao_social", "nome", "nome_empresarial", "razaosocial"]);
    const nomeFantasia = obterTexto([
        estabelecimento,
        dados,
    ], ["nome_fantasia", "fantasia", "nomeFantasia"]);
    const situacao = obterTexto([
        estabelecimento,
        dados,
    ], ["situacao_cadastral", "situacao", "descricao_situacao"])
        ?? obterTexto([obterRegistro(estabelecimento ?? {}, "situacao")], ["descricao", "nome"]);
    const natureza = obterTexto([dados], ["natureza_juridica", "naturezaJuridica"]);
    const capital = obterTexto([dados], ["capital_social", "capitalSocial"]);
    const cnaePrincipal = extrairCnaePrincipal(estabelecimento, dados);
    const endereco = montarEndereco(estabelecimento, dados);
    const dataAbertura = obterTexto([
        estabelecimento,
        dados,
    ], ["data_inicio_atividade", "data_inicio", "data_abertura", "inicio_atividade"]);
    return {
        cnpjFormatado: aplicarMascara(cnpj),
        nomeEmpresarial: nomeEmpresarial ?? "Não disponível",
        nomeFantasia: nomeFantasia ?? "Não informado",
        situacao: situacao ?? "Não disponível",
        naturezaJuridica: natureza ?? "Não disponível",
        capitalSocial: formatarCapital(capital),
        cnaePrincipal: cnaePrincipal ?? "Não disponível",
        endereco: endereco ?? "Não disponível",
        dataAbertura: formatarData(dataAbertura),
    };
}
/**
 * @summary Obtém um objeto aninhado quando disponível.
 */
function obterRegistro(fonte, chave) {
    if (!fonte)
        return undefined;
    const valor = fonte[chave];
    if (typeof valor === "object" && valor !== null && !Array.isArray(valor)) {
        return valor;
    }
    return undefined;
}
/**
 * @summary Busca um texto válido em várias fontes e chaves.
 */
function obterTexto(fontes, chaves) {
    for (const fonte of fontes) {
        if (!fonte)
            continue;
        for (const chave of chaves) {
            const valor = fonte[chave];
            const texto = normalizarValorTexto(valor);
            if (texto) {
                return texto;
            }
        }
    }
    return undefined;
}
/**
 * @summary Normaliza o valor recebido para texto, quando possível.
 */
function normalizarValorTexto(valor) {
    if (typeof valor === "string") {
        const texto = valor.trim();
        return texto.length > 0 ? texto : undefined;
    }
    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor.toString() : undefined;
    }
    if (typeof valor === "object" && valor !== null) {
        const registro = valor;
        const descricao = normalizarValorTexto(registro.descricao);
        if (descricao) {
            return descricao;
        }
        const nome = normalizarValorTexto(registro.nome);
        if (nome) {
            return nome;
        }
        const texto = normalizarValorTexto(registro.texto);
        if (texto) {
            return texto;
        }
    }
    return undefined;
}
/**
 * @summary Extrai a descrição do CNAE principal a partir das possíveis estruturas da API.
 */
function extrairCnaePrincipal(estabelecimento, dados) {
    const direto = obterTexto([
        estabelecimento,
        dados,
    ], ["cnae_principal", "cnae_fiscal_descricao", "cnae_fiscal", "cnaeFiscal"]);
    if (direto) {
        return direto;
    }
    const fontes = [
        estabelecimento?.cnaes_principais,
        estabelecimento?.cnaesPrincipal,
        estabelecimento?.cnaes,
        dados.cnaes_principais,
        dados.cnaesPrincipal,
        dados.cnaes,
    ];
    for (const fonte of fontes) {
        if (!Array.isArray(fonte))
            continue;
        for (const item of fonte) {
            const texto = normalizarValorTexto(item);
            if (texto) {
                return texto;
            }
        }
    }
    const objeto = obterRegistro(estabelecimento, "cnae_principal") ?? obterRegistro(dados, "cnae_principal");
    if (objeto) {
        const texto = normalizarValorTexto(objeto);
        if (texto) {
            return texto;
        }
    }
    return undefined;
}
/**
 * @summary Monta o endereço formatado utilizando as chaves disponíveis.
 */
function montarEndereco(estabelecimento, dados) {
    const fontes = [estabelecimento, dados];
    const logradouro = obterTexto(fontes, ["logradouro", "logradouro_tipo", "tipo_logradouro"]);
    const numero = obterTexto(fontes, ["numero", "numero_endereco"]);
    const complemento = obterTexto(fontes, ["complemento"]);
    const bairro = obterTexto(fontes, ["bairro", "bairro_distrito"]);
    const municipio = obterTexto(fontes, ["municipio", "municipio_nome", "cidade"]);
    const uf = obterTexto(fontes, ["uf", "estado", "sigla_uf"]);
    const cep = obterTexto(fontes, ["cep", "cep_formatado"]);
    const partes = [];
    if (logradouro) {
        const principal = numero ? `${logradouro}, ${numero}` : logradouro;
        partes.push(principal);
    }
    if (complemento) {
        partes.push(complemento);
    }
    const regiao = [];
    if (bairro) {
        regiao.push(bairro);
    }
    if (municipio) {
        regiao.push(municipio);
    }
    let regiaoFormatada = regiao.join(" - ");
    if (regiaoFormatada && uf) {
        regiaoFormatada = `${regiaoFormatada}/${uf}`;
    }
    else if (!regiaoFormatada && uf) {
        regiaoFormatada = uf;
    }
    if (regiaoFormatada) {
        partes.push(regiaoFormatada);
    }
    if (cep) {
        partes.push(`CEP ${formatarCep(cep)}`);
    }
    if (partes.length === 0) {
        return undefined;
    }
    return partes.join(" · ");
}
/**
 * @summary Formata a data recebida no padrão brasileiro.
 */
function formatarData(valor) {
    if (!valor) {
        return "Não disponível";
    }
    const texto = valor.trim();
    if (texto.length === 0) {
        return "Não disponível";
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        return texto;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        const data = new Date(texto);
        if (!Number.isNaN(data.getTime())) {
            return formatadorData.format(data);
        }
    }
    const apenasNumeros = texto.replace(/\D/g, "");
    if (apenasNumeros.length === 8) {
        const anoInicial = Number.parseInt(apenasNumeros.slice(0, 4), 10);
        if (anoInicial >= 1900) {
            const data = new Date(`${apenasNumeros.slice(0, 4)}-${apenasNumeros.slice(4, 6)}-${apenasNumeros.slice(6, 8)}`);
            if (!Number.isNaN(data.getTime())) {
                return formatadorData.format(data);
            }
        }
        return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
    }
    const data = new Date(texto);
    if (!Number.isNaN(data.getTime())) {
        return formatadorData.format(data);
    }
    return texto;
}
/**
 * @summary Formata o capital social no padrão monetário brasileiro.
 */
function formatarCapital(valor) {
    if (!valor) {
        return "Não informado";
    }
    const normalizado = valor.replace(/\./g, "").replace(/,/g, ".");
    const numero = Number.parseFloat(normalizado);
    if (Number.isFinite(numero)) {
        return formatadorMoeda.format(numero);
    }
    return valor;
}
/**
 * @summary Formata o CEP removendo caracteres inválidos e aplicando máscara.
 */
function formatarCep(valor) {
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length === 8) {
        return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
    }
    return valor;
}
document.addEventListener("DOMContentLoaded", () => {
    inicializarPagina();
});
