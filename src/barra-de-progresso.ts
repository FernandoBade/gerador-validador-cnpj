/* ============================
   Contador Regressivo Reutilizável
   - Exibe tempo restante em texto e barra
   - Dispara callback ao finalizar
============================ */

import { IntervaloTemporizador } from "./enums.js";

/**
 * @summary Configuração para o contador regressivo.
 */
export interface ConfiguracaoContador {
    texto: HTMLElement;
    barra: HTMLElement;
    duracaoMs?: number;
    onFinalizar?: () => void;
    formato?: (msRestantes: number) => string;
}

/**
 * @summary Exibe e controla um contador regressivo com barra e texto.
 */
export class ContadorRegressivo {
    private inicio = 0;
    private intervalo?: number;
    private readonly duracao: number;

    public constructor(private readonly cfg: ConfiguracaoContador) {
        this.duracao = cfg.duracaoMs ?? IntervaloTemporizador.GeracaoAutomatica;
    }

    /**
     * @summary Inicia o contador e atualiza imediatamente.
     */
    public iniciar(): void {
        this.inicio = performance.now();
        this.atualizar();
        this.parar();
        this.intervalo = window.setInterval(() => this.atualizar(), IntervaloTemporizador.Atualizacao);
    }

    /**
     * @summary Interrompe o contador, se ativo.
     */
    public parar(): void {
        if (this.intervalo !== undefined) {
            window.clearInterval(this.intervalo);
            this.intervalo = undefined;
        }
    }

    /**
     * @summary Atualiza o texto e a barra conforme o tempo restante.
     */
    private atualizar(): void {
        const decorrido = performance.now() - this.inicio;
        const restante = this.duracao - decorrido;
        if (restante <= 0) {
            this.cfg.texto.textContent = this.formatar(0);
            this.cfg.barra.style.transform = "scaleX(0)";
            this.parar();
            this.cfg.onFinalizar?.();
            this.iniciar();
            return;
        }

        this.cfg.texto.textContent = this.formatar(restante);
        const frac = Math.max(0, Math.min(1, 1 - decorrido / this.duracao));
        this.cfg.barra.style.transform = `scaleX(${frac})`;
        this.cfg.barra.style.background = "linear-gradient(to left, #bd93f9, #8b5cf6)";
    }

    private formatar(ms: number): string {
        if (this.cfg.formato) return this.cfg.formato(ms);
        return `Novo em ${(ms / 1000).toFixed(1)}s`;
    }
}

export { };

