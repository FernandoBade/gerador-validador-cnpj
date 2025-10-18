#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    return pkg.version || String(Date.now());
  } catch {
    return String(Date.now());
  }
})();

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function addVersionParam(url) {
  if (/^https?:\/\//i.test(url)) return url; // externo
  if (url.includes('?')) return `${url}&v=${version}`;
  return `${url}?v=${version}`;
}

function processHtml(html) {
  let output = html;

  // 0) Remover Tailwind CDN e config inline e inserir link para CSS compilado
  // Remove bloco inline com tailwind.config se existir
  output = output.replace(/<script>\s*tailwind\.config[\s\S]*?<\/script>/gim, '');
  // Substitui o script CDN pelo link local compilado
  output = output.replace(
    /<script[^>]*src=\"https:\/\/cdn\.tailwindcss\.com\"[^>]*><\/script>/gim,
    `<link rel="stylesheet" href="/dist/assets/tailwind.min.css?v=${version}">`
  );

  // 1) Trocar controle-tema.css pelo minificado em /dist
  output = output.replace(
    /href=\"(?:\.{1,2}\/)*src\/estilos\/controle-tema\.css\"/g,
    `href="/dist/assets/controle-tema.min.css?v=${version}"`
  );

  // 2) Para scripts locais em /dist, garantir defer e adicionar versionamento
  output = output.replace(/<script([^>]*?)src=\"([^\"]*?)\"([^>]*)><\/script>/gim, (m, pre, src, post) => {
    // ignorar externos ou GTM/Ads/Tailwind CDN
    if (/^https?:\/\//i.test(src)) return m;
    if (/googletagmanager\.com|googlesyndication\.com|cdn\.tailwindcss\.com/i.test(src)) return m;
    if (!/\/(?:dist)\//i.test(src)) return m;

    const hasDefer = /\bdefer\b/i.test(pre) || /\bdefer\b/i.test(post);
    const newSrc = addVersionParam(src);
    const preFixed = hasDefer ? pre : `${pre} defer`;
    return `<script${preFixed} src="${newSrc}"${post}></script>`;
  });

  // 3) Para links CSS já apontando a /dist, adicionar versionamento se não tiver
  output = output.replace(/<link([^>]*?)href=\"([^\"]*?)\"([^>]*)>/gim, (m, pre, href, post) => {
    if (/^https?:\/\//i.test(href)) return m;
    if (!/\/(?:dist)\//i.test(href)) return m;
    if (/([?&])v=/.test(href)) return m;
    const newHref = addVersionParam(href);
    return `<link${pre}href="${newHref}"${post}>`;
  });

  // 4) Injetar meta para evitar cache agressivo do HTML (ideal é configurar no servidor)
  if (!/http-equiv=\"Cache-Control\"/i.test(output)) {
    output = output.replace(
      /<head(.*?)>/i,
      (m, attrs) => `<head${attrs}>\n    <meta http-equiv=\"Cache-Control\" content=\"no-cache, no-store, must-revalidate\"/>\n    <meta http-equiv=\"Pragma\" content=\"no-cache\"/>\n    <meta http-equiv=\"Expires\" content=\"0\"/>`
    );
  }

  // 5) Desregistrar qualquer Service Worker antigo que possa estar ativo no domínio
  if (!/id=\"sw-unregister\"/i.test(output)) {
    const swScript = `\n    <script id=\"sw-unregister\">\n      (function(){\n        if ('serviceWorker' in navigator) {\n          // Tenta desregistrar todos os SWs já instalados\n          navigator.serviceWorker.getRegistrations().then(function(regs){\n            regs.forEach(function(r){ r.unregister().catch(function(){/* noop */}); });\n          }).catch(function(){/* noop */});\n          // Se ainda houver um SW controlando, força atualização
          navigator.serviceWorker.getRegistration && navigator.serviceWorker.getRegistration().then(function(reg){\n            if (reg && reg.active) {\n              reg.update().catch(function(){/* noop */});\n            }\n          });\n        }\n      })();\n    </script>`;
    // Insere antes do fechamento de </head> para rodar cedo
    output = output.replace(/<\/head>/i, swScript + '\n</head>');
  }

  return output;
}

function run() {
  const files = walk(root);
  let changed = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const after = processHtml(before);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      changed++;
      console.log(`[postprocess-html] Atualizado: ${path.relative(root, file)}`);
    }
  }
  console.log(`[postprocess-html] Versão aplicada: ${version}. Arquivos alterados: ${changed}`);
}

run();
