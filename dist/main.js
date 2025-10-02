"use strict";
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
const INTERVALO_AUTOMATICO_MS = 10000;
const INTERVALO_ATUALIZACAO_MS = 100;
const DURACAO_AVISO_MS = 2500;
let cnpjAtual = null;
let idTimeoutAviso;
let idIntervaloRegressivo;
let inicioContagemRegressiva = 0;
// Elementos da interface
const campoResultado = document.getElementById("campo-resultado");
const botaoGerar = document.getElementById("botao-gerar");
const botaoCopiar = document.getElementById("botao-copiar");
const areaAviso = document.getElementById("toast");
const textoTempoRestante = document.getElementById("tempo-restante");
const barraProgresso = document.getElementById("barra");
const controleMascara = document.getElementById("toggle-mascara");
const CLASSES_AVISO_OCULTO = ["opacity-0", "translate-y-5"];
const CLASSES_AVISO_VISIVEL = ["opacity-100", "translate-y-0"];
const CLASSE_AVISO_SUCESSO = ["bg-emerald-600", "text-white"];
const CLASSE_AVISO_ERRO = ["bg-red-600", "text-white"];
const CLASSE_AVISO_INFO = ["bg-blue-600", "text-white"];
/**
 * Gera uma sequência base (12 caracteres) composta por dígitos e letras maiúsculas.
 */
function gerarCorpoAlfanumerico() {
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
function converterCaractereParaValor(caractere) {
    const codigo = caractere.toUpperCase().charCodeAt(0);
    if ((codigo >= 48 && codigo <= 57) || (codigo >= 65 && codigo <= 90)) {
        return codigo - 48;
    }
    throw new Error(`Caractere inválido para CNPJ alfanumérico: ${caractere}`);
}
/**
 * Verifica se todos os caracteres da sequência são iguais, algo proibido pela regra.
 */
function verificarSequenciaRepetida(valor) {
    return valor.length > 0 && valor.split("").every((caractere) => caractere === valor[0]);
}
/**
 * Calcula um dígito verificador numérico usando o módulo 11 com pesos específicos.
 */
function calcularDigitoVerificador(valores, pesos) {
    const soma = valores.reduce((acumulado, valorAtual, indice) => acumulado + valorAtual * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}
/**
 * Aplica a máscara visual ##.###.###/####-## ao CNPJ informado.
 */
function aplicarMascara(valor) {
    var _a;
    const mascara = "##.###.###/####-##";
    let resultado = "";
    let indiceValor = 0;
    for (const caractereMascara of mascara) {
        if (caractereMascara === "#") {
            resultado += (_a = valor[indiceValor++]) !== null && _a !== void 0 ? _a : "";
        }
        else {
            resultado += caractereMascara;
        }
    }
    return resultado;
}
/**
 * Gera um identificador válido (12 caracteres base 36 + 2 dígitos verificadores numéricos).
 */
function gerarIdentificadorValido() {
    for (let tentativa = 0; tentativa < 2000; tentativa++) {
        const corpo = gerarCorpoAlfanumerico();
        if (verificarSequenciaRepetida(corpo))
            continue;
        const valores = Array.from(corpo).map(converterCaractereParaValor);
        const digitoUm = calcularDigitoVerificador(valores, PESOS_DIGITO_UM);
        const digitoDois = calcularDigitoVerificador([...valores, digitoUm], PESOS_DIGITO_DOIS);
        const identificadorCompleto = `${corpo}${digitoUm}${digitoDois}`;
        if (identificadorCompleto.length !== TAMANHO_TOTAL)
            continue;
        if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(identificadorCompleto))
            continue;
        if (verificarSequenciaRepetida(identificadorCompleto))
            continue;
        return {
            puro: identificadorCompleto,
            mascarado: aplicarMascara(identificadorCompleto),
        };
    }
    throw new Error("Não foi possível gerar um identificador válido.");
}
/**
 * Exibe um aviso temporário para o usuário,
 * aplicando estilos conforme o tipo (sucesso, info, erro).
 */
/**
 * Exibe um aviso temporário para o usuário,
 * aplicando estilos conforme o tipo (sucesso, info, erro).
 */
function exibirAviso(mensagem, tipo = "sucesso") {
    areaAviso.textContent = mensagem;
    // Mapa de cores por tipo
    const estilos = {
        sucesso: "bg-emerald-600 text-white",
        info: "bg-blue-600 text-white",
        erro: "bg-red-600 text-white",
    };
    // Remove todas as classes anteriores e aplica só as do tipo escolhido
    areaAviso.className =
        "fixed bottom-4 right-4 min-w-[240px] max-w-[calc(100%-2rem)] rounded-lg px-4 py-3 text-sm shadow-2xl transition-all duration-200 ease-out " +
            estilos[tipo] +
            " " +
            CLASSES_AVISO_OCULTO.join(" ") +
            " pointer-events-none";
    // Mostra o aviso
    requestAnimationFrame(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_OCULTO, "pointer-events-none");
        areaAviso.classList.add(...CLASSES_AVISO_VISIVEL, "pointer-events-auto");
    });
    // Timeout para esconder
    clearTimeout(idTimeoutAviso);
    idTimeoutAviso = window.setTimeout(() => {
        areaAviso.classList.remove(...CLASSES_AVISO_VISIVEL, "pointer-events-auto");
        areaAviso.classList.add(...CLASSES_AVISO_OCULTO, "pointer-events-none");
    }, DURACAO_AVISO_MS);
}
/**
 * Copia o valor informado para a área de transferência do sistema.
 */
