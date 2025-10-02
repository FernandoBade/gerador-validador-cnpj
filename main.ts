/* ============================
   Gerador CNPJ Alfanumérico 2026
   - Corpo: 12 caracteres [0-9A-Z]
   - Dígitos verificadores: módulo 11 (somente numéricos)
   - Máscara visual: ##.###.###/####-##
   - Auto-regeneração: 10s + barra de progresso
============================ */

const CARACTERES_PERMITIDOS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PESOS_DIGITO_UM = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DIGITO_DOIS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const TAMANHO_CORPO = 12;
const TAMANHO_TOTAL = 14;

const INTERVALO_AUTOMATICO_MS = 10_000;
const INTERVALO_ATUALIZACAO_MS = 100;
const DURACAO_AVISO_MS = 2_500;

let cnpjAtual: string | null = null;
let idTimeoutAviso: number | undefined;
let idIntervaloRegressivo: number | undefined;
let inicioContagemRegressiva = 0;

// Elementos da interface
const campoResultado = document.getElementById("campo-resultado") as HTMLInputElement;
const botaoGerar = document.getElementById("botao-gerar") as HTMLButtonElement;
const botaoCopiar = document.getElementById("botao-copiar") as HTMLButtonElement;
const areaAviso = document.getElementById("toast") as HTMLDivElement;
const textoTempoRestante = document.getElementById("tempo-restante") as HTMLDivElement;
const barraProgresso = document.getElementById("barra") as HTMLElement;
const controleMascara = document.getElementById("toggle-mascara") as HTMLInputElement | null;

const CLASSES_AVISO_OCULTO = ["opacity-0", "translate-y-5"];
const CLASSES_AVISO_VISIVEL = ["opacity-100", "translate-y-0"];
const CLASSE_AVISO_SUCESSO = "bg-emerald-600";
const CLASSE_AVISO_ERRO = "bg-red-600";

/**
 * Gera uma sequência base (12 caracteres) composta por dígitos e letras maiúsculas.
 */
function gerarCorpoAlfanumerico(): string {
    let corpo = "";
    for (let indice = 0; indice < TAMANHO_CORPO; indice++) {
        const indiceCaractere = Math.floor(Math.random() * CARACTERES_PERMITIDOS.length);
        corpo += CARACTERES_PERMITIDOS[indiceCaractere];
    }
    return corpo;
}

/**
 * Converte um caractere alfanumérico para o valor numérico esperado pelo cálculo do módulo 11.
 */
function converterCaractereParaValor(caractere: string): number {
    const codigo = caractere.toUpperCase().charCodeAt(0);
    if ((codigo >= 48 && codigo <= 57) || (codigo >= 65 && codigo <= 90)) {
        return codigo - 48;
    }
    throw new Error(`Caractere inválido para CNPJ alfanumérico: ${caractere}`);
}

/**
 * Verifica se todos os caracteres da sequência são iguais, algo proibido pela regra.
 */
function verificarSequenciaRepetida(valor: string): boolean {
    return valor.length > 0 && valor.split("").every((caractere) => caractere === valor[0]);
}

/**
 * Calcula um dígito verificador numérico usando o módulo 11 com pesos específicos.
 */
