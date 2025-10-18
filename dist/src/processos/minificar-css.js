/**
 * @summary Minifica o arquivo controle-tema.css e gera a versão compacta em /dist/assets.
 */
import fs from 'fs';
import path from 'path';
const caminhoOrigem = path.resolve(process.cwd(), 'src', 'estilos', 'controle-tema.css');
const pastaDestino = path.resolve(process.cwd(), 'dist', 'assets');
const caminhoSaida = path.join(pastaDestino, 'controle-tema.min.css');
function minificarCSS(conteudo) {
    return conteudo
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
}
/**
 * @summary Executa o processo de minificação e grava o arquivo resultante.
 */
function executar() {
    if (!fs.existsSync(caminhoOrigem)) {
        console.error(`[minificar-css] Arquivo não encontrado: ${caminhoOrigem}`);
        process.exit(1);
    }
    const css = fs.readFileSync(caminhoOrigem, 'utf8');
    const cssMinificado = minificarCSS(css);
    fs.mkdirSync(pastaDestino, { recursive: true });
    fs.writeFileSync(caminhoSaida, cssMinificado, 'utf8');
    console.log(`[minificar-css] Gerado: ${path.relative(process.cwd(), caminhoSaida)} (${cssMinificado.length} bytes)`);
}
executar();