async function copiarTexto(valor) {
    await navigator.clipboard.writeText(valor);
}
/**
 * Atualiza o campo de resultado aplicando ou removendo a máscara conforme a preferência do usuário.
 */
function atualizarCampoResultado() {
    if (!cnpjAtual)
        return;
    campoResultado.value = (controleMascara === null || controleMascara === void 0 ? void 0 : controleMascara.checked) ? aplicarMascara(cnpjAtual) : cnpjAtual;
}
controleMascara === null || controleMascara === void 0 ? void 0 : controleMascara.addEventListener("change", atualizarCampoResultado);
/**
 * Gera um novo identificador, exibe o resultado e reinicia a contagem regressiva automática.
 */
function gerarEExibirIdentificador(disparoManual = false) {
    const { puro, mascarado } = gerarIdentificadorValido();
    cnpjAtual = puro;
    campoResultado.value = (controleMascara === null || controleMascara === void 0 ? void 0 : controleMascara.checked) ? mascarado : puro;
    adicionarAoHistorico(puro);
    if (disparoManual) {
        exibirAviso("Novo CNPJ alfanumérico gerado", "sucesso");
    }
    inicioContagemRegressiva = performance.now();
    atualizarContagemRegressiva();
    if (idIntervaloRegressivo !== undefined)
        window.clearInterval(idIntervaloRegressivo);
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
    // Atualiza texto
    textoTempoRestante.textContent = `Novo em ${(tempoRestante / 1000).toFixed(1)}s`;
    // Calcula a fração de tempo (0 a 1)
    const fracaoRestante = Math.max(0, Math.min(1, 1 - tempoDecorrido / INTERVALO_AUTOMATICO_MS));
    barraProgresso.style.transform = `scaleX(${fracaoRestante})`;
    // Gradiente simples: azul claro → azul escuro
    barraProgresso.style.background = "linear-gradient(to left, #60a5fa, #2563eb)";
}
// Eventos principais
botaoGerar.addEventListener("click", () => {
    try {
        gerarEExibirIdentificador(true);
    }
    catch (erro) {
        cnpjAtual = null;
        campoResultado.value = "";
        console.error(erro);
        exibirAviso("Erro inesperado ao gerar.", "erro");
    }
});
botaoCopiar.addEventListener("click", async () => {
    if (!cnpjAtual) {
        exibirAviso("Nenhum CNPJ gerado para copiar", "erro");
        return;
    }
    try {
        const valorParaCopiar = (controleMascara === null || controleMascara === void 0 ? void 0 : controleMascara.checked) ? aplicarMascara(cnpjAtual) : cnpjAtual;
        await copiarTexto(valorParaCopiar);
        exibirAviso(`CNPJ copiado: ${valorParaCopiar}`, "info");
    }
    catch (erro) {
        console.error(erro);
        exibirAviso("Falha ao copiar", "erro");
    }
});
/* ---------- estado do histórico ---------- */
const LIMITE_HISTORICO = 999;
let historicoRecentes = [];
/* elementos do painel */
const listaRecentesEl = document.getElementById("lista-recentes");
const botaoCopiarTodosEl = document.getElementById("botao-copiar-todos");
function inicializarHistorico() {
    historicoRecentes = [];
    atualizarVisualHistorico();
}
/**
 * Adiciona ao histórico o novo CNPJ (no topo), respeitando o limite de itens
 */
