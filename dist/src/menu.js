/* ============================
   Menu Superior Fixo (Reutilizável)
   - Links principais: Início, Gerador, Validador, Artigos
   - Dropdown: Links Gerais (exemplo1, exemplo2, exemplo3)
   - Fixo no topo, cores consistentes em light/dark
============================ */
/**
 * @summary HTML do menu superior fixo, com links principais e submenu.
 */
export const htmlMenu = `
<nav id="menu-superior" class="fixed top-0 inset-x-0 z-50 bg-slate-300/10 backdrop-blur-lg shadow-2xl">
  <div class="mx-auto max-w-6xl px-4">
    <div class="h-14 flex items-center justify-between">
      <a href="/index.html" class="text-slate-700 dark:text-zinc-50 font-semibold tracking-wide">CNPJ 2026</a>
      <ul class="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-zinc-50">
        <li><a href="/index.html" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Início</a></li>
        <li><a href="/paginas/gerador-cnpj.html" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Gerador</a></li>
        <li><a href="/paginas/validador-cnpj.html" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Validador</a></li>
        <li><a href="/paginas/como-a-validacao-de-cnpj-e-feita.html" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Artigos</a></li>
        <li class="relative">
          <button id="menu-links-gerais" class="inline-flex items-center gap-1 hover:text-slate-400 dark:hover:text-slate-400 transition-colors" aria-haspopup="true" aria-expanded="false">
            Links Gerais
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/></svg>
          </button>
          <ul id="submenu-links-gerais" class="absolute right-0 mt-2 w-48 bg-zinc-50 dark:bg-slate-800 rounded-lg shadow-lg py-2 text-sm text-slate-600 dark:text-zinc-50 hidden">
            <li><a href="#" class="block px-3 py-1.5 hover:text-violet-600 dark:hover:text-slate-400 transition-colors">Exemplo 1</a></li>
            <li><a href="#" class="block px-3 py-1.5 hover:text-violet-600 dark:hover:text-slate-400 transition-colors">Exemplo 2</a></li>
            <li><a href="#" class="block px-3 py-1.5 hover:text-violet-600 dark:hover:text-slate-400 transition-colors">Exemplo 3</a></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>`;
/**
 * @summary Insere o menu no topo da página e configura o dropdown.
 */
export function inicializarMenu() {
    if (document.getElementById("menu-superior"))
        return;
    document.body.insertAdjacentHTML("afterbegin", htmlMenu);
    document.body.classList.add("transition-all", "duration-150", "ease-out");
    const nav = document.getElementById("menu-superior");
    if (nav) {
        const atualizarPadding = () => {
            const altura = Math.ceil(nav.getBoundingClientRect().height || 0);
            document.body.style.paddingTop = `calc(${altura}px + env(safe-area-inset-top))`;
        };
        atualizarPadding();
        let timer;
        const onResize = () => {
            if (timer)
                window.clearTimeout(timer);
            timer = window.setTimeout(() => atualizarPadding(), 80);
        };
        window.addEventListener("resize", onResize);
        if ("ResizeObserver" in window) {
            const ro = new window.ResizeObserver(() => atualizarPadding());
            ro.observe(nav);
            nav.__resizeObserver = ro;
        }
        else {
            const mo = new MutationObserver(() => atualizarPadding());
            mo.observe(nav, { childList: true, subtree: true, characterData: true, attributes: true });
            nav.__mutationObserver = mo;
        }
        window.addEventListener("load", () => atualizarPadding());
    }
    const botao = document.getElementById("menu-links-gerais");
    const submenu = document.getElementById("submenu-links-gerais");
    if (!botao || !submenu)
        return;
    const fechar = () => {
        submenu.classList.add("hidden");
        botao.setAttribute("aria-expanded", "false");
    };
    const alternar = () => {
        const aberto = submenu.classList.contains("hidden");
        submenu.classList.toggle("hidden", !aberto);
        botao.setAttribute("aria-expanded", aberto ? "true" : "false");
    };
    botao.addEventListener("click", (e) => {
        e.preventDefault();
        alternar();
    });
    document.addEventListener("click", (e) => {
        if (!submenu || !botao)
            return;
        const alvo = e.target;
        if (!submenu.contains(alvo) && !botao.contains(alvo))
            fechar();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape")
            fechar();
    });
    destacarLinkAtivo();
}
/**
 * @summary Destaca o item de menu correspondente à página atual.
 */
function destacarLinkAtivo() {
    const nav = document.getElementById("menu-superior");
    if (!nav)
        return;
    const normalizar = (p) => {
        if (!p || p === "/")
            return "/index.html";
        return p;
    };
    const atual = normalizar(window.location.pathname);
    const links = nav.querySelectorAll("a[href]");
    links.forEach((link) => {
        try {
            const href = link.getAttribute("href") ?? "";
            const alvo = normalizar(new URL(href, window.location.origin).pathname);
            const corresponde = atual === alvo || (alvo === "/index.html" && (atual === "/" || atual === "/index.html"));
            if (corresponde) {
                link.classList.add("text-violet-500", "dark:text-violet-400", "font-semibold", "underline", "underline-offset-8", "decoration-2", "hover:text-violet-700", "dark:hover:text-violet-600", "dark:hover:text-violet-500", "transition-all", "duration-300");
                link.setAttribute("aria-current", "page");
            }
        }
        catch {
            /* ignora URLs inválidas */
        }
    });
}
/**
 * @summary Inicializa automaticamente o menu quando o DOM estiver carregado.
 */
document.addEventListener("DOMContentLoaded", () => {
    inicializarMenu();
});
