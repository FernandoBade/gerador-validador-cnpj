#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src', 'estilos', 'controle-tema.css');
const outDir = path.join(__dirname, '..', 'dist', 'assets');
const outPath = path.join(outDir, 'controle-tema.min.css');

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function run() {
  if (!fs.existsSync(srcPath)) {
    console.error(`[minify-css] Arquivo não encontrado: ${srcPath}`);
    process.exit(1);
  }
  const css = fs.readFileSync(srcPath, 'utf8');
  const min = minifyCSS(css);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, min, 'utf8');
  console.log(`[minify-css] Gerado: ${path.relative(process.cwd(), outPath)} (${min.length} bytes)`);
}

run();

