import { ClasseAviso, IntervaloTemporizador, TipoAviso, } from "../src/enums.js";
import { CLASSES_AVISO_OCULTO, CLASSES_AVISO_VISIVEL, MAPA_CLASSES_TIPO_AVISO, PESOS_DIGITOS, } from "../src/constantes.js";
import { htmlCookies, inicializarAvisoDeCookies } from "../src/cookies.js";
class ValidadorCnpj {
    constructor(elementos) {
        this.elementos = elementos;
        this.historico = [];
        this.limiteHistorico = 100;
        this.valorEntradaAtual = "";
        this.configurarEventos();
        this.alternarModoMassa(false);
    }
    configurarEventos() {
        const { botaoValidarUnico, botaoValidarMassa, controleMascara, controleMassa, botaoColar, campoUnico, } = this.elementos;
        botaoValidarUnico.addEventListener("click", () => {
            this.validarUnico();
        });
        botaoValidarMassa.addEventListener("click", () => {
            this.validarEmMassa();
        });
        controleMascara.addEventListener("change", () => {
            this.sincronizarCampoUnico();
            this.renderizarHistorico();
        });
        controleMassa.addEventListener("change", () => {
            this.alternarModoMassa(controleMassa.checked);
        });
        botaoColar.addEventListener("click", async () => {
            await this.colarDoClipboard();
        });
        campoUnico.addEventListener("input", () => {
            this.tratarEntradaManual(campoUnico.value);
        });
        campoUnico.addEventListener("paste", (evento) => {
            evento.preventDefault();
            const texto = evento.clipboardData?.getData("text") ?? "";
            this.tratarEntradaManual(texto);
        });
    }
    alternarModoMassa(ativo) {
        const { campoUnico, campoMassa, botaoValidarUnico, botaoValidarMassa, botaoColar, cardPrincipal, painelValidacao, cardHistorico, } = this.elementos;
        campoUnico.classList.toggle("hidden", ativo);
        campoMassa.classList.toggle("hidden", !ativo);
        botaoValidarUnico.classList.toggle("hidden", ativo);
        botaoValidarMassa.classList.toggle("hidden", !ativo);
        botaoColar.classList.toggle("hidden", ativo);
        this.ajustarAlturaCartoes(ativo, cardPrincipal, painelValidacao, cardHistorico);
        if (ativo) {
            campoMassa.value = "";
            campoMassa.focus();
        }
        else {
            this.sincronizarCampoUnico();
            campoUnico.focus();
        }
    }
    async colarDoClipboard() {
        try {
            const texto = await navigator.clipboard.readText();
            if (!texto) {
                this.exibirAviso("Nenhum conteúdo disponível para colar", TipoAviso.Erro);
                return;
            }
            this.tratarEntradaManual(texto);
            this.exibirAviso("Conteúdo colado", TipoAviso.Info);
        }
        catch {
            this.exibirAviso("Não foi possível acessar a área de transferência", TipoAviso.Erro);
        }
    }
    validarUnico() {
        const valor = this.valorEntradaAtual.trim();
        if (!valor) {
            this.exibirAviso("Informe um CNPJ para validar", TipoAviso.Erro);
            return;
        }
        const resultado = this.validarCnpj(valor);
        this.adicionarAoHistorico(resultado);
        this.renderizarHistorico();
        if (resultado.valido) {
            this.exibirAviso("CNPJ válido", TipoAviso.Sucesso);
        }
        else {
            this.exibirAviso("CNPJ inválido", TipoAviso.Erro);
        }
    }
    validarEmMassa() {
        const valor = this.elementos.campoMassa.value.trim();
        if (!valor) {
            this.exibirAviso("Informe ao menos um CNPJ para validar", TipoAviso.Erro);
            return;
        }
        const entradas = valor
            .split(",")
            .map((parte) => parte.trim())
            .filter((parte) => parte.length > 0);
        if (entradas.length === 0) {
            this.exibirAviso("Informe ao menos um CNPJ para validar", TipoAviso.Erro);
            return;
        }
        if (entradas.length > 100) {
            this.exibirAviso("Limite de 100 CNPJs por validação", TipoAviso.Erro);
            return;
        }
        let validos = 0;
        let invalidos = 0;
        entradas.forEach((entrada) => {
            const resultado = this.validarCnpj(entrada);
            if (resultado.valido) {
                validos++;
            }
            else {
                invalidos++;
            }
            this.adicionarAoHistorico(resultado);
        });
        this.renderizarHistorico();
        if (invalidos === 0 && validos > 0) {
            this.exibirAviso("CNPJ válido", TipoAviso.Sucesso);
        }
        else {
            this.exibirAviso("CNPJ inválido", TipoAviso.Erro);
        }
    }
    adicionarAoHistorico(resultado) {
        this.historico.unshift(resultado);
        if (this.historico.length > this.limiteHistorico) {
            this.historico.length = this.limiteHistorico;
        }
    }
    renderizarHistorico() {
        const { listaHistorico, controleMascara } = this.elementos;
        listaHistorico.innerHTML = "";
        const aplicarMascara = controleMascara.checked;
        this.historico.forEach((item) => {
            const elemento = document.createElement("li");
            elemento.className =
                "flex items-center justify-between gap-3 rounded-xl bg-zinc-50/60 dark:bg-slate-900/60 px-3 py-2";
            const texto = document.createElement("span");
            texto.className = "text-sm font-semibold text-slate-600 dark:text-zinc-50 break-words";
            texto.textContent = this.formatarParaExibicao(item.puro, aplicarMascara);
            const status = document.createElement("span");
            status.className = item.valido
                ? "inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white"
                : "inline-flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white";
            status.textContent = item.valido ? "✅ Válido" : "❌ Inválido";
            elemento.append(texto, status);
            listaHistorico.appendChild(elemento);
        });
        listaHistorico.scrollTop = 0;
    }
    tratarEntradaManual(texto) {
        const puro = this.normalizarEntrada(texto);
        this.valorEntradaAtual = puro;
        this.elementos.campoUnico.value = this.controleMascaraAtiva()
            ? this.aplicarMascaraDinamica(puro)
            : puro;
    }
    sincronizarCampoUnico() {
        this.elementos.campoUnico.value = this.controleMascaraAtiva()
            ? this.aplicarMascaraDinamica(this.valorEntradaAtual)
            : this.valorEntradaAtual;
    }
    controleMascaraAtiva() {
        return this.elementos.controleMascara.checked;
    }
    normalizarEntrada(texto) {
        return texto
            .toUpperCase()
            .replace(/[^0-9A-Z]/g, "")
            .slice(0, 14);
    }
    aplicarMascaraDinamica(puro) {
        if (!puro) {
            return "";
        }
        const partes = [
            puro.slice(0, 2),
            puro.slice(2, 5),
            puro.slice(5, 8),
            puro.slice(8, 12),
            puro.slice(12, 14),
        ];
        let resultado = partes[0] ?? "";
        if (partes[1]) {
            resultado += `${resultado ? "." : ""}${partes[1]}`;
        }
        if (partes[2]) {
            resultado += `.${partes[2]}`;
        }
        if (partes[3]) {
            resultado += `/${partes[3]}`;
        }
        if (partes[4]) {
            resultado += `-${partes[4]}`;
        }
        return resultado;
    }
    ajustarAlturaCartoes(ativo, cardPrincipal, painelValidacao, cardHistorico) {
        if (ativo) {
            cardPrincipal.style.minHeight = "520px";
            painelValidacao.style.height = "520px";
            cardHistorico.style.maxHeight = "600px";
        }
        else {
            cardPrincipal.style.removeProperty("min-height");
            painelValidacao.style.removeProperty("height");
            cardHistorico.style.removeProperty("max-height");
        }
    }
    formatarParaExibicao(cnpj, aplicarMascara) {
        if (!aplicarMascara || cnpj.length !== 14) {
            return cnpj;
        }
        return this.aplicarMascaraDinamica(cnpj);
    }
    validarCnpj(entrada) {
        const normalizado = entrada.toUpperCase();
        const possuiCaracteresInvalidos = /[^0-9A-Z.\-/\s]/.test(normalizado);
        const puro = normalizado.replace(/[.\-/\s]/g, "");
        if (possuiCaracteresInvalidos) {
            return { puro, valido: false };
        }
        if (puro.length !== 14) {
            return { puro, valido: false };
        }
        if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(puro)) {
            return { puro, valido: false };
        }
        if (/^([0-9A-Z])\1{13}$/.test(puro)) {
            return { puro, valido: false };
        }
        const corpo = puro.slice(0, 12);
        const dvInformado = puro.slice(12);
        const valores = Array.from(corpo).map((caractere) => this.converterCaractere(caractere));
        const primeiroDV = this.calcularDigito(valores, PESOS_DIGITOS.primeiro);
        const segundoDV = this.calcularDigito([...valores, primeiroDV], PESOS_DIGITOS.segundo);
        const valido = primeiroDV === Number.parseInt(dvInformado[0] ?? "", 10)
            && segundoDV === Number.parseInt(dvInformado[1] ?? "", 10);
        return { puro, valido };
    }
    converterCaractere(caractere) {
        const codigo = caractere.charCodeAt(0);
        return codigo - 48;
    }
    calcularDigito(valores, pesos) {
        const soma = valores.reduce((acumulado, valorAtual, indice) => acumulado + valorAtual * (pesos[indice] ?? 0), 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
    exibirAviso(mensagem, tipo) {
        const { areaAviso } = this.elementos;
        const classesBase = "fixed bottom-4 right-4 min-w-[240px] max-w-[calc(100%-2rem)] rounded-lg px-4 py-3 text-sm shadow-2xl transition-all duration-200 ease-out";
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
function obterElementoObrigatorio(id) {
    const elemento = document.getElementById(id);
    if (!elemento) {
        throw new Error(`Elemento com id "${id}" não encontrado.`);
    }
    return elemento;
}
document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("aviso-cookies")) {
        document.body.insertAdjacentHTML("beforeend", htmlCookies);
    }
    inicializarAvisoDeCookies();
    const elementos = {
        campoUnico: obterElementoObrigatorio("campo-unico"),
        campoMassa: obterElementoObrigatorio("campo-massa"),
        controleMascara: obterElementoObrigatorio("toggle-mascara-validator"),
        controleMassa: obterElementoObrigatorio("toggle-massa"),
        botaoValidarUnico: obterElementoObrigatorio("botao-validar"),
        botaoValidarMassa: obterElementoObrigatorio("botao-validar-massa"),
        listaHistorico: obterElementoObrigatorio("lista-historico-validacao"),
        areaAviso: obterElementoObrigatorio("toast"),
        botaoColar: obterElementoObrigatorio("botao-colar"),
        cardPrincipal: obterElementoObrigatorio("card-validacao"),
        painelValidacao: obterElementoObrigatorio("painel-validacao"),
        cardHistorico: obterElementoObrigatorio("card-historico"),
    };
    void new ValidadorCnpj(elementos);
});
