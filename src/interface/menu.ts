/* ============================
   Menu Superior Fixo (Reutilizável)
   - Links principais: Início, Gerador, Validador, Como funciona
   - Dropdown: Links Gerais (exemplo1, exemplo2, exemplo3)
   - Fixo no topo, cores consistentes em light/dark
============================ */

/**
 * @summary HTML do menu superior fixo, com links principais e submenu.
 */
export const htmlMenu = `
<nav id="menu-superior" class="fixed top-0 inset-x-0 z-50 bg-transparent backdrop-blur-lg shadow-lg">
  <div class="mx-auto max-w-6xl px-4">
    <div class="h-14 flex items-center justify-between">
      <a href="/index.html" class="text-slate-700 dark:text-zinc-50 font-semibold tracking-wide">CNPJ 2026</a>
      <button id="menu-mobile-toggle" class="md:hidden inline-flex items-center justify-center p-2 rounded text-slate-700 dark:text-zinc-50 hover:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-600" aria-controls="menu-mobile" aria-expanded="false" aria-label="Abrir menu">
        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <ul class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-zinc-50">
        <li><a href="/index.html" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Início</a></li>
        <li><a href="/gerador-cnpj/" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Gerador</a></li>
        <li><a href="/validador-cnpj/" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Validador</a></li>
        <li><a href="/validador-cnpj-api/" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Validador via API</a></li>
        <li><a href="/artigos/como-a-validacao-de-cnpj-e-feita/" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Como funciona</a></li>
      </ul>
    </div>
    <div id="menu-mobile" class="md:hidden hidden pb-3">
      <ul class="mt-2 grid gap-1 text-sm font-medium text-slate-700 dark:text-zinc-50">
        <li><a href="/index.html" class="block px-3 py-2 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors">Início</a></li>
        <li><a href="/gerador-cnpj/" class="block px-3 py-2 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors">Gerador</a></li>
        <li><a href="/validador-cnpj/" class="block px-3 py-2 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors">Validador</a></li>
        <li><a href="/validador-cnpj-api/" class="hover:text-slate-400 dark:hover:text-slate-400 transition-colors">Validador via API</a></li>
        <li><a href="/artigos/como-a-validacao-de-cnpj-e-feita/" class="block px-3 py-2 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors">Como funciona</a></li>
      </ul>
    </div>
  </div>
</nav>`;

/**
 * @summary Insere o menu no topo da página e configura o dropdown.
 */
export function inicializarMenu(): void {
    if (document.getElementById("menu-superior")) return;
    document.body.insertAdjacentHTML("afterbegin", htmlMenu);
    document.body.classList.add("transition-all", "duration-150", "ease-out");

    const nav = document.getElementById("menu-superior") as HTMLElement | null;

    if (nav) {

        const atualizarPadding = () => {
            const altura = Math.ceil(nav.getBoundingClientRect().height || 0);

            document.body.style.paddingTop = `calc(${altura}px + env(safe-area-inset-top))`;
        };

        atualizarPadding();

        let timer: number | undefined;
        const onResize = () => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => atualizarPadding(), 80);
        };
        window.addEventListener("resize", onResize);

        if ("ResizeObserver" in window) {
            const ro = new (window as any).ResizeObserver(() => atualizarPadding());
            ro.observe(nav);

            (nav as any).__resizeObserver = ro;
        } else {

            const mo = new MutationObserver(() => atualizarPadding());
            mo.observe(nav, { childList: true, subtree: true, characterData: true, attributes: true });
            (nav as any).__mutationObserver = mo;
        }

        window.addEventListener("load", () => atualizarPadding());
    }

    // Desktop submenu
    const botao = document.getElementById("menu-links-gerais");
    const submenu = document.getElementById("submenu-links-gerais");
    if (botao && submenu) {
        const fechar = () => { submenu.classList.add("hidden"); botao.setAttribute("aria-expanded", "false"); };
        const alternar = () => { const aberto = submenu.classList.contains("hidden"); submenu.classList.toggle("hidden", !aberto); botao.setAttribute("aria-expanded", aberto ? "true" : "false"); };
        botao.addEventListener("click", (e) => { e.preventDefault(); alternar(); });
        document.addEventListener("click", (e) => { const alvo = e.target as Node; if (!submenu.contains(alvo) && !botao.contains(alvo)) fechar(); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });
    }

    // Mobile geral
    const burger = document.getElementById("menu-mobile-toggle");
    const painel = document.getElementById("menu-mobile");
    if (burger && painel) {
        const alternarMobile = () => { const aberto = painel.classList.contains("hidden"); painel.classList.toggle("hidden", !aberto); burger.setAttribute("aria-expanded", aberto ? "true" : "false"); };
        burger.addEventListener("click", (e) => { e.preventDefault(); alternarMobile(); });
        painel.addEventListener("click", (e) => { const alvo = e.target as HTMLElement; if (alvo.tagName.toLowerCase() === "a") { painel.classList.add("hidden"); burger.setAttribute("aria-expanded", "false"); } });
        window.addEventListener("resize", () => { if (window.matchMedia("(min-width: 768px)").matches) { painel.classList.add("hidden"); burger.setAttribute("aria-expanded", "false"); } });
        const botaoMob = document.getElementById("menu-links-gerais-mobile");
        const submenuMob = document.getElementById("submenu-links-gerais-mobile");
        if (botaoMob && submenuMob) {
            const alternarMob = () => { const aberto = submenuMob.classList.contains("hidden"); submenuMob.classList.toggle("hidden", !aberto); botaoMob.setAttribute("aria-expanded", aberto ? "true" : "false"); };
            botaoMob.addEventListener("click", (e) => { e.preventDefault(); alternarMob(); });
        }
    }

    destacarLinkAtivo();
}


/**
 * @summary Destaca o item de menu correspondente à página atual.
 */
function destacarLinkAtivo(): void {
    const nav = document.getElementById("menu-superior");
    if (!nav) return;

    const normalizar = (p: string): string => {
        if (!p || p === "/") return "/index.html";
        return p;
    };

    const atual = normalizar(window.location.pathname);

    const links = nav.querySelectorAll<HTMLAnchorElement>("a[href]");
    links.forEach((link) => {
        try {
            const href = link.getAttribute("href") ?? "";
            const alvo = normalizar(new URL(href, window.location.origin).pathname);
            const corresponde = atual === alvo || (alvo === "/index.html" && (atual === "/" || atual === "/index.html"));
            if (corresponde) {
                link.classList.add("text-violet-500", "dark:text-violet-400", "font-semibold", "underline", "underline-offset-8", "decoration-2", "hover:text-violet-700", "dark:hover:text-violet-600", "dark:hover:text-violet-500", "transition-all", "duration-300");
                link.setAttribute("aria-current", "page");
            }
        } catch {
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

export { };
