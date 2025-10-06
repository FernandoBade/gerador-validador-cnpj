<p align="center">
  <img src="img/gerador-cnpj-2026-alfanumerico-x.png" alt="Preview do Gerador de CNPJ Alfanumérico 2026" width="900">
</p>

<div align="Center">

[![Versão](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico)
[![Licença ISC](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Demo Online](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://cnpj-2026.bade.digital/)
[![Feito com TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Live Server](https://img.shields.io/badge/Live--Server-FF6B6B?logo=vercel&logoColor=white)](https://www.npmjs.com/package/live-server)
[![Prettier](https://img.shields.io/badge/Prettier--formatted-ff69b4?logo=prettier&logoColor=white)](https://prettier.io/)
[![ESLint](https://img.shields.io/badge/Linted_with-ESLint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Build with TSC](https://img.shields.io/badge/build-TypeScript_compiler-007ACC)](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
[![Status](https://img.shields.io/badge/status-stable-success.svg)](https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico)
[![Contribua para o projeto](https://img.shields.io/badge/contribuições-bem--vindas-blueviolet.svg)](https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico/pulls)
[![GitHub stars](https://img.shields.io/github/stars/FernandoBade/GeradorDeCNPJAlfanumerico.svg?style=social&label=Star)](https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico/stargazers)


</div>
<div align="center">

# Gerador de CNPJ alfanumérico 2026

</div>

Ferramenta gratuita para **gerar conjuntos verdadeiros e simular o novo CNPJ alfanumérico 2026**, previsto pela Receita Federal.
Criada para ajudar **desenvolvedores, analistas e empresas** a se prepararem para a mudança, oferece uma forma prática de visualizar e testar o novo identificador em sistemas, bancos de dados e integrações.

🔗 [Acesse a versão online aqui](https://cnpj-2026.bade.digital/)

---

## 🎯 Objetivo

Antecipar a adaptação ao **CNPJ alfanumérico 2026**, fornecendo:

- Geração automática de CNPJs válidos
- Máscara oficial (`##.###.###/####-##`) aplicada
- Validação dos dígitos verificadores (módulo 11)
- Painel com histórico dos últimos CNPJs gerados
- Opção de copiar individualmente ou em massa

## 🚀 Como usar

1. Clone o repositório

   ```bash
   git clone https://github.com/FernandoBade/GeradorDeCNPJAlfanumerico.git

   ```

2. Abra o arquivo index.html no navegador

3. Um CNPJ alfanumérico já será gerado automaticamente

4. Use os botões para:
   - Gerar novos CNPJs
   - Copiar um único valor
   - Copiar todos em lista

## 📌 Por que isso é útil?

- Facilita a migração de sistemas para o novo formato
- Permite validar bancos de dados, APIs e integrações
- Garante exemplos reais para testes automatizados e simulações
- Ajuda times de tecnologia a se anteciparem à mudança da Receita Federal

## 🔗 Links importantes

- [Versão online v1.0](https://cnpj-2026.bade.digital/)
- [Receita Federal — CNPJ Alfanumérico (2026)](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico)
- [Manual de cálculo do DV do CNPJ](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf/view)
- [LinkedIn](https://linkedin.com/in/fernandobade)

> #### _Forjado de uma mistura clássica: uma ideia aleatória, café demais e a ausência do PC pra jogar._ 😎

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

- Código-fonte TypeScript em `app.ts` e `src/`.
- Saída JavaScript gerada em `dist/` (conforme `tsconfig.json`).
- `index.html` referencia os módulos já compilados em `dist/`.

### Qualidade de código

- ESLint configurado em `.eslintrc.json` (com `@typescript-eslint`).
- Prettier configurado em `.prettierrc`.
- Arquivos ignorados: `.eslintignore` e `.prettierignore` (incluem `dist/` e `node_modules/`).

### 🧾 Licença ISC

Este projeto usa a licença ISC, uma versão curtinha e descomplicada da MIT. Em resumo: pode usar, modificar, e distribuir à vontade — só lembra de manter os créditos quando for falar bem do projeto por aí. 💞