"use strict";
/* ============================
   Gerador CNPJ Alfanumérico 2026
   - Corpo: 12 chars [0-9A-Z]
   - DVs: módulo 11 (sempre numéricos)
   - Máscara visual: ##.###.###/####-##
   - Auto-regeneração: 10s + barra de progresso
============================ */
const CARACTERES_PERMITIDOS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const TAMANHO_CORPO = 12;
const TAMANHO_TOTAL = 14;
const INTERVALO_AUTO_MS = 10000;
const TICK_ATUALIZACAO_MS = 100;
const DURACAO_TOAST_MS = 2500;
let valorAtual = null;
let idTimeoutToast;
let idIntervalTimer;
let inicioContagem = 0;
// Elements
const campoResultado = document.getElementById("campo-resultado");
const botaoGerar = document.getElementById("botao-gerar");
const botaoCopiar = document.getElementById("botao-copiar");
const toast = document.getElementById("toast");
const tempoRestanteEl = document.getElementById("tempo-restante");
const barraEl = document.getElementById("barra");
const toggleMascara = document.getElementById("toggle-mascara");
/** Gera corpo (12 chars [0-9A-Z]) */
function gerarCorpo() {
    let s = "";
    for (let i = 0; i < TAMANHO_CORPO; i++) {
        const idx = Math.floor(Math.random() * CARACTERES_PERMITIDOS.length);
        s += CARACTERES_PERMITIDOS[idx];
    }
    return s;
}
/** Converte caractere para valor de cálculo (ASCII - 48)
 * '0'..'9' -> 0..9
 * 'A'..'Z' -> 17..42
 */
function valorParaCalculo(c) {
    const code = c.toUpperCase().charCodeAt(0);
    // 0-9 -> 48..57  |  A-Z -> 65..90
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90)) {
        return code - 48;
    }
    throw new Error(`Caractere inválido para CNPJ alfanumérico: ${c}`);
}
/** Sequência repetida */
function sequenciaRepetida(s) {
    return s.length > 0 && s.split("").every((ch) => ch === s[0]);
}
/** Cálculo oficial de DV (módulo 11, sempre numérico) */
/** Cálculo oficial do DV (módulo 11, sempre 0–9) */
function calcDVNumerico(valores, pesos) {
    const soma = valores.reduce((acc, v, i) => acc + v * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}
/** Gera identificador válido (12 + DV1 + DV2) */
function gerarIdentificador() {
    for (let tent = 0; tent < 2000; tent++) {
        const corpo = gerarCorpo();
        if (sequenciaRepetida(corpo))
            continue;
        // MAPEAMENTO CORRETO: ASCII - 48
        const valores = Array.from(corpo).map(valorParaCalculo);
        const dv1 = calcDVNumerico(valores, PESOS_DV1); // 0–9
        const dv2 = calcDVNumerico([...valores, dv1], PESOS_DV2); // 0–9
        const completo = `${corpo}${dv1}${dv2}`;
        if (completo.length !== TAMANHO_TOTAL)
            continue;
        if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(completo))
            continue;
        if (sequenciaRepetida(completo))
            continue;
        return { puro: completo, mascarado: toMasked(completo) };
    }
    throw new Error("Não foi possível gerar um identificador válido.");
}
/** Máscara visual ##.###.###/####-## */
function toMasked(valor) {
    var _a;
    const mask = "##.###.###/####-##";
    let i = 0;
    let out = "";
    for (const m of mask) {
        if (m === "#")
            out += (_a = valor[i++]) !== null && _a !== void 0 ? _a : "";
        else
            out += m;
    }
    return out;
}
/** Toast */
function showToast(msg, tipo = "ok") {
    toast.textContent = msg;
    toast.classList.remove("erro", "visivel");
    if (tipo === "erro")
        toast.classList.add("erro");
    requestAnimationFrame(() => toast.classList.add("visivel"));
    if (idTimeoutToast !== undefined)
        clearTimeout(idTimeoutToast);
    idTimeoutToast = window.setTimeout(() => toast.classList.remove("visivel"), DURACAO_TOAST_MS);
}
/** Copiar */
async function copiar(valor) {
    await navigator.clipboard.writeText(valor);
}
/** Atualiza campo com ou sem máscara */
function atualizarCampo() {
    if (!valorAtual || !campoResultado)
        return;
    campoResultado.value = (toggleMascara === null || toggleMascara === void 0 ? void 0 : toggleMascara.checked)
        ? toMasked(valorAtual)
        : valorAtual;
}
toggleMascara === null || toggleMascara === void 0 ? void 0 : toggleMascara.addEventListener("change", atualizarCampo);
/** Gera e exibe */
function gerarEExibir(manual = false) {
    const { puro, mascarado } = gerarIdentificador();
    valorAtual = puro;
    campoResultado.value = (toggleMascara === null || toggleMascara === void 0 ? void 0 : toggleMascara.checked) ? mascarado : puro;
    if (manual)
        showToast("Novo CNPJ alfanumérico gerado.");
    inicioContagem = performance.now();
    atualizarTimer();
    if (idIntervalTimer !== undefined)
        clearInterval(idIntervalTimer);
    idIntervalTimer = window.setInterval(atualizarTimer, TICK_ATUALIZACAO_MS);
}
/** Timer */
function atualizarTimer() {
    const decorrido = performance.now() - inicioContagem;
    let restante = INTERVALO_AUTO_MS - decorrido;
    if (restante <= 0)
        return gerarEExibir(false);
    tempoRestanteEl.textContent = `Novo em ${(restante / 1000).toFixed(1)}s`;
    const frac = Math.max(0, Math.min(1, 1 - decorrido / INTERVALO_AUTO_MS));
    barraEl.style.transform = `scaleX(${frac})`;
}
/** Eventos */
botaoGerar.addEventListener("click", () => {
    try {
        gerarEExibir(true);
    }
    catch (e) {
        valorAtual = null;
        campoResultado.value = "";
        showToast("Erro inesperado ao gerar.", "erro");
    }
});
botaoCopiar.addEventListener("click", async () => {
    if (!valorAtual)
        return showToast("Nenhum CNPJ gerado para copiar.", "erro");
    try {
        // Se a máscara estiver ativada, copia mascarado
        const valorParaCopiar = (toggleMascara === null || toggleMascara === void 0 ? void 0 : toggleMascara.checked)
            ? toMasked(valorAtual)
            : valorAtual;
        await copiar(valorParaCopiar);
        showToast(`CNPJ copiado: ${valorParaCopiar}`);
    }
    catch (_a) {
        showToast("Falha ao copiar.", "erro");
    }
});
/** Boot */
gerarEExibir(false);
