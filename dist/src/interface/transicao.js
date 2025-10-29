"use strict";
/**
 * Fade-in simples, confiável e sem overlay:
 * - Esconde o body antes do primeiro paint;
 * - Espera o window.load + tempo mínimo;
 * - Faz 1 único fade-in (sem escala) e remove o guardião.
 * Carregue este arquivo no <head> com "defer".
 */
const TEMPO_MINIMO_MS = 1000; // ajuste se quiser mais/menos
const DURACAO_FADE_MS = 450; // suavidade do fade-in
function injetaPrePaint() {
    if (document.getElementById("prepaint-guard"))
        return;
    const st = document.createElement("style");
    st.id = "prepaint-guard";
    st.textContent = `
    body { opacity: 0 !important; }
  `;
    document.head.appendChild(st);
}
function esperar(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function quandoJanelaCarregar() {
    if (document.readyState === "complete")
        return Promise.resolve();
    return new Promise((r) => window.addEventListener("load", () => r(), { once: true }));
}
async function iniciarFadeIn() {
    injetaPrePaint();
    await Promise.all([quandoJanelaCarregar(), esperar(TEMPO_MINIMO_MS)]);
    const prepaint = document.getElementById("prepaint-guard");
    document.body.style.transition = `opacity ${DURACAO_FADE_MS}ms ease`;
    requestAnimationFrame(() => {
        if (prepaint)
            prepaint.remove();
        document.body.style.opacity = "1";
    });
}
window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        const prepaint = document.getElementById("prepaint-guard");
        if (prepaint)
            prepaint.remove();
        document.body.style.transition = "none";
        document.body.style.opacity = "1";
        requestAnimationFrame(() => {
            document.body.style.transition = `opacity ${DURACAO_FADE_MS}ms ease`;
        });
    }
});
iniciarFadeIn().catch(() => {
    const prepaint = document.getElementById("prepaint-guard");
    if (prepaint)
        prepaint.remove();
    document.body.style.opacity = "1";
});
//# sourceMappingURL=transicao.js.map