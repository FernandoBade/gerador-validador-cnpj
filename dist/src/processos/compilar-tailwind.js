/**
 * Compila o Tailwind CSS a partir de `src/estilos/tailwind.css`
 * e gera `dist/assets/tailwind.min.css` usando o CLI local.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
const raiz = process.cwd();
const entrada = path.join(raiz, "src", "estilos", "tailwind.css");
const saidaDir = path.join(raiz, "dist", "assets");
const saida = path.join(saidaDir, "tailwind.min.css");
const config = path.join(raiz, "tailwind.config.js");
function construirComNode(args) {
    const cliJs = path.join(raiz, "node_modules", "tailwindcss", "lib", "cli.js");
    if (fs.existsSync(cliJs)) {
        execFileSync(process.execPath, [cliJs, ...args], { stdio: "inherit" });
        return true;
    }
    return false;
}
function compilar() {
    if (!fs.existsSync(entrada)) {
        console.error(`[compilar-tailwind] Arquivo de entrada não encontrado: ${entrada}`);
        process.exit(1);
    }
    fs.mkdirSync(saidaDir, { recursive: true });
    const args = ["-i", entrada, "-o", saida, "-c", config, "--minify"];
    try {
        // Tenta via Node + CLI JS direto (mais estável no Windows)
        if (!construirComNode(args)) {
            // Fallback: tenta npx
            execFileSync("npx", ["tailwindcss", ...args], { stdio: "inherit" });
        }
        const tamanho = fs.existsSync(saida) ? fs.statSync(saida).size : 0;
        console.log(`[compilar-tailwind] Gerado: ${path.relative(raiz, saida)} (${tamanho} bytes)`);
    }
    catch (e) {
        console.error("[compilar-tailwind] Falha ao compilar Tailwind via CLI.");
        throw e;
    }
}
compilar();
//# sourceMappingURL=compilar-tailwind.js.map