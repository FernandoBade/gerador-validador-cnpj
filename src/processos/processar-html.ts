
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'


/**
 * @summary Processa arquivos HTML, atualiza links de CSS/JS e remove blocos obsoletos.
 */

const __filename = fileURLToPath(import.meta.url)
/**
 * Define a raiz do projeto a partir do diretório atual de execução.
 * Isso garante compatibilidade tanto no src quanto no dist.
 */
const raiz = process.cwd()

/**
 * @summary Percorre o diretório recursivamente e retorna todos os arquivos HTML encontrados.
 */
function listarArquivos(diretorio: string, arquivos: string[] = []): string[] {
    for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
        if (['node_modules', 'dist'].includes(entrada.name) || entrada.name.startsWith('.git')) continue
        const caminhoCompleto = path.join(diretorio, entrada.name)
        if (entrada.isDirectory()) listarArquivos(caminhoCompleto, arquivos)
        else if (entrada.isFile() && entrada.name.endsWith('.html')) arquivos.push(caminhoCompleto)
    }
    return arquivos
}

/**
 * @summary Processa o conteúdo HTML aplicando minificações e atualizações.
 */
function processarHtml(conteudo: string): string {
    let html = conteudo

    const limparParametrosVersao = (url: string): string => {
        const hashIndex = url.indexOf('#')
        const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
        const semHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url
        const interrogacao = semHash.indexOf('?')
        if (interrogacao === -1) return url

        const base = semHash.slice(0, interrogacao)
        const parametros = semHash
            .slice(interrogacao + 1)
            .split('&')
            .filter((parametro) => parametro.trim() !== '' && !/^v=/i.test(parametro))

        const novaQuery = parametros.length > 0 ? `?${parametros.join('&')}` : ''
        return `${base}${novaQuery}${hash}`
    }

    // Remove Tailwind inline e substitui por CSS compilado
    html = html.replace(/<script>\s*tailwind\.config[\s\S]*?<\/script>/gim, '')
    html = html.replace(
        /<script[^>]*src="https:\/\/cdn\.tailwindcss\.com"[^>]*><\/script>/gim,
        '<link rel="stylesheet" href="/dist/assets/tailwind.min.css">'
    )

    // Atualiza controle-tema.css para a versão minificada
    html = html.replace(
        /href="(?:\.{1,2}\/)*src\/estilos\/controle-tema\.css"/g,
        'href="/dist/assets/controle-tema.min.css"'
    )

    // Adiciona defer e versionamento em scripts locais
    html = html.replace(/<script([^>]*?)src="([^"]*?)"([^>]*)><\/script>/gim, (m, pre, src, post) => {
        if (/^https?:\/\//i.test(src)) return m
        if (/googletagmanager\.com|googlesyndication\.com|cdn\.tailwindcss\.com/i.test(src)) return m
        if (!/\/dist\//i.test(src)) return m

        const temDefer = /\bdefer\b/i.test(pre) || /\bdefer\b/i.test(post)
        const srcLimpo = limparParametrosVersao(src)
        const preCorrigido = temDefer ? pre : `${pre} defer`
        const separador = /\s$/.test(preCorrigido) ? '' : ' '
        return `<script${preCorrigido}${separador}src="${srcLimpo}"${post}></script>`
    })

    // Remove parâmetros de versão remanescentes em links apontando para /dist
    html = html.replace(/<link([^>]*?)href="([^"]*?)"([^>]*)>/gim, (m, pre, href, post) => {
        if (/^https?:\/\//i.test(href)) return m
        if (!/\/dist\//i.test(href)) return m

        const hrefLimpo = limparParametrosVersao(href)
        const separador = /\s$/.test(pre) ? '' : ' '
        return `<link${pre}${separador}href="${hrefLimpo}"${post}>`
    })

    // Adiciona metatags para evitar cache agressivo
    if (!/http-equiv="Cache-Control"/i.test(html)) {
        html = html.replace(
            /<head(.*?)>/i,
            (m, attrs) =>
                `<head${attrs}>\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>\n    <meta http-equiv="Pragma" content="no-cache"/>\n    <meta http-equiv="Expires" content="0"/>`
        )
    }

    // Insere script para desregistrar Service Workers antigos
    if (!/id="sw-unregister"/i.test(html)) {
        const scriptSW = `
    <script id="sw-unregister">
      (function() {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations?.().then((regs) => {
            regs.forEach((r) => r.unregister().catch(() => {}))
          }).catch(() => {})
          navigator.serviceWorker.getRegistration?.().then((reg) => {
            if (reg?.active) reg.update().catch(() => {})
          })
        }
      })();
    </script>`
        html = html.replace(/<\/head>/i, `${scriptSW}\n</head>`)
    }

    return html
}

/**
 * @summary Executa o processamento de todos os arquivos HTML do projeto.
 */
function executar(): void {
    const arquivos = listarArquivos(raiz)
    let alterados = 0

    for (const arquivo of arquivos) {
        const antes = fs.readFileSync(arquivo, 'utf8')
        const depois = processarHtml(antes)
        if (antes !== depois) {
            fs.writeFileSync(arquivo, depois, 'utf8')
            alterados++
            console.log(`[processar-html] Atualizado: ${path.relative(raiz, arquivo)}`)
        }
    }

    console.log(`[processar-html] Arquivos alterados: ${alterados}`)
}

executar()