function adicionarAoHistorico(novo) {
    // evita duplicatas sequenciais idênticas (opcional)
    if (historicoRecentes[0] === novo)
        return;
    historicoRecentes.unshift(novo);
    if (historicoRecentes.length > LIMITE_HISTORICO)
        historicoRecentes.pop();
    atualizarVisualHistorico();
}
/**
 * Atualiza a lista DOM com todos os itens do histórico.
 * Cada item tem um botão pequeno de copiar individual.
 */
function atualizarVisualHistorico() {
    if (!listaRecentesEl) {
        atualizarEstadoBotaoCopiarTodos();
        return;
    }
    listaRecentesEl.innerHTML = "";
    historicoRecentes.forEach((puro) => {
        const texto = (controleMascara === null || controleMascara === void 0 ? void 0 : controleMascara.checked) ? aplicarMascara(puro) : puro;
        const li = document.createElement("li");
        li.className = "flex items-center justify-between gap-2";
        const span = document.createElement("span");
        span.className = "text-sm text-slate-700 break-words";
        span.textContent = texto;
        const btn = document.createElement("button");
        btn.className = "ml-1 inline-flex items-center justify-center rounded bg-white text-blue-600 transition hover:ring-2 hover:ring-blue-400 px-2 py-1 text-xs";
        btn.setAttribute("title", "Copiar esse CNPJ");
        btn.innerHTML = `
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12z"/>
                <path d="M20 5H8a2 2 0 0 0-2 2v16h12a2 2 0 0 0 2-2V5zm-2 16H8V7h10z"/>
            </svg>
        `;
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await copiarTexto(texto);
                exibirAviso(`CNPJ copiado: ${texto}`, "info");
            }
            catch (_a) {
                exibirAviso("Falha ao copiar", "erro");
            }
        });
        li.appendChild(span);
        li.appendChild(btn);
        listaRecentesEl.appendChild(li);
    });
    listaRecentesEl.scrollTop = 0;
    atualizarEstadoBotaoCopiarTodos();
}
/**
 * Copia todo o histórico para a área de transferência
 * - formato: separados por vírgula e espaço (ajuste se preferir newline)
 */
async function copiarTodos() {
    if (historicoRecentes.length === 0) {
        exibirAviso("Nenhum CNPJ no histórico.", "erro");
        return;
    }
    const listaParaCopiar = historicoRecentes.map((p) => ((controleMascara === null || controleMascara === void 0 ? void 0 : controleMascara.checked) ? aplicarMascara(p) : p)).join(", ");
    try {
        await copiarTexto(listaParaCopiar);
        exibirAviso(`Copiados ${historicoRecentes.length} CNPJs separados por vírgula`, "info");
    }
    catch (_a) {
        exibirAviso("Falha ao copiar todos.", "erro");
    }
}
function atualizarEstadoBotaoCopiarTodos() {
    if (!botaoCopiarTodosEl)
        return;
    const total = historicoRecentes.length;
    const totalExibido = Math.min(total, LIMITE_HISTORICO);
    const rotulo = `Copiar em massa (${totalExibido})`;
    botaoCopiarTodosEl.textContent = rotulo;
    botaoCopiarTodosEl.disabled = total === 0;
    botaoCopiarTodosEl.classList.toggle("cursor-not-allowed", total === 0);
    botaoCopiarTodosEl.classList.toggle("opacity-60", total === 0);
}
/* hooks: ligar o botão 'copiar todos' */
botaoCopiarTodosEl === null || botaoCopiarTodosEl === void 0 ? void 0 : botaoCopiarTodosEl.addEventListener("click", (e) => {
    e.preventDefault();
    copiarTodos();
});
/* Atualiza o painel quando o toggle de máscara muda */
controleMascara === null || controleMascara === void 0 ? void 0 : controleMascara.addEventListener("change", () => {
    atualizarVisualHistorico();
    // também atualiza campo principal
    atualizarCampoResultado === null || atualizarCampoResultado === void 0 ? void 0 : atualizarCampoResultado();
});
/* Sempre que gerar um novo identificador, adicionar ao histórico.
   Veja onde gerarEExibirIdentificador() define cnpjAtual: lá, logo após atribuir cnpjAtual = puro;
   chame adicionarAoHistorico(puro) nessa posição. */
// Inicialização
inicializarHistorico();
gerarEExibirIdentificador(false);
