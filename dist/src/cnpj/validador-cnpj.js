/* ============================
   Validador de CNPJ Alfanumérico 2026
   - Validação individual e em massa
   - Suporte a máscara visual e colagem
   - Cálculo de dígitos verificadores (módulo 11)
   - Avisos e utilidades de UI reutilizáveis
============================ */
import { ClasseAviso, IntervaloTemporizador, TipoAviso } from "../gerais/enums.js";
import { CLASSES_AVISO_OCULTO, CLASSES_AVISO_VISIVEL, MAPA_CLASSES_TIPO_AVISO, PESOS_DIGITOS } from "../gerais/constantes.js";
import { htmlCookies, inicializarAvisoDeCookies } from "../gerais/cookies.js";
import { aplicarMascara, aplicarMascaraProgressiva, normalizarPuro } from "../cnpj/formatacao-cnpj.js";
import { calcularDigitoVerificador, converterCaractereParaValor } from "../cnpj/algoritmo-cnpj.js";
import { copiarTexto, inicializarEfeitoOnda } from "../interface/interface.js";
import { exibirAviso } from "../gerais/mensageria.js";
import { atualizarContadorHistorico } from "../interface/contador-historico.js";
/**
 * @summary Classe responsável pela validação de CNPJs (único e em massa) com UI.
 */
