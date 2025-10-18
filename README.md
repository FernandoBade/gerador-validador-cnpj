<p align="center">
  <img src="img/gerador-validador-cnpj-2026-alfanumerico-og.png" alt="Preview do Gerador de CNPJ Alfanumérico 2026" width="900">
</p>

<div align="Center">

[![Versão](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico)
[![Licença ISC](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Demo Online](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://cnpj.bade.digital/)
[![Feito com TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Live Server](https://img.shields.io/badge/Live--Server-FF6B6B?logo=vercel&logoColor=white)](https://www.npmjs.com/package/live-server)
[![GitHub stars](https://img.shields.io/github/stars/FernandoBade/GeradorDeCNPJAlfanumerico.svg?style=social&label=Star)](https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico/stargazers)

</div>

<div align="center">

# Gerador e Validador de CNPJ (numérico e alfanumérico 2026)

</div>

Plataforma gratuita para **gerar e validar CNPJ** no formato **numérico** e no novo padrão **alfanumérico**, já divulgado pela Receita Federal para 2026.
Criada para ajudar **desenvolvedores, analistas e empresas** a se prepararem para a mudança, oferece uma forma prática de visualizar, validar e testar o novo identificador em sistemas, bancos de dados e integrações.

🔗 [Acesse a versão online aqui](https://cnpj.bade.digital/)

---

## 🎯 Objetivo

Antecipar a adaptação ao **CNPJ alfanumérico 2026**, fornecendo:

- Gerador: cria CNPJs válidos, com suporte a corpo alfanumérico ou apenas numérico.
- Validador: valida CNPJs (único e em massa), numéricos ou alfanuméricos.
- Máscara oficial (`##.###.###/####-##`) opcional na exibição.
- Histórico e ações de copiar (individual e em massa).
- Cálculo de DV via módulo 11 (compatível com o manual da RFB).

## 🚀 Como usar

1. Clone o repositório

   ```bash
   git clone https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico.git

   ```

2. Abra o arquivo `index.html` no navegador

3. A página inicial apresenta os atalhos para o Gerador e o Validador

4. Gerador de CNPJ
   - Alternar “Alfanumérico” para escolher entre corpo alfanumérico (padrão) ou apenas numérico
   - Alternar “Aplicar máscara” para exibir com a máscara oficial
   - Gerar +1 ou +10, copiar o atual ou copiar todos do histórico

5. Validador de CNPJ
   - Validar um único CNPJ (com ou sem máscara)
   - Alternar para “Modo em massa” e validar uma lista (até 100 itens)
   - Copiar rapidamente cada item do histórico

## 📌 Por que isso é útil?

- Facilita a migração de sistemas para o novo formato (2026)
- Permite validar bancos de dados, APIs e integrações
- Oferece exemplos reais para testes automatizados e simulações
- Ajuda times de tecnologia a se anteciparem à mudança da Receita Federal

## 🔎 Observabilidade

- O projeto possui observabilidade pensada para todo o conjunto (site, gerador e validador).
- O banner de cookies controla o consentimento e envia o evento `status_consentimento` (`aceito`/`recusado`) ao Google Tag Manager via `dataLayer`.
- A instrumentação pode ser expandida para mapear interações-chave (geração, validação, cópias, toggles) respeitando o consentimento do usuário.

## 🔗 Links

- [Versão online](https://cnpj.bade.digital/)
- [Receita Federal — CNPJ Alfanumérico (2026)](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico)
- [Manual de cálculo do DV do CNPJ](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf/view)
- [LinkedIn](https://linkedin.com/in/fernandobade)

---

## Ambiente de desenvolvimento

- Node.js (recomendado: 18+)
- TypeScript 5 (compilação para `dist/`)
- live-server (servidor local com auto-reload)
- concurrently (executa servidor e compilador em paralelo)
- ESLint + @typescript-eslint (qualidade e consistência de código)
- Prettier (formatação automática)
- nodemon (opcional; configurado para observar `.ts`)

### Requisitos

- Node.js e npm instalados: https://nodejs.org/

### Instalação

```bash
npm install
```

### Scripts npm já configurados

- `npm run desenvolvimento` — inicia o TypeScript em modo assistido e o servidor com auto‑reload.
- `npm run servidor` — inicia apenas o servidor local na porta 5173.
- `npm run compilar` — compila uma vez com o `tsc` (gera arquivos em `dist/`).
- `npm run compilar:assistido` — compila continuamente com `tsc -w`.
- `npm run lintar` — roda o ESLint nos arquivos `.ts`.
- `npm run lintar:correcao` — corrige problemas de lint automaticamente.
- `npm run formatar` — formata o código com Prettier.
- `npm run formatar:verificar` — verifica se o formato está em conformidade.

Observações:

- O servidor observa `index.html` e a pasta `dist/`. Ao salvar `.ts`, o `tsc` recompila e o navegador recarrega.
- O comportamento do `nodemon` também está configurado em `nodemon.json`, caso prefira usá‑lo isoladamente.

### Estrutura de build

- Código-fonte TypeScript em `src/`:
  - `src/gerador.ts` (lógica do gerador e UI)
  - `src/validador.ts` (lógica do validador e UI)
  - `src/algoritmo-cnpj.ts` (funções puras de DV, conversões, repetição)
  - `src/formatacao-cnpj.ts` (normalização e máscara)
  - `src/ui.ts` (avisos, clipboard, utilidades de UI)
  - `src/tema.ts` (controle de tema claro/escuro)
  - `src/cookies.ts` (banner de cookies e consentimento)
- Saída JavaScript gerada em `dist/` (conforme `tsconfig.json`).
- Páginas referenciam diretamente os módulos:
  - Gerador: `gerador-cnpj/index.html` → `../dist/src/gerador.js`
  - Validador: `validador-cnpj/index.html` → `../dist/src/validador.js`
  - Tema: todas as páginas incluem `../dist/src/tema.js`

### Qualidade de código

- ESLint configurado em `eslint.config.mjs` (com `@typescript-eslint`).
- Prettier configurado em `.prettierrc`.
- Arquivos ignorados: `.prettierignore` (inclui `dist/` e `node_modules/`).

### 🧾 Licença ISC

Este projeto usa a licença ISC, uma versão curtinha e descomplicada da MIT. Em resumo: pode usar, modificar, e distribuir à vontade — só lembra de manter os créditos quando for falar bem do projeto por aí. 💞


> #### _Forjado de uma mistura clássica: uma ideia aleatória, café demais e a ausência do PC pra jogar um dotinha_ 😎