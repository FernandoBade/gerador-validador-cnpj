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
    // Se já existia de tentativas anteriores, não duplica
    if (document.getElementById('prepaint-guard'))
        return;
    const st = document.createElement('style');
    st.id = 'prepaint-guard';
    st.textContent = `
    /* Mantém o body invisível até liberarmos */
    body { opacity: 0 !important; }
  `;
    document.head.appendChild(st);
}
function esperar(ms) {
    return new Promise(r => setTimeout(r, ms));
}
function quandoJanelaCarregar() {
    if (document.readyState === 'complete')
        return Promise.resolve();
    return new Promise(r => window.addEventListener('load', () => r(), { once: true }));
}
async function iniciarFadeIn() {
    // 1) Garante que o guardião está ativo antes de qualquer pintura residual
    injetaPrePaint();
    // 2) Espera carregar tudo + tempo mínimo (tira “tremida” de layout)
    await Promise.all([quandoJanelaCarregar(), esperar(TEMPO_MINIMO_MS)]);
    // 3) Faz 1 único fade-in suave
    const prepaint = document.getElementById('prepaint-guard');
    // Define a transição do body antes de liberar a opacidade
    document.body.style.transition = `opacity ${DURACAO_FADE_MS}ms ease`;
    // Libera a opacidade na próxima frame para garantir que a transição aplique
    requestAnimationFrame(() => {
        if (prepaint)
            prepaint.remove();
        document.body.style.opacity = '1';
    });
}
// Evita refazer animação ao voltar via bfcache
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        const prepaint = document.getElementById('prepaint-guard');
        if (prepaint)
            prepaint.remove();
        document.body.style.transition = 'none';
        document.body.style.opacity = '1';
        // Reaplica a transição para próximas navegações
        requestAnimationFrame(() => {
            document.body.style.transition = `opacity ${DURACAO_FADE_MS}ms ease`;
        });
    }
});
// Inicia assim que possível (o script está com "defer")
iniciarFadeIn().catch(() => {
    // fallback duro: se algo falhar, mostra o body
    const prepaint = document.getElementById('prepaint-guard');
    if (prepaint)
        prepaint.remove();
    document.body.style.opacity = '1';
});
