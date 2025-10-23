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

# 🧾 Gerador e validador de CNPJ - Consulta, geração e validação online

</div>

Um projeto completo e gratuito para **gerar, validar e consultar CNPJs**, atualizado para o **novo padrão alfanumérico de 2026**. Ideal para desenvolvedores, analistas e curiosos que precisam testar integrações, validar registros ou apenas entender como funciona a estrutura do CNPJ.


>📎Acesse: https://cnpj.bade.digital/


## ✨ Funcionalidades Principais

### 🔍 [Consulta de Dados de CNPJ](https://cnpj.bade.digital/ferramentas/consultar-dados-cnpj/)
- Realize **consultas online de CNPJs reais** com integração à **API [OpenCNPJ](https://opencnpj.org)**.
- Obtenha dados oficiais atualizados da **Receita Federal**.
- Consulte CNPJs em massa com **retorno rápido e interface amigável**.

### ✅ [Validador de CNPJ](https://cnpj.bade.digital/ferramentas/validador-cnpj/)
- Valide CNPJs **numéricos e alfanuméricos** conforme o novo padrão **2026**.
- Geração e verificação dos **dígitos verificadores (DV)** seguindo o manual oficial do **SERPRO**.
- Suporte à **validação em massa** e exibição de relatórios instantâneos.
- Histórico automático das **últimas 100 validações realizadas**.

### ⚙️ [Gerador de CNPJ](https://cnpj.bade.digital/ferramentas/gerador-cnpj/)
- Gere **CNPJs válidos para testes e integrações**, com opção de **máscara automática**.
- Produz até **100 CNPJs de uma vez**, prontos para copiar com um clique.
- Totalmente compatível com o novo formato **alfanumérico**.




## 🧠 Como Funciona
O projeto é escrito em **TypeScript** e utiliza **TailwindCSS** para o layout.
Cada módulo (gerador, validador e consulta) é independente, permitindo fácil manutenção e integração com outros sistemas.

Os dados de consulta são exibidos de forma clara e responsiva, e a validação é feita em tempo real, garantindo a precisão da estrutura matemática e do DV antes de consultar os dados oficiais.



## 🧩 Estrutura do Projeto


```

│ // build
│
├── dist/ # Saída JS/CSS minificada usada no site
│ └── src/cnpj/.js # Builds dos módulos (validador, gerador, consulta)
│
│ // projeto principal
│
├── src/
│ ├── cnpj/
│ │ ├── algoritmo-cnpj.ts
│ │ ├── formatacao-cnpj.ts
│ │ ├── gerador-cnpj.ts
│ │ ├── validador-cnpj.ts
│ │ └── consulta-dados-cnpj.ts
│ │
│ ├── interface/
│ │ ├── interface.ts
│ │ ├── menu.ts
│ │ ├── tema.ts
│ │ ├── transicao.ts
│ │ └── contador-historico.ts
│ │
│ ├── gerais/
│ │ ├── constantes.ts
│ │ ├── enums.ts
│ │ ├── mensageria.ts
│ │ ├── persistencia.ts
│ │ ├── cookies.ts
│ │ └── tipos.ts
│
│ // páginas
│
├── ferramentas/
│ ├── gerador-cnpj/
│ ├── validador-cnpj/
│ └── consultar-dados-cnpj/
│
│ // S.E.O.
│
├── sitemap.xml
├── robots.txt
└── [...]

```


## 📈 SEO e Otimização
Este projeto foi otimizado com:
- **Metadados completos (Open Graph, Twitter Cards e JSON-LD)**
- **URLs canônicas e estrutura otimizada para indexação**
- **Integração com sitemap e robots.txt** para melhor ranqueamento
- **Conteúdo semântico** voltado para buscas como:
  - “Consultar CNPJ online”
  - “Gerar CNPJ válido”
  - “Validar CNPJ alfanumérico 2026”


## 🌐 Links
- 🔗 [OpenCNPJ](https://opencnpj.org/)
- 📘 [Receita Federal - CNPJ Alfanumérico (2026)](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico)
- 📄 [Manual de cálculo do DV do CNPJ (SERPRO)](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf/view)
- 💼 [LinkedIn](https://linkedin.com/in/fernandobade)

## 📜 Licença
Distribuído sob a **Licença ISC**.
Sinta-se livre para usar, estudar e contribuir, só não esquece de falar bem do projeto por aí.


---
---
<br>

>_Forjado de uma mistura clássica: uma ideia aleatória, café demais e a ausência do PC pra jogar um dotinha._ 😎
