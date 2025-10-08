import {
    ClasseAviso,
    IntervaloTemporizador,
    TipoAviso,
} from "./enums.js";
import {
    CLASSES_AVISO_OCULTO,
    CLASSES_AVISO_VISIVEL,
    MAPA_CLASSES_TIPO_AVISO,
    PESOS_DIGITOS,
} from "./constantes.js";
import { htmlCookies, inicializarAvisoDeCookies } from "./cookies.js";

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
}

interface ResultadoValidacao {
    puro: string;
    valido: boolean;
}

class ValidadorCnpj {
    private readonly historico: ResultadoValidacao[] = [];
    private readonly limiteHistorico = 100;
    private timeoutAviso?: number;

    public constructor(private readonly elementos: ElementosValidador) {
        this.configurarEventos();
        this.configurarPlaceholderMascara();
        this.configurarEntradaCnpj();
        this.configurarEntradaCNPJMassa()
        this.alternarModoMassa(false);
    }

    private configurarEventos(): void {
        const {
            botaoValidarUnico,
            botaoValidarMassa,
            controleMascara,
            controleMassa,
            botaoColar,
        } = this.elementos;

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

    private alternarModoMassa(ativo: boolean): void {
        const {
            campoUnico,
            campoMassa,
            botaoValidarUnico,
            botaoValidarMassa,
            botaoColar,
        } = this.elementos;

        campoUnico.classList.toggle("hidden", ativo);
        campoMassa.classList.toggle("hidden", !ativo);
        botaoValidarUnico.classList.toggle("hidden", ativo);
        botaoValidarMassa.classList.toggle("hidden", !ativo);
        botaoColar.classList.toggle("hidden", ativo);

        if (ativo) {
            campoMassa.value = "";
            campoMassa.focus();
        } else {
            campoUnico.focus();
        }
    }

    private async colarDoClipboard(): Promise<void> {
        try {
            const texto = await navigator.clipboard.readText();
            if (!texto) {
                this.exibirAviso("Nenhum conteúdo disponível para colar", TipoAviso.Erro);
                return;
            }
            this.elementos.campoUnico.value = texto.trim();
            this.exibirAviso("Conteúdo colado", TipoAviso.Info);
        } catch {
            this.exibirAviso("Não foi possível acessar a área de transferência", TipoAviso.Erro);
        }
    }

    private validarUnico(): void {
        const valor = this.elementos.campoUnico.value.trim();
        if (!valor) {
            this.exibirAviso("Informe um CNPJ para validar", TipoAviso.Erro);
            return;
        }

        const resultado = this.validarCnpj(valor);
        this.adicionarAoHistorico(resultado);
        this.renderizarHistorico();

        if (resultado.valido) {
            this.exibirAviso("CNPJ válido", TipoAviso.Sucesso);
        } else {
            this.exibirAviso("CNPJ inválido", TipoAviso.Erro);
        }
    }

    private validarEmMassa(): void {
        const valor = this.elementos.campoMassa.value.trim();
        if (!valor) {
            this.exibirAviso("Informe ao menos um CNPJ para validar", TipoAviso.Erro);
            return;
        }

        const entradas = valor
            .split(/[;,]/)
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
            } else {
                invalidos++;
            }
            this.adicionarAoHistorico(resultado);
        });

        this.renderizarHistorico();

        if (invalidos === 0 && validos > 0) {
            this.exibirAviso("CNPJ válido", TipoAviso.Sucesso);
        } else {
            this.exibirAviso("CNPJ inválido", TipoAviso.Erro);
        }
    }

    private adicionarAoHistorico(resultado: ResultadoValidacao): void {
        this.historico.unshift(resultado);
        if (this.historico.length > this.limiteHistorico) {
            this.historico.length = this.limiteHistorico;
        }
    }

    private renderizarHistorico(): void {
        const { listaHistorico, controleMascara } = this.elementos;
        listaHistorico.innerHTML = "";

        const aplicarMascara = controleMascara.checked;

        this.historico.forEach((item) => {
            const elemento = document.createElement("li");
            elemento.className =
                "flex items-center justify-between gap-3 rounded-xl bg-zinc-50/60 dark:bg-slate-900 px-3 py-2";

            const texto = document.createElement("span");
            texto.className = "text-sm font-semibold text-slate-600 dark:text-zinc-50 break-words";
            texto.textContent = this.formatarParaExibicao(item.puro, aplicarMascara);

            const status = document.createElement("span");
            status.className = "ml-1 inline-flex items-center justify-center rounded text-violet-500 transition-all dark:text-violet-500 dark:hover:text-violet-600 ease-in-out hover:text-violet-600 hover:scale-110 px-2 py-1 text-xs"
            status.setAttribute("title", "Copiar esse CNPJ");
            status.innerHTML = `
                <span
                    class="inline-block w-2 h-2 rounded-full border
                        ${item.valido
                                    ? 'bg-emerald-400 border-emerald-500 ring-2 ring-emerald-400/40'
                                    : 'bg-red-400 border-red-500 ring-2 ring-red-400/40'}
                        shadow-sm shadow-current transition-all duration-300"
                    title="${item.valido ? 'CNPJ válido' : 'CNPJ inválido'}">
                </span>
                `;

            elemento.append(texto, status);
            listaHistorico.appendChild(elemento);
        });

        listaHistorico.scrollTop = 0;
    }

    private formatarParaExibicao(cnpj: string, aplicarMascara: boolean): string {
        if (!aplicarMascara || cnpj.length !== 14) {
            return cnpj;
        }

        return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
    }

    private validarCnpj(entrada: string): ResultadoValidacao {
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

    private configurarEntradaCnpj(): void {
        const { campoUnico, controleMascara } = this.elementos;

        const aplicarMascara = (valor: string): string => {
            const puro = valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
            if (puro.length <= 2) return puro;
            if (puro.length <= 5) return `${puro.slice(0, 2)}.${puro.slice(2)}`;
            if (puro.length <= 8) return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5)}`;
            if (puro.length <= 12)
                return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8)}`;
            return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8, 12)}-${puro.slice(12, 14)}`;
        };

        const removerMascara = (valor: string): string => {
            return valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
        };

        const atualizarEntrada = (): void => {
            const bruto = campoUnico.value;
            const formatado = controleMascara.checked
                ? aplicarMascara(bruto)
                : removerMascara(bruto);
            campoUnico.value = formatado;
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

    // evita loops de reentrada quando reatribuímos .value
    private formatando = { unico: false, massa: false };

    private normalizarPuro(valor: string): string {
        // remove tudo que não é [0-9A-Z] e sobe pra maiúscula
        return valor.replace(/[^0-9A-Z]/gi, "").toUpperCase();
    }

    // máscara progressiva: idem do input, mas usando sempre o "puro"
    private aplicarMascaraProgressiva(puro: string): string {
        if (puro.length <= 2) return puro;
        if (puro.length <= 5) return `${puro.slice(0, 2)}.${puro.slice(2)}`;
        if (puro.length <= 8) return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5)}`;
        if (puro.length <= 12) return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8)}`;
        return `${puro.slice(0, 2)}.${puro.slice(2, 5)}.${puro.slice(5, 8)}/${puro.slice(8, 12)}-${puro.slice(12, 14)}`;
    }

    // formata um valor qualquer (digitado ou colado) conforme o switch
    private formatarSegundoToggle(valor: string, aplicarMascara: boolean): string {
        const puro = this.normalizarPuro(valor);
        return aplicarMascara ? this.aplicarMascaraProgressiva(puro) : puro;
    }

    private configurarEntradaCNPJMassa(): void {
        const { campoMassa, controleMascara } = this.elementos;
        const LIMITE = 100;

        const formatarLista = (texto: string, manterSeparadorFinal: boolean): string => {
            // normaliza os separadores para vírgula, mas mantemos se há um no final
            const partesBrutas = texto.split(/[;,]/);
            const formatadas: string[] = [];
            const vistos = new Set<string>();

            for (const parte of partesBrutas) {
                const p = parte.trim();
                if (!p) continue;

                const f = this.formatarSegundoToggle(p, controleMascara.checked);
                // usamos o "puro" como chave de unicidade
                const chave = this.normalizarPuro(p);
                if (chave && !vistos.has(chave)) {
                    vistos.add(chave);
                    formatadas.push(f);
                    if (formatadas.length >= LIMITE) break;
                }
            }

            let saida = formatadas.join(", ");
            if (manterSeparadorFinal && formatadas.length < LIMITE) {
                // deixa pronto para o próximo CNPJ
                if (saida.length > 0) saida += ", ";
            } else {
                // remove vírgulas sobrando no fim
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
            if (terminouItem) reformatar(v);
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

    private converterCaractere(caractere: string): number {
        const codigo = caractere.charCodeAt(0);
        return codigo - 48;
    }

    private calcularDigito(valores: number[], pesos: number[]): number {
        const soma = valores.reduce((acumulado, valorAtual, indice) => acumulado + valorAtual * (pesos[indice] ?? 0), 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

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

    private configurarPlaceholderMascara(): void {
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
    };

    void new ValidadorCnpj(elementos);
});

export { };