class ValidadorCnpj {
    elementos;
    historico = [];
    limiteHistorico = 100;
    timeoutAviso;
    // Avisos agora controlados pelo utilitário de UI
    /**
     * @summary Inicializa o validador e configura a interface.
     */
    constructor(elementos) {
        this.elementos = elementos;
        this.configurarEventos();
        this.configurarPlaceholderMascara();
        this.configurarEntradaCnpj();
        this.configurarEntradaCNPJMassa();
        this.alternarModoMassa(false);
        this.atualizarEstadoBotaoValidarUnico();
        inicializarEfeitoOnda();
    }
    /**
     * @summary Registra os manipuladores de eventos da interface.
     */
    configurarEventos() {
        const { botaoValidarUnico, botaoValidarMassa, controleMascara, controleMassa, botaoColar, } = this.elementos;
        botaoValidarUnico.addEventListener("click", () => {
            this.validarUnico();
        });
        botaoValidarMassa.addEventListener("click", () => {
            this.validarEmMassa();
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
    }
    /**
     * @summary Alterna entre validação única e em massa com animação suave.
     */
    alternarModoMassa(ativo) {
        const { campoUnico, campoMassa, botaoValidarUnico, botaoValidarMassa, botaoColar, } = this.elementos;
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
        }
        else {
            campoUnico.focus();
        }
    }
    /**
     * @summary Cola conteúdo do clipboard no campo único e notifica o usuário.
     */
    async colarDoClipboard() {
        try {
            const texto = await navigator.clipboard.readText();
            if (!texto) {
                exibirAviso(this.elementos.areaAviso, "Nenhum conteúdo disponível para colar", TipoAviso.Info);
                return;
            }
            this.elementos.campoUnico.value = texto.trim();
            exibirAviso(this.elementos.areaAviso, `Conteúdo colado: ${texto}`, TipoAviso.InfoAlternativo);
        }
        catch {
            this.exibirAviso("Não foi possível acessar a área de transferência", TipoAviso.Erro);
        }
    }
    /**
     * @summary Valida o conteúdo do campo único e atualiza o histórico.
     */
    validarUnico() {
        const valor = this.elementos.campoUnico.value.trim();
        if (!valor) {
            exibirAviso(this.elementos.areaAviso, "Informe um CNPJ para validar", TipoAviso.Erro);
            return;
        }
        const puro = valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
        if (puro.length < 14) {
            exibirAviso(this.elementos.areaAviso, "Insira os 14 caracteres antes da validação", TipoAviso.Info);
            return;
        }
        const resultado = this.validarCnpj(valor);
        this.adicionarAoHistorico(resultado);
        this.renderizarHistorico();
        if (resultado.valido)
            exibirAviso(this.elementos.areaAviso, `CNPJ ${valor} é válido`, TipoAviso.Sucesso);
        else
            exibirAviso(this.elementos.areaAviso, `CNPJ ${valor} é inválido`, TipoAviso.Erro);
    }
    /**
     * @summary Valida uma lista de CNPJs separados por vírgula/; e atualiza o histórico.
     */
    validarEmMassa() {
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
        if (invalidos === 0 && validos > 0)
            exibirAviso(this.elementos.areaAviso, "CNPJ válido", TipoAviso.Sucesso);
        else
            exibirAviso(this.elementos.areaAviso, "CNPJ inválido", TipoAviso.Erro);
    }
    /**
     * @summary Adiciona o resultado ao histórico respeitando o limite.
     */
    adicionarAoHistorico(resultado) {
        this.historico.unshift(resultado);
        if (this.historico.length > this.limiteHistorico) {
            this.historico.length = this.limiteHistorico;
        }
        const contador = document.getElementById("contador-historico");
        atualizarContadorHistorico(contador, this.historico.length, this.limiteHistorico, true);
    }
    /**
     * @summary Renderiza a lista de validações realizadas, com opção de copiar.
     */
    renderizarHistorico() {
        const { listaHistorico, controleMascara } = this.elementos;
        listaHistorico.innerHTML = "";
        const aplicarMascaraAtiva = controleMascara.checked;
        this.historico.forEach((item) => {
            const elemento = document.createElement("li");
            elemento.className =
                "flex items-center justify-between gap-3 rounded-md ring-2 ring-slate-100 dark:ring-slate-800 dark:shadow-2xl px-3 py-1 hover:ring-slate-300 transition-all duration-300 dark:hover:ring-slate-900 cursor-default";
            const indicador = document.createElement("span");
            indicador.className = (item.valido
                ? 'inline-block w-2 h-2 rounded-full border bg-teal-500 border-emerald-500 ring-2 ring-teal-500/40 shadow-sm shadow-current transition-all duration-300'
                : 'inline-block w-2 h-2 rounded-full border bg-red-400 border-red-500 ring-2 ring-red-400/40 shadow-sm shadow-current transition-all duration-300');
            indicador.setAttribute("title", item.valido ? "CNPJ válido" : "CNPJ inválido");
            const texto = document.createElement("span");
            texto.className = "text-sm font-semibold text-slate-600 dark:text-zinc-50 break-words flex-1 cursor-default";
            texto.textContent = aplicarMascaraAtiva ? aplicarMascara(item.puro) : item.puro;
            const containerEsquerdo = document.createElement("div");
            containerEsquerdo.className = "flex items-center gap-3 flex-1";
            containerEsquerdo.append(indicador, texto);
            const botaoCopiar = document.createElement("button");
            botaoCopiar.className = "ml-1 inline-flex items-center justify-center rounded text-violet-500 transition-all dark:text-violet-500 dark:hover:text-violet-600 ease-in-out hover:text-violet-600 hover:scale-110 py-1 text-xs";
            botaoCopiar.setAttribute("title", "Copiar esse CNPJ");
            botaoCopiar.innerHTML = `
                <svg class="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
                </svg>
            `;
            botaoCopiar.addEventListener("click", async (evento) => {
                evento.preventDefault();
                const textoParaCopiar = aplicarMascaraAtiva ? aplicarMascara(item.puro) : item.puro;
                try {
                    await copiarTexto(textoParaCopiar);
                    exibirAviso(this.elementos.areaAviso, `CNPJ copiado: ${textoParaCopiar}`, TipoAviso.InfoAlternativo);
                }
                catch {
                    exibirAviso(this.elementos.areaAviso, "Falha ao copiar", TipoAviso.Erro);
                }
            });
            elemento.append(containerEsquerdo, botaoCopiar);
            listaHistorico.appendChild(elemento);
        });
        listaHistorico.scrollTop = 0;
        const contador = document.getElementById("contador-historico");
        atualizarContadorHistorico(contador, this.historico.length, this.limiteHistorico, true);
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
        const valores = Array.from(corpo).map((caractere) => converterCaractereParaValor(caractere));
        const primeiroDV = calcularDigitoVerificador(valores, PESOS_DIGITOS.primeiro);
        const segundoDV = calcularDigitoVerificador([...valores, primeiroDV], PESOS_DIGITOS.segundo);
        const valido = primeiroDV === Number.parseInt(dvInformado[0] ?? "", 10)
            && segundoDV === Number.parseInt(dvInformado[1] ?? "", 10);
        return { puro, valido };
    }
    /**
     * @summary Configura o comportamento do campo único (normalização e máscara).
     */
    configurarEntradaCnpj() {
        const { campoUnico, controleMascara } = this.elementos;
        const aplicarMascaraLocal = (valor) => aplicarMascaraProgressiva(normalizarPuro(valor));
        const atualizarEntrada = () => {
            let bruto = campoUnico.value;
            bruto = normalizarPuro(bruto);
            if (bruto.length > 14) {
                bruto = bruto.slice(0, 14);
            }
            campoUnico.value = controleMascara.checked ? aplicarMascaraLocal(bruto) : bruto;
            this.atualizarEstadoBotaoValidarUnico();
        };
        campoUnico.addEventListener("input", atualizarEntrada);
        campoUnico.addEventListener("paste", (e) => {
            e.preventDefault();
            const texto = (e.clipboardData?.getData("text") ?? "").trim();
            campoUnico.value = texto;
            atualizarEntrada();
        });
        controleMascara.addEventListener("change", atualizarEntrada);
    }
    /**
     * @summary Habilita/desabilita o botão "Validar CNPJ" conforme o total de 14 caracteres.
     */
    atualizarEstadoBotaoValidarUnico() {
        const { campoUnico, botaoValidarUnico } = this.elementos;
        const puro = normalizarPuro(campoUnico.value);
        const habilitar = puro.length >= 14;
        botaoValidarUnico.disabled = !habilitar;
        botaoValidarUnico.classList.toggle("opacity-60", !habilitar);
        botaoValidarUnico.classList.toggle("cursor-not-allowed", !habilitar);
        botaoValidarUnico.title = habilitar
            ? "Validar CNPJ"
            : "Informe ao menos 14 digitos para validar";
    }
    /**
     * @summary Habilita/desabilita o botão de validação em massa conforme a lista.
     */
    atualizarEstadoBotaoValidarMassa(totalItens) {
        const { botaoValidarMassa } = this.elementos;
        if (!botaoValidarMassa)
            return;
        const habilitar = totalItens > 0;
        botaoValidarMassa.disabled = !habilitar;
        botaoValidarMassa.classList.toggle("opacity-60", !habilitar);
        botaoValidarMassa.classList.toggle("cursor-not-allowed", !habilitar);
        botaoValidarMassa.title = habilitar
            ? "Validar CNPJs em Massa"
            : "adicione ao menos 1 CNPJ para validar em massa";
    }
    // evita loops de reentrada quando reatribuímos .value
    formatando = { unico: false, massa: false };
    // normalização e formatação reutilizadas via utilitários em src/formatacao-cnpj.ts
    /**
     * @summary Configura o campo de validação em massa, formatando e limitando itens.
     */
    configurarEntradaCNPJMassa() {
        const { campoMassa, controleMascara } = this.elementos;
        const LIMITE = 100;
        const formatarLista = (texto, manterSeparadorFinal) => {
            // normaliza os separadores para vírgula, mas mantemos se há um no final
            const partesBrutas = texto.split(/[;,]/);
            const formatadas = [];
            const vistos = new Set();
            for (const parte of partesBrutas) {
                const p = parte.trim();
                if (!p)
                    continue;
                const puroParte = normalizarPuro(p);
                const f = controleMascara.checked ? aplicarMascaraProgressiva(puroParte) : puroParte;
                const chave = puroParte;
                if (chave && !vistos.has(chave)) {
                    vistos.add(chave);
                    formatadas.push(f);
                    if (formatadas.length >= LIMITE)
                        break;
                }
            }
            let saida = formatadas.join(", ");
            if (manterSeparadorFinal && formatadas.length < LIMITE) {
                if (saida.length > 0)
                    saida += ", ";
            }
            else {
                saida = saida.replace(/[,\s]+$/, "");
            }
            return saida;
        };
        const reformatar = (textoOrig) => {
            if (this.formatando.massa)
                return;
            this.formatando.massa = true;
            const temDelimitadorFinal = /[;,]\s*$/.test(textoOrig) || /\n\s*$/.test(textoOrig);
            const novo = formatarLista(textoOrig, temDelimitadorFinal);
            if (novo.length > 0 && novo !== campoMassa.value) {
                campoMassa.value = novo;
            }
            else if (novo.length === 0 && campoMassa.value !== "") {
                campoMassa.value = "";
            }
            const total = novo.split(",").map(s => s.trim()).filter(Boolean).length;
            if (total >= LIMITE && /[;,]|\n/.test(textoOrig)) {
                exibirAviso(this.elementos.areaAviso, `Limite de ${LIMITE} CNPJs atingido. Os extras foram ignorados.`, TipoAviso.Info);
            }
            this.atualizarEstadoBotaoValidarMassa(total);
            this.formatando.massa = false;
        };
        campoMassa.addEventListener("input", () => {
            const v = campoMassa.value;
            const terminouItem = /[;,]|\n/.test(v.slice(-1));
            if (terminouItem)
                reformatar(v);
        });
        campoMassa.addEventListener("paste", (e) => {
            e.preventDefault();
            const texto = (e.clipboardData?.getData("text") ?? "").trim();
            reformatar(texto);
        });
        controleMascara.addEventListener("change", () => reformatar(campoMassa.value));
    }
    /**
     * @summary Converte um caractere numérico em valor (usado como fallback legado).
     */
    converterCaractere(caractere) {
        const codigo = caractere.charCodeAt(0);
        return codigo - 48;
    }
    /**
     * @summary Calcula DV com módulo 11 (fallback legado usado internamente).
     */
    calcularDigito(valores, pesos) {
        const soma = valores.reduce((acumulado, valorAtual, indice) => acumulado + valorAtual * (pesos[indice] ?? 0), 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
    /**
     * @summary Exibe aviso utilizando as classes locais (compatibilidade legada).
     */
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
    /**
     * @summary Define o placeholder do campo único conforme o estado da máscara.
     */
    configurarPlaceholderMascara() {
        const { controleMascara, campoUnico } = this.elementos;
        campoUnico.placeholder = controleMascara.checked
            ? "00.ABC.000/ABCD-00"
            : "00ABC000ABCD00";
        controleMascara.addEventListener("change", () => {
            campoUnico.placeholder = controleMascara.checked
                ? "00.ABC.000/ABCD-00"
                : "00ABC000ABCD00";
        });
    }
    /**
     * @summary Anima a altura dos cards ao alternar entre os modos de validação.
     */
    animarAlturaSincronizada(mutarDOM, duracaoMs = 400) {
        const cardValidacao = document.getElementById("card-validacao");
        const painelValidacao = document.getElementById("painel-validacao");
        const toggleMassa = document.getElementById("toggle-massa");
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
                // limpa transições após o fim
                cardValidacao.style.transition = "";
                painelValidacao.style.transition = "";
                cardValidacao.style.overflow = "";
                painelValidacao.style.overflow = "";
                if (toggleMassa && !toggleMassa.checked) {
                    // 🔹 quando desativa o modo massa, volta pro tamanho dinâmico (auto)
                    cardValidacao.style.height = "";
                    painelValidacao.style.height = "";
                }
                else {
                    // 🔹 mantém o tamanho fixo enquanto o modo massa estiver ativo
                    cardValidacao.style.height = `${endA}px`;
                    painelValidacao.style.height = `${endA}px`;
                }
            };
            cardValidacao.addEventListener("transitionend", limparDepois, { once: true });
        });
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
    };
    void new ValidadorCnpj(elementos);
});
