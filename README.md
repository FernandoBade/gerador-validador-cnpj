<p align="center">
  <img src="img/gerador-validador-cnpj-2026-alfanumerico-og.png" alt="Gerador e Validador de CNPJ 2026 (numérico e alfanumérico)" width="900">
</p>

<div align="center">

[![Versão](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/FernandoBade/gerador-validador-cnpj)
[![Licença ISC](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Demo Online](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://cnpj.bade.digital/)
[![Feito com TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Live Server](https://img.shields.io/badge/Live--Server-FF6B6B?logo=vercel&logoColor=white)](https://www.npmjs.com/package/live-server)
[![GitHub stars](https://img.shields.io/github/stars/FernandoBade/gerador-validador-cnpj.svg?style=social&label=Star)](https://github.com/FernandoBade/gerador-validador-cnpj/stargazers)

</div>

<div align="center">

# Gerador e Validador de CNPJ (numérico e alfanumérico 2026)

</div>

Ferramenta gratuita para gerar, validar e consultar dados de CNPJ no formato numérico e no novo padrão alfanumérico (2026). Ideal para desenvolvedores, analistas e empresas adequarem sistemas, bancos de dados e integrações ao novo CNPJ da Receita Federal, com validação via módulo 11 e consulta pública de dados cadastrais.

- Acesse online: https://cnpj.bade.digital/

---

## Objetivo

Antecipar a adaptação ao CNPJ alfanumérico 2026, oferecendo:

- Gerador: cria CNPJs válidos (numéricos e alfanuméricos) com ou sem máscara oficial (`##.###.###/####-##`).
- Validador: valida um único CNPJ ou listas (em massa) com histórico e cópia rápida.
- Consulta de dados: integra a API pública do OpenCNPJ para retornar dados cadastrais.

## Novas Páginas

- Página inicial: `index.html` (atalhos e visão geral).
- Ferramenta – Gerador de CNPJ: `ferramentas/gerador-cnpj/index.html`.
- Ferramenta – Validador de CNPJ: `ferramentas/validador-cnpj/index.html`.
- Ferramenta – Consultar Dados CNPJ: `ferramentas/consultar-dados-cnpj/index.html` (com OpenCNPJ).
- Artigo – Como a validação de CNPJ é feita: `artigos/como-a-validacao-de-cnpj-e-feita/index.html`.

## Acesso Direto às Ferramentas

- Gerador de CNPJ: https://cnpj.bade.digital/ferramentas/gerador-cnpj/
- Validador de CNPJ: https://cnpj.bade.digital/ferramentas/validador-cnpj/
- Consultar Dados de CNPJ (OpenCNPJ): https://cnpj.bade.digital/ferramentas/consultar-dados-cnpj/

## Árvore do Projeto

```
.
├─ index.html
├─ ferramentas/
│  ├─ gerador-cnpj/
│  │  └─ index.html
│  ├─ validador-cnpj/
│  │  └─ index.html
│  └─ consultar-dados-cnpj/
│     └─ index.html
├─ artigos/
│  └─ como-a-validacao-de-cnpj-e-feita/
│     └─ index.html
│  └─ [...]
├─ src/
│  ├─ cnpj/
│  │  ├─ algoritmo-cnpj.ts
│  │  ├─ formatacao-cnpj.ts
│  │  ├─ gerador-cnpj.ts
│  │  ├─ validador-cnpj.ts
│  │  └─ consulta-dados-cnpj.ts
│  ├─ gerais/
│  ├─ interface/
│  ├─ estilos/
│  └─ processos/
├─ dist/
├─ img/
├─ sitemap.xml
├─ robots.txt
├─ site.webmanifest
├─ package.json
└─ tsconfig.json
```

## Integração com OpenCNPJ (Consulta de Dados)

A página `ferramentas/consultar-dados-cnpj/index.html` integra a API pública do OpenCNPJ para consulta de dados cadastrais de empresas. A implementação utiliza `src/cnpj/consulta-dados-cnpj.ts` e o endpoint base `https://api.opencnpj.org/{cnpj}`.

- Site do projeto: https://opencnpj.org/
- Repositório: https://github.com/Hitmasu/opencnpj

Como funciona:

- Normaliza o CNPJ (apenas dígitos) e consulta `GET https://api.opencnpj.org/{cnpj}` com `Accept: application/json`.
- Retornos tratados: `200` (dados encontrados), `404` (CNPJ não encontrado), `429` (limite de consultas), demais erros de rede/serviço.
- Campos exibidos: razão social, nome fantasia, situação cadastral e data, natureza jurídica, porte, endereço completo, contatos, CNAE principal/secundários e sócios (quando disponíveis).
- Uso é público e sujeito a limitações do OpenCNPJ; não requer chave para consultas básicas.

Observação: respostas são normalizadas antes de exibição para manter a consistência da UI e do histórico de consultas.

## Como Usar

1) Clone o repositório

```bash
git clone https://github.com/FernandoBade/gerador-validador-cnpj.git
cd gerador-validador-cnpj
```

2) Instale dependências e rode em desenvolvimento

```bash
npm install
npm run desenvolvimento
```

3) Alternativamente, abra `index.html` diretamente no navegador para uso local básico.

## Ambiente de Desenvolvimento

- Node.js 18+ e npm: https://nodejs.org/
- TypeScript 5, ESLint, Prettier, TailwindCSS (build leve via scripts).
- Scripts principais:
  - `npm run servidor` (live server na porta 5173).
  - `npm run compilar` e `npm run compilar:assistido` (TS → `dist/`).
  - `npm run desenvolvimento` (compilação assistida + servidor).
  - `npm run lintar`/`lintar:correcao` e `npm run formatar`/`formatar:verificar`.

## Links Úteis

- [Versão online](https://cnpj.bade.digital/)
- [Receita Federal – CNPJ Alfanumérico (2026)](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico)
- [Manual de cálculo do DV do CNPJ](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf/view)
- [OpenCNPJ](https://opencnpj.org/) | [Código‑fonte](https://github.com/Hitmasu/opencnpj)

## Licença

Licença ISC. Pode usar, modificar e distribuir livremente, mantendo os créditos ao projeto.

> _Forjado de uma mistura clássica: uma ideia aleatória, café demais e a ausência do PC pra jogar um dotinha._

