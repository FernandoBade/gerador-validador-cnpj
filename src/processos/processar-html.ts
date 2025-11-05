import fs from "fs";
import path from "path";

/**
 * Define a raiz do projeto a partir do diretório atual de execução.
 * Isso garante compatibilidade tanto no src quanto no dist.
 */
const raiz = process.cwd();

/**
 * @summary Percorre o diretório recursivamente e retorna todos os arquivos HTML encontrados.
 */
function listarArquivos(diretorio: string, arquivos: string[] = []): string[] {
    for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
        if (["node_modules", "dist"].includes(entrada.name) || entrada.name.startsWith(".git"))
            continue;
        const caminhoCompleto = path.join(diretorio, entrada.name);
        if (entrada.isDirectory()) listarArquivos(caminhoCompleto, arquivos);
        else if (entrada.isFile() && entrada.name.endsWith(".html")) arquivos.push(caminhoCompleto);
    }
    return arquivos;
}

/**
 * @summary Processa o conteúdo HTML aplicando minificações e atualizações.
 */
function processarHtml(conteudo: string): string {
    let html = conteudo;

    // Blocos estáticos do Google Tag Manager para injeção em build
    const GTM_ID = "GTM-5LSGCFMM";
    const GTM_SCRIPT_BLOCO = `    <!-- Google Tag Manager -->\n    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?"&l="+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>\n    <!-- End Google Tag Manager -->`;
    const GTM_NOSCRIPT_BLOCO = `    <!-- Google Tag Manager (noscript) -->\n    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n    <!-- End Google Tag Manager (noscript) -->`;

    // Injeta o carregador do injetor de GTM em todas as páginas, se ausente
    // O arquivo /dist/src/gerais/uteis.js executa a injeção dos blocos do GTM
    // no topo do <head> e do <body> em tempo de execução, de forma idempotente.
    if (!/src\s*=\s*["'][^"']*\/dist\/src\/gerais\/uteis\.js["']/i.test(html)) {
        const tagUteis = '    <script type="module" src="/dist/src/gerais/uteis.js" defer></script>';
        html = html.replace(/<head(.*?)>/i, (m, attrs) => `<head${attrs}>\n${tagUteis}`);
    }

    // Garante GTM logo após <head> e no início do <body>, se ausentes
    {
        const temGtmScript = /googletagmanager\.com\/gtm\.js/i.test(html) && new RegExp(GTM_ID, 'i').test(html);
        if (!temGtmScript) {
            html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${GTM_SCRIPT_BLOCO}`);
        }

        const temGtmNoscript = /googletagmanager\.com\/ns\.html\?id=/i.test(html) && new RegExp(GTM_ID, 'i').test(html);
        if (!temGtmNoscript) {
            html = html.replace(/<body(\s[^>]*)?>/i, (m) => `${m}\n${GTM_NOSCRIPT_BLOCO}`);
        }
    }

    const limparParametrosVersao = (url: string): string => {
        const hashIndex = url.indexOf("#");
        const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
        const semHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
        const interrogacao = semHash.indexOf("?");
        if (interrogacao === -1) return url;

        const base = semHash.slice(0, interrogacao);
        const parametros = semHash
            .slice(interrogacao + 1)
            .split("&")
            .filter((parametro) => parametro.trim() !== "" && !/^v=/i.test(parametro));

        const novaQuery = parametros.length > 0 ? `?${parametros.join("&")}` : "";
        return `${base}${novaQuery}${hash}`;
    };

    html = html.replace(/<script>\s*tailwind\.config[\s\S]*?<\/script>/gim, "");
    html = html.replace(
        /<script[^>]*src="https:\/\/cdn\.tailwindcss\.com"[^>]*><\/script>/gim,
        '<link rel="stylesheet" href="/dist/assets/tailwind.min.css">',
    );

    html = html.replace(
        /href="(?:\.{1,2}\/)*src\/estilos\/controle-tema\.css"/g,
        'href="/dist/assets/controle-tema.min.css"',
    );

    html = html.replace(/<script([^>]*?)src="([^"]*?)"([^>]*)><\/script>/gim, (m, pre, src, post) => {
        if (/^https?:\/\//i.test(src)) return m;
        if (/googletagmanager\.com|googlesyndication\.com|cdn\.tailwindcss\.com/i.test(src)) return m;
        if (!/\/dist\//i.test(src)) return m;

        const temDefer = /\bdefer\b/i.test(pre) || /\bdefer\b/i.test(post);
        const srcLimpo = limparParametrosVersao(src);
        const preCorrigido = temDefer ? pre : `${pre} defer`;
        const separador = /\s$/.test(preCorrigido) ? "" : " ";
        return `<script${preCorrigido}${separador}src="${srcLimpo}"${post}></script>`;
    });

    html = html.replace(/<link([^>]*?)href="([^"]*?)"([^>]*)>/gim, (m, pre, href, post) => {
        if (/^https?:\/\//i.test(href)) return m;
        if (!/\/dist\//i.test(href)) return m;

        const hrefLimpo = limparParametrosVersao(href);
        const separador = /\s$/.test(pre) ? "" : " ";
        return `<link${pre}${separador}href="${hrefLimpo}"${post}>`;
    });

    if (!/http-equiv="Cache-Control"/i.test(html)) {
        html = html.replace(
            /<head(.*?)>/i,
            (m, attrs) =>
                `<head${attrs}>\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>\n    <meta http-equiv="Pragma" content="no-cache"/>\n    <meta http-equiv="Expires" content="0"/>`,
        );
    }

    return html;
}

/**
 * @summary Executa o processamento de todos os arquivos HTML do projeto.
 */
function executar(): void {
    const arquivos = listarArquivos(raiz);
    let alterados = 0;

    for (const arquivo of arquivos) {
        const antes = fs.readFileSync(arquivo, "utf8");
        const depois = processarHtml(antes);
        if (antes !== depois) {
            fs.writeFileSync(arquivo, depois, "utf8");
            alterados++;
            console.log(`[processar-html] Atualizado: ${path.relative(raiz, arquivo)}`);
        }
    }

    console.log(`[processar-html] Arquivos alterados: ${alterados}`);
}

executar();
