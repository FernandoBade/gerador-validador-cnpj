import { ClasseAviso, IntervaloTemporizador, TipoAviso, } from "./enums.js";
import { CLASSES_AVISO_OCULTO, CLASSES_AVISO_VISIVEL, MAPA_CLASSES_TIPO_AVISO, PESOS_DIGITOS, } from "./constantes.js";
import { htmlCookies, inicializarAvisoDeCookies } from "./cookies.js";
class ValidadorCnpj {
    constructor(elementos) {
        this.elementos = elementos;
        this.historico = [];
        this.limiteHistorico = 100;
        // evita loops de reentrada quando reatribuímos .value
        this.formatando = { unico: false, massa: false };
        this.configurarEventos();
        this.configurarPlaceholderMascara();
        this.configurarEntradaCnpj();
        this.configurarEntradaCNPJMassa();
        this.alternarModoMassa(false);
    }
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
        });
        botaoColar.addEventListener("click", async () => {
            await this.colarDoClipboard();
        });
    }
    alternarModoMassa(ativo) {
        const { campoUnico, campoMassa, botaoValidarUnico, botaoValidarMassa, botaoColar, } = this.elementos;
        this.animarAlturaSincronizada(() => {
            // aqui fazemos as trocas visuais
            campoUnico.classList.toggle("hidden", ativo);
            campoMassa.classList.toggle("hidden", !ativo);
            botaoValidarUnico.classList.toggle("hidden", ativo);
            botaoValidarMassa.classList.toggle("hidden", !ativo);
            botaoColar.classList.toggle("hidden", ativo);
            if (ativo) {
                campoMassa.value = "";
            }
        });
        // foco depois de agendar a animação
        if (ativo) {
            campoMassa.focus();
        }
        else {
            campoUnico.focus();
        }
    }
    async colarDoClipboard() {
        try {
            const texto = await navigator.clipboard.readText();
            if (!texto) {
                this.exibirAviso("Nenhum conteúdo disponível para colar", TipoAviso.Info);
                return;
            }
            this.elementos.campoUnico.value = texto.trim();
            this.exibirAviso(`Conteúdo colado: ${texto}`, TipoAviso.InfoAlternativo);
        }
        catch {
            this.exibirAviso("Não foi possível acessar a área de transferência", TipoAviso.Erro);
        }
    }
    validarUnico() {
        const valor = this.elementos.campoUnico.value.trim();
        if (!valor) {
            this.exibirAviso("Informe um CNPJ para validar", TipoAviso.Erro);
            return;
        }
        const puro = valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
        if (puro.length < 14) {
            this.exibirAviso("Insira os 14 caracteres antes da validação", TipoAviso.Info);
            return;
        }
        const resultado = this.validarCnpj(valor);
        this.adicionarAoHistorico(resultado);
        this.renderizarHistorico();
        if (resultado.valido) {
            this.exibirAviso(`CNPJ ${valor} é válido`, TipoAviso.Sucesso);
        }
        else {
            this.exibirAviso(`CNPJ ${valor} é inválido`, TipoAviso.Erro);
        }
    }
    validarEmMassa() {
        const valor = this.elementos.campoMassa.value.trim();
        if (!valor) {
            this.exibirAviso("Informe ao menos um CNPJ para validar", TipoAviso.Info);
            return;
        }
        const entradas = valor
            .split(/[;,]/)
            .map((parte) => parte.trim())
            .filter((parte) => parte.length > 0);
        if (entradas.length === 0) {
            this.exibirAviso("Informe ao menos um CNPJ para validar", TipoAviso.Info);
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
        document.getElementById("contador-hist").textContent = String(this.historico.length);
    }
    renderizarHistorico() {
        const { listaHistorico, controleMascara } = this.elementos;
        listaHistorico.innerHTML = "";
        const aplicarMascara = controleMascara.checked;
        this.historico.forEach((item) => {
            const elemento = document.createElement("li");
            elemento.className =
                "flex items-center justify-between gap-3 rounded-md border-2 border-slate-200 dark:border-slate-900/40 dark:shadow-md px-3 py-2 hover:border-slate-300 transition-all duration-300 dark:hover:border-slate-900";
            const indicador = document.createElement("span");
            indicador.className = (item.valido
                ? 'inline-block w-2 h-2 rounded-full border bg-teal-500 border-emerald-500 ring-2 ring-teal-500/40 shadow-sm shadow-current transition-all duration-300'
                : 'inline-block w-2 h-2 rounded-full border bg-red-400 border-red-500 ring-2 ring-red-400/40 shadow-sm shadow-current transition-all duration-300');
            indicador.setAttribute("title", item.valido ? "CNPJ válido" : "CNPJ inválido");
            const texto = document.createElement("span");
            texto.className = "text-sm font-semibold text-slate-600 dark:text-zinc-50 break-words flex-1 cursor-default";
            texto.textContent = this.formatarParaExibicao(item.puro, aplicarMascara);
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
                const textoParaCopiar = aplicarMascara ? this.formatarParaExibicao(item.puro, true) : item.puro;
                try {
                    await navigator.clipboard.writeText(textoParaCopiar);
                    this.exibirAviso(`CNPJ copiado: ${textoParaCopiar}`, TipoAviso.InfoAlternativo);
                }
                catch {
                    this.exibirAviso("Falha ao copiar", TipoAviso.Erro);
                }
            });
            elemento.append(containerEsquerdo, botaoCopiar);
            listaHistorico.appendChild(elemento);
        });
        listaHistorico.scrollTop = 0;
    }
    formatarParaExibicao(cnpj, aplicarMascara) {
        if (!aplicarMascara || cnpj.length !== 14) {
            return cnpj;
        }
        return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
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
    configurarEntradaCnpj() {
        const { campoUnico, controleMascara } = this.elementos;
        const aplicarMascara = (valor) => {
            const puro = valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
            if (puro.length <= 2)
                return puro;
            if (puro.length <= 5)
                return `${puro.slice(0, 2)}.${puro.slice(2)}`;
            if (puro.length <= 8)
                return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5)}`;
            if (puro.length <= 12)
                return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8)}`;
            return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8, 12)}-${puro.slice(12, 14)}`;
        };
        const removerMascara = (valor) => {
            return valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
        };
        const atualizarEntrada = () => {
            let bruto = campoUnico.value;
            bruto = removerMascara(bruto);
            if (bruto.length > 14) {
                bruto = bruto.slice(0, 14);
            }
            if (controleMascara.checked) {
                campoUnico.value = aplicarMascara(bruto);
            }
            else {
                campoUnico.value = bruto;
            }
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
    normalizarPuro(valor) {
        // remove tudo que não é [0-9A-Z] e sobe pra maiúscula
        return valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
    }
    // máscara progressiva: idem do input, mas usando sempre o "puro"
    aplicarMascaraProgressiva(puro) {
        if (puro.length <= 2)
            return puro;
        if (puro.length <= 5)
            return `${puro.slice(0, 2)}.${puro.slice(2)}`;
        if (puro.length <= 8)
            return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5)}`;
        if (puro.length <= 12)
            return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8)}`;
        return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8, 12)}-${puro.slice(12, 14)}`;
    }
    // formata um valor qualquer (digitado ou colado) conforme o switch
    formatarSegundoToggle(valor, aplicarMascara) {
        const puro = this.normalizarPuro(valor);
        return aplicarMascara ? this.aplicarMascaraProgressiva(puro) : puro;
    }
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
                const f = this.formatarSegundoToggle(p, controleMascara.checked);
                // usamos o "puro" como chave de unicidade
                const chave = this.normalizarPuro(p);
                if (chave && !vistos.has(chave)) {
                    vistos.add(chave);
                    formatadas.push(f);
                    if (formatadas.length >= LIMITE)
                        break;
                }
            }
            let saida = formatadas.join(", ");
            if (manterSeparadorFinal && formatadas.length < LIMITE) {
                // deixa pronto para o próximo CNPJ
                if (saida.length > 0)
                    saida += ", ";
            }
            else {
                // remove vírgulas sobrando no fim
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
            // corta excedente e avisa (una vez por evento)
            const total = novo.split(",").map(s => s.trim()).filter(Boolean).length;
            if (total >= LIMITE && /[;,]|\n/.test(textoOrig)) {
                this.exibirAviso(`Limite de ${LIMITE} CNPJs atingido. Os extras foram ignorados.`, TipoAviso.Info);
            }
            this.formatando.massa = false;
        };
        // Digitação normal: não mexe a cada caractere, só quando o usuário
        // termina um item (vírgula, ponto e vírgula ou Enter)
        campoMassa.addEventListener("input", () => {
            const v = campoMassa.value;
            const terminouItem = /[;,]|\n/.test(v.slice(-1));
            if (terminouItem)
                reformatar(v);
        });
        // Colagem: formata tudo de uma vez
        campoMassa.addEventListener("paste", (e) => {
            e.preventDefault();
            const texto = (e.clipboardData?.getData("text") ?? "").trim();
            reformatar(texto);
        });
        // Alternar máscara: reprocessa o campo inteiro
        controleMascara.addEventListener("change", () => reformatar(campoMassa.value));
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
    animarAlturaSincronizada(mutarDOM, duracaoMs = 400) {
        const cardValidacao = document.getElementById("card-validacao");
        const painelValidacao = document.getElementById("painel-validacao");
        const toggleMassa = document.getElementById("toggle-massa");
        if (!cardValidacao || !painelValidacao) {
            mutarDOM();
            return;
        }
        // mede alturas antes da mudança
        const startA = cardValidacao.offsetHeight;
        const startB = painelValidacao.offsetHeight;
        const trans = `height ${duracaoMs}ms ease-in-out`;
        // aplica estilos iniciais
        cardValidacao.style.height = `${startA}px`;
        painelValidacao.style.height = `${startB}px`;
        cardValidacao.style.transition = trans;
        painelValidacao.style.transition = trans;
        cardValidacao.style.overflow = "hidden";
        painelValidacao.style.overflow = "hidden";
        // aplica a mudança no DOM (mostrar/ocultar campos)
        mutarDOM();
        requestAnimationFrame(() => {
            // mede a altura final após a mudança
            cardValidacao.style.height = "auto";
            const endA = cardValidacao.offsetHeight;
            // reinicia para a altura anterior e anima até a nova
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
