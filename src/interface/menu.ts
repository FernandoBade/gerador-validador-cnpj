/* ============================
   Menu Superior Fixo (Reutilizável)
   - Links principais: Início, Gerador, Validador, Como funciona
   - Dropdown: Links Gerais (exemplo1, exemplo2, exemplo3)
   - Fixo no topo, cores consistentes em light/dark
============================ */

import { Console } from "console";

/**
 * @summary HTML do menu superior fixo, com links principais e submenu.
 */
export const htmlMenu = `
    <nav id="menu-superior" class="w-full fixed top-0 inset-x-0 z-50 bg-transparent backdrop-blur-lg shadow-lg">
        <div class="mx-8 px-4">
            <div class="h-14 flex items-center justify-between gap-4">

            <div class="flex items-center gap-4">
                <button id="menu-mobile-toggle" class="md:hidden inline-flex items-center justify-center p-2 rounded text-slate-700 dark:text-zinc-50 hover:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-600" aria-controls="menu-mobile" aria-expanded="false" aria-label="Abrir menu">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                </button>
                <ul class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-zinc-50">
                    <li><a href="/index.html" class="hover:underline hover:decoration-2 hover:underline-offset-8 hover:hover:text-violet-500 transition-all duration-100">Início</a></li>
                    <li><a href="/ferramentas/gerador-cnpj/" class="hover:underline hover:decoration-2 hover:underline-offset-8 hover:hover:text-violet-500 transition-all duration-100">Gerador</a></li>
                    <li><a href="/ferramentas/validador-cnpj/" class="hover:underline hover:decoration-2 hover:underline-offset-8 hover:hover:text-violet-500 transition-all duration-100">Validador</a></li>
                    <li><a href="/ferramentas/consultar-dados-cnpj/" class="hover:underline hover:decoration-2 hover:underline-offset-8 hover:hover:text-violet-500 transition-all duration-100">Consultar dados de CNPJ</a></li>
                    <li><a href="/artigos/como-a-validacao-de-cnpj-e-feita/" class="hover:underline hover:decoration-2 hover:underline-offset-8 hover:hover:text-violet-500 transition-all duration-100">Como funciona</a></li>
                </ul>
            </div>

            <div>
                    <label for="alternar-tema" class="inline-flex items-center gap-3  controle-tema backdrop-blur">
                        <input id="alternar-tema" type="checkbox" class="sr-only" />
                        <div class="relative flex items-center w-16 h-8 px-1 transition-colors duration-300 rounded-full shadow-inner cursor-pointer trilha dark:shadow-inner dark:shadow-slate-900 dark:bg-slate-800">
                            <span class="sol-indicador absolute ml-0.5 text-zinc-800 hover:scale-110 transition-all ease-in-out">
                                <svg class="w-6 h-6 text-orange-300 transition-all duration-300 ease-in-out dark:text-zinc-50 dark:hover:scale-110" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M13 3a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0V3ZM6.343 4.929A1 1 0 0 0 4.93 6.343l1.414 1.414a1 1 0 0 0 1.414-1.414L6.343 4.929Zm12.728 1.414a1 1 0 0 0-1.414-1.414l-1.414 1.414a1 1 0 0 0 1.414 1.414l1.414-1.414ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-9 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H3Zm16 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2ZM7.757 17.657a1 1 0 1 0-1.414-1.414l-1.414 1.414a1 1 0 1 0 1.414 1.414l1.414-1.414Zm9.9-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414ZM13 19a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0v-2Z" clip-rule="evenodd" />
                                </svg>
                            </span>
                            <span class="absolute transition-all ease-in-out lua-indicador right-2 text-violet-500 hover:scale-115 dark:hover:scale-110">
                                <svg class="w-6 h-6 transition-all duration-300 ease-in-out text-zinc-400 dark:text-sky-600 hover:scale-110" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M17 4c.5523 0 1 .44772 1 1v2h2c.5523 0 1 .44771 1 1 0 .55228-.4477 1-1 1h-2v2c0 .5523-.4477 1-1 1s-1-.4477-1-1V9h-2c-.5523 0-1-.44772-1-1s.4477-1 1-1h2V5c0-.55228.4477-1 1-1Z" clip-rule="evenodd" />
                                    <path d="M12.3224 4.68708c.2935-.31028.3575-.77266.1594-1.15098-.1981-.37832-.6146-.5891-1.0368-.52467-1.50847.2302-2.93175.83665-4.12869 1.76276-1.19717.92628-2.12732 2.1411-2.69465 3.52702-.56744 1.38618-.75115 2.89299-.53164 4.37079.2195 1.4776.83393 2.8711 1.77895 4.0436.9448 1.1722 2.18683 2.0826 3.60103 2.6449 1.414.5623 2.9539.7584 4.4683.57 1.5145-.1884 2.9549-.7551 4.1784-1.6475 1.2237-.8924 2.1892-2.0806 2.7972-3.4499.1723-.3879.0809-.8423-.2279-1.1335-.3089-.2911-.7679-.3556-1.145-.1608-.8631.4459-1.8291.6799-2.8118.6791h-.0018c-1.1598.0013-2.2925-.3234-3.2596-.931-.9667-.6074-1.7244-1.4697-2.1856-2.4779-.4611-1.00776-.6079-2.1209-.4243-3.20511.1835-1.08442.6905-2.09837 1.4645-2.91681Z" />
                                </svg>
                            </span>
                            <span class="botao"></span>
                        </div>
                    </label>
            </div>
            </div>

            <div id="menu-mobile" class="md:hidden hidden pb-3">
                <ul class="mt-2 flex flex-col items-start gap-1 text-sm font-medium dark:text-zinc-50">
                        <li><a href="/index.html" class="block w-full px-3 py-2 rounded hover:text-violet-500 transition-colors">Início</a></li>
                        <li><a href="/ferramentas/gerador-cnpj/" class="block w-full px-3 py-2 rounded hover:text-violet-500 transition-colors">Gerador</a></li>
                        <li><a href="/ferramentas/validador-cnpj/" class="block w-full px-3 py-2 rounded hover:text-violet-500 transition-colors">Validador</a></li>
                        <li><a href="/ferramentas/consultar-dados-cnpj/" class="block w-full px-3 py-2 rounded hover:text-violet-500 transition-colors">Consultar dados de CNPJ</a></li>
                        <li><a href="/artigos/como-a-validacao-de-cnpj-e-feita/" class="block w-full px-3 py-2 rounded hover:text-violet-500 transition-colors">Como funciona</a></li>
                </ul>
            </div>
        </div>
    </nav>
    `;