function calcularDigitoVerificador(valores: number[], pesos: number[]): number {
    const soma = valores.reduce((acumulado, valorAtual, indice) => acumulado + valorAtual * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}

/**
 * Aplica a máscara visual ##.###.###/####-## ao CNPJ informado.
 */
function aplicarMascara(valor: string): string {
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
 * Gera um identificador válido (12 caracteres base 36 + 2 dígitos verificadores numéricos).
 */
function gerarIdentificadorValido(): { puro: string; mascarado: string } {
    for (let tentativa = 0; tentativa < 2_000; tentativa++) {
        const corpo = gerarCorpoAlfanumerico();
        if (verificarSequenciaRepetida(corpo)) continue;

        const valores = Array.from(corpo).map(converterCaractereParaValor);
        const digitoUm = calcularDigitoVerificador(valores, PESOS_DIGITO_UM);
        const digitoDois = calcularDigitoVerificador([...valores, digitoUm], PESOS_DIGITO_DOIS);

        const identificadorCompleto = `${corpo}${digitoUm}${digitoDois}`;
        if (identificadorCompleto.length !== TAMANHO_TOTAL) continue;
        if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(identificadorCompleto)) continue;
        if (verificarSequenciaRepetida(identificadorCompleto)) continue;

        return {
            puro: identificadorCompleto,
            mascarado: aplicarMascara(identificadorCompleto),
        };
    }
    throw new Error("Não foi possível gerar um identificador válido.");
}

/**
 * Exibe um aviso temporário para o usuário, aplicando estilos de sucesso ou erro conforme necessário.
 */
function exibirAviso(mensagem: string, tipo: "sucesso" | "erro" = "sucesso") {
    areaAviso.textContent = mensagem;
    areaAviso.classList.remove(CLASSE_AVISO_SUCESSO, CLASSE_AVISO_ERRO);
    areaAviso.classList.add(tipo === "erro" ? CLASSE_AVISO_ERRO : CLASSE_AVISO_SUCESSO);

    requestAnimationFrame(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_OCULTO, "pointer-events-none");
        areaAviso.classList.add(...CLASSES_AVISO_VISIVEL, "pointer-events-auto");
    });

    if (idTimeoutAviso !== undefined) window.clearTimeout(idTimeoutAviso);
    idTimeoutAviso = window.setTimeout(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_VISIVEL, "pointer-events-auto");
        areaAviso.classList.add(...CLASSES_AVISO_OCULTO, "pointer-events-none");
    }, DURACAO_AVISO_MS);
}

/**
 * Copia o valor informado para a área de transferência do sistema.
 */
async function copiarTexto(valor: string) {
    await navigator.clipboard.writeText(valor);
}

/**
 * Atualiza o campo de resultado aplicando ou removendo a máscara conforme a preferência do usuário.
 */
function atualizarCampoResultado() {
    if (!cnpjAtual) return;
    campoResultado.value = controleMascara?.checked ? aplicarMascara(cnpjAtual) : cnpjAtual;
}

controleMascara?.addEventListener("change", atualizarCampoResultado);

/**
 * Gera um novo identificador, exibe o resultado e reinicia a contagem regressiva automática.
 */
function gerarEExibirIdentificador(disparoManual = false) {
    const { puro, mascarado } = gerarIdentificadorValido();
    cnpjAtual = puro;
    campoResultado.value = controleMascara?.checked ? mascarado : puro;

    if (disparoManual) {
        exibirAviso("Novo CNPJ alfanumérico gerado.");
    }

    inicioContagemRegressiva = performance.now();
    atualizarContagemRegressiva();

    if (idIntervaloRegressivo !== undefined) window.clearInterval(idIntervaloRegressivo);
    idIntervaloRegressivo = window.setInterval(atualizarContagemRegressiva, INTERVALO_ATUALIZACAO_MS);
}

/**
 * Atualiza a interface com a contagem regressiva e o estado da barra de progresso.
 */
function atualizarContagemRegressiva() {
    const tempoDecorrido = performance.now() - inicioContagemRegressiva;
    const tempoRestante = INTERVALO_AUTOMATICO_MS - tempoDecorrido;

    if (tempoRestante <= 0) {
        gerarEExibirIdentificador(false);
        return;
    }

    textoTempoRestante.textContent = `Novo em ${(tempoRestante / 1_000).toFixed(1)}s`;
    const fracaoRestante = Math.max(0, Math.min(1, 1 - tempoDecorrido / INTERVALO_AUTOMATICO_MS));
    barraProgresso.style.transform = `scaleX(${fracaoRestante})`;
}

// Eventos principais
botaoGerar.addEventListener("click", () => {
    try {
        gerarEExibirIdentificador(true);
    } catch (erro) {
        cnpjAtual = null;
        campoResultado.value = "";
        console.error(erro);
        exibirAviso("Erro inesperado ao gerar.", "erro");
    }
});

botaoCopiar.addEventListener("click", async () => {
    if (!cnpjAtual) {
        exibirAviso("Nenhum CNPJ gerado para copiar.", "erro");
        return;
    }

    try {
        const valorParaCopiar = controleMascara?.checked ? aplicarMascara(cnpjAtual) : cnpjAtual;
        await copiarTexto(valorParaCopiar);
        exibirAviso(`CNPJ copiado: ${valorParaCopiar}`);
    } catch (erro) {
        console.error(erro);
        exibirAviso("Falha ao copiar.", "erro");
    }
});

// Inicialização
gerarEExibirIdentificador(false);
