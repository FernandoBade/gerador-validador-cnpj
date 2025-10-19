
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'


/**
 * @summary Processa arquivos HTML, atualiza links de CSS/JS, aplica controle de versão e remove blocos obsoletos.
 */

const __filename = fileURLToPath(import.meta.url)
/**
 * Define a raiz do projeto a partir do diretório atual de execução.
 * Isso garante compatibilidade tanto no src quanto no dist.
 */
const raiz = process.cwd()

/**
 * @summary Retorna a versão atual a partir do package.json ou timestamp.
 */
function obterVersao(): string {
    try {
        const pacote = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'))
        console.log(`Versão do pacote lida do package.json: ${versao}`)
        console.log(`Pacote: ${pacote}`)
        return pacote.version || String(Date.now())
    } catch {
        return String(Date.now())
    }
}

const versao = obterVersao()

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
 * @summary Adiciona parâmetro de versão em URLs locais.
 */
function adicionarVersao(url: string): string {
    if (/^https?:\/\//i.test(url)) return url
    return url.includes('?') ? `${url}&v=${versao}` : `${url}?v=${versao}`
}

/**
 * @summary Processa o conteúdo HTML aplicando minificações e atualizações.
 */
function processarHtml(conteudo: string): string {
    let html = conteudo

    // Remove Tailwind inline e substitui por CSS compilado
    html = html.replace(/<script>\s*tailwind\.config[\s\S]*?<\/script>/gim, '')
    html = html.replace(
        /<script[^>]*src="https:\/\/cdn\.tailwindcss\.com"[^>]*><\/script>/gim,
        `<link rel="stylesheet" href="/dist/assets/tailwind.min.css?v=${versao}">`
    )

    // Atualiza controle-tema.css para a versão minificada
    html = html.replace(
        /href="(?:\.{1,2}\/)*src\/estilos\/controle-tema\.css"/g,
        `href="/dist/assets/controle-tema.min.css?v=${versao}"`
    )

    // Adiciona defer e versionamento em scripts locais
    html = html.replace(/<script([^>]*?)src="([^"]*?)"([^>]*)><\/script>/gim, (m, pre, src, post) => {
        if (/^https?:\/\//i.test(src)) return m
        if (/googletagmanager\.com|googlesyndication\.com|cdn\.tailwindcss\.com/i.test(src)) return m
        if (!/\/dist\//i.test(src)) return m

        const temDefer = /\bdefer\b/i.test(pre) || /\bdefer\b/i.test(post)
        const novoSrc = adicionarVersao(src)
        const preCorrigido = temDefer ? pre : `${pre} defer`
        return `<script${preCorrigido} src="${novoSrc}"${post}></script>`
    })

    // Adiciona versionamento em links CSS da /dist
    html = html.replace(/<link([^>]*?)href="([^"]*?)"([^>]*)>/gim, (m, pre, href, post) => {
        if (/^https?:\/\//i.test(href)) return m
        if (!/\/dist\//i.test(href)) return m
        if (/([?&])v=/.test(href)) return m
        const novoHref = adicionarVersao(href)
        return `<link${pre}href="${novoHref}"${post}>`
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

    console.log(`[processar-html] Versão aplicada: ${versao}. Arquivos alterados: ${alterados}`)
}

executar()