/**
 * @summary Insere o menu no topo da página e configura o dropdown.
 */
export function inicializarMenu(): void {
    if (document.getElementById("menu-superior") as HTMLElement) return;
    document.body.insertAdjacentHTML("afterbegin", htmlMenu);
    document.body.classList.add("transition-all", "duration-200", "ease-out");

    const nav = document.getElementById("menu-superior") as HTMLElement | null;

    if (nav) {

        const atualizarPadding = () => {
            const altura = Math.ceil(nav.getBoundingClientRect().height || 0);

            document.body.style.paddingTop = `calc(${altura}px + env(safe-area-inset-top))`;

        };

        atualizarPadding();

        let temporizador: number | undefined;

        const onResize = () => {
            if (temporizador) window.clearTimeout(temporizador);
            temporizador = window.setTimeout(() => atualizarPadding(), 80);
        };

        window.addEventListener("resize", onResize);

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => atualizarPadding());
            ro.observe(nav);

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
    if (!(nav instanceof HTMLElement)) return;

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
                link.classList.add(
                    "text-violet-500",
                    "dark:text-violet-500",
                    "font-semibold",
                    "underline",
                    "underline-offset-8",
                    "decoration-2",
                    "hover:text-violet-600",
                    "dark:hover:text-violet-600",
                    "transition-all",
                    "duration-300"
                );
                link.setAttribute("aria-current", "page");
            }
        } catch {
            console.info("Erro no componente de menu: link inválido encontrado:", link);
        }
    });
}

/**
 * @summary Inicializa automaticamente o menu quando o DOM estiver carregado.
 */
inicializarMenu();

document.addEventListener("DOMContentLoaded", () => {
    inicializarMenu();
});

export { };
